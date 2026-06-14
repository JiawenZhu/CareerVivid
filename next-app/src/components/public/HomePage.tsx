import {
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { faqs, experienceEntries, expertiseBlocks, featureTabs, teamEducationCards, trustNotes, trustSignals, workflowCards } from "./HomePageData";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";
import { ProductPreview } from "./ProductPreview";

function PaperSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative overflow-hidden border-t border-[#e6dac8] bg-[#f7f1e7] text-[#211b16] ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(139, 90, 22, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(139, 90, 22, 0.06) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="relative">{children}</div>
    </section>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[#e6dac8] bg-[#f7f1e7] pb-16 pt-28 text-[#211b16] sm:pb-24 sm:pt-32">
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(139, 90, 22, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(139, 90, 22, 0.06) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a97935]">AI job-search workspace</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.96] tracking-tight text-[#211b16] sm:text-6xl lg:text-7xl">
              One workspace for every job application.
            </h1>
            <div className="mt-7 max-w-2xl rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/78 p-5 shadow-sm shadow-[#8b5a16]/5">
              <p className="text-[17px] font-medium leading-8 text-[#665a4a]">
                CareerVivid is an AI job-search workspace for people who want fewer scattered tabs and a clearer application routine. It connects resumes, job tracking, interview prep, portfolios, and Chrome extension autofill so each role has context and a next step.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/signup" className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl bg-[#211b16] px-6 py-4 text-base font-black text-white shadow-xl shadow-[#8b5a16]/10 transition hover:-translate-y-0.5 hover:bg-[#3a2b20]">
                Start free <ArrowRight size={19} />
              </a>
              <a href="/job-tracker" className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl border border-[#d8c6ad] bg-[#fffaf1] px-6 py-4 text-base font-black text-[#211b16] shadow-sm transition hover:-translate-y-0.5 hover:border-[#bfa782]">
                See job tracker
              </a>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {trustSignals.map((signal) => (
                <div key={signal} className="flex items-start gap-2 rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/78 p-3 text-sm font-bold text-[#665a4a] shadow-sm">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#137245]" />
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          </div>
          <ProductPreview />
        </div>

        <div className="mt-10 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {featureTabs.slice(0, 5).map(({ label, icon: Icon, href }) => (
            <a key={label} href={href} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/80 px-4 py-3 text-sm font-black text-[#665a4a] shadow-sm transition hover:-translate-y-0.5 hover:text-[#211b16]">
              <Icon size={16} />
              {label}
            </a>
          ))}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {workflowCards.map(({ icon: Icon, title, copy, tone }) => (
            <div key={title} className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/78 p-6 shadow-sm">
              <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
                <Icon size={21} />
              </div>
              <h2 className="text-xl font-black text-[#211b16]">{title}</h2>
              <p className="mt-3 text-sm font-medium leading-6 text-[#665a4a]">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductIndex() {
  return (
    <section className="border-y border-gray-200 bg-white/90 py-4 dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-4 pb-1 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {featureTabs.map(({ label, icon: Icon, href }) => (
          <a key={label} href={href} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <Icon size={16} className="text-blue-600 dark:text-blue-300" />
            {label}
          </a>
        ))}
      </div>
    </section>
  );
}

function ProfileSnapshot() {
  return (
    <aside className="rounded-lg border border-[#e4d3bc] bg-[#f9efe0]/75 p-6 shadow-sm shadow-[#8b5a16]/5 lg:sticky lg:top-28">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a97935]">Profile Snapshot</p>
      <p className="mt-5 text-[15px] font-medium leading-8 text-[#665a4a]">
        CareerVivid is a focused AI career workspace for job seekers who want fewer scattered tools and a clearer application routine. It combines a resume builder, job tracker, Chrome workflow, and interview coach so each role has context, preparation, and a next step.
      </p>
      <a href="/signup" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#9a651f] transition hover:text-[#211b16]">
        Create your own workspace <ArrowRight size={15} />
      </a>
    </aside>
  );
}

function ExperienceTimeline() {
  return (
    <div className="relative">
      <div className="absolute bottom-4 left-[18px] top-4 hidden w-px bg-[#d9c5aa] sm:block" />
      <div className="space-y-10">
        {experienceEntries.map((entry) => (
          <article key={entry.title} className="relative grid gap-4 sm:grid-cols-[72px_1fr]">
            <div className="hidden pt-1 text-right font-mono text-sm text-[#7d6e5e] sm:block">{entry.number}</div>
            <div>
              <div className="absolute left-[14px] top-2 hidden h-2.5 w-2.5 rounded-full bg-[#a97935] ring-4 ring-[#f7f1e7] sm:block" />
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a97935]">{entry.label}</p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-[#211b16]">{entry.title}</h3>
                  <p className="mt-1 text-base font-bold text-[#665a4a]">{entry.organization}</p>
                </div>
                <p className="font-mono text-sm font-bold text-[#a97935]">{entry.date}</p>
              </div>
              <ul className="space-y-3">
                {entry.bullets.map((bullet) => (
                  <li key={bullet} className="grid grid-cols-[14px_1fr] gap-3 text-[15px] font-medium leading-7 text-[#665a4a]">
                    <span className="text-[#a97935]">-</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <a href={entry.href} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#211b16] transition hover:text-[#9a651f]">
                Open this workflow <ArrowRight size={15} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ExpertisePanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
      <div className="grid gap-4 sm:grid-cols-2">
        {expertiseBlocks.map((block) => (
          <div key={block.title} className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1]/80 p-5">
            <h3 className="font-mono text-sm font-black uppercase tracking-[0.14em] text-[#8b5a16]">{block.title}</h3>
            <ul className="mt-4 space-y-2">
              {block.items.map((item) => (
                <li key={item} className="text-[15px] font-semibold text-[#665a4a]">{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-[#e4d3bc] bg-[#211b16] p-6 text-[#f7f1e7] shadow-xl shadow-[#6b4b1f]/10">
        <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#d3a15e]">Product routine</p>
        <pre className="mt-5 overflow-x-auto text-sm leading-7 text-[#f4dfbf]">
{`function prepareApplication(role) {
  const context = saveJob(role);
  const match = compareResume(context);
  const prep = generateInterviewPlan(match);
  return nextAction(prep);
}`}
        </pre>
      </div>
    </div>
  );
}

function TrustNotes() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {trustNotes.map(({ icon: Icon, title, copy }) => (
        <div key={title} className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1]/85 p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[#f2dfc2] text-[#8b5a16]">
            <Icon size={21} />
          </div>
          <h3 className="text-lg font-black text-[#211b16]">{title}</h3>
          <p className="mt-3 text-sm font-medium leading-6 text-[#665a4a]">{copy}</p>
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  return (
    <div className="min-h-screen bg-[#fbfbfe] text-gray-950 selection:bg-emerald-100 dark:bg-gray-950 dark:text-white">
      <PublicHeader />
      <main>
        <Hero />
        <ProductIndex />

        <PaperSection className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-14 grid gap-4 border-b border-[#e2d4c2] pb-10 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="font-mono text-sm font-black uppercase tracking-[0.18em] text-[#a97935]">Professional Experience</p>
                <h2 className="mt-3 text-4xl font-black tracking-tight text-[#211b16] sm:text-5xl">
                  A trustworthy job-search system, written like a product resume.
                </h2>
              </div>
              <p className="font-mono text-sm font-bold text-[#7d6e5e]">Updated May 25, 2026</p>
            </div>
            <div className="grid gap-10 lg:grid-cols-[340px_1fr]">
              <ProfileSnapshot />
              <ExperienceTimeline />
            </div>
          </div>
        </PaperSection>

        <PaperSection className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="font-mono text-sm font-black uppercase tracking-[0.18em] text-[#a97935]">Technical Implementations</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-[#211b16] sm:text-5xl">
                Practical tools for the parts of job search that repeat every week.
              </h2>
              <p className="mt-5 max-w-3xl text-lg font-medium leading-8 text-[#665a4a]">
                The lower page now reads like a clear product record: what each system does, why it exists, and where the user should go next.
              </p>
            </div>
            <ExpertisePanel />
          </div>
        </PaperSection>

        <PaperSection className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="font-mono text-sm font-black uppercase tracking-[0.18em] text-[#a97935]">Trust Comes From Clarity</p>
                <h2 className="mt-3 text-4xl font-black tracking-tight text-[#211b16] sm:text-5xl">
                  One workspace. Clear context for every application.
                </h2>
                <p className="mt-5 text-lg font-medium leading-8 text-[#665a4a]">
                  CareerVivid should feel like a reliable workbench, not a loud promise machine. The page keeps the strongest claims tied to visible product workflows.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a href="/signup" className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#211b16] px-6 py-4 font-black text-white shadow-lg shadow-[#6b4b1f]/15">
                    Start free <ArrowRight size={18} />
                  </a>
                  <a href="/pricing" className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#d8c6ad] bg-[#fffaf1] px-6 py-4 font-black text-[#211b16]">
                    View pricing
                  </a>
                </div>
              </div>
              <TrustNotes />
            </div>
          </div>
        </PaperSection>

        <PaperSection className="py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
            <div>
              <p className="font-mono text-sm font-black uppercase tracking-[0.18em] text-[#a97935]">For Teams & Education</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-[#211b16] sm:text-5xl">
                Start personal. Expand when the workflow needs a cohort.
              </h2>
            </div>
            <div className="grid gap-4">
              {teamEducationCards.map(({ icon: Icon, title, copy }) => (
                <div key={title} className="grid gap-4 rounded-lg border border-[#e4d3bc] bg-[#fffaf1]/85 p-5 sm:grid-cols-[44px_1fr]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f2dfc2] text-[#8b5a16]">
                    <Icon size={21} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#211b16]">{title}</h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-[#665a4a]">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PaperSection>

        <PaperSection className="py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="font-mono text-sm font-black uppercase tracking-[0.18em] text-[#a97935]">FAQ</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-[#211b16] sm:text-5xl">Questions before you start</h2>
            </div>
            <div className="mt-10 space-y-4">
              {faqs.map(({ question, answer }) => (
                <details key={question} className="group rounded-lg border border-[#e4d3bc] bg-[#fffaf1]/85 p-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-black text-[#211b16] [&::-webkit-details-marker]:hidden">
                    {question}
                    <ArrowRight size={18} className="shrink-0 transition group-open:rotate-90" />
                  </summary>
                  <p className="mt-4 text-base font-medium leading-7 text-[#665a4a]">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </PaperSection>

        <section className="bg-[#211b16] py-16 text-[#fffaf1] sm:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <p className="font-mono text-sm font-black uppercase tracking-[0.18em] text-[#d3a15e]">Ready when your next application is</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Create one workspace for the whole search.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-[#e7d4b9]">
              Build the resume, save the role, prepare the interview, and keep the next action visible.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="/signup" className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#fffaf1] px-6 py-4 font-black text-[#211b16]">
                Sign up free <ArrowRight size={18} />
              </a>
              <a href="/contact" className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#fffaf1]/20 px-6 py-4 font-black text-[#fffaf1]">
                Contact support
              </a>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
