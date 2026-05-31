import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Zap, TrendingUp, Handshake } from 'lucide-react';

const EnterpriseCalculator: React.FC = () => {
    const [seats, setSeats] = useState(10);
    const PRICE_PER_SEAT = 12;
    const CREDITS_PER_SEAT = 1200;

    const totalCost = seats * PRICE_PER_SEAT;
    const totalCredits = seats * CREDITS_PER_SEAT;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className="bg-white/92 rounded-2xl p-8 md:p-12 border border-[#e0d7ca] shadow-sm max-w-5xl mx-auto mt-12 relative overflow-hidden group"
        >
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#eef4ff]/70 blur-[100px] rounded-full point-events-none -z-10 transition-colors duration-700" />
            
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                <div className="flex-grow w-full">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-[#eef4ff] text-[#2563eb] rounded-2xl">
                            <Users size={28} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-3xl font-extrabold text-[#211b16] tracking-tight">Enterprise Seats</h3>
                    </div>

                    <p className="text-lg text-[#665a4a] mb-10 font-medium">
                        Scale your team with pooled credits and private workspaces.
                        Adjust the slider to see your monthly investment.
                    </p>

                    <div className="space-y-8 bg-[#fffaf1] p-8 rounded-2xl border border-[#e4d3bc]">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-bold text-[#a97935] uppercase tracking-widest">Team Size</span>
                            <span className="text-4xl font-black text-[#211b16]">{seats}</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="500"
                            step="5"
                            value={seats}
                            onChange={(e) => setSeats(parseInt(e.target.value))}
                            className="w-full h-3 bg-[#dbe4f3] rounded-lg appearance-none cursor-pointer accent-[#2563eb] transition-all hover:h-4"
                        />
                        <div className="flex justify-between text-xs font-bold text-[#7d6e5e] uppercase tracking-wider">
                            <span>5</span>
                            <span>500+</span>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-96 flex-shrink-0 bg-[#f8fafc] rounded-2xl p-8 border border-[#dbe4f3] relative shadow-sm">
                    <div className="absolute top-0 right-0 p-8 opacity-10 text-[#2563eb]">
                        <Zap size={100} />
                    </div>
                    
                    <div className="space-y-8 relative z-10">
                        <div>
                            <span className="text-xs font-bold text-[#64748b] uppercase tracking-widest block mb-2">Total Monthly Cost</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-[#211b16]">${totalCost.toLocaleString()}</span>
                                <span className="text-[#665a4a] font-bold">/mo</span>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-[#dbe4f3]">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap size={18} className="text-[#2563eb] fill-current" />
                                <span className="text-sm font-bold text-[#64748b] uppercase tracking-widest">Pooled Credits</span>
                            </div>
                            <div className="text-3xl font-black text-[#211b16]">
                                {totalCredits.toLocaleString()} <span className="text-lg font-medium text-[#665a4a] tracking-normal">/mo</span>
                            </div>
                        </div>

                        <button className="w-full py-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-bold shadow-md shadow-blue-600/15 transition-all flex items-center justify-center gap-3">
                            <Handshake size={20} />
                            Contact Sales
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2 text-sm font-bold text-[#665a4a] bg-[#fffaf1] px-4 py-2 rounded-xl border border-[#e4d3bc]">
                    <TrendingUp size={16} className="text-green-500" />
                    SSO & RBAC Included
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#665a4a] bg-[#fffaf1] px-4 py-2 rounded-xl border border-[#e4d3bc]">
                    <Users size={16} className="text-blue-500" />
                    Private Team Workspaces
                </div>
            </div>
        </motion.div>
    );
};

export default EnterpriseCalculator;
