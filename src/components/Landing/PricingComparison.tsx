import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Github, Loader2 } from 'lucide-react';
import { navigate } from '../../utils/navigation';

interface PricingComparisonProps {
    onCloudUpgrade?: () => void;
    isLoading?: boolean;
}

export const PricingComparison: React.FC<PricingComparisonProps> = ({ onCloudUpgrade, isLoading }) => {
    const { t } = useTranslation();

    const features = [
        { name: 'Create Resumes', free: 'Unlimited (Local)', pro: 'Unlimited (Cloud Sync)' },
        { name: 'Portfolio Websites', free: 'Unlimited (Local)', pro: 'Unlimited (Cloud Sync)' },
        { name: 'Professional Templates', free: true, pro: true },
        { name: 'AI Generation & Editing', free: 'Bring Your Own Key', pro: 'Unlimited (Managed)' },
        { name: 'AI Interview Practice', free: 'Bring Your Own Key', pro: 'Unlimited (Managed)' },
        { name: 'PDF & Image Exports', free: true, pro: true },
        { name: 'Cloud Sync & Backup', free: false, pro: true },
        { name: 'Priority Support', free: false, pro: true },
        { name: 'Job Application Tracker', free: true, pro: true },
    ];

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-16">
                <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                    Pricing <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600 font-serif italic text-6xl sm:text-7xl font-normal lowercase align-middle">made simple</span>
                </h2>
                <p className="mt-6 text-2xl text-gray-600 dark:text-gray-400 font-medium">
                    Host it yourself for free, or let us manage the hassle.
                </p>
            </div>

            {/* Cards */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
                {/* Free Card */}
                <div className="bg-white dark:bg-gray-900 border-2 border-green-500 rounded-3xl p-10 shadow-lg relative flex flex-col">
                    <div className="text-center mb-6">
                        <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">Open Source</h3>
                        <div className="text-base text-gray-500 font-bold tracking-widest mt-2">SELF-HOSTED</div>
                    </div>
                    <div className="text-center mb-10">
                        <span className="text-7xl font-black text-gray-900 dark:text-white">$0</span>
                    </div>

                    <ul className="space-y-5 mb-10 flex-grow text-lg text-gray-700 dark:text-gray-300 font-medium">
                        <li className="flex items-center gap-4"><Check className="text-green-500 flex-shrink-0" size={24} /> Access to all core features</li>
                        <li className="flex items-center gap-4"><Check className="text-green-500 flex-shrink-0" size={24} /> Local template interpolation</li>
                        <li className="flex items-center gap-4"><Check className="text-green-500 flex-shrink-0" size={24} /> Manual Firebase setup</li>
                        <li className="flex items-center gap-4"><Check className="text-green-500 flex-shrink-0" size={24} /> Bring your own Gemini API Key</li>
                    </ul>
                    <a href="https://github.com/Jastalk/CareerVivid" target="_blank" rel="noopener noreferrer" className="w-full py-5 rounded-2xl font-extrabold text-lg text-center border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                        <Github size={24} /> View Documentation
                    </a>
                </div>

                {/* Pro Card */}
                <div className="bg-white dark:bg-gray-900 border-2 border-primary-500 rounded-3xl p-10 shadow-2xl relative flex flex-col transform md:-translate-y-4">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-500 text-white px-6 py-2 rounded-full text-sm font-extrabold shadow-md tracking-widest uppercase">
                        MOST POPULAR
                    </div>
                    <div className="text-center mb-6">
                        <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">CareerVivid Cloud</h3>
                        <div className="text-base text-primary-600 dark:text-primary-400 font-bold tracking-widest mt-2">MANAGED SaaS</div>
                    </div>
                    <div className="text-center mb-10 flex items-baseline justify-center gap-1">
                        <span className="text-7xl font-black text-gray-900 dark:text-white">$14.90</span>
                        <span className="text-xl text-gray-500 font-bold whitespace-nowrap">/mo</span>
                    </div>

                    <ul className="space-y-5 mb-10 flex-grow text-lg text-gray-700 dark:text-gray-300 font-medium">
                        <li className="flex items-center gap-4"><Check className="text-primary-500 flex-shrink-0" size={24} /> Zero setup required</li>
                        <li className="flex items-center gap-4"><Check className="text-primary-500 flex-shrink-0" size={24} /> Unlimited AI generation</li>
                        <li className="flex items-center gap-4"><Check className="text-primary-500 flex-shrink-0" size={24} /> Automatic cloud sync across devices</li>
                        <li className="flex items-center gap-4"><Check className="text-primary-500 flex-shrink-0" size={24} /> Priority support directly from founders</li>
                    </ul>
                    <button
                        onClick={() => onCloudUpgrade ? onCloudUpgrade() : navigate('/signup')}
                        disabled={isLoading}
                        className="w-full py-5 rounded-2xl font-extrabold text-lg text-center bg-primary-600 hover:bg-primary-700 text-white transition-all transform hover:scale-[1.02] shadow-xl shadow-primary-500/30 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center">
                        {isLoading ? <Loader2 className="animate-spin" size={28} /> : "Upgrade to Cloud"}
                    </button>
                </div>
            </div>

            {/* Matrix Comparison */}
            <div className="mt-24 overflow-x-auto">
                <div className="min-w-[800px] max-w-4xl mx-auto">
                    <div className="flex text-base font-extrabold uppercase tracking-widest text-gray-400 border-b-2 border-gray-200 dark:border-gray-800 pb-6 mb-6">
                        <div className="w-1/3 pl-6"></div>
                        <div className="w-1/3 text-center">Open Source</div>
                        <div className="w-1/3 text-center text-primary-600 dark:text-primary-500">Cloud</div>
                    </div>

                    {features.map((feature, idx) => (
                        <div key={idx} className="flex py-6 border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors items-center">
                            <div className="w-1/3 pl-6 font-bold text-lg text-gray-900 dark:text-white">{feature.name}</div>
                            <div className="w-1/3 flex justify-center items-center text-gray-700 dark:text-gray-300 text-base font-medium">
                                {typeof feature.free === 'boolean'
                                    ? (feature.free ? <Check className="text-green-500" size={28} /> : <X className="text-gray-300 dark:text-gray-600" size={28} />)
                                    : <span className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-bold">{feature.free}</span>
                                }
                            </div>
                            <div className="w-1/3 flex justify-center items-center text-gray-700 dark:text-gray-300 text-base font-medium">
                                {typeof feature.pro === 'boolean'
                                    ? (feature.pro ? <Check className="text-primary-500" size={28} /> : <X className="text-gray-300 dark:text-gray-600" size={28} />)
                                    : <span className="px-4 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-bold shadow-sm">{feature.pro}</span>
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
