import { ArrowRight, Award, Building2, CheckCircle2, Globe, GraduationCap, Rocket, Shield, Users } from "lucide-react";
import { SectionLabel } from "./PublicShell";

const tracks = [
  {
    title: "Academic",
    href: "/partners/academic",
    icon: GraduationCap,
    color: "blue",
    body: "For universities, colleges, and bootcamps that want students to build stronger resumes, track applications, and practice interviews.",
  },
  {
    title: "Agency",
    href: "/partners/agency",
    icon: Shield,
    color: "green",
    body: "For staffing and career agencies that want applicants to improve resumes and share readiness reports with consent.",
  },
  {
    title: "Business",
    href: "/partners/business",
    icon: Building2,
    color: "purple",
    body: "For companies and HR teams that want candidates to apply with clearer role context and better preparation.",
  },
  {
    title: "Student ambassadors",
    href: "/partners/students",
    icon: Users,
    color: "rose",
    body: "For student leaders who want to help peers build job-search routines while developing visible leadership proof.",
  },
];

const colorClasses: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  purple: "bg-[#f3f2ff] text-[#5148c8] border-[#d9d7ff]",
  rose: "bg-rose-50 text-rose-700 border-rose-100",
};

const proofPoints = [
  { icon: Globe, text: "Designed for remote, campus, agency, and hiring-event workflows." },
  { icon: Award, text: "AI assistance supports preparation without replacing human career judgment." },
  { icon: Users, text: "Partner programs start small, then expand with evidence from real cohorts." },
];

export function PartnerLandingContent() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-[#e4d3bc] bg-[#fffaf1]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e4d3bc] bg-white px-4 py-2 text-sm font-bold text-[#665a4a] shadow-sm">
              <Rocket size={16} className="text-[#a97935]" />
              Fueling practical career readiness
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-normal md:text-6xl">
              Partner with CareerVivid to help candidates prepare with context.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#665a4a]">
              Join us in helping students, applicants, and job seekers build stronger resumes, save direct job context, practice interviews, and move through the search with a repeatable routine.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/partners/apply" className="inline-flex items-center gap-2 rounded-2xl bg-[#211b16] px-6 py-3 text-sm font-bold text-[#fffaf1] shadow-sm">
                Become a partner <ArrowRight size={17} />
              </a>
              <a href="#partner-paths" className="inline-flex items-center gap-2 rounded-2xl border border-[#e4d3bc] bg-white px-6 py-3 text-sm font-bold text-[#211b16]">
                Choose your path
              </a>
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-[#e4d3bc] bg-white p-6 shadow-xl shadow-[#6b4b1f]/10">
            <SectionLabel>How partners use it</SectionLabel>
            <div className="mt-5 space-y-3">
              {[
                "Invite candidates into a co-branded job-search workspace.",
                "Help them tailor resumes and prepare interview answers from saved role context.",
                "Review readiness signals only when users choose to share progress.",
              ].map((item, index) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-[#f0e5d5] bg-[#fffaf1] p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#211b16] text-sm font-black text-[#fffaf1]">{index + 1}</span>
                  <p className="text-sm font-semibold leading-6 text-[#665a4a]">{item}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section id="partner-paths" className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 text-center">
          <SectionLabel>Choose your path</SectionLabel>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Programs for the teams already helping job seekers.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#665a4a]">
            Each path starts with a focused pilot so the partner can measure real user value before expanding.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {tracks.map(({ title, href, icon: Icon, color, body }) => (
            <a key={title} href={href} className="group rounded-[1.25rem] border border-[#e4d3bc] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#caa26c] hover:shadow-xl">
              <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border ${colorClasses[color]}`}>
                <Icon size={27} />
              </div>
              <h3 className="text-2xl font-black text-[#211b16]">{title}</h3>
              <p className="mt-4 min-h-28 text-sm font-medium leading-7 text-[#665a4a]">{body}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#625bd5]">
                Learn more <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e4d3bc] bg-[#fffaf1]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <SectionLabel>Global impact, local reach</SectionLabel>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight md:text-5xl">
              Keep AI useful where human support still matters.
            </h2>
            <p className="mt-5 text-base font-medium leading-8 text-[#665a4a]">
              CareerVivid is strongest when it augments counselors, recruiters, educators, and community leaders. Partners can use AI for repetitive preparation while keeping coaching, crisis support, and final judgment human.
            </p>
            <div className="mt-7 space-y-3">
              {proofPoints.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <Icon size={18} />
                  </span>
                  <p className="text-sm font-bold leading-7 text-[#665a4a]">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Resume readiness", "Track completion and improvement without asking staff to rewrite every resume."],
              ["Application context", "Save role details, links, due dates, notes, and next steps in one place."],
              ["Interview practice", "Give candidates structured mock interview prep before the high-stakes meeting."],
              ["Consent controls", "Let users decide when to share readiness reports with a partner or team."],
            ].map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-[#e4d3bc] bg-white p-5 shadow-sm">
                <CheckCircle2 className="mb-4 text-emerald-600" size={22} />
                <h3 className="text-lg font-black">{title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-[#665a4a]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-3xl font-black md:text-4xl">Ready to run a focused partner pilot?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#665a4a]">
          Start with a clear audience, a small cohort, and measurable readiness outcomes.
        </p>
        <a href="/partners/apply" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#211b16] px-7 py-3 text-sm font-bold text-[#fffaf1]">
          Apply to partner program <ArrowRight size={17} />
        </a>
      </section>
    </main>
  );
}
