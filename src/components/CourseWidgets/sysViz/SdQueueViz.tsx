import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox } from 'lucide-react';
import type { CourseWidgetProps } from '../types';
import StepPlayerShell from '../algoViz/StepPlayerShell';

/**
 * Message queue animation — partitions, a slow consumer growing backlog,
 * retries, and the poison event landing in the DLQ.
 */

interface Lane { id: string; backlog: number; consumerState: 'ok' | 'slow' | 'ok-again'; }
interface Step { note: string; lanes: Lane[]; dlq: number; retrying?: boolean }

const STEPS: Step[] = [
  {
    note: 'A topic with 3 partitions, keyed by user_id so one user\'s events stay ordered. Each partition has one consumer; backlogs are near zero.',
    lanes: [{ id: 'P0', backlog: 1, consumerState: 'ok' }, { id: 'P1', backlog: 1, consumerState: 'ok' }, { id: 'P2', backlog: 2, consumerState: 'ok' }],
    dlq: 0,
  },
  {
    note: 'Consumer 1 slows down (a downstream API got sluggish). Its partition backlog grows — the OTHER partitions are unaffected. Lag is per-partition.',
    lanes: [{ id: 'P0', backlog: 1, consumerState: 'ok' }, { id: 'P1', backlog: 5, consumerState: 'slow' }, { id: 'P2', backlog: 2, consumerState: 'ok' }],
    dlq: 0,
  },
  {
    note: 'Alert on the AGE of the oldest event (time-to-user), not just the count. Backlog of 8 with 1s events = 8s of user delay and rising.',
    lanes: [{ id: 'P0', backlog: 2, consumerState: 'ok' }, { id: 'P1', backlog: 8, consumerState: 'slow' }, { id: 'P2', backlog: 2, consumerState: 'ok' }],
    dlq: 0,
  },
  {
    note: 'One event keeps failing — a malformed payload. Retry with exponential backoff (1s → 2s → 4s → 8s → 16s), and because delivery is at-least-once, the handler MUST be idempotent.',
    lanes: [{ id: 'P0', backlog: 2, consumerState: 'ok' }, { id: 'P1', backlog: 8, consumerState: 'slow' }, { id: 'P2', backlog: 2, consumerState: 'ok' }],
    dlq: 0, retrying: true,
  },
  {
    note: '5 retries exhausted → the poison event moves to the dead-letter queue WITH its error context. The partition unblocks instantly; nothing behind it is lost.',
    lanes: [{ id: 'P0', backlog: 2, consumerState: 'ok' }, { id: 'P1', backlog: 6, consumerState: 'ok-again' }, { id: 'P2', backlog: 2, consumerState: 'ok' }],
    dlq: 1,
  },
  {
    note: 'Consumer 1 catches up; an operator fixes the bug and REPLAYS the DLQ event explicitly. Total data loss: zero.',
    lanes: [{ id: 'P0', backlog: 1, consumerState: 'ok' }, { id: 'P1', backlog: 1, consumerState: 'ok-again' }, { id: 'P2', backlog: 1, consumerState: 'ok' }],
    dlq: 0,
  },
];

const SdQueueViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={Inbox}
    title="Message queue · lag, retries, and the DLQ"
    totalSteps={STEPS.length}
    nextLabel="Advance"
    captions={STEPS.map((s) => s.note)}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Lesson complete! Partition by ordering key, alert on oldest-event age, retry with backoff, dead-letter after a bounded budget — the four rules of async processing."
    todoText="Watch a slow consumer build backlog and a poison event get dead-lettered."
    legend={
      <>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-full bg-[#5f8fd9] align-middle" /> queued event</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-full bg-[#b03a54] align-middle" /> poison event</span>
      </>
    }
  >
    {(step) => {
      const s = STEPS[step];
      return (
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between px-1 text-[10px] font-extrabold uppercase tracking-wide text-[var(--cv-text-muted)]">
            <span>Producer</span><span>Partitions</span><span>Consumers</span>
          </div>
          <div className="mt-2 space-y-2">
            {s.lanes.map((lane, laneIdx) => {
              const slow = lane.consumerState === 'slow';
              return (
                <div key={lane.id} className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-center font-mono text-[10px] font-bold text-[var(--cv-text-muted)]">{lane.id}</span>
                  {/* Queue lane */}
                  <div className={`flex h-9 flex-1 items-center gap-1 overflow-hidden rounded-lg border-2 px-2 ${lane.backlog >= 5 ? 'border-[#e8a33d] bg-[#fdf3d7]/60' : 'border-[var(--cv-border-warm)]'}`}>
                    <AnimatePresence>
                      {Array.from({ length: Math.min(lane.backlog, 10) }, (_, i) => {
                        const isPoison = s.retrying && laneIdx === 1 && i === 0;
                        return (
                          <motion.span
                            key={`${lane.id}-${i}`}
                            layout
                            initial={{ opacity: 0, x: -10, scale: 0.5 }}
                            animate={{ opacity: 1, x: 0, scale: isPoison ? [1, 1.3, 1] : 1 }}
                            exit={{ opacity: 0, x: 14 }}
                            transition={isPoison ? { repeat: Infinity, duration: 0.9 } : undefined}
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${isPoison ? 'bg-[#b03a54]' : 'bg-[#5f8fd9]'}`}
                          />
                        );
                      })}
                    </AnimatePresence>
                    {lane.backlog > 10 && <span className="font-mono text-[9px] font-bold text-[var(--cv-text-muted)]">+{lane.backlog - 10}</span>}
                  </div>
                  {/* Consumer */}
                  <motion.span
                    animate={{ scale: slow ? [1, 0.96, 1] : 1 }}
                    transition={slow ? { repeat: Infinity, duration: 1.4 } : undefined}
                    className={`w-24 shrink-0 rounded-lg border-2 px-2 py-1.5 text-center text-[10px] font-extrabold ${slow
                      ? 'border-[#e8a33d] bg-[#fdf3d7] text-[#a35410]'
                      : 'border-[#b9e3c8] bg-[#eef9f2] text-[#15803d]'}`}
                  >
                    C{laneIdx} {slow ? '· slow' : lane.consumerState === 'ok-again' ? '· catching up' : '· ok'}
                  </motion.span>
                </div>
              );
            })}
          </div>
          {/* DLQ */}
          <motion.div
            animate={{ opacity: s.dlq > 0 ? 1 : 0.4, scale: s.dlq > 0 ? 1.02 : 1 }}
            className={`mt-3 flex items-center justify-between rounded-lg border-2 px-3 py-2 ${s.dlq > 0 ? 'border-[#b03a54] bg-[#fdeef1]' : 'border-dashed border-[var(--cv-border-warm)]'}`}
          >
            <span className={`text-[11px] font-extrabold ${s.dlq > 0 ? 'text-[#b03a54]' : 'text-[var(--cv-text-muted)]'}`}>Dead-letter queue</span>
            <span className="flex items-center gap-1.5">
              {s.dlq > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-2.5 w-2.5 rounded-full bg-[#b03a54]" />}
              <span className={`font-mono text-[10px] font-bold ${s.dlq > 0 ? 'text-[#b03a54]' : 'text-[var(--cv-text-muted)]'}`}>
                {s.dlq > 0 ? '1 event + error context' : 'empty'}
              </span>
            </span>
          </motion.div>
        </div>
      );
    }}
  </StepPlayerShell>
);

export default SdQueueViz;
