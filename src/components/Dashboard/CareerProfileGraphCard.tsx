import React, { useMemo, useState } from 'react';
import {
    Activity,
    ArrowRight,
    Bot,
    Briefcase,
    Clipboard,
    CheckCircle2,
    CircleDashed,
    Code2,
    FileText,
    FolderOpen,
    GraduationCap,
    History,
    Mic,
    Network,
    Search,
    Sparkles,
    Target,
    type LucideIcon,
} from 'lucide-react';
import type { JobApplicationData, PracticeHistoryEntry, ResumeData } from '../../types';
import type { PortfolioData } from '../../features/portfolio/types/portfolio';
import {
    buildCareerProfileGraph,
    type CareerProfileGraphNode,
    type CareerProfileGraphNodeId,
    type CareerProfileGraphTone,
    type LearningToolId,
    type SkillGapLearningMission,
} from '../../utils/careerProfileGraph';
import { navigate } from '../../utils/navigation';

interface CareerProfileGraphCardProps {
    resumes: ResumeData[];
    portfolios: PortfolioData[];
    practiceHistory: PracticeHistoryEntry[];
    jobApplications: JobApplicationData[];
}

const nodeIcons: Record<CareerProfileGraphNodeId, LucideIcon> = {
    resume: FileText,
    skills: Sparkles,
    goals: Target,
    targetRoles: Briefcase,
    proof: FolderOpen,
    interview: Mic,
    jobHistory: History,
};

const toneStyles: Record<CareerProfileGraphTone, {
    chip: string;
    icon: string;
    bar: string;
    border: string;
}> = {
    blue: {
        chip: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900/50',
        icon: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200',
        bar: 'bg-blue-500',
        border: 'hover:border-blue-200 dark:hover:border-blue-900/70',
    },
    emerald: {
        chip: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900/50',
        icon: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
        bar: 'bg-emerald-500',
        border: 'hover:border-emerald-200 dark:hover:border-emerald-900/70',
    },
    amber: {
        chip: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/50',
        icon: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
        bar: 'bg-amber-500',
        border: 'hover:border-amber-200 dark:hover:border-amber-900/70',
    },
    violet: {
        chip: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/30 dark:text-violet-200 dark:border-violet-900/50',
        icon: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200',
        bar: 'bg-violet-500',
        border: 'hover:border-violet-200 dark:hover:border-violet-900/70',
    },
    pink: {
        chip: 'bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-950/30 dark:text-pink-200 dark:border-pink-900/50',
        icon: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-200',
        bar: 'bg-pink-500',
        border: 'hover:border-pink-200 dark:hover:border-pink-900/70',
    },
    slate: {
        chip: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/70 dark:text-slate-200 dark:border-slate-800',
        icon: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200',
        bar: 'bg-slate-500',
        border: 'hover:border-slate-300 dark:hover:border-slate-700',
    },
    indigo: {
        chip: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-200 dark:border-indigo-900/50',
        icon: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200',
        bar: 'bg-indigo-500',
        border: 'hover:border-indigo-200 dark:hover:border-indigo-900/70',
    },
};

const learningToolStyles: Record<LearningToolId, {
    icon: LucideIcon;
    label: string;
    className: string;
}> = {
    chatgpt: {
        icon: Bot,
        label: 'ChatGPT',
        className: 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200',
    },
    gemini: {
        icon: Search,
        label: 'Gemini',
        className: 'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200',
    },
    claudeCode: {
        icon: Code2,
        label: 'Claude Code',
        className: 'border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-200',
    },
    proof: {
        icon: GraduationCap,
        label: 'Proof',
        className: 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200',
    },
};

const SignalChip: React.FC<{ label: string; className: string }> = ({ label, className }) => (
    <span className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold leading-none ${className}`}>
        <CheckCircle2 size={10} className="shrink-0" />
        <span className="truncate">{label}</span>
    </span>
);

const EmptyChip: React.FC<{ label: string }> = ({ label }) => (
    <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-bold leading-none text-stone-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
        <CircleDashed size={10} />
        {label}
    </span>
);

const LearningMissionCard: React.FC<{
    mission: SkillGapLearningMission;
    copied: boolean;
    onCopy: (mission: SkillGapLearningMission) => void;
}> = ({ mission, copied, onCopy }) => (
    <article className="rounded-2xl border border-stone-200/80 bg-white/85 p-4 shadow-sm transition hover:border-stone-300 dark:border-slate-800/80 dark:bg-slate-950/55 dark:hover:border-slate-700">
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                    Skill gap
                </p>
                <h3 className="mt-1 text-base font-extrabold text-slate-950 dark:text-white">
                    {mission.skill}
                </h3>
                <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
                    {mission.reason}
                </p>
            </div>
            <span className="shrink-0 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-stone-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {mission.demandCount}x
            </span>
        </div>

        <div className="mt-4 grid gap-2">
            {mission.steps.map((step) => {
                const style = learningToolStyles[step.tool];
                const Icon = style.icon;
                return (
                    <div key={`${mission.id}-${step.tool}`} className={`rounded-xl border px-3 py-2 ${style.className}`}>
                        <div className="flex items-center gap-2">
                            <Icon size={14} className="shrink-0" />
                            <span className="text-xs font-black">{style.label}</span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">{step.label}</span>
                        </div>
                        <p className="mt-1 text-xs font-medium leading-5 opacity-90">
                            {step.instruction}
                        </p>
                    </div>
                );
            })}
        </div>

        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500 dark:text-slate-400">
                Proof outcome
            </p>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-700 dark:text-slate-200">
                {mission.proofOutcome}
            </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
            <button
                type="button"
                onClick={() => onCopy(mission)}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-stone-300 hover:bg-stone-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700"
            >
                <Clipboard size={14} />
                {copied ? 'Prompt copied' : 'Copy AI prompt'}
            </button>
            <button
                type="button"
                onClick={() => navigate('/portfolio')}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-700"
            >
                Add proof
                <ArrowRight size={14} />
            </button>
        </div>
    </article>
);

const GraphNodeCard: React.FC<{ node: CareerProfileGraphNode }> = ({ node }) => {
    const Icon = nodeIcons[node.id];
    const styles = toneStyles[node.tone];

    return (
        <article className={`group flex min-h-[206px] flex-col rounded-2xl border border-stone-200/80 bg-white/85 p-4 shadow-sm transition dark:border-slate-800/80 dark:bg-slate-950/55 ${styles.border}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${styles.icon}`}>
                        <Icon size={18} />
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">{node.label}</h3>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                            {node.value}
                        </p>
                    </div>
                </div>
                <span className="text-xs font-black text-slate-500 dark:text-slate-400">{node.progress}%</span>
            </div>

            <p className="mt-4 line-clamp-2 min-h-[40px] text-sm leading-5 text-slate-600 dark:text-slate-300">
                {node.detail}
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-slate-900">
                <div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${node.progress}%` }} />
            </div>

            <div className="mt-4 flex min-h-[28px] flex-wrap gap-1.5">
                {node.tags.length > 0
                    ? node.tags.map((tag) => <SignalChip key={tag} label={tag} className={styles.chip} />)
                    : <EmptyChip label="Needs signal" />}
            </div>

            <button
                type="button"
                onClick={() => navigate(node.actionPath)}
                className="mt-auto inline-flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-stone-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700"
            >
                {node.actionLabel}
                <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
            </button>
        </article>
    );
};

const CareerProfileGraphCard: React.FC<CareerProfileGraphCardProps> = ({
    resumes,
    portfolios,
    practiceHistory,
    jobApplications,
}) => {
    const graph = useMemo(() => buildCareerProfileGraph({
        resumes,
        portfolios,
        practiceHistory,
        jobApplications,
    }), [jobApplications, portfolios, practiceHistory, resumes]);

    return (
        <section className="mb-8" aria-labelledby="career-profile-graph-title">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                        <Network size={13} />
                        Career profile graph
                    </div>
                    <h2 id="career-profile-graph-title" className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                        Your career signals in one place
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                        Built from resumes, skills, goals, target roles, proof projects, interview practice, and job history.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    >
                        Profile settings
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(graph.nextBestStep.actionPath)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-3.5 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-primary-700"
                    >
                        Improve next signal
                        <ArrowRight size={15} />
                    </button>
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <aside className="rounded-2xl border border-stone-200/80 bg-white/85 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/55">
                    <div className="flex items-center gap-4">
                        <div
                            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full p-1"
                            style={{ background: `conic-gradient(#625bd5 ${graph.completionScore * 3.6}deg, #e7e5e4 0deg)` }}
                            aria-label={`Profile graph ${graph.completionScore}% complete`}
                        >
                            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center dark:bg-slate-950">
                                <span className="text-2xl font-black text-slate-950 dark:text-white">{graph.completionScore}%</span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Mapped</span>
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                                Live signals
                            </p>
                            <p className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                                {graph.signalCount}
                            </p>
                            <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
                                Strongest signal: <span className="font-bold text-slate-800 dark:text-slate-100">{graph.strongestSignal}</span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 dark:bg-slate-950/70 dark:text-amber-200">
                                <Activity size={16} />
                            </span>
                            <div>
                                <p className="text-sm font-extrabold text-slate-950 dark:text-white">
                                    Next best step
                                </p>
                                <p className="mt-1 text-sm leading-5 text-slate-700 dark:text-slate-300">
                                    Improve <span className="font-bold">{graph.nextBestStep.label.toLowerCase()}</span>: {graph.nextBestStep.detail}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
                        <div>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">Top skills</p>
                            <div className="flex flex-wrap gap-1.5">
                                {graph.topSkills.length > 0
                                    ? graph.topSkills.slice(0, 6).map((skill) => <SignalChip key={skill} label={skill} className={toneStyles.emerald.chip} />)
                                    : <EmptyChip label="Add skills" />}
                            </div>
                        </div>
                        <div>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">Target roles</p>
                            <div className="flex flex-wrap gap-1.5">
                                {graph.targetRoles.length > 0
                                    ? graph.targetRoles.slice(0, 4).map((role) => <SignalChip key={role} label={role} className={toneStyles.violet.chip} />)
                                    : <EmptyChip label="Find roles" />}
                            </div>
                        </div>
                    </div>
                </aside>

                <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    {graph.nodes.map((node) => (
                        <GraphNodeCard key={node.id} node={node} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export const SkillGapLearningSection: React.FC<CareerProfileGraphCardProps> = ({
    resumes,
    portfolios,
    practiceHistory,
    jobApplications,
}) => {
    const [copiedMissionId, setCopiedMissionId] = useState<string | null>(null);
    const graph = useMemo(() => buildCareerProfileGraph({
        resumes,
        portfolios,
        practiceHistory,
        jobApplications,
    }), [jobApplications, portfolios, practiceHistory, resumes]);

    const handleCopyMissionPrompt = async (mission: SkillGapLearningMission) => {
        try {
            await navigator.clipboard?.writeText(mission.prompt);
            setCopiedMissionId(mission.id);
            window.setTimeout(() => setCopiedMissionId(null), 1800);
        } catch (error) {
            console.warn('Could not copy learning prompt:', error);
        }
    };

    return (
        <section className="mt-8 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/35" aria-labelledby="skill-gap-learning-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                        <GraduationCap size={13} />
                        Close skill gaps
                    </div>
                    <h3 id="skill-gap-learning-title" className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                        Learn the skills that unlock stronger matches
                    </h3>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                        Each mission turns a job-market gap into an AI-assisted learning path, then packages the result as resume, interview, and portfolio proof.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/jobs/recommend')}
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                    Refresh job gaps
                    <ArrowRight size={15} />
                </button>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {graph.learningMissions.map((mission) => (
                    <LearningMissionCard
                        key={mission.id}
                        mission={mission}
                        copied={copiedMissionId === mission.id}
                        onCopy={handleCopyMissionPrompt}
                    />
                ))}
            </div>
        </section>
    );
};

export default CareerProfileGraphCard;
