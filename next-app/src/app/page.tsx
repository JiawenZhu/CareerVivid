import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Job Search Workspace",
  description:
    "CareerVivid helps job seekers manage resumes, saved jobs, interview prep, and application context in one workspace.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f1e7] text-[#211b16]">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-[#a97935]">
            AI job-search workspace
          </p>
          <h1 className="max-w-xl text-5xl font-black leading-[0.95] tracking-normal text-[#211b16] md:text-7xl">
            One workspace for every job application.
          </h1>
          <p className="mt-7 max-w-xl rounded-2xl border border-[#e4d3bc] bg-[#fffaf1]/75 p-5 text-base leading-8 text-[#665a4a]">
            CareerVivid connects resumes, job tracking, interview prep,
            portfolios, and Chrome extension autofill so each role has context
            and a next step.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              className="rounded-2xl bg-[#211b16] px-5 py-3 text-sm font-bold text-white shadow-sm"
              href="/signup"
            >
              Start free
            </a>
            <a
              className="rounded-2xl border border-[#e4d3bc] bg-[#fffaf1] px-5 py-3 text-sm font-bold text-[#211b16] shadow-sm"
              href="/job-tracker"
            >
              See job tracker
            </a>
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-[#e4d3bc] bg-[#fffaf1] shadow-xl shadow-[#6b4b1f]/10">
          <div className="flex items-center justify-between border-b border-[#e4d3bc] px-6 py-4">
            <div className="flex gap-2">
              <span className="h-3 w-3 rounded-full bg-[#fb7185]" />
              <span className="h-3 w-3 rounded-full bg-[#fbbf24]" />
              <span className="h-3 w-3 rounded-full bg-[#34d399]" />
            </div>
            <span className="rounded-full border border-[#e4d3bc] bg-white px-4 py-1 text-xs font-bold text-[#665a4a]">
              CareerVivid workspace
            </span>
          </div>
          <div className="grid gap-5 p-6 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a97935]">
                Career pipeline
              </p>
              <h2 className="mt-2 text-2xl font-black">36 saved opportunities</h2>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ["Saved", "36"],
                  ["Direct links", "29"],
                  ["Interviewing", "3"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-[#e4d3bc] bg-white p-4">
                    <p className="text-xs font-bold text-[#665a4a]">{label}</p>
                    <p className="mt-2 text-3xl font-black">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3 rounded-2xl border border-[#eadbc5] bg-[#f9f0df] p-4 sm:grid-cols-3">
                {["To apply", "Applied", "Interview"].map((column, index) => (
                  <div key={column} className="rounded-xl bg-white p-3 shadow-sm">
                    <p className="text-sm font-black">{column}</p>
                    <p className="mt-3 text-sm font-bold text-[#625bd5]">
                      {index === 0 ? "Senior UX Engineer" : index === 1 ? "AI Systems Engineer" : "Prep attached"}
                    </p>
                    <p className="mt-1 text-xs text-[#665a4a]">
                      {index === 0 ? "Google" : index === 1 ? "OpenAI" : "Role notes ready"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <aside className="rounded-2xl border border-[#e4d3bc] bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a97935]">
                Resume match
              </p>
              <h3 className="mt-3 text-3xl font-black">75% ready</h3>
              <div className="mt-5 h-3 rounded-full bg-[#e7dcc9]">
                <div className="h-3 w-3/4 rounded-full bg-[#2f64ed]" />
              </div>
              <p className="mt-5 text-sm leading-7 text-[#665a4a]">
                Strong match on TypeScript, design systems, and full-stack
                work. Add clearer AI tooling and product proof.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["HTML", "CSS", "TypeScript", "AI tools"].map((tag) => (
                  <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {tag}
                  </span>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
