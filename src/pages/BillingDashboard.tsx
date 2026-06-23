import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, CreditCard, Database, Plus, Shield, Sparkles, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../firebase';
import AIUsageProgressBar from '../components/AIUsageProgressBar';
import { trackUsage } from '../services/trackingService';
import {
    SUBSCRIPTION_CATALOG,
    formatCredits,
    getPlanCreditLimit,
    getPlanDisplayName,
    isLegacyPlan,
    normalizePlanId,
    type NormalizedPlanId,
    type StandardPlanId,
} from '../config/subscriptionCatalog';
import { navigate } from '../utils/navigation';

const LEGACY_PRICE_IDS = new Set([
    'price_1ScLOaRJNflGxv32BwQnSBs0',
    'price_1TJoONRJNflGxv32zSqxC9bZ',
    'price_1TJoONRJNflGxv32wxPHw9FR',
    'price_1TJoQyRJNflGxv32FQ9TxIjq',
]);

type BillingInterval = 'monthly' | 'yearly';

type PlanTone = {
    iconBg: string;
    iconText: string;
    card: string;
    chip: string;
    button: string;
};

type BillingPlanCard = {
    id: NormalizedPlanId;
    name: string;
    price: string;
    period: string;
    limit: number;
    priceId: string | null;
    description: string;
    billingCopy: string;
    features: string[];
};

const planTone: Record<NormalizedPlanId, PlanTone> = {
    free: {
        iconBg: 'bg-[#f8f8fb] dark:bg-[#262522]',
        iconText: 'text-[#64748b] dark:text-[#aaa39a]',
        card: 'border-[#e4d3bc] bg-white dark:border-[#3a332a] dark:bg-[#1c1a18]',
        chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300',
        button: 'border border-[#d8c8b2] bg-white text-[#211b16] hover:bg-[#fffaf1] dark:border-[#3a332a] dark:bg-[#24221f] dark:text-[#f4f1e9]',
    },
    pro: {
        iconBg: 'bg-[#f3f2ff] dark:bg-[#28264f]',
        iconText: 'text-[#625bd5] dark:text-[#a9a5ff]',
        card: 'border-[#d8d5ff] bg-[#fbfaff] dark:border-[#39346e] dark:bg-[#19182d]',
        chip: 'bg-[#f3f2ff] text-[#625bd5] dark:bg-[#28264f] dark:text-[#a9a5ff]',
        button: 'bg-[#625bd5] text-white hover:bg-[#514ac2]',
    },
    max: {
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconText: 'text-[#a97935] dark:text-[#f0c987]',
        card: 'border-[#e4c89f] bg-[#fffaf1] dark:border-amber-800/50 dark:bg-[#211d17]',
        chip: 'bg-amber-100 text-[#8a5a1f] dark:bg-amber-900/30 dark:text-[#f0c987]',
        button: 'bg-[#211b16] text-white hover:bg-black dark:bg-white dark:text-[#211b16] dark:hover:bg-[#fff7eb]',
    },
    enterprise: {
        iconBg: 'bg-[#211b16] dark:bg-black',
        iconText: 'text-amber-300',
        card: 'border-[#211b16] bg-[#211b16] text-white dark:border-black dark:bg-black',
        chip: 'bg-amber-300/15 text-amber-300 border border-amber-300/20',
        button: 'bg-white text-[#211b16] hover:bg-[#fff7eb]',
    },
};

const BillingDashboard: React.FC = () => {
    const { currentUser, userProfile, isPremium, aiUsage } = useAuth();
    const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
    const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [newTeamMember, setNewTeamMember] = useState('');

    const rawPlan = userProfile?.plan || 'free';
    const normalizedPlan = normalizePlanId(rawPlan);
    const seats = Math.max(
        SUBSCRIPTION_CATALOG.enterprise.minimumSeats,
        Number((userProfile as any)?.seats || SUBSCRIPTION_CATALOG.enterprise.minimumSeats)
    );
    const activePlanName = getPlanDisplayName(rawPlan);
    const activeCreditLimit = aiUsage?.limit ?? getPlanCreditLimit(rawPlan, seats);
    const stripePriceId = (userProfile as any)?.stripePriceId || (userProfile as any)?.subscriptionPriceId;
    const hasLegacyBilling = isLegacyPlan(rawPlan) || LEGACY_PRICE_IDS.has(stripePriceId);
    const enterpriseStarterCredits = SUBSCRIPTION_CATALOG.enterprise.creditLimit * SUBSCRIPTION_CATALOG.enterprise.minimumSeats;
    const isYearly = billingInterval === 'yearly';

    const plans = useMemo<BillingPlanCard[]>(() => ([
        {
            id: 'free',
            name: 'Free',
            price: '$0',
            period: '/month',
            limit: getPlanCreditLimit('free'),
            priceId: null,
            description: 'Try CareerVivid today.',
            billingCopy: 'No credit card required',
            features: ['100 monthly credits', 'Core AI career workspace', 'Job search and tracker', 'CLI Publish is free'],
        },
        {
            id: 'pro',
            name: SUBSCRIPTION_CATALOG.pro.name,
            price: `$${isYearly ? SUBSCRIPTION_CATALOG.pro.annualMonthlyEquivalent : SUBSCRIPTION_CATALOG.pro.monthlyPrice}`,
            period: '/mo',
            limit: SUBSCRIPTION_CATALOG.pro.creditLimit,
            priceId: isYearly ? SUBSCRIPTION_CATALOG.pro.annualPriceId : SUBSCRIPTION_CATALOG.pro.monthlyPriceId,
            description: 'For active job seekers.',
            billingCopy: isYearly ? `Billed yearly as $${SUBSCRIPTION_CATALOG.pro.annualPrice}/year` : 'Cancel or change anytime',
            features: ['1,000 monthly credits', 'Gemini Pro model access', 'Resume tailoring and job prep', 'Living Documentation Sync'],
        },
        {
            id: 'max',
            name: SUBSCRIPTION_CATALOG.max.name,
            price: `$${isYearly ? SUBSCRIPTION_CATALOG.max.annualMonthlyEquivalent : SUBSCRIPTION_CATALOG.max.monthlyPrice}`,
            period: '/mo',
            limit: SUBSCRIPTION_CATALOG.max.creditLimit,
            priceId: isYearly ? SUBSCRIPTION_CATALOG.max.annualPriceId : SUBSCRIPTION_CATALOG.max.monthlyPriceId,
            description: 'For heavy AI and job-search usage.',
            billingCopy: isYearly ? `Billed yearly as $${SUBSCRIPTION_CATALOG.max.annualPrice}/year` : 'Cancel or change anytime',
            features: ['4,500 monthly credits', 'Everything in Pro', '4.5x more credits than Pro', 'Priority model access'],
        },
        {
            id: 'enterprise',
            name: SUBSCRIPTION_CATALOG.enterprise.name,
            price: `$${SUBSCRIPTION_CATALOG.enterprise.monthlyPrice}`,
            period: '/seat/mo',
            limit: SUBSCRIPTION_CATALOG.enterprise.creditLimit,
            priceId: SUBSCRIPTION_CATALOG.enterprise.monthlyPriceId,
            description: 'For teams and organizations.',
            billingCopy: `${SUBSCRIPTION_CATALOG.enterprise.minimumSeats}-seat minimum, credits pool across all seats`,
            features: ['1,500 pooled credits per seat', 'Private Team Workspaces', 'SSO, RBAC, and audit controls', 'Pooled credits across org'],
        },
    ]), [isYearly]);

    const planSubtitle = (() => {
        if (normalizedPlan === 'free') return 'Free workspace';
        if (normalizedPlan === 'enterprise') return `${seats} seats, pooled team subscription`;
        if (hasLegacyBilling) return 'Legacy billing, current credit rules';
        return isYearly ? 'Yearly subscription' : 'Monthly subscription';
    })();

    const handleUpgrade = async (planId: StandardPlanId, priceId: string) => {
        if (!currentUser) return;

        setLoadingPriceId(priceId);
        setError('');

        try {
            await trackUsage(currentUser.uid, 'checkout_session_start', { priceId, planId, billingInterval });

            const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
            const result: any = await createCheckoutSession({
                priceId,
                quantity: planId === 'enterprise' ? SUBSCRIPTION_CATALOG.enterprise.minimumSeats : 1,
                successUrl: `${window.location.origin}/#/subscription?success=true`,
                cancelUrl: `${window.location.origin}/#/subscription`,
            });

            if (result.data.url) {
                window.location.href = result.data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (err) {
            console.error('Checkout failed:', err);
            setError('Checkout failed. Please try again.');
            setLoadingPriceId(null);
        }
    };

    const handlePlanAction = (plan: BillingPlanCard) => {
        if (plan.id === 'free' || !plan.priceId) return;
        handleUpgrade(plan.id, plan.priceId);
    };

    return (
        <div className="min-h-screen bg-[#f7f1e7] text-[#211b16] dark:bg-[#11100f] dark:text-[#f4f1e9]">
            <header className="sticky top-0 z-20 border-b border-[#e7dccb] bg-[#fffaf1]/90 backdrop-blur dark:border-[#2d2a25] dark:bg-[#171615]/90">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#665a4a] transition hover:bg-white hover:text-[#211b16] dark:text-[#aaa39a] dark:hover:bg-[#24221f] dark:hover:text-[#f4f1e9]"
                    >
                        <ArrowLeft size={16} />
                        Dashboard
                    </button>
                    <div className="flex items-center gap-2 rounded-full border border-[#e4d3bc] bg-white px-3 py-1.5 text-xs font-bold text-[#625bd5] shadow-sm dark:border-[#39346e] dark:bg-[#1c1a18] dark:text-[#a9a5ff]">
                        <span className="h-2 w-2 rounded-full bg-[#625bd5]" />
                        {activePlanName}
                        {hasLegacyBilling && <span className="text-[#8a5a1f] dark:text-[#f0c987]">Legacy billing</span>}
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                {error && (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-8"
                >
                    <section className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-sm dark:border-[#2d2a25] dark:bg-[#1c1a18] md:p-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f3f2ff] text-[#625bd5] shadow-sm dark:bg-[#28264f] dark:text-[#a9a5ff]">
                                    <CreditCard size={25} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a7d68] dark:text-[#aaa39a]">Billing & plan</p>
                                    <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Choose your plan</h1>
                                    <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#665a4a] dark:text-[#aaa39a]">
                                        Current plan: <span className="font-bold text-[#211b16] dark:text-[#f4f1e9]">{activePlanName}</span>
                                        {hasLegacyBilling && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#8a5a1f] dark:bg-amber-900/30 dark:text-[#f0c987]">Legacy billing</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="inline-flex w-fit rounded-full bg-[#e9e1d6] p-1 shadow-inner dark:bg-[#262522]">
                                <button
                                    type="button"
                                    aria-pressed={billingInterval === 'monthly'}
                                    onClick={() => setBillingInterval('monthly')}
                                    className={`min-w-[108px] rounded-full px-5 py-2 text-xs font-bold transition-all ${
                                        billingInterval === 'monthly'
                                            ? 'bg-white text-[#211b16] shadow-sm dark:bg-[#11100f] dark:text-white'
                                            : 'text-[#766955] hover:text-[#211b16] dark:text-[#aaa39a] dark:hover:text-white'
                                    }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    type="button"
                                    aria-pressed={billingInterval === 'yearly'}
                                    onClick={() => setBillingInterval('yearly')}
                                    className={`min-w-[108px] rounded-full px-5 py-2 text-xs font-bold transition-all ${
                                        billingInterval === 'yearly'
                                            ? 'bg-white text-[#211b16] shadow-sm dark:bg-[#11100f] dark:text-white'
                                            : 'text-[#766955] hover:text-[#211b16] dark:text-[#aaa39a] dark:hover:text-white'
                                    }`}
                                >
                                    Yearly
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                            {plans.map((plan) => {
                                const tone = planTone[plan.id];
                                const isCurrentPlan = normalizedPlan === plan.id;
                                const isEnterprise = plan.id === 'enterprise';
                                const isCurrentEnterprise = isCurrentPlan && isEnterprise;
                                const isLoadingPlan = Boolean(plan.priceId && loadingPriceId === plan.priceId);
                                const isFreePlan = plan.id === 'free';

                                return (
                                    <div
                                        key={plan.id}
                                        className={`flex min-h-[430px] flex-col rounded-[1.6rem] border p-6 shadow-sm transition ${
                                            isCurrentPlan
                                                ? tone.card
                                                : 'border-[#eadfce] bg-white hover:border-[#d8c8b2] dark:border-[#3a332a] dark:bg-[#24221f] dark:hover:border-[#51483d]'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone.iconBg} ${tone.iconText}`}>
                                                        {isEnterprise ? <Users size={18} /> : <Sparkles size={18} />}
                                                    </span>
                                                    <h3 className={`text-xl font-black tracking-tight ${isCurrentEnterprise ? 'text-white' : ''}`}>{plan.name}</h3>
                                                </div>
                                                <p className={`mt-3 min-h-[42px] text-sm font-semibold leading-5 ${isCurrentEnterprise ? 'text-[#e7d7c2]' : 'text-[#665a4a] dark:text-[#aaa39a]'}`}>
                                                    {plan.description}
                                                </p>
                                            </div>
                                            {plan.id === 'max' && (
                                                <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#a97935] dark:bg-amber-900/30 dark:text-[#f0c987]">
                                                    Power
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-6">
                                            <div className={`flex items-baseline gap-1.5 ${isCurrentEnterprise ? 'text-white' : ''}`}>
                                                <span className="text-sm font-bold">$</span>
                                                <span className="text-5xl font-black tracking-tight">{plan.price.replace('$', '')}</span>
                                                <span className={`text-xs font-bold ${isCurrentEnterprise ? 'text-[#d7c4a9]' : 'text-[#8a7d68] dark:text-[#aaa39a]'}`}>{plan.period}</span>
                                            </div>
                                            <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wide ${tone.chip}`}>
                                                <Zap size={12} />
                                                {formatCredits(plan.limit)} {isEnterprise ? 'credits / seat' : 'credits / mo'}
                                            </div>
                                            <p className={`mt-3 text-xs font-semibold ${isCurrentEnterprise ? 'text-[#d7c4a9]' : 'text-[#8a7d68] dark:text-[#aaa39a]'}`}>
                                                {plan.billingCopy}
                                            </p>
                                        </div>

                                        <ul className="mt-6 flex-grow space-y-3">
                                            {plan.features.map((feature) => (
                                                <li key={feature} className={`flex items-start gap-2 text-sm font-semibold leading-5 ${isCurrentEnterprise ? 'text-[#e7d7c2]' : 'text-[#665a4a] dark:text-[#aaa39a]'}`}>
                                                    <Check size={16} className={isCurrentEnterprise ? 'mt-0.5 shrink-0 text-amber-300' : 'mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300'} />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        {isCurrentPlan ? (
                                            <div className={`mt-6 flex min-h-[48px] items-center justify-center gap-2 rounded-full text-xs font-black uppercase tracking-wide ${isCurrentEnterprise ? 'bg-white/10 text-white' : 'bg-[#fffaf1] text-[#625bd5] dark:bg-[#11100f] dark:text-[#a9a5ff]'}`}>
                                                <Check size={15} />
                                                Current plan
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handlePlanAction(plan)}
                                                disabled={isLoadingPlan || isFreePlan}
                                                className={`mt-6 min-h-[48px] rounded-full px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${tone.button}`}
                                            >
                                                {isLoadingPlan ? 'Opening checkout...' : isFreePlan ? 'Free included' : `Switch to ${plan.name}`}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr_0.85fr]">
                        <div className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-sm dark:border-[#2d2a25] dark:bg-[#1c1a18] md:p-8">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3f2ff] text-[#625bd5] dark:bg-[#28264f] dark:text-[#a9a5ff]">
                                    <Shield size={22} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a7d68] dark:text-[#aaa39a]">Current subscription</p>
                                    <h2 className="mt-1 text-xl font-bold">{activePlanName}</h2>
                                </div>
                            </div>
                            <p className="mt-4 text-sm font-semibold text-[#665a4a] dark:text-[#aaa39a]">{planSubtitle}</p>
                            <div className="mt-6 border-t border-[#eadfce] pt-5 dark:border-[#3a332a]">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a7d68] dark:text-[#aaa39a]">AI credit usage</p>
                                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">
                                        Monthly reset
                                    </span>
                                </div>
                                <AIUsageProgressBar
                                    used={aiUsage?.count || 0}
                                    limit={activeCreditLimit}
                                    isPremium={isPremium}
                                    variant="minimal"
                                    planLabel={activePlanName}
                                />
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-[#2b251f] bg-[#211b16] p-6 text-white shadow-sm dark:border-black dark:bg-black md:p-8">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300/15 text-amber-300">
                                    <Zap size={22} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d7c4a9]">Team capacity</p>
                                    <h2 className="mt-1 text-xl font-bold tracking-tight">Enterprise pooled credits</h2>
                                </div>
                            </div>
                            <p className="mt-5 text-sm font-medium leading-6 text-[#e7d7c2]">
                                Enterprise starts at {SUBSCRIPTION_CATALOG.enterprise.minimumSeats} seats, ${SUBSCRIPTION_CATALOG.enterprise.monthlyPrice}/seat/month, and {formatCredits(SUBSCRIPTION_CATALOG.enterprise.creditLimit)} pooled credits per seat.
                                That gives a team {formatCredits(enterpriseStarterCredits)} shared monthly credits before adding more seats.
                            </p>
                            <button
                                onClick={() => handleUpgrade('enterprise', SUBSCRIPTION_CATALOG.enterprise.monthlyPriceId)}
                                disabled={loadingPriceId === SUBSCRIPTION_CATALOG.enterprise.monthlyPriceId}
                                className="mt-6 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[#211b16] transition hover:bg-[#fff7eb] disabled:opacity-60"
                            >
                                <Users size={17} />
                                Explore Enterprise
                            </button>
                        </div>

                        <div className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-sm dark:border-[#2d2a25] dark:bg-[#1c1a18] md:p-8">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff7eb] text-[#8a5a1f] dark:bg-[#302a22] dark:text-[#f0c987]">
                                    <Database size={17} />
                                </div>
                                <h3 className="font-bold">Usage rules</h3>
                            </div>
                            <ul className="space-y-3 text-sm font-medium leading-6 text-[#665a4a] dark:text-[#aaa39a]">
                                <li className="flex gap-2">
                                    <Check size={16} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />
                                    Free includes 100 AI credits every month.
                                </li>
                                <li className="flex gap-2">
                                    <Check size={16} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />
                                    Pro and Max credits are personal monthly balances.
                                </li>
                                <li className="flex gap-2">
                                    <Check size={16} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300" />
                                    Enterprise seats add to one shared team pool.
                                </li>
                            </ul>
                        </div>
                    </section>

                    {normalizedPlan === 'enterprise' && (
                        <section className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-sm dark:border-[#2d2a25] dark:bg-[#1c1a18] md:p-8">
                            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a7d68] dark:text-[#aaa39a]">Team management</p>
                                    <h2 className="mt-1 text-xl font-bold">Manage developer seats</h2>
                                </div>
                                <span className="rounded-full bg-[#fff7eb] px-3 py-1.5 text-xs font-bold text-[#8a5a1f] dark:bg-[#302a22] dark:text-[#f0c987]">
                                    {seats} active seats
                                </span>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <input
                                    type="email"
                                    placeholder="teammate@example.com"
                                    value={newTeamMember}
                                    onChange={(event) => setNewTeamMember(event.target.value)}
                                    className="min-h-[46px] flex-1 rounded-2xl border border-[#e4d3bc] bg-[#fffaf1] px-4 text-sm font-semibold outline-none transition focus:border-[#625bd5] focus:ring-4 focus:ring-[#625bd5]/10 dark:border-[#3a332a] dark:bg-[#24221f]"
                                />
                                <button className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-[#211b16] px-5 text-sm font-bold text-white transition hover:bg-black dark:bg-white dark:text-[#211b16] dark:hover:bg-[#fff7eb]">
                                    <Plus size={17} />
                                    Invite
                                </button>
                            </div>
                        </section>
                    )}
                </motion.div>
            </main>
        </div>
    );
};

export default BillingDashboard;
