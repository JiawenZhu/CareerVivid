import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
    ArrowRight,
    Briefcase,
    Building2,
    CheckCircle2,
    Chrome,
    ClipboardCheck,
    FileText,
    LayoutDashboard,
    Lock,
    Mic,
    Search,
    ShieldCheck,
    Sparkles,
    Users,
    Wand2,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import CommunityShowcaseHero from '../components/Landing/CommunityShowcaseHero';
import { navigate } from '../utils/navigation';

const SEO_TITLE = 'CareerVivid | AI Job Search Workspace & Chrome Extension';
const SEO_DESCRIPTION = 'CareerVivid is an AI job-search workspace for resumes, job tracking, interview prep, portfolios, and Chrome extension autofill.';
const SEO_KEYWORDS = 'AI job search workspace, Chrome extension job autofill, AI resume builder, job tracker, resume match, interview coach, application tracker, ATS resume optimization';
const SEO_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Fog_image.png?alt=media';

const featureTabs = [
    { label: 'Job Tracker', icon: Briefcase, href: '/job-tracker' },
    { label: 'AI Resume Builder', icon: FileText, href: '/newresume' },
    { label: 'Resume Tailor', icon: Wand2, href: '/newresume' },
    { label: 'Autofill Applications', icon: Chrome, href: '/extension-welcome' },
    { label: 'Resume Match', icon: Search, href: '/newresume' },
    { label: 'Interview Coach', icon: Mic, href: '/interview-studio' },
    { label: 'Career Pipeline', icon: LayoutDashboard, href: '/job-tracker' },
];

const experienceEntries = [
    {
        number: '1.',
        label: 'Pipeline workspace',
        title: 'Job Tracker & Application Context',
        organization: 'CareerVivid product workspace',
        date: 'Available now',
        href: '/job-tracker',
        bullets: [
            'Captures each role with company, location, links, status, priority, due dates, and the next action that keeps the search moving.',
            'Keeps resume match, interview prep, notes, and follow-up history attached to the same opportunity instead of spreading context across tabs.',
            'Gives active job seekers a calm board for repeated work: save the role, prepare the application, follow up, and review what changed.',
        ],
    },
    {
        number: '2.',
        label: 'Resume system',
        title: 'AI Resume Builder & Tailoring Flow',
        organization: 'ATS-ready resume workspace',
        date: 'Available now',
        href: '/newresume',
        bullets: [
            'Turns a resume into structured sections that are easier to edit, score, export, and reuse across different job targets.',
            'Compares a resume against a job description so users can see matched keywords, missing proof, and the most important improvements.',
            'Keeps the tone practical and reviewable, helping users improve materials without losing control of their own story.',
        ],
    },
    {
        number: '3.',
        label: 'Browser workflow',
        title: 'Chrome Extension for Job Pages',
        organization: 'CareerVivid browser assistant',
        date: 'Pending Chrome review',
        href: '/extension-welcome',
        bullets: [
            'Brings CareerVivid to the job posting page so users can save a role, analyze fit, and move work back into the tracker.',
            'Supports the application moment directly, where job details, requirements, and forms are already visible.',
            'Keeps the browser workflow connected to the main account instead of becoming another isolated job-search tool.',
        ],
    },
    {
        number: '4.',
        label: 'Interview practice',
        title: 'AI Interview Coach & Feedback Reports',
        organization: 'Practice and feedback workspace',
        date: 'Available now',
        href: '/interview-studio',
        bullets: [
            'Runs role-specific mock interviews and keeps preparation tied to the job the user is pursuing.',
            'Exports feedback reports that help users see communication, confidence, and answer relevance in a concrete way.',
            'Helps candidates build a repeatable preparation loop before high-pressure recruiter, technical, or behavioral interviews.',
        ],
    },
];

const expertiseBlocks = [
    {
        title: 'Workflow Design',
        items: ['Job pipeline', 'Application context', 'Follow-up tracking', 'Role notes'],
    },
    {
        title: 'AI Assistance',
        items: ['Gemini-powered prep', 'Resume match', 'Keyword review', 'Interview feedback'],
    },
    {
        title: 'Browser Tools',
        items: ['Chrome extension', 'Job clipping', 'Form assistance', 'Context menus'],
    },
    {
        title: 'Trust Practices',
        items: ['Clear product claims', 'Privacy policy', 'User-owned data', 'No fake review blocks'],
    },
];

const trustNotes = [
    {
        icon: ShieldCheck,
        title: 'Plain claims',
        copy: 'CareerVivid explains what exists today and avoids inflated social proof. That matters more than decorative trust badges.',
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
        answer: 'No. The resume builder is one piece of the workspace. CareerVivid also includes a job tracker, resume matching, interview prep, application notes, and Chrome extension workflows.',
    },
    {
        question: 'Do I need my own AI API key?',
        answer: 'No for the hosted app. CareerVivid uses managed Gemini-powered features through the app. Developers who self-host can configure their own Firebase and Gemini setup.',
    },
    {
        question: 'Can I use it while applying on other job sites?',
        answer: 'Yes. The Chrome extension workflow is designed to help save roles and work with application pages from the browser while keeping the final workspace organized in CareerVivid.',
    },
];

const PaperSection = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <section className={`relative overflow-hidden border-t border-[#e6dac8] bg-[#f7f1e7] text-[#211b16] ${className}`}>
        <div
            className="pointer-events-none absolute inset-0 opacity-55"
            style={{
                backgroundImage:
                    'linear-gradient(to right, rgba(139, 90, 22, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(139, 90, 22, 0.06) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
            }}
        />
        <div className="relative">{children}</div>
    </section>
);

const ProductIndex = () => (
    <section className="border-y border-gray-200 bg-white/90 py-4 dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-4 pb-1 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featureTabs.map(({ label, icon: Icon, href }) => (
                <button
                    key={label}
                    onClick={() => navigate(href)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                >
                    <Icon size={16} className="text-blue-600 dark:text-blue-300" />
                    {label}
                </button>
            ))}
        </div>
    </section>
);

const ProfileSnapshot = () => (
    <aside className="rounded-lg border border-[#e4d3bc] bg-[#f9efe0]/75 p-6 shadow-sm shadow-[#8b5a16]/5 lg:sticky lg:top-28">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a97935]">Profile Snapshot</p>
        <p className="mt-5 text-[15px] font-medium leading-8 text-[#665a4a]">
            CareerVivid is a focused AI career workspace for job seekers who want fewer scattered tools and a clearer application routine. It combines a resume builder, job tracker, Chrome workflow, and interview coach so each role has context, preparation, and a next step.
        </p>
        <button
            onClick={() => navigate('/signup')}
            className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#9a651f] transition hover:text-[#211b16]"
        >
            Create your own workspace <ArrowRight size={15} />
        </button>
    </aside>
);

const ExperienceTimeline = () => (
    <div className="relative">
        <div className="absolute bottom-4 left-[18px] top-4 hidden w-px bg-[#d9c5aa] sm:block" />
        <div className="space-y-10">
            {experienceEntries.map((entry) => (
                <article key={entry.title} className="relative grid gap-4 sm:grid-cols-[72px_1fr]">
                    <div className="hidden pt-1 text-right font-mono text-sm text-[#7d6e5e] sm:block">{entry.number}</div>
                    <div>
                        <div className="absolute left-[14px] top-2 hidden h-2.5 w-2.5 rounded-full bg-[#a97935] ring-4 ring-[#f7f1e7] sm:block" />
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a97935]">{entry.label}</p>
                                <h3 className="mt-1 text-2xl font-black tracking-tight text-[#211b16]">{entry.title}</h3>
                                <p className="mt-1 text-base font-bold text-[#665a4a]">{entry.organization}</p>
                            </div>
                            <p className="font-mono text-sm font-bold text-[#a97935]">{entry.date}</p>
                        </div>
                        <ul className="space-y-3">
                            {entry.bullets.map((bullet) => (
                                <li key={bullet} className="grid grid-cols-[14px_1fr] gap-3 text-[15px] font-medium leading-7 text-[#665a4a]">
                                    <span className="text-[#a97935]">-</span>
                                    <span>{bullet}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => navigate(entry.href)}
                            className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#211b16] transition hover:text-[#9a651f]"
                        >
                            Open this workflow <ArrowRight size={15} />
                        </button>
                    </div>
                </article>
            ))}
        </div>
    </div>
);

const ExpertisePanel = () => (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
        <div className="grid gap-4 sm:grid-cols-2">
            {expertiseBlocks.map((block) => (
                <div key={block.title} className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1]/80 p-5">
                    <h3 className="font-mono text-sm font-black uppercase tracking-[0.14em] text-[#8b5a16]">{block.title}</h3>
                    <ul className="mt-4 space-y-2">
                        {block.items.map((item) => (
                            <li key={item} className="text-[15px] font-semibold text-[#665a4a]">{item}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
        <div className="rounded-lg border border-[#e4d3bc] bg-[#211b16] p-6 text-[#f7f1e7] shadow-xl shadow-[#6b4b1f]/10">
            <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#d3a15e]">Product routine</p>
            <pre className="mt-5 overflow-x-auto text-sm leading-7 text-[#f4dfbf]">
{`function prepareApplication(role) {
  const context = saveJob(role);
  const match = compareResume(context);
  const prep = generateInterviewPlan(match);
  return nextAction(prep);
}`}
            </pre>
        </div>
    </div>
);

const TrustNotes = () => (
    <div className="grid gap-4 md:grid-cols-3">
        {trustNotes.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1]/85 p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[#f2dfc2] text-[#8b5a16]">
                    <Icon size={21} />
                </div>
                <h3 className="text-lg font-black text-[#211b16]">{title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-[#665a4a]">{copy}</p>
            </div>
        ))}
    </div>
);

const LandingPage: React.FC = () => {
    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Organization',
                '@id': 'https://careervivid.app/#organization',
                name: 'CareerVivid',
                url: 'https://careervivid.app/',
                logo: 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_light_mode.png?alt=media&token=627ec9de-a950-41f7-9138-dd7a33518c55',
            },
            {
                '@type': 'WebSite',
                '@id': 'https://careervivid.app/#website',
                name: 'CareerVivid',
                url: 'https://careervivid.app/',
                description: SEO_DESCRIPTION,
                publisher: { '@id': 'https://careervivid.app/#organization' },
            },
            {
                '@type': 'WebApplication',
                '@id': 'https://careervivid.app/#job-workspace',
                name: 'CareerVivid',
                alternateName: 'CareerVivid Job Search Workspace',
                url: 'https://careervivid.app/',
                image: SEO_IMAGE,
                applicationCategory: 'BusinessApplication',
                applicationSubCategory: 'Job Search Workspace',
                operatingSystem: 'Web',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'CareerVivid Free' },
                featureList: [
                    'AI resume builder and tailoring',
                    'Job application tracker',
                    'Resume match scoring',
                    'Interview preparation and feedback',
                    'Portfolio and whiteboard workspace',
                    'Chrome extension job capture and autofill',
                    'Gemini-powered career workflows',
                ],
                description: SEO_DESCRIPTION,
                publisher: { '@id': 'https://careervivid.app/#organization' },
            },
            {
                '@type': 'BrowserApplication',
                '@id': 'https://careervivid.app/#chrome-extension',
                name: 'CareerVivid Chrome Extension',
                url: 'https://careervivid.app/extension-welcome',
                browserRequirements: 'Chrome',
                applicationCategory: 'BusinessApplication',
                applicationSubCategory: 'Job Application Autofill',
                operatingSystem: 'Chrome',
                featureList: [
                    'Save job postings from the browser',
                    'Autofill job applications',
                    'Analyze resume match on job pages',
                    'Send roles into the CareerVivid job tracker',
                ],
                description: 'The CareerVivid Chrome extension helps job seekers save roles, autofill applications, analyze job fit, and keep browser work connected to their CareerVivid workspace.',
                publisher: { '@id': 'https://careervivid.app/#organization' },
            },
            {
                '@type': 'FAQPage',
                '@id': 'https://careervivid.app/#faq',
                mainEntity: [
                    {
                        '@type': 'Question',
                        name: 'What is CareerVivid?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'CareerVivid is an AI job-search workspace that brings resumes, job tracking, interview prep, portfolios, and Chrome extension application workflows into one account.',
                        },
                    },
                    {
                        '@type': 'Question',
                        name: 'Does CareerVivid have a Chrome extension?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'Yes. CareerVivid includes a Chrome extension workflow for saving jobs, analyzing fit, autofilling application forms, and sending application context back to the main workspace.',
                        },
                    },
                    {
                        '@type': 'Question',
                        name: 'How does CareerVivid use Gemini?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'CareerVivid uses Gemini-powered workflows for resume tailoring, job-description matching, interview preparation, and career workspace automation.',
                        },
                    },
                ],
            },
        ],
    };

    return (
        <div className="min-h-screen bg-[#fbfbfe] text-gray-950 selection:bg-emerald-100 dark:bg-gray-950 dark:text-white">
            <Helmet titleTemplate="%s">
                <title>{SEO_TITLE}</title>
                <meta name="title" content={SEO_TITLE} />
                <meta name="description" content={SEO_DESCRIPTION} />
                <meta name="keywords" content={SEO_KEYWORDS} />
                <link rel="canonical" href="https://careervivid.app/" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://careervivid.app/" />
                <meta property="og:site_name" content="CareerVivid" />
                <meta property="og:title" content={SEO_TITLE} />
                <meta property="og:description" content={SEO_DESCRIPTION} />
                <meta property="og:image" content={SEO_IMAGE} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={SEO_TITLE} />
                <meta name="twitter:description" content={SEO_DESCRIPTION} />
                <meta name="twitter:image" content={SEO_IMAGE} />
                <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
            </Helmet>
            <PublicHeader variant="editorial" />
            <main>
                <CommunityShowcaseHero />
                <ProductIndex />

                <PaperSection className="py-16 sm:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-14 grid gap-4 border-b border-[#e2d4c2] pb-10 sm:grid-cols-[1fr_auto] sm:items-end">
                            <div>
                                <p className="font-mono text-sm font-black uppercase tracking-[0.18em] text-[#a97935]">Professional Experience</p>
                                <h2 className="mt-3 text-4xl font-black tracking-tight text-[#211b16] sm:text-5xl">
                                    A trustworthy job-search system, written like a product resume.
                                </h2>
                            </div>
                            <p className="font-mono text-sm font-bold text-[#7d6e5e]">Updated May 25, 2026</p>
                        </div>

                        <div className="grid gap-10 lg:grid-cols-[340px_1fr]">
                            <ProfileSnapshot />
                            <ExperienceTimeline />
                        </div>
                    </div>
                </PaperSection>

                <PaperSection className="py-16 sm:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-10">
                            <p className="font-mono text-sm font-black uppercase tracking-[0.18em] text-[#a97935]">Technical Implementations</p>
                            <h2 className="mt-3 text-4xl font-black tracking-tight text-[#211b16] sm:text-5xl">
                                Practical tools for the parts of job search that repeat every week.
                            </h2>
                            <p className="mt-5 max-w-3xl text-lg font-medium leading-8 text-[#665a4a]">
                                The lower page now reads like a clear product record: what each system does, why it exists, and where the user should go next.
                            </p>
                        </div>
                        <ExpertisePanel />
                    </div>
                </PaperSection>

                <PaperSection className="py-16 sm:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                            <div>
                                <p className="font-mono text-sm font-black uppercase tracking-[0.18em] text-[#a97935]">Trust Comes From Clarity</p>
                                <h2 className="mt-3 text-4xl font-black tracking-tight text-[#211b16] sm:text-5xl">
                                    One workspace. Clear context for every application.
                                </h2>
                                <p className="mt-5 text-lg font-medium leading-8 text-[#665a4a]">
                                    CareerVivid should feel like a reliable workbench, not a loud promise machine. The page keeps the strongest claims tied to visible product workflows.
                                </p>
                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <button onClick={() => navigate('/signup')} className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#211b16] px-6 py-4 font-black text-white shadow-lg shadow-[#6b4b1f]/15">
                                        Start free <ArrowRight size={18} />
                                    </button>
                                    <button onClick={() => navigate('/pricing')} className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#d8c6ad] bg-[#fffaf1] px-6 py-4 font-black text-[#211b16]">
                                        View pricing
                                    </button>
                                </div>
                            </div>
                            <TrustNotes />
                        </div>
                    </div>
                </PaperSection>

                <PaperSection className="py-16 sm:py-24">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
                        <div>
                            <p className="font-mono text-sm font-black uppercase tracking-[0.18em] text-[#a97935]">For Teams & Education</p>
                            <h2 className="mt-3 text-4xl font-black tracking-tight text-[#211b16] sm:text-5xl">
                                Start personal. Expand when the workflow needs a cohort.
                            </h2>
                        </div>
                        <div className="grid gap-4">
                            {[
                                [Building2, 'Career center dashboard', 'Invite students, allocate credits, and monitor progress when CareerVivid is used by a cohort.'],
                                [ClipboardCheck, 'Application context', 'Store role, company, location, links, dates, notes, and preparation in one place.'],
                                [Sparkles, 'Gemini-powered assistance', 'Generate focused prep and resume suggestions from the user saved context.'],
                            ].map(([Icon, title, copy]) => {
                                const LucideIcon = Icon as typeof Building2;
                                return (
                                    <div key={title as string} className="grid gap-4 rounded-lg border border-[#e4d3bc] bg-[#fffaf1]/85 p-5 sm:grid-cols-[44px_1fr]">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f2dfc2] text-[#8b5a16]">
                                            <LucideIcon size={21} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-[#211b16]">{title as string}</h3>
                                            <p className="mt-2 text-sm font-medium leading-6 text-[#665a4a]">{copy as string}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </PaperSection>

                <PaperSection className="py-16 sm:py-24">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <p className="font-mono text-sm font-black uppercase tracking-[0.18em] text-[#a97935]">FAQ</p>
                            <h2 className="mt-3 text-4xl font-black tracking-tight text-[#211b16] sm:text-5xl">Questions before you start</h2>
                        </div>
                        <div className="mt-10 space-y-4">
                            {faqs.map(({ question, answer }) => (
                                <details key={question} className="group rounded-lg border border-[#e4d3bc] bg-[#fffaf1]/85 p-6">
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-black text-[#211b16] [&::-webkit-details-marker]:hidden">
                                        {question}
                                        <ArrowRight size={18} className="shrink-0 transition group-open:rotate-90" />
                                    </summary>
                                    <p className="mt-4 text-base font-medium leading-7 text-[#665a4a]">{answer}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </PaperSection>

                <section className="bg-[#211b16] py-16 text-[#fffaf1] sm:py-24">
                    <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                        <p className="font-mono text-sm font-black uppercase tracking-[0.18em] text-[#d3a15e]">Ready when your next application is</p>
                        <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Create one workspace for the whole search.</h2>
                        <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-[#e7d4b9]">
                            Build the resume, save the role, prepare the interview, and keep the next action visible.
                        </p>
                        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                            <button onClick={() => navigate('/signup')} className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#fffaf1] px-6 py-4 font-black text-[#211b16]">
                                Sign up free <ArrowRight size={18} />
                            </button>
                            <button onClick={() => navigate('/contact')} className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#fffaf1]/20 px-6 py-4 font-black text-[#fffaf1]">
                                Contact support
                            </button>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
