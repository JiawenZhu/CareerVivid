# Kickresume — Competitor Profile

> **Threat Level: 🟡 MEDIUM**
> **Category fit:** Professional Services Access
> **XPRIZE risk:** 3M–8M users, €8–€19/mo, global reach, GPT-5 integration

---

## Overview
Kickresume is a Slovak-founded resume and portfolio platform with 3–8M registered users globally. Their product spans resume builder, cover letter builder, website/portfolio builder, and a job search aggregator. They've recently integrated GPT-5 (OpenAI) for their AI writing features and have strong European market presence, though they also serve the US.

## Key Capabilities
| Feature | Detail |
|---|---|
| Resume Builder | 35+ professional templates, ATS-optimized |
| Cover Letter Builder | Template + AI generation |
| Personal Website / Portfolio | One-page portfolio sites |
| Job Search | Aggregated job listings (50K+ listings) |
| AI Resume Writer | GPT-5 content generation |
| Resume Checker | ATS keyword analysis |
| LinkedIn Integration | Import from LinkedIn profile |
| Real Examples | Database of 200K+ real-world resumes |

## Business Model & Revenue
| Tier | Price | Features |
|---|---|---|
| Free | €0 | 1 resume/letter, watermarked |
| Premium | €8/mo (annual) or €19/mo | Unlimited, all AI features, no watermark |

**Revenue estimate:** Conservative 0.5% paid of 5M users = 25,000 × €13 avg = ~€325K MRR (~$355K USD). Sizable bootstrapped revenue.

## Tech Stack
- **AI:** GPT-5 (OpenAI) — **NOT Gemini**, XPRIZE weakness
- **Frontend:** Likely Vue.js or React (Eastern European stack pattern)
- **Backend:** PHP/Laravel (legacy) + Node.js microservices
- **Job Aggregator:** Proprietary scraping + job board partnerships

## Weaknesses vs CareerVivid
- GPT-5/OpenAI, not Gemini — no Google Cloud alignment
- No job application tracker (Kanban)
- No voice interview coaching
- No autonomous apply
- No CLI tool
- No MCP server
- No B2B employer portal
- European-first (regulatory complexity for US market)
- No Firebase or Vertex AI
- Portfolio feature is basic HTML/CSS — not AI-generated like CareerVivid's

## XPRIZE Assessment
Kickresume has the user base to impress judges on Category Impact but will be outscored on AI-Native Operations. Their GPT integration is a feature layer over a template product — not an AI-native architecture. European regulatory environment may also complicate US-facing XPRIZE submission.

## What to Steal
- The 200K+ real resume examples database is a powerful retention and SEO tool — CareerVivid could build a "see resumes that got hired at [Company]" feature using AI anonymization
- Portfolio site builder is an existing CareerVivid feature — emphasize it more prominently as part of the platform story
