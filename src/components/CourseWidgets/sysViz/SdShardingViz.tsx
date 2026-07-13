import React from 'react';
import { motion } from 'framer-motion';
import { SplitSquareHorizontal } from 'lucide-react';
import type { CourseWidgetProps } from '../types';
import StepPlayerShell from '../algoViz/StepPlayerShell';

/**
 * Sharding animation — keys hash into shards, a celebrity tenant creates a
 * hot shard, and a split fixes it. Skew is the villain, not the hash.
 */

interface ShardState { id: string; fill: number; hot?: boolean; isNew?: boolean }
interface Step { note: string; shards: ShardState[]; routedKey?: string; routedTo?: string }

const STEPS: Step[] = [
  {
    note: 'hash(tenant_id) % 4 routes every key to one of four shards. Even distribution — each shard holds ~25% of the data.',
    shards: [{ id: 'S0', fill: 25 }, { id: 'S1', fill: 25 }, { id: 'S2', fill: 25 }, { id: 'S3', fill: 25 }],
  },
  {
    note: 'Key "tenant:4213" hashes to shard S2. Any node can compute the route — no lookup table, no coordinator.',
    shards: [{ id: 'S0', fill: 25 }, { id: 'S1', fill: 25 }, { id: 'S2', fill: 27 }, { id: 'S3', fill: 25 }],
    routedKey: 'tenant:4213', routedTo: 'S2',
  },
  {
    note: 'One tenant goes viral. The hash is still perfectly uniform ACROSS tenants — but this tenant alone is 40% of all traffic. S2 is hot: 92% load while the fleet average is 48%.',
    shards: [{ id: 'S0', fill: 30 }, { id: 'S1', fill: 32 }, { id: 'S2', fill: 92, hot: true }, { id: 'S3', fill: 34 }],
  },
  {
    note: 'Detection matters: per-shard p95 and load — never the fleet average, which still looks healthy (48%).',
    shards: [{ id: 'S0', fill: 30 }, { id: 'S1', fill: 32 }, { id: 'S2', fill: 92, hot: true }, { id: 'S3', fill: 34 }],
  },
  {
    note: 'Fix: split the hot range. S2\'s keys move to S2a + S2b while reads dual-route and writes are fenced by an ownership epoch.',
    shards: [{ id: 'S0', fill: 30 }, { id: 'S1', fill: 32 }, { id: 'S2a', fill: 48, isNew: true }, { id: 'S2b', fill: 46, isNew: true }, { id: 'S3', fill: 34 }],
  },
  {
    note: 'Balanced again. Alternative fixes: salt the hot key (tenant:4213#1..8) or cache it in front. Say the trade-off: salting breaks single-key ordering.',
    shards: [{ id: 'S0', fill: 30 }, { id: 'S1', fill: 32 }, { id: 'S2a', fill: 48 }, { id: 'S2b', fill: 46 }, { id: 'S3', fill: 34 }],
  },
];

const SdShardingViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={SplitSquareHorizontal}
    title="Sharding · hot shards and how to split them"
    totalSteps={STEPS.length}
    nextLabel="Advance"
    captions={STEPS.map((s) => s.note)}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Lesson complete! Shard key from the dominant access path, detect skew per-shard, fix with split / salt / cache — and always name the trade-off."
    todoText="Watch a uniform hash develop a hot shard, then split it."
    legend={
      <>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#b9e3c8] bg-[#eef9f2] align-middle" /> healthy shard</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#b03a54] bg-[#fdeef1] align-middle" /> hot shard (skew)</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-[#5f8fd9] bg-[#ecf4fd] align-middle" /> split target</span>
      </>
    }
  >
    {(step) => {
      const s = STEPS[step];
      return (
        <div className="mx-auto max-w-lg">
          {/* Router */}
          <div className="flex justify-center">
            <div className="rounded-xl border-2 border-[var(--cv-action-border)] bg-[var(--cv-action-soft-bg)] px-4 py-1.5 font-mono text-[11px] font-extrabold text-[var(--cv-action-primary)]">
              route = hash(tenant_id) % {s.shards.length}
            </div>
          </div>
          {s.routedKey && (
            <motion.p
              key={step}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1.5 text-center font-mono text-[11px] font-bold text-[#1861a8]"
            >
              {s.routedKey} → {s.routedTo}
            </motion.p>
          )}
          {/* Shards */}
          <div className="mt-4 flex items-end justify-center gap-3">
            {s.shards.map((shard) => {
              const cls = shard.hot
                ? 'border-[#b03a54] bg-[#fdeef1]'
                : shard.isNew
                  ? 'border-[#5f8fd9] bg-[#ecf4fd]'
                  : 'border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)]';
              const barColor = shard.hot ? '#b03a54' : shard.fill > 60 ? '#e8a33d' : '#15803d';
              const highlighted = s.routedTo === shard.id;
              return (
                <motion.div
                  key={shard.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: highlighted ? 1.06 : 1, x: shard.hot && step === 2 ? [0, -2, 2, -2, 0] : 0 }}
                  className={`flex w-20 flex-col items-center rounded-xl border-2 p-2.5 ${cls} ${highlighted ? 'ring-2 ring-[#5f8fd9]' : ''}`}
                >
                  <span className="text-xs font-extrabold text-[var(--cv-text-heading)]">{shard.id}</span>
                  <div className="mt-2 flex h-20 w-6 items-end overflow-hidden rounded-md border border-[var(--cv-border-warm)] bg-black/5">
                    <motion.div
                      className="w-full rounded-sm"
                      animate={{ height: `${shard.fill}%` }}
                      transition={{ duration: 0.6 }}
                      style={{ backgroundColor: barColor }}
                    />
                  </div>
                  <span className="mt-1.5 font-mono text-[10px] font-black" style={{ color: barColor }}>{shard.fill}%</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      );
    }}
  </StepPlayerShell>
);

export default SdShardingViz;
