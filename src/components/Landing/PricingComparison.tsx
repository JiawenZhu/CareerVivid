import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Check, X, Terminal, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { navigate } from '../../utils/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { FREE_PLAN_CREDIT_LIMIT } from '../../config/creditCosts';
import { SUBSCRIPTION_CATALOG } from '../../config/subscriptionCatalog';

interface PricingComparisonProps {
    onCloudUpgrade?: (priceId: string) => void;
    isLoading?: boolean;
}

export const PricingComparison: React.FC<PricingComparisonProps> = ({ onCloudUpgrade, isLoading }) => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const proPlan = SUBSCRIPTION_CATALOG.pro;
    const maxPlan = SUBSCRIPTION_CATALOG.max;
    const enterprisePlan = SUBSCRIPTION_CATALOG.enterprise;
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
    const isYearly = billingInterval === 'yearly';
    const proDisplayPrice = isYearly ? proPlan.annualMonthlyEquivalent : proPlan.monthlyPrice;
    const maxDisplayPrice = isYearly ? maxPlan.annualMonthlyEquivalent : maxPlan.monthlyPrice;
    const proBillingCopy = isYearly ? t('pricing_comparison.billing.yearly', { price: proPlan.annualPrice }) : t('pricing_comparison.billing.cancel_anytime');
    const maxBillingCopy = isYearly ? t('pricing_comparison.billing.yearly', { price: maxPlan.annualPrice }) : t('pricing_comparison.billing.cancel_anytime');
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
        { category: t('pricing_comparison.features.categories.cli_agent'), name: '', free: '', pro: '', max: '', enterprise: '' },
        { name: t('pricing_comparison.features.cli.flash_lite'), free: true, pro: true, max: true, enterprise: true },
        { name: t('pricing_comparison.features.cli.flash'), free: true, pro: true, max: true, enterprise: true },
        { name: t('pricing_comparison.features.cli.pro'), free: false, pro: true, max: true, enterprise: true },
        { name: t('pricing_comparison.features.cli.jobs'), free: true, pro: true, max: true, enterprise: true },
        { name: t('pricing_comparison.features.cli.resume'), free: true, pro: true, max: true, enterprise: true },
        { name: t('pricing_comparison.features.cli.byo_key'), free: true, pro: true, max: true, enterprise: true },
        // Job & Resume AI
        { category: t('pricing_comparison.features.categories.job_resume'), name: '', free: '', pro: '', max: '', enterprise: '' },
        { name: t('pricing_comparison.features.job_resume.tailor'), free: t('pricing_comparison.values.credits', { count: 5 }), pro: t('pricing_comparison.values.credits', { count: 5 }), max: t('pricing_comparison.values.credits', { count: 5 }), enterprise: t('pricing_comparison.values.credits', { count: 5 }) },
        { name: t('pricing_comparison.features.job_resume.scoring'), free: t('pricing_comparison.values.credit', { count: 1 }), pro: t('pricing_comparison.values.credit', { count: 1 }), max: t('pricing_comparison.values.credit', { count: 1 }), enterprise: t('pricing_comparison.values.credit', { count: 1 }) },
        { name: t('pricing_comparison.features.job_resume.notes'), free: t('pricing_comparison.values.credits', { count: 10 }), pro: t('pricing_comparison.values.credits', { count: 10 }), max: t('pricing_comparison.values.credits', { count: 10 }), enterprise: t('pricing_comparison.values.credits', { count: 10 }) },
        // Developer Tools
        { category: t('pricing_comparison.features.categories.developer_tools'), name: '', free: '', pro: '', max: '', enterprise: '' },
        { name: t('pricing_comparison.features.developer.publish'), free: t('pricing_comparison.values.free'), pro: t('pricing_comparison.values.free'), max: t('pricing_comparison.values.free'), enterprise: t('pricing_comparison.values.free') },
        { name: t('pricing_comparison.features.developer.reactflow'), free: t('pricing_comparison.values.credits', { count: 5 }), pro: t('pricing_comparison.values.credits', { count: 5 }), max: t('pricing_comparison.values.credits', { count: 5 }), enterprise: t('pricing_comparison.values.credits', { count: 5 }) },
        { name: t('pricing_comparison.features.developer.architecture'), free: t('pricing_comparison.values.credits', { count: 10 }), pro: t('pricing_comparison.values.credits', { count: 10 }), max: t('pricing_comparison.values.credits', { count: 10 }), enterprise: t('pricing_comparison.values.credits', { count: 10 }) },
        { name: t('pricing_comparison.features.developer.documentation'), free: false, pro: true, max: true, enterprise: true },
        // Interviews & Portfolio
        { category: t('pricing_comparison.features.categories.interviews_portfolio'), name: '', free: '', pro: '', max: '', enterprise: '' },
        { name: t('pricing_comparison.features.interviews.voice'), free: t('pricing_comparison.values.credits', { count: 15 }), pro: t('pricing_comparison.values.credits', { count: 15 }), max: t('pricing_comparison.values.credits', { count: 15 }), enterprise: t('pricing_comparison.values.credits', { count: 15 }) },
        { name: t('pricing_comparison.features.interviews.portfolio'), free: t('pricing_comparison.values.credits', { count: 5 }), pro: t('pricing_comparison.values.credits', { count: 5 }), max: t('pricing_comparison.values.credits', { count: 5 }), enterprise: t('pricing_comparison.values.credits', { count: 5 }) },
        // Team
        { category: t('pricing_comparison.features.categories.team'), name: '', free: '', pro: '', max: '', enterprise: '' },
        { name: t('pricing_comparison.features.team.workspaces'), free: false, pro: false, max: false, enterprise: true },
        { name: t('pricing_comparison.features.team.rbac_sso'), free: false, pro: false, max: false, enterprise: true },
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
                    {t('pricing_comparison.title')}
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
                        {t('pricing_comparison.billing.monthly')}
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
                        {t('pricing_comparison.billing.yearly_toggle')}
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
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{t('pricing_comparison.plans.free.name')}</h3>
                        <p className="text-sm text-gray-500 font-medium">{t('pricing_comparison.plans.free.subtitle')}</p>
                    </div>
                    <div className="mb-8">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">$</span>
                            <span className="text-5xl font-bold text-gray-900 dark:text-white">0</span>
                            <span className="text-gray-500 text-xs font-semibold tracking-normal">{t('pricing_comparison.billing.usd_month')}</span>
                        </div>
                        <div className="text-xs text-emerald-700 font-semibold tracking-wider mt-3 uppercase bg-emerald-50 dark:bg-emerald-900/20 inline-flex items-center gap-1.5 px-3 py-1 rounded-full">
                            <Zap size={12} /> {t('pricing_comparison.credits.ai_month', { count: FREE_PLAN_CREDIT_LIMIT })}
                        </div>
                    </div>
                    <ul className="space-y-3.5 mb-8 flex-grow text-sm font-medium text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-3"><Terminal className="text-emerald-600 flex-shrink-0 mt-0.5" size={17} /><span>{t('pricing_comparison.plans.free.feature_1')}</span></li>
                        <li className="flex items-start gap-3"><Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} /><span>{t('pricing_comparison.plans.free.feature_2')}</span></li>
                        <li className="flex items-start gap-3"><Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} /><span>{t('pricing_comparison.plans.free.feature_3')}</span></li>
                        <li className="flex items-start gap-3"><Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} /><span>{t('pricing_comparison.plans.free.feature_4')}</span></li>
                    </ul>
                    <button
                        onClick={() => navigate('/signup')}
                        className="w-full py-4 rounded-full font-semibold border border-[#eadfce] dark:border-gray-800 text-gray-900 dark:text-white hover:border-[#d5c4aa] dark:hover:border-gray-700 hover:bg-[#fffaf1] dark:hover:bg-gray-800/50 transition-all"
                    >
                        {t('pricing_comparison.plans.free.cta')}
                    </button>
                </motion.div>

                {/* Pro */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-900 border border-[#eadfce] dark:border-gray-800 rounded-[1.6rem] p-8 shadow-sm flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow"
                >
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{t('pricing_comparison.plans.pro.name')}</h3>
                        <p className="text-sm text-gray-500 font-medium">{t('pricing_comparison.plans.pro.subtitle')}</p>
                    </div>
                    <div className="mb-8">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">$</span>
                            <span className="text-5xl font-bold text-gray-900 dark:text-white">{proDisplayPrice}</span>
                            <span className="text-gray-500 text-xs font-semibold tracking-normal">{t('pricing_comparison.billing.usd_month')}</span>
                        </div>
                        <div className="text-xs text-[#625bd5] font-semibold tracking-wider mt-3 uppercase bg-[#f3f2ff] dark:bg-[#28264f] inline-flex items-center gap-1.5 px-3 py-1 rounded-full">
                            <Zap size={12} /> {t('pricing_comparison.credits.ai_month', { count: proPlan.creditLimit.toLocaleString() })}
                        </div>
                        <p className="text-xs text-gray-500 mt-3 font-medium">{proBillingCopy}</p>
                    </div>
                    <ul className="space-y-3.5 mb-8 flex-grow text-sm font-medium text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-3"><Check className="text-[#625bd5] flex-shrink-0 mt-0.5" size={18} /><span>{t('pricing_comparison.plans.pro.feature_1')}</span></li>
                        <li className="flex items-start gap-3"><Check className="text-[#625bd5] flex-shrink-0 mt-0.5" size={18} /><span>{t('pricing_comparison.plans.pro.feature_2')}</span></li>
                        <li className="flex items-start gap-3"><Check className="text-[#625bd5] flex-shrink-0 mt-0.5" size={18} /><span>{t('pricing_comparison.plans.pro.feature_3')}</span></li>
                        <li className="flex items-start gap-3"><Check className="text-[#625bd5] flex-shrink-0 mt-0.5" size={18} /><span>{t('pricing_comparison.plans.pro.feature_4')}</span></li>
                    </ul>
                    <button
                        onClick={handleProClick}
                        disabled={!!isLoading}
                        className="w-full py-4 rounded-full font-semibold border border-[#eadfce] dark:border-gray-800 text-gray-900 dark:text-white hover:border-[#d5c4aa] dark:hover:border-gray-700 hover:bg-[#fffaf1] dark:hover:bg-gray-800/50 transition-all disabled:opacity-60"
                    >
                        {t('pricing_comparison.plans.pro.cta')}
                    </button>
                </motion.div>

                {/* Max */}
                <motion.div
                    variants={itemVariants}
                    className="bg-[#fffaf1] dark:bg-gray-900 border border-[#e4c89f] dark:border-amber-800/40 rounded-[1.6rem] p-8 shadow-sm flex flex-col relative overflow-hidden group"
                >
                    <div className="absolute right-7 top-7 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#a97935]">{t('pricing_comparison.plans.max.badge')}</div>
                    <div className="mb-6 relative z-10">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{t('pricing_comparison.plans.max.name')}</h3>
                        <p className="text-sm text-gray-500 font-medium">{t('pricing_comparison.plans.max.subtitle')}</p>
                    </div>
                    <div className="mb-8 relative z-10">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">$</span>
                            <span className="text-5xl font-bold text-gray-900 dark:text-white">{maxDisplayPrice}</span>
                            <span className="text-gray-500 text-xs font-semibold tracking-normal">{t('pricing_comparison.billing.usd_month')}</span>
                        </div>
                        <div className="text-xs text-[#a97935] font-semibold tracking-wider mt-3 uppercase bg-amber-100/80 dark:bg-amber-900/20 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/50">
                            <Zap size={12} /> {t('pricing_comparison.credits.ai_month', { count: maxPlan.creditLimit.toLocaleString() })}
                        </div>
                        <p className="text-xs text-gray-500 mt-3 font-medium">{maxBillingCopy}</p>
                    </div>
                    <ul className="space-y-3.5 mb-8 flex-grow text-sm font-medium text-gray-600 dark:text-gray-400 relative z-10">
                        <li className="flex items-start gap-3"><Check className="text-[#a97935] flex-shrink-0 mt-0.5" size={18} /><span>{t('pricing_comparison.plans.max.feature_1')}</span></li>
                        <li className="flex items-start gap-3"><Check className="text-[#a97935] flex-shrink-0 mt-0.5" size={18} /><span>{t('pricing_comparison.plans.max.feature_2')}</span></li>
                        <li className="flex items-start gap-3"><Check className="text-[#a97935] flex-shrink-0 mt-0.5" size={18} /><span>{t('pricing_comparison.plans.max.feature_3')}</span></li>
                        <li className="flex items-start gap-3"><Check className="text-[#a97935] flex-shrink-0 mt-0.5" size={18} /><span>{t('pricing_comparison.plans.max.feature_4')}</span></li>
                    </ul>
                    <button
                        onClick={handleUpgradeClick}
                        className="w-full py-4 rounded-full font-semibold bg-[#09090b] text-white hover:bg-black transition-colors shadow-lg relative z-10"
                    >
                        {t('pricing_comparison.plans.max.cta')}
                    </button>
                </motion.div>

                {/* Enterprise */}
                <motion.div
                    variants={itemVariants}
                    className="bg-[#211b16] dark:bg-black text-white rounded-[1.6rem] p-8 shadow-sm flex flex-col relative overflow-hidden border border-[#211b16]"
                >
                    <div className="mb-6 relative z-10">
                        <h3 className="text-xl font-semibold mb-1">{t('pricing_comparison.plans.enterprise.name')}</h3>
                        <p className="text-sm text-gray-300 font-medium">{t('pricing_comparison.plans.enterprise.subtitle')}</p>
                    </div>
                    <div className="mb-8 relative z-10">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold">$</span>
                            <span className="text-5xl font-bold">{enterprisePlan.monthlyPrice}</span>
                            <span className="text-gray-300 text-xs font-semibold tracking-normal">{t('pricing_comparison.billing.usd_seat_month')}</span>
                        </div>
                        <div className="text-xs text-amber-400 font-semibold tracking-wider mt-3 uppercase bg-amber-400/10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-400/20">
                            <Zap size={12} /> {t('pricing_comparison.credits.pooled_per_seat', { count: enterprisePlan.creditLimit.toLocaleString() })}
                        </div>
                        <p className="text-xs text-gray-300 mt-3 font-medium">{t('pricing_comparison.billing.enterprise_minimum', { seats: enterprisePlan.minimumSeats })}</p>
                    </div>
                    <ul className="space-y-3.5 mb-8 flex-grow text-sm font-medium text-gray-300 relative z-10">
                        <li className="flex items-start gap-3"><Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} /><span>{t('pricing_comparison.plans.enterprise.feature_1')}</span></li>
                        <li className="flex items-start gap-3"><Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} /><span>{t('pricing_comparison.plans.enterprise.feature_2')}</span></li>
                        <li className="flex items-start gap-3"><Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} /><span>{t('pricing_comparison.plans.enterprise.feature_3')}</span></li>
                        <li className="flex items-start gap-3"><Check className="text-amber-400 flex-shrink-0 mt-0.5" size={18} /><span>{t('pricing_comparison.plans.enterprise.feature_4')}</span></li>
                    </ul>
                    <button
                        onClick={handleContactSales}
                        className="w-full py-4 rounded-full font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors relative z-10"
                    >
                        {t('pricing_comparison.plans.enterprise.cta')}
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
                                <th className="p-5 border-b border-gray-200 dark:border-gray-800">{t('pricing_comparison.table.capabilities')}</th>
                                <th className="p-5 border-b border-gray-200 dark:border-gray-800 text-center w-36">{t('pricing_comparison.plans.free.name')}</th>
                                <th className="p-5 border-b border-gray-200 dark:border-gray-800 text-center w-36 text-[#625bd5] dark:text-[#a9a5ff]">{t('pricing_comparison.plans.pro.name')}</th>
                                <th className="p-5 border-b border-gray-200 dark:border-gray-800 text-center w-36 text-[#a97935] dark:text-[#f0c987]">{t('pricing_comparison.plans.max.name')}</th>
                                <th className="p-5 border-b border-gray-200 dark:border-gray-800 text-center w-36">{t('pricing_comparison.plans.enterprise.name')}</th>
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
                    {t('pricing_comparison.table.manual_free')}
                </div>
            </motion.div>
        </div>
    );
};
