import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, Variants } from 'framer-motion';
import { Check, X, Terminal, Zap, Bot } from 'lucide-react';
import { navigate } from '../../utils/navigation';
import { useAuth } from '../../contexts/AuthContext';
import {
    FREE_PLAN_CREDIT_LIMIT,
    PRO_PLAN_CREDIT_LIMIT,
    PRO_MAX_PLAN_CREDIT_LIMIT,
    ENTERPRISE_PLAN_CREDIT_LIMIT,
} from '../../config/creditCosts';

interface PricingComparisonProps {
    onCloudUpgrade?: () => void;
    isLoading?: boolean;
}

export const PricingComparison: React.FC<PricingComparisonProps> = ({ onCloudUpgrade, isLoading }) => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();

    const handleUpgradeClick = () => {
        if (currentUser) {
            navigate('/subscription');
        } else {
            navigate('/signup?redirect=/subscription');
        }
    };

    // ── Feature comparison table ────────────────────────────────────────────
    // Rows that are credit-based use string values; boolean for included/excluded
    const features: Array<{
        name: string;
        category?: string;
        free: boolean | string;
        pro: boolean | string;
        max: boolean | string;
        enterprise: boolean | string;
    }> = [
        // CLI Agent
        { category: '🤖 CLI AI Agent', name: '', free: '', pro: '', max: '', enterprise: '' },
        { name: 'cv agent (Gemini Flash Lite, 0.5 cr/turn)', free: true, pro: true, max: true, enterprise: true },
        { name: 'cv agent (Gemini 2.5 Flash, 1 cr/turn)', free: true, pro: true, max: true, enterprise: true },
        { name: 'cv agent --pro (Gemini Pro, 2 cr/turn)', free: false, pro: true, max: true, enterprise: true },
        { name: 'cv agent --jobs (job search & tracker)', free: true, pro: true, max: true, enterprise: true },
        { name: 'cv agent --resume (resume tools)', free: true, pro: true, max: true, enterprise: true },
        { name: 'BYO API Key (OpenAI / Claude / OpenRouter…)', free: true, pro: true, max: true, enterprise: true },
        // Job & Resume AI
        { category: '📄 Job & Resume AI', name: '', free: '', pro: '', max: '', enterprise: '' },
        { name: 'AI Resume Tailor', free: '5 credits', pro: '5 credits', max: '5 credits', enterprise: '5 credits' },
        { name: 'Job Search & Scoring', free: '1 credit', pro: '1 credit', max: '1 credit', enterprise: '1 credit' },
        { name: 'Targeted Job Prep Notes', free: '10 credits', pro: '10 credits', max: '10 credits', enterprise: '10 credits' },
        // Developer Tools
        { category: '🛠 Developer Tools', name: '', free: '', pro: '', max: '', enterprise: '' },
        { name: 'CLI Publish (Markdown/Mermaid)', free: 'Free', pro: 'Free', max: 'Free', enterprise: 'Free' },
        { name: 'ReactFlow UI Conversion', free: '5 credits', pro: '5 credits', max: '5 credits', enterprise: '5 credits' },
        { name: 'Architecture Auto-Gen', free: '10 credits', pro: '10 credits', max: '10 credits', enterprise: '10 credits' },
        { name: 'Living Documentation Sync', free: false, pro: true, max: true, enterprise: true },
        // Interviews & Portfolio
        { category: '🎤 Interviews & Portfolio', name: '', free: '', pro: '', max: '', enterprise: '' },
        { name: 'Technical Voice Interviews', free: '15 credits', pro: '15 credits', max: '15 credits', enterprise: '15 credits' },
        { name: 'Portfolio Review Analysis', free: '5 credits', pro: '5 credits', max: '5 credits', enterprise: '5 credits' },
        // Team
        { category: '🏢 Team', name: '', free: '', pro: '', max: '', enterprise: '' },
        { name: 'Private Team Workspaces', free: false, pro: false, max: false, enterprise: true },
        { name: 'Advanced RBAC & SSO', free: false, pro: false, max: false, enterprise: true },
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08 } },
    };
    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
    };

    const CellValue: React.FC<{ val: boolean | string; accent?: string }> = ({ val, accent = 'text-gray-600 dark:text-gray-400' }) => {
        if (typeof val === 'string' && val === '') return null;
        if (typeof val === 'string') return <span className={`text-xs font-bold ${accent}`}>{val}</span>;
        if (val) return <Check className="mx-auto text-green-500" strokeWidth={3} size={18} />;
        return <X className="mx-auto text-gray-300 dark:text-gray-600" size={18} />;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-20">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-bold mb-6">
                    <Bot size={16} /> AI Credit Plans
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-6">
                    Power your career with{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                        AI Credits
                    </span>
                </h2>
                <p className="max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-400 font-medium">
                    One universal credit system powers the entire platform — the CLI agent, resume tailoring,
                    job search, voice interviews, and more. Each AI action costs credits; manual work is always free.
                </p>
            </div>

            {/* 4-Tier Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-50px' }}
                className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 mb-24"
            >
                {/* Free */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm flex flex-col group hover:shadow-md transition-shadow"
                >
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Free</h3>
                        <p className="text-sm text-gray-500 font-medium">Try CareerVivid today.</p>
                    </div>
                    <div className="mb-8">
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-gray-900 dark:text-white">$0</span>
                        </div>
                        <div className="text-xs text-green-600 font-bold tracking-widest mt-3 uppercase bg-green-50 dark:bg-green-900/20 inline-flex items-center gap-1.5 px-3 py-1 rounded-full">
                            <Zap size={12} /> {FREE_PLAN_CREDIT_LIMIT} AI credits / mo
                        </div>
                    </div>
                    <ul className="space-y-3.5 mb-8 flex-grow text-sm font-medium text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-3"><Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} /><span>cv agent (Flash Lite & Flash)</span></li>
                        <li className="flex items-start gap-3"><Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} /><span>Job search &amp; tracker</span></li>
                        <li className="flex items-start gap-3"><Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} /><span>Gemini Gemini models (no API key needed)</span></li>
                        <li className="flex items-start gap-3"><Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} /><span>BYO API key (OpenAI, Claude…)</span></li>
                        <li className="flex items-start gap-3"><Terminal className="text-green-500 flex-shrink-0 mt-0.5" size={18} /><span>CLI Publish (always free)</span></li>
                    </ul>
                    <button
                        onClick={() => navigate('/signup')}
                        className="w-full py-4 rounded-xl font-bold border-2 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                    >
                        Get Started Free
                    </button>
                </motion.div>

                {/* Pro */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-900 border-2 border-primary-500/30 rounded-3xl p-8 shadow-xl flex flex-col relative overflow-hidden group hover:border-primary-500/50 transition-colors"
                >
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600 hidden group-hover:block" />
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Pro</h3>
                        <p className="text-sm text-gray-500 font-medium">For active job seekers.</p>
                    </div>
                    <div className="mb-8">
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-gray-900 dark:text-white">$9</span>
                            <span className="text-gray-500 text-sm font-bold">/mo</span>
                        </div>
                        <div className="text-xs text-primary-600 font-bold tracking-widest mt-3 uppercase bg-primary-50 dark:bg-primary-900/20 inline-flex items-center gap-1.5 px-3 py-1 rounded-full">
                            <Zap size={12} /> {PRO_PLAN_CREDIT_LIMIT.toLocaleString()} AI credits / mo
                        </div>
                        <p className="text-xs text-gray-400 mt-2">≈ 1,000 Flash turns or 500 Pro turns</p>
                    </div>
                    <ul className="space-y-3.5 mb-8 flex-grow text-sm font-medium text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-3"><Check className="text-primary-500 flex-shrink-0 mt-0.5" size={18} /><span>Everything in Free</span></li>
                        <li className="flex items-start gap-3"><Check className="text-primary-500 flex-shrink-0 mt-0.5" size={18} /><span>cv agent --pro (Gemini Pro model)</span></li>
                        <li className="flex items-start gap-3"><Check className="text-primary-500 flex-shrink-0 mt-0.5" size={18} /><span>Unlisted posts &amp; custom domains</span></li>
                        <li className="flex items-start gap-3"><Check className="text-primary-500 flex-shrink-0 mt-0.5" size={18} /><span>Living Documentation Sync</span></li>
                    </ul>
                    <button
                        onClick={handleUpgradeClick}
                        disabled={!!isLoading}
                        className="w-full py-4 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/25 disabled:opacity-60"
                    >
                        Start Pro
                    </button>
                </motion.div>

                {/* Max */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-900 border-2 border-purple-500 rounded-3xl p-8 shadow-2xl flex flex-col relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 blur-3xl rounded-full" />
                    <div className="absolute -right-10 top-6 rotate-45 bg-purple-500 text-white text-[10px] font-black px-12 py-1 shadow-md">
                        POWER
                    </div>
                    <div className="mb-6 relative z-10">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Max</h3>
                        <p className="text-sm text-gray-500 font-medium">For power users &amp; recruiters.</p>
                    </div>
                    <div className="mb-8 relative z-10">
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-gray-900 dark:text-white">$29</span>
                            <span className="text-gray-500 text-sm font-bold">/mo</span>
                        </div>
                        <div className="text-xs text-purple-600 font-bold tracking-widest mt-3 uppercase bg-purple-50 dark:bg-purple-900/20 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-100 dark:border-purple-800/50">
                            <Zap size={12} /> {PRO_MAX_PLAN_CREDIT_LIMIT.toLocaleString()} AI credits / mo
                        </div>
                        <p className="text-xs text-gray-400 mt-2">≈ 10,000 Flash turns or 5,000 Pro turns</p>
                    </div>
                    <ul className="space-y-3.5 mb-8 flex-grow text-sm font-medium text-gray-600 dark:text-gray-400 relative z-10">
                        <li className="flex items-start gap-3"><Check className="text-purple-500 flex-shrink-0 mt-0.5" size={18} /><span>Everything in Pro</span></li>
                        <li className="flex items-start gap-3"><Check className="text-purple-500 flex-shrink-0 mt-0.5" size={18} /><span>Private posts &amp; advanced ReactFlow</span></li>
                        <li className="flex items-start gap-3"><Check className="text-purple-500 flex-shrink-0 mt-0.5" size={18} /><span>10× more AI turns than Pro</span></li>
                        <li className="flex items-start gap-3"><Check className="text-purple-500 flex-shrink-0 mt-0.5" size={18} /><span>Priority model access</span></li>
                    </ul>
                    <button
                        onClick={handleUpgradeClick}
                        className="w-full py-4 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-xl shadow-purple-600/30 relative z-10"
                    >
                        Get Max
                    </button>
                </motion.div>

                {/* Enterprise */}
                <motion.div
                    variants={itemVariants}
                    className="bg-gray-900 dark:bg-black text-white rounded-3xl p-8 shadow-2xl flex flex-col relative overflow-hidden border border-gray-800"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-800/50 blur-2xl rounded-full" />
                    <div className="mb-6 relative z-10">
                        <h3 className="text-2xl font-bold mb-1">Enterprise</h3>
                        <p className="text-sm text-gray-400 font-medium">For hiring teams &amp; orgs.</p>
                    </div>
                    <div className="mb-8 relative z-10">
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black">$12</span>
                            <span className="text-gray-400 text-sm font-bold">/seat</span>
                        </div>
                        <div className="text-xs text-amber-400 font-bold tracking-widest mt-3 uppercase bg-amber-400/10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-400/20">
                            <Zap size={12} /> {ENTERPRISE_PLAN_CREDIT_LIMIT.toLocaleString()} pooled credits/seat
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Credits pool across all seats</p>
                    </div>
                    <ul className="space-y-3.5 mb-8 flex-grow text-sm font-medium text-gray-300 relative z-10">
                        <li className="flex items-start gap-3"><Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} /><span>Private Team Workspaces</span></li>
                        <li className="flex items-start gap-3"><Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} /><span>SSO &amp; SCIM provisioning</span></li>
                        <li className="flex items-start gap-3"><Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} /><span>Team RBAC &amp; audit logs</span></li>
                        <li className="flex items-start gap-3"><Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} /><span>Pooled credits across org</span></li>
                    </ul>
                    <button
                        onClick={handleUpgradeClick}
                        className="w-full py-4 rounded-xl font-bold bg-white text-gray-900 hover:bg-gray-100 transition-colors relative z-10"
                    >
                        Contact Sales
                    </button>
                </motion.div>
            </motion.div>

            {/* Feature Table */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mt-20 overflow-hidden bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/80 text-xs font-black uppercase tracking-widest text-gray-500">
                                <th className="p-5 border-b border-gray-200 dark:border-gray-800">Capabilities</th>
                                <th className="p-5 border-b border-gray-200 dark:border-gray-800 text-center w-36">Free</th>
                                <th className="p-5 border-b border-gray-200 dark:border-gray-800 text-center w-36 text-primary-600 dark:text-primary-400">Pro</th>
                                <th className="p-5 border-b border-gray-200 dark:border-gray-800 text-center w-36 text-purple-600 dark:text-purple-400">Max</th>
                                <th className="p-5 border-b border-gray-200 dark:border-gray-800 text-center w-36">Enterprise</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {features.map((f, i) => {
                                // Category header row
                                if (f.category) {
                                    return (
                                        <tr key={i} className="bg-gray-50/80 dark:bg-gray-800/60">
                                            <td colSpan={5} className="px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                                {f.category}
                                            </td>
                                        </tr>
                                    );
                                }
                                return (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                                        <td className="px-5 py-4 font-medium text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800/50 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                            {f.name}
                                        </td>
                                        <td className="px-5 py-4 text-center border-b border-gray-100 dark:border-gray-800/50">
                                            <CellValue val={f.free} />
                                        </td>
                                        <td className="px-5 py-4 text-center border-b border-gray-100 dark:border-gray-800/50 bg-primary-50/20 dark:bg-primary-900/5">
                                            <CellValue val={f.pro} accent="text-primary-600 dark:text-primary-400" />
                                        </td>
                                        <td className="px-5 py-4 text-center border-b border-gray-100 dark:border-gray-800/50 bg-purple-50/30 dark:bg-purple-900/10">
                                            <CellValue val={f.max} accent="text-purple-600 dark:text-purple-400" />
                                        </td>
                                        <td className="px-5 py-4 text-center border-b border-gray-100 dark:border-gray-800/50">
                                            <CellValue val={f.enterprise} accent="text-amber-600 dark:text-amber-400" />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500 font-medium">
                    ✨ All manual content creation (writing, editing, publishing) is always free and unlimited.
                </div>
            </motion.div>
        </div>
    );
};
