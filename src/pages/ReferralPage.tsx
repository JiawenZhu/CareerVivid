import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getUserReferralCode, getReferralStats } from '../services/referralService';
import { Gift, Copy, Check, Users, Calendar, ArrowLeft, Share2, Trophy } from 'lucide-react';
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
    const [copiedMessage, setCopiedMessage] = useState(false);

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

    const copyToClipboard = async (text: string, type: 'code' | 'link' | 'message') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'code') {
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
            } else if (type === 'link') {
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
            } else {
                setCopiedMessage(true);
                setTimeout(() => setCopiedMessage(false), 2000);
            }
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const progressPercentage = stats.maxReferrals > 0
        ? Math.min(100, (stats.totalReferred / stats.maxReferrals) * 100)
        : 0;
    const remainingReferrals = Math.max(0, stats.maxReferrals - stats.totalReferred);
    const shareMessage = `I am using CareerVivid to track jobs, tailor resumes, and practice interviews. Use my code ${referralCode} to get 2 months of Premium free: ${referralLink}`;

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f7f1e7] dark:bg-[#1f1f1d]">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#e4d3bc] border-t-[#625bd5]" />
                    <p className="mt-4 text-sm font-semibold text-[#665a4a] dark:text-[#aaa39a]">Loading referrals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f7f1e7] pb-20 font-sans text-[#211b16] selection:bg-[#f3f2ff] dark:bg-[#1f1f1d] dark:text-[#f4f1e9] dark:selection:bg-[#37332d]">
            <header className="sticky top-0 z-10 border-b border-[#e4d3bc]/70 bg-[#f7f1e7]/88 backdrop-blur-xl dark:border-[#37332d] dark:bg-[#1f1f1d]/88">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group inline-flex items-center gap-2 rounded-xl border border-[#e4d3bc] bg-white/70 px-3 py-2 text-sm font-semibold text-[#665a4a] shadow-sm transition hover:border-[#d9c7ad] hover:bg-white hover:text-[#211b16] dark:border-[#37332d] dark:bg-[#262522] dark:text-[#aaa39a] dark:hover:text-[#f4f1e9]"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
                        <span>Dashboard</span>
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <section className="mb-6 rounded-2xl border border-[#e4d3bc] bg-[#fffaf1] p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522] sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e6dac8] bg-white/70 px-3 py-1 text-[11px] font-bold text-[#a97935] shadow-sm dark:border-[#37332d] dark:bg-[#302e2a] dark:text-[#caa26c]">
                                <Gift size={13} />
                                Premium referrals
                            </div>
                            <h1 className="text-3xl font-bold leading-tight tracking-normal text-[#211b16] dark:text-[#f4f1e9] sm:text-4xl">
                                Refer friends. Earn Premium.
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#665a4a] dark:text-[#aaa39a]">
                                Share CareerVivid with people who are organizing a job search. They get Premium time, and you earn up to 5 months back.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#e6dac8] bg-white/72 p-2 shadow-sm dark:border-[#37332d] dark:bg-[#302e2a] sm:min-w-[320px]">
                            {[
                                { label: 'Referred', value: stats.totalReferred },
                                { label: 'Remaining', value: remainingReferrals },
                                { label: 'Limit', value: stats.maxReferrals },
                            ].map((item) => (
                                <div key={item.label} className="rounded-xl bg-[#f8f8fb] px-3 py-3 text-center dark:bg-[#1f1f1d]">
                                    <div className="text-xl font-bold text-[#211b16] dark:text-[#f4f1e9]">{item.value}</div>
                                    <div className="mt-0.5 text-[10px] font-semibold text-[#7d6e5e] dark:text-[#aaa39a]">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                    <section className="space-y-5">
                        <div className="rounded-2xl border border-[#e6dac8] bg-white p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522] sm:p-6">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-bold text-[#211b16] dark:text-[#f4f1e9]">Your referral link</h2>
                                    <p className="mt-1 text-sm font-medium text-[#665a4a] dark:text-[#aaa39a]">Copy the code or send the full signup link.</p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef0ff] text-[#625bd5] dark:bg-[#302e2a] dark:text-[#8d88e6]">
                                    <Share2 size={18} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-[11px] font-bold text-[#7d6e5e] dark:text-[#aaa39a]">{t('referral.code', 'Referral code')}</label>
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <div className="flex min-h-12 flex-1 items-center rounded-xl border border-[#e6dac8] bg-[#fffaf1] px-4 font-mono text-lg font-bold tracking-[0.18em] text-[#211b16] dark:border-[#37332d] dark:bg-[#1f1f1d] dark:text-[#f4f1e9]">
                                            {referralCode}
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(referralCode, 'code')}
                                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#625bd5] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5851c8] disabled:opacity-60"
                                        >
                                            {copiedCode ? <Check size={17} /> : <Copy size={17} />}
                                            {copiedCode ? 'Copied' : 'Copy code'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-[11px] font-bold text-[#7d6e5e] dark:text-[#aaa39a]">{t('referral.link', 'Referral link')}</label>
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <div className="flex min-h-12 flex-1 items-center overflow-hidden rounded-xl border border-[#e6dac8] bg-[#fffaf1] px-4 text-sm font-semibold text-[#665a4a] dark:border-[#37332d] dark:bg-[#1f1f1d] dark:text-[#aaa39a]">
                                            <span className="truncate">{referralLink}</span>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(referralLink, 'link')}
                                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#e6dac8] bg-white px-5 text-sm font-semibold text-[#211b16] shadow-sm transition hover:border-[#d9c7ad] hover:bg-[#fffaf1] dark:border-[#37332d] dark:bg-[#302e2a] dark:text-[#f4f1e9] dark:hover:bg-[#37332d]"
                                        >
                                            {copiedLink ? <Check size={17} /> : <Copy size={17} />}
                                            {copiedLink ? 'Copied' : 'Copy link'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[#e6dac8] bg-white p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522] sm:p-6">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-bold text-[#211b16] dark:text-[#f4f1e9]">Share message</h2>
                                    <p className="mt-1 text-sm font-medium text-[#665a4a] dark:text-[#aaa39a]">A short note you can paste into chat or email.</p>
                                </div>
                            </div>
                            <div className="rounded-xl border border-[#e6dac8] bg-[#fffaf1] p-4 text-sm font-medium leading-6 text-[#665a4a] dark:border-[#37332d] dark:bg-[#1f1f1d] dark:text-[#aaa39a]">
                                {shareMessage}
                            </div>
                            <button
                                onClick={() => copyToClipboard(shareMessage, 'message')}
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#211b16] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#362a21] dark:bg-[#f4f1e9] dark:text-[#211b16] dark:hover:bg-white"
                            >
                                {copiedMessage ? <Check size={17} /> : <Copy size={17} />}
                                {copiedMessage ? 'Copied' : 'Copy message'}
                            </button>
                        </div>
                    </section>

                    <aside className="space-y-5">
                        <div className="rounded-2xl border border-[#e6dac8] bg-white p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522] sm:p-6">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-[#211b16] dark:text-[#f4f1e9]">Referral progress</h2>
                                    <p className="mt-1 text-sm font-medium text-[#665a4a] dark:text-[#aaa39a]">{remainingReferrals} referrals remaining</p>
                                </div>
                                <span className="rounded-xl bg-[#f3f2ff] px-3 py-1.5 text-sm font-bold text-[#625bd5] dark:bg-[#302e2a] dark:text-[#8d88e6]">
                                    {stats.totalReferred}/{stats.maxReferrals}
                                </span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full border border-[#e6dac8] bg-[#fffaf1] dark:border-[#37332d] dark:bg-[#1f1f1d]">
                                <div
                                    className="h-full rounded-full bg-[#625bd5] transition-all duration-700"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                            <p className="mt-3 text-xs font-semibold text-[#7d6e5e] dark:text-[#aaa39a]">Rewards apply after each successful signup.</p>
                        </div>

                        {[
                            { title: 'They get', icon: Gift, items: ['2 months free Premium', '1000 AI credits/month', 'Premium templates'] },
                            { title: 'You get', icon: Trophy, items: ['1 month free Premium', 'For each successful referral', 'Up to 5 months total'] },
                        ].map((group) => {
                            const RewardIcon = group.icon;

                            return (
                                <div key={group.title} className="rounded-2xl border border-[#e6dac8] bg-white p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522]">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff0f7] text-[#d95b92] dark:bg-[#302e2a]">
                                            <RewardIcon size={17} />
                                        </div>
                                        <h3 className="text-sm font-bold text-[#211b16] dark:text-[#f4f1e9]">{group.title}</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {group.items.map((item) => (
                                            <li key={item} className="flex items-start gap-2.5 text-sm font-medium text-[#665a4a] dark:text-[#aaa39a]">
                                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </aside>
                </div>

                <section className="mt-5 rounded-2xl border border-[#e6dac8] bg-white p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522] sm:p-6">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-[#211b16] dark:text-[#f4f1e9]">Referred users</h2>
                            <p className="mt-1 text-sm font-medium text-[#665a4a] dark:text-[#aaa39a]">Successful referrals appear here after signup.</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef0ff] text-[#625bd5] dark:bg-[#302e2a] dark:text-[#8d88e6]">
                            <Users size={18} />
                        </div>
                    </div>

                    {stats.referredUsers.length > 0 ? (
                        <div className="space-y-3">
                            {stats.referredUsers.map((user, index) => (
                                <div
                                    key={user.uid}
                                    className="flex flex-col gap-3 rounded-xl border border-[#e6dac8] bg-[#fffaf1] p-4 transition hover:border-[#d9c7ad] dark:border-[#37332d] dark:bg-[#1f1f1d] sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#625bd5] shadow-sm dark:bg-[#302e2a] dark:text-[#8d88e6]">
                                            {index + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-[#211b16] dark:text-[#f4f1e9]">{user.email}</p>
                                            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#7d6e5e] dark:text-[#aaa39a]">
                                                <Calendar size={12} />
                                                <span>
                                                    {user.signupDate && typeof user.signupDate === 'string'
                                                        ? new Date(user.signupDate).toLocaleDateString()
                                                        : (user.signupDate?.toDate?.()?.toLocaleDateString() || 'Recently')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                                        <Check size={12} />
                                        Active
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-[#d9c7ad] bg-[#fffaf1] p-8 text-center dark:border-[#37332d] dark:bg-[#1f1f1d]">
                            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#7d6e5e] shadow-sm dark:bg-[#302e2a] dark:text-[#aaa39a]">
                                <Users size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-[#211b16] dark:text-[#f4f1e9]">No referrals yet</h3>
                            <p className="mt-1 text-sm font-medium text-[#665a4a] dark:text-[#aaa39a]">Copy your link and share it with someone starting a job search.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default ReferralPage;
