export const CREDIT_LIMITS = {
  free: 100,
  pro: 1000,
  max: 4500,
  enterprise: 1500,
};

export const SUBSCRIPTION_PRICES = {
  pro: { monthly: 12, annualMonthly: 10, annual: 120 },
  max: { monthly: 35, annualMonthly: 31, annual: 372 },
  enterprise: { monthly: 12, minimumSeats: 2 },
};

export const plans = {
  free: { name: "Free", price: 0, credits: CREDIT_LIMITS.free, cta: "Get Started Free", href: "/signup" },
  pro: { name: "Pro", price: SUBSCRIPTION_PRICES.pro.monthly, credits: CREDIT_LIMITS.pro, cta: "Start Pro", href: "/signup?redirect=/subscription" },
  max: { name: "Max", price: SUBSCRIPTION_PRICES.max.monthly, credits: CREDIT_LIMITS.max, cta: "Get Max", href: "/signup?redirect=/subscription" },
  enterprise: { name: "Enterprise", price: SUBSCRIPTION_PRICES.enterprise.monthly, credits: CREDIT_LIMITS.enterprise, cta: "Contact Sales", href: "mailto:partners@careervivid.app?subject=CareerVivid%20Enterprise" },
};

export const featureRows: Array<{
  category?: string;
  name?: string;
  free?: boolean | string;
  pro?: boolean | string;
  max?: boolean | string;
  enterprise?: boolean | string;
}> = [
  { category: "🤖 CLI AI Agent" },
  { name: "cv agent (Gemini Flash Lite, 0.5 cr/turn)", free: true, pro: true, max: true, enterprise: true },
  { name: "cv agent (Gemini 2.5 Flash, 1 cr/turn)", free: true, pro: true, max: true, enterprise: true },
  { name: "cv agent --pro (Gemini Pro, 2 cr/turn)", free: false, pro: true, max: true, enterprise: true },
  { name: "cv agent --jobs (job search & tracker)", free: true, pro: true, max: true, enterprise: true },
  { name: "cv agent --resume (resume tools)", free: true, pro: true, max: true, enterprise: true },
  { name: "BYO API Key (OpenAI / Claude / OpenRouter...)", free: true, pro: true, max: true, enterprise: true },
  { category: "📄 Job & Resume AI" },
  { name: "AI Resume Tailor", free: "5 credits", pro: "5 credits", max: "5 credits", enterprise: "5 credits" },
  { name: "Job Search & Scoring", free: "1 credit", pro: "1 credit", max: "1 credit", enterprise: "1 credit" },
  { name: "Targeted Job Prep Notes", free: "10 credits", pro: "10 credits", max: "10 credits", enterprise: "10 credits" },
  { category: "🛠 Developer Tools" },
  { name: "CLI Publish (Markdown/Mermaid)", free: "Free", pro: "Free", max: "Free", enterprise: "Free" },
  { name: "ReactFlow UI Conversion", free: "5 credits", pro: "5 credits", max: "5 credits", enterprise: "5 credits" },
  { name: "Architecture Auto-Gen", free: "10 credits", pro: "10 credits", max: "10 credits", enterprise: "10 credits" },
  { name: "Living Documentation Sync", free: false, pro: true, max: true, enterprise: true },
  { category: "🎤 Interviews & Portfolio" },
  { name: "Technical Voice Interviews", free: "15 credits", pro: "15 credits", max: "15 credits", enterprise: "15 credits" },
  { name: "Portfolio Review Analysis", free: "5 credits", pro: "5 credits", max: "5 credits", enterprise: "5 credits" },
  { category: "🏢 Team" },
  { name: "Private Team Workspaces", free: false, pro: false, max: false, enterprise: true },
  { name: "Advanced RBAC & SSO", free: false, pro: false, max: false, enterprise: true },
];
