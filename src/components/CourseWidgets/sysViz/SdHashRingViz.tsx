import React from 'react';
import { motion } from 'framer-motion';
import { CircleDot } from 'lucide-react';
import type { CourseWidgetProps } from '../types';
import StepPlayerShell from '../algoViz/StepPlayerShell';

/**
 * Consistent hash ring — a key hashes onto the ring, walks clockwise to its
 * N=3 replica set, a quorum write completes at W=2, and a node failure hands
 * ownership to the next node without remapping the world.
 */

const CX = 200;
const CY = 120;
const R = 82;
const NODES = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6'].map((id, i) => {
  const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
  return { id, angle, x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
});
// key hashes between N1 and N2 → replicas N2, N3, N4
const KEY_ANGLE = -Math.PI / 2 + Math.PI / 6;
const KEY = { x: CX + R * Math.cos(KEY_ANGLE), y: CY + R * Math.sin(KEY_ANGLE) };

interface Step { note: string; replicas: string[]; acks: string[]; failed?: string; handoff?: string }

const STEPS: Step[] = [
  { note: 'Six storage nodes sit on a hash ring (0 → 2³² wraps around). Every node owns the arc between itself and its predecessor.', replicas: [], acks: [] },
  { note: 'PUT account:42 — hash the KEY onto the same ring. It lands between N1 and N2 (orange dot).', replicas: [], acks: [] },
  { note: 'Walk CLOCKWISE from the key: the first N=3 distinct nodes are its replica set → N2, N3, N4. No lookup table needed; any node can compute this.', replicas: ['N2', 'N3', 'N4'], acks: [] },
  { note: 'Quorum write with W=2: the coordinator sends to all 3 replicas and acks the client after 2 confirm. N4 finishes a moment later from the replication log.', replicas: ['N2', 'N3', 'N4'], acks: ['N2', 'N3'] },
  { note: 'N2 dies. Only ITS arc is affected: the walk now yields N3, N4, N5 — one new node (N5) takes hinted handoff. With naive hash % 6, EVERY key in the cluster would have remapped.', replicas: ['N3', 'N4', 'N5'], acks: [], failed: 'N2', handoff: 'N5' },
  { note: 'When N2 recovers, N5 hands the hints back and anti-entropy repairs any gaps. Add virtual nodes (each server appears ~150× on the ring) to smooth these transfers.', replicas: ['N2', 'N3', 'N4'], acks: [], handoff: 'N5' },
];

const SdHashRingViz: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => (
  <StepPlayerShell
    icon={CircleDot}
    title="Consistent hashing · the ring that survives failures"
    totalSteps={STEPS.length}
    nextLabel="Advance"
    captions={STEPS.map((s) => s.note)}
    completed={completed}
    onComplete={onComplete}
    doneText="✓ Lesson complete! Ring + clockwise walk + N/W/R quorums + virtual nodes = DynamoDB, Cassandra, and every distributed cache you'll ever design."
    todoText="Hash the key, find its replica set, survive a node failure."
    legend={
      <>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-[#e8a33d] bg-[#fdf3d7] align-middle" /> key position</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-[#15803d] bg-[#eef9f2] align-middle" /> replica (N=3)</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-[#b03a54] bg-[#fdeef1] align-middle" /> failed node</span>
      </>
    }
  >
    {(step) => {
      const s = STEPS[step];
      return (
        <div className="flex justify-center">
          <svg viewBox="0 0 400 240" className="w-full max-w-md" role="img" aria-label="Consistent hash ring">
            <circle cx={CX} cy={CY} r={R} fill="none" strokeWidth={2.5} className="stroke-[var(--cv-border-warm)]" />

            {/* Clockwise walk arc from key to replicas */}
            {s.replicas.length > 0 && (
              <motion.path
                key={`walk-${step}`}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8 }}
                d={`M ${KEY.x} ${KEY.y} A ${R} ${R} 0 ${s.failed ? 1 : 0} 1 ${NODES.find((n) => n.id === s.replicas[s.replicas.length - 1])!.x} ${NODES.find((n) => n.id === s.replicas[s.replicas.length - 1])!.y}`}
                fill="none"
                strokeWidth={5}
                strokeLinecap="round"
                className="stroke-[#15803d]"
                opacity={0.35}
              />
            )}

            {/* Nodes */}
            {NODES.map((n) => {
              const isReplica = s.replicas.includes(n.id);
              const isAcked = s.acks.includes(n.id);
              const isFailed = s.failed === n.id;
              const isHandoff = s.handoff === n.id && !s.replicas.includes(n.id);
              const cls = isFailed
                ? 'fill-[#fdeef1] stroke-[#b03a54]'
                : isAcked
                  ? 'fill-[#eef9f2] stroke-[#15803d]'
                  : isReplica
                    ? 'fill-[#eef9f2] stroke-[#15803d]'
                    : isHandoff
                      ? 'fill-[#ecf4fd] stroke-[#5f8fd9]'
                      : 'fill-[var(--cv-surface-warm-card,#fff)] stroke-[var(--cv-text-muted)]';
              return (
                <g key={n.id}>
                  <motion.circle
                    cx={n.x} cy={n.y} r={16} strokeWidth={2.5}
                    className={cls}
                    animate={{ scale: isReplica || isFailed ? [1, 1.12, 1] : 1, opacity: isFailed ? 0.75 : 1 }}
                    transition={{ duration: 0.45 }}
                  />
                  <text x={n.x} y={n.y + 4} textAnchor="middle" className={`text-[10px] font-black ${isFailed ? 'fill-[#b03a54]' : 'fill-[var(--cv-text-heading)]'}`}>
                    {isFailed ? '✕' : n.id}
                  </text>
                  {isAcked && (
                    <motion.text initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} x={n.x} y={n.y - 22} textAnchor="middle" className="fill-[#15803d] text-[10px] font-black">
                      ACK ✓
                    </motion.text>
                  )}
                  {s.handoff === n.id && step >= 4 && (
                    <text x={n.x} y={n.y + 32} textAnchor="middle" className="fill-[#1861a8] font-mono text-[8px] font-bold">
                      {step === 5 ? 'hints → N2' : 'hinted handoff'}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Key dot */}
            {step >= 1 && (
              <motion.g initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}>
                <circle cx={KEY.x} cy={KEY.y} r={8} strokeWidth={2.5} className="fill-[#fdf3d7] stroke-[#e8a33d]" />
                <text x={KEY.x + 14} y={KEY.y - 8} className="fill-[#a35410] font-mono text-[9px] font-black">hash(account:42)</text>
              </motion.g>
            )}

            {/* Center label */}
            <text x={CX} y={CY - 4} textAnchor="middle" className="fill-[var(--cv-text-muted)] text-[10px] font-bold">
              {step >= 3 ? `N=3 · W=2 · R=2` : 'hash ring'}
            </text>
            {step >= 3 && (
              <text x={CX} y={CY + 12} textAnchor="middle" className="fill-[var(--cv-text-muted)] font-mono text-[9px] font-bold">
                W + R &gt; N → strong reads
              </text>
            )}
          </svg>
        </div>
      );
    }}
  </StepPlayerShell>
);

export default SdHashRingViz;
