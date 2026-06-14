import type { Metadata } from "next";
import { PublicShell, PrimaryLink, SectionLabel } from "../../components/public/PublicShell";
import { pricingCapabilities, pricingPlans } from "../../lib/pricingContent";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "CareerVivid pricing uses one AI credit system for resumes, job tracking, interview prep, CLI workflows, and team usage.",
  alternates: {
    canonical: "/pricing",
  },
};

export default function PricingPage() {
  return (
    <PublicShell>
      <main>
        <section className="mx-auto max-w-6xl px-6 py-16 text-center">
          <SectionLabel>Pricing</SectionLabel>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-tight tracking-normal md:text-6xl">
            One AI credit system for the whole career workspace.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#665a4a]">
            Use credits for AI actions like resume tailoring, job scoring,
            interview prep, and agent workflows. Manual writing, editing, and
            tracking stay available without extra AI spend.
          </p>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-12 md:grid-cols-2 lg:grid-cols-4">
          {pricingPlans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-[1.25rem] border p-5 shadow-sm ${
                plan.highlighted
                  ? "border-[#8d88e6] bg-[#f3f2ff]"
                  : "border-[#e4d3bc] bg-[#fffaf1]"
              }`}
            >
              <p className="text-sm font-black">{plan.name}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-sm font-bold text-[#665a4a]">{plan.cadence}</span>
              </div>
              <p className="mt-3 rounded-full bg-white px-3 py-1 text-xs font-black text-[#625bd5]">
                {plan.credits}
              </p>
              <p className="mt-4 text-sm leading-6 text-[#665a4a]">{plan.audience}</p>
              <ul className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="text-sm font-semibold leading-6 text-[#665a4a]">
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={plan.href}
                className="mt-6 inline-flex w-full justify-center rounded-2xl bg-[#211b16] px-4 py-3 text-sm font-bold text-[#fffaf1]"
              >
                {plan.name === "Enterprise" ? "Contact sales" : "Choose plan"}
              </a>
            </article>
          ))}
        </section>

        <section className="border-y border-[#e4d3bc] bg-[#fffaf1]/70">
          <div className="mx-auto grid max-w-6xl gap-5 px-6 py-12 md:grid-cols-3">
            {pricingCapabilities.map((group) => (
              <article key={group.group} className="rounded-2xl border border-[#e4d3bc] bg-white p-5">
                <h2 className="text-xl font-black">{group.group}</h2>
                <ul className="mt-4 space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="text-sm font-semibold leading-6 text-[#665a4a]">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-14 text-center">
          <h2 className="text-3xl font-black">Start free. Upgrade when AI usage becomes routine.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#665a4a]">
            The public pricing page is static for SEO. Checkout still happens
            inside the authenticated CareerVivid app so billing stays tied to
            the signed-in user.
          </p>
          <div className="mt-7">
            <PrimaryLink href="/signup">Start free</PrimaryLink>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
