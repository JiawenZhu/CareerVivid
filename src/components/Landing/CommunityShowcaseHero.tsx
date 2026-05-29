import React from 'react';
import {
    ArrowRight,
    Briefcase,
    CheckCircle2,
    Chrome,
    ClipboardCheck,
    FileText,
    LayoutDashboard,
    Mic,
    Search,
    Sparkles,
    Wand2,
} from 'lucide-react';
import { navigate } from '../../utils/navigation';

const productTabs = [
    { label: 'Job Tracker', icon: Briefcase, tone: 'text-[#2563eb] bg-white/80 border-[#dbe4f3]' },
    { label: 'AI Resume Builder', icon: FileText, tone: 'text-[#137245] bg-[#f7fff8] border-[#cfe8d7]' },
    { label: 'Resume Tailor', icon: Wand2, tone: 'text-[#9a651f] bg-[#fffaf1] border-[#e4d3bc]' },
    { label: 'Autofill Applications', icon: Chrome, tone: 'text-[#475569] bg-[#f8fafc] border-[#dbe4f3]' },
    { label: 'Interview Coach', icon: Mic, tone: 'text-[#b64a5a] bg-[#fff6f6] border-[#ead1d5]' },
];

const trustSignals = [
    'Free workspace to start',
    'Resume, tracker, and interview tools together',
    'Privacy-first job search data',
];

const workflowCards = [
    {
        icon: Search,
        title: 'Capture the role',
        copy: 'Save the posting, company, location, and next action before it disappears into browser tabs.',
        tone: 'bg-[#eef4ff] text-[#2563eb]',
    },
    {
        icon: Sparkles,
        title: 'Tailor the application',
        copy: 'Compare a resume against the job, find missing keywords, and generate focused prep notes.',
        tone: 'bg-[#fff7e8] text-[#9a651f]',
    },
    {
        icon: ClipboardCheck,
        title: 'Track the follow-through',
        copy: 'Move roles through your pipeline and keep interview preparation attached to each opportunity.',
        tone: 'bg-[#f7fff8] text-[#137245]',
    },
];

const ProductPreview = () => (
    <div className="relative">
        <div className="absolute -inset-4 rounded-[28px] bg-[#d7b27a]/20 blur-2xl" />
        <div className="relative overflow-hidden rounded-xl border border-[#e4d3bc] bg-[#fffaf1] shadow-2xl shadow-[#8b5a16]/10">
            <div className="flex items-center justify-between border-b border-[#eadbc5] bg-[#f9efe0] px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-[#e4d3bc] bg-[#fffaf1] px-3 py-1 text-xs font-black text-[#665a4a] sm:flex">
                    <Chrome size={14} />
                    CareerVivid workspace
                </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(220px,250px)]">
                <div className="min-w-0 p-4 sm:p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a97935]">Career Pipeline</p>
                            <h3 className="text-xl font-black text-[#211b16]">36 active opportunities</h3>
                        </div>
                        <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563eb] px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/15">
                            <Briefcase size={16} />
                            Track New Job
                        </button>
                    </div>

                    <div className="mb-5 grid grid-cols-3 gap-3">
                        {[
                            ['Total', '36', 'bg-[#f7f1e7] text-[#665a4a]'],
                            ['Active', '36', 'bg-[#eef4ff] text-[#2563eb]'],
                            ['Interviewing', '3', 'bg-[#fff7e8] text-[#9a651f]'],
                        ].map(([label, value, tone]) => (
                            <div key={label} className="rounded-xl border border-[#eadbc5] bg-white/80 p-4 shadow-sm">
                                <div className={`mb-4 h-8 w-8 rounded-lg ${tone} flex items-center justify-center`}>
                                    <LayoutDashboard size={15} />
                                </div>
                                <p className="text-xs font-bold text-[#665a4a]">{label}</p>
                                <p className="text-2xl font-black text-[#211b16]">{value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 2xl:grid-cols-3">
                        {[
                            { title: 'To Apply', count: 3, color: 'bg-[#7d6e5e]', cards: [['Google', 'Senior UX Engineer', '61% match'], ['Global Tech', 'Technical Consultant', 'Prep 0/5']] },
                            { title: 'Applied', count: 33, color: 'bg-[#2563eb]', cards: [['OpenAI', 'AI Systems Engineer', '86% match'], ['Databricks', 'Fullstack Engineer', 'Prep 1/5']] },
                            { title: 'Interview', count: 0, color: 'bg-[#a97935]', cards: [['Drop jobs here', 'When interviews start', '']] },
                        ].map((column) => (
                            <div key={column.title} className="min-h-[218px] min-w-0 overflow-hidden rounded-xl border border-[#eadbc5] bg-[#f9efe0]/70 p-3">
                                <div className="mb-3 flex items-start justify-between gap-2">
                                    <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-black leading-tight text-[#211b16]">
                                        <span className={`h-2 w-2 shrink-0 rounded-full ${column.color}`} />
                                        <span className="break-words">{column.title}</span>
                                    </span>
                                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#665a4a] shadow-sm">{column.count}</span>
                                </div>
                                <div className="space-y-3">
                                    {column.cards.map(([company, role, meta]) => (
                                        <div key={`${company}-${role}`} className="min-w-0 rounded-lg border border-[#eadbc5] bg-white/90 p-3 shadow-sm">
                                            <p className="break-words text-[13px] font-black leading-tight text-[#211b16]">{role}</p>
                                            <p className="mt-1 break-words text-xs font-semibold text-[#665a4a]">{company}</p>
                                            {meta && <p className="mt-3 text-xs font-bold text-[#2563eb]">{meta}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <aside className="border-t border-[#eadbc5] bg-[#f9efe0]/80 p-4 lg:border-l lg:border-t-0">
                    <div className="rounded-xl border border-[#eadbc5] bg-white/90 p-4 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#a97935]">Resume Match</p>
                        <h4 className="mt-1 text-lg font-black text-[#211b16]">75% ready</h4>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ece2d2]">
                            <div className="h-full w-3/4 rounded-full bg-[#2563eb]" />
                        </div>
                        <p className="mt-4 text-sm font-medium leading-relaxed text-[#665a4a]">
                            Strong match on TypeScript, design systems, and full-stack work. Add clearer UX engineering and prototyping proof.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {['HTML', 'CSS', 'TypeScript', 'AI tools'].map((keyword) => (
                                <span key={keyword} className="rounded-full bg-[#f7fff8] px-2.5 py-1 text-xs font-bold text-[#137245]">
                                    {keyword}
                                </span>
                            ))}
                        </div>
                        <button className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] text-sm font-black text-white">
                            Optimize Resume <ArrowRight size={15} />
                        </button>
                    </div>

                    <div className="mt-4 rounded-xl border border-[#eadbc5] bg-white/90 p-4">
                        <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-[#fff6f6] p-2 text-[#b64a5a]">
                                <Mic size={18} />
                            </div>
                            <div>
                                <p className="font-black text-[#211b16]">Interview prep attached</p>
                                <p className="mt-1 text-sm font-medium leading-relaxed text-[#665a4a]">Role research, pitch, Q&A, and follow-up notes stay with each job.</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    </div>
);

const CommunityShowcaseHero: React.FC = () => {
    return (
        <section className="relative overflow-hidden border-b border-[#e6dac8] bg-[#f7f1e7] pt-28 pb-16 text-[#211b16] sm:pt-32 sm:pb-24">
            <div
                className="pointer-events-none absolute inset-0 opacity-55"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, rgba(139, 90, 22, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(139, 90, 22, 0.06) 1px, transparent 1px)',
                    backgroundSize: '64px 64px',
                }}
            />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a97935]">
                            AI job-search workspace
                        </p>

                        <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.96] tracking-tight text-[#211b16] sm:text-6xl lg:text-7xl">
                            One workspace for every job application.
                        </h1>

                        <div className="mt-7 max-w-2xl rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/78 p-5 shadow-sm shadow-[#8b5a16]/5">
                            <p className="text-[17px] font-medium leading-8 text-[#665a4a]">
                                CareerVivid is an AI job-search workspace for people who want fewer scattered tabs
                                and a clearer application routine. It connects resumes, job tracking, interview prep,
                                portfolios, and Chrome extension autofill so each role has context and a next step.
                            </p>
                        </div>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={() => navigate('/signup')}
                                className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl bg-[#211b16] px-6 py-4 text-base font-black text-white shadow-xl shadow-[#8b5a16]/10 transition hover:-translate-y-0.5 hover:bg-[#3a2b20]"
                            >
                                Start free <ArrowRight size={19} />
                            </button>
                            <button
                                onClick={() => navigate('/job-tracker')}
                                className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl border border-[#d8c6ad] bg-[#fffaf1] px-6 py-4 text-base font-black text-[#211b16] shadow-sm transition hover:-translate-y-0.5 hover:border-[#bfa782]"
                            >
                                See job tracker
                            </button>
                        </div>

                        <div className="mt-8 grid gap-3 sm:grid-cols-3">
                            {trustSignals.map((signal) => (
                                <div key={signal} className="flex items-start gap-2 rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/78 p-3 text-sm font-bold text-[#665a4a] shadow-sm">
                                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#137245]" />
                                    <span>{signal}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <ProductPreview />
                </div>

                <div className="mt-10 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {productTabs.map(({ label, icon: Icon, tone }) => (
                        <button
                            key={label}
                            onClick={() => {
                                if (label === 'Job Tracker') navigate('/job-tracker');
                                if (label === 'AI Resume Builder') navigate('/newresume');
                                if (label === 'Resume Tailor') navigate('/newresume');
                                if (label === 'Autofill Applications') navigate('/extension-welcome');
                                if (label === 'Interview Coach') navigate('/interview-studio');
                            }}
                            className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 ${tone}`}
                        >
                            <Icon size={16} />
                            {label}
                        </button>
                    ))}
                </div>

                <div className="mt-12 grid gap-4 md:grid-cols-3">
                    {workflowCards.map(({ icon: Icon, title, copy, tone }) => (
                        <div key={title} className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/78 p-6 shadow-sm">
                            <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
                                <Icon size={21} />
                            </div>
                            <h2 className="text-xl font-black text-[#211b16]">{title}</h2>
                            <p className="mt-3 text-sm font-medium leading-6 text-[#665a4a]">{copy}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CommunityShowcaseHero;
