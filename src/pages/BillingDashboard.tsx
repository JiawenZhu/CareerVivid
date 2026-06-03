import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';
import {
    ArrowLeft,
    Check,
    CreditCard,
    Users,
    Shield,
    Settings,
    Plus,
    Trash2,
    Zap,
    Layout,
    Database
} from 'lucide-react';
import { motion } from 'framer-motion';
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { trackUsage } from '../services/trackingService';
import {
    FREE_PLAN_CREDIT_LIMIT,
    PRO_PLAN_CREDIT_LIMIT,
    PRO_MAX_PLAN_CREDIT_LIMIT,
    ENTERPRISE_PLAN_CREDIT_LIMIT
} from '../config/creditCosts';
import AIUsageProgressBar from '../components/AIUsageProgressBar';

const BillingDashboard: React.FC = () => {
    const { currentUser, userProfile, isPremium, aiUsage } = useAuth();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [newTeamMember, setNewTeamMember] = useState('');

    const currentPlan = userProfile?.plan || 'free';
    const isEnterprise = currentPlan === 'enterprise';

    const plans = [
        { id: 'pro', name: 'Pro', price: '$9', limit: PRO_PLAN_CREDIT_LIMIT, priceId: 'price_1TJoONRJNflGxv32zSqxC9bZ' },
        { id: 'max', name: 'Max', price: '$29', limit: PRO_MAX_PLAN_CREDIT_LIMIT, priceId: 'price_1TJoONRJNflGxv32wxPHw9FR' },
        { id: 'enterprise', name: 'Enterprise', price: '$12/seat', limit: ENTERPRISE_PLAN_CREDIT_LIMIT, priceId: 'price_1TJoQyRJNflGxv32FQ9TxIjq' }
    ];

    const handleUpgrade = async (priceId: string) => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
            const result: any = await createCheckoutSession({
                priceId,
                successUrl: `${window.location.origin}/#/billing?success=true`,
                cancelUrl: `${window.location.origin}/#/billing`,
            });
            if (result.data.url) window.location.href = result.data.url;
        } catch (err) {
            setError('Checkout failed. Please try again.');
            setIsLoading(false);
        }
    };

    const getReadablePlanName = (plan: string) => {
        switch (plan) {
            case 'pro': return 'Pro';
            case 'max':
            case 'pro_max': return 'Max';
            case 'enterprise': return 'Enterprise';
            case 'premium':
            case 'pro_monthly':
            case 'pro_sprint':
                return 'Pro (Legacy)';
            case 'free': return 'Free';
            default: return plan;
        }
    };

    const readablePlan = getReadablePlanName(currentPlan);

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 font-sans selection:bg-primary-500/30 relative overflow-hidden">
            {/* Background glowing orb matching pricing page */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-500/10 dark:bg-primary-600/10 blur-[120px] rounded-full pointer-events-none z-0" />
            
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-10 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-900 dark:text-white hover:opacity-70 transition-all group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform stroke-[2.5]" />
                        <span className="text-sm font-semibold">Dashboard</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-1.5 bg-gradient-to-r from-primary-500/10 to-purple-500/10 dark:from-primary-900/40 dark:to-purple-900/40 text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-800/50 rounded-full text-xs font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                            </span>
                            {readablePlan}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="grid lg:grid-cols-3 gap-8"
                >
                    {/* Left Column: Sub & Usage */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Plan Summary Card */}
                        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 dark:border-gray-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Billing & Plan</h2>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mt-1">Manage your DevTool subscription</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="relative overflow-hidden p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 group hover:border-primary-500/30 transition-colors">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Shield size={64} />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-3">Active Plan</span>
                                    <div className="flex items-baseline gap-2 relative z-10">
                                        <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600 capitalize tracking-tight">{readablePlan}</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 italic block mt-1 relative z-10">Monthly Subscription</span>
                                </div>
                                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-500/30 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">AI Credit Usage</span>
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    </div>
                                    {aiUsage && (
                                        <AIUsageProgressBar
                                            used={aiUsage.count}
                                            limit={aiUsage.limit}
                                            isPremium={isPremium}
                                            variant="minimal"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Enterprise Team Management */}
                        {isEnterprise && (
                            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-amber-500/30 shadow-lg shadow-amber-500/5">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="p-3.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl text-white shadow-lg shadow-amber-500/20">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Team Management</h2>
                                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mt-1">Managing {userProfile?.seats || 1} Developer Seats</p>
                                        </div>
                                    </div>
                                    <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:rotate-90">
                                        <Settings size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex gap-3">
                                        <div className="relative flex-grow">
                                            <input
                                                type="email"
                                                placeholder="developer@company.com"
                                                value={newTeamMember}
                                                onChange={(e) => setNewTeamMember(e.target.value)}
                                                className="w-full bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all dark:text-white placeholder-gray-400"
                                            />
                                        </div>
                                        <button className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-200 dark:text-gray-900 text-white px-6 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 hover:scale-[1.02] transition-all shadow-md">
                                            <Plus size={18} /> Invite
                                        </button>
                                    </div>

                                    <div className="border border-gray-200/50 dark:border-gray-800/50 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800/50 overflow-hidden bg-white dark:bg-gray-900">
                                        <div className="p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-xs font-black text-white uppercase shadow-inner">
                                                    {userProfile?.displayName?.[0] || userProfile?.email?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                        {userProfile?.email}
                                                        <span className="text-[9px] bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full font-black tracking-widest border border-primary-200 dark:border-primary-800">ADMIN</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">Workspace Owner</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isEnterprise && currentPlan !== 'max' && currentPlan !== 'pro_max' && (
                            <div className="relative overflow-hidden bg-gray-900 dark:bg-black rounded-3xl p-8 border border-gray-800 shadow-2xl group">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-pink-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl group-hover:bg-primary-500/30 transition-colors duration-500" />
                                
                                <div className="relative z-10 text-white">
                                    <h3 className="text-2xl font-black mb-3 flex items-center gap-3 tracking-tight">
                                        <Zap className="text-yellow-400 fill-current drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" size={28} />
                                        Upgrade to Enterprise
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-md">
                                        Need more than <span className="text-white font-bold">10,000</span> credits? Pooled team balances, SSO, and Private Workspaces start at just $12 per seat.
                                    </p>
                                    <button onClick={() => navigate('/pricing')} className="bg-white text-gray-900 font-bold py-3.5 px-8 rounded-xl text-sm hover:bg-gray-100 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                        Explore Enterprise
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Other Tiers */}
                    <div className="space-y-6">
                        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
                            <h3 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Available Tiers</h3>
                            <div className="space-y-4">
                                {plans.map(p => {
                                    // Treat legacy plans as 'pro' for the selection active state
                                    const isCurrentPlan = currentPlan === p.id || (p.id === 'pro' && ['premium', 'pro_monthly', 'pro_sprint'].includes(currentPlan));
                                    
                                    return (
                                        <div key={p.id} className={`p-5 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${
                                            isCurrentPlan 
                                            ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 shadow-md shadow-primary-500/10' 
                                            : 'border-gray-200/50 dark:border-gray-800/50 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
                                        }`}>
                                            {isCurrentPlan && (
                                                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 bg-primary-500/10 rounded-full blur-xl" />
                                            )}
                                            
                                            <div className="flex justify-between items-start mb-3 relative z-10">
                                                <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">{p.name}</span>
                                                <span className="text-sm font-black text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/40 px-2 py-1 rounded-md">{p.price}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                                                <Zap size={14} className={isCurrentPlan ? "text-primary-500" : ""} /> {p.limit.toLocaleString()} CREDITS / MO
                                            </div>
                                            
                                            {!isCurrentPlan && (
                                                <button
                                                    onClick={() => handleUpgrade(p.priceId)}
                                                    disabled={isLoading}
                                                    className="w-full mt-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-[11px] font-black uppercase tracking-widest hover:opacity-90 hover:scale-[1.02] transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Switch to {p.name}
                                                </button>
                                            )}
                                            {isCurrentPlan && (
                                                <div className="mt-5 flex items-center justify-center gap-2 py-2.5 text-primary-600 dark:text-primary-400 text-[11px] font-black uppercase tracking-widest">
                                                    <Check size={14} strokeWidth={3} /> Current Plan
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                    <Database size={16} className="text-gray-600 dark:text-gray-400" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Usage Invariants</h3>
                            </div>
                            <ul className="space-y-4">
                                <li className="text-xs text-gray-500 dark:text-gray-400 flex gap-3 leading-relaxed">
                                    <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                                    Credits reset on the 1st of every month automatically.
                                </li>
                                <li className="text-xs text-gray-500 dark:text-gray-400 flex gap-3 leading-relaxed">
                                    <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                                    Enterprise seats contribute to a shared pool.
                                </li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default BillingDashboard;
