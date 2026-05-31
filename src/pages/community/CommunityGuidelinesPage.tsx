import React from 'react';
import { navigate } from '../../utils/navigation';
import {
    Home, TrendingUp, Briefcase, FileText,
    Terminal, ArrowLeft, CheckCircle2, AlertCircle, Shield
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';

const CommunityGuidelinesPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#f7f1e7] text-[#211b16] pt-8 pb-16 relative overflow-hidden">
            <div
                className="fixed inset-0 pointer-events-none opacity-50 z-[-1]"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, rgba(139, 90, 22, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(139, 90, 22, 0.06) 1px, transparent 1px)',
                    backgroundSize: '64px 64px',
                }}
            />

            <PublicHeader variant="editorial" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 relative z-10">
                {/* Page Header */}
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-[#211b16] tracking-tight">
                            Community Guidelines
                        </h1>
                        <p className="text-base font-semibold text-[#665a4a] mt-2">
                            Rules and best practices for a healthy CareerVivid community.
                        </p>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* ── Left Column ─────────────────────────────────────── */}
                    <aside className="hidden md:flex flex-col gap-5 w-64 shrink-0 lg:sticky lg:top-24">
                        {/* Navigation */}
                        <nav className="bg-[#fffaf1]/82 backdrop-blur-xl rounded-[24px] border border-[#e4d3bc] shadow-sm overflow-hidden">
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
                    <main className="flex-1 min-w-0 bg-[#fffaf1]/88 backdrop-blur-xl rounded-[24px] border border-[#e4d3bc] shadow-sm p-8 sm:p-12">

                        <div className="prose prose-lg max-w-none prose-headings:text-[#211b16] prose-p:text-[#665a4a] prose-li:text-[#665a4a] prose-strong:text-[#211b16]">
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

                            <div className="bg-[#f7fff8] p-6 rounded-xl border border-[#bcdcc9] mt-8">
                                <p className="m-0 text-[#137245] font-medium">
                                    Have questions about these guidelines or want to report a violation?
                                    Reach out to us at <a href="mailto:support@careervivid.com" className="text-[#0f6a3b] font-bold hover:underline">support@careervivid.com</a>.
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
                ? 'text-[#2563eb] bg-[#eef4ff]'
                : 'text-[#665a4a] hover:bg-white/45'
            }`}
    >
        {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2563eb] rounded-r-full" />}
        <span className={active ? 'text-[#2563eb]' : 'text-[#a97935]'}>{icon}</span>
        {label}
    </button>
);

export default CommunityGuidelinesPage;
