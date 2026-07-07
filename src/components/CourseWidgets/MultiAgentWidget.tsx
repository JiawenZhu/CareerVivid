import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, RotateCcw } from 'lucide-react';
import type { CourseWidgetProps } from './types';

/**
 * Multi-agent mission control — the learner plays supervisor, routing
 * subtasks to specialist agents. Correct routing animates the pipeline
 * toward a shipped feature; wrong routing gets a polite refusal.
 * Completes when the mission ships.
 */

type AgentId = 'researcher' | 'builder' | 'reviewer';

const AGENTS: { id: AgentId; name: string; emoji: string; specialty: string }[] = [
  { id: 'researcher', name: 'Researcher', emoji: '🔎', specialty: 'gathers sources & data' },
  { id: 'builder', name: 'Builder', emoji: '🔨', specialty: 'implements & ships code' },
  { id: 'reviewer', name: 'Reviewer', emoji: '🧐', specialty: 'audits quality & correctness' },
];

interface Subtask {
  id: string;
  text: string;
  owner: AgentId;
  result: string;
  refusals: Record<AgentId, string>;
}

const SUBTASKS: Subtask[] = [
  {
    id: 't1',
    text: 'Collect salary data sources for the comparison feature',
    owner: 'researcher',
    result: '📚 Researcher returns 4 vetted salary datasets with licenses checked.',
    refusals: {
      researcher: '',
      builder: '🔨 Builder: "I could scrape something… but I\'d just be guessing which sources are trustworthy. Not my lane."',
      reviewer: '🧐 Reviewer: "I audit work — there\'s nothing to audit yet."',
    },
  },
  {
    id: 't2',
    text: 'Implement the salary-comparison page from the data',
    owner: 'builder',
    result: '⚙️ Builder ships the page: charts render, filters work, tests pass.',
    refusals: {
      researcher: '🔎 Researcher: "I find information. Writing production code is the Builder\'s specialty."',
      builder: '',
      reviewer: '🧐 Reviewer: "Review before there\'s code? I\'d be reviewing air."',
    },
  },
  {
    id: 't3',
    text: 'Audit the numbers and check the charts for errors',
    owner: 'reviewer',
    result: '✅ Reviewer catches an off-by-1000 currency bug and signs off after the fix.',
    refusals: {
      researcher: '🔎 Researcher: "I already gathered the data — someone impartial should check the output."',
      builder: '🔨 Builder: "Reviewing my own code? That\'s how bugs ship. Give it to the Reviewer."',
      reviewer: '',
    },
  },
];

const MultiAgentWidget: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => {
  const [taskIndex, setTaskIndex] = useState(0);
  const [feed, setFeed] = useState<{ text: string; ok: boolean }[]>([]);
  const [busy, setBusy] = useState<AgentId | null>(null);

  const task = SUBTASKS[taskIndex];
  const shipped = taskIndex >= SUBTASKS.length;

  useEffect(() => {
    if (shipped && !completed) onComplete();
  }, [shipped, completed, onComplete]);

  const assign = (agent: AgentId) => {
    if (!task || busy) return;
    setBusy(agent);
    const right = agent === task.owner;
    setTimeout(() => {
      setFeed((prev) => [...prev, { text: right ? task.result : task.refusals[agent], ok: right }]);
      if (right) setTaskIndex((i) => i + 1);
      setBusy(null);
    }, 700);
  };

  const reset = () => {
    setTaskIndex(0);
    setFeed([]);
    setBusy(null);
  };

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">
          <Network size={13} /> Mission control — you are the supervisor
        </p>
        <button onClick={reset} className="inline-flex h-7 items-center gap-1 rounded-lg border border-[var(--cv-border-warm)] px-2.5 text-[11px] font-bold text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)]">
          <RotateCcw size={12} /> Restart
        </button>
      </div>

      {/* Pipeline progress */}
      <div className="mt-3 flex items-center gap-1">
        {SUBTASKS.map((t, i) => (
          <React.Fragment key={t.id}>
            <motion.div
              animate={{ backgroundColor: i < taskIndex ? '#10b981' : i === taskIndex ? '#6c63d8' : 'rgba(120,120,120,0.25)' }}
              className="h-2 flex-1 rounded-full"
            />
            {i < SUBTASKS.length - 1 && <span className="text-[10px] text-[var(--cv-text-muted)]">→</span>}
          </React.Fragment>
        ))}
        <span className="ml-2 text-base">{shipped ? '🚀' : '🏗️'}</span>
      </div>

      {/* Current subtask */}
      <div className="mt-4 min-h-[52px]">
        <AnimatePresence mode="wait">
          {task ? (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border-2 border-[var(--cv-action-border)] bg-[var(--cv-action-soft-bg,rgba(99,91,213,0.08))] p-3"
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--cv-action-primary)]">Subtask {taskIndex + 1} of {SUBTASKS.length}</p>
              <p className="mt-0.5 text-sm font-bold text-[var(--cv-text-heading)]">{task.text}</p>
            </motion.div>
          ) : (
            <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              🚀 Feature shipped! Three specialists, zero heroics.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Agents */}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {AGENTS.map((agent) => (
          <button
            key={agent.id}
            onClick={() => assign(agent.id)}
            disabled={shipped || busy !== null}
            className="group rounded-xl border border-[var(--cv-border-warm)] p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--cv-action-border)] hover:shadow-sm disabled:cursor-default"
          >
            <motion.span
              animate={busy === agent.id ? { rotate: [0, -8, 8, 0] } : {}}
              transition={{ repeat: busy === agent.id ? Infinity : 0, duration: 0.5 }}
              className="text-xl"
            >
              {agent.emoji}
            </motion.span>
            <p className="mt-1 text-xs font-extrabold text-[var(--cv-text-heading)]">{agent.name}</p>
            <p className="text-[10px] font-medium text-[var(--cv-text-muted)]">{agent.specialty}</p>
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="mt-3 grid gap-1">
        <AnimatePresence initial={false}>
          {feed.slice(-4).map((entry, i) => (
            <motion.p
              key={`${i}-${entry.text.slice(0, 12)}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${entry.ok
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'}`}
            >
              {entry.text}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>

      <p className="mt-3 text-[11px] font-medium text-[var(--cv-text-muted)]">
        {shipped || completed
          ? '✓ Lesson complete! Notice what you just did: decomposed a goal, matched tasks to specialties, and sequenced the work. That is the supervisor pattern — and why one do-everything agent loses to a routed team.'
          : 'Route each subtask to the right specialist. Wrong assignments don\'t break anything — the agents will tell you why they\'re the wrong pick.'}
      </p>
    </div>
  );
};

export default MultiAgentWidget;
