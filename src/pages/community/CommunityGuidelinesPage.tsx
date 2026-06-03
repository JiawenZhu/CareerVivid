import React from 'react';
import { navigate } from '../../utils/navigation';
import {
    Home, TrendingUp, Briefcase, FileText,
    Terminal, ArrowLeft, CheckCircle2, AlertCircle, Shield
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';

const CommunityGuidelinesPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/80 pt-8 pb-16 relative overflow-hidden">
            {/* Ambient Base Glow */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-400/20 dark:bg-primary-600/10 blur-[120px] pointer-events-none z-[-1]" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[120px] pointer-events-none z-[-1]" />

            <PublicHeader />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 relative z-10">
                {/* Page Header */}
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Community Guidelines
                        </h1>
                        <p className="text-base text-gray-500 dark:text-gray-400 mt-1">
                            Rules and best practices for a healthy CareerVivid community.
                        </p>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* ── Left Column ─────────────────────────────────────── */}
                    <aside className="hidden md:flex flex-col gap-5 w-64 shrink-0 lg:sticky lg:top-24">
                        {/* Navigation */}
                        <nav className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] border border-white/50 dark:border-gray-800/50 shadow-sm overflow-hidden">
                            <NavItem
                                icon={<Home size={18} />}
                                label="Home"
                                onClick={() => navigate('/community')}
                            />
                            <NavItem
                                icon={<TrendingUp size={18} />}
                                label="Trending"
                                onClick={() => navigate('/community?sort=popular')}
                            />
                            <NavItem
                                icon={<Briefcase size={18} />}
                                label="Job Listings"
                                onClick={() => navigate('/job-market')}
                            />
                            <NavItem
                                icon={<FileText size={18} />}
                                label="Guidelines"
                                active
                                onClick={() => { }}
                            />
                            <NavItem
                                icon={<Terminal size={18} />}
                                label="Professional API"
                                onClick={() => navigate('/developers/api')}
                            />
                        </nav>
                    </aside>

                    {/* ── Center Column: Content ──────────────────────────────── */}
                    <main className="flex-1 min-w-0 bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] border border-white/50 dark:border-gray-800/50 shadow-sm p-8 sm:p-12">

                        <div className="prose prose-lg dark:prose-invert max-w-none">
                            <h2 className="flex items-center gap-2">
                                <Shield className="text-primary-500" /> Core Principles
                            </h2>
                            <p>
                                Welcome to the CareerVivid Community! Our goal is to create a supportive,
                                professional, and high-quality environment for developers and job seekers.
                                By participating, you agree to uphold these core principles.
                            </p>

                            <h3 className="flex items-center gap-2 mt-8">
                                <CheckCircle2 className="text-emerald-500" /> Do's
                            </h3>
                            <ul className="space-y-4">
                                <li>
                                    <strong>Be Respectful:</strong> Treat everyone with kindness and professionalism. Empathy is our default.
                                </li>
                                <li>
                                    <strong>Share High-Quality Knowledge:</strong> Write clear, well-formatted, and insightful posts. Use Markdown effectively.
                                </li>
                                <li>
                                    <strong>Help Others:</strong> Constructive feedback and thoughtful answers are highly encouraged.
                                </li>
                                <li>
                                    <strong>Cite Your Sources:</strong> If you are sharing statistics, quotes, or code from others, provide attribution.
                                </li>
                            </ul>

                            <h3 className="flex items-center gap-2 mt-8">
                                <AlertCircle className="text-red-500" /> Don'ts
                            </h3>
                            <ul className="space-y-4">
                                <li>
                                    <strong>No Spam or Self-Promotion:</strong> Purely promotional posts, affiliate links, and low-effort content will be removed.
                                </li>
                                <li>
                                    <strong>No Harassment or Toxicity:</strong> Personal attacks, discrimination, and hate speech are strictly prohibited.
                                </li>
                                <li>
                                    <strong>No Plagiarism:</strong> Do not copy and paste entire articles from other platforms.
                                </li>
                                <li>
                                    <strong>No Malicious Content:</strong> Do not share harmful code, exploits, or misleading information.
                                </li>
                            </ul>

                            <hr className="my-10 border-gray-200 dark:border-gray-800" />

                            <h2>Enforcement</h2>
                            <p>
                                The moderation team reserves the right to edit, remove, or lock any content
                                that violates these guidelines. Flagrant or repeated violations will result
                                in a permanent ban from the platform.
                            </p>

                            <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-xl border border-primary-100 dark:border-primary-800 mt-8">
                                <p className="m-0 text-primary-800 dark:text-primary-200 font-medium">
                                    Have questions about these guidelines or want to report a violation?
                                    Reach out to us at <a href="mailto:support@careervivid.com" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">support@careervivid.com</a>.
                                </p>
                            </div>
                        </div>

                    </main>
                </div>
            </div>
        </div>
    );
};

// ── NavItem sub-component ────────────────────────────────────────────────────
interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
}
const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition-colors duration-150 cursor-pointer relative
            ${active
                ? 'text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800/40'
            }`}
    >
        {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r-full shadow-[0_0_8px_rgba(var(--color-primary-500),0.6)]" />}
        <span className={active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}>{icon}</span>
        {label}
    </button>
);

export default CommunityGuidelinesPage;
