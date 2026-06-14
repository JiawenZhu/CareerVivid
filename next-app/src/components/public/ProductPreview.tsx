import { AppWindow, ArrowRight, Briefcase, LayoutDashboard, Mic } from "lucide-react";

export function ProductPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-[28px] bg-[#d7b27a]/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-xl border border-[#e4d3bc] bg-[#fffaf1] shadow-2xl shadow-[#8b5a16]/10">
        <div className="flex items-center justify-between border-b border-[#eadbc5] bg-[#f9efe0] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#e4d3bc] bg-[#fffaf1] px-3 py-1 text-xs font-black text-[#665a4a] sm:flex">
            <AppWindow size={14} />
            CareerVivid workspace
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(220px,250px)]">
          <div className="min-w-0 p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a97935]">Career Pipeline</p>
                <h3 className="text-xl font-black text-[#211b16]">36 active opportunities</h3>
              </div>
              <a className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563eb] px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/15" href="/job-tracker">
                <Briefcase size={16} />
                Track New Job
              </a>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-3">
              {[
                ["Total", "36", "bg-[#f7f1e7] text-[#665a4a]"],
                ["Active", "36", "bg-[#eef4ff] text-[#2563eb]"],
                ["Interviewing", "3", "bg-[#fff7e8] text-[#9a651f]"],
              ].map(([label, value, tone]) => (
                <div key={label} className="rounded-xl border border-[#eadbc5] bg-white/80 p-4 shadow-sm">
                  <div className={`mb-4 flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
                    <LayoutDashboard size={15} />
                  </div>
                  <p className="text-xs font-bold text-[#665a4a]">{label}</p>
                  <p className="text-2xl font-black text-[#211b16]">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 2xl:grid-cols-3">
              {[
                {
                  title: "To Apply",
                  count: 3,
                  color: "bg-[#7d6e5e]",
                  cards: [
                    ["Google", "Senior UX Engineer", "61% match"],
                    ["Global Tech", "Technical Consultant", "Prep 0/5"],
                  ],
                },
                {
                  title: "Applied",
                  count: 33,
                  color: "bg-[#2563eb]",
                  cards: [
                    ["OpenAI", "AI Systems Engineer", "86% match"],
                    ["Databricks", "Fullstack Engineer", "Prep 1/5"],
                  ],
                },
                {
                  title: "Interview",
                  count: 0,
                  color: "bg-[#a97935]",
                  cards: [["Drop jobs here", "When interviews start", ""]],
                },
              ].map((column) => (
                <div key={column.title} className="min-h-[218px] min-w-0 overflow-hidden rounded-xl border border-[#eadbc5] bg-[#f9efe0]/70 p-3">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-black leading-tight text-[#211b16]">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${column.color}`} />
                      <span className="break-words">{column.title}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#665a4a] shadow-sm">{column.count}</span>
                  </div>
                  <div className="space-y-3">
                    {column.cards.map(([company, role, meta]) => (
                      <div key={`${company}-${role}`} className="min-w-0 rounded-lg border border-[#eadbc5] bg-white/90 p-3 shadow-sm">
                        <p className="break-words text-[13px] font-black leading-tight text-[#211b16]">{role}</p>
                        <p className="mt-1 break-words text-xs font-semibold text-[#665a4a]">{company}</p>
                        {meta ? <p className="mt-3 text-xs font-bold text-[#2563eb]">{meta}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="border-t border-[#eadbc5] bg-[#f9efe0]/80 p-4 lg:border-l lg:border-t-0">
            <div className="rounded-xl border border-[#eadbc5] bg-white/90 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#a97935]">Resume Match</p>
              <h4 className="mt-1 text-lg font-black text-[#211b16]">75% ready</h4>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ece2d2]">
                <div className="h-full w-3/4 rounded-full bg-[#2563eb]" />
              </div>
              <p className="mt-4 text-sm font-medium leading-relaxed text-[#665a4a]">
                Strong match on TypeScript, design systems, and full-stack work. Add clearer UX engineering and prototyping proof.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["HTML", "CSS", "TypeScript", "AI tools"].map((keyword) => (
                  <span key={keyword} className="rounded-full bg-[#f7fff8] px-2.5 py-1 text-xs font-bold text-[#137245]">
                    {keyword}
                  </span>
                ))}
              </div>
              <a className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] text-sm font-black text-white" href="/newresume">
                Optimize Resume <ArrowRight size={15} />
              </a>
            </div>

            <div className="mt-4 rounded-xl border border-[#eadbc5] bg-white/90 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-[#fff6f6] p-2 text-[#b64a5a]">
                  <Mic size={18} />
                </div>
                <div>
                  <p className="font-black text-[#211b16]">Interview prep attached</p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-[#665a4a]">Role research, pitch, Q&A, and follow-up notes stay with each job.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
