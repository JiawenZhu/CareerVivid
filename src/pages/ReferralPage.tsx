import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getUserReferralCode, getReferralStats } from '../services/referralService';
import { Gift, Copy, Check, Users, Calendar } from 'lucide-react';
import { navigate } from '../App';

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 py-12 px-4 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8 md:mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full mb-6">
                        <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                            Premium Referral Program
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
                        Refer Friends & <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Earn Premium</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-2">
                        Share CareerVivid with your friends and both of you get rewarded!
                    </p>
                </div>

                {/* Referral Code Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 mb-6 md:mb-8">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Your Referral Code</h2>
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-6">
                        <div className="flex-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800">
                            <p className="text-2xl md:text-3xl font-mono font-bold text-center text-purple-900 dark:text-purple-100 tracking-wider break-all">
                                {referralCode}
                            </p>
                        </div>
                        <button
                            onClick={() => copyToClipboard(referralCode, 'code')}
                            className="flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold grow md:grow-0"
                        >
                            {copiedCode ? <Check size={20} /> : <Copy size={20} />}
                            {copiedCode ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Referral Link</h2>
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                        <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 min-w-0">
                            <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all md:truncate">
                                {referralLink}
                            </p>
                        </div>
                        <button
                            onClick={() => copyToClipboard(referralLink, 'link')}
                            className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold grow md:grow-0"
                        >
                            {copiedLink ? <Check size={20} /> : <Copy size={20} />}
                            {copiedLink ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* Progress Tracker */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 mb-6 md:mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Referrals Used</h2>
                        <span className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {stats.totalReferred}/{stats.maxReferrals}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500 rounded-full"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {stats.maxReferrals - stats.totalReferred} referrals remaining
                    </p>
                </div>

                {/* Rewards Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                                <Gift className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Friends Get</h3>
                        </div>
                        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <span className="text-sm md:text-base">2 months free Premium</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <span className="text-sm md:text-base">300 AI credits/month</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <span className="text-sm md:text-base">All premium templates</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shrink-0">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">You Get</h3>
                        </div>
                        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                                <span className="text-sm md:text-base">1 month free Premium</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                                <span className="text-sm md:text-base">Per successful referral</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                                <span className="text-sm md:text-base">Up to 5 months total</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Referred Users List */}
                {stats.referredUsers.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Referred Users</h2>
                        <div className="space-y-3">
                            {stats.referredUsers.map((user, index) => (
                                <div
                                    key={user.uid}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 gap-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                                            {index + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">{user.email}</p>
                                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                                <Calendar size={14} />
                                                <span>
                                                    {user.signupDate?.toDate?.()?.toLocaleDateString() || 'Recently'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex sm:justify-end">
                                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                                            Active
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {stats.referredUsers.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No referrals yet</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Share your referral code with friends to get started!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReferralPage;
