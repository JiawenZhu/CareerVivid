import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Search } from 'lucide-react';
import type { CourseWidgetProps } from './types';

/**
 * RAG pipeline visualizer — ask a question and watch it flow through
 * embed → similarity search → context assembly → grounded answer.
 * Then flip RAG off and watch the same model hallucinate confidently.
 * Completes after one grounded run AND one no-RAG comparison.
 */

interface Chunk {
  id: string;
  title: string;
  text: string;
  scores: Record<string, number>;
}

const CHUNKS: Chunk[] = [
  { id: 'c1', title: 'PTO policy §2', text: 'New employees accrue 18 vacation days in year one, rising to 23 after two years.', scores: { q1: 0.91, q2: 0.12, q3: 0.08 } },
  { id: 'c2', title: 'Expense guide', text: 'Meals on business trips are reimbursed up to $65/day with receipts.', scores: { q1: 0.15, q2: 0.88, q3: 0.11 } },
  { id: 'c3', title: 'Onboarding FAQ', text: 'Laptops are ordered after signing; expect delivery within 5 business days.', scores: { q1: 0.22, q2: 0.09, q3: 0.93 } },
  { id: 'c4', title: 'Office map', text: 'The 4th-floor kitchen has espresso machines; the roof terrace opens in summer.', scores: { q1: 0.05, q2: 0.18, q3: 0.13 } },
  { id: 'c5', title: 'Values memo', text: 'We default to transparency and write decisions down.', scores: { q1: 0.09, q2: 0.07, q3: 0.1 } },
];

const QUESTIONS = [
  { id: 'q1', text: 'How many vacation days do new employees get?', grounded: 'New employees get **18 vacation days** in their first year, rising to 23 after two years. [PTO policy §2]', hallucinated: 'New employees typically receive 10–15 vacation days, in line with industry standards.' },
  { id: 'q2', text: 'What is the meal budget on business trips?', grounded: 'Meals are reimbursed up to **$65/day** with receipts. [Expense guide]', hallucinated: 'The company offers a generous $100 daily meal allowance for travelers.' },
  { id: 'q3', text: 'When will my laptop arrive after signing?', grounded: 'Laptops arrive within **5 business days** of signing. [Onboarding FAQ]', hallucinated: 'Your laptop will be waiting on your desk on day one.' },
];

type Stage = 'idle' | 'embedding' | 'searching' | 'assembling' | 'answering';

const RagPipelineWidget: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => {
  const [ragOn, setRagOn] = useState(true);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [ranGrounded, setRanGrounded] = useState(false);
  const [ranHallucinated, setRanHallucinated] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const question = QUESTIONS.find((q) => q.id === questionId);
  const topChunks = question
    ? [...CHUNKS].sort((a, b) => b.scores[question.id] - a.scores[question.id]).slice(0, 2)
    : [];

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (ranGrounded && ranHallucinated && !completed) onComplete();
  }, [ranGrounded, ranHallucinated, completed, onComplete]);

  const ask = (id: string) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setQuestionId(id);
    if (ragOn) {
      setStage('embedding');
      timers.current.push(setTimeout(() => setStage('searching'), 900));
      timers.current.push(setTimeout(() => setStage('assembling'), 2100));
      timers.current.push(setTimeout(() => { setStage('answering'); setRanGrounded(true); }, 3000));
    } else {
      setStage('answering');
      setRanHallucinated(true);
    }
  };

  const stageLabel: Record<Stage, string> = {
    idle: 'Pick a question to start the pipeline',
    embedding: '1/4 — Embedding the query into a vector…',
    searching: '2/4 — Scoring every chunk by similarity…',
    assembling: '3/4 — Stuffing the best chunks into the prompt…',
    answering: ragOn ? '4/4 — Answering from the retrieved context' : 'Answering from training data alone (no retrieval)',
  };

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">
          <Database size={13} /> RAG pipeline
        </p>
        <button
          onClick={() => { setRagOn((v) => !v); setStage('idle'); setQuestionId(null); }}
          className={`h-7 rounded-lg px-3 text-[11px] font-extrabold transition-colors ${ragOn
            ? 'bg-emerald-500 text-white'
            : 'bg-rose-500 text-white'}`}
        >
          Retrieval: {ragOn ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Questions */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {QUESTIONS.map((q) => (
          <button
            key={q.id}
            onClick={() => ask(q.id)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition-all hover:-translate-y-0.5 ${questionId === q.id
              ? 'border-[var(--cv-action-border)] bg-[var(--cv-action-soft-bg,rgba(99,91,213,0.1))] text-[var(--cv-action-primary)]'
              : 'border-[var(--cv-border-warm)] text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)]'}`}
          >
            <Search size={12} /> {q.text}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[11px] font-bold text-[var(--cv-text-muted)]">{stageLabel[stage]}</p>

      {/* Chunk store */}
      {ragOn && (
        <div className="mt-2 grid gap-1">
          {CHUNKS.map((chunk) => {
            const score = question ? chunk.scores[question.id] : 0;
            const isTop = stage !== 'idle' && stage !== 'embedding' && topChunks.some((c) => c.id === chunk.id);
            const dimmed = (stage === 'assembling' || stage === 'answering') && !isTop;
            return (
              <motion.div
                key={chunk.id}
                animate={{ opacity: dimmed ? 0.3 : 1, scale: isTop && stage === 'assembling' ? 1.01 : 1 }}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${isTop
                  ? 'border-[var(--cv-action-border)] bg-[var(--cv-action-soft-bg,rgba(99,91,213,0.08))]'
                  : 'border-[var(--cv-border-warm)]'}`}
              >
                <span className="w-24 shrink-0 text-[10px] font-extrabold text-[var(--cv-text-heading)]">{chunk.title}</span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--cv-text-muted)]">{chunk.text}</span>
                <div className="relative h-2 w-20 shrink-0 overflow-hidden rounded-full bg-[var(--cv-border-warm)]">
                  <motion.div
                    animate={{ width: stage === 'searching' || stage === 'assembling' || stage === 'answering' ? `${score * 100}%` : '0%' }}
                    transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${score > 0.5 ? 'bg-emerald-500' : 'bg-gray-400'}`}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-[10px] font-bold tabular-nums text-[var(--cv-text-muted)]">
                  {stage === 'idle' || stage === 'embedding' ? '—' : score.toFixed(2)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Answer */}
      <AnimatePresence mode="wait">
        {stage === 'answering' && question && (
          <motion.div
            key={`${question.id}-${ragOn}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 rounded-xl border p-3 text-[13px] font-medium leading-relaxed ${ragOn
              ? 'border-emerald-300/60 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
              : 'border-rose-300/60 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'}`}
          >
            {(ragOn ? question.grounded : question.hallucinated).split('**').map((part, i) =>
              i % 2 === 1 ? <b key={i}>{part}</b> : <span key={i}>{part}</span>,
            )}
            <p className="mt-1.5 text-[10px] font-extrabold uppercase tracking-wide opacity-70">
              {ragOn ? '✓ Grounded — every claim traces to a retrieved chunk' : '⚠ Hallucinated — fluent, confident, and wrong. The model never saw your handbook.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-3 text-[11px] font-medium text-[var(--cv-text-muted)]">
        {(ranGrounded && ranHallucinated) || completed
          ? '✓ Lesson complete! Same model, same question — retrieval is the only difference between a citation and a confident guess.'
          : `To complete: run one question with retrieval ON ${ranGrounded ? '✓' : ''} and one with it OFF ${ranHallucinated ? '✓' : ''}.`}
      </p>
    </div>
  );
};

export default RagPipelineWidget;
