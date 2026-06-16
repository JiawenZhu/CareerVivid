import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { trackUsage } from '../services/trackingService';
import { navigate } from '../utils/navigation';
import { PricingComparison } from '../components/Landing/PricingComparison';
import { CreditCalculator } from '../components/Landing/CreditCalculator';
import EnterpriseCalculator from '../components/Landing/EnterpriseCalculator';
import { SUBSCRIPTION_CATALOG } from '../config/subscriptionCatalog';

const PricingPage: React.FC = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleChoosePlan = async (priceId: string | null) => {
        setError('');

        if (!currentUser) {
            navigate('/signup');
            return;
        }

        if (!priceId) {
            navigate('/');
            return;
        }

        setLoadingPriceId(priceId);

        try {
            await trackUsage(currentUser.uid, 'checkout_session_start', { priceId });

            const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
            const result: any = await createCheckoutSession({
                priceId,
                successUrl: `${window.location.origin}/#/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/#/pricing`,
            });

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
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col font-sans selection:bg-amber-200/60">
            <PublicHeader />
            <main className="flex-grow pt-32 pb-24 overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    {error && (
                        <motion.p 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="mb-8 text-center text-red-500 bg-red-100 dark:bg-red-900/20 p-4 rounded-xl font-medium"
                        >
                            {error}
                        </motion.p>
                    )}

                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7 }}
                        className="-mx-4 sm:mx-0"
                    >
                        <PricingComparison
                            onCloudUpgrade={(priceId) => handleChoosePlan(priceId)}
                            isLoading={loadingPriceId !== null}
                        />

                        <div className="mt-40">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-center mb-16"
                            >
                                <h2 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Enterprise Team Usage</h2>
                                <p className="text-base text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
                                    Pool AI credits across your entire team — {SUBSCRIPTION_CATALOG.enterprise.creditLimit.toLocaleString()} credits/seat at just ${SUBSCRIPTION_CATALOG.enterprise.monthlyPrice}/seat/month.
                                </p>
                            </motion.div>
                            <EnterpriseCalculator />
                        </div>

                        <div className="mt-40">
                            <CreditCalculator />
                        </div>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PricingPage;
