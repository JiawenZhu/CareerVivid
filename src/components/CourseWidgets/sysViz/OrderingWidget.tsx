import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListOrdered, RotateCcw } from 'lucide-react';
import type { CourseWidgetProps } from '../types';
import { getOrderingSet, type OrderingSet } from '../../../lib/systemDesignQuestionBank';

/**
 * Ordering exercise — tap the steps in the correct sequence. Correct taps
 * stack up green; wrong taps shake. Completes when the full sequence is built.
 */

/** Deterministic shuffle (stable across renders/SSR): sort by char-sum hash. */
const shuffle = (items: string[]): string[] =>
  [...items].sort((a, b) => {
    const h = (s: string) => [...s].reduce((t, ch) => (t * 31 + ch.charCodeAt(0)) % 9973, 7);
    return h(a) - h(b);
  });

const OrderingView: React.FC<CourseWidgetProps & { set: OrderingSet }> = ({ completed, onComplete, set }) => {
  const display = useMemo(() => shuffle(set.items), [set]);
  const [placedCount, setPlacedCount] = useState(0);
  const [wrongItem, setWrongItem] = useState<string | null>(null);
  const [misses, setMisses] = useState(0);
  const done = placedCount === set.items.length;

  const tap = (item: string) => {
    if (done) return;
    if (item === set.items[placedCount]) {
      const next = placedCount + 1;
      setPlacedCount(next);
      setWrongItem(null);
      if (next === set.items.length && !completed) onComplete();
    } else {
      setMisses((m) => m + 1);
      setWrongItem(item);
      window.setTimeout(() => setWrongItem(null), 700);
    }
  };

  const placed = set.items.slice(0, placedCount);
  const remaining = display.filter((item) => !placed.includes(item));

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">
          <ListOrdered size={13} /> {set.title}
        </p>
        <span className="text-[11px] font-bold tabular-nums text-[var(--cv-text-muted)]">{placedCount}/{set.items.length} placed · {misses} misses</span>
      </div>
      <p className="cv-design-body mt-1.5 text-sm">{set.instruction}</p>

      {/* Built sequence */}
      <div className="mt-3 min-h-[44px] rounded-xl border-2 border-dashed border-[var(--cv-border-warm)] p-2">
        <AnimatePresence>
          {placed.length === 0 && <p className="px-2 py-1 text-xs font-semibold text-[var(--cv-text-muted)]">Tap the first step below…</p>}
          {placed.map((item, i) => (
            <motion.div
              key={item}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-1.5 flex items-center gap-2 rounded-lg border-2 border-[#b9e3c8] bg-[#eef9f2] px-3 py-1.5 last:mb-0"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#15803d] text-[10px] font-black text-white">{i + 1}</span>
              <span className="text-xs font-bold text-[#15803d]">{item}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Remaining pool */}
      {!done && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {remaining.map((item) => (
            <motion.button
              key={item}
              type="button"
              onClick={() => tap(item)}
              animate={wrongItem === item ? { x: [0, -5, 5, -4, 0] } : {}}
              className={`rounded-lg border-2 px-3 py-1.5 text-xs font-semibold transition-colors ${wrongItem === item
                ? 'border-[#b03a54] bg-[#fdeef1] text-[#b03a54]'
                : 'border-[var(--cv-border-warm)] text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)]'}`}
            >
              {item}
            </motion.button>
          ))}
        </div>
      )}

      {done && (
        <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-xl bg-[#eef9f2] px-4 py-2.5 text-xs font-semibold leading-5 text-[#15803d]">
          ✓ {set.insight}
        </motion.p>
      )}

      <div className="mt-3 flex items-center justify-center">
        <button type="button" onClick={() => { setPlacedCount(0); setMisses(0); }} className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--cv-border-warm)] px-3 text-[11px] font-bold text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)]">
          <RotateCcw size={12} /> Restart
        </button>
      </div>
    </div>
  );
};

/** Factory: bind an ordering set from the question bank to a widget id. */
export const createOrderingWidget = (setId: string): React.FC<CourseWidgetProps> =>
  function ConfiguredOrdering(props) {
    const set = getOrderingSet(setId);
    if (!set) return null;
    return <OrderingView {...props} set={set} />;
  };

export default OrderingView;
