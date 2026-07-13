import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import type { CourseWidgetProps } from '../types';
import StepPlayerShell from '../algoViz/StepPlayerShell';

/**
 * Circuit breaker animation — CLOSED → failures accumulate → OPEN
 * (short-circuit to fallback) → HALF-OPEN probe → CLOSED again.
 */

type BreakerState = 'CLOSED' | 'OPEN' | 'HALF-OPEN';
interface Step { note: string; state: BreakerState; failures: number; requests: { label: string; tone: 'ok' | 'fail' | 'fallback' | 'probe' }[] }

const STEPS: Step[] = [
  {
    note: 'Breaker CLOSED (normal). Calls flow to the payment dependency; the rolling window tracks failures (0/5).',
    state: 'CLOSED', failures: 0,
    requests: [{ label: '200', tone: 'ok' }, { label: '200', tone: 'ok' }, { label: '200', tone: 'ok' }],
  },
  {
    note: 'The dependency starts timing out. Each timeout burns a full 2s AND a thread — failures climb to 3/5. Callers are already feeling it.',
    state: 'CLOSED', failures: 3,
    requests: [{ label: '200', tone: 'ok' }, { label: 'timeout', tone: 'fail' }, { label: 'timeout', tone: 'fail' }, { label: 'timeout', tone: 'fail' }],
  },
  {
    note: '5/5 failures in the 10s window → the breaker TRIPS OPEN. New calls don\'t even try: they fail in ~1 ms to a fallback (cached status). No threads pile up, no cascade.',
    state: 'OPEN', failures: 5,
    requests: [{ label: 'fallback 1ms', tone: 'fallback' }, { label: 'fallback 1ms', tone: 'fallback' }, { label: 'fallback 1ms', tone: 'fallback' }],
  },
  {
    note: 'After a 30s cool-off the breaker goes HALF-OPEN: exactly ONE probe request is allowed through to test recovery. Everyone else still gets the fallback.',
    state: 'HALF-OPEN', failures: 5,
    requests: [{ label: 'probe →', tone: 'probe' }, { label: 'fallback', tone: 'fallback' }, { label: 'fallback', tone: 'fallback' }],
  },
  {
    note: 'The probe returns 200 — the dependency recovered. Breaker CLOSES, the failure window resets, and traffic ramps back. (A failed probe would re-open it for another 30s.)',
    state: 'CLOSED', failures: 0,
    requests: [{ label: '200', tone: 'ok' }, { label: '200', tone: 'ok' }, { label: '200', tone: 'ok' }],
  },
];

const STATE_STYLE: Record<BreakerState, { color: string; bg: string }> = {
  CLOSED: { color: '#15803d', bg: '#eef9f2' },
  OPEN: { color: '#b03a54', bg: '#fdeef1' },
  'HALF-OPEN': { color: '#5f8fd9', bg: '#ecf4fd' },
};

const TONE_STYLE = {
  ok: 'bg-[#eef9f2] text-[#15803d]',
  fail: 'bg-[#fdeef1] text-[#b03a54]',
  fallback: 'bg-[#fdf3d7] text-[#a35410]',
  probe: 'bg-[#ecf4fd] text-[#1861a8]',
};

const SdCircuitBreakerViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={ShieldAlert}
    title="Circuit breaker · fail fast, recover deliberately"
    totalSteps={STEPS.length}
    nextLabel="Advance"
    captions={STEPS.map((s) => s.note)}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Lesson complete! CLOSED → OPEN (threshold) → HALF-OPEN (probe) → CLOSED. Pair it with timeouts and bounded retries — that's the reliability trio."
    todoText="Trip the breaker, watch the fallback, then recover through the half-open probe."
  >
    {(step) => {
      const s = STEPS[step];
      const style = STATE_STYLE[s.state];
      return (
        <div className="mx-auto max-w-md">
          {/* State machine strip */}
          <div className="flex items-center justify-center gap-2">
            {(['CLOSED', 'OPEN', 'HALF-OPEN'] as BreakerState[]).map((st) => {
              const active = s.state === st;
              const stStyle = STATE_STYLE[st];
              return (
                <motion.span
                  key={st}
                  animate={{ scale: active ? 1.08 : 1, opacity: active ? 1 : 0.35 }}
                  className="rounded-full border-2 px-3 py-1 text-[11px] font-black"
                  style={{ borderColor: stStyle.color, backgroundColor: active ? stStyle.bg : 'transparent', color: stStyle.color }}
                >
                  {st}
                </motion.span>
              );
            })}
          </div>

          {/* Flow: API → breaker → dependency */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold">
            <span className="rounded-lg border-2 border-[var(--cv-border-warm)] px-3 py-2 text-[var(--cv-text-heading)]">API</span>
            <span className="text-[var(--cv-text-muted)]">→</span>
            <motion.span
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="rounded-lg border-2 px-3 py-2"
              style={{ borderColor: style.color, backgroundColor: style.bg, color: style.color }}
            >
              ⚡ breaker
            </motion.span>
            <span className="text-[var(--cv-text-muted)]">{s.state === 'OPEN' ? '⇢' : '→'}</span>
            <span className={`rounded-lg border-2 px-3 py-2 ${s.state === 'OPEN' ? 'border-[#b03a54] bg-[#fdeef1] text-[#b03a54] line-through opacity-60' : step === 1 ? 'border-[#e8a33d] bg-[#fdf3d7] text-[#a35410]' : 'border-[var(--cv-border-warm)] text-[var(--cv-text-heading)]'}`}>
              Payments
            </span>
          </div>

          {/* Failure window */}
          <div className="mt-4">
            <p className="text-center text-[10px] font-extrabold uppercase tracking-wide text-[var(--cv-text-muted)]">Rolling failure window (trip at 5)</p>
            <div className="mt-1.5 flex justify-center gap-1.5">
              {Array.from({ length: 5 }, (_, i) => (
                <motion.span
                  key={i}
                  animate={{ scale: i < s.failures ? 1 : 0.75, backgroundColor: i < s.failures ? '#b03a54' : 'rgba(0,0,0,0.08)' }}
                  className="h-3.5 w-3.5 rounded-full"
                />
              ))}
            </div>
          </div>

          {/* Request outcomes */}
          <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-wrap justify-center gap-1.5">
            {s.requests.map((r, i) => (
              <span key={i} className={`rounded-md px-2 py-1 font-mono text-[10px] font-black ${TONE_STYLE[r.tone]}`}>{r.label}</span>
            ))}
          </motion.div>
        </div>
      );
    }}
  </StepPlayerShell>
);

export default SdCircuitBreakerViz;
