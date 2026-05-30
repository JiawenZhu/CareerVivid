# Jobright.ai — Competitor Profile

> **Threat Level: 🟡 MEDIUM**
> **Category fit:** Entrepreneurship & Job Creation
> **XPRIZE risk:** 8M+ job listings, $39.99/mo, AI-first job matching — but narrow and GPT-based

---

## Overview
Jobright.ai positions itself as an "AI-first job search engine" — not a resume builder, but a job matching platform. It crawls 8M+ job listings and uses AI to match candidates based on their profile and preferences. With $39.99/month pricing and a recent VC raise, it's one of the newer well-funded entrants in the AI job search space.

## Key Capabilities
| Feature | Detail |
|---|---|
| AI Job Matching | Personalized job recommendations from 8M+ listings |
| Smart Job Feed | Curated daily job alerts matched to your profile |
| Resume Upload | Profile extraction from uploaded resume |
| Application Tracking | Track which jobs were applied to |
| Company Research AI | AI-generated company insights |
| Interview Q&A Prep | AI question generation per job |
| Job Market Analytics | Demand trends for skills and roles |

## Business Model & Revenue
| Tier | Price | Features |
|---|---|---|
| Free | $0 | Limited recommendations, basic tracking |
| Premium | $39.99/mo | Unlimited AI matching, priority listings |

**Revenue estimate:** Unknown paying user count; $39.99/mo is high for the market — likely lower conversion than cheaper competitors. VC-backed, optimizing for growth.

**Funding:** Raised several million in Seed funding (2023–2024). AI-native pitch to investors.

## Tech Stack
- **AI:** GPT-4 / proprietary models — **NOT Gemini**
- **Job Data:** Web scraping + job board partnerships (8M+ listings)
- **Frontend:** React
- **No Chrome extension, no CLI, no autonomous apply**

## Weaknesses vs CareerVivid
- GPT-based, not Gemini — no Google Cloud alignment
- No resume builder or AI writing tools
- No voice interview coaching
- No autonomous job application submission
- No CLI tool or MCP server
- No B2B employer portal
- No Chrome extension autofill
- Job matching is their only differentiated feature — once matched, user still applies manually
- $39.99/mo is expensive for a "smart job feed"

## XPRIZE Assessment
Jobright has an AI-first story but narrow product scope. They'll struggle on Category Impact (job matching alone doesn't redefine workflows) and AI-Native Operations (matching algorithm isn't governing business decisions in the same way as an autonomous apply agent). Their revenue documentation may be weak due to high price point and low conversion.

## What to Steal
- 8M+ job listings is a massive data moat — CareerVivid's job marketplace should partner with or integrate similar data sources to expand listing breadth
- AI-generated company insights per job (culture, interview process, recent news) adds context that helps applicants personalize — integrate this into CareerVivid's job detail view
- Daily AI-curated job digest email keeps users coming back — CareerVivid should build this as a Gemini Grounding-powered feature
