import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Zap, TrendingUp, Handshake } from 'lucide-react';
import { SUBSCRIPTION_CATALOG } from '../../config/subscriptionCatalog';

const EnterpriseCalculator: React.FC = () => {
    const [seats, setSeats] = useState(10);
    const PRICE_PER_SEAT = SUBSCRIPTION_CATALOG.enterprise.monthlyPrice;
    const CREDITS_PER_SEAT = SUBSCRIPTION_CATALOG.enterprise.creditLimit;

    const totalCost = seats * PRICE_PER_SEAT;
    const totalCredits = seats * CREDITS_PER_SEAT;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className="bg-white dark:bg-gray-900 rounded-[1.6rem] p-8 md:p-12 border border-gray-100 dark:border-gray-800 shadow-sm max-w-5xl mx-auto mt-12 relative overflow-hidden group"
        >
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                <div className="flex-grow w-full">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-[#fff7eb] dark:bg-[#302a22] text-[#a97935] rounded-2xl">
                            <Users size={28} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Enterprise Seats</h3>
                    </div>

                    <p className="text-base text-gray-600 dark:text-gray-400 mb-10 font-medium">
                        Scale your team with pooled credits and private workspaces.
                        Adjust the slider to see your monthly investment.
                    </p>

                    <div className="space-y-8 bg-gray-50/50 dark:bg-gray-800/20 p-8 rounded-3xl border border-gray-100 dark:border-gray-800/50">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Team Size</span>
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">{seats}</span>
                        </div>
                        <input
                            type="range"
                            min={SUBSCRIPTION_CATALOG.enterprise.minimumSeats}
                            max="500"
                            step="1"
                            value={seats}
                            onChange={(e) => setSeats(parseInt(e.target.value))}
                            className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#a97935] transition-all hover:h-4"
                        />
                        <div className="flex justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            <span>{SUBSCRIPTION_CATALOG.enterprise.minimumSeats}</span>
                            <span>500+</span>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-96 flex-shrink-0 bg-gray-900 dark:bg-black rounded-[1.4rem] p-8 border border-gray-800 relative shadow-sm">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Zap size={100} />
                    </div>
                    
                    <div className="space-y-8 relative z-10">
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Total Monthly Cost</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-bold text-white">${totalCost.toLocaleString()}</span>
                                <span className="text-gray-400 font-semibold">/mo</span>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-800">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap size={18} className="text-amber-400 fill-current" />
                                <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Pooled Credits</span>
                            </div>
                            <div className="text-3xl font-bold text-white">
                                {totalCredits.toLocaleString()} <span className="text-lg font-medium text-gray-500 tracking-normal">/mo</span>
                            </div>
                        </div>

                        <button className="w-full py-4 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center gap-3">
                            <Handshake size={20} />
                            Contact Sales
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/80 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700/50">
                    <TrendingUp size={16} className="text-green-500" />
                    SSO & RBAC Included
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/80 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700/50">
                    <Users size={16} className="text-blue-500" />
                    Private Team Workspaces
                </div>
            </div>
        </motion.div>
    );
};

export default EnterpriseCalculator;
