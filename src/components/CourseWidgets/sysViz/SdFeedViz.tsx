import React from 'react';
import { motion } from 'framer-motion';
import { Rss } from 'lucide-react';
import type { CourseWidgetProps } from '../types';
import StepPlayerShell from '../algoViz/StepPlayerShell';

/**
 * Feed fan-out animation — fan-out-on-WRITE for ordinary accounts vs
 * fan-out-on-READ for celebrities, side by side. The hybrid is the answer.
 */

interface Step { note: string; writeFill: number; readActive: boolean; showCosts?: boolean }

const STEPS: Step[] = [
  { note: 'Two accounts post at the same time: a normal user (200 followers) and a celebrity (50M followers). Same feature — wildly different physics.', writeFill: 0, readActive: false },
  { note: 'Normal user → fan-out on WRITE: workers copy the post id into all 200 follower inboxes. Cheap (200 tiny writes), and reads become O(1) inbox lookups.', writeFill: 1, readActive: false },
  { note: 'Try that for the celebrity: 50,000,000 inbox writes for ONE post. At 10k writes/s that\'s ~83 minutes of backlog — fan-out on write DOES NOT scale for celebrities.', writeFill: 2, readActive: false },
  { note: 'Celebrity → fan-out on READ: store the post ONCE. Each follower\'s feed request merges "my inbox" + "posts from celebrities I follow" at read time.', writeFill: 1, readActive: true },
  { note: 'The hybrid rule: fan-out on write below a follower threshold (~10k), fan-out on read above it. Twitter/X\'s actual architecture — say the threshold out loud.', writeFill: 1, readActive: true, showCosts: true },
];

const SdFeedViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={Rss}
    title="News feed · fan-out on write vs read"
    totalSteps={STEPS.length}
    nextLabel="Advance"
    captions={STEPS.map((s) => s.note)}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Lesson complete! Write fan-out for the many, read fan-out for the huge, a threshold in between. This one trade-off carries the whole feed interview."
    todoText="Compare both strategies and land on the hybrid."
  >
    {(step) => {
      const s = STEPS[step];
      return (
        <div className="mx-auto grid max-w-lg gap-4 sm:grid-cols-2">
          {/* Fan-out on write */}
          <div className={`rounded-xl border-2 p-3 ${step === 2 ? 'border-[#b03a54] bg-[#fdeef1]/40' : 'border-[var(--cv-border-warm)]'}`}>
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cv-text-muted)]">Fan-out on WRITE</p>
            <div className="mt-2 flex justify-center">
              <span className={`rounded-lg border-2 px-3 py-1.5 text-[11px] font-extrabold ${step === 2 ? 'border-[#b03a54] bg-[#fdeef1] text-[#b03a54]' : 'border-[#5f8fd9] bg-[#ecf4fd] text-[#1861a8]'}`}>
                {step === 2 ? '⭐ 50M followers' : '👤 200 followers'} · posts
              </span>
            </div>
            {/* Inbox grid */}
            <div className="mt-3 grid grid-cols-8 gap-1">
              {Array.from({ length: 24 }, (_, i) => {
                const filled = s.writeFill >= 1 && (s.writeFill === 2 ? i < 6 : true);
                const overloaded = s.writeFill === 2;
                return (
                  <motion.span
                    key={i}
                    animate={{
                      backgroundColor: filled ? (overloaded ? '#b03a54' : '#15803d') : 'rgba(0,0,0,0.07)',
                      opacity: filled ? 1 : 0.5,
                    }}
                    transition={{ delay: filled ? i * 0.02 : 0 }}
                    className="aspect-square rounded-sm"
                  />
                );
              })}
            </div>
            <p className={`mt-2 text-center font-mono text-[10px] font-black ${step === 2 ? 'text-[#b03a54]' : 'text-[#15803d]'}`}>
              {s.writeFill === 0 ? 'inboxes idle' : s.writeFill === 2 ? '6/50,000,000 written… ~83 min backlog' : '200/200 inboxes ✓ (fast)'}
            </p>
          </div>

          {/* Fan-out on read */}
          <div className={`rounded-xl border-2 p-3 ${s.readActive ? 'border-[#15803d]' : 'border-[var(--cv-border-warm)] opacity-60'}`}>
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cv-text-muted)]">Fan-out on READ</p>
            <div className="mt-2 flex justify-center">
              <span className="rounded-lg border-2 border-[#e8a33d] bg-[#fdf3d7] px-3 py-1.5 text-[11px] font-extrabold text-[#a35410]">
                ⭐ post stored ONCE
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              {['reader A', 'reader B', 'reader C'].map((r, i) => (
                <motion.div
                  key={r}
                  animate={{ opacity: s.readActive ? 1 : 0.3, x: 0 }}
                  initial={{ x: -6 }}
                  transition={{ delay: i * 0.12 }}
                  className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-[var(--cv-text-body)]"
                >
                  <span>{r}:</span>
                  <span className="rounded bg-[#ecf4fd] px-1.5 py-0.5 text-[#1861a8]">inbox</span>
                  <span>+</span>
                  <span className="rounded bg-[#fdf3d7] px-1.5 py-0.5 text-[#a35410]">celeb posts</span>
                  <span>→</span>
                  <span className={`rounded px-1.5 py-0.5 ${s.readActive ? 'bg-[#eef9f2] text-[#15803d]' : 'bg-black/5'}`}>merged feed</span>
                </motion.div>
              ))}
            </div>
            <p className="mt-2 text-center font-mono text-[10px] font-black text-[var(--cv-text-muted)]">
              {s.readActive ? 'merge cost paid per read (~5 ms)' : 'inactive'}
            </p>
          </div>

          {s.showCosts && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border-2 border-[var(--cv-action-border)] bg-[var(--cv-action-soft-bg)] p-3 text-center sm:col-span-2">
              <p className="text-xs font-extrabold text-[var(--cv-action-primary)]">
                HYBRID: followers &lt; 10k → fan-out on write · followers ≥ 10k → fan-out on read
              </p>
            </motion.div>
          )}
        </div>
      );
    }}
  </StepPlayerShell>
);

export default SdFeedViz;
