import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowRight, FileText, PenTool, ThumbsUp, MessageSquare, Terminal, LayoutTemplate, Share2, Sparkles, Briefcase, Copy, CheckCircle2 } from 'lucide-react';
import { navigate } from '../../utils/navigation';

// --- Miniature Mock Cards ---
const MockPostCard = ({ title, author, likes, comments, className = "" }: { title: string, author: string, likes: string, comments: string, className?: string }) => (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-xl w-52 sm:w-64 md:w-80 flex-shrink-0 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-400 to-blue-500 shrink-0" />
            <div className="space-y-1.5 flex-1">
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-16" />
            </div>
        </div>
        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-3 leading-snug line-clamp-2">{title}</h4>
        <div className="flex gap-4 items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
            <span className="flex items-center gap-1.5"><ThumbsUp size={12} className="text-blue-500" /> {likes}</span>
            <span className="flex items-center gap-1.5"><MessageSquare size={12} /> {comments}</span>
        </div>
    </div>
);

const MockResumeCard = ({ className = "" }: { className?: string }) => (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-xl w-52 sm:w-64 md:w-80 flex-shrink-0 flex flex-col items-center ${className}`}>
        {/* Document Header */}
        <div className="w-full border-b border-gray-100 dark:border-gray-800 pb-3 mb-3 text-center">
            <div className="h-3.5 bg-gray-300 dark:bg-gray-600 rounded-full w-32 mx-auto mb-2" />
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-48 mx-auto" />
        </div>
        {/* Document Body Blocks */}
        <div className="w-full space-y-3">
            <div className="space-y-1.5">
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
            </div>
            <div className="space-y-1.5">
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-4/5" />
            </div>
        </div>
        <div className="mt-4 w-full flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1"><LayoutTemplate size={10} /> ATS Optimized</span>
            <span className="text-primary-500 bg-primary-50 dark:bg-primary-900/30 p-1.5 rounded-full"><Share2 size={12} /></span>
        </div>
    </div>
);

const MockWhiteboardCard = ({ title, className = "" }: { title: string, className?: string }) => (
    <div className={`bg-gray-900 rounded-2xl p-5 border border-gray-800 shadow-2xl w-52 sm:w-64 md:w-80 flex-shrink-0 ring-1 ring-white/10 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
            <span className="p-1 px-2 rounded-md bg-white/10 text-[10px] text-white font-mono uppercase tracking-widest">{title}</span>
        </div>
        <div className="bg-gray-950 rounded-xl p-4 border border-gray-800 h-32 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
            <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-16 h-8 bg-blue-500/20 border border-blue-500/50 rounded flex items-center justify-center text-blue-400"><Terminal size={12} /></div>
                <div className="w-0.5 h-6 bg-gray-700" />
                <div className="w-12 h-10 bg-purple-500/20 border border-purple-500/50 rounded flex items-center justify-center text-purple-400"><PenTool size={12} /></div>
            </div>
        </div>
    </div>
);

// ── Terminal card for the 3-column CLI section ──
const TerminalCard = ({ command, description, hoverOutput, delay = 0, isFocused, anyHovered, onEnter, onLeave }: {
    command: string;
    description: string;
    hoverOutput: React.ReactNode;
    delay?: number;
    isFocused: boolean;
    anyHovered: boolean;
    onEnter: () => void;
    onLeave: () => void;
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
            { threshold: 0.1 }
        );
        if (cardRef.current) observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, []);

    const dimmed = anyHovered && !isFocused;

    return (
        <motion.div
            ref={cardRef as any}
            layout
            initial={{ opacity: 0, y: 40 }}
            animate={isVisible ? {
                opacity: dimmed ? 0.35 : 1,
                y: 0,
                flexGrow: isFocused ? 1.8 : dimmed ? 0.6 : 1,
            } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: isVisible ? 0 : delay }}
            className={`flex flex-col bg-white dark:bg-[#0a0a0a] border rounded-xl overflow-hidden shadow-2xl ring-1 cursor-pointer text-left ${
                isFocused
                    ? 'border-primary-400/60 dark:border-primary-500/50 ring-primary-400/20 dark:ring-primary-500/20 shadow-primary-500/10'
                    : 'border-gray-200 dark:border-gray-800 ring-gray-900/5 dark:ring-white/10'
            }`}
            style={{ flexBasis: 0, minWidth: 0 }}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
        >
            {/* Terminal header bar */}
            <div className={`flex items-center px-4 py-3 border-b gap-2 shrink-0 transition-colors ${
                isFocused
                    ? 'bg-gray-900 dark:bg-black border-gray-700'
                    : 'bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-gray-800'
            }`}>
                <div className="flex gap-1.5 mr-auto">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <span className={`text-xs font-mono ${
                    isFocused ? 'text-gray-300' : 'text-gray-400 dark:text-gray-500'
                }`}>careervivid — agent</span>
            </div>

            {/* Terminal body */}
            <div className="p-5 font-mono text-xs sm:text-sm flex flex-col gap-3 flex-1">
                {/* Command line */}
                <div className="flex items-center gap-2">
                    <span className="text-pink-500 select-none">~</span>
                    <span className="text-primary-500 dark:text-primary-400">cv</span>
                    <span className="text-gray-800 dark:text-gray-100 font-semibold">{command.replace('cv ', '')}</span>
                    {isFocused && <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse rounded-sm ml-1" />}
                </div>

                {/* Description */}
                <p className="text-gray-500 dark:text-gray-400 font-sans text-[13px] leading-relaxed border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                    {description}
                </p>

                {/* Hover output */}
                <AnimatePresence mode="wait">
                    {isFocused ? (
                        <motion.div
                            key="output"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="border-l-2 border-primary-400/50 pl-3 font-sans text-[12px] space-y-2.5 text-gray-600 dark:text-gray-300 py-2">
                                {hoverOutput}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-gray-400 dark:text-gray-600 italic font-sans text-[12px] mt-auto pt-4"
                        >
                            Hover to see live execution →
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const CommunityShowcaseHero: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [copiedToClipboard, setCopiedToClipboard] = useState(false);
    const [hoveredCard, setHoveredCard] = useState<'agent' | 'resume' | 'jobs' | null>(null);

    const handleCopy = () => {
        navigator.clipboard.writeText('npm install -g careervivid');
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
    };

    // Scroll tracking for the sticky hero section only
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Floating cards fade out + parallax
    const cardsOpacity = useTransform(scrollYProgress, [0, 0.5, 0.8], [1, 1, 0]);
    const cardsScale  = useTransform(scrollYProgress, [0, 0.5, 0.8], [1, 1, 0.9]);
    const yColumn1    = useTransform(scrollYProgress, [0, 1], [0, -1000]);
    const yColumn2    = useTransform(scrollYProgress, [0, 1], [0,  800]);
    const yColumn3    = useTransform(scrollYProgress, [0, 1], [0, -800]);

    return (
        <>
            {/* ── PHASE 1: Scroll-jacked hero with parallax floating cards ── */}
            <section ref={containerRef} className="relative h-[160vh] bg-gray-50 dark:bg-gray-950">
                <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center z-20">

                    {/* Floating community cards (parallax + fade out on scroll) */}
                    <motion.div
                        style={{ opacity: cardsOpacity, scale: cardsScale }}
                        className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
                    >
                        {/* Left column: hidden on xs/sm, visible from md up */}
                        <motion.div className="hidden md:flex flex-col gap-8 absolute left-[2%] lg:left-[8%] top-[20%]" style={{ y: yColumn1 }}>
                            <MockPostCard title="How I scaled our Redis cache by sharding." author="Sarah" likes="3.2k" comments="145" className="rotate-[-3deg]" />
                            <MockWhiteboardCard title="Event-Driven Microservices" className="rotate-[2deg]" />
                            <MockResumeCard className="rotate-[-1deg]" />
                        </motion.div>
                        {/* Center column: large screens only */}
                        <motion.div className="hidden lg:flex flex-col gap-8 absolute left-1/2 -translate-x-1/2 top-[-10%]" style={{ y: yColumn2 }}>
                            <MockResumeCard className="rotate-[1deg] opacity-30 blur-sm" />
                            <MockPostCard title="Frontend to Fullstack: My 6-month roadmap." author="Alex" likes="1.1k" comments="89" className="rotate-[-2deg] opacity-30 blur-sm" />
                            <MockWhiteboardCard title="Database Sharding Architecture" className="rotate-[3deg] opacity-30 blur-sm" />
                        </motion.div>
                        {/* Right column: hidden on xs/sm, visible from md up */}
                        <motion.div className="hidden md:flex flex-col gap-8 absolute right-[2%] lg:right-[8%] top-[40%]" style={{ y: yColumn3 }}>
                            <MockWhiteboardCard title="Real-time Chat Socket Architecture" className="rotate-[4deg]" />
                            <MockResumeCard className="rotate-[-2deg]" />
                            <MockPostCard title="The exact behavioral answers I used." author="Priya" likes="4.5k" comments="210" className="rotate-[1deg]" />
                        </motion.div>
                    </motion.div>

                    {/* Hero text – centered, always visible */}
                    <div className="relative z-30 flex flex-col items-center text-center px-4 max-w-4xl mx-auto w-full">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm font-bold mb-6 tracking-wide">
                            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                            Where Tech Careers Grow in Public.
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-[1.1] mb-5">
                            Automate your{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400">
                                job search.
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto mb-8">
                            Supercharge your job search with your personal AI agent. Autonomously tailor your resume to beat the ATS, auto-apply to top roles, and build a digital portfolio that stands out.
                        </p>

                        {/* CTA buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                            <button onClick={() => navigate('/community')} className="px-8 py-4 bg-primary-600 hover:bg-primary-700 dark:hover:bg-primary-500 text-white rounded-2xl font-extrabold text-lg transition-all shadow-xl shadow-primary-600/20 hover:shadow-primary-500/40 flex items-center justify-center gap-3">
                                Explore the Community <ArrowRight size={20} />
                            </button>
                            <button onClick={() => navigate('/auth')} className="px-8 py-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-gray-700 rounded-2xl font-extrabold text-lg transition-all flex items-center justify-center gap-3">
                                <FileText size={20} /> Build ATS Resume
                            </button>
                        </div>

                        {/* Quick install pill */}
                        <div className="flex items-center gap-2 sm:gap-3 bg-gray-900 dark:bg-black border border-gray-700 hover:border-gray-500 rounded-xl px-3 sm:px-5 py-2.5 shadow-2xl transition-colors max-w-full overflow-hidden">
                            <span className="text-pink-500 font-mono font-bold flex-shrink-0">~</span>
                            <span className="text-gray-300 font-mono text-xs sm:text-sm truncate">npm install -g careervivid</span>
                            <button
                                onClick={handleCopy}
                                className="flex-shrink-0 ml-1 sm:ml-2 px-2 sm:px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-medium border border-gray-700"
                            >
                                {copiedToClipboard ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                <span className="hidden xs:inline">{copiedToClipboard ? 'Copied!' : 'Copy'}</span>
                                <span className="xs:hidden">{copiedToClipboard ? '✓' : 'Copy'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PHASE 2: CLI 3-column grid – IntersectionObserver scroll reveal ── */}
            <section className="bg-gray-50 dark:bg-gray-950 pt-10 pb-28 px-4">
                {/* Section label */}
                <div className="text-center mb-10">
                    <p className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-2">CareerVivid Agent</p>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                        One CLI. Three superpowers.
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-xl mx-auto text-sm">
                        Hover each command to see what the agent does in real time.
                    </p>
                </div>

                {/* Flex layout so focused card can grow wider */}
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-stretch md:min-h-[380px]">
                    <TerminalCard
                        command="cv agent"
                        description="Boot full-scale local agent. Interactive REPL with slash commands, model switching, and full tool access."
                        delay={0}
                        isFocused={hoveredCard === 'agent'}
                        anyHovered={hoveredCard !== null}
                        onEnter={() => setHoveredCard('agent')}
                        onLeave={() => setHoveredCard(null)}
                        hoverOutput={
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold"><Sparkles size={11} /> Booting agent...</div>
                                <div className="pl-2 space-y-1 text-gray-500 dark:text-gray-400">
                                    <p>✓ Local terminal environment initialized</p>
                                    <p>✓ Browser automation ready (Playwright)</p>
                                    <p>✓ GitHub profile fetched — 12 repos indexed</p>
                                    <p>✓ Authenticated as <span className="text-primary-500 font-semibold">Developer</span></p>
                                </div>
                                <div className="border-t border-gray-100 dark:border-gray-800 pt-2 mt-1">
                                    <p className="text-gray-700 dark:text-gray-200 font-medium mb-1">Slash commands available:</p>
                                    <div className="space-y-1 text-gray-500 dark:text-gray-400">
                                        <p><code className="text-primary-500">/help</code> — list all commands</p>
                                        <p><code className="text-primary-500">/model</code> — switch active LLM</p>
                                        <p><code className="text-primary-500">/models</code> — list available models</p>
                                    </div>
                                </div>
                                <div className="mt-2 text-primary-600 dark:text-primary-400 font-semibold">Agent ready. What would you like to do?</div>
                            </div>
                        }
                    />
                    <TerminalCard
                        command="cv agent --resume"
                        description="Autonomously rewrites your resume.md to match any job posting — ATS-optimized, metrics-aligned."
                        delay={0.12}
                        isFocused={hoveredCard === 'resume'}
                        anyHovered={hoveredCard !== null}
                        onEnter={() => setHoveredCard('resume')}
                        onLeave={() => setHoveredCard(null)}
                        hoverOutput={
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 font-bold"><LayoutTemplate size={11} /> Tailoring resume...</div>
                                <div className="pl-2 space-y-1 text-gray-500 dark:text-gray-400">
                                    <p>→ Opening Ashby job URL in headless browser</p>
                                    <p>→ Extracting: React, TypeScript, System Design, AWS</p>
                                    <p>→ Cross-referencing against local resume.md</p>
                                    <p>→ Rewriting summary section...</p>
                                    <p>→ Reordering experience bullets by relevance</p>
                                </div>
                                <div className="border-t border-gray-100 dark:border-gray-800 pt-2 space-y-1">
                                    <p className="text-gray-500 dark:text-gray-400">Changes made:</p>
                                    <p className="text-emerald-600 dark:text-emerald-400">+ Added: "Led migration of 3 services to AWS Lambda"</p>
                                    <p className="text-emerald-600 dark:text-emerald-400">+ Quantified: "Reduced latency by 40%" → "by 40ms (p99)"</p>
                                </div>
                                <div className="font-bold text-primary-500 mt-1">ATS match score: 72% → 96% ✓</div>
                            </div>
                        }
                    />
                    <TerminalCard
                        command="cv agent --jobs"
                        description="Scans job boards for your skill set, ranks matches, and auto-submits applications via agentic browser control."
                        delay={0.24}
                        isFocused={hoveredCard === 'jobs'}
                        anyHovered={hoveredCard !== null}
                        onEnter={() => setHoveredCard('jobs')}
                        onLeave={() => setHoveredCard(null)}
                        hoverOutput={
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold"><Briefcase size={11} /> Scanning market...</div>
                                <div className="pl-2 space-y-1 text-gray-500 dark:text-gray-400">
                                    <p>→ Querying LinkedIn, Greenhouse, Ashby, Lever</p>
                                    <p>→ Filtering: remote · TypeScript · Sr. Engineer</p>
                                    <p>→ Scoring against your skill profile...</p>
                                </div>
                                <div className="border-t border-gray-100 dark:border-gray-800 pt-2 space-y-1.5">
                                    <p className="text-gray-700 dark:text-gray-200 font-medium">Top matches found:</p>
                                    <p className="text-gray-500 dark:text-gray-400">1. <span className="text-indigo-500">Stripe</span> — Staff Engineer (98% match)</p>
                                    <p className="text-gray-500 dark:text-gray-400">2. <span className="text-indigo-500">Linear</span> — Sr. Frontend Eng (94% match)</p>
                                    <p className="text-gray-500 dark:text-gray-400">3. <span className="text-indigo-500">Vercel</span> — Platform Eng (91% match)</p>
                                </div>
                                <div className="font-bold text-indigo-500 mt-1">Auto-submitting applications... 3/3 ✓</div>
                            </div>
                        }
                    />
                </div>
            </section>
        </>
    );
};

export default CommunityShowcaseHero;
