"use client";

import { useEffect, useState } from 'react';
import {
    ArrowRight,
    Briefcase,
    CheckCircle2,
    AppWindow,
    FileText,
    LayoutDashboard,
    MessageSquareText,
    Mic,
    Wand2,
} from 'lucide-react';

const trustSignals = [
    'Direct company links saved',
    'Resume and interview prep together',
    'Chrome extension workflow',
];

const heroStoryAvatars = [
    { label: 'Career switcher', src: '/avatars/careervivid-rabbit-bow.jpg', fallback: 'M', tone: 'bg-[#eef4ff] text-[#2563eb]' },
    { label: 'New grad', src: '/avatars/careervivid-rabbit-glasses.jpg', fallback: 'A', tone: 'bg-[#f7fff8] text-[#15803d]' },
    { label: 'Busy applicant', src: '', fallback: 'J', tone: 'bg-[#fff7e8] text-[#a16207]' },
];

const ROTATION_MS = 7000;

const previewTabs = [
    { label: 'Resume builder', icon: FileText },
    { label: 'Interview studio', icon: Mic },
    { label: 'Career pipeline', icon: Briefcase },
];

const ProgressBar = ({ value, tone = 'bg-[#2563eb]' }: { value: number; tone?: string }) => (
    <div className="h-2 overflow-hidden rounded-full bg-[#ece2d2]">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
    </div>
);

const MiniMetric = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
    <div className="rounded-xl border border-[#eadbc5] bg-white/85 p-2.5 shadow-sm">
        <div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}>
            <LayoutDashboard size={15} />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7d6e5e]">{label}</p>
        <p className="mt-0.5 text-lg font-black text-[#211b16]">{value}</p>
    </div>
);

const ResumeEditorPreview = () => (
    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(220px,250px)]">
        <div className="min-w-0 p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a97935]">My Resumes</p>
                    <h3 className="text-lg font-black text-[#211b16]">Resume builder workspace</h3>
                </div>
                <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2563eb] px-3 text-sm font-bold text-white shadow-lg shadow-blue-600/15">
                    <FileText size={16} />
                    New Resume
                </button>
            </div>

            <div className="rounded-xl border border-[#eadbc5] bg-white/90 p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-[#211b16]">Tailored for Associate React Developer</p>
                    <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-xs font-bold text-[#2563eb]">Preview</span>
                </div>
                <div className="rounded-lg border border-[#eadbc5] bg-[#fffaf1] p-3">
                    <div className="border-b border-[#eadbc5] pb-2">
                        <h4 className="text-base font-black text-[#211b16]">Jiawen Zhu</h4>
                        <p className="text-sm font-bold text-[#665a4a]">Front End Developer</p>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-2">
                            {[
                                ['Profile', 'Responsive, accessible web interfaces with React and JavaScript.'],
                                ['Experience', 'Project work, stakeholder collaboration, and measurable UI improvements.'],
                                ['Education', 'Computer Science foundation with product development.'],
                            ].map(([label, copy]) => (
                                <div key={label}>
                                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#a97935]">{label}</p>
                                    <p className="mt-1 text-xs font-semibold leading-5 text-[#665a4a]">{copy}</p>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#a97935]">Contact</p>
                                <p className="mt-1 text-xs font-semibold text-[#665a4a]">Email · LinkedIn · Portfolio</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#a97935]">Skills</p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {['HTML', 'CSS', 'JavaScript', 'React'].map((skill) => (
                                        <span key={skill} className="rounded-full bg-[#f7fff8] px-2 py-1 text-[11px] font-bold text-[#137245]">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {['Profile', 'Experience', 'Contact', 'Skills', 'Education', 'Export'].map((section) => (
                        <span key={section} className="rounded-full border border-[#eadbc5] bg-[#f9efe0]/70 px-2.5 py-1 text-[11px] font-black text-[#665a4a]">
                            {section}
                        </span>
                    ))}
                </div>
            </div>
        </div>

        <aside className="border-t border-[#eadbc5] bg-[#f9efe0]/80 p-3 lg:border-l lg:border-t-0">
            <div className="rounded-xl border border-[#eadbc5] bg-white/90 p-3 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#a97935]">Create section</p>
                <h4 className="mt-1 text-base font-black text-[#211b16]">Paste resume content</h4>
                <p className="mt-3 text-sm font-medium leading-relaxed text-[#665a4a]">
                    Paste an existing resume, then turn it into structured sections you can edit, tailor, and reuse.
                </p>
                <div className="mt-3 rounded-lg border border-dashed border-[#d8c6ad] bg-[#fffaf1] p-3 text-xs font-semibold leading-5 text-[#8a7865]">
                    Paste your resume content here...
                </div>
                <button className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] text-sm font-black text-white">
                    <Wand2 size={15} />
                    Tailor for a job
                </button>
            </div>
        </aside>
    </div>
);

const MockInterviewPreview = () => (
    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(220px,250px)]">
        <div className="min-w-0 p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a97935]">Interview workspace</p>
                    <h3 className="text-lg font-black text-[#211b16]">Technical Interview Simulator</h3>
                </div>
                <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2563eb] px-3 text-sm font-bold text-white shadow-lg shadow-blue-600/15">
                    <Mic size={16} />
                    Start Interview Mode
                </button>
            </div>

            <div className="rounded-xl border border-[#eadbc5] bg-white/90 p-3 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-[#fff6f6] p-2.5 text-[#b64a5a]">
                        <MessageSquareText size={21} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#a97935]">Prompt</p>
                        <p className="mt-2 text-base font-black leading-6 text-[#211b16]">Prepare for your next interview with an AI-powered mock session.</p>
                    </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {[
                        ['Mode', 'Behavioral', 'bg-[#eef4ff] text-[#2563eb]'],
                        ['Difficulty', 'Standard', 'bg-[#fff7e8] text-[#9a651f]'],
                        ['Duration', '15 min', 'bg-[#f7fff8] text-[#137245]'],
                    ].map(([label, value, tone]) => (
                        <div key={label} className="rounded-lg border border-[#eadbc5] bg-[#f9efe0]/60 p-3">
                            <span className={`rounded-full px-2 py-1 text-[11px] font-black ${tone}`}>{label}</span>
                            <p className="mt-3 text-sm font-black text-[#211b16]">{value}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-4 rounded-lg border border-[#eadbc5] bg-[#f9efe0]/70 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-[#a97935]">Career paths</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {['Technology', 'Finance & Business', 'Creative & Marketing'].map((path) => (
                            <span key={path} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#665a4a]">
                                {path}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <aside className="border-t border-[#eadbc5] bg-[#f9efe0]/80 p-3 lg:border-l lg:border-t-0">
            <div className="rounded-xl border border-[#eadbc5] bg-white/90 p-3 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#a97935]">Recent sessions</p>
                <h4 className="mt-1 text-base font-black text-[#211b16]">17 saved</h4>
                <div className="mt-3 space-y-2">
                    {[
                        ['Real-time Fraud Detection', 'Practice Again'],
                        ['Production Incident', 'Report'],
                        ['Zero Downtime Refactor', 'Practice Again'],
                    ].map(([title, action]) => (
                        <div key={title} className="rounded-lg border border-[#eadbc5] bg-[#fffaf1] p-3">
                            <p className="text-sm font-black leading-tight text-[#211b16]">{title}</p>
                            <p className="mt-1 text-xs font-bold text-[#2563eb]">{action}</p>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    </div>
);

const JobPipelinePreview = () => (
    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(220px,250px)]">
        <div className="min-w-0 p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a97935]">Career pipeline</p>
                    <h3 className="text-lg font-black text-[#211b16]">Today's job-search plan</h3>
                </div>
                <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2563eb] px-3 text-sm font-bold text-white shadow-lg shadow-blue-600/15">
                    <Briefcase size={16} />
                    Track New Job
                </button>
            </div>

            <div className="mb-3 grid grid-cols-3 gap-2">
                <MiniMetric label="Total" value="36" tone="bg-[#f7f1e7] text-[#665a4a]" />
                <MiniMetric label="Active" value="29" tone="bg-[#eef4ff] text-[#2563eb]" />
                <MiniMetric label="Interviews" value="3" tone="bg-[#fff7e8] text-[#9a651f]" />
            </div>

            <div className="mb-3 rounded-xl border border-[#eadbc5] bg-white/90 p-3 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#a97935]">Pipeline controls</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <span className="rounded-lg border border-[#eadbc5] bg-[#fffaf1] px-3 py-2 text-xs font-bold text-[#8a7865]">Search jobs</span>
                    <span className="rounded-lg border border-[#eadbc5] bg-[#fffaf1] px-3 py-2 text-xs font-bold text-[#665a4a]">Kanban</span>
                    <span className="rounded-lg border border-[#eadbc5] bg-[#fffaf1] px-3 py-2 text-xs font-bold text-[#665a4a]">Strategy</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {[
                    { title: 'To Apply', count: 3, color: 'bg-[#7d6e5e]', cards: [['Senior UX Engineer', 'Google', '61% match']] },
                    { title: 'Applied', count: 33, color: 'bg-[#2563eb]', cards: [['AI Systems Engineer', 'OpenAI', '86% match']] },
                    { title: 'Interviewing', count: 0, color: 'bg-[#a97935]', cards: [['When interviews start', 'Drop jobs here', '']] },
                ].map((column) => (
                    <div key={column.title} className="min-h-[132px] min-w-0 overflow-hidden rounded-xl border border-[#eadbc5] bg-[#f9efe0]/70 p-2.5">
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-black leading-tight text-[#211b16]">
                                <span className={`h-2 w-2 shrink-0 rounded-full ${column.color}`} />
                                <span className="break-words">{column.title}</span>
                            </span>
                            <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#665a4a] shadow-sm">{column.count}</span>
                        </div>
                        <div className="space-y-2">
                            {column.cards.map(([role, company, meta]) => (
                                <div key={`${company}-${role}`} className="min-w-0 rounded-lg border border-[#eadbc5] bg-white/90 p-2.5 shadow-sm">
                                    <p className="break-words text-[13px] font-black leading-tight text-[#211b16]">{role}</p>
                                    <p className="mt-1 break-words text-xs font-semibold text-[#665a4a]">{company}</p>
                                    {meta && <p className="mt-2 text-xs font-bold text-[#2563eb]">{meta}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <aside className="border-t border-[#eadbc5] bg-[#f9efe0]/80 p-3 lg:border-l lg:border-t-0">
            <div className="rounded-xl border border-[#eadbc5] bg-white/90 p-3 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#a97935]">Plan summary</p>
                <h4 className="mt-1 text-base font-black text-[#211b16]">Due work and next actions</h4>
                <p className="mt-3 text-sm font-medium leading-relaxed text-[#665a4a]">
                    Focus on due work, planned next actions, high-fit roles, and jobs missing a clear next step.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                    {['0 due', '2 next', '4 high fit', '1 prep'].map((item) => (
                        <span key={item} className="rounded-lg border border-[#eadbc5] bg-[#fffaf1] px-2 py-2 text-center text-xs font-black text-[#665a4a]">
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </aside>
    </div>
);

const ProductPreview = () => {
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setActiveSlide((current) => (current + 1) % previewTabs.length);
        }, ROTATION_MS);
        return () => window.clearInterval(timer);
    }, []);

    const renderSlide = () => {
        if (activeSlide === 0) return <ResumeEditorPreview />;
        if (activeSlide === 1) return <MockInterviewPreview />;
        return <JobPipelinePreview />;
    };

    return (
        <div className="relative">
            <div className="absolute -inset-4 rounded-[28px] bg-[#d7b27a]/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-xl border border-[#e4d3bc] bg-[#fffaf1] shadow-2xl shadow-[#8b5a16]/10">
                <div className="flex items-center justify-between border-b border-[#eadbc5] bg-[#f9efe0] px-4 py-2">
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-rose-400" />
                        <span className="h-3 w-3 rounded-full bg-amber-400" />
                        <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="hidden items-center gap-2 rounded-full border border-[#e4d3bc] bg-[#fffaf1] px-3 py-1 text-xs font-black text-[#665a4a] sm:flex">
                        <AppWindow size={14} />
                        CareerVivid workspace
                    </div>
                </div>

                <div className="border-b border-[#eadbc5] bg-[#fffaf1] px-3 py-2">
                    <div className="grid gap-2 sm:grid-cols-3" role="tablist" aria-label="CareerVivid workspace preview">
                        {previewTabs.map(({ label, icon: Icon }, index) => {
                            const isActive = activeSlide === index;
                            return (
                                <button
                                    key={label}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => setActiveSlide(index)}
                                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition ${
                                        isActive
                                            ? 'border-[#2563eb] bg-[#eef4ff] text-[#2563eb]'
                                            : 'border-[#eadbc5] bg-white/70 text-[#665a4a] hover:border-[#d8c6ad]'
                                    }`}
                                >
                                    <Icon size={15} />
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2" aria-hidden="true">
                        {previewTabs.map(({ label }, index) => (
                            <div key={label} className="h-1.5 overflow-hidden rounded-full bg-[#eadbc5]">
                                <div className={`h-full rounded-full transition-all duration-500 ${activeSlide === index ? 'w-full bg-[#2563eb]' : 'w-0 bg-[#2563eb]'}`} />
                            </div>
                        ))}
                    </div>
                </div>

                <div key={activeSlide} className="animate-in fade-in duration-500">
                    {renderSlide()}
                </div>
            </div>
        </div>
    );
};

const CompactProductPreview = () => (
    <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/90 p-4 shadow-lg shadow-[#8b5a16]/10">
        <div className="mb-4 flex items-center justify-between gap-3">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#a97935]">Saved role</p>
                <h3 className="mt-1 text-lg font-black leading-tight text-[#211b16]">Frontend Web Engineer</h3>
                <p className="mt-1 text-sm font-semibold text-[#665a4a]">NVIDIA · Direct apply link saved</p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff] text-[#2563eb]">
                <Briefcase size={22} />
            </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
            {[
                ['Match', '75%'],
                ['Status', 'To apply'],
                ['Prep', 'Ready'],
            ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#eadbc5] bg-white/80 p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#a97935]">{label}</p>
                    <p className="mt-1 text-sm font-black text-[#211b16]">{value}</p>
                </div>
            ))}
        </div>
    </div>
);

export function CommunityShowcaseHero() {
    return (
        <section className="relative overflow-hidden border-b border-[#e6dac8] bg-[#f7f1e7] pt-16 pb-6 text-[#211b16] sm:pt-24 sm:pb-8 xl:pt-20 xl:pb-6 2xl:pt-28 2xl:pb-10">
            <div
                className="pointer-events-none absolute inset-0 opacity-55"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, rgba(139, 90, 22, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(139, 90, 22, 0.06) 1px, transparent 1px)',
                    backgroundSize: '64px 64px',
                }}
            />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid items-center gap-12 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <div>
                        <div className="mb-4 flex max-w-xl items-center gap-3 rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/88 px-3 py-2.5 shadow-sm sm:mb-5 sm:px-4 sm:py-3">
                            <div className="flex -space-x-3" aria-hidden="true">
                                {heroStoryAvatars.map(({ label, src, fallback, tone }) => (
                                    <span
                                        key={label}
                                        className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-[#fffaf1] text-sm font-black shadow-sm sm:h-10 sm:w-10 ${tone}`}
                                    >
                                        {src ? (
                                            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                                        ) : (
                                            fallback
                                        )}
                                    </span>
                                ))}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#a97935]">Example user story</p>
                                <p className="mt-1 text-xs font-bold leading-5 text-[#211b16] sm:text-sm">
                                    “I saved the apply link, tailored my resume, and kept prep in one place.”
                                </p>
                            </div>
                        </div>

                        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a97935]">
                            AI job-search workspace
                        </p>

                        <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[0.96] tracking-tight text-[#211b16] sm:text-5xl xl:text-6xl 2xl:text-7xl">
                            Save job links. Tailor stronger resumes faster. Apply with confidence.
                        </h1>

                        <div className="mt-5 max-w-2xl rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/78 p-4 shadow-sm shadow-[#8b5a16]/5 sm:mt-7 sm:p-5">
                            <p className="text-base font-medium leading-7 text-[#665a4a] sm:text-[17px] sm:leading-8">
                                CareerVivid helps job seekers save company job links, compare resume fit,
                                tailor the application, and keep interview prep attached to each role. Fewer
                                scattered tabs, fewer lost links, and a clearer next step.
                            </p>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                            <a
                                href="/signup"
                                className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl bg-[#211b16] px-6 py-4 text-base font-black text-white shadow-xl shadow-[#8b5a16]/10 transition hover:-translate-y-0.5 hover:bg-[#3a2b20]"
                            >
                                Start free <ArrowRight size={19} />
                            </a>
                            <a
                                href="/job-tracker"
                                className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl border border-[#d8c6ad] bg-[#fffaf1] px-6 py-4 text-base font-black text-[#211b16] shadow-sm transition hover:-translate-y-0.5 hover:border-[#bfa782]"
                            >
                                View job tracker
                            </a>
                        </div>

                        <div className="mt-8 hidden gap-3 xl:grid xl:grid-cols-3">
                            {trustSignals.map((signal) => (
                                <div key={signal} className="flex items-start gap-2 rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/78 p-3 text-sm font-bold text-[#665a4a] shadow-sm">
                                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#137245]" />
                                    <span>{signal}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 hidden sm:block md:hidden">
                            <CompactProductPreview />
                        </div>
                    </div>

                    <div className="hidden xl:block">
                        <ProductPreview />
                    </div>
                </div>
            </div>
        </section>
    );
}
