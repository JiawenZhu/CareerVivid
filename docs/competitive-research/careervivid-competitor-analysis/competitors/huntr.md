# Huntr — Competitor Profile

> **Threat Level: 🔴 HIGH**
> **Category fit:** Entrepreneurship & Job Creation
> **XPRIZE risk:** Techstars-backed, 250K+ users, Chrome extension dominance, $20/mo proven model

---

## Overview
Huntr is the gold standard for job application tracking, combining a Kanban board with a Chrome extension that captures jobs from any website with one click. Techstars-backed with 250K+ users, Huntr charges $20/month for Pro and has carved out the "job tracker" market so thoroughly that their Chrome extension's #1 highlighted feature (keyword highlighting on job pages) is widely imitated.

## Key Capabilities
| Feature | Detail |
|---|---|
| Job Application Tracker | Kanban (Wishlist → Applied → Interview → Offer) |
| Chrome Extension | One-click job capture from any site, 90K+ users |
| Contact Management | Track recruiters/contacts per application |
| Notes & Documents | Per-application notes, attachments |
| AI Resume Tailoring | GPT-powered keyword matching to JD |
| Keyword Highlighting | Highlights skills on job pages in Chrome |
| AI Cover Letter | Per-application GPT cover letters |
| Analytics | Funnel stats (applied → interview rate, etc.) |
| Board Sharing | Share tracking boards with coaches/mentors |

## Business Model & Revenue
| Tier | Price | Features |
|---|---|---|
| Free | $0 | 40 tracked jobs, 1 board |
| Pro | $20/mo or $180/yr | Unlimited, AI features, analytics |
| Coaches | $50/mo | Multiple client boards |

**Revenue estimate:** 250K total users; Chrome extension reports 90K active users.
- 2% conversion = 5,000 subscribers × $20 = $100K MRR minimum
- Coach tier adds $50/mo multiplier for career coaches reselling

**Funding:** Techstars alumni. Revenue-generating, not reliant on VC.

## Tech Stack
- **AI:** GPT-4o (OpenAI) for resume tailoring and cover letters — **XPRIZE weakness**
- **Frontend:** React
- **Backend:** Rails + PostgreSQL (inferred from job posts)
- **Chrome Extension:** 90K+ users, 4.8★ Chrome Web Store rating, feature-rich
- **Mobile:** No native app

## Strengths vs CareerVivid
- Chrome extension is industry benchmark — 90K active installs
- Keyword highlighting on job pages is #1 user-cited feature
- Board sharing for coaches creates a B2B revenue layer
- Clean, focused UX — does one thing (tracking) extremely well
- Techstars brand recognition in career coaching community

## Weaknesses vs CareerVivid
- **GPT-based, not Gemini** — XPRIZE Google Cloud gap
- No voice interview coaching
- No autonomous job application submission
- No CLI tool
- No MCP server
- No employer/B2B job posting side
- No whiteboard or portfolio features
- AI is an add-on to a tracker, not the core product architecture
- No Vertex AI integration

## XPRIZE Assessment
Huntr is a credible entrant with proven recurring revenue, strong user metrics, and an established product. Their XPRIZE weak spot: the core product predates the AI era (it's a tracker with AI bolted on), and they have no Google Cloud footprint. XPRIZE judges looking for "AI governs key business decisions" won't find it in a Kanban board.

**Revenue documentation:** Strong — Stripe subscription model, multiple tiers.
**AI-Native evidence:** Weak — AI is a surface feature on a tracker backbone.

## What to Steal
- Keyword highlighting on job pages is CareerVivid's Chrome extension's #1 feature — **keep it, make it better** (color-coded by required vs. preferred vs. nice-to-have)
- Board sharing with career coaches is an untapped revenue stream for CareerVivid — `cv share --coach coach@email.com`
- Funnel analytics ("You applied to 12 jobs, got 2 interviews = 16.7% response rate") — adds massive retention value to the tracker
