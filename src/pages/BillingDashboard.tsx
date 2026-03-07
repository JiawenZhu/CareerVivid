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
        { id: 'pro', name: 'Pro', price: '$6', limit: PRO_PLAN_CREDIT_LIMIT, priceId: 'price_1SXF15EqIOIAAUV01eD0To1q' },
        { id: 'pro_max', name: 'Pro Max', price: '$8', limit: PRO_MAX_PLAN_CREDIT_LIMIT, priceId: 'price_1SXF1PEqIOIAAUV0p4gG4mH7' },
        { id: 'enterprise', name: 'Enterprise', price: '$12/seat', limit: ENTERPRISE_PLAN_CREDIT_LIMIT, priceId: 'price_1SXF24EqIOIAAUV0f9X3S3oA' }
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <ArrowLeft size={18} />
                        <span className="font-bold">Dashboard</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-black uppercase tracking-widest">
                            {currentPlan}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Sub & Usage */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Plan Summary Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
                                    <CreditCard className="text-primary-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Billing & Plan</h2>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Manage your DevTool subscription</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Active Plan</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-gray-900 dark:text-white capitalize">{currentPlan}</span>
                                        <span className="text-xs font-bold text-gray-500 italic block">Monthly Subscription</span>
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">AI Credit Usage</span>
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
                            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border-2 border-amber-500/20 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
                                            <Users className="text-amber-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Team Management</h2>
                                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Managing {userProfile?.seats || 1} Developer Seats</p>
                                        </div>
                                    </div>
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 transition-colors">
                                        <Settings size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            placeholder="developer@company.com"
                                            value={newTeamMember}
                                            onChange={(e) => setNewTeamMember(e.target.value)}
                                            className="flex-grow bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-primary-500"
                                        />
                                        <button className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2">
                                            <Plus size={18} /> Invite
                                        </button>
                                    </div>

                                    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                                        <div className="p-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                                    {userProfile?.displayName?.[0] || userProfile?.email?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{userProfile?.email} <span className="text-[10px] bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded ml-1">ADMIN</span></p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-400">Owner</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isEnterprise && currentPlan !== 'pro_max' && (
                            <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 text-white">
                                <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                                    <Zap className="text-amber-400 fill-current" />
                                    Upgrade to Enterprise
                                </h3>
                                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                    Need more than 888 credits? Pooled team balances, SSO, and Private Workspaces start at just $12 per seat.
                                </p>
                                <button onClick={() => navigate('/pricing')} className="bg-white text-gray-900 font-bold py-3 px-8 rounded-xl text-sm hover:bg-gray-100 transition-colors">
                                    Explore Enterprise
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Other Tiers */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Available Tiers</h3>
                            <div className="space-y-4">
                                {plans.map(p => (
                                    <div key={p.id} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${currentPlan === p.id ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-900 dark:text-white">{p.name}</span>
                                            <span className="text-sm font-black text-primary-600">{p.price}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                                            <Zap size={12} /> {p.limit} CREDITS / MO
                                        </div>
                                        {currentPlan !== p.id && (
                                            <button
                                                onClick={() => handleUpgrade(p.priceId)}
                                                disabled={isLoading}
                                                className="w-full mt-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                                            >
                                                Switch to {p.name}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <Database size={18} className="text-gray-400" />
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Usage Invariants</h3>
                            </div>
                            <ul className="space-y-3">
                                <li className="text-[11px] text-gray-500 flex gap-2">
                                    <Check size={14} className="text-green-500 flex-shrink-0" />
                                    Credits reset on the 1st of every month automatically.
                                </li>
                                <li className="text-[11px] text-gray-500 flex gap-2">
                                    <Check size={14} className="text-green-500 flex-shrink-0" />
                                    Enterprise seats contribute to a shared pool.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BillingDashboard;
