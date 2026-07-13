import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, RotateCcw } from 'lucide-react';
import type { CourseWidgetProps } from './types';

/**
 * Agent-loop simulator — the learner IS the agent's tool router. Each turn
 * shows the agent's thought; picking the right tool advances the mission,
 * wrong tools burn iterations, and the loop guard kills runaway agents.
 * Completes when the mission succeeds.
 */

type ToolId = 'web_search' | 'price_filter' | 'send_email' | 'finish';

const TOOLS: { id: ToolId; label: string }[] = [
  { id: 'web_search', label: '🔎 web_search' },
  { id: 'price_filter', label: '🧮 price_filter' },
  { id: 'send_email', label: '✉️ send_email' },
  { id: 'finish', label: '🏁 finish' },
];

const MISSION_STEPS: { thought: string; correct: ToolId; observation: string }[] = [
  { thought: 'I need current flight prices from SFO to NYC — my training data is stale.', correct: 'web_search', observation: 'Found 3 flights: Delta $280, United $310, JetBlue $450.' },
  { thought: 'The user\'s budget is $300. I should filter these results.', correct: 'price_filter', observation: '1 flight under budget: Delta, $280, departs 9:40am.' },
  { thought: 'I have the itinerary. The user asked me to email it.', correct: 'send_email', observation: 'Email sent to user ✓ (itinerary attached).' },
  { thought: 'Task appears complete — flight found, filtered, and emailed.', correct: 'finish', observation: 'Agent stopped cleanly. Goal achieved.' },
];

const WRONG_OBSERVATIONS: Record<ToolId, string> = {
  web_search: 'Search returned the same results again. That iteration accomplished nothing.',
  price_filter: 'Nothing to filter yet — the tool returned an empty set.',
  send_email: 'Email failed: there is no itinerary to attach yet.',
  finish: 'Stopped early — the goal was NOT achieved. A real user would be left hanging.',
};

const MAX_ITERATIONS = 6;

interface LogEntry {
  kind: 'thought' | 'action' | 'observation' | 'system';
  text: string;
  ok?: boolean;
}

const AgentLoopWidget: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [iterations, setIterations] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([{ kind: 'system', text: 'GOAL: Find the cheapest SFO→NYC flight under $300 and email the itinerary.' }]);
  const [dead, setDead] = useState(false);

  const step = MISSION_STEPS[stepIndex];
  const succeeded = stepIndex >= MISSION_STEPS.length;

  useEffect(() => {
    if (succeeded && !completed) onComplete();
  }, [succeeded, completed, onComplete]);

  const pickTool = (tool: ToolId) => {
    if (!step || dead) return;
    const isEarlyFinish = tool === 'finish' && step.correct !== 'finish';
    const right = tool === step.correct;
    const nextIterations = iterations + 1;
    const entries: LogEntry[] = [
      { kind: 'thought', text: step.thought },
      { kind: 'action', text: `call ${tool}()`, ok: right },
      { kind: 'observation', text: right ? step.observation : WRONG_OBSERVATIONS[tool], ok: right },
    ];
    setIterations(nextIterations);
    if (right) {
      setStepIndex((i) => i + 1);
    } else if (isEarlyFinish || nextIterations >= MAX_ITERATIONS) {
      entries.push({ kind: 'system', text: isEarlyFinish
        ? '✗ RUN FAILED — the agent declared victory without doing the work. Always verify goal completion before finishing.'
        : `✗ LOOP GUARD TRIPPED — ${MAX_ITERATIONS} iterations without completing the goal. Without a cap, this agent would burn tokens forever. Reset and route smarter.` });
      setDead(true);
    }
    setLog((prev) => [...prev, ...entries]);
  };

  const reset = () => {
    setStepIndex(0);
    setIterations(0);
    setDead(false);
    setLog([{ kind: 'system', text: 'GOAL: Find the cheapest SFO→NYC flight under $300 and email the itinerary.' }]);
  };

  const style: Record<LogEntry['kind'], string> = {
    system: 'text-[var(--cv-action-primary)] font-extrabold',
    thought: 'text-[var(--cv-text-body)] italic',
    action: 'text-[var(--cv-text-heading)] font-bold',
    observation: 'text-[var(--cv-text-muted)]',
  };

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">
          <Bot size={13} /> Agent-loop simulator
        </p>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold tabular-nums ${iterations >= MAX_ITERATIONS - 1 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--cv-text-muted)]'}`}>
            Iteration {iterations}/{MAX_ITERATIONS}
          </span>
          <button onClick={reset} className="inline-flex h-7 items-center gap-1 rounded-lg border border-[var(--cv-border-warm)] px-2.5 text-[11px] font-bold text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)]">
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>

      {/* Trace log */}
      <div className="mt-3 max-h-64 overflow-y-auto rounded-xl bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.04))] p-3 font-mono text-[11px] leading-relaxed">
        <AnimatePresence initial={false}>
          {log.map((entry, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`${style[entry.kind]} ${entry.ok === false ? 'text-rose-600 dark:text-rose-400' : ''}`}
            >
              {entry.kind === 'thought' && '💭 '}
              {entry.kind === 'action' && '⚡ '}
              {entry.kind === 'observation' && '👁 '}
              {entry.text}
            </motion.p>
          ))}
        </AnimatePresence>
        {succeeded && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 font-extrabold text-emerald-600 dark:text-emerald-400">
            ✓ MISSION COMPLETE in {iterations} iterations {iterations === 4 ? '— a perfect run!' : ''}
          </motion.p>
        )}
      </div>

      {/* Current thought + tool picker */}
      {!succeeded && !dead && step && (
        <div className="mt-3">
          <motion.p key={stepIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13px] font-medium italic text-[var(--cv-text-heading)]">
            💭 "{step.thought}"
          </motion.p>
          <p className="mt-2 text-[11px] font-bold text-[var(--cv-text-muted)]">You're the router — which tool should the agent call?</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => pickTool(tool.id)}
                className="inline-flex h-9 items-center rounded-lg border border-[var(--cv-border-warm)] px-3 font-mono text-xs font-bold text-[var(--cv-text-heading)] transition-all hover:-translate-y-0.5 hover:border-[var(--cv-action-border)]"
              >
                {tool.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-[11px] font-medium text-[var(--cv-text-muted)]">
        {succeeded || completed
          ? '✓ Lesson complete! Thought → Action → Observation, with a hard iteration cap — that loop plus a stop condition is the whole skeleton of every production agent.'
          : dead
            ? 'The run failed — hit Reset. Failure is the lesson: this is why agents need loop guards and goal verification.'
            : 'Wrong tools waste iterations, and the loop guard kills the run at 6. Choose like tokens cost money — because they do.'}
      </p>
    </div>
  );
};

export default AgentLoopWidget;
