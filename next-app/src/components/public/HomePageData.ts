import {
  AppWindow,
  Briefcase,
  Building2,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Lock,
  Mic,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";

export const featureTabs = [
  { label: "Job Tracker", icon: Briefcase, href: "/job-tracker" },
  { label: "AI Resume Builder", icon: FileText, href: "/newresume" },
  { label: "Resume Tailor", icon: Wand2, href: "/newresume" },
  { label: "Autofill Applications", icon: AppWindow, href: "/extension-welcome" },
  { label: "Resume Match", icon: Search, href: "/newresume" },
  { label: "Interview Coach", icon: Mic, href: "/interview-studio" },
  { label: "Career Pipeline", icon: LayoutDashboard, href: "/job-tracker" },
];

export const trustSignals = [
  "Free workspace to start",
  "Resume, tracker, and interview tools together",
  "Privacy-first job search data",
];

export const workflowCards = [
  {
    icon: Search,
    title: "Capture the role",
    copy: "Save the posting, company, location, and next action before it disappears into browser tabs.",
    tone: "bg-[#eef4ff] text-[#2563eb]",
  },
  {
    icon: Sparkles,
    title: "Tailor the application",
    copy: "Compare a resume against the job, find missing keywords, and generate focused prep notes.",
    tone: "bg-[#fff7e8] text-[#9a651f]",
  },
  {
    icon: ClipboardCheck,
    title: "Track the follow-through",
    copy: "Move roles through your pipeline and keep interview preparation attached to each opportunity.",
    tone: "bg-[#f7fff8] text-[#137245]",
  },
];

export const experienceEntries = [
  {
    number: "1.",
    label: "Pipeline workspace",
    title: "Job Tracker & Application Context",
    organization: "CareerVivid product workspace",
    date: "Available now",
    href: "/job-tracker",
    bullets: [
      "Captures each role with company, location, links, status, priority, due dates, and the next action that keeps the search moving.",
      "Keeps resume match, interview prep, notes, and follow-up history attached to the same opportunity instead of spreading context across tabs.",
      "Gives active job seekers a calm board for repeated work: save the role, prepare the application, follow up, and review what changed.",
    ],
  },
  {
    number: "2.",
    label: "Resume system",
    title: "AI Resume Builder & Tailoring Flow",
    organization: "ATS-ready resume workspace",
    date: "Available now",
    href: "/newresume",
    bullets: [
      "Turns a resume into structured sections that are easier to edit, score, export, and reuse across different job targets.",
      "Compares a resume against a job description so users can see matched keywords, missing proof, and the most important improvements.",
      "Keeps the tone practical and reviewable, helping users improve materials without losing control of their own story.",
    ],
  },
  {
    number: "3.",
    label: "Browser workflow",
    title: "Chrome Extension for Job Pages",
    organization: "CareerVivid browser assistant",
    date: "Pending Chrome review",
    href: "/extension-welcome",
    bullets: [
      "Brings CareerVivid to the job posting page so users can save a role, analyze fit, and move work back into the tracker.",
      "Supports the application moment directly, where job details, requirements, and forms are already visible.",
      "Keeps the browser workflow connected to the main account instead of becoming another isolated job-search tool.",
    ],
  },
  {
    number: "4.",
    label: "Interview practice",
    title: "AI Interview Coach & Feedback Reports",
    organization: "Practice and feedback workspace",
    date: "Available now",
    href: "/interview-studio",
    bullets: [
      "Runs role-specific mock interviews and keeps preparation tied to the job the user is pursuing.",
      "Exports feedback reports that help users see communication, confidence, and answer relevance in a concrete way.",
      "Helps candidates build a repeatable preparation loop before high-pressure recruiter, technical, or behavioral interviews.",
    ],
  },
];

export const expertiseBlocks = [
  {
    title: "Workflow Design",
    items: ["Job pipeline", "Application context", "Follow-up tracking", "Role notes"],
  },
  {
    title: "AI Assistance",
    items: ["Gemini-powered prep", "Resume match", "Keyword review", "Interview feedback"],
  },
  {
    title: "Browser Tools",
    items: ["Chrome extension", "Job clipping", "Form assistance", "Context menus"],
  },
  {
    title: "Trust Practices",
    items: ["Clear product claims", "Privacy policy", "User-owned data", "No fake review blocks"],
  },
];

export const trustNotes = [
  {
    icon: ShieldCheck,
    title: "Plain claims",
    copy: "CareerVivid explains what exists today and avoids inflated social proof. That matters more than decorative trust badges.",
  },
  {
    icon: Lock,
    title: "Private workspace",
    copy: "Saved jobs, resumes, prep notes, and application context stay inside the user account and product workflow.",
  },
  {
    icon: Users,
    title: "Built for repeated use",
    copy: "The app is designed for the daily rhythm of searching, applying, following up, and improving materials.",
  },
];

export const teamEducationCards = [
  {
    icon: Building2,
    title: "Career center dashboard",
    copy: "Invite students, allocate credits, and monitor progress when CareerVivid is used by a cohort.",
  },
  {
    icon: ClipboardCheck,
    title: "Application context",
    copy: "Store role, company, location, links, dates, notes, and preparation in one place.",
  },
  {
    icon: Sparkles,
    title: "Gemini-powered assistance",
    copy: "Generate focused prep and resume suggestions from the user saved context.",
  },
];

export const faqs = [
  {
    question: "Is CareerVivid just a resume builder?",
    answer:
      "No. The resume builder is one piece of the workspace. CareerVivid also includes a job tracker, resume matching, interview prep, application notes, and Chrome extension workflows.",
  },
  {
    question: "Do I need my own AI API key?",
    answer:
      "No for the hosted app. CareerVivid uses managed Gemini-powered features through the app. Developers who self-host can configure their own Firebase and Gemini setup.",
  },
  {
    question: "Can I use it while applying on other job sites?",
    answer:
      "Yes. The Chrome extension workflow is designed to help save roles and work with application pages from the browser while keeping the final workspace organized in CareerVivid.",
  },
];
