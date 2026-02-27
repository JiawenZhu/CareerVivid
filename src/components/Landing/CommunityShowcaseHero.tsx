import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, FileText, PenTool, ThumbsUp, MessageSquare, Terminal, LayoutTemplate, Share2 } from 'lucide-react';
import { navigate } from '../../utils/navigation';

// --- Miniature Mock Cards ---

const MockPostCard = ({ title, author, likes, comments, className = "" }: { title: string, author: string, likes: string, comments: string, className?: string }) => (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-xl w-64 md:w-80 flex-shrink-0 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-400 to-blue-500 shrink-0" />
            <div className="space-y-1.5 flex-1">
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-16" />
            </div>
        </div>
        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-3 leading-snug line-clamp-2">
            {title}
        </h4>
        <div className="flex gap-4 items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
            <span className="flex items-center gap-1.5"><ThumbsUp size={12} className="text-blue-500" /> {likes}</span>
            <span className="flex items-center gap-1.5"><MessageSquare size={12} /> {comments}</span>
        </div>
    </div>
);

const MockResumeCard = ({ className = "" }: { className?: string }) => (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-xl w-64 md:w-80 flex-shrink-0 flex flex-col items-center ${className}`}>
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
    <div className={`bg-gray-900 rounded-2xl p-5 border border-gray-800 shadow-2xl w-64 md:w-80 flex-shrink-0 ring-1 ring-white/10 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
            <span className="p-1 px-2 rounded-md bg-white/10 text-[10px] text-white font-mono uppercase tracking-widest">{title}</span>
        </div>
        <div className="bg-gray-950 rounded-xl p-4 border border-gray-800 h-32 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Fake System Design boxes */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
            <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-16 h-8 bg-blue-500/20 border border-blue-500/50 rounded flex items-center justify-center text-blue-400">
                    <Terminal size={12} />
                </div>
                {/* Arrow line */}
                <div className="w-0.5 h-6 bg-gray-700" />
                <div className="flex gap-4">
                    <div className="w-12 h-10 bg-purple-500/20 border border-purple-500/50 rounded flex items-center justify-center text-purple-400">
                        <PenTool size={12} />
                    </div>
                </div>
            </div>
        </div>
    </div>
);


const CommunityShowcaseHero: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Track scrolling progress through the massive 200vh container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Parallax logic: Different columns move at different rates relative to the scroll progress
    const yColumn1 = useTransform(scrollYProgress, [0, 1], [0, -800]);
    const yColumn2 = useTransform(scrollYProgress, [0, 1], [0, 600]);
    const yColumn3 = useTransform(scrollYProgress, [0, 1], [0, -600]);

    return (
        <section ref={containerRef} className="relative h-[130vh] bg-gray-50 dark:bg-gray-950 overflow-hidden">

            {/* The Sticky Foreground (Copy + CTA) */}
            <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center z-20 pointer-events-none px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white tracking-tighter leading-[1.1] mb-6 drop-shadow-sm">
                            Where Tech Careers <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400 relative">
                                Grow in Public.
                            </span>
                        </h1>
                        <p className="text-xl md:text-3xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium leading-relaxed mb-10 drop-shadow-sm">
                            Join 10,000+ professionals sharing AI-optimized resumes, system design whiteboards, and career insights.
                        </p>
                    </motion.div>

                    {/* CTAs require pointer-events-auto so they can be clicked */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto"
                    >
                        <button
                            onClick={() => navigate('/community')}
                            className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-extrabold text-lg transition-all shadow-xl hover:shadow-primary-500/30 flex items-center justify-center gap-3 cursor-pointer transform hover:scale-105"
                        >
                            Explore the Feed <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/auth')}
                            className="px-8 py-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-gray-700 rounded-2xl font-extrabold text-lg transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer"
                        >
                            <FileText size={20} /> Share Your Resume
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* The Parallax Background layer */}
            <div className="absolute inset-0 w-full h-[130vh] pointer-events-none z-10 overflow-hidden flex justify-center opacity-40 sm:opacity-60 lg:opacity-100">
                {/* 3 Columns of Mock Cards */}

                {/* Column 1 (Left - Moves Up Fast) */}
                <motion.div className="flex flex-col gap-8 absolute left-[-10%] sm:left-[5%] lg:left-[10%] top-[20%]" style={{ y: yColumn1 }}>
                    <MockPostCard
                        title="How I scaled our Redis cache to handle 1M requests/sec by sharding."
                        author="Sarah Jenkins" likes="3.2k" comments="145"
                        className="rotate-[-3deg]"
                    />
                    <MockWhiteboardCard
                        title="Event-Driven Microservices"
                        className="rotate-[2deg]"
                    />
                    <MockResumeCard className="rotate-[-1deg]" />
                    <MockPostCard
                        title="My SWE III resume that got me offers from Google and Stripe."
                        author="David Chen" likes="5.8k" comments="302"
                        className="rotate-[4deg]"
                    />
                    <MockWhiteboardCard
                        title="Global Load Balancing"
                        className="rotate-[-2deg]"
                    />
                </motion.div>

                {/* Column 2 (Center - Moves Down Slow - Behind Text) */}
                <motion.div className="hidden lg:flex flex-col gap-8 absolute left-1/2 -translate-x-1/2 top-[-10%]" style={{ y: yColumn2 }}>
                    <MockResumeCard className="rotate-[1deg] opacity-30 blur-sm" />
                    <MockPostCard
                        title="Transitioning from Frontend to Fullstack: My 6-month roadmap."
                        author="Alex Rivera" likes="1.1k" comments="89"
                        className="rotate-[-2deg] opacity-30 blur-sm"
                    />
                    <MockWhiteboardCard
                        title="Database Sharding Architecture"
                        className="rotate-[3deg] opacity-30 blur-sm"
                    />
                    <MockResumeCard className="rotate-[-1deg] opacity-30 blur-sm" />
                </motion.div>

                {/* Column 3 (Right - Moves Up Medium) */}
                <motion.div className="flex flex-col gap-8 absolute right-[-10%] sm:right-[5%] lg:right-[10%] top-[40%]" style={{ y: yColumn3 }}>
                    <MockWhiteboardCard
                        title="Real-time Chat Socket Architecture"
                        className="rotate-[4deg]"
                    />
                    <MockResumeCard className="rotate-[-2deg]" />
                    <MockPostCard
                        title="The exact behavioral answers I used for my Engineering Manager loop."
                        author="Priya Patel" likes="4.5k" comments="210"
                        className="rotate-[1deg]"
                    />
                    <MockWhiteboardCard
                        title="Rate Limiter Implementation"
                        className="rotate-[-3deg]"
                    />
                    <MockResumeCard className="rotate-[2deg]" />
                </motion.div>
            </div>

            {/* Gradient Fade out at bottom to merge seamlessly into the rest of the landing page */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-b from-transparent to-white dark:to-gray-950 z-30 pointer-events-none" />
        </section>
    );
};

export default CommunityShowcaseHero;
