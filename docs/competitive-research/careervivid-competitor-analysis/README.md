# CareerVivid — Build with Gemini XPRIZE Competitor Analysis

> **Hackathon:** [Build with Gemini XPRIZE](https://xprize.devpost.com/)
> **Prize Pool:** $2,000,000 (Grand Prize: $500K)
> **Deadline:** August 17, 2026 · 1:00 PM PDT
> **Live Event:** September 25, 2026 — Moonshot Summit, Los Angeles
> **Participants:** 5,556 registered teams globally
> **Category Target:** Entrepreneurship & Job Creation / Professional Services Access

---

## What This Folder Contains

| File | Purpose |
|---|---|
| [ANALYSIS.md](ANALYSIS.md) | Full strategic report — landscape, positioning, scoring, action plan |
| [XPRIZE_RULES.md](XPRIZE_RULES.md) | Judging rubric, revenue requirements, eligibility rules |
| [CAREERVIVID_STRENGTHS.md](CAREERVIVID_STRENGTHS.md) | Full capability inventory matched against XPRIZE criteria |
| competitors/ | Individual profiles for each competitor |

---

## Quick Threat Matrix

| Competitor | Category | Users | Revenue Signal | Threat | AI Moat |
|---|---|---|---|---|---|
| [Careerflow.ai](competitors/careerflow-ai.md) | Career Platform | 2M+ | $23.99/mo SaaS | 🔴 HIGH | GPT-based |
| [Teal HQ](competitors/teal-hq.md) | Resume + Tracker | 300K+ | Freemium+Pro | 🔴 HIGH | GPT-based |
| [Huntr](competitors/huntr.md) | Job Tracker + Ext | 250K | $20/mo Pro | 🔴 HIGH | GPT-based |
| [AIApply](competitors/aiapply.md) | Auto Job Apply | Unknown | Credits model | 🔴 HIGH | GPT-4o based |
| [JobScan](competitors/jobscan.md) | ATS Matching | 1M+ | $49.95/mo | 🟡 MEDIUM | Basic NLP |
| [ApplyArc](competitors/applyarc.md) | Job Tracking | Growing | £19/mo | 🟡 MEDIUM | GPT-based |
| [Rezi.ai](competitors/rezi-ai.md) | AI Resume | 500K+ | $29/mo | 🟡 MEDIUM | GPT-based |
| [Kickresume](competitors/kickresume.md) | Resume+Portfolio | 3M+ | €8–€19/mo | 🟡 MEDIUM | GPT-4 |
| [Enhancv](competitors/enhancv.md) | Creative Resume | 1M+ | $24.99/mo | 🟡 MEDIUM | GPT-based |
| [Simplify Jobs](competitors/simplify-jobs.md) | Autofill Ext | 400K+ | Freemium | 🟡 MEDIUM | Basic AI |
| [Resume Worded](competitors/resume-worded.md) | Resume Scoring | 3M+ | $19/mo | 🟡 MEDIUM | Own model |
| [Jobright.ai](competitors/jobright-ai.md) | AI Job Recs | 500K+ | Freemium | 🟡 MEDIUM | Own model |
| [Google Gemini Career](competitors/google-gemini-career.md) | Google Native | Billions | Free/Gemini sub | 🔴 EXISTENTIAL | Gemini (IS Gemini) |
| [LinkedIn AI](competitors/linkedin-ai.md) | Giant Platform | 1B+ | Premium $40/mo | 🔴 HIGH | OpenAI+own |
| [Wonsulting](competitors/wonsulting.md) | Career Coaching | 500K+ | $97–$497 | 🟢 LOW | GPT-based |
| [Novoresume](competitors/novoresume.md) | Resume Builder | 4M+ | $14.99/mo | 🟢 LOW | Basic AI |
| [Zety](competitors/zety.md) | Resume Builder | 40M+/yr | $5.99/wk | 🟢 LOW | GPT |
| [Pave / Levels.fyi](competitors/pave-levels.md) | Comp Data | 2M+ | B2B | 🟢 LOW | Different focus |

---

## CareerVivid's XPRIZE Edge (TL;DR)

**The two reasons CareerVivid can win:**

1. **Already generating revenue.** Stripe integration + Business Partner Portal B2B + CLI credits model. No other competitor has this many monetization channels active before the competition even started.

2. **AI runs the entire product.** Not just a chatbot wrapper. Gemini powers resume generation, voice interview coaching (Gemini Live), autonomous job application submission (browser-use), CLI agent, MCP server, whiteboard diagram generation, and job matching. This is what "AI-native operations" means to XPRIZE judges.

**The one risk:** No other competitor in this analysis runs on **Google Gemini**. Most use GPT-4o or OpenAI. CareerVivid using Gemini 2.5/3.0 + Vertex AI is not just an advantage — it's an alignment signal to the judges, who are evaluating for Google's ecosystem.

---

## Files Index

```
docs/competitive-research/careervivid-competitor-analysis/
├── README.md                    ← You are here
├── ANALYSIS.md                  ← Full strategic report
├── XPRIZE_RULES.md              ← Judging criteria deep dive
├── CAREERVIVID_STRENGTHS.md     ← CareerVivid capabilities vs XPRIZE rubric
└── competitors/
    ├── careerflow-ai.md         🔴 HIGH THREAT
    ├── teal-hq.md               🔴 HIGH THREAT
    ├── huntr.md                 🔴 HIGH THREAT
    ├── aiapply.md               🔴 HIGH THREAT
    ├── google-gemini-career.md  🔴 EXISTENTIAL
    ├── linkedin-ai.md           🔴 HIGH THREAT
    ├── jobscan.md               🟡 MEDIUM
    ├── applyarc.md              🟡 MEDIUM
    ├── rezi-ai.md               🟡 MEDIUM
    ├── kickresume.md            🟡 MEDIUM
    ├── enhancv.md               🟡 MEDIUM
    ├── simplify-jobs.md         🟡 MEDIUM
    ├── resume-worded.md         🟡 MEDIUM
    ├── jobright-ai.md           🟡 MEDIUM
    ├── wonsulting.md            🟢 LOW
    ├── novoresume.md            🟢 LOW
    ├── zety.md                  🟢 LOW
    └── pave-levels.md           🟢 LOW
```
