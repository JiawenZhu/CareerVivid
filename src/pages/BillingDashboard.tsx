import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';
import {
    ArrowLeft,
    Check,
    CreditCard,
    Users,
    Shield,
    Settings,
    Plus,
    Zap,
    Database,
    Sparkles,
    Calendar
} from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import {
    PRO_PLAN_CREDIT_LIMIT,
    PRO_MAX_PLAN_CREDIT_LIMIT,
    ENTERPRISE_PLAN_CREDIT_LIMIT
} from '../config/creditCosts';

const BillingDashboard: React.FC = () => {
    const { currentUser, userProfile, aiUsage } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [newTeamMember, setNewTeamMember] = useState('');

    const currentPlan = userProfile?.plan || 'free';
    const isEnterprise = currentPlan === 'enterprise';
    const legacyProPlans = ['premium', 'pro_monthly', 'pro_sprint'];

    const plans = [
        { id: 'pro', name: 'Pro', price: '$9', limit: PRO_PLAN_CREDIT_LIMIT, priceId: 'price_1TJoONRJNflGxv32zSqxC9bZ' },
        { id: 'max', name: 'Max', price: '$29', limit: PRO_MAX_PLAN_CREDIT_LIMIT, priceId: 'price_1TJoONRJNflGxv32wxPHw9FR' },
        { id: 'enterprise', name: 'Enterprise', price: '$12/seat', limit: ENTERPRISE_PLAN_CREDIT_LIMIT, priceId: 'price_1TJoQyRJNflGxv32FQ9TxIjq' }
    ];

    const handleUpgrade = async (priceId: string) => {
        if (!currentUser) return;
        setIsLoading(true);
        setError('');

        try {
            const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
            const result: any = await createCheckoutSession({
                priceId,
                successUrl: `${window.location.origin}/#/billing?success=true`,
                cancelUrl: `${window.location.origin}/#/billing`,
            });
            if (result.data.url) window.location.href = result.data.url;
        } catch (err) {
            setError('Checkout failed. Please try again.');
            setIsLoading(false);
        }
    };

    const getReadablePlanName = (plan: string) => {
        switch (plan) {
            case 'pro':
                return 'Pro';
            case 'max':
            case 'pro_max':
                return 'Max';
            case 'enterprise':
                return 'Enterprise';
            case 'premium':
            case 'pro_monthly':
            case 'pro_sprint':
                return 'Pro (Legacy)';
            case 'free':
                return 'Free';
            default:
                return plan;
        }
    };

    const readablePlan = getReadablePlanName(currentPlan);
    const activePlan = plans.find((plan) => plan.id === currentPlan)
        || (legacyProPlans.includes(currentPlan) ? plans[0] : undefined);
    const creditLimit = aiUsage?.limit || activePlan?.limit || PRO_PLAN_CREDIT_LIMIT;
    const creditsUsed = aiUsage?.count || 0;
    const creditsRemaining = Math.max(creditLimit - creditsUsed, 0);
    const creditsPercent = creditLimit > 0 ? Math.min((creditsUsed / creditLimit) * 100, 100) : 0;
    const planBillingLabel = currentPlan === 'free'
        ? 'Free workspace'
        : isEnterprise
            ? 'Team subscription'
            : 'Monthly subscription';
    const renewalLabel = userProfile?.expiresAt?.toDate
        ? userProfile.expiresAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'No renewal date';

    const isCurrentPlan = (planId: string) => {
        if (currentPlan === planId) return true;
        if (planId === 'pro' && legacyProPlans.includes(currentPlan)) return true;
        if (planId === 'max' && currentPlan === 'pro_max') return true;
        return false;
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#f7f1e7] pb-20 font-sans text-[#211b16] selection:bg-[#f3f2ff] dark:bg-[#1f1f1d] dark:text-[#f4f1e9] dark:selection:bg-[#37332d]">
            <header className="sticky top-0 z-10 border-b border-[#e4d3bc]/70 bg-[#f7f1e7]/88 backdrop-blur-xl dark:border-[#37332d] dark:bg-[#1f1f1d]/88">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group inline-flex items-center gap-2 rounded-xl border border-[#e4d3bc] bg-white/70 px-3 py-2 text-sm font-semibold text-[#665a4a] shadow-sm transition hover:border-[#d9c7ad] hover:bg-white hover:text-[#211b16] dark:border-[#37332d] dark:bg-[#262522] dark:text-[#aaa39a] dark:hover:text-[#f4f1e9]"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
                        <span>Dashboard</span>
                    </button>

                    <span className="inline-flex items-center gap-2 rounded-full border border-[#e6dac8] bg-[#fffaf1] px-3 py-1.5 text-xs font-bold text-[#665a4a] shadow-sm dark:border-[#37332d] dark:bg-[#262522] dark:text-[#aaa39a]">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        {readablePlan}
                    </span>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                {error && (
                    <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                        {error}
                    </div>
                )}

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
                    <section className="space-y-5">
                        <section className="rounded-[28px] border border-[#e6dac8] bg-white p-5 shadow-[0_24px_70px_rgba(66,52,38,0.08)] dark:border-[#37332d] dark:bg-[#262522] sm:p-6 lg:p-7">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f3f2ff] text-[#625bd5] shadow-sm dark:bg-[#302e2a] dark:text-[#8d88e6]">
                                        <CreditCard size={24} />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold leading-tight text-[#211b16] dark:text-[#f4f1e9] sm:text-3xl">
                                            Billing &amp; Plan
                                        </h1>
                                        <p className="mt-1 text-sm font-medium leading-6 text-[#665a4a] dark:text-[#aaa39a]">
                                            Manage your CareerVivid subscription.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-7 grid gap-4 lg:grid-cols-2">
                                <article className="relative overflow-hidden rounded-2xl border border-[#e6dac8] bg-[#fffaf1] p-5 shadow-sm dark:border-[#37332d] dark:bg-[#1f1f1d]">
                                    <Shield className="pointer-events-none absolute -right-6 top-5 h-28 w-28 text-[#e6dac8]/60 dark:text-[#37332d]/60" strokeWidth={1.1} />
                                    <div className="relative">
                                        <p className="text-[11px] font-bold text-[#7d6e5e] dark:text-[#aaa39a]">Active plan</p>
                                        <h2 className="mt-6 text-3xl font-bold leading-none text-[#211b16] dark:text-[#f4f1e9] sm:text-4xl">
                                            {readablePlan}
                                        </h2>
                                        <p className="mt-3 text-sm font-semibold capitalize text-[#7d6e5e] dark:text-[#aaa39a]">
                                            {planBillingLabel}
                                        </p>

                                        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-[#665a4a] dark:text-[#aaa39a]">
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6dac8] bg-white px-2.5 py-1.5 shadow-sm dark:border-[#37332d] dark:bg-[#262522]">
                                                <Calendar size={12} />
                                                {renewalLabel}
                                            </span>
                                            <span className="rounded-full border border-[#e6dac8] bg-white px-2.5 py-1.5 shadow-sm dark:border-[#37332d] dark:bg-[#262522]">
                                                {isEnterprise ? `${userProfile?.seats || 1} seat${(userProfile?.seats || 1) === 1 ? '' : 's'}` : 'Career workspace'}
                                            </span>
                                        </div>
                                    </div>
                                </article>

                                <article className="rounded-2xl border border-[#e6dac8] bg-[#fffaf1] p-5 shadow-sm dark:border-[#37332d] dark:bg-[#1f1f1d]">
                                    <div className="mb-7 flex items-center justify-between gap-3">
                                        <p className="text-[11px] font-bold text-[#7d6e5e] dark:text-[#aaa39a]">AI credit usage</p>
                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.16)]" />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef0ff] text-[#625bd5] dark:bg-[#302e2a] dark:text-[#8d88e6]">
                                            <Sparkles size={17} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold leading-tight text-[#211b16] dark:text-[#f4f1e9]">
                                                {readablePlan} AI Credits
                                            </h2>
                                            <p className="mt-0.5 text-xs font-semibold text-[#7d6e5e] dark:text-[#aaa39a]">
                                                {creditLimit.toLocaleString()} credits per month
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#e9e3d9] shadow-inner dark:bg-[#37332d]">
                                        <div
                                            className="h-full rounded-full bg-[#625bd5] transition-all duration-500 dark:bg-[#8d88e6]"
                                            style={{ width: `${creditsPercent}%` }}
                                        />
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold text-[#3c4658] dark:text-[#f4f1e9]">
                                        <span>{creditsUsed.toLocaleString()} / {creditLimit.toLocaleString()} used</span>
                                        <span className="text-[#665a4a] dark:text-[#aaa39a]">{creditsRemaining.toLocaleString()} left</span>
                                    </div>
                                </article>
                            </div>
                        </section>

                        {isEnterprise && (
                            <section className="rounded-[28px] border border-[#d8c5aa] bg-[#fffaf1] p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522] sm:p-6 lg:p-7">
                                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f9efe0] text-[#a97935] shadow-sm dark:bg-[#302e2a] dark:text-[#caa26c]">
                                            <Users size={21} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-[#211b16] dark:text-[#f4f1e9]">Team management</h2>
                                            <p className="mt-1 text-sm font-medium text-[#665a4a] dark:text-[#aaa39a]">Manage {userProfile?.seats || 1} developer seats.</p>
                                        </div>
                                    </div>
                                    <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6dac8] bg-white text-[#665a4a] shadow-sm transition hover:border-[#d9c7ad] hover:text-[#211b16] dark:border-[#37332d] dark:bg-[#1f1f1d] dark:text-[#aaa39a] dark:hover:text-[#f4f1e9]">
                                        <Settings size={18} />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <input
                                        type="email"
                                        placeholder="developer@company.com"
                                        value={newTeamMember}
                                        onChange={(event) => setNewTeamMember(event.target.value)}
                                        className="min-h-11 flex-1 rounded-xl border border-[#e6dac8] bg-white px-4 text-sm font-medium text-[#211b16] outline-none transition placeholder:text-[#9b9186] focus:border-[#625bd5] focus:ring-2 focus:ring-[#625bd5]/20 dark:border-[#37332d] dark:bg-[#1f1f1d] dark:text-[#f4f1e9]"
                                    />
                                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#211b16] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#362a21] dark:bg-[#f4f1e9] dark:text-[#211b16] dark:hover:bg-white">
                                        <Plus size={17} />
                                        Invite
                                    </button>
                                </div>
                            </section>
                        )}

                        {!isEnterprise && currentPlan !== 'max' && currentPlan !== 'pro_max' && (
                            <section className="rounded-[28px] border border-[#211b16]/10 bg-[#211b16] p-5 text-[#f4f1e9] shadow-[0_24px_70px_rgba(66,52,38,0.16)] dark:border-[#37332d] dark:bg-[#262522] sm:p-6 lg:p-7">
                                <div className="flex max-w-2xl flex-col gap-5">
                                    <div>
                                        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff4cc] text-[#a97935] shadow-sm">
                                            <Zap size={22} fill="currentColor" />
                                        </div>
                                        <h2 className="text-2xl font-bold leading-tight text-[#f4f1e9] sm:text-3xl">
                                            Upgrade to Enterprise
                                        </h2>
                                        <p className="mt-3 text-sm font-medium leading-6 text-[#d7d0c6]">
                                            Need shared team credits? Each seat adds <span className="font-bold text-white">1,500</span> pooled credits, SSO, and private workspaces.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                        <button
                                            onClick={() => navigate('/pricing')}
                                            className="inline-flex w-full items-center justify-center rounded-xl bg-[#fffaf1] px-5 py-3 text-sm font-bold text-[#211b16] shadow-sm transition hover:bg-white sm:w-auto"
                                        >
                                            Explore Enterprise
                                        </button>
                                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#d7d0c6]">
                                            <Users size={15} />
                                            Shared credits and team controls
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </section>

                    <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
                        <div className="rounded-[24px] border border-[#e6dac8] bg-white p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522]">
                            <div className="mb-5">
                                <h2 className="text-base font-bold text-[#211b16] dark:text-[#f4f1e9]">Available tiers</h2>
                                <p className="mt-1 text-xs font-semibold text-[#7d6e5e] dark:text-[#aaa39a]">Pick the right monthly capacity.</p>
                            </div>

                            <div className="space-y-3">
                                {plans.map((plan) => (
                                    <article
                                        key={plan.id}
                                        className={`rounded-2xl border p-4 shadow-sm transition ${
                                            isCurrentPlan(plan.id)
                                                ? 'border-[#625bd5] bg-[#f5f4ff] ring-1 ring-[#625bd5]/30 dark:border-[#8d88e6] dark:bg-[#302e2a]'
                                                : 'border-[#e6dac8] bg-[#fffaf1] hover:border-[#d9c7ad] dark:border-[#37332d] dark:bg-[#1f1f1d]'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-bold text-[#211b16] dark:text-[#f4f1e9]">{plan.name}</h3>
                                                <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#7d6e5e] dark:text-[#aaa39a]">
                                                    <Zap size={12} />
                                                    {plan.limit.toLocaleString()} credits {plan.id === 'enterprise' ? '/ seat / mo' : '/ mo'}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-white px-2 py-1 text-sm font-bold text-[#625bd5] shadow-sm dark:bg-[#262522] dark:text-[#8d88e6]">
                                                {plan.price}
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            {isCurrentPlan(plan.id) ? (
                                                <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#625bd5] shadow-sm dark:bg-[#1f1f1d] dark:text-[#8d88e6]">
                                                    <Check className="h-4 w-4" />
                                                    Current plan
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleUpgrade(plan.priceId)}
                                                    disabled={isLoading}
                                                    className="inline-flex w-full items-center justify-center rounded-xl bg-[#211b16] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#362a21] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#f4f1e9] dark:text-[#211b16] dark:hover:bg-white"
                                                >
                                                    {isLoading ? 'Opening checkout...' : `Switch to ${plan.name}`}
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[24px] border border-[#e6dac8] bg-[#fffaf1] p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522]">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#665a4a] shadow-sm dark:bg-[#1f1f1d] dark:text-[#aaa39a]">
                                    <Database size={17} />
                                </div>
                                <h2 className="text-base font-bold text-[#211b16] dark:text-[#f4f1e9]">Plan rules</h2>
                            </div>
                            <ul className="space-y-3">
                                {[
                                    'Credits reset on the 1st of every month.',
                                    'Enterprise seats contribute to a shared pool.',
                                    'Canceled plans keep access through the billing period.',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2.5 text-sm font-medium leading-5 text-[#665a4a] dark:text-[#aaa39a]">
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default BillingDashboard;
