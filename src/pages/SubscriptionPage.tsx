import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';
import { ArrowLeft, Check, CreditCard, Calendar, CheckCircle, Sparkles, Home, FileText, Zap, Database, Shield, Users } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { trackUsage } from '../services/trackingService';
import { FREE_PLAN_CREDIT_LIMIT, PRO_PLAN_CREDIT_LIMIT, PRO_MAX_PLAN_CREDIT_LIMIT, ENTERPRISE_PLAN_CREDIT_LIMIT } from '../config/creditCosts';
import ConfirmationModal from '../components/ConfirmationModal';
import RetentionModal from '../components/RetentionModal';
import CancellationFeedbackModal from '../components/CancellationFeedbackModal';

const SubscriptionPage: React.FC = () => {
    const { currentUser, userProfile } = useAuth();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const [cancelStep, setCancelStep] = useState<'idle' | 'offer_10' | 'offer_20' | 'feedback' | 'confirm'>('idle');
    const [feedbackData, setFeedbackData] = useState<{ reason: string; feedback: string } | null>(null);
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm?: () => void }>({ isOpen: false, title: '', message: '' });

    useEffect(() => {
        const hash = window.location.hash;
        const search = window.location.search;

        if (hash.includes('success=true') || search.includes('success=true')) {
            setShowSuccess(true);
            setTimeout(() => {
                const newUrl = window.location.pathname + window.location.hash.replace('?success=true', '').replace('&success=true', '');
                window.history.replaceState(null, '', newUrl);
            }, 500);
        }
    }, []);

    useEffect(() => {
        if (!currentUser) {
            navigate('/signin');
        }
    }, [currentUser]);

    const expiresAt = userProfile?.expiresAt;
    const isExpired = expiresAt && expiresAt.toMillis() < Date.now();
    const currentPlan = isExpired ? 'free' : (userProfile?.plan || 'free');
    const subscriptionStatus = userProfile?.stripeSubscriptionStatus;
    const resumeLimit = userProfile?.resumeLimit || 1;

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'No renewal date';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const [viewMode, setViewMode] = useState<'career' | 'creator'>('career');

    useEffect(() => {
        if (userProfile?.source === 'bio-link') {
            setViewMode('creator');
        }
    }, [userProfile]);

    const pricingPlans = viewMode === 'creator' ? [
        {
            id: 'bio_link_pro',
            name: 'Bio-Link Pro',
            price: '$2.99',
            originalPrice: null,
            discount: null,
            period: '/month',
            priceId: 'price_1Sr2UlRJNflGxv32C4XhlnUf',
            priceIdYearly: 'price_1Sr2UlRJNflGxv329NwShWqX',
            features: [
                '50 AI Credits / month',
                'Unlimited Bio-Link Portfolios',
                'Analytics Dashboard',
                'Media Kit & TikTok Analytics',
                "Remove 'Careervivid' Branding",
                'Custom Domain (Coming Soon)'
            ],
            current: false,
            popular: true,
        },
        {
            id: 'monthly',
            name: 'All-Access Bundle',
            price: '$14.90',
            originalPrice: '$29.80',
            discount: '50% OFF',
            period: '/month',
            priceId: 'price_1ScLOaRJNflGxv32BwQnSBs0',
            features: [
                'Create & Edit up to 15 Resumes',
                'Create up to 8 Portfolio Websites',
                t('subscription.features.all_templates'),
                `${ENTERPRISE_PLAN_CREDIT_LIMIT.toLocaleString()} AI credits / month`,
                t('subscription.features.ai_content'),
                t('subscription.features.ai_photo'),
                t('subscription.features.unlimited_downloads'),
                t('subscription.features.unlimited_practice')
            ],
            current: (currentPlan as any) === 'enterprise',
            popular: false,
        }
    ] : [
        {
            id: 'free',
            name: t('subscription.plans.free'),
            price: '$0',
            period: 'forever',
            priceId: null,
            features: [
                'Create & Edit 2 Resumes',
                'Create 1 Portfolio Website',
                t('subscription.features.all_templates'),
                t('subscription.features.ai_content'),
                '100 AI credits / month',
                t('subscription.features.image_exports')
            ],
            current: currentPlan === 'free' || !currentPlan,
        },
        {
            id: 'pro',
            name: 'Pro',
            price: '$9',
            originalPrice: null,
            discount: null,
            period: '/month',
            priceId: 'price_1TJoONRJNflGxv32zSqxC9bZ',
            features: [
                'Create & Edit Unlimited Resumes',
                'Unlimited resume and PDF downloads',
                'Export high-quality PDFs',
                'Professional resumes ready for any application',
                'Multiple versions for different jobs',
                'Create up to 8 Portfolio Websites',
                t('subscription.features.all_templates'),
                `${PRO_PLAN_CREDIT_LIMIT.toLocaleString()} AI credits / month`,
                'CLI Access',
                t('subscription.features.ai_content'),
                'AI photo editing included',
                'Professional headshots with AI enhancement',
                t('subscription.features.unlimited_downloads')
            ],
            current: (currentPlan as any) === 'pro',
            popular: false,
        },
        {
            id: 'max',
            name: 'Max',
            price: '$8',
            originalPrice: '$16',
            discount: '50% OFF',
            period: '/month',
            priceId: 'price_1TJoONRJNflGxv32wxPHw9FR',
            features: [
                'Create & Edit Unlimited Resumes',
                'Create up to 8 Portfolio Websites',
                t('subscription.features.all_templates'),
                `${PRO_MAX_PLAN_CREDIT_LIMIT.toLocaleString()} AI credits / month`,
                'Advanced CLI features',
                'High-capacity AI usage',
                'Priority Support',
                'Everything in Pro'
            ],
            current: (currentPlan as any) === 'max' || (currentPlan as any) === 'pro_max',
            popular: false,
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: '$12',
            originalPrice: '$24',
            discount: '50% OFF',
            period: '/seat/month',
            priceId: 'price_1TJoQyRJNflGxv32FQ9TxIjq',
            features: [
                'Pooled Team Credits',
                'Team Workspaces',
                t('subscription.features.all_templates'),
                `${ENTERPRISE_PLAN_CREDIT_LIMIT.toLocaleString()} credits per seat`,
                'Centralized Billing',
                'Custom Solutions',
                'Admin Dashboard',
                'SLA Support'
            ],
            current: (currentPlan as any) === 'enterprise',
            popular: true,
        },
    ];

    const currentPlanConfig = pricingPlans.find((plan: any) => plan.current);
    const currentPlanName = currentPlanConfig?.name || t('subscription.plans.free');
    const paidPlans = pricingPlans.filter((plan: any) => plan.id !== 'free');
    const currentCreditLimit = currentPlan === 'pro'
        ? PRO_PLAN_CREDIT_LIMIT
        : currentPlan === 'max' || currentPlan === 'pro_max'
            ? PRO_MAX_PLAN_CREDIT_LIMIT
            : currentPlan === 'enterprise'
                ? ENTERPRISE_PLAN_CREDIT_LIMIT
                : FREE_PLAN_CREDIT_LIMIT;
    const creditsUsed = userProfile?.aiUsage?.count || 0;
    const creditsRemaining = Math.max(currentCreditLimit - creditsUsed, 0);
    const creditsPercent = currentCreditLimit > 0 ? Math.min((creditsUsed / currentCreditLimit) * 100, 100) : 0;
    const isPaidPlan = currentPlan !== 'free' && currentPlan !== '';
    const currentPlanBillingLabel = isPaidPlan
        ? currentPlan === 'enterprise'
            ? 'Team subscription'
            : 'Monthly subscription'
        : 'Free workspace';
    const statusLabel = subscriptionStatus
        ? subscriptionStatus.replace(/_/g, ' ')
        : isPaidPlan
            ? 'Active'
            : 'Free workspace';
    const enterprisePriceId = pricingPlans.find((plan: any) => plan.id === 'enterprise')?.priceId || 'price_1TJoQyRJNflGxv32FQ9TxIjq';

    const getPlanCredits = (planId: string) => {
        if (planId === 'pro') return '1,000 credits';
        if (planId === 'max' || planId === 'pro_max') return `${PRO_MAX_PLAN_CREDIT_LIMIT.toLocaleString()} credits`;
        if (planId === 'enterprise') return `${ENTERPRISE_PLAN_CREDIT_LIMIT.toLocaleString()} credits / seat`;
        if (planId === 'monthly') return `${ENTERPRISE_PLAN_CREDIT_LIMIT.toLocaleString()} credits`;
        if (planId === 'bio_link_pro') return '50 credits';
        return `${FREE_PLAN_CREDIT_LIMIT} credits`;
    };

    const handleUpgrade = async (priceId: string | null) => {
        if (!priceId || !currentUser) return;

        setIsLoading(true);
        setError('');

        try {
            await trackUsage(currentUser.uid, 'checkout_session_start', { priceId });

            const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
            const result: any = await createCheckoutSession({
                priceId,
                successUrl: `${window.location.origin}/#/subscription?success=true`,
                cancelUrl: `${window.location.origin}/#/subscription`,
            });

            if (result.data.url) {
                window.location.href = result.data.url;
            }
        } catch (error: any) {
            console.error('Error creating checkout session:', error);
            setError('Failed to start checkout. Please try again.');
            setIsLoading(false);
        }
    };

    const handleCancelClick = () => {
        setFeedbackData(null);
        if ((currentPlan as any) === 'pro' || (currentPlan as any) === 'max' || (currentPlan as any) === 'pro_max' || (currentPlan as any) === 'enterprise') {
            setCancelStep('offer_10');
        } else {
            setCancelStep('feedback');
        }
    };

    const handleAcceptDiscount = async (discountType: 'RETENTION_10' | 'RETENTION_20') => {
        setIsLoading(true);
        try {
            const applyDiscountFn = httpsCallable(functions, 'applyDiscount');
            const result: any = await applyDiscountFn({ discountType });

            setCancelStep('idle');

            if (result.data.status === 'fixed_state') {
                setInfoModal({
                    isOpen: true,
                    title: 'Subscription Updated',
                    message: 'It looks like your subscription was already canceled or invalid. Your account has been updated.',
                    onConfirm: () => window.location.reload()
                });
                return;
            }

            setInfoModal({
                isOpen: true,
                title: 'Discount Applied',
                message: `Success! Your ${discountType === 'RETENTION_10' ? '10%' : '20%'} discount has been applied.`,
                onConfirm: () => window.location.reload()
            });
        } catch (error) {
            console.error(error);
            setError('Failed to apply discount. Please try again later.');
            setIsLoading(false);
        }
    };

    const handleFeedbackSubmit = (data: { reason: string; feedback: string }) => {
        setFeedbackData(data);
        setCancelStep('confirm');
    };

    const processCancellation = async () => {
        if (!currentUser) return;

        setIsLoading(true);
        setError('');
        setCancelStep('idle');

        try {
            const cancelSubscription = httpsCallable(functions, 'cancelSubscription');
            await cancelSubscription({
                cancellationReason: feedbackData?.reason,
                feedbackText: feedbackData?.feedback
            });
            window.location.reload();
        } catch (error: any) {
            console.error('Error canceling subscription:', error);
            setError('Failed to cancel subscription. Please try again.');
            setIsLoading(false);
        }
    };

    const renderModals = () => (
        <>
            <RetentionModal
                isOpen={cancelStep === 'offer_10' || cancelStep === 'offer_20'}
                step={cancelStep === 'offer_10' ? 'offer_10' : 'offer_20'}
                onAccept={() => handleAcceptDiscount(cancelStep === 'offer_10' ? 'RETENTION_10' : 'RETENTION_20')}
                onDecline={() => {
                    if (cancelStep === 'offer_10') {
                        setCancelStep('offer_20');
                    } else {
                        setCancelStep('feedback');
                    }
                }}
                isLoading={isLoading}
            />

            <CancellationFeedbackModal
                isOpen={cancelStep === 'feedback'}
                onCancel={() => setCancelStep('idle')}
                onConfirm={handleFeedbackSubmit}
                isLoading={isLoading}
            />

            <ConfirmationModal
                isOpen={infoModal.isOpen}
                onCancel={() => setInfoModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => {
                    infoModal.onConfirm?.();
                    setInfoModal(prev => ({ ...prev, isOpen: false }));
                }}
                title={infoModal.title}
                message={infoModal.message}
                confirmText="OK"
                cancelText=""
                variant="default"
            />

            <ConfirmationModal
                isOpen={cancelStep === 'confirm'}
                onCancel={() => setCancelStep('idle')}
                onConfirm={processCancellation}
                title={t('subscription.cancel_title') || 'Cancel Subscription?'}
                message={t('subscription.cancel_confirm') || 'Are you sure you want to cancel? You will retain access to Pro features until the end of your current billing period.'}
                confirmText="Yes, Cancel Subscription"
                cancelText="Keep My Plan"
                variant="danger"
            />
        </>
    );

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-[#f7f1e7] px-4 py-10 text-[#211b16] dark:bg-[#1f1f1d] dark:text-[#f4f1e9]">
                <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center">
                    <div className="w-full rounded-2xl border border-[#e4d3bc] bg-[#fffaf1] p-6 text-center shadow-sm dark:border-[#37332d] dark:bg-[#262522] sm:p-8 md:p-10">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                            <CheckCircle className="h-8 w-8" />
                        </div>

                        <h1 className="text-3xl font-bold leading-tight text-[#211b16] dark:text-[#f4f1e9] sm:text-4xl">Payment successful</h1>
                        <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-6 text-[#665a4a] dark:text-[#aaa39a]">
                            Your CareerVivid workspace is upgraded. You can keep building resumes, tracking applications, and practicing interviews.
                        </p>

                        <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
                            {[
                                'Unlimited resume downloads',
                                'AI-powered content generation',
                                'Professional photo enhancement',
                                'Premium templates',
                                'Priority support',
                                'Advanced customization'
                            ].map((feature) => (
                                <div key={feature} className="flex items-start gap-2 rounded-xl border border-[#e6dac8] bg-white px-3 py-3 text-sm font-semibold text-[#665a4a] dark:border-[#37332d] dark:bg-[#1f1f1d] dark:text-[#aaa39a]">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                            <button
                                onClick={() => window.location.href = '#/dashboard'}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#625bd5] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5851c8]"
                            >
                                <Home className="h-4 w-4" />
                                Go to Dashboard
                            </button>
                            <button
                                onClick={() => navigate('/newresume')}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e6dac8] bg-white px-5 py-3 text-sm font-semibold text-[#211b16] shadow-sm transition hover:border-[#d9c7ad] hover:bg-[#fffaf1] dark:border-[#37332d] dark:bg-[#302e2a] dark:text-[#f4f1e9] dark:hover:bg-[#37332d]"
                            >
                                <FileText className="h-4 w-4" />
                                Create resume
                            </button>
                        </div>

                        <button
                            onClick={() => setShowSuccess(false)}
                            className="mt-6 text-sm font-semibold text-[#625bd5] transition hover:text-[#5851c8] dark:text-[#8d88e6]"
                        >
                            View subscription details
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f7f1e7] pb-20 font-sans text-[#211b16] selection:bg-[#f3f2ff] dark:bg-[#1f1f1d] dark:text-[#f4f1e9] dark:selection:bg-[#37332d]">
            <header className="sticky top-0 z-10 border-b border-[#e4d3bc]/70 bg-[#f7f1e7]/88 backdrop-blur-xl dark:border-[#37332d] dark:bg-[#1f1f1d]/88">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group inline-flex items-center gap-2 rounded-xl border border-[#e4d3bc] bg-white/70 px-3 py-2 text-sm font-semibold text-[#665a4a] shadow-sm transition hover:border-[#d9c7ad] hover:bg-white hover:text-[#211b16] dark:border-[#37332d] dark:bg-[#262522] dark:text-[#aaa39a] dark:hover:text-[#f4f1e9]"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
                        <span>Dashboard</span>
                    </button>
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
                                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#e6dac8] bg-[#fffaf1] px-3 py-1.5 text-xs font-bold capitalize text-[#665a4a] shadow-sm dark:border-[#37332d] dark:bg-[#1f1f1d] dark:text-[#aaa39a]">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                    {statusLabel}
                                </span>
                            </div>

                            <div className="mt-7 grid gap-4 lg:grid-cols-2">
                                <article className="relative overflow-hidden rounded-2xl border border-[#e6dac8] bg-[#fffaf1] p-5 shadow-sm dark:border-[#37332d] dark:bg-[#1f1f1d]">
                                    <Shield className="pointer-events-none absolute -right-6 top-5 h-28 w-28 text-[#e6dac8]/60 dark:text-[#37332d]/60" strokeWidth={1.1} />
                                    <div className="relative">
                                        <p className="text-[11px] font-bold text-[#7d6e5e] dark:text-[#aaa39a]">Active plan</p>
                                        <h2 className="mt-6 text-3xl font-bold leading-none text-[#211b16] dark:text-[#f4f1e9] sm:text-4xl">
                                            {currentPlanName}
                                        </h2>
                                        <p className="mt-3 text-sm font-semibold capitalize text-[#7d6e5e] dark:text-[#aaa39a]">
                                            {currentPlanBillingLabel}
                                        </p>

                                        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-[#665a4a] dark:text-[#aaa39a]">
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6dac8] bg-white px-2.5 py-1.5 shadow-sm dark:border-[#37332d] dark:bg-[#262522]">
                                                <Calendar size={12} />
                                                {formatDate(expiresAt)}
                                            </span>
                                            <span className="rounded-full border border-[#e6dac8] bg-white px-2.5 py-1.5 shadow-sm dark:border-[#37332d] dark:bg-[#262522]">
                                                {resumeLimit === 999 ? 'Unlimited resumes' : `${resumeLimit} resume${resumeLimit === 1 ? '' : 's'}`}
                                            </span>
                                        </div>

                                        {isPaidPlan && (
                                            <button
                                                onClick={handleCancelClick}
                                                disabled={isLoading}
                                                className="mt-5 text-xs font-bold text-[#7d6e5e] underline decoration-[#d9c7ad] underline-offset-4 transition hover:text-rose-700 disabled:opacity-60 dark:text-[#aaa39a] dark:decoration-[#575149] dark:hover:text-rose-300"
                                            >
                                                Cancel subscription
                                            </button>
                                        )}
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
                                                {currentPlanName} AI Credits
                                            </h2>
                                            <p className="mt-0.5 text-xs font-semibold text-[#7d6e5e] dark:text-[#aaa39a]">
                                                {currentCreditLimit.toLocaleString()} credits per month
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
                                        <span>{creditsUsed.toLocaleString()} / {currentCreditLimit.toLocaleString()} used</span>
                                        <span className="text-[#665a4a] dark:text-[#aaa39a]">{creditsRemaining.toLocaleString()} left</span>
                                    </div>
                                </article>
                            </div>
                        </section>

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
                                        onClick={() => handleUpgrade(enterprisePriceId)}
                                        disabled={isLoading || !enterprisePriceId}
                                        className="inline-flex w-full items-center justify-center rounded-xl bg-[#fffaf1] px-5 py-3 text-sm font-bold text-[#211b16] shadow-sm transition hover:bg-white disabled:opacity-60 sm:w-auto"
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
                    </section>

                    <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
                        <div className="rounded-[24px] border border-[#e6dac8] bg-white p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522]">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-bold text-[#211b16] dark:text-[#f4f1e9]">Available tiers</h2>
                                    <p className="mt-1 text-xs font-semibold text-[#7d6e5e] dark:text-[#aaa39a]">Pick the right monthly capacity.</p>
                                </div>
                                {viewMode === 'creator' && (
                                    <span className="rounded-full bg-[#f3f2ff] px-2.5 py-1 text-[11px] font-bold text-[#625bd5] dark:bg-[#302e2a] dark:text-[#8d88e6]">
                                        Creator
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3">
                                {paidPlans.map((plan: any) => (
                                    <article
                                        key={plan.id}
                                        className={`rounded-2xl border p-4 shadow-sm transition ${
                                            plan.current
                                                ? 'border-[#625bd5] bg-[#f5f4ff] ring-1 ring-[#625bd5]/30 dark:border-[#8d88e6] dark:bg-[#302e2a]'
                                                : 'border-[#e6dac8] bg-[#fffaf1] hover:border-[#d9c7ad] dark:border-[#37332d] dark:bg-[#1f1f1d]'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-bold text-[#211b16] dark:text-[#f4f1e9]">{plan.name}</h3>
                                                <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#7d6e5e] dark:text-[#aaa39a]">
                                                    <Zap size={12} />
                                                    {getPlanCredits(plan.id)} / mo
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="rounded-lg bg-white px-2 py-1 text-sm font-bold text-[#625bd5] shadow-sm dark:bg-[#262522] dark:text-[#8d88e6]">
                                                    {plan.price}
                                                </div>
                                                <div className="mt-1 text-[10px] font-semibold text-[#7d6e5e] dark:text-[#aaa39a]">{plan.period}</div>
                                            </div>
                                        </div>

                                        {plan.discount && (
                                            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                                                <span>{plan.discount}</span>
                                                {plan.originalPrice && <span className="text-[#7d6e5e] line-through dark:text-[#aaa39a]">{plan.originalPrice}</span>}
                                            </div>
                                        )}

                                        <div className="mt-4">
                                            {plan.current ? (
                                                <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#625bd5] shadow-sm dark:bg-[#1f1f1d] dark:text-[#8d88e6]">
                                                    <Check className="h-4 w-4" />
                                                    Current plan
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => plan.priceId && handleUpgrade(plan.priceId)}
                                                    disabled={isLoading || !plan.priceId}
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

            {renderModals()}
        </div>
    );
};

export default SubscriptionPage;
