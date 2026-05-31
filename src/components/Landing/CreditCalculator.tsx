import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Bot, FileText, Briefcase, Mic, Terminal, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
    FREE_PLAN_CREDIT_LIMIT,
    PRO_PLAN_CREDIT_LIMIT,
    PRO_MAX_PLAN_CREDIT_LIMIT,
    AI_CREDIT_COSTS,
} from '../../config/creditCosts';

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
        color: '#2563eb',
    },
    {
        id: 'agentLiteTurns',
        label: 'CLI Agent turns (Flash Lite, 0.5 cr)',
        description: 'Fastest model at the lowest cost',
        icon: <Bot size={16} />,
        costPerUse: AI_CREDIT_COSTS.CLI_AGENT_FLASH_LITE,
        max: 500,
        step: 10,
        color: '#4f6f9f',
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
        color: '#137245',
    },
    {
        id: 'jobSearches',
        label: 'Job searches',
        description: `AI-powered job search & scoring — ${AI_CREDIT_COSTS.JOB_SEARCH} credit each`,
        icon: <Briefcase size={16} />,
        costPerUse: AI_CREDIT_COSTS.JOB_SEARCH,
        max: 200,
        step: 5,
        color: '#a97935',
    },
    {
        id: 'interviews',
        label: 'Voice interviews',
        description: `Technical system design voice interviews — ${AI_CREDIT_COSTS.TECH_INTERVIEW_VOICE} credits each`,
        icon: <Mic size={16} />,
        costPerUse: AI_CREDIT_COSTS.TECH_INTERVIEW_VOICE,
        max: 50,
        step: 1,
        color: '#b64a5a',
    },
    {
        id: 'archGen',
        label: 'Architecture auto-gens',
        description: `Architecture diagram generation — ${AI_CREDIT_COSTS.ARCHITECTURE_AUTO_GEN} credits each`,
        icon: <Terminal size={16} />,
        costPerUse: AI_CREDIT_COSTS.ARCHITECTURE_AUTO_GEN,
        max: 50,
        step: 1,
        color: '#2563eb',
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
    { name: 'Free',       limit: FREE_PLAN_CREDIT_LIMIT,    color: '#6b7280', price: '$0/mo',    accent: 'bg-[#f8fafc] text-[#475569]' },
    { name: 'Pro',        limit: PRO_PLAN_CREDIT_LIMIT,     color: '#2563eb', price: '$9/mo',    accent: 'bg-[#eef4ff] text-[#2563eb]' },
    { name: 'Max',        limit: PRO_MAX_PLAN_CREDIT_LIMIT, color: '#475569', price: '$29/mo',   accent: 'bg-[#f1f5f9] text-[#334155]' },
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
        <section className="py-24 bg-[#f7f1e7]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 text-[#2563eb] text-sm font-bold mb-6 border border-[#dbe4f3] shadow-sm">
                        <Zap size={15} /> Credit Calculator
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-[#211b16] tracking-tight mb-4">
                        Find Your Perfect Plan
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-[#665a4a] font-medium">
                        Drag the sliders to estimate how many credits you'll use each month.
                    </p>
                </div>

                <div className="grid lg:grid-cols-5 gap-10 items-start">
                    {/* Sliders */}
                    <div className="lg:col-span-3 space-y-6">
                        {SLIDERS.map((slider) => (
                            <div key={slider.id} className="bg-white/92 rounded-2xl p-6 shadow-sm border border-[#e0d7ca]">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span style={{ color: slider.color }}>{slider.icon}</span>
                                        <span className="font-bold text-[#211b16] text-sm">{slider.label}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-[#211b16]">{values[slider.id]}</span>
                                        <span className="text-xs text-[#7d6e5e] ml-1">uses</span>
                                        <div className="text-xs font-bold" style={{ color: slider.color }}>
                                            = {(values[slider.id] * slider.costPerUse).toFixed(1)} cr
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-[#665a4a] mb-4">{slider.description}</p>
                                <div className="relative">
                                    <input
                                        type="range"
                                        min={0}
                                        max={slider.max}
                                        step={slider.step}
                                        value={values[slider.id]}
                                        onChange={(e) =>
                                            setValues((prev) => ({ ...prev, [slider.id]: Number(e.target.value) }))
                                        }
                                        className="w-full h-2 rounded-full outline-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, ${slider.color} 0%, ${slider.color} ${(values[slider.id] / slider.max) * 100}%, #e5e7eb ${(values[slider.id] / slider.max) * 100}%, #e5e7eb 100%)`,
                                            accentColor: slider.color,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary Panel */}
                    <div className="lg:col-span-2 sticky top-6 space-y-5">
                        {/* Plan Selector */}
                        <div className="bg-white/92 rounded-2xl p-6 shadow-sm border border-[#e0d7ca]">
                            <p className="text-xs font-black uppercase tracking-widest text-[#a97935] mb-3">Compare with plan</p>
                            <div className="flex gap-2 flex-wrap">
                                {PLANS.map((p) => (
                                    <button
                                        key={p.name}
                                        onClick={() => setSelectedPlan(p)}
                                        data-selected={selectedPlan.name === p.name}
                                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border-2 ${
                                            selectedPlan.name === p.name
                                                ? 'border-current shadow-sm scale-105'
                                                : 'border-transparent text-[#665a4a] hover:bg-[#fffaf1]'
                                        } ${p.accent}`}
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Credit Gauge */}
                        <div className="bg-white/92 rounded-2xl p-6 shadow-sm border border-[#e0d7ca]">
                            <p className="text-xs font-black uppercase tracking-widest text-[#a97935] mb-1">Estimated monthly usage</p>
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-4xl font-black" style={{ color: overLimit ? '#ef4444' : selectedPlan.color }}>
                                    {totalCredits.toFixed(1)}
                                </span>
                                <span className="text-sm text-[#7d6e5e] font-medium">of {selectedPlan.limit.toLocaleString()} credits</span>
                            </div>

                            {/* Bar */}
                            <div className="h-4 bg-[#ece2d2] rounded-full overflow-hidden mb-3">
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
                                            <p className="text-sm font-bold text-red-700 dark:text-red-400">
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
                            <div className="bg-white/92 rounded-2xl p-6 shadow-sm border border-[#e0d7ca]">
                                <p className="text-xs font-black uppercase tracking-widest text-[#a97935] mb-4">Credit breakdown</p>
                                <div className="space-y-2.5">
                                    {breakdown.map((row) => (
                                        <div key={row.label} className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.color }} />
                                            <span className="flex-grow text-xs text-[#665a4a] font-medium truncate">
                                                {row.label}
                                            </span>
                                            <span className="text-xs font-bold" style={{ color: row.color }}>
                                                {row.credits.toFixed(1)} cr
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CTA */}
                        <div className="rounded-2xl border border-[#f3bfcd] bg-[#fff0f5] p-6 text-[#7f1d3b] shadow-lg shadow-rose-300/12">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-black text-sm">Try CareerVivid free</span>
                                <Zap size={18} className="text-[#db4f79]" />
                            </div>
                            <p className="text-[#9f4661] text-xs font-medium mb-5 leading-relaxed">
                                {FREE_PLAN_CREDIT_LIMIT} free AI credits every month — no credit card required.
                                <br />Use the CLI agent, search jobs, and tailor resumes instantly.
                            </p>
                            <a
                                href="/signup"
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#7f1d3b] text-white font-black text-sm hover:bg-[#9f2349] transition-colors shadow-sm shadow-rose-900/10"
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
