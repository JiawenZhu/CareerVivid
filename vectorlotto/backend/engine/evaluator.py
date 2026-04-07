"""
evaluator.py – Mega Millions Draw Evaluator (v4.0)
===================================================
Changes vs v3.x:
  - After evaluating each draw, calls mab_engine.update_after_draw()
    to update Thompson Sampling α/β, EMA ROI, Kelly payout multiplier,
    and virtual bankroll in mab_state.json.
"""

import json
import os

import pandas as pd

from mab_engine import (
    load_mab_state,
    save_mab_state,
    update_after_draw,
    print_mab_report,
)

PREDICTIONS_FILE = "predictions.json"

# Official Mega Millions payout table: (wb_matches, mb_match) -> prize $
PAYOUTS: dict[tuple, int] = {
    (5, True):  20_000_000,   # Jackpot (minimum estimate)
    (5, False): 1_000_000,
    (4, True):  10_000,
    (4, False): 500,
    (3, True):  200,
    (3, False): 10,
    (2, True):  10,
    (2, False): 0,
    (1, True):  4,
    (1, False): 0,
    (0, True):  2,
    (0, False): 0,
}

TICKET_COST = 2  # dollars


def load_actual_results(csv_path: str = "megamillions_history.csv") -> dict:
    """Returns {date_str: {wb: set, mb: int}} for all draws in CSV."""
    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        print(f"Error: {csv_path} not found. Run scraper.py first.")
        return {}

    results = {}
    for _, row in df.iterrows():
        try:
            date_str = pd.to_datetime(
                row["DrawDate"], format="mixed", dayfirst=False
            ).strftime("%Y-%m-%d")
            wbs = set()
            for col in ["WB1", "WB2", "WB3", "WB4", "WB5"]:
                val = row[col]
                if pd.notna(val):
                    wbs.add(int(val))
            mb_val = row["MegaBall"]
            if pd.notna(mb_val) and len(wbs) == 5:
                results[date_str] = {"wb": wbs, "mb": int(mb_val)}
        except (ValueError, KeyError):
            continue
    return results


def evaluate_ticket(
    pred_wbs: list, pred_mb: int, actual_wbs: set, actual_mb: int
) -> tuple[int, bool, int]:
    match_wbs = len(set(pred_wbs) & actual_wbs)
    match_mb  = pred_mb == actual_mb
    prize     = PAYOUTS.get((match_wbs, match_mb), 0)
    return match_wbs, match_mb, prize


def strategy_summary(predictions: list) -> dict:
    """Aggregate won/spent/roi per strategy label."""
    summary: dict[str, dict] = {}
    for p in predictions:
        s = p.get("strategy", "unknown")
        if s not in summary:
            summary[s] = {"tickets": 0, "spent": 0, "won": 0}
        summary[s]["tickets"] += 1
        summary[s]["spent"]   += TICKET_COST
        summary[s]["won"]     += p.get("won", 0)
    for s in summary:
        summary[s]["roi"] = summary[s]["won"] - summary[s]["spent"]
    return summary


def cumulative_report(all_runs: list) -> None:
    """Print a cross-run performance summary."""
    total_spent = 0
    total_won   = 0
    per_strategy: dict[str, dict] = {}

    for run in all_runs:
        if not run.get("evaluated"):
            continue
        for p in run["predictions"]:
            s   = p.get("strategy", "unknown")
            won = p.get("won", 0)
            if s not in per_strategy:
                per_strategy[s] = {"tickets": 0, "spent": 0, "won": 0}
            per_strategy[s]["tickets"] += 1
            per_strategy[s]["spent"]   += TICKET_COST
            per_strategy[s]["won"]     += won
            total_spent += TICKET_COST
            total_won   += won

    if not per_strategy:
        return

    print("\n" + "=" * 55)
    print("CUMULATIVE PERFORMANCE ACROSS ALL RUNS")
    print(f"  Total virtual spent : ${total_spent:,}")
    print(f"  Total virtual won   : ${total_won:,}")
    print(f"  Overall net ROI     : ${total_won - total_spent:,}")
    print("-" * 55)
    print(f"  {'Strategy':<12} {'Tickets':>8} {'Spent':>8} {'Won':>10} {'ROI':>10}")
    print("-" * 55)
    for s, d in sorted(per_strategy.items()):
        roi = d["won"] - d["spent"]
        print(
            f"  {s:<12} {d['tickets']:>8} ${d['spent']:>7,} "
            f"${d['won']:>9,} ${roi:>9,}"
        )
    print("=" * 55)


def main() -> None:
    if not os.path.exists(PREDICTIONS_FILE):
        print("No predictions found. Run predictor.py first.")
        return

    actuals = load_actual_results()
    if not actuals:
        return

    with open(PREDICTIONS_FILE, "r") as f:
        all_runs: list = json.load(f)

    # Load MAB state once; we'll accumulate updates across multiple runs
    mab_state = load_mab_state()
    mab_updated = False
    updates_made = False

    for run in all_runs:
        if run.get("evaluated", False):
            continue

        target_date = run["target_draw_date"]
        if target_date not in actuals:
            print(f"Run {run['run_id']} → {target_date}: draw not yet available.")
            continue

        actual     = actuals[target_date]
        actual_wbs = actual["wb"]
        actual_mb  = actual["mb"]

        print(f"\n{'='*55}")
        print(f"  Run {run['run_id']}  |  Draw {target_date}")
        print(f"  Actual: {sorted(actual_wbs)}  MB:{actual_mb}")
        print(f"{'='*55}")

        total_spent = 0
        total_won   = 0

        for i, p in enumerate(run["predictions"]):
            mw, mm, won = evaluate_ticket(
                p["wb"], p["mb"], actual_wbs, actual_mb
            )
            p["match_wbs"] = mw
            p["match_mb"]  = mm
            p["won"]       = won
            total_spent   += TICKET_COST
            total_won     += won

            flag = f"  ⭐ WON ${won:,}" if won > 0 else ""
            print(
                f"  T{i+1:02d} [{p.get('strategy','?'):<10}] "
                f"{p['wb']} MB:{p['mb']}  →  {mw}+{int(mm)}{flag}"
            )

        roi          = total_won - total_spent
        strat_summary = strategy_summary(run["predictions"])

        print(f"\n  Spent: ${total_spent}  |  Won: ${total_won}  |  ROI: ${roi}")
        print("  Strategy breakdown:")
        for s, d in sorted(strat_summary.items()):
            print(f"    {s}: won ${d['won']} / spent ${d['spent']} = ROI ${d['roi']}")

        run["evaluated"] = True
        run["evaluation_summary"] = {
            "total_spent":  total_spent,
            "total_won":    total_won,
            "net_roi":      roi,
            "by_strategy":  strat_summary,
        }
        updates_made = True

        # ── v4.0: Update MAB state ─────────────────────────────────────────
        mab_state = update_after_draw(
            mab_state, run["predictions"], total_spent, total_won
        )
        mab_updated = True

    if updates_made:
        with open(PREDICTIONS_FILE, "w") as f:
            json.dump(all_runs, f, indent=4)
        print(f"\n✅ Results saved to {PREDICTIONS_FILE}.")

    if mab_updated:
        save_mab_state(mab_state)
        print(f"✅ MAB state updated and saved to mab_state.json.")

    # Always print cumulative + MAB reports
    cumulative_report(all_runs)
    print_mab_report(mab_state)


if __name__ == "__main__":
    main()
