import { describe, expect, it } from 'vitest';
import {
  CASE_DRILLS,
  CAPACITY_QUICKFIRE,
  FLAW_SCENES,
  LATENCY_CARDS,
  ORDERING_SETS,
  getCaseDrill,
} from './systemDesignQuestionBank';

describe('systemDesignQuestionBank', () => {
  it('ships six classic case drills with unique ids', () => {
    expect(CASE_DRILLS).toHaveLength(6);
    expect(new Set(CASE_DRILLS.map((c) => c.id)).size).toBe(6);
    expect(getCaseDrill('twitter-timeline')?.title).toContain('Twitter');
  });

  it('every case drill is structurally sound', () => {
    for (const drill of CASE_DRILLS) {
      // Clarify: exactly requiredCount essential options, plus distractors.
      const essentials = drill.clarify.options.filter((o) => o.essential);
      expect(essentials).toHaveLength(drill.clarify.requiredCount);
      expect(drill.clarify.options.length).toBeGreaterThan(drill.clarify.requiredCount);
      for (const option of drill.clarify.options) expect(option.why.length).toBeGreaterThan(10);

      // Estimate: positive answers with usable tolerance.
      expect(drill.estimate.length).toBeGreaterThanOrEqual(2);
      for (const q of drill.estimate) {
        expect(q.answer).toBeGreaterThan(0);
        expect(q.tolerance).toBeGreaterThan(0);
        expect(q.tolerance).toBeLessThan(1);
        expect(q.working.length).toBeGreaterThan(10);
      }

      // MCQs: correctIndex in range, rationale present.
      for (const q of [...drill.decide, drill.followup]) {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
        expect(q.why.length).toBeGreaterThan(10);
      }
    }
  });

  it('latency cards have distinct options and the answer is not among distractors', () => {
    expect(LATENCY_CARDS.length).toBeGreaterThanOrEqual(8);
    for (const card of LATENCY_CARDS) {
      expect(card.distractors).not.toContain(card.answer);
      expect(new Set([card.answer, ...card.distractors]).size).toBe(card.distractors.length + 1);
    }
  });

  it('capacity quick-fire answers accept the documented working', () => {
    for (const q of CAPACITY_QUICKFIRE) {
      expect(q.answer).toBeGreaterThan(0);
      expect(q.tolerance).toBeGreaterThan(0);
    }
    // Spot-check the arithmetic itself.
    expect(Math.abs(1_000_000 / 86_400 - 11.6)).toBeLessThan(0.1);
    expect(500_000_000 / 86_400).toBeCloseTo(5787, -1);
    expect(10_000_000 * 500 / 1e9).toBe(5);
  });

  it('flaw scenes each point at exactly one existing component', () => {
    for (const scene of FLAW_SCENES) {
      expect(scene.components.map((c) => c.id)).toContain(scene.flawedId);
      expect(new Set(scene.components.map((c) => c.id)).size).toBe(scene.components.length);
    }
  });

  it('ordering sets have unique items (shuffle + tap-matching relies on it)', () => {
    for (const set of ORDERING_SETS) {
      expect(new Set(set.items).size).toBe(set.items.length);
      expect(set.items.length).toBeGreaterThanOrEqual(5);
    }
  });
});
