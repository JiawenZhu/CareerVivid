import React, { Suspense, useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    BarChart3,
    Check,
    ChevronRight,
    Flame,
    Loader2,
    Lock,
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
    buildQuestLine,
    buildQuestStagePrompt,
    buildSystemDesignBrief,
    getStageFallbackQuestions,
    getStageQuestionPool,
    isStageCleared,
} from '../lib/companyQuests';
import { XP_RULES } from '../lib/gamification';
import { generateInterviewQuestions } from '../services/geminiService';
import { InterviewAnalysis, ResumeData } from '../types';
import { navigate } from '../utils/navigation';

const AIInterviewAgentModal = React.lazy(() => import('../components/AIInterviewAgentModal'));
const SystemDesignBattle = React.lazy(() => import('../components/Quest/SystemDesignBattle'));

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

type StageState = 'cleared' | 'unlocked' | 'locked';

interface BattleState {
    stage: QuestStage;
    jobId: string;
    prompt: string;
    questions: string[];
    resumeContext: string;
}

interface DesignBattleState {
    stage: QuestStage;
    jobId: string;
    brief: SystemDesignBrief;
}

interface CompanyQuestPageProps {
    slug: string;
}

const CompanyQuestPage: React.FC<CompanyQuestPageProps> = ({ slug }) => {
    const { currentUser } = useAuth();
    const { addJob, addAnalysisToJob } = usePracticeHistory();
    const { resumes } = useResumes();
    const { checkCredit, CreditLimitModal } = useAICreditCheck();

    const [guide, setGuide] = useState<LocalInterviewGuide | null>(null);
    const [isLoadingGuide, setIsLoadingGuide] = useState(true);
    const [startingStageId, setStartingStageId] = useState<string | null>(null);
    const [battle, setBattle] = useState<BattleState | null>(null);
    const [designBattle, setDesignBattle] = useState<DesignBattleState | null>(null);
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
        let previousCleared = true;
        return stages.map((stage) => {
            const cleared = isStageCleared(quest?.stageResults?.[stage.id]?.bestScore, stage);
            const state: StageState = cleared ? 'cleared' : previousCleared ? 'unlocked' : 'locked';
            previousCleared = cleared;
            return state;
        });
    }, [stages, quest]);

    const clearedCount = stageStates.filter((s) => s === 'cleared').length;
    const questComplete = stages.length > 0 && clearedCount === stages.length;

    const handleStartStage = async (stage: QuestStage) => {
        if (!guide || !currentUser) return;
        if (!checkCredit()) return;

        setStartingStageId(stage.id);
        setError('');
        setLastOutcome(null);

        try {
            // System design is played on the whiteboard, not as a voice interview.
            if (stage.id === 'system_design') {
                const brief = buildSystemDesignBrief(guide);
                const jobId = await addJob({
                    title: `${guide.company} quest — ${stage.title}`,
                    company: guide.company,
                    location: '',
                    description: brief.prompt,
                    url: guide.url,
                }, []);
                setDesignBattle({ stage, jobId, brief });
                return;
            }

            const prompt = buildQuestStagePrompt(guide, stage);
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

    const stageIcon = (state: StageState, index: number) => {
        if (state === 'cleared') return <Check size={16} strokeWidth={3} />;
        if (state === 'locked') return <Lock size={14} />;
        return <span className="text-sm font-bold">{index + 1}</span>;
    };

    const renderOutcomeBanner = () => {
        if (!lastOutcome) return null;
        if (lastOutcome.questCompleted) {
            return (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
                    <Trophy size={20} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Quest complete! You cleared the full {guide?.company} loop.</p>
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">+{XP_RULES.quest_completed} XP quest bonus earned.</p>
                    </div>
                </div>
            );
        }
        if (lastOutcome.cleared) {
            return (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
                    <Check size={20} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                            {lastOutcome.stageTitle} cleared with a score of {Math.round(lastOutcome.normalizedScore)}!
                        </p>
                        {lastOutcome.newlyCleared && (
                            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">+{XP_RULES.quest_stage_cleared} XP — next stage unlocked.</p>
                        )}
                    </div>
                </div>
            );
        }
        return (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/40">
                <Flame size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
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
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
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
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                                    <Swords size={17} />
                                </span>
                                <h1 className="truncate text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                    {guide.company} quest
                                </h1>
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Clear every stage of the real {guide.company} interview loop. Each stage is a live AI mock interview — score {stages[0]?.passThreshold ?? 70}+ to advance.
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
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                            <span>{clearedCount} / {stages.length} stages cleared</span>
                            {questComplete && (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                    <Trophy size={13} /> Loop cleared
                                </span>
                            )}
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                                className="h-full rounded-full bg-indigo-500 transition-[width] duration-500 dark:bg-indigo-400"
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
                <ol className="mt-2 space-y-3">
                    {stages.map((stage, index) => {
                        const state = stageStates[index];
                        const result = quest?.stageResults?.[stage.id];
                        const isStarting = startingStageId === stage.id;
                        return (
                            <li
                                key={stage.id}
                                className={`rounded-xl border p-4 transition-colors ${state === 'cleared'
                                    ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                                    : state === 'unlocked'
                                        ? 'border-indigo-200 bg-white shadow-sm dark:border-indigo-800 dark:bg-gray-900'
                                        : 'border-gray-200 bg-gray-50 opacity-70 dark:border-gray-800 dark:bg-gray-900/40'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${state === 'cleared'
                                        ? 'bg-emerald-500 text-white'
                                        : state === 'unlocked'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                        }`}>
                                        {stageIcon(state, index)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <h2 className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">{stage.title}</h2>
                                            <span className="shrink-0 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                                                pass ≥ {stage.passThreshold}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{stage.description}</p>
                                        {result && (
                                            <p className="mt-0.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                                                Best score {Math.round(result.bestScore)} · {result.attempts} attempt{result.attempts === 1 ? '' : 's'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="shrink-0">
                                        {state === 'locked' ? (
                                            <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">Clear previous stage</span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleStartStage(stage)}
                                                disabled={isStarting || startingStageId !== null}
                                                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${state === 'cleared'
                                                    ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                    }`}
                                            >
                                                {isStarting
                                                    ? <Loader2 size={14} className="animate-spin" />
                                                    : state === 'cleared'
                                                        ? <RotateCcw size={13} />
                                                        : stage.id === 'system_design'
                                                            ? <PenTool size={13} />
                                                            : <ChevronRight size={14} />}
                                                {state === 'cleared'
                                                    ? 'Improve score'
                                                    : stage.id === 'system_design'
                                                        ? 'Open whiteboard'
                                                        : 'Start stage'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ol>

                <p className="mt-4 text-center text-[11px] font-medium text-gray-400 dark:text-gray-500">
                    Stage XP: +{XP_RULES.quest_stage_cleared} per first clear · Quest bonus: +{XP_RULES.quest_completed}
                </p>
            </div>

            <CreditLimitModal />

            {battle && (
                <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" size={28} /></div>}>
                    <AIInterviewAgentModal
                        jobId={battle.jobId}
                        interviewPrompt={battle.prompt}
                        questions={battle.questions}
                        isFirstTime={true}
                        resumeContext={battle.resumeContext}
                        jobTitle={`${guide.company} quest — ${battle.stage.title}`}
                        jobCompany={guide.company}
                        onClose={() => setBattle(null)}
                        onAnalysisComplete={(analysis) => handleStageAnalysis(battle.stage, analysis)}
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
                        saveAnalysis={handleDesignAnalysis}
                        onAnalysisComplete={(analysis) => handleStageAnalysis(designBattle.stage, analysis)}
                        onClose={() => setDesignBattle(null)}
                    />
                </Suspense>
            )}
        </AppLayout>
    );
};

export default CompanyQuestPage;
