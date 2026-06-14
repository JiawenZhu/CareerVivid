"use client";

import { Bot, Check, Terminal, X, Zap } from "lucide-react";
import { featureRows, plans } from "./PricingData";

function CellValue({ value, accent = "text-gray-600 dark:text-gray-400" }: { value: boolean | string | undefined; accent?: string }) {
  if (typeof value === "string") {
    return value ? <span className={`text-xs font-bold ${accent}`}>{value}</span> : null;
  }
  if (value) {
    return <Check className="mx-auto text-green-500" size={18} strokeWidth={3} />;
  }
  return <X className="mx-auto text-gray-300 dark:text-gray-600" size={18} />;
}

function PlanButton({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} className={`inline-flex w-full items-center justify-center rounded-xl py-4 font-bold transition-colors ${className}`}>
      {children}
    </a>
  );
}

export function PricingPlanGrid() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-20 text-center">
        <h2 className="sr-only">Choose your plan</h2>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          <Bot size={16} /> AI Credit Plans
        </div>
        <h2 className="mb-6 text-5xl font-black leading-tight tracking-tight text-gray-900 dark:text-white md:text-6xl">
          Power your career with{" "}
          <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">AI Credits</span>
        </h2>
        <p className="mx-auto max-w-3xl text-xl font-medium text-gray-600 dark:text-gray-400">
          One universal credit system powers the entire platform: the CLI agent, resume tailoring, job search, voice interviews, and more. Each AI action costs credits; manual work is always free.
        </p>
      </div>

      <div className="mb-24 grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:gap-8">
        <article className="group flex flex-col rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6">
            <h3 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Free</h3>
            <p className="text-sm font-medium text-gray-500">Try CareerVivid today.</p>
          </div>
          <div className="mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-gray-900 dark:text-white">$0</span>
              <span className="text-sm font-bold text-gray-500">USD / month</span>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-green-600 dark:bg-green-900/20">
              <Zap size={12} /> {plans.free.credits} AI credits / mo
            </div>
          </div>
          <PlanButton href={plans.free.href} className="mb-8 border-2 border-gray-200 text-gray-900 hover:bg-gray-50 dark:border-gray-800 dark:text-white dark:hover:bg-gray-800/50">Get Started Free</PlanButton>
          <ul className="flex-grow space-y-3.5 text-sm font-medium text-gray-600 dark:text-gray-400">
            {["Core AI career workspace", "Job search & tracker", "Gemini models included", "CLI Publish is free"].map((feature, index) => (
              <li key={feature} className="flex items-start gap-3">
                {index === 3 ? <Terminal className="mt-0.5 shrink-0 text-green-500" size={18} /> : <Check className="mt-0.5 shrink-0 text-green-500" size={18} />}
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-primary-500/30 bg-white p-8 shadow-xl transition-colors hover:border-primary-500/50 dark:bg-gray-900">
          <div className="mb-6">
            <h3 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Pro</h3>
            <p className="text-sm font-medium text-gray-500">For active job seekers.</p>
          </div>
          <div className="mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-gray-900 dark:text-white">${plans.pro.price}</span>
              <span className="text-sm font-bold text-gray-500">USD / month</span>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-600 dark:bg-primary-900/20">
              <Zap size={12} /> {plans.pro.credits.toLocaleString()} AI credits / mo
            </div>
            <p className="mt-2 text-xs text-gray-400">Cancel or change anytime</p>
          </div>
          <PlanButton href={plans.pro.href} className="mb-8 border-2 border-gray-200 text-gray-900 hover:bg-gray-50 dark:border-gray-800 dark:text-white">Start Pro</PlanButton>
          <ul className="flex-grow space-y-3.5 text-sm font-medium text-gray-600 dark:text-gray-400">
            {["Everything in Free", "Gemini Pro model access", "Resume tailoring and job prep", "Living Documentation Sync"].map((feature) => (
              <li key={feature} className="flex items-start gap-3"><Check className="mt-0.5 shrink-0 text-primary-500" size={18} /><span>{feature}</span></li>
            ))}
          </ul>
        </article>

        <article className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-purple-500 bg-white p-8 shadow-2xl dark:bg-gray-900">
          <span className="absolute right-6 top-6 rounded-full bg-purple-100 px-3 py-1 text-[10px] font-black text-purple-700">Power</span>
          <div className="mb-6">
            <h3 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Max</h3>
            <p className="text-sm font-medium text-gray-500">For heavy AI and job-search usage.</p>
          </div>
          <div className="mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-gray-900 dark:text-white">${plans.max.price}</span>
              <span className="text-sm font-bold text-gray-500">USD / month</span>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-purple-600 dark:border-purple-800/50 dark:bg-purple-900/20">
              <Zap size={12} /> {plans.max.credits.toLocaleString()} AI credits / mo
            </div>
            <p className="mt-2 text-xs text-gray-400">Cancel or change anytime</p>
          </div>
          <PlanButton href={plans.max.href} className="mb-8 bg-gray-950 text-white hover:bg-black">Get Max</PlanButton>
          <ul className="flex-grow space-y-3.5 text-sm font-medium text-gray-600 dark:text-gray-400">
            {["Everything in Pro", "Private posts and advanced ReactFlow", "4.5x more AI credits than Pro", "Priority model access"].map((feature) => (
              <li key={feature} className="flex items-start gap-3"><Check className="mt-0.5 shrink-0 text-purple-500" size={18} /><span>{feature}</span></li>
            ))}
          </ul>
        </article>

        <article className="relative flex flex-col overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 p-8 text-white shadow-2xl dark:bg-black">
          <div className="mb-6">
            <h3 className="mb-1 text-2xl font-bold">Enterprise</h3>
            <p className="text-sm font-medium text-gray-400">For teams and organizations.</p>
          </div>
          <div className="mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black">${plans.enterprise.price}</span>
              <span className="text-sm font-bold text-gray-400">USD / seat / month</span>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
              <Zap size={12} /> {plans.enterprise.credits.toLocaleString()} pooled credits/seat
            </div>
            <p className="mt-2 text-xs text-gray-500">2-seat minimum, credits pool across all seats</p>
          </div>
          <PlanButton href={plans.enterprise.href} className="mb-8 bg-white text-gray-900 hover:bg-gray-100">Contact Sales</PlanButton>
          <ul className="flex-grow space-y-3.5 text-sm font-medium text-gray-300">
            {["Private Team Workspaces", "SSO & SCIM provisioning", "Team RBAC & audit logs", "Pooled credits across org"].map((feature) => (
              <li key={feature} className="flex items-start gap-3"><Check className="mt-0.5 shrink-0 text-amber-400" size={18} /><span>{feature}</span></li>
            ))}
          </ul>
        </article>
      </div>

      <div className="mt-20 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-black uppercase tracking-widest text-gray-500 dark:bg-gray-800/80">
                <th className="border-b border-gray-200 p-5 dark:border-gray-800">Capabilities</th>
                <th className="w-36 border-b border-gray-200 p-5 text-center dark:border-gray-800">Free</th>
                <th className="w-36 border-b border-gray-200 p-5 text-center text-primary-600 dark:border-gray-800 dark:text-primary-400">Pro</th>
                <th className="w-36 border-b border-gray-200 p-5 text-center text-purple-600 dark:border-gray-800 dark:text-purple-400">Max</th>
                <th className="w-36 border-b border-gray-200 p-5 text-center dark:border-gray-800">Enterprise</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {featureRows.map((row, index) => row.category ? (
                <tr key={row.category} className="bg-gray-50/80 dark:bg-gray-800/60">
                  <td colSpan={5} className="px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{row.category}</td>
                </tr>
              ) : (
                <tr key={`${row.name}-${index}`} className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="border-b border-gray-100 px-5 py-4 font-medium text-gray-700 transition-colors group-hover:text-primary-600 dark:border-gray-800/50 dark:text-gray-300 dark:group-hover:text-primary-400">{row.name}</td>
                  <td className="border-b border-gray-100 px-5 py-4 text-center dark:border-gray-800/50"><CellValue value={row.free} /></td>
                  <td className="border-b border-gray-100 bg-primary-50/20 px-5 py-4 text-center dark:border-gray-800/50 dark:bg-primary-900/5"><CellValue value={row.pro} accent="text-primary-600 dark:text-primary-400" /></td>
                  <td className="border-b border-gray-100 bg-purple-50/30 px-5 py-4 text-center dark:border-gray-800/50 dark:bg-purple-900/10"><CellValue value={row.max} accent="text-purple-600 dark:text-purple-400" /></td>
                  <td className="border-b border-gray-100 px-5 py-4 text-center dark:border-gray-800/50"><CellValue value={row.enterprise} accent="text-amber-600 dark:text-amber-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 text-center text-xs font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-800/50">
          ✨ All manual content creation, writing, editing, publishing, and tracking remain available without extra AI spend.
        </div>
      </div>
    </div>
  );
}
