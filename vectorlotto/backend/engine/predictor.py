"""
predictor.py – Mega Millions Quantitative Predictor v4.0
=========================================================
Upgrade from v3.0 heuristic to full quantitative model:

  1. Thompson Sampling   → decides how many tickets per strategy
  2. Kelly Criterion     → decides total ticket budget from virtual bankroll
  3. EMA ROI             → weights for Ensemble (strategies as voters)
  4. Ensemble Voting     → single fused probability map for number selection

Each ticket is drawn from the ENSEMBLE distribution (all strategies vote),
so there are no longer purely "hot" or "cold" tickets — every ticket
reflects the combined wisdom of all strategies, weighted by their track record.

For traceability, the ensemble weights used at generation time are recorded
alongside each ticket in predictions.json.
"""

import json
import os
import random
import uuid
from datetime import timedelta

import pandas as pd

from utils import load_history, calculate_frequency, calculate_overdue
from mab_engine import (
    load_mab_state,
    save_mab_state,
    kelly_budget,
    allocate_tickets,
    ensemble_wb_probs,
    ensemble_mb_probs,
    print_mab_report,
    STRATEGIES,
    TICKET_COST,
)

PREDICTIONS_FILE = "predictions.json"


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_next_draw_date(latest_draw_date: pd.Timestamp) -> str:
    """Return the next Mega Millions draw date (Tue=1 or Fri=4)."""
    current = latest_draw_date + timedelta(days=1)
    while current.weekday() not in (1, 4):
        current += timedelta(days=1)
    return current.strftime("%Y-%m-%d")


def weighted_sample_no_replace(population: list, weights: list, k: int) -> list:
    """Weighted sampling WITHOUT replacement."""
    result = []
    pop    = list(population)
    wts    = list(weights)
    for _ in range(k):
        total  = sum(wts)
        r      = random.uniform(0, total)
        upto   = 0.0
        chosen = len(pop) - 1
        for i, w in enumerate(wts):
            upto += w
            if upto >= r:
                chosen = i
                break
        result.append(pop.pop(chosen))
        wts.pop(chosen)
    return sorted(result)


# ── Strategy Weight Builders (unchanged from v3) ──────────────────────────────

def build_hot_weights(wb_counts, mb_counts):
    """Strategy A: prefer frequently drawn numbers."""
    wb_w = {i: max(1, wb_counts.get(i, 0) * 3) for i in range(1, 71)}
    mb_w = {i: max(1, mb_counts.get(i, 0) * 3) for i in range(1, 26)}
    return wb_w, mb_w


def build_cold_weights(wb_last_seen, mb_last_seen):
    """Strategy B: prefer numbers that haven't appeared recently."""
    wb_w = {i: max(1, wb_last_seen.get(i, 999) / 5.0) for i in range(1, 71)}
    mb_w = {i: max(1, mb_last_seen.get(i, 999) / 5.0) for i in range(1, 26)}
    return wb_w, mb_w


def build_hybrid_weights(wb_counts, mb_counts, wb_last_seen, mb_last_seen):
    """Strategy D: hot × cold blended (freq * overdue)."""
    wb_w = {
        i: max(1, wb_counts.get(i, 0)) * max(1, wb_last_seen.get(i, 999) / 5.0)
        for i in range(1, 71)
    }
    mb_w = {
        i: max(1, mb_counts.get(i, 0)) * max(1, mb_last_seen.get(i, 999) / 5.0)
        for i in range(1, 26)
    }
    return wb_w, mb_w


def build_uniform_weights():
    """Strategy C: pure random (control group)."""
    return {i: 1 for i in range(1, 71)}, {i: 1 for i in range(1, 26)}


# ── Ensemble Ticket Drawing ───────────────────────────────────────────────────

def draw_ensemble_ticket(
    wb_prob_map: dict[int, float],
    mb_prob_map: dict[int, float],
) -> dict:
    """
    Draw one ticket from the composite ensemble probability maps.
    White balls: 5 unique numbers from 1-70 (weighted, no replacement).
    Mega Ball:   1 number from 1-25 (weighted).
    """
    nums    = list(wb_prob_map.keys())
    wts     = list(wb_prob_map.values())
    wb_draw = weighted_sample_no_replace(nums, wts, 5)

    mb_nums = list(mb_prob_map.keys())
    mb_wts  = list(mb_prob_map.values())
    mb_draw = random.choices(mb_nums, weights=mb_wts, k=1)[0]

    return {"wb": wb_draw, "mb": mb_draw}


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    # ── Load historical draw data ─────────────────────────────────────────
    try:
        df = load_history()
    except FileNotFoundError:
        print("Error: megamillions_history.csv not found. Run scraper.py first.")
        return

    if df.empty:
        print("No data found.")
        return

    latest_draw_date = df["DrawDate"].iloc[0]
    next_draw_date   = get_next_draw_date(latest_draw_date)
    print(f"Latest real draw   : {latest_draw_date.strftime('%Y-%m-%d')}")
    print(f"Predicting for     : {next_draw_date}")
    print(f"Historical records : {len(df)} draws")

    # ── Load existing prediction runs ─────────────────────────────────────
    all_runs: list = []
    if os.path.exists(PREDICTIONS_FILE):
        with open(PREDICTIONS_FILE, "r") as f:
            try:
                all_runs = json.load(f)
            except json.JSONDecodeError:
                pass

    # ── Load MAB state ────────────────────────────────────────────────────
    mab_state = load_mab_state()
    is_cold_start = mab_state["draw_count"] == 0

    # ── Kelly Criterion: budget + Thompson Sampling thetas ────────────────
    budget, thetas, kelly_fracs = kelly_budget(mab_state)

    # ── Thompson Sampling: per-strategy ticket allocation ─────────────────
    allocation = allocate_tickets(budget, thetas)

    # ── Print MAB report ──────────────────────────────────────────────────
    print_mab_report(mab_state, thetas, kelly_fracs)

    if is_cold_start:
        print("\n  ⚠️  Cold start: MAB state initialised with uniform priors.")
        print("     Budget and allocation will diversify after the first draw.")

    print(f"\n  💰 Kelly Budget : {budget} tickets  "
          f"(virtual spend: ${budget * TICKET_COST})")
    print(f"  🏦 Bankroll     : ${mab_state['virtual_bankroll']:,.2f}\n")

    # ── Build per-strategy weight dicts ───────────────────────────────────
    wb_counts, mb_counts       = calculate_frequency(df)
    wb_last_seen, mb_last_seen = calculate_overdue(df)

    all_wb_weights = {
        "A-hot":    build_hot_weights(wb_counts, mb_counts)[0],
        "B-cold":   build_cold_weights(wb_last_seen, mb_last_seen)[0],
        "D-hybrid": build_hybrid_weights(wb_counts, mb_counts, wb_last_seen, mb_last_seen)[0],
        "C-random": build_uniform_weights()[0],
    }
    all_mb_weights = {
        "A-hot":    build_hot_weights(wb_counts, mb_counts)[1],
        "B-cold":   build_cold_weights(wb_last_seen, mb_last_seen)[1],
        "D-hybrid": build_hybrid_weights(wb_counts, mb_counts, wb_last_seen, mb_last_seen)[1],
        "C-random": build_uniform_weights()[1],
    }

    # ── Build ENSEMBLE probability maps (fusing all strategies via EMA ROI) ──
    wb_ensemble = ensemble_wb_probs(mab_state, all_wb_weights)
    mb_ensemble = ensemble_mb_probs(mab_state, all_mb_weights)

    # ── Print allocation table ────────────────────────────────────────────
    print(f"  {'Strategy':<12} {'θ (TS)':>8} {'Kelly f*':>9} {'Tickets':>8}  EMA ROI")
    print("  " + "─" * 50)
    for s in STRATEGIES:
        ema = mab_state["strategies"][s]["ema_roi"]
        print(
            f"  {s:<12} {thetas[s]:>8.4f} {kelly_fracs[s]:>9.4f} "
            f"{allocation[s]:>8}  {ema:+.4f}"
        )
    print()

    # ── Draw tickets from ensemble ────────────────────────────────────────
    # Each ticket is drawn from the SAME ensemble probability map.
    # We label it with the "strategy" slot it was assigned to (for MAB feedback),
    # but all numbers come from the fused distribution.
    predictions = []
    print(f"  {'Ticket':<6} {'Label':<12} {'Numbers':<36} MB")
    print("  " + "─" * 60)

    ticket_num = 1
    for strategy, n_tickets in allocation.items():
        for _ in range(n_tickets):
            ticket = draw_ensemble_ticket(wb_ensemble, mb_ensemble)
            ticket["strategy"] = strategy   # label kept for MAB feedback
            ticket["source"]   = "ensemble" # marks v4.0 generation mode
            predictions.append(ticket)

            wb_str = str(ticket["wb"]).ljust(35)
            print(f"  {ticket_num:02d}     [{strategy:<10}] {wb_str} {ticket['mb']}")
            ticket_num += 1

    # ── Capture ensemble weights snapshot ─────────────────────────────────
    ensemble_snapshot = {
        s: {
            "theta":      round(thetas[s], 6),
            "kelly_f":    round(kelly_fracs[s], 6),
            "ema_roi":    round(mab_state["strategies"][s]["ema_roi"], 6),
            "allocation": allocation[s],
        }
        for s in STRATEGIES
    }

    # ── Save ──────────────────────────────────────────────────────────────
    run_record = {
        "run_id":           str(uuid.uuid4())[:8],
        "version":          "4.0",
        "created_at":       pd.Timestamp.now().isoformat(),
        "target_draw_date": next_draw_date,
        "history_size":     len(df),
        "budget":           budget,
        "bankroll_at_pred": mab_state["virtual_bankroll"],
        "allocation":       allocation,
        "ensemble_weights": ensemble_snapshot,
        "mab_draw_count":   mab_state["draw_count"],
        "predictions":      predictions,
        "evaluated":        False,
        "evaluation_summary": None,
    }
    all_runs.append(run_record)

    with open(PREDICTIONS_FILE, "w") as f:
        json.dump(all_runs, f, indent=4)

    # Save MAB state (thetas are stochastic; we don't persist them,
    # but we do persist draw_count — already correct)
    save_mab_state(mab_state)

    print(
        f"\n✅ {len(predictions)} ensemble tickets saved to {PREDICTIONS_FILE}."
        f"\n   Run evaluator.py after the {next_draw_date} draw!"
    )

    # ── Auto-sync to Google Sheets ────────────────────────────────────────────
    try:
        from sheets_sync import sync_predictions
        sync_predictions(run_id=run_record["run_id"])
    except Exception as e:
        print(f"\n   [sheets_sync] skipped: {e}")


if __name__ == "__main__":
    main()
