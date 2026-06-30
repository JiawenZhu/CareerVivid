import React from 'react';
import {
    ArrowRight,
    BadgeCheck,
    Briefcase,
    Building2,
    CheckCircle2,
    Chrome,
    ClipboardCheck,
    DollarSign,
    ExternalLink,
    FileText,
    LayoutDashboard,
    Lock,
    Mic,
    PlayCircle,
    Search,
    ShieldCheck,
    Sparkles,
    Users,
    Wand2,
} from 'lucide-react';
import { navigate } from '../../utils/navigation';

const featureTabs = [
    { label: 'Job Tracker', icon: Briefcase, href: '/job-tracker' },
    { label: 'AI Resume Builder', icon: FileText, href: '/newresume' },
    { label: 'Resume Tailor', icon: Wand2, href: '/newresume' },
    { label: 'Autofill Applications', icon: Chrome, href: '/extension-welcome' },
    { label: 'Resume Match', icon: Search, href: '/newresume' },
    { label: 'Interview Coach', icon: Mic, href: '/interview-studio' },
    { label: 'Career Pipeline', icon: LayoutDashboard, href: '/job-tracker' },
];

const proofCards = [
    {
        icon: ExternalLink,
        title: 'Direct apply links stay attached',
        copy: 'Save the original company career page, application URL, source, and next action with the role instead of losing it in browser history.',
    },
    {
        icon: DollarSign,
        title: 'Salary and level context ready',
        copy: 'CareerVivid is designed to pair target roles with compensation and leveling context when approved partner data is available.',
    },
    {
        icon: BadgeCheck,
        title: 'Application packet, not scattered tools',
        copy: 'Resume match, tailored notes, interview prep, and follow-up history live with the job so users know what to do next.',
    },
];

const userStories = [
    {
        role: 'Career switcher',
        name: 'Maya, product analyst',
        avatar: 'M',
        avatarSrc: '/avatars/careervivid-rabbit-bow.jpg',
        avatarTone: 'bg-[#f3f2ff] text-[#625bd5] border-[#e8e6ff]',
        quote: 'I need to know which applications deserve a tailored resume today, not just collect another list of jobs.',
        outcome: 'Prioritized job cards with match gaps and next steps.',
    },
    {
        role: 'New grad',
        name: 'Alex, new CS grad',
        avatar: 'A',
        avatarSrc: '/avatars/careervivid-rabbit-glasses.jpg',
        avatarTone: 'bg-[#f7fff8] text-[#15803d] border-[#d9eadb]',
        quote: 'I want a place where every role has notes, prep questions, and the original apply link before I forget why I saved it.',
        outcome: 'Application context saved from the browser into one workspace.',
    },
    {
        role: 'Busy applicant',
        name: 'Jordan, full-stack engineer',
        avatar: 'J',
        avatarSrc: '',
        avatarTone: 'bg-[#fff7e8] text-[#a16207] border-[#ead8b3]',
        quote: 'I need a repeatable routine: find the job, tailor the resume, apply directly, then follow up.',
        outcome: 'Tracker, resume tailoring, and interview prep connected.',
    },
];

const workflowSteps = [
    {
        number: '1',
        title: 'Find or capture the role',
        copy: 'Save a job from the web, keep the direct application URL, and add company, location, deadline, notes, and status.',
    },
    {
        number: '2',
        title: 'Understand the fit',
        copy: 'Compare your resume against the role, review missing proof, and decide whether the job is worth tailoring.',
    },
    {
        number: '3',
        title: 'Tailor and apply',
        copy: 'Create role-specific resume improvements, keep the application page attached, and move the job through the pipeline.',
    },
    {
        number: '4',
        title: 'Prepare for the next conversation',
        copy: 'Generate interview prep, notes, and follow-up reminders from the exact role context you saved.',
    },
];

const trustNotes = [
    {
        icon: ShieldCheck,
        title: 'Plain claims',
        copy: 'CareerVivid keeps trust tied to visible product workflows instead of exaggerated AI promises.',
    },
    {
        icon: Lock,
        title: 'Private workspace',
        copy: 'Saved jobs, resumes, prep notes, and application context stay inside the user account and product workflow.',
    },
    {
        icon: Users,
        title: 'Built for repeated use',
        copy: 'The app is designed for the daily rhythm of searching, applying, following up, and improving materials.',
    },
];

const faqs = [
    {
        question: 'Is CareerVivid just a resume builder?',
        answer: 'No. The resume builder is one part of the workspace. CareerVivid also includes a job tracker, resume matching, interview prep, application notes, and Chrome extension workflows.',
    },
    {
        question: 'Can CareerVivid help with direct applications?',
        answer: 'Yes. The workflow is built around saving the original job source and application link so users can apply directly and keep context attached to the role.',
    },
    {
        question: 'Do I need my own AI API key?',
        answer: 'No for the hosted app. CareerVivid uses managed Gemini-powered features through the app. Developers who self-host can configure their own Firebase and Gemini setup.',
    },
];

const PaperSection = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <section className={`relative overflow-hidden border-t border-[#e6dac8] bg-[#f7f1e7] text-[#211b16] ${className}`}>
        <div className="pointer-events-none absolute inset-0 opacity-55 cv-warm-grid" />
        <div className="relative">{children}</div>
    </section>
);

export const ProductIndex = () => (
    <section className="border-y border-gray-200 bg-white/90 py-4 dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-4 pb-1 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featureTabs.map(({ label, icon: Icon, href }) => (
                <button
                    key={label}
                    onClick={() => navigate(href)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                >
                    <Icon size={16} className="text-[#625bd5] dark:text-[#a9a5ff]" />
                    {label}
                </button>
            ))}
        </div>
    </section>
);

export const DemoVideoSection = () => (
    <PaperSection className="py-14 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:px-8">
            <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e4d3bc] bg-[#fffaf1]/88 px-3 py-2 text-xs font-bold text-[#8a6027] shadow-sm">
                    <PlayCircle size={15} className="text-[#625bd5]" />
                    Product walkthrough
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#211b16] sm:text-4xl">
                    See the Chrome-to-workspace flow in action.
                </h2>
                <p className="mt-4 text-base font-medium leading-7 text-[#665a4a]">
                    Watch how CareerVivid keeps a saved job, resume tailoring, and interview prep connected in one application workspace.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    {[
                        ['Capture', 'Save the role from Chrome.'],
                        ['Tailor', 'Load the job into your resume.'],
                        ['Practice', 'Prepare from the same context.'],
                    ].map(([label, copy]) => (
                        <div key={label} className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/88 p-4 shadow-sm">
                            <p className="text-sm font-semibold text-[#211b16]">{label}</p>
                            <p className="mt-1 text-xs font-semibold leading-5 text-[#665a4a]">{copy}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-[22px] border border-[#e4d3bc] bg-[#fffaf1]/90 p-2 shadow-2xl shadow-[#8b5a16]/10 sm:p-3">
                <div className="overflow-hidden rounded-2xl border border-[#eadbc5] bg-[#211b16]">
                    <div className="flex items-center justify-between border-b border-white/10 bg-[#2b241d] px-3 py-2 sm:px-4">
                        <div className="flex items-center gap-2" aria-hidden="true">
                            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold text-[#f4f1e9]">
                            CareerVivid demo
                        </span>
                    </div>
                    <div className="relative aspect-video w-full bg-[#211b16]">
                        <iframe
                            className="absolute inset-0 h-full w-full"
                            src="https://www.youtube.com/embed/8LhKxfBjvfg?si=KNGiuzfLSUk-OPqC"
                            title="CareerVivid Chrome extension and job-search workspace demo"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                            loading="lazy"
                        />
                    </div>
                </div>
            </div>
        </div>
    </PaperSection>
);

export const ProofSection = () => (
    <PaperSection className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                <div>
                    <p className="cv-warm-eyebrow">Why it feels trustworthy</p>
                    <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[#211b16] sm:text-5xl">
                        A job-search workflow users can verify.
                    </h2>
                    <p className="mt-5 text-lg font-medium leading-8 text-[#665a4a]">
                        CareerVivid should show exactly what it helps with: direct job links, resume fit, prep notes, and a clear next step for every application.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {proofCards.map(({ icon: Icon, title, copy }) => (
                        <article key={title} className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/88 p-5 shadow-sm">
                            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f2dfc2] text-[#8b5a16]">
                                <Icon size={21} />
                            </div>
                            <h3 className="text-lg font-semibold text-[#211b16]">{title}</h3>
                            <p className="mt-3 text-sm font-medium leading-6 text-[#665a4a]">{copy}</p>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    </PaperSection>
);

export const UserStoriesSection = () => (
    <PaperSection className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="max-w-3xl">
                    <p className="cv-warm-eyebrow">User stories</p>
                    <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[#211b16] sm:text-5xl">
                        Designed around the moments job seekers repeat.
                    </h2>
                    <p className="mt-4 text-base font-medium leading-7 text-[#665a4a]">
                        These example story cards show the target user problems CareerVivid is built to solve while public customer reviews are still being collected.
                    </p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/88 px-4 py-3 shadow-sm">
                    <div className="flex -space-x-3" aria-hidden="true">
                        {userStories.map(({ role, avatar, avatarSrc, avatarTone }) => (
                            <span
                                key={role}
                                className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-[#fffaf1] text-sm font-semibold shadow-sm ${avatarTone}`}
                            >
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
                                ) : (
                                    avatar
                                )}
                            </span>
                        ))}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[#211b16]">Example job-seeker stories</p>
                        <p className="text-xs font-semibold text-[#665a4a]">Illustrative personas, not fake reviews.</p>
                    </div>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                {userStories.map(({ role, name, avatar, avatarSrc, avatarTone, quote, outcome }) => (
                    <article key={role} className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/88 p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border text-sm font-semibold shadow-sm ${avatarTone}`}
                                >
                                    {avatarSrc ? (
                                        <img src={avatarSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
                                    ) : (
                                        avatar
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a97935]">Example story</p>
                                    <p className="text-sm font-semibold text-[#211b16]">{name}</p>
                                </div>
                            </div>
                            <CheckCircle2 size={20} className="shrink-0 text-[#15803d]" aria-hidden="true" />
                        </div>
                        <p className="mt-5 text-lg font-semibold leading-8 text-[#211b16]">“{quote}”</p>
                        <div className="mt-6 rounded-lg border border-[#eadbc5] bg-[#f9efe0]/80 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a97935]">{role}</p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-[#665a4a]">{outcome}</p>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    </PaperSection>
);

export const WorkflowSection = () => (
    <PaperSection className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 grid gap-4 border-b border-[#e2d4c2] pb-10 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                    <p className="cv-warm-eyebrow">Application routine</p>
                    <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[#211b16] sm:text-5xl">
                        From hidden job link to prepared application.
                    </h2>
                </div>
                <button
                    onClick={() => navigate('/job-tracker')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d8c6ad] bg-[#fffaf1] px-5 py-3 text-sm font-semibold text-[#211b16] shadow-sm"
                >
                    Open job tracker <ArrowRight size={16} />
                </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {workflowSteps.map(({ number, title, copy }) => (
                    <article key={title} className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/88 p-6 shadow-sm">
                        <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#211b16] font-mono text-sm font-semibold text-white">
                            {number}
                        </div>
                        <h3 className="text-xl font-semibold text-[#211b16]">{title}</h3>
                        <p className="mt-3 text-sm font-medium leading-6 text-[#665a4a]">{copy}</p>
                    </article>
                ))}
            </div>
        </div>
    </PaperSection>
);

export const TeamsAndTrustSection = () => (
    <PaperSection className="py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:px-8">
            <div>
                <p className="cv-warm-eyebrow">Trust comes from clarity</p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[#211b16] sm:text-5xl">
                    One workspace. Clear context for every application.
                </h2>
                <p className="mt-5 text-lg font-medium leading-8 text-[#665a4a]">
                    CareerVivid should feel like a reliable workbench, not a loud promise machine.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button onClick={() => navigate('/signup')} className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#211b16] px-6 py-4 font-semibold text-white shadow-lg shadow-[#6b4b1f]/15">
                        Start for free <ArrowRight size={18} />
                    </button>
                    <button onClick={() => navigate('/contact')} className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#d8c6ad] bg-[#fffaf1] px-6 py-4 font-semibold text-[#211b16]">
                        Talk to us
                    </button>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
                {trustNotes.map(({ icon: Icon, title, copy }) => (
                    <article key={title} className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/88 p-6 shadow-sm">
                        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f2dfc2] text-[#8b5a16]">
                            <Icon size={21} />
                        </div>
                        <h3 className="text-lg font-semibold text-[#211b16]">{title}</h3>
                        <p className="mt-3 text-sm font-medium leading-6 text-[#665a4a]">{copy}</p>
                    </article>
                ))}
            </div>
        </div>
        <div className="relative mx-auto mt-10 grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            {[
                [Building2, 'Career center dashboard', 'Invite students, allocate credits, and monitor progress when CareerVivid is used by a cohort.'],
                [ClipboardCheck, 'Application context', 'Store role, company, location, links, dates, notes, and preparation in one place.'],
                [Sparkles, 'Gemini-powered assistance', 'Generate focused prep and resume suggestions from the user saved context.'],
            ].map(([Icon, title, copy]) => {
                const LucideIcon = Icon as typeof Building2;
                return (
                    <article key={title as string} className="grid gap-4 rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/88 p-5 sm:grid-cols-[44px_1fr]">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f2dfc2] text-[#8b5a16]">
                            <LucideIcon size={21} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-[#211b16]">{title as string}</h3>
                            <p className="mt-2 text-sm font-medium leading-6 text-[#665a4a]">{copy as string}</p>
                        </div>
                    </article>
                );
            })}
        </div>
    </PaperSection>
);

export const FAQSection = () => (
    <PaperSection className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <p className="cv-warm-eyebrow">FAQ</p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[#211b16] sm:text-5xl">Questions before you start</h2>
            </div>
            <div className="mt-10 space-y-4">
                {faqs.map(({ question, answer }) => (
                    <details key={question} className="group rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/88 p-6">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-[#211b16] [&::-webkit-details-marker]:hidden">
                            {question}
                            <ArrowRight size={18} className="shrink-0 transition group-open:rotate-90" />
                        </summary>
                        <p className="mt-4 text-base font-medium leading-7 text-[#665a4a]">{answer}</p>
                    </details>
                ))}
            </div>
        </div>
    </PaperSection>
);

export const FinalCTA = () => (
    <section className="cv-final-cta bg-[#211b16] py-16 text-[#fffaf1] sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-[#d3a15e]">Ready when your next application is</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">Create one workspace for the whole search.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-[#e7d4b9]">
                Build the resume, save the role, prepare the interview, and keep the next action visible.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button onClick={() => navigate('/signup')} className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#fffaf1] px-6 py-4 font-semibold text-[#211b16]">
                    Sign up free <ArrowRight size={18} />
                </button>
                <button onClick={() => navigate('/contact')} className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#fffaf1]/20 px-6 py-4 font-semibold text-[#fffaf1]">
                    Contact support
                </button>
            </div>
        </div>
    </section>
);
