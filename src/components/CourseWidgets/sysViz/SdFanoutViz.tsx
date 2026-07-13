import React from 'react';
import { motion } from 'framer-motion';
import { MessagesSquare } from 'lucide-react';
import type { CourseWidgetProps } from '../types';
import StepPlayerShell from '../algoViz/StepPlayerShell';

/**
 * Real-time chat fan-out — persist to the log FIRST, then push over sockets;
 * the offline member catches up from the log on reconnect. Radial SVG layout.
 */

const CENTER = { x: 200, y: 118 };
const LOG = { x: 200, y: 30 };
const SENDER = { x: 40, y: 118 };
const CLIENTS = [
  { id: 'c1', x: 330, y: 48, online: true },
  { id: 'c2', x: 360, y: 118, online: true },
  { id: 'c3', x: 330, y: 188, online: false }, // offline member
  { id: 'c4', x: 230, y: 210, online: true },
];

interface Step { note: string; phase: 'send' | 'persist' | 'fanout' | 'offline' | 'reconnect' }

const STEPS: Step[] = [
  { phase: 'send', note: 'A member sends a message over their WebSocket to the gateway. The gateway owns CONNECTIONS — it must not be the source of truth for history.' },
  { phase: 'persist', note: 'Persist FIRST: append to the durable, per-room-ordered message log and get a sequence number. Only a committed message may be delivered.' },
  { phase: 'fanout', note: 'Now fan out: push the committed message to every CONNECTED member\'s socket. 3 of 4 members are online — they see it in ~100 ms.' },
  { phase: 'offline', note: 'Member 3 is offline. Nothing special happens — the message is already safe in the log. Presence is best-effort; durability never depends on it.' },
  { phase: 'reconnect', note: 'Member 3 reconnects and sends their last-seen cursor (seq 41). The gateway replays 42…45 from the log — perfect catch-up, no gaps, no duplicates.' },
];

const SdFanoutViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={MessagesSquare}
    title="Chat fan-out · persist first, push second"
    totalSteps={STEPS.length}
    nextLabel="Advance"
    captions={STEPS.map((s) => s.note)}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Lesson complete! Log append → fan-out to sockets → cursor replay for offline members. The log is the truth; sockets are just the fast path."
    todoText="Follow one message from send to durable log to every screen — including the offline one."
    legend={
      <>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-[#15803d] bg-[#eef9f2] align-middle" /> online socket</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-[var(--cv-border-warm)] opacity-50 align-middle" /> offline</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border-2 border-[#e8a33d] bg-[#fdf3d7] align-middle" /> durable log</span>
      </>
    }
  >
    {(step) => {
      const phase = STEPS[step].phase;
      return (
        <div className="flex justify-center">
          <svg viewBox="0 0 400 240" className="w-full max-w-lg" role="img" aria-label="Chat message fan-out">
            {/* Edges */}
            <line x1={SENDER.x + 24} y1={SENDER.y} x2={CENTER.x - 34} y2={CENTER.y} strokeWidth={2} className={phase === 'send' ? 'stroke-[#5f8fd9]' : 'stroke-[var(--cv-border-warm)]'} />
            <line x1={CENTER.x} y1={CENTER.y - 16} x2={LOG.x} y2={LOG.y + 16} strokeWidth={2.5} className={phase === 'persist' ? 'stroke-[#e8a33d]' : 'stroke-[var(--cv-border-warm)]'} />
            {CLIENTS.map((c) => {
              const active = (phase === 'fanout' && c.online) || (phase === 'reconnect' && !c.online);
              return (
                <line
                  key={c.id}
                  x1={CENTER.x + 30} y1={CENTER.y} x2={c.x - 16} y2={c.y}
                  strokeWidth={2}
                  strokeDasharray={c.online ? undefined : '4 4'}
                  className={active ? (c.online ? 'stroke-[#15803d]' : 'stroke-[#5f8fd9]') : 'stroke-[var(--cv-border-warm)]'}
                />
              );
            })}

            {/* Moving message dots */}
            {phase === 'send' && (
              <motion.circle r={5} fill="#5f8fd9" initial={{ cx: SENDER.x + 24, cy: SENDER.y }} animate={{ cx: CENTER.x - 34, cy: CENTER.y }} transition={{ duration: 0.8, repeat: Infinity }} />
            )}
            {phase === 'persist' && (
              <motion.circle r={5} fill="#e8a33d" initial={{ cx: CENTER.x, cy: CENTER.y - 16 }} animate={{ cx: LOG.x, cy: LOG.y + 16 }} transition={{ duration: 0.8, repeat: Infinity }} />
            )}
            {phase === 'fanout' && CLIENTS.filter((c) => c.online).map((c, i) => (
              <motion.circle key={c.id} r={4.5} fill="#15803d" initial={{ cx: CENTER.x + 30, cy: CENTER.y }} animate={{ cx: c.x - 16, cy: c.y }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
            ))}
            {phase === 'reconnect' && (
              <motion.circle r={4.5} fill="#5f8fd9" initial={{ cx: CENTER.x + 30, cy: CENTER.y }} animate={{ cx: CLIENTS[2].x - 16, cy: CLIENTS[2].y }} transition={{ duration: 0.8, repeat: Infinity }} />
            )}

            {/* Log */}
            <motion.g animate={{ scale: phase === 'persist' ? 1.06 : 1 }} style={{ transformOrigin: `${LOG.x}px ${LOG.y}px` }}>
              <rect x={LOG.x - 58} y={LOG.y - 16} width={116} height={32} rx={8} strokeWidth={2.5}
                className={phase === 'persist' || phase === 'reconnect' ? 'fill-[#fdf3d7] stroke-[#e8a33d]' : 'fill-[var(--cv-surface-warm-card,#fff)] stroke-[var(--cv-border-warm)]'} />
              <text x={LOG.x} y={LOG.y - 1} textAnchor="middle" className="fill-[var(--cv-text-heading)] text-[10px] font-bold">Message log</text>
              <text x={LOG.x} y={LOG.y + 11} textAnchor="middle" className="fill-[var(--cv-text-muted)] font-mono text-[8px] font-bold">
                {step >= 1 ? 'seq …41, 42✓' : 'seq …41'}
              </text>
            </motion.g>

            {/* Sender */}
            <circle cx={SENDER.x} cy={SENDER.y} r={20} strokeWidth={2.5} className={phase === 'send' ? 'fill-[#ecf4fd] stroke-[#5f8fd9]' : 'fill-[var(--cv-surface-warm-card,#fff)] stroke-[var(--cv-border-warm)]'} />
            <text x={SENDER.x} y={SENDER.y + 4} textAnchor="middle" fontSize="12">💬</text>
            <text x={SENDER.x} y={SENDER.y + 34} textAnchor="middle" className="fill-[var(--cv-text-muted)] text-[9px] font-bold">sender</text>

            {/* Gateway */}
            <rect x={CENTER.x - 34} y={CENTER.y - 16} width={64} height={32} rx={8} strokeWidth={2.5} className="fill-[var(--cv-action-soft-bg,#efeefe)] stroke-[var(--cv-action-primary,#635bd5)]" />
            <text x={CENTER.x - 2} y={CENTER.y + 4} textAnchor="middle" className="fill-[var(--cv-action-primary,#635bd5)] text-[10px] font-bold">Gateway</text>

            {/* Clients */}
            {CLIENTS.map((c) => {
              const gotIt = (phase === 'fanout' || phase === 'offline' || phase === 'reconnect') && c.online;
              const caughtUp = phase === 'reconnect' && !c.online;
              return (
                <g key={c.id} opacity={c.online || caughtUp ? 1 : 0.45}>
                  <circle cx={c.x} cy={c.y} r={16} strokeWidth={2.5}
                    className={gotIt || caughtUp ? 'fill-[#eef9f2] stroke-[#15803d]' : 'fill-[var(--cv-surface-warm-card,#fff)] stroke-[var(--cv-border-warm)]'} />
                  <text x={c.x} y={c.y + 4} textAnchor="middle" fontSize="11">{gotIt || caughtUp ? '✓' : c.online ? '👤' : '💤'}</text>
                  {caughtUp && <text x={c.x} y={c.y + 32} textAnchor="middle" className="fill-[#1861a8] font-mono text-[8px] font-bold">replay 42…45</text>}
                </g>
              );
            })}
          </svg>
        </div>
      );
    }}
  </StepPlayerShell>
);

export default SdFanoutViz;
