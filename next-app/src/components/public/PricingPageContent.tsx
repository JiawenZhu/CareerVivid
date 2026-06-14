import { CreditCalculator, EnterpriseCalculator } from "./pricing/PricingCalculators";
import { PricingPlanGrid } from "./pricing/PricingPlanGrid";

export function PricingPageContent() {
  return (
    <main className="overflow-hidden bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <section className="relative px-4 pt-32 text-center sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-primary-500/10 blur-[120px] dark:bg-primary-600/10" />
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-200/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-5 py-2 text-sm font-bold text-indigo-700 shadow-sm dark:border-indigo-800/50 dark:from-indigo-900/40 dark:to-purple-900/40 dark:text-indigo-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-indigo-500" />
            </span>
            AI Credit Plans — Free to get started
          </div>
          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-7xl dark:text-white">
            One AI credit system <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">for your entire career</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-xl font-medium leading-relaxed text-gray-600 sm:text-2xl dark:text-gray-400">
            Power the CLI agent, resume tailoring, job search, voice interviews, and more — all from a single pool of AI credits that resets every month.
          </p>
        </div>
      </section>

      <PricingPlanGrid />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <EnterpriseCalculator />
      </div>
      <CreditCalculator />
    </main>
  );
}
