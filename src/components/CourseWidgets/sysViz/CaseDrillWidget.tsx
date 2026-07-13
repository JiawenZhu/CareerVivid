import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, ClipboardList, Calculator, GitBranch, MessageCircleQuestion, RotateCcw } from 'lucide-react';
import type { CourseWidgetProps } from '../types';
import { getCaseDrill, type CaseDrill } from '../../../lib/systemDesignQuestionBank';

/**
 * Classic-question case drill — one interview question as a four-phase arena:
 * 1 Clarify (pick the must-ask questions) → 2 Estimate (napkin math with
 * tolerance) → 3 Design decisions (MCQ with rationale) → 4 The follow-up.
 * Completes when every phase is passed. Content basis: system-design-primer
 * (CC BY 4.0) + original material.
 */

const PHASES = [
  { id: 'clarify', label: 'Clarify', icon: ClipboardList },
  { id: 'estimate', label: 'Estimate', icon: Calculator },
  { id: 'decide', label: 'Design', icon: GitBranch },
  { id: 'followup', label: 'Follow-up', icon: MessageCircleQuestion },
] as const;
type PhaseId = typeof PHASES[number]['id'];

const parseNum = (raw: string): number => Number(raw.replace(/[,\s]/g, ''));
const within = (value: number, answer: number, tolerance: number) =>
  Number.isFinite(value) && Math.abs(value - answer) <= Math.abs(answer) * tolerance;

const CaseDrillView: React.FC<CourseWidgetProps & { drill: CaseDrill }> = ({ completed, onComplete, drill }) => {
  const [phase, setPhase] = useState<PhaseId>('clarify');
  const [passed, setPassed] = useState<Record<PhaseId, boolean>>({ clarify: false, estimate: false, decide: false, followup: false });

  // Clarify state
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [clarifyGraded, setClarifyGraded] = useState(false);
  // Estimate state
  const [inputs, setInputs] = useState<string[]>(drill.estimate.map(() => ''));
  const [estimateGraded, setEstimateGraded] = useState<boolean[]>(drill.estimate.map(() => false));
  const [estimateChecked, setEstimateChecked] = useState<boolean[]>(drill.estimate.map(() => false));
  // MCQ state (decide + followup share shape)
  const [mcqChoices, setMcqChoices] = useState<(number | null)[]>(drill.decide.map(() => null));
  const [followChoice, setFollowChoice] = useState<number | null>(null);

  const markPassed = (id: PhaseId) => {
    setPassed((prev) => {
      const next = { ...prev, [id]: true };
      if (Object.values(next).every(Boolean) && !completed) onComplete();
      return next;
    });
  };

  const essentials = useMemo(() => new Set(drill.clarify.options.map((o, i) => (o.essential ? i : -1)).filter((i) => i >= 0)), [drill]);

  const gradeClarify = () => {
    setClarifyGraded(true);
    if ([...essentials].every((i) => picked.has(i))) markPassed('clarify');
  };

  const gradeEstimate = (idx: number) => {
    const ok = within(parseNum(inputs[idx]), drill.estimate[idx].answer, drill.estimate[idx].tolerance);
    const nextChecked = estimateChecked.map((c, i) => (i === idx ? true : c));
    const nextGraded = estimateGraded.map((g, i) => (i === idx ? ok : g));
    setEstimateChecked(nextChecked);
    setEstimateGraded(nextGraded);
    if (nextGraded.every(Boolean)) markPassed('estimate');
  };

  const chooseMcq = (idx: number, opt: number) => {
    const next = mcqChoices.map((c, i) => (i === idx ? opt : c));
    setMcqChoices(next);
    if (next.every((c, i) => c === drill.decide[i].correctIndex)) markPassed('decide');
  };

  const chooseFollow = (opt: number) => {
    setFollowChoice(opt);
    if (opt === drill.followup.correctIndex) markPassed('followup');
  };

  const optionCls = (state: 'idle' | 'correct' | 'wrong') =>
    state === 'correct'
      ? 'border-[#15803d] bg-[#eef9f2] text-[#15803d]'
      : state === 'wrong'
        ? 'border-[#b03a54] bg-[#fdeef1] text-[#b03a54]'
        : 'border-[var(--cv-border-warm)] text-[var(--cv-text-body)] hover:border-[var(--cv-action-border)]';

  const renderMcq = (q: typeof drill.decide[number], choice: number | null, onChoose: (opt: number) => void, key: string) => (
    <div key={key} className="rounded-xl border border-[var(--cv-border-warm)] p-3">
      <p className="text-sm font-bold text-[var(--cv-text-heading)]">{q.prompt}</p>
      <div className="mt-2 grid gap-1.5">
        {q.options.map((opt, oi) => {
          const state = choice === null ? 'idle' : oi === q.correctIndex && choice === oi ? 'correct' : choice === oi ? 'wrong' : 'idle';
          return (
            <button key={oi} type="button" onClick={() => onChoose(oi)} className={`rounded-lg border-2 px-3 py-2 text-left text-xs font-semibold transition-colors ${optionCls(state)}`}>
              {opt}
            </button>
          );
        })}
      </div>
      {choice !== null && (
        <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`mt-2 rounded-lg px-3 py-2 text-xs font-medium leading-5 ${choice === q.correctIndex ? 'bg-[#eef9f2] text-[#15803d]' : 'bg-[#fdeef1] text-[#b03a54]'}`}>
          {choice === q.correctIndex ? '✓ ' : '✗ Not quite — try again. '}{q.why}
        </motion.p>
      )}
    </div>
  );

  const allDone = Object.values(passed).every(Boolean);

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">Classic question arena</p>
          <h3 className="cv-design-title mt-0.5 text-lg">{drill.title}</h3>
        </div>
        {allDone && <span className="inline-flex items-center gap-1 rounded-full bg-[#eef9f2] px-2.5 py-1 text-[11px] font-black text-[#15803d]"><CheckCircle2 size={13} /> Cleared</span>}
      </div>
      <p className="cv-design-body mt-1.5 text-sm">{drill.scenario}</p>

      {/* Phase stepper */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {PHASES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setPhase(id)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border-2 px-2.5 text-[11px] font-extrabold transition-colors ${phase === id
              ? 'border-[var(--cv-action-primary)] bg-[var(--cv-action-soft-bg)] text-[var(--cv-action-primary)]'
              : passed[id]
                ? 'border-[#b9e3c8] bg-[#eef9f2] text-[#15803d]'
                : 'border-[var(--cv-border-warm)] text-[var(--cv-text-muted)]'}`}
          >
            {passed[id] ? <CheckCircle2 size={13} /> : <Icon size={13} />} {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div key={phase} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {phase === 'clarify' && (
              <div>
                <p className="text-sm font-bold text-[var(--cv-text-heading)]">
                  You have 45 minutes. Pick the {drill.clarify.requiredCount} questions you MUST ask before drawing anything.
                </p>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {drill.clarify.options.map((opt, i) => {
                    const isPicked = picked.has(i);
                    const state = !clarifyGraded ? 'idle' : opt.essential && isPicked ? 'correct' : isPicked ? 'wrong' : opt.essential ? 'missed' : 'idle';
                    const cls = state === 'correct'
                      ? 'border-[#15803d] bg-[#eef9f2]'
                      : state === 'wrong'
                        ? 'border-[#b03a54] bg-[#fdeef1]'
                        : state === 'missed'
                          ? 'border-[#e8a33d] bg-[#fdf3d7]'
                          : isPicked
                            ? 'border-[var(--cv-action-primary)] bg-[var(--cv-action-soft-bg)]'
                            : 'border-[var(--cv-border-warm)] hover:border-[var(--cv-action-border)]';
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setClarifyGraded(false);
                          setPicked((prev) => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i);
                            else if (next.size < drill.clarify.requiredCount) next.add(i);
                            return next;
                          });
                        }}
                        className={`rounded-lg border-2 px-3 py-2 text-left text-xs font-semibold text-[var(--cv-text-body)] transition-colors ${cls}`}
                      >
                        {opt.text}
                        {clarifyGraded && (state === 'correct' || state === 'wrong' || state === 'missed') && (
                          <span className="mt-1 block text-[11px] font-medium opacity-90">{state === 'missed' ? '⚠ You needed this one: ' : ''}{opt.why}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <button type="button" onClick={gradeClarify} disabled={picked.size !== drill.clarify.requiredCount} className="cv-design-button-primary inline-flex h-9 items-center gap-1 rounded-lg px-4 text-xs disabled:opacity-40">
                    Check my questions <ChevronRight size={13} />
                  </button>
                  <span className="text-[11px] font-bold text-[var(--cv-text-muted)]">{picked.size}/{drill.clarify.requiredCount} selected</span>
                  {clarifyGraded && !passed.clarify && (
                    <button type="button" onClick={() => { setPicked(new Set()); setClarifyGraded(false); }} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--cv-border-warm)] px-3 text-xs font-bold text-[var(--cv-text-body)]"><RotateCcw size={12} /> Retry</button>
                  )}
                </div>
              </div>
            )}

            {phase === 'estimate' && (
              <div className="grid gap-3">
                {drill.estimate.map((q, i) => (
                  <div key={i} className="rounded-xl border border-[var(--cv-border-warm)] p-3">
                    <p className="text-sm font-bold text-[var(--cv-text-heading)]">{q.prompt}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={inputs[i]}
                        onChange={(e) => setInputs((prev) => prev.map((v, vi) => (vi === i ? e.target.value : v)))}
                        placeholder="your estimate"
                        className="h-9 w-36 rounded-lg border-2 border-[var(--cv-border-warm)] bg-transparent px-3 font-mono text-sm font-bold text-[var(--cv-text-heading)] outline-none focus:border-[var(--cv-action-primary)]"
                      />
                      <span className="text-xs font-bold text-[var(--cv-text-muted)]">{q.unit}</span>
                      <button type="button" onClick={() => gradeEstimate(i)} disabled={!inputs[i].trim()} className="cv-design-button-primary h-9 rounded-lg px-3 text-xs disabled:opacity-40">Check</button>
                      {estimateChecked[i] && (
                        <span className={`text-xs font-black ${estimateGraded[i] ? 'text-[#15803d]' : 'text-[#b03a54]'}`}>
                          {estimateGraded[i] ? '✓ within range' : '✗ off — rework it'}
                        </span>
                      )}
                    </div>
                    {estimateChecked[i] && (
                      <p className={`mt-2 rounded-lg px-3 py-2 font-mono text-[11px] font-semibold leading-5 ${estimateGraded[i] ? 'bg-[#eef9f2] text-[#15803d]' : 'bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.04))] text-[var(--cv-text-body)]'}`}>
                        {q.working}
                      </p>
                    )}
                  </div>
                ))}
                <p className="text-[11px] font-medium text-[var(--cv-text-muted)]">Napkin math: answers within tolerance count. Interviewers grade the method, not decimals.</p>
              </div>
            )}

            {phase === 'decide' && (
              <div className="grid gap-3">
                {drill.decide.map((q, i) => renderMcq(q, mcqChoices[i], (opt) => chooseMcq(i, opt), `d${i}`))}
              </div>
            )}

            {phase === 'followup' && (
              <div className="grid gap-3">
                <p className="rounded-lg bg-[var(--cv-action-soft-bg)] px-3 py-2 text-xs font-bold text-[var(--cv-action-primary)]">
                  The interviewer leans in: requirements just changed.
                </p>
                {renderMcq(drill.followup, followChoice, chooseFollow, 'f')}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="mt-4 text-center text-[11px] font-medium text-[var(--cv-text-muted)]">
        {allDone || completed
          ? `✓ ${drill.title} cleared — all four phases passed. Content basis: The System Design Primer (CC BY 4.0).`
          : 'Pass all four phases (green tabs) to clear this question.'}
      </p>
    </div>
  );
};

/** Factory: bind a case drill from the question bank to a widget id. */
export const createCaseDrill = (caseId: string): React.FC<CourseWidgetProps> =>
  function ConfiguredCaseDrill(props) {
    const drill = getCaseDrill(caseId);
    if (!drill) return null;
    return <CaseDrillView {...props} drill={drill} />;
  };

export default CaseDrillView;
