"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bot, Briefcase, Check, CheckCircle2, ChevronRight, FileText, Mic, Terminal, X, Zap } from "lucide-react";

const plans = {
  free: { name: "Free", price: 0, annualPrice: 0, credits: 100, cta: "Get Started Free", href: "/signup" },
  pro: { name: "Pro", price: 12, annualPrice: 10, annualBill: 120, credits: 1000, cta: "Start Pro", href: "/signup?redirect=/subscription" },
  max: { name: "Max", price: 35, annualPrice: 31, annualBill: 372, credits: 4500, cta: "Get Max", href: "/signup?redirect=/subscription" },
  enterprise: { name: "Enterprise", price: 12, credits: 1500, cta: "Contact Sales", href: "mailto:partners@careervivid.app?subject=CareerVivid%20Enterprise" },
};

const featureRows: Array<{
  category?: string;
  name?: string;
  free?: boolean | string;
  pro?: boolean | string;
  max?: boolean | string;
  enterprise?: boolean | string;
}> = [
  { category: "CLI AI Agent" },
  { name: "cv agent with Gemini Flash Lite", free: true, pro: true, max: true, enterprise: true },
  { name: "cv agent with Gemini Flash", free: true, pro: true, max: true, enterprise: true },
  { name: "cv agent --pro with Gemini Pro", free: false, pro: true, max: true, enterprise: true },
  { name: "cv agent --jobs for job search and tracker", free: true, pro: true, max: true, enterprise: true },
  { name: "Bring your own API key", free: true, pro: true, max: true, enterprise: true },
  { category: "Job and Resume AI" },
  { name: "AI resume tailor", free: "5 credits", pro: "5 credits", max: "5 credits", enterprise: "5 credits" },
  { name: "Job search and scoring", free: "1 credit", pro: "1 credit", max: "1 credit", enterprise: "1 credit" },
  { name: "Targeted job prep notes", free: "10 credits", pro: "10 credits", max: "10 credits", enterprise: "10 credits" },
  { category: "Developer Tools" },
  { name: "CLI Publish with Markdown and Mermaid", free: "Free", pro: "Free", max: "Free", enterprise: "Free" },
  { name: "ReactFlow UI conversion", free: "5 credits", pro: "5 credits", max: "5 credits", enterprise: "5 credits" },
  { name: "Architecture auto-generation", free: "10 credits", pro: "10 credits", max: "10 credits", enterprise: "10 credits" },
  { name: "Living documentation sync", free: false, pro: true, max: true, enterprise: true },
  { category: "Interviews and Teams" },
  { name: "Technical voice interviews", free: "15 credits", pro: "15 credits", max: "15 credits", enterprise: "15 credits" },
  { name: "Portfolio review analysis", free: "5 credits", pro: "5 credits", max: "5 credits", enterprise: "5 credits" },
  { name: "Private team workspaces", free: false, pro: false, max: false, enterprise: true },
  { name: "Advanced RBAC and SSO", free: false, pro: false, max: false, enterprise: true },
];

const creditActions = [
  { id: "agentFlash", label: "CLI Agent turns", description: "Each Gemini Flash message costs 1 credit.", icon: Bot, cost: 1, max: 500, step: 10, color: "#625bd5" },
  { id: "agentLite", label: "Flash Lite turns", description: "Fastest model at the lowest cost, 0.5 credits each.", icon: Bot, cost: 0.5, max: 500, step: 10, color: "#8d88e6" },
  { id: "agentPro", label: "Gemini Pro turns", description: "Deep reasoning mode, 2 credits each.", icon: Bot, cost: 2, max: 200, step: 5, color: "#9a651f" },
  { id: "resume", label: "Resume tailorings", description: "AI resume tailoring costs 5 credits each.", icon: FileText, cost: 5, max: 100, step: 1, color: "#137245" },
  { id: "jobSearches", label: "Job searches", description: "AI-powered job search and scoring costs 1 credit each.", icon: Briefcase, cost: 1, max: 200, step: 5, color: "#a97935" },
  { id: "interviews", label: "Voice interviews", description: "Technical voice interviews cost 15 credits each.", icon: Mic, cost: 15, max: 50, step: 1, color: "#b64a5a" },
  { id: "architecture", label: "Architecture auto-gens", description: "Architecture generation costs 10 credits each.", icon: Terminal, cost: 10, max: 50, step: 1, color: "#2563eb" },
];

const planOptions = [
  { name: "Free", limit: plans.free.credits, price: "$0/mo", color: "#6b7280" },
  { name: "Pro", limit: plans.pro.credits, price: "$12/mo", color: "#625bd5" },
  { name: "Max", limit: plans.max.credits, price: "$35/mo", color: "#9a651f" },
];

function CellValue({ value }: { value: boolean | string | undefined }) {
  if (typeof value === "string") {
    return <span className="text-xs font-black text-[#625bd5]">{value}</span>;
  }
  if (value) {
    return <Check className="mx-auto text-emerald-600" size={18} strokeWidth={3} />;
  }
  return <X className="mx-auto text-[#c5b8a6]" size={18} />;
}

function PlanCard({
  plan,
  billingCycle,
  highlighted,
  dark,
}: {
  plan: typeof plans.free | typeof plans.pro | typeof plans.max | typeof plans.enterprise;
  billingCycle: "monthly" | "annual";
  highlighted?: boolean;
  dark?: boolean;
}) {
  const price = "annualPrice" in plan && billingCycle === "annual" ? plan.annualPrice : plan.price;
  const annualText = "annualBill" in plan && billingCycle === "annual" ? `Billed yearly as $${plan.annualBill}/year` : "Cancel or change anytime";

  return (
    <article className={`relative flex min-h-[520px] flex-col rounded-[1.5rem] border p-7 shadow-sm ${dark ? "border-[#302d3f] bg-[#211f2d] text-white" : highlighted ? "border-[#caa26c] bg-[#fbf7ee]" : "border-[#e7dfd2] bg-white"}`}>
      {highlighted ? <span className="absolute right-5 top-5 rounded-full bg-[#fff4d7] px-3 py-1 text-[11px] font-bold text-[#8a5b12]">Power</span> : null}
      <div className="mb-6">
        <h2 className={`text-[25px] font-semibold ${dark ? "text-white" : "text-gray-950"}`}>{plan.name}</h2>
        <p className={`mt-2 text-sm font-medium ${dark ? "text-[#d8d2c7]" : "text-[#665a4a]"}`}>
          {plan.name === "Free" ? "Try CareerVivid today." : plan.name === "Pro" ? "For active job seekers." : plan.name === "Max" ? "For heavy AI and job-search usage." : "For teams and organizations."}
        </p>
      </div>
      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-semibold">$</span>
          <span className="text-[54px] font-semibold leading-none">{price}</span>
          <span className={`text-sm font-semibold ${dark ? "text-[#d8d2c7]" : "text-[#6d6257]"}`}>{plan.name === "Enterprise" ? "USD / seat / month" : "USD / month"}</span>
        </div>
        <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${dark ? "border border-amber-300/20 bg-amber-300/10 text-amber-300" : highlighted ? "bg-[#fff4d7] text-[#8a5b12]" : "bg-[#f0eeff] text-[#625bd5]"}`}>
          <Zap size={12} /> {plan.credits.toLocaleString()} {plan.name === "Enterprise" ? "pooled credits/seat" : "AI credits / mo"}
        </div>
        {plan.name !== "Free" && plan.name !== "Enterprise" ? <p className={`mt-3 text-xs font-medium ${dark ? "text-[#d8d2c7]" : "text-[#7d7265]"}`}>{annualText}</p> : null}
      </div>
      <a href={plan.href} className={`mb-7 inline-flex w-full items-center justify-center rounded-full py-3.5 font-bold transition ${dark ? "bg-white text-gray-950 hover:bg-[#f5efe5]" : highlighted ? "bg-gray-950 text-white hover:bg-black" : "border border-[#d8d0c3] text-gray-950 hover:bg-[#f7f1e7]"}`}>
        {plan.cta}
      </a>
      <ul className={`space-y-4 text-sm font-medium ${dark ? "text-[#e4ded2]" : "text-[#3f3a34]"}`}>
        {[
          plan.name === "Free" ? "Core AI career workspace" : `Everything in ${plan.name === "Pro" ? "Free" : plan.name === "Max" ? "Pro" : "Max"}`,
          plan.name === "Enterprise" ? "Private team workspaces" : "Job search and tracker",
          plan.name === "Enterprise" ? "SSO and audit logs" : "Resume tailoring and job prep",
          plan.name === "Enterprise" ? "Pooled credits across org" : plan.name === "Free" ? "Gemini models included" : "Priority career workflows",
        ].map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className={`mt-0.5 shrink-0 ${dark ? "text-amber-300" : highlighted ? "text-[#a97935]" : "text-emerald-600"}`} size={17} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function CreditCalculator() {
  const [values, setValues] = useState<Record<string, number>>(Object.fromEntries(creditActions.map((action) => [action.id, 0])));
  const [selectedPlan, setSelectedPlan] = useState(planOptions[1]);
  const totalCredits = useMemo(() => creditActions.reduce((sum, action) => sum + values[action.id] * action.cost, 0), [values]);
  const pct = Math.min((totalCredits / selectedPlan.limit) * 100, 100);
  const overLimit = totalCredits > selectedPlan.limit;
  const recommended = planOptions.find((plan) => plan.limit >= totalCredits) ?? planOptions[planOptions.length - 1];

  return (
    <section className="rounded-[1.5rem] border border-[#e4d3bc] bg-[#fffaf1] p-5 shadow-sm md:p-8">
      <div className="mb-8 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-[#f0eeff] px-4 py-1.5 text-sm font-bold text-[#625bd5]">
          <Zap size={15} /> Credit Calculator
        </p>
        <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Find your plan by monthly AI usage.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-[#665a4a]">Move the sliders to estimate how many credits your job search, resume tailoring, interviews, and agent workflows may use.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {creditActions.map(({ id, label, description, icon: Icon, cost, max, step, color }) => (
            <div key={id} className="rounded-2xl border border-[#e4d3bc] bg-white p-5">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Icon size={16} style={{ color }} />
                  <span className="text-sm font-black text-[#211b16]">{label}</span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-[#211b16]">{values[id]}</p>
                  <p className="text-xs font-bold" style={{ color }}>{(values[id] * cost).toFixed(1)} cr</p>
                </div>
              </div>
              <p className="mb-4 text-xs font-medium text-[#665a4a]">{description}</p>
              <input
                type="range"
                min={0}
                max={max}
                step={step}
                value={values[id]}
                onChange={(event) => setValues((prev) => ({ ...prev, [id]: Number(event.target.value) }))}
                className="w-full accent-[#625bd5]"
              />
            </div>
          ))}
        </div>

        <aside className="space-y-5 lg:col-span-2 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-[#e4d3bc] bg-white p-5">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#a97935]">Compare with plan</p>
            <div className="flex flex-wrap gap-2">
              {planOptions.map((plan) => (
                <button key={plan.name} type="button" onClick={() => setSelectedPlan(plan)} className={`rounded-full border px-4 py-2 text-sm font-bold ${selectedPlan.name === plan.name ? "border-[#625bd5] bg-[#f0eeff] text-[#5148c8]" : "border-[#e4d3bc] text-[#665a4a]"}`}>
                  {plan.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#e4d3bc] bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a97935]">Estimated monthly usage</p>
            <div className="mt-3 flex items-end justify-between">
              <span className="text-4xl font-black" style={{ color: overLimit ? "#b64a5a" : selectedPlan.color }}>{totalCredits.toFixed(1)}</span>
              <span className="text-sm font-medium text-[#665a4a]">of {selectedPlan.limit.toLocaleString()} credits</span>
            </div>
            <div className="mt-4 h-4 overflow-hidden rounded-full bg-[#ece2d2]">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: overLimit ? "#b64a5a" : selectedPlan.color }} />
            </div>
            <div className={`mt-4 rounded-xl p-3 text-sm font-bold ${overLimit ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
              {overLimit ? (
                <span className="flex gap-2"><AlertTriangle size={16} /> We recommend the {recommended.name} plan ({recommended.price}).</span>
              ) : (
                <span className="flex gap-2"><CheckCircle2 size={16} /> {selectedPlan.name} covers this usage.</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-[#211b16] p-5 text-[#fffaf1]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black">Try CareerVivid free</span>
              <Zap size={18} className="text-yellow-300" />
            </div>
            <p className="mb-5 text-xs font-medium leading-6 text-[#e7d4b9]">100 free AI credits every month. Use the agent, search jobs, and tailor resumes without a credit card.</p>
            <a href="/signup" className="flex items-center justify-center gap-2 rounded-xl bg-[#fffaf1] py-3 text-sm font-black text-[#211b16]">
              Get 100 free credits <ChevronRight size={16} />
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}

function EnterpriseEstimator() {
  const [seats, setSeats] = useState(10);
  const totalCost = seats * plans.enterprise.price;
  const totalCredits = seats * plans.enterprise.credits;

  return (
    <section className="rounded-[1.5rem] border border-[#e4d3bc] bg-white p-6 shadow-sm md:p-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a97935]">Enterprise team usage</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Pool AI credits across a team.</h2>
          <p className="mt-4 text-base font-medium leading-8 text-[#665a4a]">Enterprise starts at ${plans.enterprise.price}/seat/month with {plans.enterprise.credits.toLocaleString()} credits per seat and shared team workspaces.</p>
          <div className="mt-8 rounded-2xl border border-[#e4d3bc] bg-[#fffaf1] p-5">
            <div className="mb-4 flex items-end justify-between">
              <span className="text-sm font-black uppercase tracking-[0.18em] text-[#a97935]">Team size</span>
              <span className="text-4xl font-black">{seats}</span>
            </div>
            <input type="range" min={2} max={500} step={1} value={seats} onChange={(event) => setSeats(Number(event.target.value))} className="w-full accent-[#625bd5]" />
            <div className="mt-2 flex justify-between text-xs font-bold text-[#665a4a]">
              <span>2</span>
              <span>500+</span>
            </div>
          </div>
        </div>
        <aside className="rounded-3xl bg-[#211b16] p-8 text-[#fffaf1] shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d3a15e]">Total monthly cost</p>
          <p className="mt-3 text-5xl font-black">${totalCost.toLocaleString()}<span className="text-base font-bold text-[#e7d4b9]">/mo</span></p>
          <div className="mt-8 border-t border-[#fffaf1]/15 pt-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d3a15e]">Pooled credits</p>
            <p className="mt-3 text-3xl font-black">{totalCredits.toLocaleString()}<span className="text-base font-bold text-[#e7d4b9]">/mo</span></p>
          </div>
          <a href={plans.enterprise.href} className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#fffaf1] py-4 font-black text-[#211b16]">Contact Sales</a>
        </aside>
      </div>
    </section>
  );
}

export function PricingPageContent() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#d9d7ff] bg-[#f3f2ff] px-5 py-2 text-sm font-black text-[#5148c8]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#625bd5]" /> AI Credit Plans - Free to get started
        </p>
        <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-black leading-tight tracking-normal md:text-7xl">
          One AI credit system for your entire career.
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg font-medium leading-8 text-[#665a4a] md:text-xl">
          Power the CLI agent, resume tailoring, job search, voice interviews, and more from a single pool of AI credits that resets every month.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-10 text-center">
          <h2 className="mb-5 text-4xl font-black tracking-tight">Choose your plan</h2>
          <div className="inline-flex rounded-full border border-[#ded6c9] bg-[#ece8df] p-1.5">
            {(["monthly", "annual"] as const).map((cycle) => (
              <button key={cycle} type="button" onClick={() => setBillingCycle(cycle)} className={`min-w-32 rounded-full px-5 py-2.5 text-sm font-semibold transition ${billingCycle === cycle ? "bg-white text-gray-950 shadow-sm" : "text-[#6d6257] hover:text-gray-950"}`}>
                {cycle === "monthly" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <PlanCard plan={plans.free} billingCycle={billingCycle} />
          <PlanCard plan={plans.pro} billingCycle={billingCycle} />
          <PlanCard plan={plans.max} billingCycle={billingCycle} highlighted />
          <PlanCard plan={plans.enterprise} billingCycle={billingCycle} dark />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="overflow-hidden rounded-3xl border border-[#e4d3bc] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#fffaf1] text-xs font-black uppercase tracking-widest text-[#665a4a]">
                  <th className="border-b border-[#e4d3bc] p-5">Capabilities</th>
                  <th className="border-b border-[#e4d3bc] p-5 text-center">Free</th>
                  <th className="border-b border-[#e4d3bc] p-5 text-center text-[#625bd5]">Pro</th>
                  <th className="border-b border-[#e4d3bc] p-5 text-center text-[#9a651f]">Max</th>
                  <th className="border-b border-[#e4d3bc] p-5 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {featureRows.map((row, index) => row.category ? (
                  <tr key={row.category} className="bg-[#f7f1e7]/80">
                    <td colSpan={5} className="px-5 py-3 text-xs font-black uppercase tracking-widest text-[#665a4a]">{row.category}</td>
                  </tr>
                ) : (
                  <tr key={`${row.name}-${index}`} className="hover:bg-[#fffaf1]">
                    <td className="border-b border-[#f0e5d5] px-5 py-4 font-medium text-[#665a4a]">{row.name}</td>
                    <td className="border-b border-[#f0e5d5] px-5 py-4 text-center"><CellValue value={row.free} /></td>
                    <td className="border-b border-[#f0e5d5] bg-[#f8f7ff] px-5 py-4 text-center"><CellValue value={row.pro} /></td>
                    <td className="border-b border-[#f0e5d5] bg-[#fffaf1] px-5 py-4 text-center"><CellValue value={row.max} /></td>
                    <td className="border-b border-[#f0e5d5] px-5 py-4 text-center"><CellValue value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-[#e4d3bc] bg-[#fffaf1] px-6 py-4 text-center text-xs font-medium text-[#665a4a]">
            Manual content creation, writing, editing, publishing, and tracking remain available without extra AI spend.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <EnterpriseEstimator />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <CreditCalculator />
      </section>
    </main>
  );
}
