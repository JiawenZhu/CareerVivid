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
import CreditCalculator from '../components/Landing/CreditCalculator';
import EnterpriseCalculator from '../components/Landing/EnterpriseCalculator';

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
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col font-sans selection:bg-primary-500/30">
            <PublicHeader />
            <main className="flex-grow pt-32 pb-24 overflow-hidden relative">
                {/* Background glowing orb */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-500/10 dark:bg-primary-600/10 blur-[120px] rounded-full point-events-none -z-10" />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-900/40 dark:to-orange-900/40 text-red-700 dark:text-red-400 px-5 py-2 rounded-full text-sm font-bold mb-8 shadow-sm border border-red-200/50 dark:border-red-800/50"
                        >
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                            DevTool Launch: 50% OFF All Plans
                        </motion.div>
                        
                        <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.1]">
                            Automated Architecture <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                                & Living Documentation
                            </span>
                        </h1>
                        <p className="mt-8 text-xl sm:text-2xl text-gray-600 dark:text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
                            Scale your knowledge with MCP Syncing, CLI integration, and high-volume AI credits designed for modern engineering teams.
                        </p>
                    </motion.div>

                    {error && (
                        <motion.p 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="mt-8 text-center text-red-500 bg-red-100 dark:bg-red-900/20 p-4 rounded-xl font-medium"
                        >
                            {error}
                        </motion.p>
                    )}

                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="mt-16 -mx-4 sm:mx-0"
                    >
                        <PricingComparison
                            onCloudUpgrade={() => handleChoosePlan('price_1SXF15EqIOIAAUV01eD0To1q')}
                            isLoading={loadingPriceId !== null}
                        />

                        <div className="mt-40">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-center mb-16"
                            >
                                <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Estimate Team Usage</h2>
                                <p className="text-xl text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">Scale your engineering team with pooled credits at just $12 per seat.</p>
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
