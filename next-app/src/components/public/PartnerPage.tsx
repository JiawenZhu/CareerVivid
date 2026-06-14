import { PartnerPageContent } from "../../lib/publicContent";
import { PrimaryLink, PublicShell, SectionLabel } from "./PublicShell";

const accentClasses: Record<PartnerPageContent["accent"], string> = {
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  blue: "bg-blue-50 text-blue-800 border-blue-200",
  green: "bg-emerald-50 text-emerald-800 border-emerald-200",
  purple: "bg-[#f3f2ff] text-[#5148c8] border-[#d9d7ff]",
  rose: "bg-rose-50 text-rose-800 border-rose-200",
};

export function PartnerPage({ content }: { content: PartnerPageContent }) {
  return (
    <PublicShell>
      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <SectionLabel>{content.eyebrow}</SectionLabel>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-normal md:text-6xl">
              {content.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#665a4a]">
              {content.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryLink href={`/partners/apply?type=${content.slug}`}>{content.cta}</PrimaryLink>
              <a
                href="/partners"
                className="rounded-2xl border border-[#e4d3bc] bg-[#fffaf1] px-5 py-3 text-sm font-bold text-[#211b16]"
              >
                View partner paths
              </a>
            </div>
          </div>

          <aside className="rounded-[1.4rem] border border-[#e4d3bc] bg-[#fffaf1] p-6 shadow-xl shadow-[#6b4b1f]/10">
            <SectionLabel>Partner outcomes</SectionLabel>
            <div className="mt-5 space-y-3">
              {content.outcomes.map((outcome) => (
                <div key={outcome} className="rounded-2xl border border-[#eadbc5] bg-white p-4">
                  <p className="text-sm font-semibold leading-6 text-[#665a4a]">{outcome}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="border-y border-[#e4d3bc] bg-[#fffaf1]/70">
          <div className="mx-auto grid max-w-6xl gap-4 px-6 py-12 md:grid-cols-3">
            {content.cards.map((card) => (
              <article key={card.title} className="rounded-2xl border border-[#e4d3bc] bg-white p-5 shadow-sm">
                <div className={`mb-5 inline-flex rounded-full border px-3 py-1 text-xs font-black ${accentClasses[content.accent]}`}>
                  CareerVivid
                </div>
                <h2 className="text-xl font-black">{card.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#665a4a]">{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        {content.steps ? (
          <section className="mx-auto max-w-6xl px-6 py-14">
            <SectionLabel>Pilot workflow</SectionLabel>
            <h2 className="mt-3 text-3xl font-black">A simple way to validate the partnership.</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {content.steps.map((step, index) => (
                <div key={step} className="rounded-2xl border border-[#e4d3bc] bg-[#fffaf1] p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#211b16] text-sm font-black text-[#fffaf1]">
                    {index + 1}
                  </span>
                  <p className="mt-4 text-sm font-semibold leading-6 text-[#665a4a]">{step}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </PublicShell>
  );
}
