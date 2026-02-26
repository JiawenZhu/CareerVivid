
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { loadStripe } from '@stripe/stripe-js';
import { trackUsage } from '../services/trackingService';
import { navigate } from '../utils/navigation';
import { PricingComparison } from '../components/Landing/PricingComparison';




// Use live key for production
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51STFUtRJNflGxv32CayeCcXNHhUP08C5ECNWVVpBJsTUEWGuCOk4RAbvW9nHioDwk0vyQGgKDmBQeyZu5oGFcOel00UsdE352Z';
const stripePromise = STRIPE_PUBLISHABLE_KEY.startsWith('pk_') ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;


const PricingPage: React.FC = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleChoosePlan = async (priceId: string | null) => {
        setError('');

        // Check if user is logged in
        if (!currentUser) {
            navigate('/signup');
            return;
        }

        // Free tier - just navigate to dashboard
        if (!priceId) {
            navigate('/');
            return;
        }

        setLoadingPriceId(priceId);

        try {
            // Track checkout session start
            await trackUsage(currentUser.uid, 'checkout_session_start', { priceId });

            // Call Cloud Function to create checkout session
            const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
            const result: any = await createCheckoutSession({
                priceId,
                successUrl: `${window.location.origin}/#/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/#/pricing`,
            });

            // Redirect to Stripe Checkout
            if (result.data.url) {
                window.location.href = result.data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error: any) {
            console.error('Error creating checkout session:', error);
            setError(t('pricing.error_checkout'));
            setLoadingPriceId(null);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col font-sans">
            <PublicHeader />
            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-full text-sm font-bold mb-6 animate-pulse">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            Limited Time Offer: 50% OFF All Plans
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t('pricing.title')}</h1>
                        <p className="mt-6 text-xl text-gray-600 dark:text-gray-400">
                            {t('pricing.subtitle')}
                        </p>
                    </div>

                    {error && <p className="mt-8 text-center text-red-500 bg-red-100 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}

                    <div className="mt-8 -mx-4 sm:mx-0">
                        <PricingComparison
                            onCloudUpgrade={() => handleChoosePlan('price_1SXF15EqIOIAAUV01eD0To1q')}
                            isLoading={loadingPriceId !== null}
                        />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PricingPage;
