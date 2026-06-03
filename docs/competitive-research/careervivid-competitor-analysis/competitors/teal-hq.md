# Teal HQ — Competitor Profile

> **Threat Level: 🔴 HIGH**
> **Category fit:** Entrepreneurship & Job Creation / Professional Services Access
> **XPRIZE risk:** Well-funded, 300K+ users, strong resume/tracker combo, VC-backed

---

## Overview
Teal is a career management platform focused on resume building and job tracking. Backed by $1.89M in funding, Teal targets job seekers with an all-in-one tool combining an AI resume builder, ATS keyword matching, a job tracker, and salary insights. Their freemium model converts users to a paid Pro tier at $29/month.

## Key Capabilities
| Feature | Detail |
|---|---|
| AI Resume Builder | GPT-powered resume tailoring per job description |
| ATS Score Checker | Keyword analysis scoring resumes 0–100% |
| Job Application Tracker | Kanban board with status columns and notes |
| Chrome Extension | Autosave jobs from any job board |
| Salary Insights | Pay range data sourced from LinkedIn/Glassdoor |
| Career Path Planner | Suggested next roles based on profile |
| AI Cover Letter | Role-specific GPT-generated cover letters |
| LinkedIn Import | One-click resume import from LinkedIn |

## Business Model & Revenue
| Tier | Price | Features |
|---|---|---|
| Free | $0 | 1 resume, 50 tracked jobs, basic ATS |
| Pro | $29/mo or $199/yr | Unlimited resumes, AI tailoring, priority support |

**Revenue estimate:** 300K users, estimated 3–5% paid conversion = 9,000–15,000 subscribers × $29 = ~$260K–$435K MRR. VC-backed with $1.89M raised = runway to subsidize growth.

**Funding:** $1.89M raised (Seed). Investors include industry angels. Still bootstrapping toward profitability.

## Tech Stack
- **AI:** GPT-4o (OpenAI) — **critical XPRIZE weakness**
- **Frontend:** React + TypeScript
- **Backend:** Node.js + PostgreSQL
- **Chrome Extension:** Available on Chrome Web Store, 4.9★ rating
- **Mobile:** No native app

## Strengths vs CareerVivid
- Slightly cleaner UX — minimalist design focused on job seekers
- Strong brand in "resume builder + tracker" category
- Chrome extension has 4.9★ rating (outstanding social proof)
- LinkedIn import is seamless
- Salary data integration builds trust

## Weaknesses vs CareerVivid
- **GPT-based, not Gemini** — no Google Cloud alignment for XPRIZE
- No voice interview coaching
- No autonomous application submission
- No CLI tool
- No MCP server
- No B2B job posting marketplace (no employer side)
- No whiteboard / diagram generation
- Minimal Vertex AI or Firebase usage
- Resume-centric — less of a full career operating system

## XPRIZE Assessment
Teal will likely enter. Their VC backing gives them budget to market aggressively. Their weakness for XPRIZE is their OpenAI dependency and relatively narrow feature scope. They're a job tracker + resume tool, not a full AI career platform. However, their subscription revenue and user count are strong documentation assets.

**Revenue documentation strength:** Strong (Stripe + subscription model = clean MRR proof).
**AI-Native evidence:** Weak — GPT is a feature, not an operational backbone.

## What to Steal
- "Resume Score" visual percentage is extremely effective for user motivation — CareerVivid should display a prominent ATS match score after resume generation
- The salary insights panel adds perceived value with minimal engineering effort
- Onboarding flow: "Import LinkedIn → See your score in 30 seconds" is a proven conversion hook
