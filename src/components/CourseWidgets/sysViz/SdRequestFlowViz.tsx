import React from 'react';
import { motion } from 'framer-motion';
import { KeyRound } from 'lucide-react';
import type { CourseWidgetProps } from '../types';
import StepPlayerShell from '../algoViz/StepPlayerShell';

/**
 * Idempotency sequence animation — the API & data-model chapter's hero.
 * A create request succeeds, the ACK is lost, the client retries with the
 * SAME idempotency key, and the dedupe check prevents a duplicate row.
 */

const LANES = [
  { id: 'client', label: 'Client', x: 8 },
  { id: 'api', label: 'API', x: 36 },
  { id: 'dedupe', label: 'Dedupe store', x: 64 },
  { id: 'db', label: 'Database', x: 92 },
];

interface Msg { from: number; to: number; y: number; label: string; tone: 'blue' | 'green' | 'red' | 'amber'; dashed?: boolean }

// y in % of diagram height
const MESSAGES: Msg[] = [
  { from: 0, to: 1, y: 16, label: 'POST /pay  key=abc123', tone: 'blue' },
  { from: 1, to: 2, y: 28, label: 'seen abc123? → no', tone: 'amber' },
  { from: 1, to: 3, y: 40, label: 'INSERT payment (1 row)', tone: 'green' },
  { from: 1, to: 0, y: 52, label: '✗ 201 ACK lost in network', tone: 'red', dashed: true },
  { from: 0, to: 1, y: 66, label: 'RETRY  key=abc123 (same!)', tone: 'blue' },
  { from: 1, to: 2, y: 78, label: 'seen abc123? → YES', tone: 'amber' },
  { from: 1, to: 0, y: 90, label: '201 — prior result, NO 2nd row', tone: 'green' },
];

const TONE = { blue: '#5f8fd9', green: '#15803d', red: '#b03a54', amber: '#e8a33d' };

const captions = [
  'Networks lose responses. Without an idempotency key, every client retry risks a DUPLICATE payment. Watch the safe version.',
  'The client sends a create request carrying an idempotency key it generated: abc123.',
  'Before doing work, the API asks the dedupe store: have I seen abc123? Not yet — proceed.',
  'The write lands: exactly one payment row. The dedupe store records abc123 → result.',
  'Disaster (the normal kind): the 201 response is lost. The client has NO idea whether the payment happened.',
  'The client retries — with the SAME key. This is the whole contract: retries reuse the key.',
  'The dedupe store recognizes abc123. The API skips the insert entirely.',
  'The client gets the original result. One retry, one row, zero double-charges — that\'s idempotency.',
];

const SdRequestFlowViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={KeyRound}
    title="Idempotent writes · the lost-ACK retry"
    totalSteps={MESSAGES.length + 1}
    nextLabel="Next message"
    captions={captions}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Lesson complete! Idempotency key + dedupe check = safe retries. Every payment, order, and booking API you design needs this exact sequence."
    todoText="Play the sequence through the lost ACK and the safe retry."
    legend={
      <>
        <span><span className="mr-1.5 inline-block h-0.5 w-5 bg-[#5f8fd9] align-middle" /> request</span>
        <span><span className="mr-1.5 inline-block h-0.5 w-5 bg-[#15803d] align-middle" /> success</span>
        <span><span className="mr-1.5 inline-block h-0.5 w-5 border-t-2 border-dashed border-[#b03a54] align-middle" /> lost response</span>
      </>
    }
  >
    {(step) => (
      <div className="flex justify-center">
        <svg viewBox="0 0 400 260" className="w-full max-w-lg" role="img" aria-label="Idempotent request sequence diagram">
          {/* Lifelines */}
          {LANES.map((lane) => (
            <g key={lane.id}>
              <rect x={lane.x * 4 - 34} y={2} width={68} height={22} rx={6} className="fill-[var(--cv-surface-warm-muted,rgba(0,0,0,0.04))] stroke-[var(--cv-border-warm)]" strokeWidth={1.5} />
              <text x={lane.x * 4} y={17} textAnchor="middle" className="fill-[var(--cv-text-heading)] text-[11px] font-bold">{lane.label}</text>
              <line x1={lane.x * 4} y1={26} x2={lane.x * 4} y2={254} strokeDasharray="3 4" className="stroke-[var(--cv-border-warm)]" strokeWidth={1.5} />
            </g>
          ))}
          {/* Messages */}
          {MESSAGES.map((msg, i) => {
            if (step < i + 1) return null;
            const x1 = LANES[msg.from].x * 4;
            const x2 = LANES[msg.to].x * 4;
            const y = 26 + (msg.y / 100) * 220;
            const color = TONE[msg.tone];
            const isNew = step === i + 1;
            return (
              <motion.g key={i} initial={isNew ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <motion.line
                  x1={x1} y1={y} y2={y}
                  initial={isNew ? { x2: x1 } : { x2 }}
                  animate={{ x2 }}
                  transition={{ duration: 0.45 }}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray={msg.dashed ? '5 4' : undefined}
                  markerEnd={msg.dashed ? undefined : `url(#arr-${msg.tone})`}
                />
                {msg.dashed && <text x={(x1 + x2) / 2} y={y + 4} textAnchor="middle" fontSize="12" fill={color}>✕</text>}
                <text x={(x1 + x2) / 2} y={y - 5} textAnchor="middle" className="font-mono text-[9px] font-bold" fill={color}>{msg.label}</text>
              </motion.g>
            );
          })}
          <defs>
            {Object.entries(TONE).map(([tone, color]) => (
              <marker key={tone} id={`arr-${tone}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill={color} />
              </marker>
            ))}
          </defs>
        </svg>
      </div>
    )}
  </StepPlayerShell>
);

export default SdRequestFlowViz;
