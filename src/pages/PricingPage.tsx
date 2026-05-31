import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    BadgeDollarSign,
    Calculator,
    CheckCircle2,
    CreditCard,
    ShieldCheck,
    Zap,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { trackUsage } from '../services/trackingService';
import { navigate } from '../utils/navigation';
import { PricingComparison } from '../components/Landing/PricingComparison';
import { CreditCalculator } from '../components/Landing/CreditCalculator';
import EnterpriseCalculator from '../components/Landing/EnterpriseCalculator';

const planSnapshots = [
    {
        name: 'Free',
        price: '$0',
        label: 'Start clean',
        copy: 'Use the workspace, save roles, and test the resume/interview flow before paying.',
    },
    {
        name: 'Pro',
        price: '$9/mo',
        label: 'Active search',
        copy: 'Enough AI credits for steady resume tailoring, prep notes, and interview practice.',
    },
    {
        name: 'Max',
        price: '$29/mo',
        label: 'Heavy usage',
        copy: 'For users applying often, experimenting with multiple versions, or using the agent workflow.',
    },
    {
        name: 'Team',
        price: '$12/seat',
        label: 'Pooled credits',
        copy: 'A simple per-seat model for career centers, cohorts, and internal hiring support.',
    },
];

const pricingProof = [
    {
        icon: CreditCard,
        title: 'One credit balance',
        copy: 'Resume tailoring, job prep, interviews, and agent work draw from the same monthly credit pool.',
    },
    {
        icon: Calculator,
        title: 'Usage you can estimate',
        copy: 'The calculator below helps users understand whether Free, Pro, or Max fits their actual workflow.',
    },
    {
        icon: ShieldCheck,
        title: 'Manual work stays free',
        copy: 'Tracking jobs, editing resumes, and keeping notes are not locked behind an AI action.',
    },
];

const PricingPage: React.FC = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleChoosePlan = async (priceId: string | null) => {
        setError('');

        if (!currentUser) {
            navigate('/signup?redirect=/pricing');
            return;
        }

        if (!priceId) {
            navigate('/subscription');
            return;
        }

        setLoadingPriceId(priceId);

        try {
            await trackUsage(currentUser.uid, 'checkout_session_start', { priceId });

            const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
            const result: any = await createCheckoutSession({
                priceId,
                successUrl: `${window.location.origin}/#/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/#/pricing`,
            });

            if (result.data.url) {
                window.location.href = result.data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error: any) {
            console.error('Error creating checkout session:', error);
            setError(t('pricing.error_checkout'));
            setLoadingPriceId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#f7f1e7] text-[#211b16] selection:bg-[#d7b27a]/40">
            <PublicHeader variant="editorial" />
            <main className="relative overflow-hidden pt-28">
                <div
                    className="pointer-events-none absolute inset-0 opacity-55"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, rgba(139, 90, 22, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(139, 90, 22, 0.06) 1px, transparent 1px)',
                        backgroundSize: '64px 64px',
                    }}
                />

                <section className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, ease: 'easeOut' }}
                    >
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#bcdcc9] bg-[#f7fff8] px-4 py-2 text-sm font-black text-[#137245]">
                            <BadgeDollarSign size={16} /> Pricing built for an active job search
                        </div>
                        <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-[#211b16] sm:text-6xl lg:text-7xl">
                            Pay for the AI work. Keep the workspace clear.
                        </h1>
                        <p className="mt-7 max-w-2xl text-lg font-semibold leading-8 text-[#665a4a] sm:text-xl">
                            CareerVivid uses one monthly AI credit balance across resume tailoring, job prep,
                            interview practice, and agent workflows. The core job-search workspace stays practical:
                            save the role, improve the material, prepare the next step.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={() => handleChoosePlan(null)}
                                className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#211b16] px-6 py-4 text-sm font-black text-white shadow-xl shadow-[#8b5a16]/10 transition hover:-translate-y-0.5 hover:bg-[#3a2b20]"
                            >
                                Start free <ArrowRight size={18} />
                            </button>
                            <button
                                onClick={() => document.getElementById('credit-calculator')?.scrollIntoView({ behavior: 'smooth' })}
                                className="inline-flex items-center justify-center gap-3 rounded-xl border border-[#d8c6ad] bg-[#fffaf1] px-6 py-4 text-sm font-black text-[#211b16] shadow-sm transition hover:-translate-y-0.5 hover:border-[#bfa782]"
                            >
                                Estimate credits <Calculator size={18} />
                            </button>
                        </div>
                    </motion.div>

                    <motion.aside
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, delay: 0.08, ease: 'easeOut' }}
                        className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/90 p-6 shadow-xl shadow-[#8b5a16]/8"
                    >
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a97935]">Plan Snapshot</p>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            {planSnapshots.map((plan) => (
                                <div key={plan.name} className="rounded-lg border border-[#eadbc5] bg-white/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-lg font-black tracking-tight text-[#211b16]">{plan.name}</h2>
                                            <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-[#a97935]">{plan.label}</p>
                                        </div>
                                        <p className="font-mono text-sm font-black text-[#211b16]">{plan.price}</p>
                                    </div>
                                    <p className="mt-3 text-sm font-medium leading-6 text-[#665a4a]">{plan.copy}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 rounded-lg border border-[#d9c5aa] bg-[#f9efe0] p-4 text-sm font-semibold leading-6 text-[#665a4a]">
                            No fake urgency, no inflated trust block. The pricing page explains how credits map to the
                            actual product workflow.
                        </div>
                    </motion.aside>
                </section>

                {error && (
                    <div className="relative mx-auto mb-10 max-w-3xl rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center font-semibold text-red-600">
                        {error}
                    </div>
                )}

                <section className="relative border-y border-[#e4d3bc] bg-[#fffaf1]/70 py-14">
                    <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
                        {pricingProof.map(({ icon: Icon, title, copy }) => (
                            <article key={title} className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-6 shadow-sm">
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f0dfc6] text-[#9a651f]">
                                    <Icon size={21} />
                                </div>
                                <h2 className="mt-5 text-xl font-black tracking-tight text-[#211b16]">{title}</h2>
                                <p className="mt-3 text-[15px] font-medium leading-7 text-[#665a4a]">{copy}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="relative py-12">
                    <PricingComparison
                        onCloudUpgrade={() => handleChoosePlan('price_1TJoONRJNflGxv32zSqxC9bZ')}
                        isLoading={loadingPriceId !== null}
                    />
                </section>

                <section className="relative border-t border-[#e4d3bc] bg-[#f7f1e7] py-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto mb-8 max-w-3xl text-center">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a97935]">Team Usage</p>
                            <h2 className="mt-4 text-4xl font-black tracking-tight text-[#211b16] sm:text-5xl">
                                A straightforward team model for career programs.
                            </h2>
                            <p className="mt-4 text-lg font-semibold leading-8 text-[#665a4a]">
                                Pool credits across a cohort, keep private workspaces, and support repeated resume and
                                interview practice without one-off manual tracking.
                            </p>
                        </div>
                        <EnterpriseCalculator />
                    </div>
                </section>

                <section id="credit-calculator" className="relative border-t border-[#e4d3bc]">
                    <CreditCalculator />
                </section>

                <section className="relative border-t border-[#e4d3bc] bg-[#fffaf1] py-16">
                    <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a97935]">What the plans protect</p>
                            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#211b16]">
                                The subscription should support better habits, not hide basic work.
                            </h2>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {[
                                ['Resume work', 'Draft, edit, score, tailor, and export materials from one place.'],
                                ['Application context', 'Keep company, role, links, notes, dates, and prep tied together.'],
                                ['Interview readiness', 'Generate and review prep material around the exact opportunity.'],
                            ].map(([title, copy]) => (
                                <div key={title} className="rounded-lg border border-[#e4d3bc] bg-white/70 p-5">
                                    <CheckCircle2 className="text-[#137245]" size={20} />
                                    <h3 className="mt-4 font-black text-[#211b16]">{title}</h3>
                                    <p className="mt-2 text-sm font-medium leading-6 text-[#665a4a]">{copy}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default PricingPage;
