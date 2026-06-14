"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bot, Briefcase, CheckCircle2, ChevronRight, FileText, Handshake, Mic, Terminal, TrendingUp, Users, Zap } from "lucide-react";
import { CREDIT_LIMITS, SUBSCRIPTION_PRICES } from "./PricingData";

const sliderConfigs = [
  { id: "agentTurns", label: "CLI Agent turns (Flash, 1 cr)", description: "Each message to cv agent costs 1 credit (Gemini 2.5 Flash)", icon: Bot, cost: 1, max: 500, step: 10, color: "#6366f1" },
  { id: "agentLiteTurns", label: "CLI Agent turns (Flash Lite, 0.5 cr)", description: "Fastest model at the lowest cost", icon: Bot, cost: 0.5, max: 500, step: 10, color: "#8b5cf6" },
  { id: "agentProTurns", label: "CLI Agent turns (Pro, 2 cr)", description: "Deep reasoning with Gemini Pro (Pro plan required)", icon: Bot, cost: 2, max: 200, step: 5, color: "#a855f7" },
  { id: "resumeTailors", label: "Resume tailorings", description: "AI resume tailoring: 5 credits each", icon: FileText, cost: 5, max: 100, step: 1, color: "#10b981" },
  { id: "jobSearches", label: "Job searches", description: "AI-powered job search & scoring: 1 credit each", icon: Briefcase, cost: 1, max: 200, step: 5, color: "#f59e0b" },
  { id: "interviews", label: "Voice interviews", description: "Technical system design voice interviews: 15 credits each", icon: Mic, cost: 15, max: 50, step: 1, color: "#ef4444" },
  { id: "archGen", label: "Architecture auto-gens", description: "Architecture diagram generation: 10 credits each", icon: Terminal, cost: 10, max: 50, step: 1, color: "#0ea5e9" },
];

const planOptions = [
  { name: "Free", limit: CREDIT_LIMITS.free, color: "#6b7280", price: "$0/mo", accent: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { name: "Pro", limit: CREDIT_LIMITS.pro, color: "#6366f1", price: "$12/mo", accent: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  { name: "Max", limit: CREDIT_LIMITS.max, color: "#a855f7", price: "$35/mo", accent: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
];

export function EnterpriseCalculator() {
  const [seats, setSeats] = useState(10);
  const totalCost = seats * SUBSCRIPTION_PRICES.enterprise.monthly;
  const totalCredits = seats * CREDIT_LIMITS.enterprise;

  return (
    <section className="mt-40">
      <div className="mb-16 text-center">
        <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">Enterprise Team Usage</h2>
        <p className="mx-auto mt-4 max-w-2xl text-xl text-gray-600 dark:text-gray-400">
          Pool AI credits across your entire team: {CREDIT_LIMITS.enterprise.toLocaleString()} credits/seat at just ${SUBSCRIPTION_PRICES.enterprise.monthly}/seat/month.
        </p>
      </div>
      <div className="relative mx-auto mt-12 max-w-5xl overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-2xl md:p-12 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-20">
          <div className="w-full flex-grow">
            <div className="mb-6 flex items-center gap-4">
              <div className="rounded-2xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/30"><Users size={28} strokeWidth={2.5} /></div>
              <h3 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Enterprise Seats</h3>
            </div>
            <p className="mb-10 text-lg font-medium text-gray-600 dark:text-gray-400">
              Scale your team with pooled credits and private workspaces. Adjust the slider to see your monthly investment.
            </p>
            <div className="space-y-8 rounded-3xl border border-gray-100 bg-gray-50/50 p-8 dark:border-gray-800/50 dark:bg-gray-800/20">
              <div className="mb-2 flex items-end justify-between">
                <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Team Size</span>
                <span className="text-4xl font-black text-gray-900 dark:text-white">{seats}</span>
              </div>
              <input type="range" min={SUBSCRIPTION_PRICES.enterprise.minimumSeats} max={500} step={1} value={seats} onChange={(event) => setSeats(Number(event.target.value))} className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-primary-600 transition-all hover:h-4 dark:bg-gray-700" />
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                <span>{SUBSCRIPTION_PRICES.enterprise.minimumSeats}</span>
                <span>500+</span>
              </div>
            </div>
          </div>
          <aside className="relative w-full shrink-0 rounded-3xl border border-gray-800 bg-gray-900 p-8 shadow-2xl lg:w-96 dark:bg-black">
            <div className="relative z-10 space-y-8">
              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Total Monthly Cost</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">${totalCost.toLocaleString()}</span>
                  <span className="font-bold text-gray-400">/mo</span>
                </div>
              </div>
              <div className="border-t border-gray-800 pt-8">
                <div className="mb-3 flex items-center gap-2">
                  <Zap size={18} className="fill-current text-amber-400" />
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-300">Pooled Credits</span>
                </div>
                <div className="text-3xl font-black text-white">{totalCredits.toLocaleString()} <span className="text-lg font-medium tracking-normal text-gray-500">/mo</span></div>
              </div>
              <a href="mailto:partners@careervivid.app?subject=CareerVivid%20Enterprise" className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-4 font-bold text-gray-900 shadow-xl transition-all hover:bg-gray-100">
                <Handshake size={20} /> Contact Sales
              </a>
            </div>
          </aside>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-4 border-t border-gray-100 pt-8 dark:border-gray-800">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-600 dark:border-gray-700/50 dark:bg-gray-800/80 dark:text-gray-400"><TrendingUp size={16} className="text-green-500" /> SSO & RBAC Included</div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-600 dark:border-gray-700/50 dark:bg-gray-800/80 dark:text-gray-400"><Users size={16} className="text-blue-500" /> Private Team Workspaces</div>
        </div>
      </div>
    </section>
  );
}

export function CreditCalculator() {
  const [values, setValues] = useState<Record<string, number>>(Object.fromEntries(sliderConfigs.map((slider) => [slider.id, 0])));
  const [selectedPlan, setSelectedPlan] = useState(planOptions[1]);
  const totalCredits = useMemo(() => sliderConfigs.reduce((sum, slider) => sum + values[slider.id] * slider.cost, 0), [values]);
  const pct = Math.min((totalCredits / selectedPlan.limit) * 100, 100);
  const overLimit = totalCredits > selectedPlan.limit;
  const recommended = planOptions.find((plan) => plan.limit >= totalCredits) ?? planOptions[planOptions.length - 1];
  const breakdown = sliderConfigs.filter((slider) => values[slider.id] > 0).map((slider) => ({ label: slider.label, credits: values[slider.id] * slider.cost, color: slider.color }));

  return (
    <section className="mt-40 bg-gray-50 py-24 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"><Zap size={15} /> Credit Calculator</div>
          <h2 className="mb-4 text-4xl font-black tracking-tight text-gray-900 md:text-5xl dark:text-white">Find Your Perfect Plan</h2>
          <p className="mx-auto max-w-2xl text-lg font-medium text-gray-600 dark:text-gray-400">Drag the sliders to estimate how many credits you&apos;ll use each month.</p>
        </div>
        <div className="grid items-start gap-10 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            {sliderConfigs.map(({ id, label, description, icon: Icon, cost, max, step, color }) => (
              <div key={id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2"><Icon size={16} style={{ color }} /><span className="text-sm font-bold text-gray-800 dark:text-gray-200">{label}</span></div>
                  <div className="text-right"><span className="text-2xl font-black text-gray-900 dark:text-white">{values[id]}</span><span className="ml-1 text-xs text-gray-400">uses</span><div className="text-xs font-bold" style={{ color }}>= {(values[id] * cost).toFixed(1)} cr</div></div>
                </div>
                <p className="mb-4 text-xs text-gray-500">{description}</p>
                <input type="range" min={0} max={max} step={step} value={values[id]} onChange={(event) => setValues((prev) => ({ ...prev, [id]: Number(event.target.value) }))} className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none" style={{ background: `linear-gradient(to right, ${color} 0%, ${color} ${(values[id] / max) * 100}%, #e5e7eb ${(values[id] / max) * 100}%, #e5e7eb 100%)` }} />
              </div>
            ))}
          </div>
          <aside className="sticky top-6 space-y-5 lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">Compare with plan</p>
              <div className="flex flex-wrap gap-2">
                {planOptions.map((plan) => (
                  <button key={plan.name} type="button" onClick={() => setSelectedPlan(plan)} className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-all ${selectedPlan.name === plan.name ? "scale-105 border-current shadow-sm" : "border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"} ${plan.accent}`}>
                    {plan.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <p className="mb-1 text-xs font-black uppercase tracking-widest text-gray-400">Estimated monthly usage</p>
              <div className="mb-3 flex items-end justify-between"><span className="text-4xl font-black" style={{ color: overLimit ? "#ef4444" : selectedPlan.color }}>{totalCredits.toFixed(1)}</span><span className="text-sm font-medium text-gray-400">of {selectedPlan.limit.toLocaleString()} credits</span></div>
              <div className="mb-3 h-4 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: overLimit ? "#ef4444" : selectedPlan.color }} /></div>
              <div className={overLimit ? "flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800/50 dark:bg-red-900/20" : "flex items-center gap-2 text-sm"}>
                {overLimit ? <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={16} /> : <CheckCircle2 className="text-green-500" size={16} />}
                <span className={overLimit ? "text-sm font-bold text-red-700 dark:text-red-400" : "font-medium"} style={overLimit ? undefined : { color: selectedPlan.color }}>{overLimit ? `We recommend the ${recommended.name} plan (${recommended.price}).` : `${selectedPlan.name} plan covers your usage ✓`}</span>
              </div>
            </div>
            {breakdown.length > 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <p className="mb-4 text-xs font-black uppercase tracking-widest text-gray-400">Credit breakdown</p>
                <div className="space-y-2.5">
                  {breakdown.map((row) => <div key={row.label} className="flex items-center gap-3"><div className="h-2 w-2 shrink-0 rounded-full" style={{ background: row.color }} /><span className="grow truncate text-xs font-medium text-gray-600 dark:text-gray-400">{row.label}</span><span className="text-xs font-bold" style={{ color: row.color }}>{row.credits.toFixed(1)} cr</span></div>)}
                </div>
              </div>
            ) : null}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-white shadow-xl shadow-indigo-500/25">
              <div className="mb-3 flex items-center justify-between"><span className="text-sm font-black">Try CareerVivid free</span><Zap size={18} className="text-yellow-300" /></div>
              <p className="mb-5 text-xs font-medium leading-relaxed text-indigo-200">100 free AI credits every month: no credit card required. Use the CLI agent, search jobs, and tailor resumes instantly.</p>
              <a href="/signup" className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-black text-indigo-700 transition-colors hover:bg-indigo-50">Get 100 free credits <ChevronRight size={16} /></a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
