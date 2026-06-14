"use client";

import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Mic,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const workflows = [
  {
    id: "resume",
    label: "Resume editor",
    icon: FileText,
    title: "Build and tailor resumes with the job context beside you.",
    copy:
      "CareerVivid turns resume work into structured sections, matched keywords, missing proof, and reviewable AI suggestions so users can improve faster without losing control of their story.",
    href: "/newresume",
    cta: "Open resume builder",
    stats: [
      ["75%", "resume match"],
      ["12", "keywords found"],
      ["4", "proof gaps"],
    ],
  },
  {
    id: "interview",
    label: "Mock interview",
    icon: Mic,
    title: "Practice the role before the conversation happens.",
    copy:
      "The interview coach keeps role research, pitch practice, behavioral questions, and feedback reports attached to the opportunity the user is preparing for.",
    href: "/interview-studio",
    cta: "Practice interview",
    stats: [
      ["8", "practice prompts"],
      ["91%", "answer clarity"],
      ["3", "follow-ups"],
    ],
  },
  {
    id: "pipeline",
    label: "Job pipeline",
    icon: LayoutDashboard,
    title: "Track applications, next actions, and prep in one board.",
    copy:
      "The job tracker gives every saved role a status, direct link, notes, resume match, prep checklist, and follow-up rhythm instead of spreading work across browser tabs.",
    href: "/job-tracker",
    cta: "See job tracker",
    stats: [
      ["36", "saved roles"],
      ["29", "direct links"],
      ["3", "interviews"],
    ],
  },
];

const productSteps = [
  {
    icon: Briefcase,
    title: "Save the role",
    copy: "Capture company, link, status, notes, and next action before details get lost.",
  },
  {
    icon: Wand2,
    title: "Prepare materials",
    copy: "Use the saved job context to tailor the resume and generate focused prep notes.",
  },
  {
    icon: MessageSquareText,
    title: "Practice and follow up",
    copy: "Attach mock interview feedback, reminders, and follow-up history to the same role.",
  },
];

function ResumeEditorMock() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <div className="rounded-xl border border-[#eadbc5] bg-white/90 p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a97935]">Resume editor</p>
            <h3 className="mt-1 text-xl font-black text-[#211b16]">Senior UX Engineer</h3>
          </div>
          <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-black text-[#2563eb]">ATS-ready</span>
        </div>
        {[
          ["Experience", "Led design-system migration across React, TypeScript, and product teams."],
          ["Projects", "Built AI-assisted onboarding flow with measurable activation lift."],
          ["Skills", "TypeScript · React · Firebase · AI tooling · Design systems"],
        ].map(([label, copy]) => (
          <div key={label} className="border-t border-[#efe2cf] py-4 first:border-t-0 first:pt-0">
            <p className="text-sm font-black text-[#211b16]">{label}</p>
            <p className="mt-2 text-sm font-medium leading-6 text-[#665a4a]">{copy}</p>
          </div>
        ))}
      </div>
      <aside className="rounded-xl border border-[#eadbc5] bg-[#fffaf1] p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a97935]">Resume match</p>
        <h4 className="mt-2 text-3xl font-black text-[#211b16]">75% ready</h4>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#e9ddca]">
          <div className="h-full w-3/4 rounded-full bg-[#2563eb]" />
        </div>
        <div className="mt-5 space-y-3">
          {["Add AI tooling proof", "Clarify UX engineering scope", "Mention prototyping outcomes"].map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm font-bold text-[#665a4a]">
              <CheckCircle2 className="mt-0.5 shrink-0 text-[#137245]" size={16} />
              {item}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function InterviewMock() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <div className="rounded-xl border border-[#eadbc5] bg-white/90 p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a97935]">Mock interview</p>
            <h3 className="mt-1 text-xl font-black text-[#211b16]">AI Systems Engineer prep</h3>
          </div>
          <span className="rounded-full bg-[#fff6f6] px-3 py-1 text-xs font-black text-[#b64a5a]">Live practice</span>
        </div>
        <div className="rounded-xl border border-[#eadbc5] bg-[#f9efe0]/70 p-4">
          <p className="text-sm font-black text-[#211b16]">Tell me about a time you improved a workflow with AI.</p>
          <p className="mt-3 text-sm font-medium leading-6 text-[#665a4a]">
            Suggested structure: problem, user impact, tool choice, guardrails, measurable outcome.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Structure", "92%"],
            ["Specificity", "78%"],
            ["Confidence", "86%"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#eadbc5] bg-[#fffaf1] p-4">
              <p className="text-xs font-bold text-[#665a4a]">{label}</p>
              <p className="mt-1 text-2xl font-black text-[#211b16]">{value}</p>
            </div>
          ))}
        </div>
      </div>
      <aside className="rounded-xl border border-[#eadbc5] bg-[#fffaf1] p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a97935]">Feedback report</p>
        <div className="mt-4 space-y-4">
          {["Tighten the opening answer", "Add one quantified project result", "Prepare a recruiter follow-up"].map((item) => (
            <div key={item} className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#2563eb]" />
              <p className="text-sm font-bold leading-6 text-[#665a4a]">{item}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function PipelineMock() {
  const columns = [
    {
      title: "To apply",
      count: 3,
      color: "bg-[#7d6e5e]",
      cards: [
        ["Senior UX Engineer", "Google", "61% match"],
        ["Frontend Web Engineer", "NVIDIA", "Direct link"],
      ],
    },
    {
      title: "Applied",
      count: 33,
      color: "bg-[#2563eb]",
      cards: [
        ["AI Systems Engineer", "OpenAI", "86% match"],
        ["Fullstack Engineer", "Databricks", "Prep 1/5"],
      ],
    },
    {
      title: "Interview",
      count: 3,
      color: "bg-[#a97935]",
      cards: [["Technical Consultant", "Global Tech", "Prep 0/5"]],
    },
  ];

  return (
    <div className="rounded-xl border border-[#eadbc5] bg-white/90 p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a97935]">Career pipeline</p>
          <h3 className="mt-1 text-xl font-black text-[#211b16]">36 saved opportunities</h3>
        </div>
        <a href="/job-tracker" className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-black text-white">
          <Briefcase size={16} />
          Track new job
        </a>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {columns.map((column) => (
          <div key={column.title} className="min-h-[260px] rounded-xl border border-[#eadbc5] bg-[#f9efe0]/70 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-black text-[#211b16]">
                <span className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
                {column.title}
              </p>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-[#665a4a]">{column.count}</span>
            </div>
            <div className="space-y-3">
              {column.cards.map(([role, company, meta]) => (
                <div key={`${role}-${company}`} className="rounded-lg border border-[#eadbc5] bg-white p-3 shadow-sm">
                  <p className="text-sm font-black leading-tight text-[#211b16]">{role}</p>
                  <p className="mt-1 text-xs font-bold text-[#665a4a]">{company}</p>
                  <p className="mt-3 text-xs font-black text-[#2563eb]">{meta}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActiveWorkflow({ id }: { id: string }) {
  if (id === "interview") return <InterviewMock />;
  if (id === "pipeline") return <PipelineMock />;
  return <ResumeEditorMock />;
}

export function ProductPageContent() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = workflows[activeIndex];
  const ActiveIcon = active.icon;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % workflows.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, []);

  const statCards = useMemo(() => active.stats, [active]);

  return (
    <main className="bg-[#f7f1e7] text-[#211b16]">
      <section className="relative overflow-hidden border-b border-[#e6dac8] pb-16 pt-12 sm:pb-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-55"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(139, 90, 22, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(139, 90, 22, 0.06) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a97935]">CareerVivid product</p>
              <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.96] tracking-tight text-[#211b16] sm:text-6xl">
                See the workspace behind every application.
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-[#665a4a]">
                CareerVivid brings the resume editor, mock interview coach, Chrome workflow, and job pipeline into one routine so each application keeps its context.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="/signup" className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl bg-[#211b16] px-6 py-4 text-base font-black text-white shadow-xl shadow-[#8b5a16]/10">
                  Start free <ArrowRight size={19} />
                </a>
                <a href="/pricing" className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-[#d8c6ad] bg-[#fffaf1] px-6 py-4 text-base font-black text-[#211b16] shadow-sm">
                  View pricing
                </a>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#e4d3bc] bg-[#fffaf1]/88 p-4 shadow-2xl shadow-[#8b5a16]/10">
              <div className="flex items-center justify-between border-b border-[#eadbc5] pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="rounded-full border border-[#e4d3bc] bg-white px-3 py-1 text-xs font-black text-[#665a4a]">
                  CareerVivid workspace
                </span>
              </div>
              <div className="grid gap-3 py-4 sm:grid-cols-3">
                {workflows.map((workflow, index) => {
                  const Icon = workflow.icon;
                  const selected = index === activeIndex;
                  return (
                    <button
                      key={workflow.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-black transition ${
                        selected
                          ? "border-[#625bd5] bg-[#f3f2ff] text-[#211b16]"
                          : "border-[#eadbc5] bg-white/80 text-[#665a4a] hover:border-[#d8c6ad]"
                      }`}
                    >
                      <Icon size={17} className={selected ? "text-[#625bd5]" : "text-[#a97935]"} />
                      {workflow.label}
                    </button>
                  );
                })}
              </div>
              <ActiveWorkflow id={active.id} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e6dac8] bg-[#fffaf1] py-14">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          {statCards.map(([value, label]) => (
            <div key={label} className="rounded-xl border border-[#e4d3bc] bg-white/80 p-6 shadow-sm">
              <p className="text-4xl font-black text-[#211b16]">{value}</p>
              <p className="mt-2 text-sm font-bold text-[#665a4a]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3f2ff] text-[#625bd5]">
                <ActiveIcon size={24} />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a97935]">Current workflow</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-[#211b16] sm:text-5xl">{active.title}</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-[#665a4a]">{active.copy}</p>
              <a href={active.href} className="mt-8 inline-flex items-center justify-center gap-3 rounded-xl bg-[#211b16] px-6 py-4 font-black text-white">
                {active.cta} <ArrowRight size={18} />
              </a>
            </div>

            <div className="grid gap-4">
              {productSteps.map(({ icon: Icon, title, copy }) => (
                <article key={title} className="grid gap-4 rounded-xl border border-[#e4d3bc] bg-[#fffaf1]/86 p-5 shadow-sm sm:grid-cols-[48px_1fr]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f2dfc2] text-[#8b5a16]">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#211b16]">{title}</h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-[#665a4a]">{copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#211b16] py-16 text-[#fffaf1] sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d3a15e]">Application routine</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              Find direct job links, tailor your resume with context, and prepare with confidence.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href="/signup" className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#fffaf1] px-6 py-4 font-black text-[#211b16]">
              Sign up free <ArrowRight size={18} />
            </a>
            <a href="/job-tracker" className="inline-flex items-center justify-center gap-3 rounded-xl border border-[#fffaf1]/25 px-6 py-4 font-black text-[#fffaf1]">
              See tracker <Clock3 size={18} />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
