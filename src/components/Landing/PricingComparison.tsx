import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, Variants } from 'framer-motion';
import { Check, X, Loader2, Zap } from 'lucide-react';
import { navigate } from '../../utils/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { FREE_PLAN_CREDIT_LIMIT, PRO_PLAN_CREDIT_LIMIT, PRO_MAX_PLAN_CREDIT_LIMIT, ENTERPRISE_PLAN_CREDIT_LIMIT } from '../../config/creditCosts';

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
        { name: 'CLI Publish (Markdown/Mermaid)', free: '0 Credits', pro: '0 Credits', proMax: '0 Credits', enterprise: '0 Credits' },
        { name: 'ReactFlow UI Conversion', free: '5 Credits', pro: '5 Credits', proMax: '5 Credits', enterprise: '5 Credits' },
        { name: 'Architecture Auto-Gen', free: '10 Credits', pro: '10 Credits', proMax: '10 Credits', enterprise: '10 Credits' },
        { name: 'Living Documentation Sync', free: false, pro: true, proMax: true, enterprise: true },
        { name: 'Private Team Workspaces', free: false, pro: false, proMax: false, enterprise: true },
        { name: 'Nano Banana 2 (Iterative)', free: false, pro: false, proMax: '20 Credits', enterprise: '20 Credits' },
        { name: 'Technical Voice Interviews', free: '15 Credits', pro: '15 Credits', proMax: '15 Credits', enterprise: '15 Credits' },
        { name: 'Portfolio Review Analysis', free: '5 Credits', pro: '5 Credits', proMax: '5 Credits', enterprise: '5 Credits' },
        { name: 'Advanced RBAC & SSO', free: false, pro: false, proMax: false, enterprise: true },
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-20">
                <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-6">
                    Scale with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">DevTool Credits</span>
                </h2>
                <p className="max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-400 font-medium">
                    Built for high-volume developers. Publish architectures for free,
                    and use automated intelligence when precision matters.
                </p>
            </div>

            {/* 4-Tier Grid */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 mb-24"
            >
                {/* Community */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm flex flex-col group hover:shadow-md transition-shadow">
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Community</h3>
                        <p className="text-sm text-gray-500 font-medium">For hobbyists & open-source.</p>
                    </div>
                    <div className="mb-8">
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-gray-900 dark:text-white">$0</span>
                        </div>
                        <div className="text-xs text-green-600 font-bold tracking-widest mt-3 uppercase bg-green-50 dark:bg-green-900/20 inline-block px-3 py-1 rounded-full">
                            50 Credits / mo
                        </div>
                    </div>
                    <ul className="space-y-4 mb-8 flex-grow text-sm font-medium text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-3"><Check className="text-green-500 flex-shrink-0" size={20} /> <span className="leading-tight">Public CLI Publishing</span></li>
                        <li className="flex items-start gap-3"><Check className="text-green-500 flex-shrink-0" size={20} /> <span className="leading-tight">Mermaid.js Rendering</span></li>
                        <li className="flex items-start gap-3"><Check className="text-green-500 flex-shrink-0" size={20} /> <span className="leading-tight">Community Feed</span></li>
                    </ul>
                    <button onClick={() => navigate('/signup')} className="w-full py-4 rounded-xl font-bold border-2 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
                        Join Community
                    </button>
                </motion.div>

                {/* Pro */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 border-2 border-primary-500/30 rounded-3xl p-8 shadow-xl flex flex-col relative overflow-hidden group hover:border-primary-500/50 transition-colors">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-400 to-primary-600 hidden group-hover:block" />
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pro</h3>
                        <p className="text-sm text-gray-500 font-medium">For active developers.</p>
                    </div>
                    <div className="mb-8">
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-gray-900 dark:text-white">$6</span>
                            <span className="text-gray-500 text-sm font-bold">/mo</span>
                        </div>
                        <div className="text-xs text-primary-600 font-bold tracking-widest mt-3 uppercase bg-primary-50 dark:bg-primary-900/20 inline-block px-3 py-1 rounded-full">
                            666 Credits / mo
                        </div>
                    </div>
                    <ul className="space-y-4 mb-8 flex-grow text-sm font-medium text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-3"><Check className="text-primary-500 flex-shrink-0" size={20} /> <span className="leading-tight">Unlisted Posts</span></li>
                        <li className="flex items-start gap-3"><Check className="text-primary-500 flex-shrink-0" size={20} /> <span className="leading-tight">Custom Domains</span></li>
                        <li className="flex items-start gap-3"><Check className="text-primary-500 flex-shrink-0" size={20} /> <span className="leading-tight">Living Doc Sync</span></li>
                    </ul>
                    <button onClick={handleUpgradeClick} className="w-full py-4 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/25">
                        Try Pro
                    </button>
                </motion.div>

                {/* Pro Max */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 border-2 border-purple-500 rounded-3xl p-8 shadow-2xl flex flex-col relative overflow-hidden group">
                    {/* Glowing background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 blur-3xl rounded-full" />
                    
                    <div className="absolute -right-10 top-6 rotate-45 bg-purple-500 text-white text-[10px] font-black px-12 py-1 shadow-md">POWER</div>
                    
                    <div className="mb-8 relative z-10">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pro Max</h3>
                        <p className="text-sm text-gray-500 font-medium">For power users.</p>
                    </div>
                    <div className="mb-8 relative z-10">
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-gray-900 dark:text-white">$8</span>
                            <span className="text-gray-500 text-sm font-bold">/mo</span>
                        </div>
                        <div className="text-xs text-purple-600 font-bold tracking-widest mt-3 uppercase bg-purple-50 dark:bg-purple-900/20 inline-block px-3 py-1 rounded-full border border-purple-100 dark:border-purple-800/50">
                            888 Credits / mo
                        </div>
                    </div>
                    <ul className="space-y-4 mb-8 flex-grow text-sm font-medium text-gray-600 dark:text-gray-400 relative z-10">
                        <li className="flex items-start gap-3"><Check className="text-purple-500 flex-shrink-0" size={20} /> <span className="leading-tight">Private Posts</span></li>
                        <li className="flex items-start gap-3"><Check className="text-purple-500 flex-shrink-0" size={20} /> <span className="leading-tight">Advanced ReactFlow</span></li>
                        <li className="flex items-start gap-3"><Check className="text-purple-500 flex-shrink-0" size={20} /> <span className="leading-tight">Nano Banana 2</span></li>
                    </ul>
                    <button onClick={handleUpgradeClick} className="w-full py-4 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-xl shadow-purple-600/30 relative z-10">
                        Get Pro Max
                    </button>
                </motion.div>

                {/* Enterprise */}
                <motion.div variants={itemVariants} className="bg-gray-900 dark:bg-black text-white rounded-3xl p-8 shadow-2xl flex flex-col relative overflow-hidden border border-gray-800">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-800/50 blur-2xl rounded-full" />
                    <div className="mb-8 relative z-10">
                        <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                        <p className="text-sm text-gray-400 font-medium">For engineering teams.</p>
                    </div>
                    <div className="mb-8 relative z-10">
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black">$12</span>
                            <span className="text-gray-400 text-sm font-bold">/seat</span>
                        </div>
                        <div className="text-xs text-amber-400 font-bold tracking-widest mt-3 uppercase bg-amber-400/10 inline-block px-3 py-1 rounded-full border border-amber-400/20">
                            1200 Pooled Credits
                        </div>
                    </div>
                    <ul className="space-y-4 mb-8 flex-grow text-sm font-medium text-gray-300 relative z-10">
                        <li className="flex items-start gap-3"><Check className="text-amber-400 flex-shrink-0" size={20} /> <span className="leading-tight">Private Workspaces</span></li>
                        <li className="flex items-start gap-3"><Check className="text-amber-400 flex-shrink-0" size={20} /> <span className="leading-tight">SSO & SCIM</span></li>
                        <li className="flex items-start gap-3"><Check className="text-amber-400 flex-shrink-0" size={20} /> <span className="leading-tight">Team RBAC</span></li>
                    </ul>
                    <button onClick={handleUpgradeClick} className="w-full py-4 rounded-xl font-bold bg-white text-gray-900 hover:bg-gray-100 transition-colors relative z-10">
                        Enterprise
                    </button>
                </motion.div>
            </motion.div>

            {/* Feature Table */}
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mt-20 overflow-hidden bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/80 text-xs font-black uppercase tracking-widest text-gray-500">
                                <th className="p-6 border-b border-gray-200 dark:border-gray-800">Capabilities</th>
                                <th className="p-6 border-b border-gray-200 dark:border-gray-800 text-center w-40">Community</th>
                                <th className="p-6 border-b border-gray-200 dark:border-gray-800 text-center w-40">Pro</th>
                                <th className="p-6 border-b border-gray-200 dark:border-gray-800 text-center w-40 text-purple-600 dark:text-purple-400">Pro Max</th>
                                <th className="p-6 border-b border-gray-200 dark:border-gray-800 text-center w-40">Enterprise</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {features.map((f, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                                    <td className="p-6 font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800/50 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        {f.name}
                                    </td>
                                    <td className="p-6 text-center border-b border-gray-100 dark:border-gray-800/50 font-medium">
                                        {typeof f.free === 'string' ? <span className="text-gray-600 dark:text-gray-400">{f.free}</span> : f.free ? <Check className="mx-auto text-green-500" strokeWidth={3} size={20} /> : <X className="mx-auto text-gray-300 dark:text-gray-600" size={20} />}
                                    </td>
                                    <td className="p-6 text-center border-b border-gray-100 dark:border-gray-800/50 font-medium">
                                        {typeof f.pro === 'string' ? <span className="text-gray-600 dark:text-gray-400">{f.pro}</span> : f.pro ? <Check className="mx-auto text-primary-500" strokeWidth={3} size={20} /> : <X className="mx-auto text-gray-300 dark:text-gray-600" size={20} />}
                                    </td>
                                    <td className="p-6 text-center border-b border-gray-100 dark:border-gray-800/50 font-bold text-purple-600 bg-purple-50/30 dark:bg-purple-900/10">
                                        {typeof f.proMax === 'string' ? f.proMax : f.proMax ? <Check className="mx-auto" strokeWidth={3} size={20} /> : <X className="mx-auto text-purple-200 dark:text-purple-800" size={20} />}
                                    </td>
                                    <td className="p-6 text-center border-b border-gray-100 dark:border-gray-800/50 font-medium">
                                        {typeof f.enterprise === 'string' ? <span className="text-gray-600 dark:text-gray-400">{f.enterprise}</span> : f.enterprise ? <Check className="mx-auto text-amber-500" strokeWidth={3} size={20} /> : <X className="mx-auto text-gray-300 dark:text-gray-600" size={20} />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

