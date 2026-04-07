"""
MegaMillions / Powerball — Positional Vector Probability Engine
==============================================================
Combines three scoring layers:
  Layer 1 – Hot/Cold frequency (existing)
  Layer 2 – Positional probability vectors (new)
  Layer 3 – Mega Ball frequency weighting

Usage:
    from lottery_engine import LotteryEngine
    engine = LotteryEngine(history=DRAW_HISTORY)
    tickets = engine.generate(n_tickets=8)
    engine.print_tickets(tickets)
"""

from __future__ import annotations

import math
import random
from collections import defaultdict
from dataclasses import dataclass
from typing import Optional


# ─── Constants ───────────────────────────────────────────────────────────────

WHITE_MIN = 1
WHITE_MAX = 70   # Mega Millions white balls: 1–70
WHITE_COUNT = 5
MB_MIN = 1
MB_MAX = 25      # Mega Ball: 1–25


# ─── Types ───────────────────────────────────────────────────────────────────

Draw = tuple[list[int], int]   # ([w1,w2,w3,w4,w5], mb)


@dataclass
class TicketScore:
    strategy: str
    white: list[int]
    mb: int
    score_hot_cold: float = 0.0
    score_positional: float = 0.0
    score_mb: float = 0.0
    score_total: float = 0.0


# ─── Sample historical data (replace / extend with real draws) ────────────────

DRAW_HISTORY: list[Draw] = [
    ([4,  26, 42, 50, 60], 17),
    ([12, 18, 31, 45, 68], 9),
    ([3,  22, 35, 51, 66], 4),
    ([7,  19, 28, 48, 62], 11),
    ([10, 25, 37, 52, 69], 22),
    ([2,  15, 33, 46, 60], 15),
    ([5,  20, 31, 43, 57], 3),
    ([1,  17, 29, 44, 65], 8),
    ([8,  23, 36, 49, 63], 19),
    ([14, 27, 40, 54, 67], 12),
    ([6,  21, 34, 47, 61], 7),
    ([11, 24, 38, 53, 64], 20),
    ([9,  26, 41, 55, 68], 5),
    ([13, 29, 39, 50, 62], 16),
    ([4,  18, 32, 46, 59], 24),
    ([7,  22, 35, 48, 65], 10),
    ([2,  16, 30, 44, 60], 13),
    ([10, 25, 37, 51, 66], 6),
    ([5,  19, 33, 47, 63], 21),
    ([8,  23, 36, 52, 68], 14),
]


# ─── Core Engine ─────────────────────────────────────────────────────────────

class LotteryEngine:
    def __init__(
        self,
        history: list[Draw] = DRAW_HISTORY,
        window: int = 50,
        decay: float = 0.97,
        hot_threshold: int = 15,
        cold_threshold: int = 15,
        alpha: float = 0.35,
        beta: float = 0.45,
        gamma: float = 0.20,
    ):
        self.history = history
        self.window = window
        self.decay = decay
        self.hot_threshold = hot_threshold
        self.cold_threshold = cold_threshold
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma

        self._freq_table   = self._build_frequency_table()
        self._pos_table    = self._build_positional_table()
        self._mb_table     = self._build_mb_table()
        self._hot, self._cold = self._classify_hot_cold()

    def _build_frequency_table(self) -> dict[int, float]:
        recent = self.history[-self.window:] if self.window else self.history
        counts: dict[int, float] = defaultdict(float)
        n = len(recent)
        for i, (whites, _) in enumerate(recent):
            weight = self.decay ** (n - 1 - i)
            for num in whites:
                counts[num] += weight
        total = sum(counts.values()) or 1.0
        return {num: cnt / total for num, cnt in counts.items()}

    def _classify_hot_cold(self) -> tuple[set[int], set[int]]:
        ranked = sorted(self._freq_table, key=self._freq_table.get, reverse=True)
        hot  = set(ranked[:self.hot_threshold])
        cold = set(ranked[-self.cold_threshold:])
        return hot, cold

    def _build_positional_table(self) -> list[dict[int, float]]:
        recent = self.history[-self.window:] if self.window else self.history
        pos_counts: list[dict[int, float]] = [defaultdict(float) for _ in range(WHITE_COUNT)]
        n = len(recent)
        for i, (whites, _) in enumerate(recent):
            weight = self.decay ** (n - 1 - i)
            for pos, num in enumerate(sorted(whites)):
                pos_counts[pos][num] += weight
        pos_table = []
        for pos in range(WHITE_COUNT):
            total = sum(pos_counts[pos].values()) or 1.0
            pos_table.append({num: cnt / total for num, cnt in pos_counts[pos].items()})
        return pos_table

    def positional_score(self, whites: list[int]) -> float:
        log_score = 0.0
        for pos, num in enumerate(sorted(whites)):
            p = self._pos_table[pos].get(num, 1e-4)
            log_score += math.log(p)
        return math.exp(log_score / WHITE_COUNT)

    def positional_score_normalised(self, whites: list[int]) -> float:
        raw = self.positional_score(whites)
        best_per_pos = [max(slot, key=slot.get) for slot in self._pos_table]
        best_raw = self.positional_score(best_per_pos)
        if best_raw == 0:
            return 0.0
        return min(raw / best_raw, 1.0)

    def _build_mb_table(self) -> dict[int, float]:
        recent = self.history[-self.window:] if self.window else self.history
        counts: dict[int, float] = defaultdict(float)
        n = len(recent)
        for i, (_, mb) in enumerate(recent):
            weight = self.decay ** (n - 1 - i)
            counts[mb] += weight
        total = sum(counts.values()) or 1.0
        return {mb: cnt / total for mb, cnt in counts.items()}

    def score_ticket(self, whites: list[int], mb: int) -> TicketScore:
        s_hc = sum(self._freq_table.get(n, 1e-4) for n in whites) / WHITE_COUNT
        s_pos = self.positional_score_normalised(whites)
        s_mb = self._mb_table.get(mb, 1e-4)
        max_mb = max(self._mb_table.values()) if self._mb_table else 1.0
        s_mb_norm = s_mb / max_mb
        combined = self.alpha * s_hc + self.beta * s_pos + self.gamma * s_mb_norm
        strategy = self._classify_strategy(whites)
        return TicketScore(
            strategy=strategy, white=sorted(whites), mb=mb,
            score_hot_cold=round(s_hc, 4),
            score_positional=round(s_pos, 4),
            score_mb=round(s_mb_norm, 4),
            score_total=round(combined, 4),
        )

    def _classify_strategy(self, whites: list[int]) -> str:
        hot_count  = sum(1 for n in whites if n in self._hot)
        cold_count = sum(1 for n in whites if n in self._cold)
        if hot_count >= 3:
            return "A-hot"
        elif cold_count >= 3:
            return "B-cold"
        elif hot_count >= 2 and cold_count >= 1:
            return "D-hybrid"
        else:
            return "C-random"

    def _sample_whites_by_position(self) -> list[int]:
        bands = [
            list(range(WHITE_MIN, 16)),
            list(range(10,  31)),
            list(range(20,  51)),
            list(range(35,  61)),
            list(range(45, WHITE_MAX + 1)),
        ]
        selected = []
        used = set()
        for pos in range(WHITE_COUNT):
            slot_probs = self._pos_table[pos]
            candidates = [n for n in bands[pos] if n not in used]
            if not candidates:
                candidates = [n for n in range(WHITE_MIN, WHITE_MAX + 1) if n not in used]
            weights = [slot_probs.get(n, 1e-4) for n in candidates]
            w_total = sum(weights)
            norm_weights = [w / w_total for w in weights]
            chosen = random.choices(candidates, weights=norm_weights, k=1)[0]
            selected.append(chosen)
            used.add(chosen)
        return selected

    def _sample_mb(self) -> int:
        candidates = list(range(MB_MIN, MB_MAX + 1))
        weights = [self._mb_table.get(n, 1e-4) for n in candidates]
        return random.choices(candidates, weights=weights, k=1)[0]

    def generate(
        self,
        n_tickets: int = 8,
        n_candidates: int = 500,
        strategy_mix: Optional[dict[str, float]] = None,
    ) -> list[TicketScore]:
        scored: list[TicketScore] = []
        for _ in range(n_candidates):
            whites = self._sample_whites_by_position()
            mb = self._sample_mb()
            scored.append(self.score_ticket(whites, mb))
        scored.sort(key=lambda t: t.score_total, reverse=True)
        if strategy_mix:
            return self._apply_strategy_mix(scored, n_tickets, strategy_mix)
        return scored[:n_tickets]

    def _apply_strategy_mix(self, scored, n_tickets, mix):
        buckets: dict[str, list[TicketScore]] = defaultdict(list)
        for t in scored:
            buckets[t.strategy].append(t)
        total_weight = sum(mix.values())
        result = []
        for strategy, ratio in mix.items():
            n = round(n_tickets * ratio / total_weight)
            result.extend(buckets[strategy][:n])
        used_ids = {id(t) for t in result}
        extras = [t for t in scored if id(t) not in used_ids]
        result.extend(extras[:max(0, n_tickets - len(result))])
        return sorted(result, key=lambda t: t.score_total, reverse=True)[:n_tickets]

    def print_positional_table(self) -> None:
        print("\n📊 Positional Probability Table (Top 5 per slot)")
        print("─" * 60)
        for pos in range(WHITE_COUNT):
            slot = self._pos_table[pos]
            top5 = sorted(slot, key=slot.get, reverse=True)[:5]
            pct = [f"{n}({slot[n]*100:.1f}%)" for n in top5]
            print(f"  P{pos+1}: {', '.join(pct)}")
        print()

    def print_tickets(self, tickets: list[TicketScore], title: str = "Generated Tickets") -> None:
        print(f"\n🎰 {title}")
        print("─" * 80)
        print(f"  {'#':<4} {'Strategy':<12} {'White Balls':<28} {'MB':<5} "
              f"{'HC':>6} {'Pos':>6} {'MB%':>6} {'Total':>7}")
        print("─" * 80)
        for i, t in enumerate(tickets, 1):
            balls = "[" + ", ".join(f"{n:2d}" for n in t.white) + "]"
            print(f"  T{i:02d}  {t.strategy:<12} {balls:<28} {t.mb:<5} "
                  f"{t.score_hot_cold:>6.3f} {t.score_positional:>6.3f} "
                  f"{t.score_mb:>6.3f} {t.score_total:>7.4f}")
        print()

    def compare_results(self, tickets: list[TicketScore], actual_draw: Draw) -> None:
        actual_whites = set(actual_draw[0])
        actual_mb = actual_draw[1]
        print("\n📋 Result Comparison")
        print(f"   Actual draw: whites={sorted(actual_whites)}, MB={actual_mb}")
        print("─" * 80)
        prize_table = {
            (5, True):  "JACKPOT 🎉",
            (5, False): "$1,000,000",
            (4, True):  "$10,000",
            (4, False): "$500",
            (3, True):  "$200",
            (3, False): "$10",
            (2, True):  "$10",
            (1, True):  "$4",
            (0, True):  "$2",
        }
        for i, t in enumerate(tickets, 1):
            matched_w  = len(set(t.white) & actual_whites)
            matched_mb = t.mb == actual_mb
            prize = prize_table.get((matched_w, matched_mb), "")
            won = " ⭐ WON " + prize if prize else ""
            balls = "[" + ", ".join(f"{n:2d}" for n in t.white) + "]"
            print(f"  T{i:02d} [{t.strategy:<10}] {balls} MB:{t.mb:<3} "
                  f"→ {matched_w}+{int(matched_mb)}{won}")
        print()


if __name__ == "__main__":
    engine = LotteryEngine(
        history=DRAW_HISTORY,
        window=50,
        decay=0.97,
        alpha=0.35,
        beta=0.45,
        gamma=0.20,
    )
    print("=" * 80)
    print("  MEGA MILLIONS — Positional Vector Probability Engine")
    print("=" * 80)
    engine.print_positional_table()
    tickets = engine.generate(
        n_tickets=8,
        n_candidates=500,
        strategy_mix={"A-hot": 0.25, "B-cold": 0.25, "C-random": 0.25, "D-hybrid": 0.25},
    )
    engine.print_tickets(tickets)
    engine.compare_results(tickets, DRAW_HISTORY[-1])
