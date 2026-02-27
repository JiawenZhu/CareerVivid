import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, LayoutTemplate, Mic, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Base constants for credit costs
const COSTS = {
    resume: 5,
    portfolio: 5,
    interview: 10,
    jobPrep: 10
};

const TIERS = {
    free: { name: 'Free', limit: 100, color: 'bg-green-500' },
    weekly: { name: '7-Day Sprint', limit: 666, color: 'bg-primary-500' },
    monthly: { name: 'Monthly Pro', limit: 888, color: 'bg-purple-500' }
};

type TierKey = keyof typeof TIERS;

const CreditCalculator: React.FC = () => {
    const { t } = useTranslation();

    // State for user inputs
    const [counts, setCounts] = useState({
        resume: 4,
        portfolio: 2,
        interview: 5,
        jobPrep: 10
    });

    // Currently selected tier for visualization
    const [selectedTier, setSelectedTier] = useState<TierKey>('weekly');

    const handleCountChange = (key: keyof typeof counts, value: number) => {
        setCounts(prev => ({ ...prev, [key]: Math.max(0, value) }));
    };

    // Calculate total cost based on current inputs
    const totalCost = (counts.resume * COSTS.resume) +
        (counts.portfolio * COSTS.portfolio) +
        (counts.interview * COSTS.interview) +
        (counts.jobPrep * COSTS.jobPrep);

    const maxLimit = TIERS[selectedTier].limit;
    const isExceeded = totalCost > maxLimit;
    const percentage = Math.min((totalCost / maxLimit) * 100, 100);

    return (
        <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-bold mb-6">
                        <Sparkles size={16} /> Interactive Credit Calculator
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                        Build your perfect AI setup.
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 font-medium max-w-2xl mx-auto">
                        CareerVivid uses a universal AI Credit system. See how far credits go based on your estimated monthly or weekly job search activity.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-start">

                    {/* Left Column: Interactive Inputs */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Estimated Usage</h3>

                        <div className="space-y-8">
                            {/* Input: Resumes */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg"><FileText size={20} /></div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">Full AI Resumes</div>
                                            <div className="text-xs text-gray-500 font-medium">{COSTS.resume} credits / generation</div>
                                        </div>
                                    </div>
                                    <div className="text-xl font-black text-gray-900 dark:text-white">{counts.resume}</div>
                                </div>
                                <input
                                    type="range" min="0" max="50" step="1"
                                    value={counts.resume}
                                    onChange={(e) => handleCountChange('resume', parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>

                            {/* Input: Portfolios */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-pink-50 dark:bg-pink-900/30 text-pink-600 rounded-lg"><LayoutTemplate size={20} /></div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">AI Web Portfolios</div>
                                            <div className="text-xs text-gray-500 font-medium">{COSTS.portfolio} credits / generation</div>
                                        </div>
                                    </div>
                                    <div className="text-xl font-black text-gray-900 dark:text-white">{counts.portfolio}</div>
                                </div>
                                <input
                                    type="range" min="0" max="20" step="1"
                                    value={counts.portfolio}
                                    onChange={(e) => handleCountChange('portfolio', parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                                />
                            </div>

                            {/* Input: Mock Interviews */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg"><Mic size={20} /></div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">Voice Mock Interviews</div>
                                            <div className="text-xs text-gray-500 font-medium">{COSTS.interview} credits / session</div>
                                        </div>
                                    </div>
                                    <div className="text-xl font-black text-gray-900 dark:text-white">{counts.interview}</div>
                                </div>
                                <input
                                    type="range" min="0" max="40" step="1"
                                    value={counts.interview}
                                    onChange={(e) => handleCountChange('interview', parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                            </div>

                            {/* Input: Job Prep */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-lg"><Wand2 size={20} /></div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">Targeted Job Prep Notes</div>
                                            <div className="text-xs text-gray-500 font-medium">{COSTS.jobPrep} credits / generation</div>
                                        </div>
                                    </div>
                                    <div className="text-xl font-black text-gray-900 dark:text-white">{counts.jobPrep}</div>
                                </div>
                                <input
                                    type="range" min="0" max="40" step="1"
                                    value={counts.jobPrep}
                                    onChange={(e) => handleCountChange('jobPrep', parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Visualizer */}
                    <div className="bg-gray-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col h-full border border-gray-800">
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <Sparkles size={200} />
                        </div>

                        <div className="relative z-10 flex-grow flex flex-col justify-between h-full">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-6">Select a Tier to Compare</h3>

                                {/* Tier Toggles */}
                                <div className="flex bg-gray-800 rounded-xl p-1 mb-10 w-full md:w-fit">
                                    {(Object.keys(TIERS) as TierKey[]).map(key => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedTier(key)}
                                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${selectedTier === key ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            {TIERS[key].name} ({TIERS[key].limit})
                                        </button>
                                    ))}
                                </div>

                                <div className="mb-2 flex justify-between items-end">
                                    <div className="text-gray-400 font-medium">Projected Usage</div>
                                    <div className="text-right">
                                        <div className={`text-5xl font-black ${isExceeded ? 'text-red-400' : 'text-white'}`}>
                                            {totalCost}
                                        </div>
                                        <div className="text-sm text-gray-500 font-bold mt-1">/ {maxLimit} credits</div>
                                    </div>
                                </div>

                                {/* Dynamic Progress Bar */}
                                <div className="w-full bg-gray-800 rounded-full h-6 mb-4 overflow-hidden shadow-inner p-1">
                                    <motion.div
                                        className={`h-full rounded-full ${isExceeded ? 'bg-red-500' : TIERS[selectedTier].color} relative`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ type: "spring", stiffness: 60, damping: 15 }}
                                    >
                                        {/* Optional: Add a subtle striped animation to the bar if active */}
                                        <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }}></div>
                                    </motion.div>
                                </div>

                                {isExceeded && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm font-bold flex items-start gap-3"
                                    >
                                        ⚠️ You'll need a higher plan for this much AI power!
                                    </motion.div>
                                )}
                                {!isExceeded && totalCost > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="text-gray-400 text-sm font-medium flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={16} className="text-green-400" /> This easily fits within the {TIERS[selectedTier].name} tier.
                                    </motion.div>
                                )}
                            </div>

                            <div className="mt-12 pt-8 border-t border-gray-800 text-center">
                                <p className="text-sm text-gray-500 mb-4 font-medium italic">All manual content creation remains free & unlimited!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CreditCalculator;
