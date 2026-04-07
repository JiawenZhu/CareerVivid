"""
benchmark.py – Mega Millions Ticket Quantity Benchmark
======================================================
Backtests the PVP engine using different ticket quantities against ALL
historical draw data. Shows how win rate, coverage, and prize yield change
as you buy more tickets per draw.

Usage:
    python benchmark.py                         # default: 10, 50, 100, 500
    python benchmark.py --sizes 10 50 100 500   # custom sizes
    python benchmark.py --sizes 100 --draws 50  # last 50 draws, 100 tickets

Speed design:
  - Engine tables are built ONCE (not once per draw).
  - Candidates are generated in bulk up to max(sizes); smaller sizes re-use
    the same sorted pool (fair comparison, same seed per draw).
  - Pure stdlib — no numpy or scipy required.
"""

from __future__ import annotations

import argparse
import random
import time
from collections import defaultdict

import pandas as pd

from engine_v2 import LotteryEngine, WHITE_MIN, WHITE_MAX, WHITE_COUNT, MB_MIN, MB_MAX
from utils import load_history

# ── Official Mega Millions payout table ───────────────────────────────────────
PAYOUTS: dict[tuple, int] = {
    (5, True):  20_000_000,
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
TICKET_COST = 2  # $2 per ticket


# ── Fast weighted sampling (stdlib only) ──────────────────────────────────────

def _weighted_choice_no_replace(population: list[int], weights: list[float], k: int) -> list[int]:
    """Draw k items WITHOUT replacement using weights (O(k * n) — fast for small k)."""
    pop = list(population)
    wts = list(weights)
    result = []
    for _ in range(k):
        total = sum(wts)
        r = random.uniform(0, total)
        cumulative = 0.0
        idx = len(pop) - 1
        for i, w in enumerate(wts):
            cumulative += w
            if cumulative >= r:
                idx = i
                break
        result.append(pop[idx])
        pop.pop(idx)
        wts.pop(idx)
    return result


# ── Generate N tickets using the engine's positional tables ───────────────────

def generate_tickets_bulk(engine: LotteryEngine, n_tickets: int, n_candidates: int) -> list[tuple]:
    """
    Generate n_tickets using the engine's positional probability tables.
    Returns list of (sorted_whites_tuple, mega_ball) sorted by composite score DESC.

    We generate n_candidates first, score them all, return top-n_tickets.
    This replicates engine.generate() but batched for speed.
    """
    pos_table = engine._pos_table  # 5-element list of {num: prob} dicts
    mb_table  = engine._mb_table   # {mb: prob} dict

    wb_range  = list(range(WHITE_MIN, WHITE_MAX + 1))
    mb_range  = list(range(MB_MIN, MB_MAX + 1))
    mb_weights = [mb_table.get(n, 1e-4) for n in mb_range]

    # Soft positional bands (same as engine_v2)
    bands = [
        [n for n in range(WHITE_MIN, 16)],       # P1: 1-15
        [n for n in range(10, 31)],              # P2: 10-30
        [n for n in range(20, 51)],              # P3: 20-50
        [n for n in range(35, 61)],              # P4: 35-60
        [n for n in range(45, WHITE_MAX + 1)],   # P5: 45-70
    ]

    candidates: list[tuple] = []

    for _ in range(n_candidates):
        used: set[int] = set()
        combo: list[int] = []
        valid = True

        for pos in range(WHITE_COUNT):
            slot = pos_table[pos]
            avail = [n for n in bands[pos] if n not in used]
            if not avail:
                avail = [n for n in wb_range if n not in used]
            if not avail:
                valid = False
                break
            weights = [slot.get(n, 1e-4) for n in avail]
            total = sum(weights)
            r = random.uniform(0, total)
            cumulative = 0.0
            chosen = avail[-1]
            for i, w in enumerate(weights):
                cumulative += w
                if cumulative >= r:
                    chosen = avail[i]
                    break
            combo.append(chosen)
            used.add(chosen)

        if not valid or len(combo) != WHITE_COUNT:
            continue

        mb = random.choices(mb_range, weights=mb_weights, k=1)[0]
        candidates.append((tuple(sorted(combo)), mb))

    # Score all candidates using the engine's composite formula
    scored = sorted(
        candidates,
        key=lambda t: engine.score_ticket(list(t[0]), t[1]).score_total,
        reverse=True,
    )
    return scored[:n_tickets]


# ── Evaluate one batch of tickets vs one real draw ────────────────────────────

def evaluate_batch(tickets: list[tuple], actual_whites: set, actual_mb: int) -> dict:
    winning_count = 0
    total_won = 0
    total_wb_hits = 0

    for whites, mb in tickets:
        mw    = len(set(whites) & actual_whites)
        mm    = mb == actual_mb
        prize = PAYOUTS.get((mw, mm), 0)
        if prize > 0:
            total_won    += prize
            winning_count += 1
        total_wb_hits += mw

    n = len(tickets)
    return {
        "n":               n,
        "winning":         winning_count,
        "spent":           n * TICKET_COST,
        "won":             total_won,
        "any_win":         winning_count > 0,
        "avg_wb_hits":     total_wb_hits / n if n else 0.0,
    }


# ── Main benchmark ─────────────────────────────────────────────────────────────

def run_benchmark(sizes: list[int], n_draws: int | None = None) -> None:
    print("\n" + "═" * 74)
    print("  🎰  MEGA MILLIONS — Ticket Quantity Benchmark (PVP Engine)")
    print("═" * 74)

    t0 = time.perf_counter()

    # Load data
    try:
        df = load_history()
    except FileNotFoundError:
        print("❌  megamillions_history.csv not found. Run scraper.py first.")
        return
    if df.empty:
        print("❌  No historical data.")
        return

    full_history: list = []
    for _, row in df.iterrows():
        try:
            whites = [int(row[c]) for c in ["WB1", "WB2", "WB3", "WB4", "WB5"]]
            mb = int(row["MegaBall"])
            full_history.append((whites, mb))
        except (ValueError, KeyError):
            continue

    if not full_history:
        print("❌  Could not parse history.")
        return

    # Build engine ONCE from all history
    engine = LotteryEngine(
        history=full_history,
        window=100,
        decay=0.97,
        alpha=0.35,
        beta=0.45,
        gamma=0.20,
    )
    t_build = time.perf_counter() - t0

    test_draws  = full_history[:n_draws] if n_draws else full_history
    total_draws = len(test_draws)
    max_size    = max(sizes)
    # candidates per draw: at least 3× max_size or 1000, whichever is larger
    n_candidates = max(max_size * 3, 1000)

    print(f"\n  Engine built in   : {t_build*1000:.1f} ms")
    print(f"  Total draws in DB : {len(full_history)}")
    print(f"  Draws to backtest : {total_draws}")
    print(f"  Candidate pool    : {n_candidates} per draw")
    print(f"  Ticket sizes      : {sizes}")
    print()

    # Accumulators: {size: {metric: float}}
    agg: dict[int, dict] = {s: defaultdict(float) for s in sizes}

    t_loop = time.perf_counter()

    for draw_idx, (actual_whites, actual_mb) in enumerate(test_draws):
        actual_set = set(actual_whites)

        # Same random seed per draw for all sizes → fair comparison
        random.seed(draw_idx * 137 + 42)

        # Generate the largest pool once, then re-use subsets
        all_tickets = generate_tickets_bulk(engine, n_tickets=max_size, n_candidates=n_candidates)

        for size in sizes:
            subset = all_tickets[:size]
            stats  = evaluate_batch(subset, actual_set, actual_mb)

            agg[size]["draws"]        += 1
            agg[size]["total_tickets"]  += stats["n"]
            agg[size]["winning"]        += stats["winning"]
            agg[size]["spent"]          += stats["spent"]
            agg[size]["won"]            += stats["won"]
            agg[size]["draws_with_win"] += int(stats["any_win"])
            agg[size]["sum_wb_hits"]    += stats["avg_wb_hits"]

        # Progress indicator every 50 draws
        if (draw_idx + 1) % 50 == 0:
            elapsed = time.perf_counter() - t_loop
            speed = (draw_idx + 1) / elapsed
            print(f"  ... {draw_idx+1}/{total_draws} draws  ({speed:.1f} draws/sec)")

    t_total = time.perf_counter() - t0

    # ── Print comparison table ────────────────────────────────────────────────
    print()
    print("─" * 74)
    header = (f"  {'Tickets':>8}  {'Win Rate%':>10}  {'Δ vs prev':>10}  "
              f"{'Draw Hit%':>10}  {'AvgWBhit':>9}  {'ROI/Draw':>10}")
    print(header)
    print("─" * 74)

    prev_win_rate = None
    for size in sorted(sizes):
        r = agg[size]
        draws   = int(r["draws"])
        tot_t   = int(r["total_tickets"])
        winning = int(r["winning"])
        spent   = int(r["spent"])
        won     = int(r["won"])
        d_win   = int(r["draws_with_win"])

        win_rate  = winning / tot_t * 100  if tot_t > 0  else 0.0
        draw_hit  = d_win   / draws  * 100 if draws  > 0 else 0.0
        avg_wb    = r["sum_wb_hits"]  / draws if draws > 0 else 0.0
        roi_draw  = (won - spent) / draws    if draws > 0 else 0.0

        delta_str = "  baseline    "
        if prev_win_rate is not None:
            diff = win_rate - prev_win_rate
            arrow = "↑" if diff > 0 else "↓" if diff < 0 else "→"
            delta_str = f"  {arrow}{abs(diff):>7.3f}%     "

        print(f"  {size:>8}  {win_rate:>9.3f}%  {delta_str}"
              f"  {draw_hit:>9.1f}%  {avg_wb:>8.3f}  ${roi_draw:>+9.2f}")
        prev_win_rate = win_rate

    print("─" * 74)
    print(f"\n  ⏱  Total time  : {t_total:.2f}s  ({total_draws} draws × "
          f"{n_candidates} candidates per draw)")
    print()

    # ── Detail table ──────────────────────────────────────────────────────────
    print("  📊 Detailed totals:")
    print(f"  {'Tickets':>8}  {'Draws':>7}  {'Spent':>10}  {'Won':>12}  "
          f"{'Net ROI':>12}  {'Wins':>8}")
    print("  " + "─" * 66)
    for size in sorted(sizes):
        r = agg[size]
        draws  = int(r["draws"])
        spent  = int(r["spent"])
        won    = int(r["won"])
        wins   = int(r["winning"])
        net    = won - spent
        print(f"  {size:>8}  {draws:>7}  ${spent:>9,}  ${won:>11,}  "
              f"${net:>+11,}  {wins:>8,}")

    print()
    print("  📖 Guide:")
    print("     Win Rate%  = % of tickets that won any prize (higher = better coverage)")
    print("     Draw Hit%  = % of draws where ≥1 ticket won (higher = more consistent)")
    print("     AvgWBhit   = average white ball matches per ticket")
    print("     ROI/Draw   = avg net gain/loss per draw (all lotteries are -EV)")
    print()


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Benchmark the PVP engine at different ticket quantities"
    )
    parser.add_argument(
        "--sizes",
        nargs="+",
        type=int,
        default=[10, 50, 100, 500],
        metavar="N",
        help="Ticket counts to benchmark (default: 10 50 100 500)",
    )
    parser.add_argument(
        "--draws",
        type=int,
        default=None,
        metavar="D",
        help="Number of most recent draws to use (default: all)",
    )
    args = parser.parse_args()

    valid_sizes = sorted(set(s for s in args.sizes if s > 0))
    if not valid_sizes:
        print("❌  No valid ticket sizes provided.")
        return

    run_benchmark(sizes=valid_sizes, n_draws=args.draws)


if __name__ == "__main__":
    main()
