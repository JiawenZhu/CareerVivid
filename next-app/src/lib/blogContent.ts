export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "ai-job-search-workspace",
    title: "Why job seekers need one workspace for every application",
    description:
      "A practical look at how saved jobs, resumes, interview prep, and follow-up notes work better when they stay connected.",
    category: "Job search",
    author: "CareerVivid Team",
    date: "2026-06-14",
    readTime: "4 min read",
    sections: [
      {
        heading: "The problem is scattered context",
        body: "Most job seekers move between job boards, resume files, notes, email, spreadsheets, and interview prep tools. The work is not only applying. It is remembering what each role needed and what should happen next.",
      },
      {
        heading: "A workspace makes the next action visible",
        body: "CareerVivid keeps saved roles, resume match notes, prep tasks, and follow-up context together so the user can return to a specific application without rebuilding the context from scratch.",
      },
    ],
  },
  {
    slug: "ai-resume-builder-job-tracker",
    title: "Connect resume tailoring to the job tracker",
    description:
      "Resume tailoring gets more useful when each edit is tied to a real role, company, and interview plan.",
    category: "Resume",
    author: "CareerVivid Team",
    date: "2026-06-14",
    readTime: "5 min read",
    sections: [
      {
        heading: "Generic optimization is not enough",
        body: "A resume can look polished while still missing the proof a role asks for. The better workflow compares resume content against a saved job and shows what evidence is missing.",
      },
      {
        heading: "The tracker keeps tailoring honest",
        body: "When tailoring sits beside the application pipeline, every change has context: the role, status, deadline, company notes, and next interview-prep step.",
      },
    ],
  },
  {
    slug: "chrome-extension-job-autofill",
    title: "Using a Chrome extension to reduce job-search tab chaos",
    description:
      "How a browser workflow can help job seekers capture role details and keep application context moving.",
    category: "Chrome extension",
    author: "CareerVivid Team",
    date: "2026-06-14",
    readTime: "3 min read",
    sections: [
      {
        heading: "The application moment happens in the browser",
        body: "Role requirements, application forms, company pages, and job descriptions are already open when the user decides whether to apply. A useful assistant should help capture that context in place.",
      },
      {
        heading: "Context should return to the workspace",
        body: "The extension is most useful when saved job details, resume matching, and interview prep flow back into a durable workspace instead of becoming another isolated tool.",
      },
    ],
  },
];

export function findBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
