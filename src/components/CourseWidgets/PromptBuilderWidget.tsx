import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Blocks } from 'lucide-react';
import type { CourseWidgetProps } from './types';

/**
 * Prompt-anatomy builder — the learner toggles the five building blocks of a
 * structured prompt and watches the assembled prompt and the (simulated)
 * model response sharpen with each block. Completes with all five enabled.
 */

interface PromptBlock {
  id: string;
  label: string;
  text: string;
  benefit: string;
}

const BLOCKS: PromptBlock[] = [
  { id: 'role', label: 'Role', text: 'You are a senior career coach who reviews resumes for tech roles.', benefit: 'expertise & tone' },
  { id: 'task', label: 'Task', text: 'Review the resume bullet below and improve it.', benefit: 'what to actually do' },
  { id: 'context', label: 'Context', text: 'Candidate: backend engineer applying to a fintech startup.\nBullet: "Worked on APIs and fixed bugs."', benefit: 'grounding facts' },
  { id: 'examples', label: 'Example', text: 'Example rewrite: "Built APIs" → "Designed 12 REST APIs serving 40k req/min".', benefit: 'shows the pattern' },
  { id: 'format', label: 'Output format', text: 'Respond as JSON: {"score": 1-10, "issue": "...", "rewrite": "..."}', benefit: 'machine-readable' },
];

const RESPONSES: string[] = [
  'Resumes are important documents! There are many ways to improve them. Would you like some general tips?',
  'Here are some thoughts on improving resumes: use action verbs, quantify results, and keep bullets concise…',
  'Your bullet is vague. Try something like: "Developed and maintained backend APIs, resolving production issues."',
  'This bullet undersells the work. Stronger: "Built and maintained payment APIs for a fintech platform, cutting production bugs."',
  'Following the example\'s pattern: "Designed and hardened 8 payment APIs handling 25k req/min, reducing production incidents by 40%."',
  '{\n  "score": 4,\n  "issue": "Vague verbs, no scale, no outcome.",\n  "rewrite": "Designed and hardened 8 payment APIs handling 25k req/min, cutting production incidents by 40%."\n}',
];

const PromptBuilderWidget: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(['task']));

  const count = enabled.size;
  const hasFormat = enabled.has('format');
  const response = hasFormat && count === 5 ? RESPONSES[5] : RESPONSES[Math.min(count, 4)];
  const reliability = count * 20;

  const assembled = useMemo(
    () => BLOCKS.filter((b) => enabled.has(b.id)).map((b) => b.text).join('\n\n'),
    [enabled],
  );

  useEffect(() => {
    if (count === 5 && !completed) onComplete();
  }, [count, completed, onComplete]);

  const toggle = (id: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">
          <Blocks size={13} /> Prompt-anatomy builder
        </p>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[var(--cv-border-warm)]">
            <motion.div
              animate={{ width: `${reliability}%` }}
              className={`h-full rounded-full ${reliability >= 80 ? 'bg-emerald-500' : reliability >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
            />
          </div>
          <span className="text-[11px] font-bold tabular-nums text-[var(--cv-text-muted)]">{reliability}% reliable</span>
        </div>
      </div>

      {/* Block toggles */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {BLOCKS.map((block) => {
          const on = enabled.has(block.id);
          return (
            <button
              key={block.id}
              onClick={() => toggle(block.id)}
              className={`rounded-lg border px-3 py-1.5 text-left transition-all hover:-translate-y-0.5 ${on
                ? 'border-[var(--cv-action-border)] bg-[var(--cv-action-soft-bg,rgba(99,91,213,0.1))]'
                : 'border-dashed border-[var(--cv-border-warm)] opacity-70'}`}
            >
              <span className={`text-xs font-extrabold ${on ? 'text-[var(--cv-action-primary)]' : 'text-[var(--cv-text-muted)]'}`}>
                {on ? '✓ ' : '+ '}{block.label}
              </span>
              <span className="ml-1 text-[10px] font-medium text-[var(--cv-text-muted)]">{block.benefit}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {/* Assembled prompt */}
        <div className="rounded-xl bg-[#0f1117] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Your prompt</p>
          <AnimatePresence mode="popLayout">
            <div className="mt-1.5 grid gap-2">
              {BLOCKS.filter((b) => enabled.has(b.id)).map((block) => (
                <motion.pre
                  key={block.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="whitespace-pre-wrap rounded-md border-l-2 border-[#6c63d8] bg-white/5 p-2 font-mono text-[11px] leading-relaxed text-gray-200"
                >
                  {block.text}
                </motion.pre>
              ))}
              {count === 0 && <p className="font-mono text-[11px] text-gray-500">(empty prompt — good luck!)</p>}
            </div>
          </AnimatePresence>
        </div>

        {/* Simulated response */}
        <div className="rounded-xl bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.04))] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--cv-text-muted)]">Model response (simulated)</p>
          <motion.pre
            key={response}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mt-1.5 whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-[var(--cv-text-heading)]"
          >
            {response}
          </motion.pre>
        </div>
      </div>

      <p className="mt-3 text-[11px] font-medium text-[var(--cv-text-muted)]">
        {count === 5 || completed
          ? '✓ Lesson complete! Notice the jump when Output format landed: structured output is what lets code (and agents) consume model answers reliably.'
          : `${5 - count} block${5 - count === 1 ? '' : 's'} to go — toggle each one and watch what it changes in the response.`}
      </p>
    </div>
  );
};

export default PromptBuilderWidget;
