import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Check, X, Terminal, Zap } from 'lucide-react';
import { navigate } from '../../utils/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { FREE_PLAN_CREDIT_LIMIT } from '../../config/creditCosts';
import { SUBSCRIPTION_CATALOG } from '../../config/subscriptionCatalog';

interface PricingComparisonProps {
    onCloudUpgrade?: (priceId: string) => void;
    isLoading?: boolean;
}

export const PricingComparison: React.FC<PricingComparisonProps> = ({ onCloudUpgrade, isLoading }) => {
    const { currentUser } = useAuth();
    const proPlan = SUBSCRIPTION_CATALOG.pro;
    const maxPlan = SUBSCRIPTION_CATALOG.max;
    const enterprisePlan = SUBSCRIPTION_CATALOG.enterprise;
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
    const isYearly = billingInterval === 'yearly';
    const proDisplayPrice = isYearly ? proPlan.annualMonthlyEquivalent : proPlan.monthlyPrice;
    const maxDisplayPrice = isYearly ? maxPlan.annualMonthlyEquivalent : maxPlan.monthlyPrice;
    const proBillingCopy = isYearly ? `Billed yearly as $${proPlan.annualPrice}/year` : 'Cancel or change anytime';
    const maxBillingCopy = isYearly ? `Billed yearly as $${maxPlan.annualPrice}/year` : 'Cancel or change anytime';
    const proPriceId = isYearly ? proPlan.annualPriceId : proPlan.monthlyPriceId;

    const handleUpgradeClick = () => {
        if (currentUser) {
            navigate('/subscription');
        } else {
            navigate('/signup?redirect=/subscription');
        }
    };

    const handleProClick = () => {
        if (onCloudUpgrade) {
            onCloudUpgrade(proPriceId);
            return;
        }

        handleUpgradeClick();
    };

    const handleContactSales = () => {
        window.location.href = 'mailto:partners@careervivid.app?subject=CareerVivid%20Enterprise';
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
        if (typeof val === 'string') return <span className={`text-xs font-medium ${accent}`}>{val}</span>;
        if (val) return <Check className="mx-auto text-green-500" strokeWidth={3} size={18} />;
        return <X className="mx-auto text-gray-300 dark:text-gray-600" size={18} />;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight leading-tight">
                    Choose your plan
                </h2>
                <div className="mt-6 inline-flex rounded-full bg-[#e9e1d6] dark:bg-gray-800 p-1 shadow-inner">
                    <button
                        type="button"
                        aria-pressed={billingInterval === 'monthly'}
                        onClick={() => setBillingInterval('monthly')}
                        className={`min-w-[112px] rounded-full px-6 py-2 text-xs font-semibold transition-all ${
                            billingInterval === 'monthly'
                                ? 'bg-white dark:bg-gray-950 text-[#211b16] dark:text-white shadow-sm'
                                : 'text-[#766955] dark:text-gray-400 hover:text-[#211b16] dark:hover:text-white'
                        }`}
                    >
                        Monthly
                    </button>
                    <button
                        type="button"
                        aria-pressed={billingInterval === 'yearly'}
                        onClick={() => setBillingInterval('yearly')}
                        className={`min-w-[112px] rounded-full px-6 py-2 text-xs font-semibold transition-all ${
                            billingInterval === 'yearly'
                                ? 'bg-white dark:bg-gray-950 text-[#211b16] dark:text-white shadow-sm'
                                : 'text-[#766955] dark:text-gray-400 hover:text-[#211b16] dark:hover:text-white'
                        }`}
                    >
                        Yearly
                    </button>
                </div>
            </div>

            {/* 4-Tier Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-50px' }}
                className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 xl:gap-6 mb-20"
            >
                {/* Free */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-900 border border-[#eadfce] dark:border-gray-800 rounded-[1.6rem] p-8 shadow-sm flex flex-col group hover:shadow-md transition-shadow"
                >
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Free</h3>
                        <p className="text-sm text-gray-500 font-medium">Try CareerVivid today.</p>
                    </div>
                    <div className="mb-8">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">$</span>
                            <span className="text-5xl font-bold text-gray-900 dark:text-white">0</span>
                            <span className="text-gray-500 text-xs font-semibold tracking-normal">USD / month</span>
                        </div>
                        <div className="text-xs text-emerald-700 font-semibold tracking-wider mt-3 uppercase bg-emerald-50 dark:bg-emerald-900/20 inline-flex items-center gap-1.5 px-3 py-1 rounded-full">
                            <Zap size={12} /> {FREE_PLAN_CREDIT_LIMIT} AI credits / mo
                        </div>
                    </div>
                    <ul className="space-y-3.5 mb-8 flex-grow text-sm font-medium text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-3"><Terminal className="text-emerald-600 flex-shrink-0 mt-0.5" size={17} /><span>Core AI career workspace</span></li>
                        <li className="flex items-start gap-3"><Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} /><span>Job search &amp; tracker</span></li>
                        <li className="flex items-start gap-3"><Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} /><span>Gemini models included</span></li>
                        <li className="flex items-start gap-3"><Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} /><span>CLI Publish is free</span></li>
                    </ul>
                    <button
                        onClick={() => navigate('/signup')}
                        className="w-full py-4 rounded-full font-semibold border border-[#eadfce] dark:border-gray-800 text-gray-900 dark:text-white hover:border-[#d5c4aa] dark:hover:border-gray-700 hover:bg-[#fffaf1] dark:hover:bg-gray-800/50 transition-all"
                    >
                        Get Started Free
                    </button>
                </motion.div>

                {/* Pro */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-900 border border-[#eadfce] dark:border-gray-800 rounded-[1.6rem] p-8 shadow-sm flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow"
                >
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Pro</h3>
                        <p className="text-sm text-gray-500 font-medium">For active job seekers.</p>
                    </div>
                    <div className="mb-8">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">$</span>
                            <span className="text-5xl font-bold text-gray-900 dark:text-white">{proDisplayPrice}</span>
                            <span className="text-gray-500 text-xs font-semibold tracking-normal">USD / month</span>
                        </div>
                        <div className="text-xs text-[#625bd5] font-semibold tracking-wider mt-3 uppercase bg-[#f3f2ff] dark:bg-[#28264f] inline-flex items-center gap-1.5 px-3 py-1 rounded-full">
                            <Zap size={12} /> {proPlan.creditLimit.toLocaleString()} AI credits / mo
                        </div>
                        <p className="text-xs text-gray-500 mt-3 font-medium">{proBillingCopy}</p>
                    </div>
                    <ul className="space-y-3.5 mb-8 flex-grow text-sm font-medium text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-3"><Check className="text-[#625bd5] flex-shrink-0 mt-0.5" size={18} /><span>Everything in Free</span></li>
                        <li className="flex items-start gap-3"><Check className="text-[#625bd5] flex-shrink-0 mt-0.5" size={18} /><span>Gemini Pro model access</span></li>
                        <li className="flex items-start gap-3"><Check className="text-[#625bd5] flex-shrink-0 mt-0.5" size={18} /><span>Resume tailoring and job prep</span></li>
                        <li className="flex items-start gap-3"><Check className="text-[#625bd5] flex-shrink-0 mt-0.5" size={18} /><span>Living Documentation Sync</span></li>
                    </ul>
                    <button
                        onClick={handleProClick}
                        disabled={!!isLoading}
                        className="w-full py-4 rounded-full font-semibold border border-[#eadfce] dark:border-gray-800 text-gray-900 dark:text-white hover:border-[#d5c4aa] dark:hover:border-gray-700 hover:bg-[#fffaf1] dark:hover:bg-gray-800/50 transition-all disabled:opacity-60"
                    >
                        Start Pro
                    </button>
                </motion.div>

                {/* Max */}
                <motion.div
                    variants={itemVariants}
                    className="bg-[#fffaf1] dark:bg-gray-900 border border-[#e4c89f] dark:border-amber-800/40 rounded-[1.6rem] p-8 shadow-sm flex flex-col relative overflow-hidden group"
                >
                    <div className="absolute right-7 top-7 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#a97935]">Power</div>
                    <div className="mb-6 relative z-10">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Max</h3>
                        <p className="text-sm text-gray-500 font-medium">For heavy AI and job-search usage.</p>
                    </div>
                    <div className="mb-8 relative z-10">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">$</span>
                            <span className="text-5xl font-bold text-gray-900 dark:text-white">{maxDisplayPrice}</span>
                            <span className="text-gray-500 text-xs font-semibold tracking-normal">USD / month</span>
                        </div>
                        <div className="text-xs text-[#a97935] font-semibold tracking-wider mt-3 uppercase bg-amber-100/80 dark:bg-amber-900/20 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/50">
                            <Zap size={12} /> {maxPlan.creditLimit.toLocaleString()} AI credits / mo
                        </div>
                        <p className="text-xs text-gray-500 mt-3 font-medium">{maxBillingCopy}</p>
                    </div>
                    <ul className="space-y-3.5 mb-8 flex-grow text-sm font-medium text-gray-600 dark:text-gray-400 relative z-10">
                        <li className="flex items-start gap-3"><Check className="text-[#a97935] flex-shrink-0 mt-0.5" size={18} /><span>Everything in Pro</span></li>
                        <li className="flex items-start gap-3"><Check className="text-[#a97935] flex-shrink-0 mt-0.5" size={18} /><span>Private posts and advanced ReactFlow</span></li>
                        <li className="flex items-start gap-3"><Check className="text-[#a97935] flex-shrink-0 mt-0.5" size={18} /><span>4.5x more AI credits than Pro</span></li>
                        <li className="flex items-start gap-3"><Check className="text-[#a97935] flex-shrink-0 mt-0.5" size={18} /><span>Priority model access</span></li>
                    </ul>
                    <button
                        onClick={handleUpgradeClick}
                        className="w-full py-4 rounded-full font-semibold bg-[#09090b] text-white hover:bg-black transition-colors shadow-lg relative z-10"
                    >
                        Get Max
                    </button>
                </motion.div>

                {/* Enterprise */}
                <motion.div
                    variants={itemVariants}
                    className="bg-[#211b16] dark:bg-black text-white rounded-[1.6rem] p-8 shadow-sm flex flex-col relative overflow-hidden border border-[#211b16]"
                >
                    <div className="mb-6 relative z-10">
                        <h3 className="text-xl font-semibold mb-1">Enterprise</h3>
                        <p className="text-sm text-gray-300 font-medium">For teams and organizations.</p>
                    </div>
                    <div className="mb-8 relative z-10">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold">$</span>
                            <span className="text-5xl font-bold">{enterprisePlan.monthlyPrice}</span>
                            <span className="text-gray-300 text-xs font-semibold tracking-normal">USD / seat / month</span>
                        </div>
                        <div className="text-xs text-amber-400 font-semibold tracking-wider mt-3 uppercase bg-amber-400/10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-400/20">
                            <Zap size={12} /> {enterprisePlan.creditLimit.toLocaleString()} pooled credits/seat
                        </div>
                        <p className="text-xs text-gray-300 mt-3 font-medium">{enterprisePlan.minimumSeats}-seat minimum, credits pool across all seats</p>
                    </div>
                    <ul className="space-y-3.5 mb-8 flex-grow text-sm font-medium text-gray-300 relative z-10">
                        <li className="flex items-start gap-3"><Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} /><span>Private Team Workspaces</span></li>
                        <li className="flex items-start gap-3"><Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} /><span>SSO &amp; SCIM provisioning</span></li>
                        <li className="flex items-start gap-3"><Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} /><span>Team RBAC &amp; audit logs</span></li>
                        <li className="flex items-start gap-3"><Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} /><span>Pooled credits across org</span></li>
                    </ul>
                    <button
                        onClick={handleContactSales}
                        className="w-full py-4 rounded-full font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors relative z-10"
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
                            <tr className="bg-gray-50 dark:bg-gray-800/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                <th className="p-5 border-b border-gray-200 dark:border-gray-800">Capabilities</th>
                                <th className="p-5 border-b border-gray-200 dark:border-gray-800 text-center w-36">Free</th>
                                <th className="p-5 border-b border-gray-200 dark:border-gray-800 text-center w-36 text-[#625bd5] dark:text-[#a9a5ff]">Pro</th>
                                <th className="p-5 border-b border-gray-200 dark:border-gray-800 text-center w-36 text-[#a97935] dark:text-[#f0c987]">Max</th>
                                <th className="p-5 border-b border-gray-200 dark:border-gray-800 text-center w-36">Enterprise</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {features.map((f, i) => {
                                // Category header row
                                if (f.category) {
                                    return (
                                        <tr key={i} className="bg-gray-50/80 dark:bg-gray-800/60">
                                            <td colSpan={5} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                {f.category}
                                            </td>
                                        </tr>
                                    );
                                }
                                return (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                                        <td className="px-5 py-4 font-medium text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800/50 group-hover:text-[#8a5a1f] dark:group-hover:text-[#f0c987] transition-colors">
                                            {f.name}
                                        </td>
                                        <td className="px-5 py-4 text-center border-b border-gray-100 dark:border-gray-800/50">
                                            <CellValue val={f.free} />
                                        </td>
                                        <td className="px-5 py-4 text-center border-b border-gray-100 dark:border-gray-800/50 bg-[#f3f2ff]/50 dark:bg-[#28264f]/25">
                                            <CellValue val={f.pro} accent="text-[#625bd5] dark:text-[#a9a5ff]" />
                                        </td>
                                        <td className="px-5 py-4 text-center border-b border-gray-100 dark:border-gray-800/50 bg-amber-50/40 dark:bg-amber-900/10">
                                            <CellValue val={f.max} accent="text-[#a97935] dark:text-[#f0c987]" />
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
