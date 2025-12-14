import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../App';
import { ArrowLeft, Check, CreditCard, Calendar, X } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { trackUsage } from '../services/trackingService';
import ConfirmationModal from '../components/ConfirmationModal';
import RetentionModal from '../components/RetentionModal';
import CancellationFeedbackModal from '../components/CancellationFeedbackModal';

const SubscriptionPage: React.FC = () => {
    const { currentUser, userProfile } = useAuth();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Cancellation State Machine
    const [cancelStep, setCancelStep] = useState<'idle' | 'offer_10' | 'offer_20' | 'feedback' | 'confirm'>('idle');
    const [feedbackData, setFeedbackData] = useState<{ reason: string; feedback: string } | null>(null);
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm?: () => void }>({ isOpen: false, title: '', message: '' });

    // Redirect if not logged in
    useEffect(() => {
        if (!currentUser) {
            navigate('/auth');
        }
    }, [currentUser]);

    const expiresAt = userProfile?.expiresAt;
    const isExpired = expiresAt && expiresAt.toMillis() < Date.now();

    // If plan is expired, force current plan to be free for UI display logic
    const currentPlan = isExpired ? 'free' : (userProfile?.plan || 'free');

    const resumeLimit = userProfile?.resumeLimit || 2;
    const subscriptionStatus = userProfile?.stripeSubscriptionStatus;

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const pricingPlans = [
        {
            id: 'free',
            name: t('subscription.plans.free'),
            price: '$0',
            period: 'forever',
            priceId: null,
            features: [
                "Create & Edit 2 Resumes",
                "Create 1 Portfolio Website",
                t('subscription.features.all_templates'),
                t('subscription.features.ai_content'),
                "10 AI Credits/Month",
                t('subscription.features.image_exports')
            ],
            current: currentPlan === 'free' || !currentPlan,
        },
        {
            id: 'download_once',
            name: t('subscription.plans.download_once'),
            price: '$1.99',
            originalPrice: '$3.98',
            discount: '50% OFF',
            period: 'one-time',
            priceId: 'price_1ScLPERJNflGxv32Wxtpvg62',
            features: [
                t('subscription.features.pdf_credit'),
                t('subscription.features.use_any_resume'),
                t('subscription.features.no_expiration'),
                t('subscription.features.no_subscription')
            ],
            current: false,
            popular: false,
        },
        {
            id: 'sprint',
            name: t('subscription.plans.sprint'),
            price: '$6.90',
            originalPrice: '$13.80',
            discount: '50% OFF',
            period: 'one-time',
            priceId: 'price_1ScLNsRJNflGxv32cvu6cTsK',
            features: [
                "Create & Edit up to 8 Resumes",
                "Create up to 8 Portfolio Websites",
                t('subscription.features.all_templates'),
                "100 AI Credits/Month",
                t('subscription.features.ai_content'),
                t('subscription.features.ai_photo'),
                t('subscription.features.unlimited_downloads'),
                t('subscription.features.access_7_days')
            ],
            current: currentPlan === 'pro_sprint',
            popular: false,
        },
        {
            id: 'monthly',
            name: t('subscription.plans.monthly'),
            price: '$14.90',
            originalPrice: '$29.80',
            discount: '50% OFF',
            period: '/month',
            priceId: 'price_1ScLOaRJNflGxv32BwQnSBs0',
            features: [
                "Create & Edit up to 15 Resumes",
                "Create up to 8 Portfolio Websites",
                t('subscription.features.all_templates'),
                "300 AI Credits/Month",
                t('subscription.features.ai_content'),
                t('subscription.features.ai_photo'),
                t('subscription.features.unlimited_downloads'),
                t('subscription.features.unlimited_practice')
            ],
            current: currentPlan === 'pro_monthly',
            popular: true,
        },
    ];

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
        setFeedbackData(null); // Reset feedback
        // Only show retention flow for Monthly subscriptions
        if (currentPlan === 'pro_monthly') {
            setCancelStep('offer_10');
        } else {
            setCancelStep('feedback'); // Non-monthly go straight to feedback
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
                    title: "Subscription Updated",
                    message: "It looks like your subscription was already canceled or invalid. Your account has been updated.",
                    onConfirm: () => window.location.reload()
                });
                return;
            }

            setInfoModal({
                isOpen: true,
                title: "Discount Applied",
                message: `Success! Your ${discountType === 'RETENTION_10' ? '10%' : '20%'} discount has been applied.`,
                onConfirm: () => window.location.reload()
            });
        } catch (error) {
            console.error(error);
            setError("Failed to apply discount. Please try again later.");
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>{t('subscription.back_to_profile')}</span>
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Current Plan Status */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('subscription.title')}</h1>
                    <p className="text-gray-600 dark:text-gray-400">{t('subscription.subtitle')}</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
                        {error}
                    </div>
                )}

                {/* Current Plan Card */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t('subscription.current_plan')}</h2>
                            <p className="text-3xl font-bold text-primary-600">{pricingPlans.find(p => p.current)?.name || t('subscription.plans.free')}</p>
                            {currentPlan === 'pro_sprint' && expiresAt && (
                                <p className={`text-sm mt-2 ${isExpired ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {isExpired ? t('subscription.expired_on') : t('subscription.expires_on')} {formatDate(expiresAt)}
                                </p>
                            )}
                            {currentPlan === 'pro_monthly' && subscriptionStatus && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {t('subscription.status')} <span className="capitalize">{subscriptionStatus.replace('_', ' ')}</span>
                                    </p>
                                    {subscriptionStatus === 'active' && (
                                        <button
                                            onClick={handleCancelClick}
                                            disabled={isLoading}
                                            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                                        >
                                            {isLoading ? 'Processing...' : 'Cancel Subscription'}
                                        </button>
                                    )}
                                    {subscriptionStatus === 'active_canceling' && (
                                        <p className="text-sm text-amber-600 mt-1">
                                            Your subscription will end after the current billing period.
                                        </p>
                                    )}
                                </div>
                            )}
                            <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                                {t('subscription.resume_storage')} <span className="font-medium">{t('subscription.resumes_max', { count: resumeLimit })}</span>
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium">
                                <Check className="w-4 h-4" />
                                {t('subscription.active')}
                            </div>
                            {userProfile?.role === 'academic_partner' && (
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium">
                                    <span className="text-xs">🎓</span>
                                    Academic Partner
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pricing Plans */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('subscription.available_plans')}</h2>
                    <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 animate-pulse">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        Limited Time Offer: 50% OFF All Plans
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pricingPlans.map((plan: any) => (
                        <div
                            key={plan.id}
                            className={`relative rounded-xl p-6 ${plan.popular
                                ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/30'
                                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800'
                                } ${plan.current ? 'ring-2 ring-primary-600' : ''}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                    <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
                                        {t('subscription.most_popular')}
                                    </span>
                                </div>
                            )}

                            {plan.discount && !plan.current && (
                                <div className="absolute top-0 right-0 p-4">
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded rotate-12 inline-block transform shadow-sm">
                                        {plan.discount}
                                    </span>
                                </div>
                            )}

                            {plan.current && (
                                <div className="absolute -top-3 right-4 z-10">
                                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                        <Check className="w-3 h-3" />
                                        {t('subscription.current_badge')}
                                    </span>
                                </div>
                            )}

                            <div className="mb-6 mt-2">
                                <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {plan.name}
                                </h3>
                                <div className="flex flex-col">
                                    {plan.originalPrice && (
                                        <span className={`text-sm line-through ${plan.popular ? 'text-white/60' : 'text-gray-400'}`}>
                                            {plan.originalPrice}
                                        </span>
                                    )}
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                            {plan.price}
                                        </span>
                                        <span className={`text-sm ${plan.popular ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {plan.period}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature: any, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-white' : 'text-primary-600'}`} />
                                        <span className={`text-sm ${plan.popular ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => plan.priceId && handleUpgrade(plan.priceId)}
                                disabled={plan.current || isLoading || !plan.priceId}
                                className={`w-full py-3 rounded-xl font-medium transition-all ${plan.current
                                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                                    : plan.popular
                                        ? 'bg-white text-primary-600 hover:bg-gray-100 shadow-lg'
                                        : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
                                    }`}
                            >
                                {plan.current ? t('subscription.btn_current') : plan.priceId ? t('subscription.btn_upgrade') : t('subscription.btn_free')}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Additional Info */}
                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('subscription.help_title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {t('subscription.help_text')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('subscription.help_note')}
                    </p>
                </div>
            </div>

            {/* Retention Modal Flow */}
            <RetentionModal
                isOpen={cancelStep === 'offer_10' || cancelStep === 'offer_20'}
                step={cancelStep === 'offer_10' ? 'offer_10' : 'offer_20'}
                onAccept={() => handleAcceptDiscount(cancelStep === 'offer_10' ? 'RETENTION_10' : 'RETENTION_20')}
                onDecline={() => {
                    if (cancelStep === 'offer_10') {
                        setCancelStep('offer_20');
                    } else {
                        setCancelStep('feedback'); // After retention decline, go to feedback
                    }
                }}
                isLoading={isLoading}
            />

            {/* Feedback Modal */}
            <CancellationFeedbackModal
                isOpen={cancelStep === 'feedback'}
                onCancel={() => setCancelStep('idle')}
                onConfirm={handleFeedbackSubmit}
                isLoading={isLoading}
            />

            {/* Info / Alert Modal */}
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

            {/* Final Confirmation Modal */}
            <ConfirmationModal
                isOpen={cancelStep === 'confirm'}
                onCancel={() => setCancelStep('idle')}
                onConfirm={processCancellation}
                title={t('subscription.cancel_title') || "Cancel Subscription?"}
                message={t('subscription.cancel_confirm') || "Are you sure you want to cancel? You will retain access to Pro features until the end of your current billing period."}
                confirmText="Yes, Cancel Subscription"
                cancelText="Keep My Plan"
                variant="danger"
            />
        </div>
    );
};

export default SubscriptionPage;
