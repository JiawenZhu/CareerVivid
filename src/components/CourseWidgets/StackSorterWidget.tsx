import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Layers, RotateCcw, XCircle } from 'lucide-react';
import type { CourseWidgetProps } from './types';

/**
 * "Sort the AI stack" — the learner places real tools/concepts into the right
 * layer of the AI landscape. Instant feedback per placement; completes when
 * every card is placed correctly.
 */

type LayerId = 'foundation-model' | 'application-pattern' | 'agent-capability' | 'infrastructure' | 'evaluation';

const LAYERS: { id: LayerId; label: string; hint: string }[] = [
  { id: 'foundation-model', label: 'Foundation model', hint: 'The trained model itself' },
  { id: 'application-pattern', label: 'Application pattern', hint: 'How apps use models' },
  { id: 'agent-capability', label: 'Agent capability', hint: 'What lets an agent act' },
  { id: 'infrastructure', label: 'Infrastructure', hint: 'Systems around the model' },
  { id: 'evaluation', label: 'Evaluation', hint: 'How you measure quality' },
];

interface Card {
  id: string;
  label: string;
  layer: LayerId;
  why: string;
}

const CARDS: Card[] = [
  { id: 'gpt4', label: 'GPT-4 / Claude / Gemini', layer: 'foundation-model', why: 'These are trained foundation models exposed via APIs.' },
  { id: 'rag', label: 'RAG', layer: 'application-pattern', why: 'Retrieval-Augmented Generation is a pattern for feeding the model your data.' },
  { id: 'tool-use', label: 'Tool use / function calling', layer: 'agent-capability', why: 'Calling tools is what turns a chat model into an agent.' },
  { id: 'vector-db', label: 'Vector database', layer: 'infrastructure', why: 'It stores embeddings — supporting infrastructure, not intelligence.' },
  { id: 'eval-set', label: 'Eval set with scored cases', layer: 'evaluation', why: 'A repeatable set of graded test cases is how you measure quality.' },
  { id: 'memory', label: 'Long-term memory', layer: 'agent-capability', why: 'Remembering context across steps/sessions is an agent capability.' },
  { id: 'prompt-template', label: 'Prompt template', layer: 'application-pattern', why: 'Structured prompting is an application-level pattern.' },
  { id: 'gpu-queue', label: 'Request queue + cache', layer: 'infrastructure', why: 'Queues and caches keep AI apps fast and affordable.' },
];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const StackSorterWidget: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => {
  const [deck, setDeck] = useState<Card[]>(() => shuffle(CARDS));
  const [cursor, setCursor] = useState(0);
  const [placed, setPlaced] = useState<Record<LayerId, Card[]>>({
    'foundation-model': [], 'application-pattern': [], 'agent-capability': [], infrastructure: [], evaluation: [],
  });
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [misses, setMisses] = useState(0);

  const current = deck[cursor];
  const done = cursor >= deck.length;
  const score = useMemo(() => deck.length - misses, [deck.length, misses]);

  const place = (layer: LayerId) => {
    if (!current) return;
    const correct = current.layer === layer;
    if (correct) {
      setPlaced((prev) => ({ ...prev, [layer]: [...prev[layer], current] }));
      setFeedback({ correct: true, text: current.why });
      setCursor((i) => i + 1);
      if (cursor + 1 >= deck.length && !completed) onComplete();
    } else {
      setMisses((m) => m + 1);
      setFeedback({ correct: false, text: `Not quite — think about ${LAYERS.find((l) => l.id === current.layer)?.hint.toLowerCase()}.` });
    }
  };

  const reset = () => {
    setDeck(shuffle(CARDS));
    setCursor(0);
    setPlaced({ 'foundation-model': [], 'application-pattern': [], 'agent-capability': [], infrastructure: [], evaluation: [] });
    setFeedback(null);
    setMisses(0);
  };

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">
          <Layers size={13} /> Sort the AI stack
        </p>
        <button onClick={reset} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--cv-border-warm)] px-3 text-xs font-bold text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)]">
          <RotateCcw size={13} /> Restart
        </button>
      </div>

      {/* Current card */}
      <div className="mt-4 flex min-h-[64px] items-center justify-center">
        <AnimatePresence mode="wait">
          {current ? (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.85, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, y: -24, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="rounded-xl border-2 border-[var(--cv-action-border)] bg-[var(--cv-action-soft-bg,rgba(99,91,213,0.1))] px-5 py-3 text-sm font-extrabold text-[var(--cv-text-heading)] shadow-sm"
            >
              {current.label}
            </motion.div>
          ) : (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} className="mr-1 inline" />
              All {deck.length} sorted — {misses === 0 ? 'perfect run!' : `${score}/${deck.length} on the first try.`}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      {!done && (
        <p className="mt-1 text-center text-[11px] font-medium text-[var(--cv-text-muted)]">
          Card {cursor + 1} of {deck.length} — which layer does it belong to?
        </p>
      )}

      {/* Layers */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            onClick={() => place(layer.id)}
            disabled={done}
            className="group rounded-xl border border-dashed border-[var(--cv-border-warm)] p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--cv-action-border)] hover:shadow-sm disabled:cursor-default disabled:hover:translate-y-0"
          >
            <p className="text-[11px] font-extrabold text-[var(--cv-text-heading)]">{layer.label}</p>
            <p className="mt-0.5 text-[10px] font-medium text-[var(--cv-text-muted)]">{layer.hint}</p>
            <div className="mt-2 flex min-h-[20px] flex-wrap gap-1">
              <AnimatePresence>
                {placed[layer.id].map((card) => (
                  <motion.span
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                  >
                    {card.label}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {feedback && (
          <motion.div
            key={feedback.text}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-xs font-medium ${feedback.correct
              ? 'border-emerald-300/50 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-amber-300/60 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'}`}
          >
            {feedback.correct ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <XCircle size={14} className="mt-0.5 shrink-0" />}
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StackSorterWidget;
