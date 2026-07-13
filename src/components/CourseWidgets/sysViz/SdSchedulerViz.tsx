import React from 'react';
import { motion } from 'framer-motion';
import { CalendarClock } from 'lucide-react';
import type { CourseWidgetProps } from '../types';
import StepPlayerShell from '../algoViz/StepPlayerShell';

/**
 * Job scheduler capstone — a due job flows through lease → queue → worker,
 * the worker crashes mid-run, and the idempotency key saves the retry.
 * Combines leases, queues, retries, and exactly-once side effects.
 */

interface Stage { id: string; label: string }
const STAGES: Stage[] = [
  { id: 'store', label: 'Schedule store' },
  { id: 'dispatcher', label: 'Dispatcher' },
  { id: 'queue', label: 'Exec queue' },
  { id: 'worker', label: 'Worker' },
  { id: 'ledger', label: 'Billing ledger' },
];

interface Step { note: string; active: string[]; crashed?: boolean; badge?: { stage: string; text: string; tone: 'green' | 'amber' | 'red' | 'blue' } }

const STEPS: Step[] = [
  { note: 'A job is due: next_run_at ≤ now. The schedule store is the source of truth — durable, indexed by run time.', active: ['store'], badge: { stage: 'store', text: 'job#77 due', tone: 'blue' } },
  { note: 'The dispatcher CLAIMS the job with a 30s lease (atomic compare-and-set). Two dispatchers can race; the lease guarantees only one wins.', active: ['store', 'dispatcher'], badge: { stage: 'dispatcher', text: 'lease 30s ✓', tone: 'green' } },
  { note: 'The claimed job is enqueued durably with a deterministic idempotency key: run_key = job#77 @ 10:00. Enqueue-then-ack; never ack first.', active: ['dispatcher', 'queue'], badge: { stage: 'queue', text: 'run_key=77@10:00', tone: 'amber' } },
  { note: 'A worker picks it up and calls the external billing API… and then the worker DIES — after the charge, before the ack. Classic partial failure.', active: ['queue', 'worker'], crashed: true, badge: { stage: 'worker', text: '✕ crashed mid-run', tone: 'red' } },
  { note: 'The lease expires → the job is redelivered to another worker. At-least-once delivery means this WILL happen; the design must make it safe.', active: ['queue', 'worker'], badge: { stage: 'worker', text: 'redelivery #2', tone: 'blue' } },
  { note: 'Worker 2 asks the ledger: seen run_key 77@10:00? YES — the charge already exists. Skip the side effect, mark the run complete. Customer charged exactly once.', active: ['worker', 'ledger'], badge: { stage: 'ledger', text: 'dup! skip charge', tone: 'green' } },
];

const TONE = {
  green: 'border-[#15803d] bg-[#eef9f2] text-[#15803d]',
  amber: 'border-[#e8a33d] bg-[#fdf3d7] text-[#a35410]',
  red: 'border-[#b03a54] bg-[#fdeef1] text-[#b03a54]',
  blue: 'border-[#5f8fd9] bg-[#ecf4fd] text-[#1861a8]',
};

const SdSchedulerViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={CalendarClock}
    title="Job scheduler capstone · the crash-mid-run drill"
    totalSteps={STEPS.length}
    nextLabel="Advance"
    captions={STEPS.map((s) => s.note)}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Course capstone complete! Lease for exclusive claim + durable queue + deterministic run_key + ledger dedupe = at-least-once delivery with exactly-once side effects."
    todoText="Follow job#77 through the crash and the safe retry."
  >
    {(step) => {
      const s = STEPS[step];
      return (
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-center gap-1.5">
            {STAGES.map((stage, i) => {
              const active = s.active.includes(stage.id);
              const isCrashSite = s.crashed && stage.id === 'worker';
              return (
                <React.Fragment key={stage.id}>
                  {i > 0 && (
                    <span className={`text-sm font-black ${s.active.includes(STAGES[i - 1].id) && active ? 'text-[var(--cv-action-primary)]' : 'text-[var(--cv-border-warm)]'}`}>→</span>
                  )}
                  <motion.div
                    animate={{
                      scale: active ? 1.05 : 1,
                      opacity: active ? 1 : 0.45,
                      x: isCrashSite ? [0, -3, 3, -2, 0] : 0,
                    }}
                    className={`flex min-w-0 flex-col items-center rounded-xl border-2 px-2 py-2 ${isCrashSite
                      ? 'border-[#b03a54] bg-[#fdeef1]'
                      : active
                        ? 'border-[var(--cv-action-primary)] bg-[var(--cv-action-soft-bg)]'
                        : 'border-[var(--cv-border-warm)]'}`}
                  >
                    <span className={`text-[10px] font-extrabold leading-tight ${isCrashSite ? 'text-[#b03a54]' : active ? 'text-[var(--cv-action-primary)]' : 'text-[var(--cv-text-muted)]'}`}>
                      {stage.label}
                    </span>
                  </motion.div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Status badge under the active stage */}
          {s.badge && (
            <motion.div key={step} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex justify-center">
              <span className={`rounded-lg border-2 px-3 py-1.5 font-mono text-[11px] font-black ${TONE[s.badge.tone]}`}>
                {STAGES.find((st) => st.id === s.badge!.stage)!.label}: {s.badge.text}
              </span>
            </motion.div>
          )}

          {/* Invariant tracker */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Lease held', ok: step >= 1 && step !== 4 ? (step === 3 ? 'expiring…' : 'yes') : step === 4 ? 're-claimed' : '—' },
              { label: 'Charges made', ok: step >= 3 ? '1' : '0' },
              { label: 'Runs recorded', ok: step >= 5 ? '1 ✓' : step >= 3 ? '0 (!)' : '0' },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.03))] px-2 py-1.5">
                <p className="text-[9px] font-extrabold uppercase tracking-wide text-[var(--cv-text-muted)]">{m.label}</p>
                <p className="mt-0.5 font-mono text-xs font-black text-[var(--cv-text-heading)]">{m.ok}</p>
              </div>
            ))}
          </div>
          {step >= 3 && step < 5 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-center font-mono text-[10px] font-bold text-[#b03a54]">
              danger zone: charge exists but run not recorded — only the run_key makes this safe
            </motion.p>
          )}
        </div>
      );
    }}
  </StepPlayerShell>
);

export default SdSchedulerViz;
