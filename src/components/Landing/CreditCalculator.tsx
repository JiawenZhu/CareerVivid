import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Bot, FileText, Briefcase, Mic, Terminal, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
    FREE_PLAN_CREDIT_LIMIT,
    PRO_PLAN_CREDIT_LIMIT,
    PRO_MAX_PLAN_CREDIT_LIMIT,
    AI_CREDIT_COSTS,
    ENTERPRISE_PLAN_CREDIT_LIMIT,
} from '../../config/creditCosts';
import { SUBSCRIPTION_CATALOG } from '../../config/subscriptionCatalog';

interface SliderConfig {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    costPerUse: number;
    max: number;
    step: number;
    color: string;
}

const SLIDERS: SliderConfig[] = [
    {
        id: 'agentTurns',
        label: 'CLI Agent turns (Flash, 1 cr)',
        description: 'Each message to cv agent costs 1 credit (Gemini 2.5 Flash)',
        icon: <Bot size={16} />,
        costPerUse: AI_CREDIT_COSTS.CLI_AGENT_FLASH,
        max: 500,
        step: 10,
        color: '#0f766e',
    },
    {
        id: 'agentLiteTurns',
        label: 'CLI Agent turns (Flash Lite, 0.5 cr)',
        description: 'Fastest model at the lowest cost',
        icon: <Bot size={16} />,
        costPerUse: AI_CREDIT_COSTS.CLI_AGENT_FLASH_LITE,
        max: 500,
        step: 10,
        color: '#0ea5e9',
    },
    {
        id: 'agentProTurns',
        label: 'CLI Agent turns (Pro, 2 cr)',
        description: 'Deep reasoning with Gemini Pro (Pro plan required)',
        icon: <Bot size={16} />,
        costPerUse: AI_CREDIT_COSTS.CLI_AGENT_PRO,
        max: 200,
        step: 5,
        color: '#475569',
    },
    {
        id: 'resumeTailors',
        label: 'Resume tailorings',
        description: `AI resume tailoring — ${AI_CREDIT_COSTS.RESUME_TAILOR} credits each`,
        icon: <FileText size={16} />,
        costPerUse: AI_CREDIT_COSTS.RESUME_TAILOR,
        max: 100,
        step: 1,
        color: '#10b981',
    },
    {
        id: 'jobSearches',
        label: 'Job searches',
        description: `AI-powered job search & scoring — ${AI_CREDIT_COSTS.JOB_SEARCH} credit each`,
        icon: <Briefcase size={16} />,
        costPerUse: AI_CREDIT_COSTS.JOB_SEARCH,
        max: 200,
        step: 5,
        color: '#f59e0b',
    },
    {
        id: 'interviews',
        label: 'Voice interviews',
        description: `Technical system design voice interviews — ${AI_CREDIT_COSTS.TECH_INTERVIEW_VOICE} credits each`,
        icon: <Mic size={16} />,
        costPerUse: AI_CREDIT_COSTS.TECH_INTERVIEW_VOICE,
        max: 50,
        step: 1,
        color: '#ef4444',
    },
    {
        id: 'archGen',
        label: 'Architecture auto-gens',
        description: `Architecture diagram generation — ${AI_CREDIT_COSTS.ARCHITECTURE_AUTO_GEN} credits each`,
        icon: <Terminal size={16} />,
        costPerUse: AI_CREDIT_COSTS.ARCHITECTURE_AUTO_GEN,
        max: 50,
        step: 1,
        color: '#0ea5e9',
    },
];

interface PlanConfig {
    name: string;
    limit: number;
    color: string;
    price: string;
    accent: string;
}

const PLANS: PlanConfig[] = [
    { name: 'Free',       limit: FREE_PLAN_CREDIT_LIMIT,    color: '#6b7280', price: '$0/mo',    accent: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
    { name: 'Pro',        limit: PRO_PLAN_CREDIT_LIMIT,     color: '#625bd5', price: `$${SUBSCRIPTION_CATALOG.pro.monthlyPrice}/mo`,    accent: 'bg-[#f3f2ff] dark:bg-[#28264f] text-[#625bd5] dark:text-[#a9a5ff]' },
    { name: 'Max',        limit: PRO_MAX_PLAN_CREDIT_LIMIT, color: '#a97935', price: `$${SUBSCRIPTION_CATALOG.max.monthlyPrice}/mo`,   accent: 'bg-amber-100 dark:bg-amber-900/30 text-[#8a5a1f] dark:text-[#f0c987]' },
    {
        name: 'Enterprise',
        limit: ENTERPRISE_PLAN_CREDIT_LIMIT * SUBSCRIPTION_CATALOG.enterprise.minimumSeats,
        color: '#211b16',
        price: `$${SUBSCRIPTION_CATALOG.enterprise.monthlyPrice * SUBSCRIPTION_CATALOG.enterprise.minimumSeats}/mo min`,
        accent: 'bg-[#211b16] dark:bg-black text-white',
    },
];

export const CreditCalculator: React.FC = () => {
    const [values, setValues] = useState<Record<string, number>>(
        Object.fromEntries(SLIDERS.map((s) => [s.id, 0]))
    );
    const [selectedPlan, setSelectedPlan] = useState<PlanConfig>(PLANS[1]);

    const totalCredits = useMemo(
        () => SLIDERS.reduce((sum, s) => sum + values[s.id] * s.costPerUse, 0),
        [values]
    );

    const pct = Math.min((totalCredits / selectedPlan.limit) * 100, 100);
    const overLimit = totalCredits > selectedPlan.limit;
    const recommended = PLANS.find((p) => p.limit >= totalCredits) ?? PLANS[PLANS.length - 1];

    const breakdown = SLIDERS.filter((s) => values[s.id] > 0).map((s) => ({
        label: s.label,
        credits: values[s.id] * s.costPerUse,
        color: s.color,
    }));

    return (
        <section className="py-24 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fff7eb] dark:bg-[#302a22] text-[#8a5a1f] dark:text-[#f0c987] text-xs font-semibold mb-6 border border-[#e4d3bc] dark:border-[#5a4630]">
                        <Zap size={15} /> Credit Calculator
                    </div>
                    <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight mb-4">
                        Find Your Perfect Plan
                    </h2>
                    <p className="max-w-2xl mx-auto text-base text-gray-600 dark:text-gray-400 font-medium">
                        Drag the sliders to estimate how many credits you'll use each month.
                    </p>
                </div>

                <div className="grid lg:grid-cols-5 gap-10 items-start">
                    {/* Sliders */}
                    <div className="lg:col-span-3 space-y-6">
                        {SLIDERS.map((slider) => (
                            <div key={slider.id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span style={{ color: slider.color }}>{slider.icon}</span>
                                        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{slider.label}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{values[slider.id]}</span>
                                        <span className="text-xs text-gray-400 ml-1">uses</span>
                                        <div className="text-xs font-semibold" style={{ color: slider.color }}>
                                            = {(values[slider.id] * slider.costPerUse).toFixed(1)} cr
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mb-4">{slider.description}</p>
                                <div className="relative">
                                    <div
                                        className="h-2 rounded-full mb-0 absolute top-0 left-0"
                                        style={{
                                            width: `${(values[slider.id] / slider.max) * 100}%`,
                                            background: slider.color,
                                            transition: 'width 0.2s ease',
                                            pointerEvents: 'none',
                                        }}
                                    />
                                    <input
                                        type="range"
                                        min={0}
                                        max={slider.max}
                                        step={slider.step}
                                        value={values[slider.id]}
                                        onChange={(e) =>
                                            setValues((prev) => ({ ...prev, [slider.id]: Number(e.target.value) }))
                                        }
                                        className="w-full h-2 rounded-full appearance-none outline-none cursor-pointer relative"
                                        style={{
                                            background: `linear-gradient(to right, ${slider.color} 0%, ${slider.color} ${(values[slider.id] / slider.max) * 100}%, #e5e7eb ${(values[slider.id] / slider.max) * 100}%, #e5e7eb 100%)`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary Panel */}
                    <div className="lg:col-span-2 sticky top-6 space-y-5">
                        {/* Plan Selector */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Compare with plan</p>
                            <div className="flex gap-2 flex-wrap">
                                {PLANS.map((p) => (
                                    <button
                                        key={p.name}
                                        onClick={() => setSelectedPlan(p)}
                                        data-selected={selectedPlan.name === p.name}
                                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border-2 ${
                                            selectedPlan.name === p.name
                                                ? 'border-current shadow-sm scale-105'
                                                : 'border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        } ${p.accent}`}
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Credit Gauge */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Estimated monthly usage</p>
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-4xl font-bold" style={{ color: overLimit ? '#ef4444' : selectedPlan.color }}>
                                    {totalCredits.toFixed(1)}
                                </span>
                                <span className="text-sm text-gray-400 font-medium">of {selectedPlan.limit.toLocaleString()} credits</span>
                            </div>

                            {/* Bar */}
                            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: overLimit ? '#ef4444' : selectedPlan.color }}
                                    initial={false}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                                />
                            </div>

                            {/* Status */}
                            <AnimatePresence mode="wait">
                                {overLimit ? (
                                    <motion.div
                                        key="over"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50"
                                    >
                                        <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                                        <div>
                                            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                                                Exceeds {selectedPlan.name} plan by {(totalCredits - selectedPlan.limit).toFixed(1)} credits
                                            </p>
                                            <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-0.5">
                                                We recommend the <strong>{recommended.name} plan</strong> ({recommended.price})
                                            </p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="ok"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <CheckCircle2 size={16} className="text-green-500" />
                                        <span className="font-medium" style={{ color: selectedPlan.color }}>
                                            {selectedPlan.name} plan covers your usage ✓
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Breakdown */}
                        {breakdown.length > 0 && (
                            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Credit breakdown</p>
                                <div className="space-y-2.5">
                                    {breakdown.map((row) => (
                                        <div key={row.label} className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.color }} />
                                            <span className="flex-grow text-xs text-gray-600 dark:text-gray-400 font-medium truncate">
                                                {row.label}
                                            </span>
                                            <span className="text-xs font-semibold" style={{ color: row.color }}>
                                                {row.credits.toFixed(1)} cr
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CTA */}
                        <div className="bg-[#211b16] rounded-2xl p-6 text-white shadow-xl shadow-[#211b16]/15">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-sm">Try CareerVivid free</span>
                                <Zap size={18} className="text-[#f0c987]" />
                            </div>
                            <p className="text-[#e7d7c2] text-xs font-medium mb-5 leading-relaxed">
                                {FREE_PLAN_CREDIT_LIMIT} free AI credits every month — no credit card required.
                                <br />Use the CLI agent, search jobs, and tailor resumes instantly.
                            </p>
                            <a
                                href="/signup"
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-[#211b16] font-semibold text-sm hover:bg-[#fff7eb] transition-colors"
                            >
                                Get {FREE_PLAN_CREDIT_LIMIT} free credits <ChevronRight size={16} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
