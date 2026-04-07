"""
mab_engine.py – Quantitative Engine for Mega Millions Predictor v4.0
=====================================================================
Implements:
  1. Thompson Sampling  (Multi-Armed Bandit via Beta distribution)
  2. EMA of ROI         (Exponential Moving Average, replaces avg_wb)
  3. Kelly Criterion    (Virtual bankroll-based budget management)
  4. Ensemble Weights   (Fuse all strategies into one probability map)

State is persisted in mab_state.json and updated by evaluator.py after
each draw. predictor.py reads this state to make the next allocation.
"""

import json
import math
import os
import random

# Configuration for paths (can be overridden by environment variables)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MAB_STATE_FILE = os.getenv("MAB_STATE_PATH", os.path.join(BASE_DIR, "mab_state.json"))

STRATEGIES       = ["A-hot", "B-cold", "C-random", "D-hybrid"]
TICKET_COST      = 2          # dollars per ticket
INITIAL_BANKROLL = 10_000     # virtual bankroll in dollars
MIN_TICKETS      = 3
MAX_TICKETS      = 20
COLD_START_BUDGET = 8   # used when draw_count == 0 (no evidence yet)

# EMA decay: weight of the most recent batch vs. history
EMA_ALPHA = 0.30              # 30% new, 70% history

# Kelly safety fraction cap (never bet more than 25% of bankroll in one draw)
MAX_KELLY_FRACTION = 0.25

# C-random is always kept as a control arm with this fixed ensemble weight floor
RANDOM_FLOOR_WEIGHT = 0.05    # 5% minimum weight for C-random in ensemble


# ── State I/O ──────────────────────────────────────────────────────────────────

def _default_strategy_state() -> dict:
    return {
        "alpha":           1.0,   # Beta prior α (successes + 1)
        "beta":            1.0,   # Beta prior β (failures  + 1)
        "ema_roi":        -1.0,   # start pessimistic: assume total loss
        "avg_payout_mult": 1.0,   # avg (won / TICKET_COST) when won > 0
        "lifetime_tickets": 0,
        "lifetime_won":    0,
    }


def load_mab_state() -> dict:
    """Load mab_state.json, or return fresh defaults if it doesn't exist."""
    if os.path.exists(MAB_STATE_FILE):
        with open(MAB_STATE_FILE, "r") as f:
            state = json.load(f)
        # Back-fill any strategies that were added after initial creation
        for s in STRATEGIES:
            if s not in state["strategies"]:
                state["strategies"][s] = _default_strategy_state()
        return state

    # First run — create from scratch
    return {
        "virtual_bankroll": INITIAL_BANKROLL,
        "draw_count": 0,
        "strategies": {s: _default_strategy_state() for s in STRATEGIES},
        "last_updated": None,
    }


def save_mab_state(state: dict) -> None:
    """Persist mab_state.json."""
    import datetime
    state["last_updated"] = datetime.datetime.now().isoformat()
    with open(MAB_STATE_FILE, "w") as f:
        json.dump(state, f, indent=4)


# ── Thompson Sampling ──────────────────────────────────────────────────────────

def thompson_sample(alpha: float, beta: float) -> float:
    """
    Sample θ ~ Beta(alpha, beta) using the Gamma-ratio method
    (avoids scipy dependency, works with stdlib random + math).

    Beta(α, β) = Gamma(α) / (Gamma(α) + Gamma(β))
    We approximate Gamma samples via the Marsaglia-Tsang method
    embedded in random.gammavariate().
    """
    g_alpha = random.gammavariate(alpha, 1.0)
    g_beta  = random.gammavariate(beta,  1.0)
    total   = g_alpha + g_beta
    return g_alpha / total if total > 0 else 0.5


def sample_all_thetas(state: dict) -> dict[str, float]:
    """Draw one θ per strategy from its Beta distribution."""
    return {
        s: thompson_sample(
            state["strategies"][s]["alpha"],
            state["strategies"][s]["beta"],
        )
        for s in STRATEGIES
    }


# ── Kelly Criterion Budget ─────────────────────────────────────────────────────

def kelly_budget(state: dict) -> tuple[int, dict]:
    """
    Compute total ticket budget using Kelly Criterion.

    For each strategy s:
        p_s  = θ_s (Thompson sample = estimated win probability)
        b_s  = avg_payout_mult_s (historical average payout / TICKET_COST)
        f*_s = (b_s * p_s - (1 - p_s)) / b_s    [Kelly fraction]
        f*_s = clamp(f*_s, 0, MAX_KELLY_FRACTION)

    budget = max(MIN, min(MAX, Σ bankroll * max(f*_s) / TICKET_COST))

    Returns (budget_int, thetas_dict)
    """
    bankroll = state["virtual_bankroll"]

    # Cold start: no evidence yet → use safe default budget
    if state.get("draw_count", 0) == 0:
        thetas      = sample_all_thetas(state)
        kelly_fracs = {s: 0.0 for s in STRATEGIES}
        return COLD_START_BUDGET, thetas, kelly_fracs

    thetas   = sample_all_thetas(state)

    kelly_fracs = {}
    for s in STRATEGIES:
        p = thetas[s]
        b = state["strategies"][s]["avg_payout_mult"]
        q = 1.0 - p
        # Standard Kelly: f* = (b*p - q) / b
        f = (b * p - q) / b if b > 0 else 0.0
        kelly_fracs[s] = max(0.0, min(MAX_KELLY_FRACTION, f))

    best_f   = max(kelly_fracs.values()) if kelly_fracs else 0.0
    # dollars to spend this draw = bankroll * best_f
    dollars  = bankroll * best_f
    budget   = max(MIN_TICKETS, min(MAX_TICKETS, round(dollars / TICKET_COST)))

    return budget, thetas, kelly_fracs


# ── Ticket Allocation (Thompson Sampling proportional) ─────────────────────────

def allocate_tickets(budget: int, thetas: dict[str, float]) -> dict[str, int]:
    """
    Allocate `budget` tickets proportionally to Thompson-sampled θ values.
    Each strategy gets at least 1 ticket.
    """
    total_theta = sum(thetas.values())
    allocation  = {}
    leftover    = budget
    strats      = list(thetas.keys())

    for i, s in enumerate(strats):
        if i == len(strats) - 1:
            # Last strategy gets whatever is left (avoids rounding drift)
            allocation[s] = max(1, leftover)
        else:
            proportion    = thetas[s] / total_theta if total_theta > 0 else 0.25
            n             = max(1, round(proportion * budget))
            allocation[s] = n
            leftover      -= n
            leftover       = max(leftover, len(strats) - i - 1)

    return allocation


# ── Ensemble Probability Map ───────────────────────────────────────────────────

def _softmax(values: dict[str, float], temperature: float = 1.0) -> dict[str, float]:
    """Softmax over a dict of floats. Higher temp → more uniform."""
    scaled = {k: v / temperature for k, v in values.items()}
    max_v  = max(scaled.values())
    exps   = {k: math.exp(v - max_v) for k, v in scaled.items()}
    total  = sum(exps.values())
    return {k: v / total for k, v in exps.items()}


def ensemble_wb_probs(
    state: dict,
    all_wb_weights: dict[str, dict[int, float]],
) -> dict[int, float]:
    """
    Fuse per-strategy white-ball weight dicts into a single composite
    probability map over numbers 1–70.

    Ensemble weight for each strategy = softmax(ema_roi).
    C-random is floor-clamped at RANDOM_FLOOR_WEIGHT to maintain diversity.

    Args:
        state:           MAB state dict
        all_wb_weights:  {"A-hot": {1: w, 2: w, ...}, "B-cold": {...}, ...}

    Returns:
        {1: prob, 2: prob, ..., 70: prob}  (normalised to sum=1)
    """
    ema_rois = {s: state["strategies"][s]["ema_roi"] for s in STRATEGIES}

    # Softmax over EMA ROI  (temperature=2 to soften extreme differences)
    raw_w = _softmax(ema_rois, temperature=2.0)

    # Enforce C-random floor
    if raw_w.get("C-random", 0) < RANDOM_FLOOR_WEIGHT:
        deficit = RANDOM_FLOOR_WEIGHT - raw_w["C-random"]
        raw_w["C-random"] = RANDOM_FLOOR_WEIGHT
        # Redistribute deficit proportionally from others
        others = [s for s in raw_w if s != "C-random"]
        others_total = sum(raw_w[s] for s in others)
        for s in others:
            raw_w[s] -= deficit * (raw_w[s] / others_total) if others_total > 0 else 0

    # Build composite probability map
    composite: dict[int, float] = {n: 0.0 for n in range(1, 71)}
    for s, w in raw_w.items():
        if s not in all_wb_weights:
            continue
        strat_weights = all_wb_weights[s]
        strat_total   = sum(strat_weights.values())
        for n, wt in strat_weights.items():
            composite[n] += w * (wt / strat_total)

    # Normalise to sum = 1
    total = sum(composite.values())
    return {n: v / total for n, v in composite.items()} if total > 0 else composite


def ensemble_mb_probs(
    state: dict,
    all_mb_weights: dict[str, dict[int, float]],
) -> dict[int, float]:
    """Same as ensemble_wb_probs but for Mega Ball 1–25."""
    ema_rois = {s: state["strategies"][s]["ema_roi"] for s in STRATEGIES}
    raw_w    = _softmax(ema_rois, temperature=2.0)

    if raw_w.get("C-random", 0) < RANDOM_FLOOR_WEIGHT:
        deficit = RANDOM_FLOOR_WEIGHT - raw_w["C-random"]
        raw_w["C-random"] = RANDOM_FLOOR_WEIGHT
        others = [s for s in raw_w if s != "C-random"]
        others_total = sum(raw_w[s] for s in others)
        for s in others:
            raw_w[s] -= deficit * (raw_w[s] / others_total) if others_total > 0 else 0

    composite: dict[int, float] = {n: 0.0 for n in range(1, 26)}
    for s, w in raw_w.items():
        if s not in all_mb_weights:
            continue
        strat_weights = all_mb_weights[s]
        strat_total   = sum(strat_weights.values())
        for n, wt in strat_weights.items():
            composite[n] += w * (wt / strat_total)

    total = sum(composite.values())
    return {n: v / total for n, v in composite.items()} if total > 0 else composite


# ── MAB State Update (called by evaluator.py after each draw) ─────────────────

def update_after_draw(
    state: dict,
    predictions: list[dict],
    total_spent: int,
    total_won: int,
) -> dict:
    """
    Update MAB state after a draw is evaluated.

    For each ticket:
      - alpha_s += 1  if won > 0   (success)
      - beta_s  += 1  if won == 0  (failure)
      - Compute batch ROI per strategy → EMA update
      - Update avg_payout_mult for winning tickets

    Also updates:
      - virtual_bankroll  (bankroll += total_won - total_spent)
      - draw_count

    Args:
        state:       Current MAB state dict (mutated in place)
        predictions: List of evaluated ticket dicts with 'strategy', 'won'
        total_spent: Total dollars spent this draw
        total_won:   Total dollars won this draw

    Returns:
        Updated state dict
    """
    # Group by strategy
    by_strategy: dict[str, list] = {s: [] for s in STRATEGIES}
    for p in predictions:
        s = p.get("strategy", "unknown")
        if s in by_strategy:
            by_strategy[s].append(p)

    for s, tickets in by_strategy.items():
        if not tickets:
            continue

        ss = state["strategies"][s]

        # ── Thompson sampling update (per ticket) ──────────────────────────
        for t in tickets:
            won = t.get("won", 0)
            if won > 0:
                ss["alpha"] += 1
            else:
                ss["beta"] += 1

        # ── EMA ROI update (per strategy batch) ───────────────────────────
        rois       = [(t.get("won", 0) - TICKET_COST) / TICKET_COST for t in tickets]
        batch_roi  = sum(rois) / len(rois)
        ss["ema_roi"] = EMA_ALPHA * batch_roi + (1 - EMA_ALPHA) * ss["ema_roi"]

        # ── Average payout multiplier (for Kelly) ─────────────────────────
        winning = [t for t in tickets if t.get("won", 0) > 0]
        if winning:
            avg_mult = sum(t["won"] / TICKET_COST for t in winning) / len(winning)
            # EMA update for payout multiplier as well
            ss["avg_payout_mult"] = (
                0.4 * avg_mult + 0.6 * ss["avg_payout_mult"]
            )

        # ── Lifetime stats ─────────────────────────────────────────────────
        ss["lifetime_tickets"] += len(tickets)
        ss["lifetime_won"]     += sum(t.get("won", 0) for t in tickets)

    # ── Bankroll update ────────────────────────────────────────────────────
    net = total_won - total_spent
    state["virtual_bankroll"] = max(50, state["virtual_bankroll"] + net)
    state["draw_count"]      += 1

    return state


# ── Pretty Report ──────────────────────────────────────────────────────────────

def print_mab_report(state: dict, thetas: dict = None, kelly_fracs: dict = None) -> None:
    """Print a formatted summary of the current MAB state."""
    print("\n" + "═" * 62)
    print("  MAB ENGINE STATE (v4.0)")
    print(f"  Virtual Bankroll : ${state['virtual_bankroll']:,.2f}")
    print(f"  Draw Count       : {state['draw_count']}")
    print("─" * 62)
    print(f"  {'Strategy':<12} {'α':>6} {'β':>6} {'EMA_ROI':>9} "
          f"{'θ (TS)':>8} {'Kelly f*':>9} {'LifeWon':>9}")
    print("─" * 62)
    for s in STRATEGIES:
        ss  = state["strategies"][s]
        th  = f"{thetas[s]:.4f}"    if thetas      else "  —  "
        kf  = f"{kelly_fracs[s]:.4f}" if kelly_fracs else "  —  "
        print(f"  {s:<12} {ss['alpha']:>6.1f} {ss['beta']:>6.1f} "
              f"{ss['ema_roi']:>9.4f} {th:>8} {kf:>9} "
              f"${ss['lifetime_won']:>7,}")
    print("═" * 62)
