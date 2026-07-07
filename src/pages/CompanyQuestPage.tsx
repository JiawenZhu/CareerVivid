import React, { Suspense, useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    BarChart3,
    Check,
    ChevronDown,
    ChevronRight,
    Code2,
    Flame,
    Loader2,
    PenTool,
    RotateCcw,
    Swords,
    Trophy,
} from 'lucide-react';
import AppLayout from '../components/Layout/AppLayout';
import { useAuth } from '../contexts/AuthContext';
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
            <div className="mx-auto max-w-3xl p-4 sm:p-6">
                <button
                    type="button"
                    onClick={() => navigate('/interview-studio')}
                    className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <ArrowLeft size={15} /> Interview Studio
                </button>

                {/* Quest header */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#625bd5] text-white shadow-[0_4px_12px_rgba(98,91,213,0.25)] dark:bg-[#7069dc]">
                                    <Swords size={17} />
                                </span>
                                <h1 className="truncate text-xl [font-family:var(--cv-font-heading)] font-extrabold tracking-normal text-gray-900 dark:text-gray-100">
                                    {guide.company} quest
                                </h1>
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Practice the {guide.company} interview loop in any order. Score {stages[0]?.passThreshold ?? 75}+ on each stage to clear it and pass the full quest.
                            </p>
                        </div>
                        {guide.difficulty && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                <BarChart3 size={12} /> {guide.difficulty}/10
                            </span>
                        )}
                    </div>

                    {/* Progress */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                            <span>{clearedCount} / {stages.length} stages cleared</span>
                            {questComplete ? (
                                <span className="inline-flex items-center gap-1 text-[#15803d] dark:text-emerald-400">
                                    <Trophy size={13} /> Loop cleared
                                </span>
                            ) : (
                                <span className="text-[11px] font-bold text-[#625bd5] dark:text-[#9b96ef]">
                                    +{XP_RULES.quest_stage_cleared} XP per clear · +{XP_RULES.quest_completed} quest bonus
                                </span>
                            )}
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f3f4f6] dark:bg-gray-800">
                            <div
                                className="h-full rounded-full bg-[#625bd5] transition-[width] duration-500 dark:bg-[#8d88e6]"
                                style={{ width: `${stages.length ? (clearedCount / stages.length) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    {renderOutcomeBanner()}
                    {error && (
                        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                            {error}
                        </div>
                    )}
                </div>

                {/* Stage map */}
                <ol className="mt-2">
                    {stages.map((stage, index) => {
                        const state = stageStates[index];
                        const result = quest?.stageResults?.[stage.id];
                        const stageEntry = practiceEntriesByStageId.get(stage.id);
                        const reportEntry = (stageEntry?.interviewHistory?.length ?? 0) > 0 ? stageEntry : null;
                        const draft = getResumableDraft(stageEntry);
                        const isStarting = startingStageId === stage.id;
                        const isLast = index === stages.length - 1;
                        return (
                            <li
                                key={stage.id}
                                className="flex gap-3 sm:gap-3.5"
                            >
                                <div className="flex shrink-0 flex-col items-center">
                                    <span className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${state === 'cleared'
                                        ? 'bg-[#15803d] text-white shadow-sm dark:bg-[#22c55e]/80'
                                        : 'bg-[#625bd5] text-white shadow-[0_0_0_4px_rgba(243,242,255,0.95),0_6px_16px_rgba(98,91,213,0.18)] dark:bg-[#7069dc] dark:shadow-[0_0_0_4px_rgba(47,43,85,0.72)]'
                                        }`}>
                                        {stageIcon(state, index)}
                                    </span>
                                    {!isLast && (
                                        <span
                                            className={`min-h-5 w-0.5 flex-1 ${state === 'cleared'
                                                ? 'bg-[#cfe8d5] dark:bg-emerald-900/70'
                                                : 'bg-gray-200 dark:bg-gray-800'
                                                }`}
                                        />
                                    )}
                                </div>

                                <div className={`min-w-0 flex-1 pb-3 ${isLast ? 'pb-0' : ''}`}>
                                    <div className={`rounded-xl border p-4 transition-all ${state === 'cleared'
                                        ? 'border-[#cfe8d5] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-emerald-900/60 dark:bg-gray-900'
                                        : 'border-[#dfe2ff] bg-white shadow-[0_8px_24px_rgba(98,91,213,0.08)] dark:border-[#625bd5]/40 dark:bg-gray-900'
                                        }`}>
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                    <h2 className="min-w-0 truncate text-sm font-bold text-gray-900 dark:text-gray-100">{stage.title}</h2>
                                                    {state === 'available' && !result && (
                                                        <span className="shrink-0 rounded-full border border-[#dfe2ff] bg-[#f3f2ff] px-2 py-0.5 text-[10px] font-bold text-[#625bd5] dark:border-[#625bd5]/40 dark:bg-[#252244] dark:text-[#c9ccff]">
                                                            Available
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-xs font-medium leading-5 text-gray-500 dark:text-gray-400">{stage.description}</p>
                                                <p className="mt-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                                                    Pass ≥ {stage.passThreshold}
                                                    {result && (
                                                        <span> · Best score {Math.round(result.bestScore)} · {result.attempts} attempt{result.attempts === 1 ? '' : 's'}</span>
                                                    )}
                                                    {stage.id === 'coding' && codingPoolSize > 0 && (
                                                        <span> · {codingSolvedCount} of {codingPoolSize} problems solved</span>
                                                    )}
                                                    {stage.id === 'system_design' && systemDesignPoolSize > 0 && (
                                                        <span> · {systemDesignSolvedCount} of {systemDesignPoolSize} prompts cleared</span>
                                                    )}
                                                </p>
                                            </div>

                                            <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
                                                {reportEntry && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedReportEntry(reportEntry)}
                                                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#dfe2ff] bg-[#eef0ff] px-3 text-xs font-bold text-[#625bd5] shadow-sm transition-colors hover:bg-[#e6e8ff] hover:text-[#514ac5] dark:border-[#625bd5]/40 dark:bg-[#252244] dark:text-[#c9ccff] dark:hover:bg-[#312d6b]"
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
                                                                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${state === 'cleared'
                                                                    ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800'
                                                                    : 'border border-transparent bg-[#625bd5] text-white hover:bg-[#514ac5] dark:bg-[#7069dc] dark:hover:bg-[#8d88e6]'
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
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ol>

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
