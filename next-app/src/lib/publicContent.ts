export type PartnerPageKey = "academic" | "agency" | "business" | "hiring" | "students";

export type PartnerPageContent = {
  slug: PartnerPageKey;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  accent: "blue" | "green" | "purple" | "rose" | "amber";
  outcomes: string[];
  cards: Array<{
    title: string;
    body: string;
  }>;
  steps?: string[];
};

export const partnerLanding = {
  title: "CareerVivid Partner Programs",
  description:
    "CareerVivid partners with schools, agencies, student leaders, and hiring teams to help job seekers prepare stronger applications and keep career progress visible.",
  cards: [
    {
      href: "/partners/academic",
      label: "Academic",
      title: "Help students build application readiness.",
      body: "Give career centers a structured workspace for resumes, job tracking, interview practice, and readiness reporting.",
    },
    {
      href: "/partners/agency",
      label: "Agency",
      title: "Prepare applicants before recruiter review.",
      body: "Use a co-branded prep link so candidates improve resumes and share readiness reports only when they consent.",
    },
    {
      href: "/partners/business",
      label: "Business",
      title: "Connect hiring needs to better-prepared candidates.",
      body: "Support hiring teams with cleaner candidate context, role-fit notes, and repeatable application packets.",
    },
    {
      href: "/partners/hiring",
      label: "Hiring teams",
      title: "Run focused talent workflows.",
      body: "Create targeted hiring campaigns where candidates apply with richer context than a resume alone.",
    },
    {
      href: "/partners/students",
      label: "Students",
      title: "Lead CareerVivid in your community.",
      body: "Represent CareerVivid on campus, help peers build job-search routines, and develop visible leadership proof.",
    },
  ],
};

export const partnerPages: Record<PartnerPageKey, PartnerPageContent> = {
  academic: {
    slug: "academic",
    eyebrow: "Academic partners",
    title: "Help students move from resume drafts to interview-ready applications.",
    description:
      "CareerVivid gives career centers a practical AI workspace for resume improvement, job tracking, interview preparation, and cohort-level readiness signals.",
    cta: "Become an academic partner",
    accent: "blue",
    outcomes: [
      "Give students one place to organize resumes, target roles, saved jobs, and interview prep.",
      "Track engagement and readiness without replacing counselor judgment.",
      "Use AI assistance for repetitive resume and interview feedback so staff can focus on strategy.",
    ],
    cards: [
      {
        title: "Cohort onboarding",
        body: "Invite students with a dedicated program link and help them start from the same structured workflow.",
      },
      {
        title: "Readiness reporting",
        body: "See resume completion, application activity, and interview-prep progress at a practical level.",
      },
      {
        title: "Counselor support",
        body: "AI handles first-pass review while humans keep ownership of coaching, intervention, and judgment.",
      },
    ],
  },
  agency: {
    slug: "agency",
    eyebrow: "Agency partner pilot",
    title: "Prepare applicants before recruiters spend time fixing resumes.",
    description:
      "CareerVivid gives staffing branches a co-branded prep portal for walk-ins and online applicants. Candidates improve their resume, download a cleaner PDF, and share a readiness report only when they consent.",
    cta: "Start a 14-day pilot",
    accent: "green",
    outcomes: [
      "Reduce repetitive resume cleanup before recruiter review.",
      "Standardize readiness signals across walk-in and online applicants.",
      "Protect candidate consent with shareable reports instead of silent data access.",
    ],
    cards: [
      {
        title: "Branch prep link",
        body: "A simple link lets a branch invite applicants without an ATS integration during the pilot.",
      },
      {
        title: "Candidate-owned sharing",
        body: "Candidates can improve materials privately and decide when to share a report with the agency.",
      },
      {
        title: "Pilot evidence",
        body: "Start with 10-20 candidates and measure score lift, completion, and recruiter time saved.",
      },
    ],
    steps: [
      "Recruiter gives the applicant a branch prep link.",
      "Applicant improves the resume and saves job context.",
      "Applicant consents to share a readiness report with the branch.",
    ],
  },
  business: {
    slug: "business",
    eyebrow: "Business partners",
    title: "Help candidates apply with clearer context for your open roles.",
    description:
      "CareerVivid can support employer partnerships where candidates tailor resumes, prepare for interviews, and keep role-specific context attached to each application.",
    cta: "Become a business partner",
    accent: "purple",
    outcomes: [
      "Give applicants a guided preparation path before they submit.",
      "Reduce weak-fit applications by making role requirements easier to act on.",
      "Support hiring events with reusable application packets and interview prep.",
    ],
    cards: [
      {
        title: "Role-fit preparation",
        body: "Candidates can compare their resume to role requirements and close obvious gaps before applying.",
      },
      {
        title: "Hiring campaign support",
        body: "Use co-branded preparation flows for internship, early-career, or upskilling hiring campaigns.",
      },
      {
        title: "Clearer candidate context",
        body: "Applications can include role notes, resume-match signals, and interview-prep history.",
      },
    ],
  },
  hiring: {
    slug: "hiring",
    eyebrow: "Hiring partners",
    title: "Run focused candidate preparation before the interview pipeline gets crowded.",
    description:
      "CareerVivid helps hiring teams guide candidates through resume tailoring, role research, and mock interview preparation before human review.",
    cta: "Become a hiring partner",
    accent: "amber",
    outcomes: [
      "Point applicants to a practical prep workflow for a specific role or campaign.",
      "Help candidates understand how their experience maps to the job before interviews begin.",
      "Keep preparation evidence reviewable without claiming fully automated hiring decisions.",
    ],
    cards: [
      {
        title: "Targeted prep flows",
        body: "Create a path for candidates to save the role, tailor a resume, and prepare role-specific answers.",
      },
      {
        title: "Event-ready workflow",
        body: "Support job fairs, cohort hiring, and direct-apply campaigns with a repeatable system.",
      },
      {
        title: "Human-centered review",
        body: "Use AI for preparation and organization, while final hiring judgment stays with people.",
      },
    ],
  },
  students: {
    slug: "students",
    eyebrow: "Student ambassadors",
    title: "Lead CareerVivid in your student community.",
    description:
      "Student ambassadors help peers build better job-search routines while developing leadership, product feedback, and community-building proof.",
    cta: "Apply as a student ambassador",
    accent: "rose",
    outcomes: [
      "Help peers organize resumes, saved jobs, interviews, and follow-ups.",
      "Build visible leadership experience around a real career product.",
      "Share feedback that improves CareerVivid for students and early-career job seekers.",
    ],
    cards: [
      {
        title: "Community leadership",
        body: "Host walkthroughs, collect feedback, and help peers turn scattered job-search work into a routine.",
      },
      {
        title: "Career proof",
        body: "Show practical product, community, and communication experience on your own resume.",
      },
      {
        title: "Early access",
        body: "Test new resume, tracker, and interview-prep workflows before broader release.",
      },
    ],
  },
};

export const legalPages = {
  privacy: {
    title: "Privacy Policy",
    description: "Your privacy is our priority. Effective Date: January 19, 2026.",
    sections: [
      {
        title: "Information we collect",
        body: [
          "Account information such as your name, email address, and password when you register.",
          "Usage data such as browser type, pages visited, and security logs used to improve platform performance.",
          "Third-party integration data only when you explicitly authorize access, such as public profile information or connected job-search workflow context.",
          "Cookies and local preferences needed to maintain sessions and remember settings.",
        ],
      },
      {
        title: "How we use and share information",
        body: [
          "We use data to provide the service, process payments through trusted processors, send service notifications, and keep the workspace reliable.",
          "We do not sell personal data. Data is shared only with processors needed to operate CareerVivid, such as Firebase hosting, authentication, analytics, and Stripe billing.",
        ],
      },
      {
        title: "Your rights",
        body: [
          "Depending on your location, you may request access, correction, or deletion of personal data.",
          "To exercise these rights, contact privacy@careervivid.app.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    description: "Effective Date: January 19, 2026.",
    sections: [
      {
        title: "Account terms",
        body: [
          "You agree to provide accurate account information and maintain the security of your credentials.",
          "You must be at least 16 years old to use CareerVivid.",
        ],
      },
      {
        title: "Acceptable use",
        body: [
          "You may not use CareerVivid to post illegal content, malware, phishing links, hate speech, or content that infringes intellectual property rights.",
          "If you use commerce or public profile features, you remain responsible for your own content, fulfillment, support, refunds, and tax obligations.",
        ],
      },
      {
        title: "Payments and subscriptions",
        body: [
          "Subscriptions renew automatically unless canceled before the renewal date.",
          "You may cancel from your dashboard and retain access until the end of the current billing cycle.",
        ],
      },
      {
        title: "Intellectual property and liability",
        body: [
          "You retain ownership of resumes, portfolios, and content you upload. CareerVivid receives a limited license to host that content to provide the service.",
          "CareerVivid is provided as-is. To the maximum extent permitted by law, we are not liable for indirect or consequential damages from use of the service.",
          "Formal legal notices should be sent to legal@careervivid.app.",
        ],
      },
    ],
  },
};

export const topicPages = {
  "ai-native-developer-portfolios": {
    title: "AI-Native Developer Portfolios",
    description:
      "Showcase skills with a CareerVivid portfolio that connects project proof, resume context, and AI-assisted storytelling.",
    h1: "Build AI-native developer portfolios",
    subtitle:
      "Move beyond a static PDF by turning projects, proof, and career context into a reviewable portfolio workflow.",
    sections: [
      {
        heading: "Why AI-native portfolios matter",
        body: "Recruiters and hiring managers need evidence, not only claims. CareerVivid helps developers organize project proof, summarize contributions, and present a clearer picture of the work behind the resume.",
      },
      {
        heading: "Connected to the job-search workspace",
        body: "Portfolio work sits beside resumes, saved roles, interview prep, and follow-up notes so each application can carry the right context.",
      },
    ],
  },
  "vibe-coding-platform": {
    title: "Vibe Coding Platform",
    description:
      "Use CareerVivid to document AI-assisted development work, portfolio proof, and job-search material in one place.",
    h1: "Document modern AI-assisted development work",
    subtitle:
      "CareerVivid helps job seekers turn AI-tooling experience into concrete resume and portfolio proof.",
    sections: [
      {
        heading: "Make AI work visible",
        body: "Candidates using tools like ChatGPT, Gemini, Claude Code, and Cursor need a way to explain what they built, how they evaluated output, and where human judgment mattered.",
      },
      {
        heading: "Connect skill growth to applications",
        body: "Save proof projects, update resume language, and prepare interview answers from the same career workspace.",
      },
    ],
  },
};
