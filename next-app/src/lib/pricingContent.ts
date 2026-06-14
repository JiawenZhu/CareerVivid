export const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    cadence: "to start",
    credits: "100 AI credits / month",
    audience: "Try the workspace and keep manual job-search work organized.",
    features: [
      "Resume builder and job tracker basics",
      "Gemini Flash Lite and Flash agent turns",
      "Job search and scoring",
      "Bring your own API key for supported AI tools",
    ],
    href: "/signup",
  },
  {
    name: "Pro",
    price: "$12",
    cadence: "/ month",
    credits: "1,000 AI credits / month",
    audience: "For active job seekers tailoring applications every week.",
    features: [
      "Everything in Free",
      "Gemini Pro agent mode",
      "Resume tailoring and prep notes",
      "Living documentation sync",
    ],
    href: "/signup?redirect=/subscription",
    highlighted: true,
  },
  {
    name: "Max",
    price: "$35",
    cadence: "/ month",
    credits: "4,500 AI credits / month",
    audience: "For power users, career coaches, and heavy interview prep.",
    features: [
      "Everything in Pro",
      "More AI turns for repeated tailoring",
      "Priority model access",
      "Advanced portfolio and documentation workflows",
    ],
    href: "/signup?redirect=/subscription",
  },
  {
    name: "Enterprise",
    price: "$12",
    cadence: "/ seat",
    credits: "1,500 pooled credits / seat",
    audience: "For teams, agencies, schools, and career programs.",
    features: [
      "Private team workspaces",
      "Pooled AI credits across seats",
      "Team roles and audit logs",
      "Partner support for cohorts",
    ],
    href: "mailto:partners@careervivid.app?subject=CareerVivid%20Enterprise",
  },
];

export const pricingCapabilities = [
  {
    group: "Job and resume AI",
    items: [
      "AI resume tailor",
      "Job search and scoring",
      "Targeted job prep notes",
      "Resume match review",
    ],
  },
  {
    group: "Interview and portfolio",
    items: [
      "Technical voice interviews",
      "Interview feedback reports",
      "Portfolio review analysis",
      "Project proof organization",
    ],
  },
  {
    group: "Teams and partners",
    items: [
      "Private team workspaces",
      "Pooled credits",
      "Role-based access",
      "Cohort readiness workflows",
    ],
  },
];
