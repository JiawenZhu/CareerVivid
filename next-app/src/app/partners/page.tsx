import type { Metadata } from "next";
import { PublicShell, PrimaryLink, SectionLabel } from "../../components/public/PublicShell";
import { partnerLanding } from "../../lib/publicContent";

export const metadata: Metadata = {
  title: "Partner Programs",
  description: partnerLanding.description,
  alternates: {
    canonical: "/partners",
  },
};

export default function PartnersPage() {
  return (
    <PublicShell>
      <main>
        <section className="mx-auto max-w-6xl px-6 py-16">
          <SectionLabel>CareerVivid partners</SectionLabel>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-normal md:text-6xl">
            Build better job-search outcomes with partners who already support candidates.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#665a4a]">
            {partnerLanding.description}
          </p>
          <div className="mt-8">
            <PrimaryLink href="/partners/apply">Apply to partner</PrimaryLink>
          </div>
        </section>

        <section className="border-y border-[#e4d3bc] bg-[#fffaf1]/70">
          <div className="mx-auto grid max-w-6xl gap-4 px-6 py-12 md:grid-cols-2">
            {partnerLanding.cards.map((card) => (
              <a key={card.href} href={card.href} className="rounded-2xl border border-[#e4d3bc] bg-white p-6 shadow-sm transition hover:border-[#caa26c]">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a97935]">{card.label}</p>
                <h2 className="mt-3 text-2xl font-black">{card.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#665a4a]">{card.body}</p>
              </a>
            ))}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
