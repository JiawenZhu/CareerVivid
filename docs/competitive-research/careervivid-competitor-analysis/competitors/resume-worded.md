# Resume Worded — Competitor Profile

> **Threat Level: 🟡 MEDIUM**
> **Category fit:** Professional Services Access
> **XPRIZE risk:** 3M+ users, $19/mo, strong LinkedIn optimization and resume scoring niche

---

## Overview
Resume Worded is an AI-powered resume and LinkedIn profile review platform trusted by 3M+ professionals. Their core product gives instant feedback on resumes using a proprietary scoring system, and their LinkedIn optimization tools are particularly well-regarded. Founded in 2018 by a Wharton/Google alum, they have credibility in the professional networking space.

## Key Capabilities
| Feature | Detail |
|---|---|
| Resume Scorer | Instant score + line-by-line feedback |
| LinkedIn Review | AI analysis of every LinkedIn section |
| Resume Targeting | Match analysis for specific job titles |
| AI Resume Rewriter | Line-by-line improvement suggestions |
| Cover Letter Grader | Score + feedback on cover letters |
| Job-Specific Tips | Role-tailored advice per target job |
| 1-1 Expert Review | Human coaching sessions (add-on) |

## Business Model & Revenue
| Tier | Price | Features |
|---|---|---|
| Free | $0 | 5 resume scans, basic feedback |
| Pro Quarterly | $19/mo equiv | Unlimited scans, LinkedIn review |
| Pro Monthly | $32/mo | Same features |

**Revenue estimate:** 3M users, 1% paid = 30,000 × $22 avg = ~$660K MRR. Strong documentation case.

## Tech Stack
- **AI:** Proprietary NLP model + GPT integration (mixed) — **NOT Gemini**
- **Scoring:** Proprietary algorithms trained on resume data
- **Frontend:** React
- **LinkedIn:** Deep LinkedIn profile parsing via export analysis

## Weaknesses vs CareerVivid
- No Gemini or Google Cloud
- No job tracker / application management
- No voice interview coaching
- No autonomous apply
- No CLI tool
- No MCP server
- No B2B employer portal
- No Chrome extension for job site autofill
- Feedback-focused, not action-oriented — tells you what's wrong but doesn't fix + submit for you

## XPRIZE Assessment
Resume Worded has strong metrics (3M+ users, recurring revenue) but limited AI-Native depth. Their scoring model predates LLMs and their GPT integration is surface-level. A platform that scores documents is not the same as a platform where AI runs business operations. Medium threat, unlikely to dominate on AI-Native Operations criterion.

## What to Steal
- Line-by-line resume feedback is an excellent UX pattern — after Gemini generates a resume, CareerVivid should show a "Score breakdown" with per-section grades
- The LinkedIn review tool drives high engagement because LinkedIn profiles need regular updates — CareerVivid should remind users to re-optimize their LinkedIn after every job application cycle
