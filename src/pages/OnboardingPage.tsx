import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    ArrowRight,
    BadgeCheck,
    Briefcase,
    CheckCircle2,
    Circle,
    ClipboardCheck,
    FileText,
    Import,
    LayoutDashboard,
    Mic,
    PlayCircle,
    Sparkles,
    Target,
    Timer,
    Wand2,
} from 'lucide-react';
import AppLayout from '../components/Layout/AppLayout';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useJobTracker } from '../hooks/useJobTracker';
import { usePracticeHistory } from '../hooks/useJobHistory';
import { useResumes } from '../hooks/useResumes';
import { navigate } from '../utils/navigation';

type StepState = 'complete' | 'active' | 'locked';

const primaryButtonClass = 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#211b16] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#3a2d23] focus:outline-none focus:ring-4 focus:ring-[#7069dc]/15 dark:bg-[#f4f1e9] dark:text-[#211b16] dark:hover:bg-white';
const secondaryButtonClass = 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#d9c7ad] bg-[#fffaf1] px-4 py-2.5 text-sm font-bold text-[#211b16] shadow-sm transition hover:bg-[#f6ecd9] focus:outline-none focus:ring-4 focus:ring-[#7069dc]/15 dark:border-[#37332d] dark:bg-[#262522] dark:text-[#f4f1e9] dark:hover:bg-[#302e2a]';

const statusCopy: Record<StepState, string> = {
    complete: 'Ready',
    active: 'Start here',
    locked: 'Next',
};

const QuickMetric = ({ label, value }: { label: string; value: string | number }) => (
    <div className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1]/82 px-4 py-3 shadow-sm dark:border-[#37332d] dark:bg-[#262522]/82">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#8a6027] dark:text-[#caa26c]">{label}</p>
        <p className="mt-1 text-2xl font-black text-[#211b16] dark:text-[#f4f1e9]">{value}</p>
    </div>
);

const OnboardingStep = ({
    step,
    title,
    description,
    state,
}: {
    step: string;
    title: string;
    description: string;
    state: StepState;
}) => {
    const isComplete = state === 'complete';
    const isActive = state === 'active';

    return (
        <div className={`rounded-lg border px-4 py-3 transition ${isActive
            ? 'border-[#7069dc] bg-[#f3f2ff] shadow-sm dark:border-[#8d88e6] dark:bg-[#302e4c]/45'
            : isComplete
                ? 'border-[#cfe3d6] bg-[#f7fff8] dark:border-emerald-900/50 dark:bg-emerald-950/18'
                : 'border-[#e4d3bc] bg-[#fffaf1]/70 dark:border-[#37332d] dark:bg-[#262522]/55'
            }`}
        >
            <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-black ${isComplete
                    ? 'border-[#cfe3d6] bg-white text-emerald-700 dark:border-emerald-900/50 dark:bg-[#1f1f1d] dark:text-emerald-300'
                    : isActive
                        ? 'border-[#7069dc] bg-white text-[#625bd5] dark:border-[#8d88e6] dark:bg-[#1f1f1d] dark:text-[#c8c5ff]'
                        : 'border-[#e4d3bc] bg-white text-[#8a6027] dark:border-[#37332d] dark:bg-[#1f1f1d] dark:text-[#aaa39a]'
                    }`}
                >
                    {isComplete ? <CheckCircle2 size={17} /> : step}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-black text-[#211b16] dark:text-[#f4f1e9]">{title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${isComplete
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : isActive
                                ? 'bg-white text-[#625bd5] dark:bg-[#1f1f1d] dark:text-[#c8c5ff]'
                                : 'bg-[#f6ecd9] text-[#8a6027] dark:bg-[#302e2a] dark:text-[#aaa39a]'
                            }`}
                        >
                            {statusCopy[state]}
                        </span>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-[#665a4a] dark:text-[#aaa39a]">{description}</p>
                </div>
            </div>
        </div>
    );
};

const PathCard = ({
    icon,
    eyebrow,
    title,
    description,
    checklist,
    cta,
    secondaryCta,
    onPrimary,
    onSecondary,
}: {
    icon: React.ReactNode;
    eyebrow: string;
    title: string;
    description: string;
    checklist: string[];
    cta: string;
    secondaryCta?: string;
    onPrimary: () => void;
    onSecondary?: () => void;
}) => (
    <article className="flex h-full flex-col rounded-lg border border-[#e4d3bc] bg-[#fffaf1]/92 p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522]/92">
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="cv-warm-eyebrow">{eyebrow}</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-[#211b16] dark:text-[#f4f1e9]">{title}</h2>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f2dfc2] text-[#8b5a16] dark:bg-[#302e2a] dark:text-[#caa26c]">
                {icon}
            </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#665a4a] dark:text-[#aaa39a]">{description}</p>
        <div className="mt-5 space-y-2">
            {checklist.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-semibold text-[#4f4538] dark:text-[#d8d1c7]">
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-300" />
                    <span>{item}</span>
                </div>
            ))}
        </div>
        <div className="mt-auto flex flex-wrap gap-3 pt-6">
            <button type="button" onClick={onPrimary} className={primaryButtonClass}>
                {cta}
                <ArrowRight size={16} />
            </button>
            {secondaryCta && onSecondary && (
                <button type="button" onClick={onSecondary} className={secondaryButtonClass}>
                    {secondaryCta}
                </button>
            )}
        </div>
    </article>
);

const OnboardingPage: React.FC = () => {
    const { currentUser, userProfile } = useAuth();
    const { resumes, isLoading: isLoadingResumes } = useResumes();
    const { jobApplications, isLoading: isLoadingJobs } = useJobTracker();
    const { practiceHistory, isLoading: isLoadingPractice } = usePracticeHistory();

    const primaryResume = resumes[0];
    const hasResume = resumes.length > 0;
    const hasJob = jobApplications.length > 0;
    const hasPractice = practiceHistory.length > 0;
    const firstName = userProfile?.displayName?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'there';

    const resumeTarget = primaryResume?.id ? `/edit/${primaryResume.id}` : '/newresume?scrollTo=create-section';
    const tailorTarget = primaryResume?.id ? `/edit/${primaryResume.id}?source=onboarding_tailor` : '/newresume?scrollTo=create-section';
    const firstTailorTarget = hasResume && hasJob ? tailorTarget : hasResume ? '/jobs/recommend' : '/newresume?scrollTo=create-section';
    const completedCount = [currentUser, hasResume, hasJob, hasPractice].filter(Boolean).length;
    const progressPercent = Math.round((completedCount / 4) * 100);
    const isLoadingWorkspace = isLoadingResumes || isLoadingJobs || isLoadingPractice;

    const steps = useMemo(() => {
        return [
            {
                step: '1',
                title: 'Create your base resume',
                description: 'Import an existing resume or start a structured resume in the editor.',
                state: hasResume ? 'complete' : 'active',
            },
            {
                step: '2',
                title: 'Attach one target role',
                description: 'Save a job from Chrome or add one in the job tracker so tailoring has real context.',
                state: !hasResume ? 'locked' : hasJob ? 'complete' : 'active',
            },
            {
                step: '3',
                title: 'Tailor the resume',
                description: 'Open the resume editor and use the job context to tighten summary, proof, and skills.',
                state: hasResume && hasJob ? 'complete' : 'locked',
            },
            {
                step: '4',
                title: 'Run one mock interview',
                description: 'Practice out loud, capture the transcript, and review the feedback report.',
                state: !hasResume || !hasJob ? 'locked' : hasPractice ? 'complete' : 'active',
            },
        ] as Array<{ step: string; title: string; description: string; state: StepState }>;
    }, [hasJob, hasPractice, hasResume]);

    return (
        <AppLayout>
            <Helmet>
                <title>Quick Start Onboarding | CareerVivid</title>
                <meta name="robots" content="noindex,nofollow" />
            </Helmet>
            <div className="cv-warm-page cv-warm-grid min-h-screen px-4 py-6 text-[#211b16] dark:text-[#f4f1e9] sm:px-6 lg:px-8">
                <div className="mx-auto max-w-screen-2xl">
                    <header className="flex flex-col gap-4 border-b border-[#e4d3bc] pb-6 dark:border-[#37332d] md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="hidden h-12 w-12 items-center justify-center rounded-lg border border-[#e4d3bc] bg-[#fffaf1] shadow-sm dark:border-[#37332d] dark:bg-[#262522] sm:flex">
                                <Logo className="h-8 w-8" />
                            </div>
                            <div>
                                <p className="cv-warm-eyebrow">Quick start workspace</p>
                                <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-[#211b16] dark:text-[#f4f1e9] sm:text-4xl">
                                    Start with a strong resume, then rehearse the role.
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#665a4a] dark:text-[#aaa39a]">
                                    Hi {firstName}. This plan gets a new CareerVivid workspace moving quickly without guessing where to click first.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button type="button" onClick={() => navigate('/dashboard')} className={secondaryButtonClass}>
                                <LayoutDashboard size={16} />
                                Dashboard
                            </button>
                            <button type="button" onClick={() => navigate('/newresume?scrollTo=create-section')} className={primaryButtonClass}>
                                <Import size={16} />
                                Import resume
                            </button>
                        </div>
                    </header>

                    <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.55fr)]">
                        <div className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1]/88 p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522]/88">
                            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-[#d9c7ad] bg-[#fffaf1] px-3 py-1.5 text-xs font-bold text-[#8b5a16] shadow-sm dark:border-[#37332d] dark:bg-[#302e2a] dark:text-[#caa26c]">
                                        <Timer size={14} />
                                        First 10 minutes
                                    </div>
                                    <h2 className="mt-3 text-2xl font-black tracking-tight text-[#211b16] dark:text-[#f4f1e9]">
                                        {isLoadingWorkspace ? 'Checking your workspace...' : `${completedCount} of 4 setup signals ready`}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-[#665a4a] dark:text-[#aaa39a]">
                                        The onboarding path is intentionally short: resume, one target job, one tailored pass, one interview rehearsal.
                                    </p>
                                </div>
                                <div className="w-full max-w-xs">
                                    <div className="flex items-center justify-between text-xs font-bold text-[#665a4a] dark:text-[#aaa39a]">
                                        <span>Workspace readiness</span>
                                        <span>{progressPercent}%</span>
                                    </div>
                                    <div className="mt-2 h-3 overflow-hidden rounded-full border border-[#e4d3bc] bg-[#f6ecd9] dark:border-[#37332d] dark:bg-[#1f1f1d]">
                                        <div className="h-full rounded-full bg-[#625bd5] transition-all" style={{ width: `${progressPercent}%` }} />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 grid gap-3 md:grid-cols-4">
                                <QuickMetric label="Resumes" value={isLoadingResumes ? '...' : resumes.length} />
                                <QuickMetric label="Saved jobs" value={isLoadingJobs ? '...' : jobApplications.length} />
                                <QuickMetric label="Interviews" value={isLoadingPractice ? '...' : practiceHistory.length} />
                                <QuickMetric label="Next step" value={hasResume ? (hasPractice ? 'Review' : 'Practice') : 'Resume'} />
                            </div>
                        </div>

                        <div className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1]/88 p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522]/88">
                            <p className="cv-warm-eyebrow">Current setup</p>
                            <div className="mt-4 space-y-3">
                                {steps.map((item) => (
                                    <OnboardingStep key={item.step} {...item} />
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="mt-6 grid gap-4 lg:grid-cols-2">
                        <PathCard
                            eyebrow="Resume editor"
                            icon={<FileText size={21} />}
                            title="Build the base resume first"
                            description="Create the reusable resume that every tailored version starts from. A clean base resume makes the AI review, ATS pass, and PDF export easier to trust."
                            checklist={[
                                'Import PDF, text, or markdown',
                                'Review profile, experience, skills, and links',
                                'Open the editor whenever a role needs tailoring',
                            ]}
                            cta={hasResume ? 'Open resume editor' : 'Create base resume'}
                            secondaryCta="View dashboard"
                            onPrimary={() => navigate(resumeTarget)}
                            onSecondary={() => navigate('/dashboard')}
                        />
                        <PathCard
                            eyebrow="Mock interview"
                            icon={<Mic size={21} />}
                            title="Practice from the same job context"
                            description="Once a target role exists, run a focused interview session and keep the transcript, feedback, and next prep action connected to your workspace."
                            checklist={[
                                'Choose behavioral, technical, mixed, or screening mode',
                                'Use your current resume as interview context',
                                'Review the transcript and debrief after the session',
                            ]}
                            cta="Start mock interview"
                            secondaryCta={hasJob ? 'Open job tracker' : 'Find a target job'}
                            onPrimary={() => navigate('/interview-studio')}
                            onSecondary={() => navigate(hasJob ? '/job-tracker' : '/jobs/recommend')}
                        />
                    </section>

                    <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.4fr)]">
                        <div className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1]/88 p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522]/88">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="cv-warm-eyebrow">Recommended first run</p>
                                    <h2 className="mt-2 text-xl font-black tracking-tight text-[#211b16] dark:text-[#f4f1e9]">One job packet, end to end</h2>
                                </div>
                                <button type="button" onClick={() => navigate(firstTailorTarget)} className={secondaryButtonClass}>
                                    <Wand2 size={16} />
                                    Resume tailoring
                                </button>
                            </div>
                            <div className="mt-5 grid gap-3 md:grid-cols-3">
                                {[
                                    {
                                        icon: <Briefcase size={18} />,
                                        title: 'Capture',
                                        copy: 'Save one role from Chrome or add it manually so the job description is attached.',
                                        action: 'Save or find job',
                                        path: hasJob ? '/job-tracker' : '/jobs/recommend',
                                    },
                                    {
                                        icon: <Target size={18} />,
                                        title: 'Tailor',
                                        copy: 'Use the editor to align the summary, strongest bullets, and key skills to the role.',
                                        action: hasResume && hasJob ? 'Open tailor flow' : 'Attach target job',
                                        path: firstTailorTarget,
                                    },
                                    {
                                        icon: <PlayCircle size={18} />,
                                        title: 'Rehearse',
                                        copy: 'Start one live practice and answer out loud before reviewing the transcript.',
                                        action: 'Practice now',
                                        path: '/interview-studio',
                                    },
                                ].map((item) => (
                                    <button
                                        key={item.title}
                                        type="button"
                                        onClick={() => navigate(item.path)}
                                        className="group rounded-lg border border-[#e4d3bc] bg-[#fffaf1] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#caa26c] hover:bg-[#fff7e8] dark:border-[#37332d] dark:bg-[#1f1f1d] dark:hover:bg-[#302e2a]"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f2dfc2] text-[#8b5a16] dark:bg-[#302e2a] dark:text-[#caa26c]">
                                            {item.icon}
                                        </div>
                                        <h3 className="mt-4 text-base font-black text-[#211b16] dark:text-[#f4f1e9]">{item.title}</h3>
                                        <p className="mt-2 min-h-[60px] text-sm leading-5 text-[#665a4a] dark:text-[#aaa39a]">{item.copy}</p>
                                        <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#625bd5] dark:text-[#c8c5ff]">
                                            {item.action}
                                            <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <aside className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1]/88 p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522]/88">
                            <p className="cv-warm-eyebrow">What good looks like</p>
                            <div className="mt-4 space-y-4">
                                {[
                                    {
                                        icon: <ClipboardCheck size={18} />,
                                        title: 'One source of truth',
                                        copy: 'The role, resume, interview prep, and next action stay attached to the same job packet.',
                                    },
                                    {
                                        icon: <BadgeCheck size={18} />,
                                        title: 'Proof over polish',
                                        copy: 'Every tailored bullet should make a real requirement easier for a recruiter to verify.',
                                    },
                                    {
                                        icon: <Sparkles size={18} />,
                                        title: 'Fast repeatable loop',
                                        copy: 'After the first packet, repeat the same capture, tailor, rehearse workflow for each serious role.',
                                    },
                                ].map((item) => (
                                    <div key={item.title} className="grid grid-cols-[40px_1fr] gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f2dfc2] text-[#8b5a16] dark:bg-[#302e2a] dark:text-[#caa26c]">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-[#211b16] dark:text-[#f4f1e9]">{item.title}</h3>
                                            <p className="mt-1 text-sm leading-5 text-[#665a4a] dark:text-[#aaa39a]">{item.copy}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 rounded-lg border border-[#d9c7ad] bg-[#f9efe0]/80 p-4 dark:border-[#37332d] dark:bg-[#302e2a]/80">
                                <div className="flex items-center gap-2 text-sm font-black text-[#211b16] dark:text-[#f4f1e9]">
                                    {hasResume && hasJob ? <CheckCircle2 size={17} className="text-emerald-600" /> : <Circle size={17} className="text-[#8a6027]" />}
                                    {hasResume && hasJob ? 'Ready for a serious application packet' : 'Finish resume plus one target job first'}
                                </div>
                            </div>
                        </aside>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
};

export default OnboardingPage;
