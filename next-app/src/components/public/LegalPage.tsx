import { legalPages } from "../../lib/publicContent";
import { PublicShell, SectionLabel } from "./PublicShell";

type LegalPageKey = keyof typeof legalPages;

export function LegalPage({ pageKey }: { pageKey: LegalPageKey }) {
  const page = legalPages[pageKey];

  return (
    <PublicShell>
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center">
          <SectionLabel>CareerVivid legal</SectionLabel>
          <h1 className="mt-5 text-4xl font-black tracking-normal md:text-6xl">{page.title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#665a4a]">
            {page.description}
          </p>
        </div>

        <div className="mt-12 space-y-5">
          {page.sections.map((section) => (
            <section key={section.title} className="rounded-[1.25rem] border border-[#e4d3bc] bg-[#fffaf1] p-6 shadow-sm">
              <h2 className="text-2xl font-black">{section.title}</h2>
              <div className="mt-5 space-y-4">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-[#665a4a]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </PublicShell>
  );
}
