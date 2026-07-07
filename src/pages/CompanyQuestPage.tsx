import React, { Suspense, useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    BarChart3,
    Check,
    ChevronDown,
    ChevronRight,
    Code2,
    Flame,
    Loader2,
    PenTool,
    Play,
    Swords,
    RotateCcw,
    Trophy,
    Zap,
} from 'lucide-react';
import AppLayout from '../components/Layout/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useUserProgress } from '../hooks/useUserProgress';
import { usePracticeHistory } from '../hooks/useJobHistory';
import { useResumes } from '../hooks/useResumes';
import { useAICreditCheck } from '../hooks/useAICreditCheck';
import { useCompanyQuest, StageAttemptOutcome } from '../hooks/useCompanyQuest';
import {
    LocalInterviewGuide,
    loadLocalInterviewGuide,
} from '../lib/localInterviewGuides';
import {
    QuestStage,
    SystemDesignBrief,
    SystemDesignPattern,
    buildQuestLine,
    buildQuestStagePrompt,
    buildSystemDesignBrief,
    getStageFallbackQuestions,
    getStageQuestionPool,
    getSystemDesignPool,
    isStageCleared,
    selectNextSystemDesignChallenge,
} from '../lib/companyQuests';
import { CodingBrief, CodingChallenge, buildCodingBrief, getCodingPool, getPreferredCodingLanguage, selectNextCodingChallenge } from '../lib/codingChallenges';
import CodingChallengePicker from '../components/Quest/CodingChallengePicker';
import SystemDesignChallengePicker from '../components/Quest/SystemDesignChallengePicker';
import { XP_RULES } from '../lib/gamification';
import { generateInterviewQuestions } from '../services/geminiService';
import {
    InterviewAnalysis,
    InterviewSessionDraft,
    PracticeHistoryEntry,
    QuestCodingArtifact,
    QuestSystemDesignArtifact,
    ResumeData,
    TranscriptEntry,
} from '../types';
import { navigate } from '../utils/navigation';

const AIInterviewAgentModal = React.lazy(() => import('../components/AIInterviewAgentModal'));
const InterviewReportModal = React.lazy(() => import('../components/InterviewReportModal'));
const SystemDesignBattle = React.lazy(() => import('../components/Quest/SystemDesignBattle'));
const CodingBattle = React.lazy(() => import('../components/Quest/CodingBattle'));

const formatResumeForContext = (resume: ResumeData): string => {
    let context = `Name: ${resume.personalDetails.firstName} ${resume.personalDetails.lastName}\n`;
    context += `Job Title: ${resume.personalDetails.jobTitle}\n\n`;
    context += `SUMMARY:\n${resume.professionalSummary}\n\n`;
    if (resume.employmentHistory.length > 0) {
        context += 'EXPERIENCE:\n';
        resume.employmentHistory.forEach(job => {
            context += `- ${job.jobTitle} at ${job.employer} (${job.startDate} - ${job.endDate})\n`;
        });
    }
    return context;
};

type StageState = 'cleared' | 'available';

interface BattleState {
    stage: QuestStage;
    jobId: string;
    prompt: string;
    questions: string[];
    resumeContext: string;
    isFirstTime: boolean;
    initialTranscript?: TranscriptEntry[];
    resumeFromQuestionIndex?: number;
}

interface DesignBattleState {
    stage: QuestStage;
    jobId: string;
    brief: SystemDesignBrief;
    initialArtifact?: QuestSystemDesignArtifact;
}

interface CodingBattleState {
    stage: QuestStage;
    jobId: string;
    brief: CodingBrief;
    initialArtifact?: QuestCodingArtifact;
}

interface CompanyQuestPageProps {
    slug: string;
}

const getAnalysisFromEntry = (
    entry: PracticeHistoryEntry | undefined,
    analysisId?: string,
): InterviewAnalysis | null => {
    const history = entry?.interviewHistory ?? [];
    if (!history.length) return null;
    if (analysisId) {
        return history.find((analysis) => analysis.id === analysisId) ?? history[history.length - 1];
    }
    return history[history.length - 1];
};

const getResumableDraft = (entry: PracticeHistoryEntry | undefined): InterviewSessionDraft | null => {
    const draft = entry?.activeInterviewDraft;
    const draftQuestions = draft?.questions?.length ? draft.questions : entry?.questions;
    if (!draft || !draft.transcript?.length || !draftQuestions?.length) return null;
    if (draft.questionIndex >= draftQuestions.length) return null;
    return { ...draft, questions: draftQuestions };
};

const CompanyQuestPage: React.FC<CompanyQuestPageProps> = ({ slug }) => {
    const { currentUser } = useAuth();
    const { levelInfo, isLoading: isLoadingLevel } = useUserProgress();
    const { practiceHistory, addJob, addAnalysisToJob, saveInterviewDraft } = usePracticeHistory();
    const { resumes } = useResumes();
    const { checkCredit, CreditLimitModal } = useAICreditCheck();

    const [guide, setGuide] = useState<LocalInterviewGuide | null>(null);
    const [isLoadingGuide, setIsLoadingGuide] = useState(true);
    const [startingStageId, setStartingStageId] = useState<string | null>(null);
    const [battle, setBattle] = useState<BattleState | null>(null);
    const [designBattle, setDesignBattle] = useState<DesignBattleState | null>(null);
    const [codingBattle, setCodingBattle] = useState<CodingBattleState | null>(null);
    const [selectedReportEntry, setSelectedReportEntry] = useState<PracticeHistoryEntry | null>(null);
    const [lastOutcome, setLastOutcome] = useState<(StageAttemptOutcome & { stageTitle: string }) | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        setIsLoadingGuide(true);
        loadLocalInterviewGuide(slug)
            .then((loaded) => { if (!cancelled) setGuide(loaded); })
            .catch(() => { if (!cancelled) setGuide(null); })
            .finally(() => { if (!cancelled) setIsLoadingGuide(false); });
        return () => { cancelled = true; };
    }, [slug]);

    const stages = useMemo(() => (guide ? buildQuestLine(guide) : []), [guide]);
    const { quest, recordStageAttempt } = useCompanyQuest(slug, guide?.company ?? slug);

    const stageStates: StageState[] = useMemo(() => {
        return stages.map((stage) => {
            const cleared = isStageCleared(quest?.stageResults?.[stage.id]?.bestScore, stage);
            return cleared ? 'cleared' : 'available';
        });
    }, [stages, quest]);

    const clearedCount = stageStates.filter((s) => s === 'cleared').length;
    const questComplete = stages.length > 0 && clearedCount === stages.length;
    const currentStageIndex = stageStates.findIndex((s) => s !== 'cleared');
    const questProgressPct = stages.length ? Math.round((clearedCount / stages.length) * 100) : 0;

    // Coding stage serves a pool of problems for the company; track the pool
    // and which the user has solved so the card can show progress and let the
    // user pick a problem to improve.
    const codingPool = useMemo(() => (guide ? getCodingPool(guide) : []), [guide]);
    const codingPoolSize = codingPool.length;
    const codingSolvedIds = useMemo(
        () => quest?.stageResults?.coding?.clearedChallengeIds ?? [],
        [quest],
    );
    const codingSolvedCount = useMemo(() => new Set(codingSolvedIds).size, [codingSolvedIds]);
    const [codingPickerStageId, setCodingPickerStageId] = useState<string | null>(null);
    const systemDesignPool = useMemo(() => (guide ? getSystemDesignPool(guide) : []), [guide]);
    const systemDesignPoolSize = systemDesignPool.length;
    const systemDesignSolvedIds = useMemo(
        () => quest?.stageResults?.system_design?.clearedChallengeIds ?? [],
        [quest],
    );
    const systemDesignSolvedCount = useMemo(
        () => new Set(systemDesignSolvedIds).size,
        [systemDesignSolvedIds],
    );
    const [systemDesignPickerStageId, setSystemDesignPickerStageId] = useState<string | null>(null);

    const practiceEntriesByStageId = useMemo(() => {
        if (!guide) return new Map<string, PracticeHistoryEntry>();

        return stages.reduce((entries, stage) => {
            const result = quest?.stageResults?.[stage.id];
            const lastAnalysisId = result?.lastAnalysisId;
            const entryByAnalysisId = lastAnalysisId
                ? practiceHistory.find((entry) =>
                    entry.interviewHistory?.some((analysis) => analysis.id === lastAnalysisId),
                )
                : null;

            const entryByStageTitle = practiceHistory.find((entry) =>
                entry.job?.company === guide.company
                && entry.job?.title === `${guide.company} quest — ${stage.title}`
                && ((entry.interviewHistory?.length ?? 0) > 0 || !!getResumableDraft(entry)),
            );

            const entry = entryByAnalysisId || entryByStageTitle;
            if (entry) entries.set(stage.id, entry);
            return entries;
        }, new Map<string, PracticeHistoryEntry>());
    }, [guide, practiceHistory, quest, stages]);

    const handleStartStage = async (
        stage: QuestStage,
        challengeOverride?: CodingChallenge | SystemDesignPattern,
    ) => {
        if (!guide || !currentUser) return;
        const stageEntry = practiceEntriesByStageId.get(stage.id);
        const draft = getResumableDraft(stageEntry);
        if (!draft && !checkCredit()) return;

        setStartingStageId(stage.id);
        setError('');
        setLastOutcome(null);

        try {
            // Coding is played in the code editor with real test execution,
            // not as a voice interview.
            if (stage.id === 'coding') {
                // Use the problem the user picked, or serve the next unsolved
                // one from the company pool so clearing one hands out a fresh
                // problem to keep improving.
                const clearedChallengeIds = quest?.stageResults?.[stage.id]?.clearedChallengeIds ?? [];
                const challenge = challengeOverride && 'functionName' in challengeOverride
                    ? challengeOverride
                    : selectNextCodingChallenge(guide, clearedChallengeIds);
                const brief = buildCodingBrief(guide, challenge);
                const artifact = getAnalysisFromEntry(
                    practiceEntriesByStageId.get(stage.id),
                    quest?.stageResults?.[stage.id]?.lastAnalysisId,
                )?.questArtifact;
                const jobId = await addJob({
                    title: `${guide.company} quest — ${stage.title}`,
                    company: guide.company,
                    location: '',
                    description: brief.prompt,
                    url: guide.url,
                }, []);
                setCodingBattle({
                    stage,
                    jobId,
                    brief,
                    initialArtifact: artifact?.type === 'coding' ? artifact : undefined,
                });
                return;
            }

            // System design is played on the whiteboard, not as a voice interview.
            if (stage.id === 'system_design') {
                const clearedChallengeIds = quest?.stageResults?.[stage.id]?.clearedChallengeIds ?? [];
                const challenge = challengeOverride && !('functionName' in challengeOverride)
                    ? challengeOverride
                    : selectNextSystemDesignChallenge(guide, clearedChallengeIds);
                const brief = buildSystemDesignBrief(guide, challenge);
                const artifact = getAnalysisFromEntry(
                    practiceEntriesByStageId.get(stage.id),
                    quest?.stageResults?.[stage.id]?.lastAnalysisId,
                )?.questArtifact;
                const matchingArtifact = artifact?.type === 'system_design' && artifact.challengeId === brief.challengeId
                    ? artifact
                    : undefined;
                const jobId = await addJob({
                    title: `${guide.company} quest — ${stage.title}`,
                    company: guide.company,
                    location: '',
                    description: brief.prompt,
                    url: guide.url,
                }, []);
                setDesignBattle({
                    stage,
                    jobId,
                    brief,
                    initialArtifact: matchingArtifact,
                });
                return;
            }

            const prompt = buildQuestStagePrompt(guide, stage);
            if (draft && stageEntry) {
                const activeResume = resumes.find(r => r.isDefault) || resumes[0];
                setBattle({
                    stage,
                    jobId: stageEntry.id,
                    prompt: stageEntry.job?.description || prompt,
                    questions: draft.questions,
                    isFirstTime: false,
                    resumeContext: activeResume ? formatResumeForContext(activeResume) : '',
                    initialTranscript: draft.transcript,
                    resumeFromQuestionIndex: draft.questionIndex,
                });
                return;
            }

            const pool = getStageQuestionPool(guide, stage).slice(0, 5);
            let questions = pool;
            if (pool.length < 3) {
                try {
                    questions = await generateInterviewQuestions(currentUser.uid, [
                        prompt,
                        '',
                        'Generate 5 realistic interview questions for exactly this stage.',
                    ].join('\n'));
                } catch (generationError) {
                    console.warn('AI question generation unavailable, using stage fallback questions:', generationError);
                    questions = [...pool];
                }
            }
            if (questions.length < 3) {
                const fallback = getStageFallbackQuestions(guide.company, stage)
                    .filter((q) => !questions.includes(q));
                questions = [...questions, ...fallback].slice(0, 5);
            }

            const jobId = await addJob({
                title: `${guide.company} quest — ${stage.title}`,
                company: guide.company,
                location: '',
                description: prompt,
                url: guide.url,
            }, questions);

            const activeResume = resumes.find(r => r.isDefault) || resumes[0];
            setBattle({
                stage,
                jobId,
                prompt,
                questions,
                isFirstTime: true,
                resumeContext: activeResume ? formatResumeForContext(activeResume) : '',
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to start this stage.');
        } finally {
            setStartingStageId(null);
        }
    };

    const handleStageAnalysis = (stage: QuestStage, analysis: InterviewAnalysis) => {
        void recordStageAttempt(stage, stages, analysis)
            .then((outcome) => setLastOutcome({ ...outcome, stageTitle: stage.title }))
            .catch((e) => console.error('Failed to record stage attempt:', e));
    };

    // Save + score a system design diagram submitted from the whiteboard.
    const handleDesignAnalysis = async (
        analysisData: Omit<InterviewAnalysis, 'id' | 'timestamp'>,
    ): Promise<InterviewAnalysis> => {
        if (!designBattle) throw new Error('No active design stage');
        return addAnalysisToJob(designBattle.jobId, analysisData);
    };

    // Save + score a coding solution submitted from the code editor.
    const handleCodingAnalysis = async (
        analysisData: Omit<InterviewAnalysis, 'id' | 'timestamp'>,
    ): Promise<InterviewAnalysis> => {
        if (!codingBattle) throw new Error('No active coding stage');
        return addAnalysisToJob(codingBattle.jobId, analysisData);
    };

    const stageIcon = (state: StageState, index: number) => {
        if (state === 'cleared') return <Check size={16} strokeWidth={3} />;
        return <span className="text-sm font-bold">{index + 1}</span>;
    };

    const renderOutcomeBanner = () => {
        if (!lastOutcome) return null;
        if (lastOutcome.questCompleted) {
            return (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#cfe8d5] bg-[#eef9f2] px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
                    <Trophy size={20} className="shrink-0 text-[#15803d] dark:text-emerald-400" />
                    <div>
                        <p className="text-sm font-bold text-[#166534] dark:text-emerald-200">Quest complete! You cleared the full {guide?.company} loop.</p>
                        <p className="text-xs font-medium text-[#15803d] dark:text-emerald-300">+{XP_RULES.quest_completed} XP quest bonus earned.</p>
                    </div>
                </div>
            );
        }
        if (lastOutcome.cleared) {
            return (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#cfe8d5] bg-[#eef9f2] px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
                    <Check size={20} className="shrink-0 text-[#15803d] dark:text-emerald-400" />
                    <div>
                        <p className="text-sm font-bold text-[#166534] dark:text-emerald-200">
                            {lastOutcome.stageTitle} cleared with a score of {Math.round(lastOutcome.normalizedScore)}!
                        </p>
                        {lastOutcome.newlyCleared && (
                            <p className="text-xs font-medium text-[#15803d] dark:text-emerald-300">+{XP_RULES.quest_stage_cleared} XP — stage cleared.</p>
                        )}
                    </div>
                </div>
            );
        }
        return (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 dark:border-amber-900 dark:bg-amber-950/40">
                <Flame size={20} className="shrink-0 text-[#d97706] dark:text-amber-400" />
                <p className="text-sm font-semibold text-[#b45309] dark:text-amber-200">
                    You scored {Math.round(lastOutcome.normalizedScore)} on {lastOutcome.stageTitle} — keep drilling and try again.
                </p>
            </div>
        );
    };

    if (isLoadingGuide) {
        return (
            <AppLayout>
                <div className="flex min-h-[60vh] items-center justify-center">
                    <Loader2 className="animate-spin text-gray-400" size={28} />
                </div>
            </AppLayout>
        );
    }

    if (!guide) {
        return (
            <AppLayout>
                <div className="mx-auto max-w-3xl p-6 text-center">
                    <p className="mt-16 text-lg font-bold text-gray-900 dark:text-gray-100">Quest not found</p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No interview guide exists for “{slug}”.</p>
                    <button
                        type="button"
                        onClick={() => navigate('/interview-studio')}
                        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#dfe2ff] bg-[#eef0ff] px-4 py-2 text-sm font-semibold text-[#625bd5] hover:bg-[#e6e8ff] hover:text-[#514ac5] dark:border-[#625bd5]/40 dark:bg-[#252244] dark:text-[#c9ccff] dark:hover:bg-[#312d6b]"
                    >
                        <ArrowLeft size={16} /> Back to Interview Studio
                    </button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="cv-design-page cv-design-grid relative min-h-screen pb-16 text-left">
                <div className="@container/quest-page mx-auto max-w-screen-2xl px-4 py-6 text-left sm:px-6 lg:px-8 lg:py-8">
                    <button
                        type="button"
                        onClick={() => navigate('/interview-studio')}
                        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--cv-text-muted)] transition-colors hover:text-[var(--cv-text-heading)]"
                    >
                        <ArrowLeft size={15} /> Back to Interview Studio
                    </button>

                    <div className="grid grid-cols-1 items-start gap-5 @[1080px]/quest-page:grid-cols-[minmax(0,1fr)_340px]">
                        <main className="space-y-4">
                            {/* Hero */}
                            <section className="cv-design-card p-4 sm:p-6">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="cv-design-eyebrow mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--cv-action-border)] bg-[var(--cv-action-soft-bg)] px-2.5 py-1 text-xs">
                                            <Swords size={14} />
                                            <span>Interview quest</span>
                                            {guide.difficulty && (
                                                <span className="inline-flex items-center gap-1 border-l border-[var(--cv-action-border)] pl-2">
                                                    <BarChart3 size={11} /> {guide.difficulty}/10
                                                </span>
                                            )}
                                        </div>
                                        <h1 className="cv-design-title text-2xl sm:text-3xl">Beat the {guide.company} interview loop</h1>
                                        <p className="cv-design-body mt-1.5 max-w-2xl text-sm">
                                            Five real stages, playable in any order. Score {stages[0]?.passThreshold ?? 75}+ on each to clear it — clear all {stages.length} and the quest is yours.
                                        </p>
                                    </div>
                                    {!questComplete && currentStageIndex >= 0 && stages[currentStageIndex] && (
                                        <button
                                            type="button"
                                            onClick={() => handleStartStage(stages[currentStageIndex])}
                                            disabled={startingStageId !== null}
                                            className="cv-design-button-primary inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <Play size={15} />
                                            {clearedCount > 0 ? 'Continue' : 'Start'} · {stages[currentStageIndex].title}
                                            <ArrowRight size={15} />
                                        </button>
                                    )}
                                </div>
                            </section>

                            {renderOutcomeBanner()}
                            {error && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                                    {error}
                                </div>
                            )}

                            {/* Stage list — one row per stage, curriculum-page style */}
                            <section className="cv-design-card overflow-hidden">
                                <ol>
                                    {stages.map((stage, index) => {
                                        const state = stageStates[index];
                                        const result = quest?.stageResults?.[stage.id];
                                        const stageEntry = practiceEntriesByStageId.get(stage.id);
                                        const reportEntry = (stageEntry?.interviewHistory?.length ?? 0) > 0 ? stageEntry : null;
                                        const draft = getResumableDraft(stageEntry);
                                        const isStarting = startingStageId === stage.id;
                                        const isLast = index === stages.length - 1;
                                        const isCurrent = index === currentStageIndex && !questComplete;
                                        const bestPct = result ? Math.min(Math.round(result.bestScore), 100) : 0;
                                        return (
                                            <li key={stage.id} className={!isLast ? 'border-b border-[var(--cv-border-warm)]' : ''}>
                                                <div className={`flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.02))] sm:flex-row sm:items-center sm:p-5 ${isCurrent ? 'bg-[var(--cv-action-soft-bg,rgba(99,91,213,0.04))]' : ''}`}>
                                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${state === 'cleared'
                                                            ? 'border border-[var(--cv-success-600)]/30 bg-[var(--cv-success-50)] text-[var(--cv-success-600)]'
                                                            : 'cv-design-icon-well'
                                                            }`}>
                                                            {stageIcon(state, index)}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h2 className="cv-design-title text-base sm:text-lg">{stage.title}</h2>
                                                                {isCurrent && (
                                                                    <span className="rounded-full bg-[var(--cv-action-primary)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                                                                        Up next
                                                                    </span>
                                                                )}
                                                                {draft && (
                                                                    <span className="rounded-full border border-amber-300/60 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                                                        In progress
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="cv-design-body mt-0.5 text-xs sm:text-sm">{stage.description}</p>
                                                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                <p className="flex items-center gap-x-2 text-[11px] font-bold text-[var(--cv-text-muted)]">
                                                                    <span>Pass ≥ {stage.passThreshold}</span>
                                                                    {result && (
                                                                        <>
                                                                            <span aria-hidden>·</span>
                                                                            <span>Best {Math.round(result.bestScore)}</span>
                                                                            <span aria-hidden>·</span>
                                                                            <span>{result.attempts} attempt{result.attempts === 1 ? '' : 's'}</span>
                                                                        </>
                                                                    )}
                                                                    {stage.id === 'coding' && codingPoolSize > 0 && (
                                                                        <>
                                                                            <span aria-hidden>·</span>
                                                                            <span>{codingSolvedCount} / {codingPoolSize} problems</span>
                                                                        </>
                                                                    )}
                                                                    {stage.id === 'system_design' && systemDesignPoolSize > 0 && (
                                                                        <>
                                                                            <span aria-hidden>·</span>
                                                                            <span>{systemDesignSolvedCount} / {systemDesignPoolSize} prompts</span>
                                                                        </>
                                                                    )}
                                                                </p>
                                                                {result && (
                                                                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--cv-border-warm)]">
                                                                        <span
                                                                            className={`block h-full rounded-full transition-[width] duration-500 ${state === 'cleared' ? 'bg-[var(--cv-success-600)]' : 'bg-[var(--cv-action-primary)]'}`}
                                                                            style={{ width: `${Math.max(bestPct, 6)}%` }}
                                                                        />
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
                                                {reportEntry && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedReportEntry(reportEntry)}
                                                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] px-3 text-xs font-bold text-[var(--cv-text-body)] transition-colors hover:border-[var(--cv-action-border)] hover:text-[var(--cv-action-primary)]"
                                                    >
                                                        <BarChart3 size={13} />
                                                        View report
                                                    </button>
                                                )}
                                                {(() => {
                                                    // A cleared coding stage opens a picker so the user
                                                    // chooses which pooled problem to improve.
                                                    const opensCodingPicker = stage.id === 'coding' && state === 'cleared' && codingPoolSize > 0;
                                                    const opensSystemDesignPicker = stage.id === 'system_design' && state === 'cleared' && systemDesignPoolSize > 0;
                                                    const pickerOpen = codingPickerStageId === stage.id;
                                                    const designPickerOpen = systemDesignPickerStageId === stage.id;
                                                    return (
                                                        <div className="relative">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (opensCodingPicker) {
                                                                        setCodingPickerStageId(pickerOpen ? null : stage.id);
                                                                    } else if (opensSystemDesignPicker) {
                                                                        setSystemDesignPickerStageId(designPickerOpen ? null : stage.id);
                                                                    } else {
                                                                        handleStartStage(stage);
                                                                    }
                                                                }}
                                                                disabled={isStarting || startingStageId !== null}
                                                                aria-haspopup={opensCodingPicker || opensSystemDesignPicker ? 'menu' : undefined}
                                                                aria-expanded={opensCodingPicker ? pickerOpen : opensSystemDesignPicker ? designPickerOpen : undefined}
                                                                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${state === 'cleared'
                                                                    ? 'border border-[var(--cv-action-border)] bg-[var(--cv-action-soft-bg)] text-[var(--cv-action-primary)] hover:border-[var(--cv-action-primary)]'
                                                                    : 'cv-design-button-primary'
                                                                    }`}
                                                            >
                                                                {isStarting
                                                                    ? <Loader2 size={14} className="animate-spin" />
                                                                    : draft
                                                                        ? <RotateCcw size={13} />
                                                                        : state === 'cleared'
                                                                        ? <RotateCcw size={13} />
                                                                        : stage.id === 'system_design'
                                                                            ? <PenTool size={13} />
                                                                            : stage.id === 'coding'
                                                                                ? <Code2 size={13} />
                                                                                : <ChevronRight size={14} />}
                                                                {draft
                                                                    ? 'Resume session'
                                                                    : state === 'cleared'
                                                                    ? 'Improve score'
                                                                    : stage.id === 'system_design'
                                                                        ? 'Open whiteboard'
                                                                        : stage.id === 'coding'
                                                                            ? 'Open code editor'
                                                                            : 'Start stage'}
                                                                {(opensCodingPicker || opensSystemDesignPicker) && !isStarting && (
                                                                    <ChevronDown size={13} className={`transition-transform ${pickerOpen || designPickerOpen ? 'rotate-180' : ''}`} />
                                                                )}
                                                            </button>
                                                            {opensCodingPicker && pickerOpen && (
                                                                <CodingChallengePicker
                                                                    pool={codingPool}
                                                                    solvedIds={codingSolvedIds}
                                                                    onSelect={(challenge) => {
                                                                        setCodingPickerStageId(null);
                                                                        void handleStartStage(stage, challenge);
                                                                    }}
                                                                    onClose={() => setCodingPickerStageId(null)}
                                                                />
                                                            )}
                                                            {opensSystemDesignPicker && designPickerOpen && (
                                                                <SystemDesignChallengePicker
                                                                    pool={systemDesignPool}
                                                                    solvedIds={systemDesignSolvedIds}
                                                                    onSelect={(challenge) => {
                                                                        setSystemDesignPickerStageId(null);
                                                                        void handleStartStage(stage, challenge);
                                                                    }}
                                                                    onClose={() => setSystemDesignPickerStageId(null)}
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </section>
                        </main>

                        <aside className="space-y-4 @[1080px]/quest-page:sticky @[1080px]/quest-page:top-6">
                            {currentUser && (
                                <section className="cv-design-card p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="cv-design-title text-base">Level {isLoadingLevel ? '—' : levelInfo.level}</p>
                                            <p className="cv-design-body mt-0.5 text-xs">
                                                {isLoadingLevel ? 'Loading…' : `${levelInfo.currentLevelXp} / ${levelInfo.nextLevelXp} XP to level ${levelInfo.level + 1}`}
                                            </p>
                                        </div>
                                        <span className="cv-design-icon-well flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                                            <Zap size={16} />
                                        </span>
                                    </div>
                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--cv-border-warm)]">
                                        <div
                                            className="h-full rounded-full bg-[var(--cv-action-primary)] transition-[width] duration-500"
                                            style={{ width: `${Math.max((isLoadingLevel ? 0 : levelInfo.progress) * 100, 2)}%` }}
                                        />
                                    </div>
                                </section>
                            )}

                            <section className="cv-design-card p-4">
                                <h2 className="cv-design-title text-base">Quest progress</h2>
                                <p className="cv-design-body mt-0.5 text-xs">{clearedCount} / {stages.length} stages cleared</p>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--cv-border-warm)]">
                                    <div
                                        className="h-full rounded-full bg-[var(--cv-action-primary)] transition-[width] duration-500"
                                        style={{ width: `${Math.max(questProgressPct, clearedCount > 0 ? 4 : 0)}%` }}
                                    />
                                </div>
                                {questComplete ? (
                                    <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[var(--cv-success-600)]">
                                        <Trophy size={14} /> Loop cleared — quest complete!
                                    </p>
                                ) : (
                                    <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[var(--cv-action-primary)]">
                                        <Zap size={13} /> +{XP_RULES.quest_stage_cleared} XP per clear · +{XP_RULES.quest_completed} quest bonus
                                    </p>
                                )}
                            </section>

                            <section className="cv-design-card p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="cv-design-title text-base">Stage badges</h2>
                                    <span className="cv-design-body text-xs">{clearedCount} / {stages.length}</span>
                                </div>
                                <p className="cv-design-body mt-0.5 text-xs">Clear a stage to earn its badge.</p>
                                <div className="mt-3 grid grid-cols-5 gap-2">
                                    {stages.map((stage, index) => {
                                        const earned = stageStates[index] === 'cleared';
                                        return (
                                            <div
                                                key={stage.id}
                                                title={stage.title}
                                                className={`flex aspect-square items-center justify-center rounded-lg border text-xs font-extrabold transition-colors ${earned
                                                    ? 'border-[var(--cv-success-600)]/40 bg-[var(--cv-success-50)] text-[var(--cv-success-600)]'
                                                    : 'border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] text-[var(--cv-text-muted)]'
                                                    }`}
                                            >
                                                {earned ? <Check size={16} strokeWidth={3} /> : index + 1}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </aside>
                    </div>
                </div>
            </div>

            <CreditLimitModal />

            {battle && (
                <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" size={28} /></div>}>
                    <AIInterviewAgentModal
                        jobId={battle.jobId}
                        interviewPrompt={battle.prompt}
                        questions={battle.questions}
                        isFirstTime={battle.isFirstTime}
                        resumeContext={battle.resumeContext}
                        jobTitle={`${guide.company} quest — ${battle.stage.title}`}
                        jobCompany={guide.company}
                        initialTranscript={battle.initialTranscript}
                        resumeFromQuestionIndex={battle.resumeFromQuestionIndex}
                        onDraftChange={(draft) => saveInterviewDraft(battle.jobId, draft)}
                        onClose={() => setBattle(null)}
                        onAnalysisComplete={(analysis) => handleStageAnalysis(battle.stage, analysis)}
                    />
                </Suspense>
            )}

            {codingBattle && currentUser && (
                <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" size={28} /></div>}>
                    <CodingBattle
                        userId={currentUser.uid}
                        company={guide.company}
                        stageTitle={codingBattle.stage.title}
                        brief={codingBattle.brief}
                        preferredLanguage={getPreferredCodingLanguage(guide)}
                        initialArtifact={codingBattle.initialArtifact}
                        saveAnalysis={handleCodingAnalysis}
                        onAnalysisComplete={(analysis) => handleStageAnalysis(codingBattle.stage, analysis)}
                        onClose={() => setCodingBattle(null)}
                    />
                </Suspense>
            )}

            {designBattle && currentUser && (
                <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" size={28} /></div>}>
                    <SystemDesignBattle
                        userId={currentUser.uid}
                        company={guide.company}
                        stageTitle={designBattle.stage.title}
                        brief={designBattle.brief}
                        initialArtifact={designBattle.initialArtifact}
                        saveAnalysis={handleDesignAnalysis}
                        onAnalysisComplete={(analysis) => handleStageAnalysis(designBattle.stage, analysis)}
                        onClose={() => setDesignBattle(null)}
                    />
                </Suspense>
            )}

            {selectedReportEntry && (
                <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" size={28} /></div>}>
                    <InterviewReportModal
                        jobHistoryEntry={selectedReportEntry}
                        onClose={() => setSelectedReportEntry(null)}
                    />
                </Suspense>
            )}
        </AppLayout>
    );
};

export default CompanyQuestPage;
