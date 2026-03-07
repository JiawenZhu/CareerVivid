import React, { useState } from 'react';
import { Users, Zap, TrendingUp } from 'lucide-react';

const EnterpriseCalculator: React.FC = () => {
    const [seats, setSeats] = useState(10);
    const PRICE_PER_SEAT = 12;
    const CREDITS_PER_SEAT = 1200;

    const totalCost = seats * PRICE_PER_SEAT;
    const totalCredits = seats * CREDITS_PER_SEAT;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-lg max-w-4xl mx-auto mt-20">
            <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="flex-grow w-full">
                    <div className="flex items-center gap-3 mb-6">
                        <Users className="text-primary-600" size={24} />
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Enterprise Seat Calculator</h3>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Scale your team with pooled credits and private workspaces.
                        Adjust the slider to see your monthly investment.
                    </p>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Number of Developer Seats</span>
                            <span className="text-2xl font-black text-primary-600">{seats} Seats</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="500"
                            step="5"
                            value={seats}
                            onChange={(e) => setSeats(parseInt(e.target.value))}
                            className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                            <span>5 Seats</span>
                            <span>500+ Seats</span>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                    <div className="space-y-6">
                        <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Total Monthly Cost</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-gray-900 dark:text-white">${totalCost}</span>
                                <span className="text-sm font-bold text-gray-500">/mo</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap size={16} className="text-amber-500 fill-current" />
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Pooled Team Credits</span>
                            </div>
                            <div className="text-2xl font-black text-gray-900 dark:text-white">
                                {totalCredits.toLocaleString()} <span className="text-sm font-medium text-gray-500 tracking-normal">credits/mo</span>
                            </div>
                        </div>

                        <button className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2">
                            Contact Sales for Custom
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                    <TrendingUp size={14} className="text-green-500" />
                    SSO & RBAC Included
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                    <Users size={14} className="text-blue-500" />
                    Private Team Workspaces
                </div>
            </div>
        </div>
    );
};

export default EnterpriseCalculator;
