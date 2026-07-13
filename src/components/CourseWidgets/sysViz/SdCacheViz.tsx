import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Database, Coins } from 'lucide-react';
import type { CourseWidgetProps } from '../types';
import StepPlayerShell from '../algoViz/StepPlayerShell';

/**
 * Cache + rate limiting animation. Part 1: cache-aside hit vs miss with real
 * latency numbers. Part 2: a token bucket absorbing a burst and rejecting the
 * overflow with 429s.
 */

interface Step {
  note: string;
  phase: 'hit' | 'miss' | 'fill' | 'bucket' | 'burst' | 'refill';
  tokens: number; // bucket tokens 0..5
  rejected?: number;
}

const STEPS: Step[] = [
  { phase: 'hit', tokens: 5, note: 'Cache HIT: the key is fresh in Redis → answer in ~2 ms. The database never hears about it. At a 90% hit rate, 9 of 10 reads take this path.' },
  { phase: 'miss', tokens: 5, note: 'Cache MISS: cold key → fall through to the database (~80 ms, 40× slower). This is the price of the first read… ' },
  { phase: 'fill', tokens: 5, note: '…so pay it once: write the result back with a TTL (cache-aside). The next thousand reads of this key are 2 ms hits.' },
  { phase: 'bucket', tokens: 5, note: 'Now the write path needs protection. A token bucket holds 5 tokens, refilling 2/s. Each request spends one token.' },
  { phase: 'burst', tokens: 0, rejected: 3, note: 'A burst of 8 arrives at once: 5 spend tokens and pass; 3 find the bucket empty → 429 Too Many Requests. The database never sees the spike.' },
  { phase: 'refill', tokens: 2, note: 'One second later the refill adds 2 tokens — sustained rate 2/s, bursts up to 5. Clients back off and retry with jitter.' },
];

const Lat: React.FC<{ ms: string; tone: string }> = ({ ms, tone }) => (
  <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-black ${tone}`}>{ms}</motion.span>
);

const SdCacheViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={Zap}
    title="Cache-aside + token bucket · protect the slow path"
    totalSteps={STEPS.length}
    nextLabel="Advance"
    captions={STEPS.map((s) => s.note)}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Lesson complete! Reads: cache-aside with TTL (2 ms vs 80 ms). Writes: token bucket admission (burst 5, refill 2/s). Both keep load away from the database."
    todoText="Walk the read path (hit, miss, fill), then the write path (bucket, burst, refill)."
  >
    {(step) => {
      const s = STEPS[step];
      const cacheActive = s.phase === 'hit' || s.phase === 'fill';
      const dbActive = s.phase === 'miss' || s.phase === 'fill';
      const inBucketPart = step >= 3;
      return (
        <div className="mx-auto grid max-w-lg gap-4 sm:grid-cols-2">
          {/* Read path */}
          <div className={`rounded-xl border-2 p-3 transition-opacity ${inBucketPart ? 'opacity-35' : ''} border-[var(--cv-border-warm)]`}>
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cv-text-muted)]">Read path · cache-aside</p>
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between rounded-lg border-2 border-[var(--cv-border-warm)] px-3 py-2 text-xs font-bold text-[var(--cv-text-heading)]">
                Client {!inBucketPart && <Lat ms={s.phase === 'hit' ? '2 ms' : '82 ms'} tone={s.phase === 'hit' ? 'bg-[#eef9f2] text-[#15803d]' : 'bg-[#fdf3d7] text-[#a35410]'} />}
              </div>
              <motion.div
                animate={{ scale: cacheActive && !inBucketPart ? 1.04 : 1 }}
                className={`flex items-center justify-between rounded-lg border-2 px-3 py-2 text-xs font-bold ${!inBucketPart && s.phase === 'hit' ? 'border-[#15803d] bg-[#eef9f2] text-[#15803d]' : !inBucketPart && s.phase === 'miss' ? 'border-[#e8a33d] bg-[#fdf3d7] text-[#a35410]' : !inBucketPart && s.phase === 'fill' ? 'border-[#15803d] bg-[#eef9f2] text-[#15803d]' : 'border-[var(--cv-border-warm)] text-[var(--cv-text-heading)]'}`}
              >
                <span className="inline-flex items-center gap-1.5"><Zap size={13} /> Cache</span>
                {!inBucketPart && <span className="font-mono text-[10px]">{s.phase === 'hit' ? 'HIT ✓' : s.phase === 'miss' ? 'MISS ✗' : 'SET key TTL=60s'}</span>}
              </motion.div>
              <motion.div
                animate={{ scale: dbActive && !inBucketPart ? 1.04 : 1 }}
                className={`flex items-center justify-between rounded-lg border-2 px-3 py-2 text-xs font-bold ${dbActive && !inBucketPart ? 'border-[#5f8fd9] bg-[#ecf4fd] text-[#1861a8]' : 'border-[var(--cv-border-warm)] text-[var(--cv-text-muted)]'}`}
              >
                <span className="inline-flex items-center gap-1.5"><Database size={13} /> Database</span>
                {!inBucketPart && <span className="font-mono text-[10px]">{dbActive ? 'SELECT … 80 ms' : 'not touched'}</span>}
              </motion.div>
            </div>
          </div>

          {/* Write path: token bucket */}
          <div className={`rounded-xl border-2 p-3 transition-opacity ${!inBucketPart ? 'opacity-35' : ''} border-[var(--cv-border-warm)]`}>
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cv-text-muted)]">Write path · token bucket</p>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {Array.from({ length: 5 }, (_, i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: i < s.tokens ? 1 : 0.15, scale: i < s.tokens ? 1 : 0.7 }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#e8a33d] bg-[#fdf3d7] text-[#a35410]"
                >
                  <Coins size={14} />
                </motion.span>
              ))}
            </div>
            <p className="mt-2 text-center font-mono text-[11px] font-bold text-[var(--cv-text-body)]">
              {s.tokens}/5 tokens · refill 2/s
            </p>
            {s.phase === 'burst' && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex justify-center gap-1">
                {Array.from({ length: 8 }, (_, i) => (
                  <span key={i} className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-black ${i < 5 ? 'bg-[#eef9f2] text-[#15803d]' : 'bg-[#fdeef1] text-[#b03a54]'}`}>
                    {i < 5 ? '200' : '429'}
                  </span>
                ))}
              </motion.div>
            )}
            {s.phase === 'refill' && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-center text-[11px] font-bold text-[#15803d]">
                +2 tokens · rejected clients retry with backoff
              </motion.p>
            )}
          </div>
        </div>
      );
    }}
  </StepPlayerShell>
);

export default SdCacheViz;
