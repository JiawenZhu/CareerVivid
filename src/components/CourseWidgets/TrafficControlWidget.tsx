import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gauge } from 'lucide-react';
import type { CourseWidgetProps } from './types';

/**
 * Traffic control room — production incidents hit your AI app one at a time;
 * the learner flips infrastructure switches (cache / queue / rate-limit) and
 * watches the latency, cost, and error gauges respond. Completes when all
 * three incidents are resolved with the right control.
 */

type Control = 'cache' | 'queue' | 'rate-limit';

const CONTROLS: { id: Control; label: string; desc: string }[] = [
  { id: 'cache', label: '📦 Cache', desc: 'reuse answers for repeated requests' },
  { id: 'queue', label: '⏳ Queue', desc: 'move slow jobs to background workers' },
  { id: 'rate-limit', label: '🚦 Rate limit', desc: 'cap requests per user' },
];

interface Incident {
  id: string;
  alert: string;
  detail: string;
  fix: Control;
  /** Gauge values [latency, cost, errors] during the incident. */
  bad: [number, number, number];
  explain: string;
  wrongExplain: Record<Control, string>;
}

const INCIDENTS: Incident[] = [
  {
    id: 'i1',
    alert: '💸 Cost spike: +400% overnight',
    detail: 'Logs show thousands of users asking the identical question: "How do I export my resume as PDF?" — every single one hits the model.',
    fix: 'cache',
    bad: [55, 95, 20],
    explain: 'One answer, computed once, served thousands of times. Repeated identical work is a caching problem — cost collapses instantly.',
    wrongExplain: {
      cache: '',
      queue: 'Queueing delays the calls but you still pay for every one of them. The bill keeps climbing.',
      'rate-limit': 'These are thousands of *different* legit users — rate limiting them just makes them angry while costs stay high.',
    },
  },
  {
    id: 'i2',
    alert: '🔥 Timeouts: video-analysis requests failing',
    detail: 'Interview-recording analysis takes 3–4 minutes per video. HTTP requests time out at 30 seconds; users see errors and retry, making it worse.',
    fix: 'queue',
    bad: [95, 60, 90],
    explain: 'Minutes-long work can never live inside a request/response cycle. Queue it, return a job id, notify when done — errors vanish.',
    wrongExplain: {
      cache: 'Every video is unique — there is nothing to reuse. Cache hit rate: 0%.',
      queue: '',
      'rate-limit': 'Fewer requests still time out — 4 minutes of work does not fit in a 30-second window no matter how few arrive.',
    },
  },
  {
    id: 'i3',
    alert: '🤖 One API key sending 500 requests/minute',
    detail: 'A single account is hammering the resume-review endpoint — likely a scraper or a bug in their script. Latency is rising for everyone else.',
    fix: 'rate-limit',
    bad: [80, 75, 45],
    explain: 'One abusive client should never degrade everyone else. A per-user cap contains the blast radius, and honest users never notice it exists.',
    wrongExplain: {
      cache: 'Their requests are all slightly different, so cache barely helps — and you are still serving an abuser.',
      queue: 'Now the scraper\'s 500 rpm fills your queue, and legitimate jobs wait behind it. You queued the problem.',
      'rate-limit': '',
    },
  },
];

const GOOD: [number, number, number] = [22, 25, 5];

const GaugeBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div>
    <div className="flex items-baseline justify-between">
      <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--cv-text-muted)]">{label}</span>
      <span className={`text-[11px] font-extrabold tabular-nums ${value > 70 ? 'text-rose-600 dark:text-rose-400' : value > 40 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
        {value}%
      </span>
    </div>
    <div className="mt-0.5 h-2.5 overflow-hidden rounded-full bg-[var(--cv-border-warm)]">
      <motion.div
        animate={{ width: `${value}%`, backgroundColor: value > 70 ? '#e11d48' : value > 40 ? '#d97706' : '#10b981' }}
        transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        className="h-full rounded-full"
      />
    </div>
  </div>
);

const TrafficControlWidget: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => {
  const [incidentIndex, setIncidentIndex] = useState(0);
  const [resolvedFlash, setResolvedFlash] = useState(false);
  const [wrong, setWrong] = useState<string | null>(null);

  const incident = INCIDENTS[incidentIndex];
  const done = incidentIndex >= INCIDENTS.length;
  const gauges = useMemo(() => (done || resolvedFlash ? GOOD : incident?.bad ?? GOOD), [done, resolvedFlash, incident]);

  useEffect(() => {
    if (done && !completed) onComplete();
  }, [done, completed, onComplete]);

  const flip = (control: Control) => {
    if (!incident || resolvedFlash) return;
    if (control === incident.fix) {
      setWrong(null);
      setResolvedFlash(true);
      setTimeout(() => {
        setResolvedFlash(false);
        setIncidentIndex((i) => i + 1);
      }, 1600);
    } else {
      setWrong(incident.wrongExplain[control]);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">
          <Gauge size={13} /> Production control room
        </p>
        <span className="text-[11px] font-bold tabular-nums text-[var(--cv-text-muted)]">
          Incident {Math.min(incidentIndex + 1, INCIDENTS.length)}/{INCIDENTS.length}
        </span>
      </div>

      {/* Gauges */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <GaugeBar label="Latency" value={gauges[0]} />
        <GaugeBar label="Cost" value={gauges[1]} />
        <GaugeBar label="Errors" value={gauges[2]} />
      </div>

      {/* Incident */}
      <div className="mt-4 min-h-[80px]">
        <AnimatePresence mode="wait">
          {resolvedFlash ? (
            <motion.p key="resolved" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              ✓ Incident resolved — gauges recovering…
            </motion.p>
          ) : incident ? (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-xl border-2 border-rose-300/70 bg-rose-50/60 p-3 dark:border-rose-800 dark:bg-rose-950/30"
            >
              <p className="text-sm font-extrabold text-rose-700 dark:text-rose-300">{incident.alert}</p>
              <p className="mt-1 text-[12px] font-medium leading-relaxed text-[var(--cv-text-body)]">{incident.detail}</p>
            </motion.div>
          ) : (
            <motion.p key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              🟢 All systems healthy. Pager silent. Go build something.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {CONTROLS.map((control) => (
          <button
            key={control.id}
            onClick={() => flip(control.id)}
            disabled={done || resolvedFlash}
            className="rounded-xl border border-[var(--cv-border-warm)] p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--cv-action-border)] hover:shadow-sm disabled:cursor-default"
          >
            <p className="text-sm font-extrabold text-[var(--cv-text-heading)]">{control.label}</p>
            <p className="mt-0.5 text-[10px] font-medium text-[var(--cv-text-muted)]">{control.desc}</p>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {wrong && !resolvedFlash && (
          <motion.p
            key={wrong}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          >
            ✗ {wrong}
          </motion.p>
        )}
      </AnimatePresence>

      {(!wrong || resolvedFlash) && incident && !resolvedFlash && (
        <p className="mt-3 text-[11px] font-medium text-[var(--cv-text-muted)]">Flip the control that fixes the root cause — wrong flips explain why they fail.</p>
      )}
      {done && (
        <p className="mt-3 text-[11px] font-medium text-[var(--cv-text-muted)]">
          ✓ Lesson complete! The diagnostic pattern: repeated work → cache, slow work → queue, abusive traffic → rate limit. Monitoring tells you which one you're looking at.
        </p>
      )}
    </div>
  );
};

export default TrafficControlWidget;
