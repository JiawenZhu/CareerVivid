# JobScan — Competitor Profile

> **Threat Level: 🟡 MEDIUM**
> **Category fit:** Professional Services Access
> **XPRIZE risk:** 1M+ users, $49.95/mo premium, strong ATS-matching brand but narrow scope

---

## Overview
JobScan pioneered the ATS resume optimization category. Their core product scans a resume against a job description and gives a "Match Rate" score, identifying missing keywords. 1M+ users, $49.95/mo for full access, and a well-known brand among serious job seekers. However, their product scope is narrow — it's a resume scanner, not a career platform.

## Key Capabilities
| Feature | Detail |
|---|---|
| Resume ATS Scan | Side-by-side match rate with keyword gaps |
| LinkedIn Profile Scanner | Optimize LinkedIn sections for recruiter search |
| Cover Letter Scanner | ATS optimization for cover letters |
| Job Application Tracker | Basic (added as table stakes) |
| Power Edit | AI resume rewriting suggestions |
| Interview Q&A Bank | Static question library (not AI-generated) |

## Business Model & Revenue
| Tier | Price | Features |
|---|---|---|
| Free | $0 | 5 scans/mo |
| Premium | $49.95/mo or $89.95/3mo | Unlimited scans, Power Edit |

**Revenue estimate:** 1M users; premium at even 1% conversion = 10,000 × $49.95 = ~$500K MRR. Very credible XPRIZE revenue documentation.

## Tech Stack
- **AI:** Combination of NLP keyword matching + limited GPT integration — not AI-native
- **Core:** Proprietary ATS simulation algorithms built pre-LLM era
- **No CLI, no extension functionality beyond LinkedIn scanner**

## Weaknesses vs CareerVivid
- **Not AI-native** — core product is rule-based NLP, not a language model
- No voice interview coaching
- No autonomous apply
- No job tracker (beyond basic)
- No B2B employer side
- No Gemini / Google Cloud integration
- $49.95/mo is expensive for a narrow use case

## XPRIZE Assessment
JobScan is unlikely to enter XPRIZE — their product architecture predates AI-native operations. Judges scoring "AI governs key business decisions" will find a keyword-matching algorithm, not Gemini running business logic. Their revenue documentation would be strong but their AI story is weak.

## What to Steal
- The side-by-side resume vs. JD comparison view is an excellent UX pattern — CareerVivid should show this visualization in the resume builder
- The concept of a "Match Rate %" is already in CareerVivid's Chrome extension (87% score) — emphasize this heavily in marketing
