import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getUserReferralCode, getReferralStats } from '../services/referralService';
import { Gift, Copy, Check, Users, Calendar, ArrowLeft } from 'lucide-react';
import { navigate } from '../utils/navigation';

const ReferralPage: React.FC = () => {
    const { t } = useTranslation();
    const { currentUser, isPremium } = useAuth();
    const [referralCode, setReferralCode] = useState('');
    const [referralLink, setReferralLink] = useState('');
    const [stats, setStats] = useState({
        totalReferred: 0,
        maxReferrals: 5,
        referredUsers: [] as Array<{ uid: string; email: string; signupDate: any }>
    });
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            navigate('/signin');
            return;
        }

        if (!isPremium) {
            navigate('/pricing');
            return;
        }

        loadReferralData();
    }, [currentUser, isPremium]);

    const loadReferralData = async () => {
        if (!currentUser) return;

        try {
            setLoading(true);
            const code = await getUserReferralCode(currentUser.uid);
            const referralStats = await getReferralStats(currentUser.uid);

            setReferralCode(code);
            setReferralLink(`${window.location.origin}/referral?ref=${code}`);
            setStats(referralStats);
        } catch (error) {
            console.error('Error loading referral data:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text: string, type: 'code' | 'link') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'code') {
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
            } else {
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
            }
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const progressPercentage = (stats.totalReferred / stats.maxReferrals) * 100;

    const renderTerminalHeader = (title: string) => (
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111] gap-2 shrink-0 transition-colors">
            <div className="flex gap-1.5 mr-auto">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500">careervivid — {title}</span>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 font-mono text-sm">Initializing agent...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-28 px-4 font-sans selection:bg-primary-100 dark:selection:bg-primary-900">
            {/* Top Header Bar */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-10 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-900 dark:text-white hover:opacity-70 transition-all group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform stroke-[2.5]" />
                        <span className="text-sm font-semibold">Dashboard</span>
                    </button>
                </div>
            </header>

            <div className="max-w-5xl mx-auto">
                
                {/* ── Header exactly matching Screenshot 2 ── */}
                <div className="text-center mb-10">
                    <p className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-2">CAREERVIVID REFERRALS</p>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                        Refer Friends. Earn Premium.
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-xl mx-auto text-sm">
                        Share CareerVivid with your friends and both of you get rewarded!
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* ── Terminal Card 1: Your Link ── */}
                    <div className="flex flex-col bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10 hover:border-primary-400/50 hover:ring-primary-400/20 transition-all duration-300">
                        {renderTerminalHeader('link')}
                        <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-pink-500 font-mono font-bold select-none">~</span>
                                    <span className="text-primary-500 font-bold font-mono text-sm">cv</span>
                                    <span className="text-gray-900 dark:text-gray-100 font-bold font-mono text-sm">referral --code</span>
                                </div>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                    <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-200 dark:border-gray-800 flex justify-center items-center">
                                        <p className="text-xl md:text-2xl font-mono font-bold text-gray-900 dark:text-white tracking-widest">
                                            {referralCode}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(referralCode, 'code')}
                                        className="flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-bold sm:w-32"
                                    >
                                        {copiedCode ? <Check size={18} /> : <Copy size={18} />}
                                        {copiedCode ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-pink-500 font-mono font-bold select-none">~</span>
                                    <span className="text-primary-500 font-bold font-mono text-sm">cv</span>
                                    <span className="text-gray-900 dark:text-gray-100 font-bold font-mono text-sm">referral --link</span>
                                </div>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                    <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-200 dark:border-gray-800 overflow-hidden">
                                        <p className="text-sm font-mono text-gray-500 dark:text-gray-400 truncate">
                                            {referralLink}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(referralLink, 'link')}
                                        className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:opacity-90 transition-opacity font-bold sm:w-32"
                                    >
                                        {copiedLink ? <Check size={18} /> : <Copy size={18} />}
                                        {copiedLink ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Terminal Card 2: Share Message ── */}
                    <div className="flex flex-col bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10 hover:border-primary-400/50 hover:ring-primary-400/20 transition-all duration-300">
                        {renderTerminalHeader('share')}
                        <div className="p-6 md:p-8 flex flex-col h-full">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-pink-500 font-mono font-bold select-none">~</span>
                                <span className="text-primary-500 font-bold font-mono text-sm">cv</span>
                                <span className="text-gray-900 dark:text-gray-100 font-bold font-mono text-sm">referral --draft-message</span>
                            </div>
                            <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-200 dark:border-gray-800 mb-6 flex flex-col justify-center">
                                <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base font-medium leading-relaxed font-sans border-l-2 border-primary-400/50 pl-3">
                                    Accelerate Your Career Path with CareerVivid! 🚀<br /><br />
                                    Use my exclusive code <span className="text-primary-600 dark:text-primary-400 font-bold">{referralCode}</span> to get 2 Months of Premium for free.<br /><br />
                                    Sign up here: <span className="text-primary-600 dark:text-primary-400 break-all">{referralLink}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(`Accelerate Your Career Path with CareerVivid! 🚀\n\nUse my exclusive code ${referralCode} to get 2 Months of Premium for free.\n\nSign up here: ${referralLink}`, 'code')}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-bold mt-auto border border-primary-500 shadow-lg shadow-primary-500/10"
                            >
                                <Copy size={18} />
                                Copy Message
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Terminal Card 3: Metrics & Tracker ── */}
                <div className="flex flex-col bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10 mb-6 hover:border-primary-400/50 hover:ring-primary-400/20 transition-all duration-300">
                    {renderTerminalHeader('metrics')}
                    <div className="p-6 md:p-10 font-sans">
                        <div className="mb-10">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="text-pink-500 font-mono font-bold select-none">~</span>
                                <span className="text-primary-500 font-bold font-mono text-sm">cv</span>
                                <span className="text-gray-900 dark:text-gray-100 font-bold font-mono text-sm">referral --status</span>
                            </div>
                            <div className="flex items-end justify-between mb-3 border-l-2 border-primary-400/50 pl-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Redemption Progress</h3>
                                    <p className="ms:mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {stats.maxReferrals - stats.totalReferred} referrals remaining
                                    </p>
                                </div>
                                <span className="text-2xl sm:text-3xl font-black text-primary-600 dark:text-primary-400">
                                    {stats.totalReferred}/{stats.maxReferrals}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-blue-500 transition-all duration-700 rounded-full"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Gift className="w-4 h-4 text-blue-500" /> They Get
                                </h3>
                                <ul className="space-y-3">
                                    {['2 months free Premium', '1000 AI credits/month', 'All premium templates'].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary-500" /> You Get
                                </h3>
                                <ul className="space-y-3">
                                    {['1 month free Premium', 'Per successful referral', 'Up to 5 months total'].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Referred Users List ── */}
                {stats.referredUsers.length > 0 ? (
                    <div className="flex flex-col bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xl ring-1 ring-gray-900/5 dark:ring-white/10">
                        {renderTerminalHeader('users')}
                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="text-pink-500 font-mono font-bold select-none">~</span>
                                <span className="text-primary-500 font-bold font-mono text-sm">cv</span>
                                <span className="text-gray-900 dark:text-gray-100 font-bold font-mono text-sm">referral --list</span>
                            </div>
                            <div className="space-y-3">
                                {stats.referredUsers.map((user, index) => (
                                    <div
                                        key={user.uid}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 gap-3 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 bg-gray-800 text-white rounded flex items-center justify-center font-mono text-sm font-bold shadow-sm">
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white truncate mb-0.5">{user.email}</p>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                    <Calendar size={12} />
                                                    <span>
                                                        {user.signupDate?.toDate?.()?.toLocaleDateString() || 'Recently'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex sm:justify-end">
                                            <span className="px-2.5 py-1 text-xs font-mono bg-emerald-100 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 rounded-md">
                                                ✓ active
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xl ring-1 ring-gray-900/5 dark:ring-white/10">
                        {renderTerminalHeader('users')}
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="text-pink-500 font-mono font-bold select-none">~</span>
                                <span className="text-primary-500 font-bold font-mono text-sm">cv</span>
                                <span className="text-gray-900 dark:text-gray-100 font-bold font-mono text-sm">referral --list</span>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 inline-block mb-4">
                                <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-sm font-mono font-bold text-gray-900 dark:text-white mb-2">Error: No referrals found</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-mono">
                                Share your referral code with friends to get started!
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReferralPage;
