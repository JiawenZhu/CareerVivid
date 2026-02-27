import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Loader2, Zap } from 'lucide-react';
import { navigate } from '../../utils/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface PricingComparisonProps {
    onCloudUpgrade?: () => void;
    isLoading?: boolean;
}

export const PricingComparison: React.FC<PricingComparisonProps> = ({ onCloudUpgrade, isLoading }) => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();

    const handleUpgradeClick = () => {
        if (currentUser) {
            navigate('/subscription');
        } else {
            navigate('/signup?redirect=/subscription');
        }
    };

    const features = [
        { name: 'Create Resumes', free: 'Unlimited (Manual) / 5 Credits (AI)', weekly: 'Unlimited (Manual) / 5 Credits (AI)', monthly: 'Unlimited (Manual) / 5 Credits (AI)' },
        { name: 'Portfolio Websites', free: 'Unlimited (Manual) / 5 Credits (AI)', weekly: 'Unlimited (Manual) / 5 Credits (AI)', monthly: 'Unlimited (Manual) / 5 Credits (AI)' },
        { name: 'Community Whiteboards', free: 'Unlimited (Manual)', weekly: 'Unlimited (Manual)', monthly: 'Unlimited (Manual)' },
        { name: 'AI Mock Interviews', free: '10 Credits / Session', weekly: '10 Credits / Session', monthly: '10 Credits / Session' },
        { name: 'AI Job Prep Notes', free: '10 Credits / Gen', weekly: '10 Credits / Gen', monthly: '10 Credits / Gen' },
        { name: 'Nano Banana Image Gen', free: false, weekly: true, monthly: true },
        { name: 'Priority Support', free: false, weekly: true, monthly: true }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-16">
                <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-4">
                    Universal <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">AI Credits</span>
                </h2>
                <p className="max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-400 font-medium">
                    Manual builders are free forever. When you want the magic of AI, simple credits power everything.
                </p>
            </div>

            {/* Cards */}
            <div className="grid lg:grid-cols-3 gap-8 mb-20 max-w-6xl mx-auto">
                {/* Free Card */}
                <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm relative flex flex-col">
                    <div className="text-center mb-6">
                        <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">Free Starter</h3>
                        <div className="text-sm text-green-600 dark:text-green-400 font-bold tracking-widest mt-2 flex items-center justify-center gap-1">
                            <Zap size={16} /> 100 STARTING CREDITS
                        </div>
                    </div>
                    <div className="text-center mb-8">
                        <span className="text-6xl font-black text-gray-900 dark:text-white">$0</span>
                    </div>

                    <ul className="space-y-4 mb-8 flex-grow text-gray-700 dark:text-gray-300 font-medium">
                        <li className="flex items-start gap-3"><Check className="text-green-500 flex-shrink-0 mt-0.5" size={20} /> Unlimited manual Resumes & Portfolios</li>
                        <li className="flex items-start gap-3"><Check className="text-green-500 flex-shrink-0 mt-0.5" size={20} /> Community Feed Access</li>
                        <li className="flex items-start gap-3"><Check className="text-green-500 flex-shrink-0 mt-0.5" size={20} /> 100 non-renewing AI credits included</li>
                    </ul>
                    <button onClick={() => navigate('/signup')} className="w-full py-4 rounded-2xl font-bold text-lg text-center border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Start for Free
                    </button>
                </div>

                {/* Weekly Pro */}
                <div className="bg-white dark:bg-gray-900 border-2 border-primary-400 dark:border-primary-600 rounded-3xl p-8 shadow-xl relative flex flex-col transform lg:-translate-y-4">
                    <div className="text-center mb-6">
                        <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">The 7-Day Sprint</h3>
                        <div className="text-sm text-primary-600 dark:text-primary-400 font-bold tracking-widest mt-2 flex items-center justify-center gap-1">
                            <Zap size={16} className="fill-current" /> 666 CREDITS / WEEK
                        </div>
                    </div>
                    <div className="text-center mb-8 flex items-baseline justify-center gap-1">
                        <span className="text-6xl font-black text-gray-900 dark:text-white">$9</span>
                        <span className="text-xl text-gray-500 font-bold">/wk</span>
                    </div>

                    <ul className="space-y-4 mb-8 flex-grow text-gray-700 dark:text-gray-300 font-medium">
                        <li className="flex items-start gap-3"><Check className="text-primary-500 flex-shrink-0 mt-0.5" size={20} /> Everything in Free</li>
                        <li className="flex items-start gap-3"><Check className="text-primary-500 flex-shrink-0 mt-0.5" size={20} /> 666 premium AI credits refilled weekly</li>
                        <li className="flex items-start gap-3"><Check className="text-primary-500 flex-shrink-0 mt-0.5" size={20} /> Access to Nano Banana Image Generation</li>
                        <li className="flex items-start gap-3"><Check className="text-primary-500 flex-shrink-0 mt-0.5" size={20} /> Priority Support</li>
                    </ul>
                    <button
                        onClick={handleUpgradeClick}
                        className="w-full py-4 rounded-2xl font-bold text-lg text-center bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-300 transition-colors flex items-center justify-center">
                        Choose The 7-Day Sprint
                    </button>
                </div>

                {/* Monthly Pro */}
                <div className="bg-white dark:bg-gray-900 border-2 border-purple-500 rounded-3xl p-8 shadow-2xl relative flex flex-col transform lg:-translate-y-8">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary-500 to-purple-500 text-white px-6 py-1.5 rounded-full text-xs font-extrabold shadow-lg tracking-widest uppercase">
                        MOST POPULAR
                    </div>
                    <div className="text-center mb-6">
                        <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">Monthly Pro</h3>
                        <div className="text-sm text-purple-600 dark:text-purple-400 font-bold tracking-widest mt-2 flex items-center justify-center gap-1">
                            <Zap size={16} className="fill-current" /> 888 CREDITS / MONTH
                        </div>
                    </div>
                    <div className="text-center mb-8 flex items-baseline justify-center gap-1">
                        <span className="text-6xl font-black text-gray-900 dark:text-white">$19</span>
                        <span className="text-xl text-gray-500 font-bold">/mo</span>
                    </div>

                    <ul className="space-y-4 mb-8 flex-grow text-gray-700 dark:text-gray-300 font-medium">
                        <li className="flex items-start gap-3"><Check className="text-purple-500 flex-shrink-0 mt-0.5" size={20} /> Best value for active job seekers</li>
                        <li className="flex items-start gap-3"><Check className="text-purple-500 flex-shrink-0 mt-0.5" size={20} /> 888 premium AI credits refilled monthly</li>
                        <li className="flex items-start gap-3"><Check className="text-purple-500 flex-shrink-0 mt-0.5" size={20} /> Full Interview Studio access</li>
                        <li className="flex items-start gap-3"><Check className="text-purple-500 flex-shrink-0 mt-0.5" size={20} /> Dedicated account management</li>
                    </ul>
                    <button
                        onClick={handleUpgradeClick}
                        className="w-full py-4 rounded-2xl font-bold text-lg text-center bg-purple-600 hover:bg-purple-700 text-white transition-all transform hover:scale-[1.02] shadow-xl shadow-purple-500/30 flex items-center justify-center">
                        Choose Monthly
                    </button>
                </div>
            </div>

            {/* Matrix Comparison */}
            <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm mx-auto">
                <div className="min-w-[900px]">
                    <div className="flex text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                        <div className="w-1/4 py-4 pl-6">Feature</div>
                        <div className="w-1/4 py-4 text-center">Free</div>
                        <div className="w-1/4 py-4 text-center text-primary-600 dark:text-primary-400">The 7-Day Sprint</div>
                        <div className="w-1/4 py-4 text-center text-purple-600 dark:text-purple-400">Monthly Pro</div>
                    </div>

                    {features.map((feature, idx) => (
                        <div key={idx} className={`flex items-center py-5 transition-colors ${idx !== features.length - 1 ? 'border-b border-gray-100 dark:border-gray-800/50' : ''}`}>
                            <div className="w-1/4 pl-6 font-bold text-[15px] text-gray-900 dark:text-white">{feature.name}</div>

                            {/* Free */}
                            <div className="w-1/4 flex justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                                {typeof feature.free === 'boolean'
                                    ? (feature.free ? <Check className="text-green-500" size={20} /> : <X className="text-gray-300 dark:text-gray-600" size={20} />)
                                    : <span className="text-center w-full px-2">{feature.free}</span>
                                }
                            </div>

                            {/* Weekly */}
                            <div className="w-1/4 flex justify-center text-sm font-medium text-gray-900 dark:text-white">
                                {typeof feature.weekly === 'boolean'
                                    ? (feature.weekly ? <Check className="text-primary-500" size={20} /> : <X className="text-gray-300 dark:text-gray-600" size={20} />)
                                    : <span className="text-center w-full px-2">{feature.weekly}</span>
                                }
                            </div>

                            {/* Monthly */}
                            <div className="w-1/4 flex justify-center text-sm font-medium text-gray-900 dark:text-white">
                                {typeof feature.monthly === 'boolean'
                                    ? (feature.monthly ? <Check className="text-purple-500" size={20} /> : <X className="text-gray-300 dark:text-gray-600" size={20} />)
                                    : <span className="text-center w-full px-2">{feature.monthly}</span>
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
