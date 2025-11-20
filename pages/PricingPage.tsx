
import React, { useState, useEffect } from 'react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { loadStripe } from '@stripe/stripe-js';
import { trackUsage } from '../services/trackingService';
import { navigate } from '../App';


// NOTE: Price IDs are kept for when payment features are re-enabled.
const pricingPlans = [
    {
        name: 'Sprint',
        price: '$0',
        duration: 'Free for now',
        priceId: 'price_1PflAVRJNflGxv32rIbzpj2m', // Kept for future use
        features: [
            'Unlimited Resumes',
            'All Professional Templates',
            'AI Content Generation',
            'PDF & Image Exports',
            'Unlimited Interview Practice',
        ],
        cta: 'Start for Free',
    },
    {
        name: 'Booster',
        price: '$0',
        duration: 'Free for now',
        priceId: 'price_1PflBvRJNflGxv32KLp2T20e', // Kept for future use
        features: [
            'Unlimited Resumes',
            'All Professional Templates',
            'AI Content Generation',
            'PDF & Image Exports',
            'Unlimited Interview Practice',
        ],
        cta: 'Start for Free',
    },
    {
        name: 'Standard',
        price: '$0',
        duration: 'Free for now',
        priceId: 'price_1PflCkRJNflGxv32cTqL13DD', // Kept for future use
        features: [
            'Unlimited Resumes',
            'All Professional Templates',
            'AI Content Generation',
            'AI Photo Editing',
            'PDF & Image Exports',
            'Unlimited Interview Practice',
        ],
        cta: 'Start for Free',
        popular: true,
    },
    {
        name: 'Marathon',
        price: '$0',
        duration: 'Free for now',
        priceId: 'price_1PflDWRJNflGxv321CUKsDHH', // Kept for future use
        features: [
            'Unlimited Resumes',
            'All Professional Templates',
            'AI Content Generation',
            'AI Photo Editing',
            'PDF & Image Exports',
            'Unlimited Interview Practice',
        ],
        cta: 'Start for Free',
    },
];

// NOTE: Publishable key is kept for when payment features are re-enabled.
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51STFUtRJNflGxv32CayeCcXNHhUP08C5ECNWVVpBJsTUEWGuCOk4RAbvW9nHioDwk0vyQGgKDmBQeyZu5oGFcOel00UsdE352Z';
const stripePromise = STRIPE_PUBLISHABLE_KEY.startsWith('pk_') ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;


const PricingPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleChoosePlan = async (priceId: string) => {
        setError('');

        // NEW LOGIC: Since all plans are free, just navigate to the app.
        if (!currentUser) {
            navigate('/auth'); // Go to sign-in page if not logged in
        } else {
            navigate('/'); // Go to dashboard if logged in
        }
        return;
    };

    return (
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col font-sans">
            <PublicHeader />
            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">All Features are Currently Free!</h1>
                        <p className="mt-6 text-xl text-gray-600 dark:text-gray-400">
                            Enjoy unlimited access to all premium features during our beta period. No credit card required.
                        </p>
                    </div>

                    {error && <p className="mt-8 text-center text-red-500 bg-red-100 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>}
                    
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {pricingPlans.map((plan) => (
                            <div key={plan.name} className={`rounded-3xl p-8 border ${plan.popular ? 'border-primary-500 border-2 relative' : 'border-gray-200 dark:border-gray-800'} bg-white dark:bg-gray-900 shadow-lg flex flex-col transform hover:-translate-y-1 transition-transform`}>
                                {plan.popular && (
                                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                                        <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</span>
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                <div className="mt-4">
                                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mt-1"> {plan.duration}</span>
                                </div>
                                <ul className="mt-8 space-y-4 text-sm text-gray-600 dark:text-gray-300 flex-grow">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start">
                                            <CheckCircle className="flex-shrink-0 w-5 h-5 text-primary-500 mr-3 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => handleChoosePlan(plan.priceId)}
                                    disabled={loadingPriceId === plan.priceId}
                                    className={`mt-8 block w-full text-center rounded-xl px-6 py-3 text-sm font-bold transition-colors disabled:opacity-50 ${plan.popular ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                    {loadingPriceId === plan.priceId ? <Loader2 className="animate-spin mx-auto" /> : plan.cta}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PricingPage;
