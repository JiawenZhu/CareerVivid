# Simplify Jobs — Competitor Profile

> **Threat Level: 🟡 MEDIUM**
> **Category fit:** Entrepreneurship & Job Creation
> **XPRIZE risk:** 1M+ users, free-tier dominance, Chrome extension autofill leader among recent grads

---

## Overview
Simplify Jobs is a free job application autofill Chrome extension and job tracking platform that has become extremely popular with college students and recent graduates. With 1M+ users and 400K+ Chrome extension installs, Simplify's value proposition is simple: install the extension, and it autofills any job application form with your profile in one click. Their free tier is extremely generous, and monetization is early-stage/unclear.

## Key Capabilities
| Feature | Detail |
|---|---|
| Chrome Extension Autofill | One-click autofill on 500K+ company portals |
| Job Aggregator | 500K+ curated job listings |
| Application Tracker | Auto-tracks every application via extension |
| Profile Storage | Centralized resume, work history, answers |
| AI Resume Tailoring | GPT-powered (limited, newer feature) |
| Referral Network | Connect with employees at target companies |

## Business Model & Revenue
| Tier | Price | Features |
|---|---|---|
| Free | $0 | Unlimited autofill, tracking, job search |
| Premium (new) | ~$10–$20/mo | Enhanced AI features |

**Revenue estimate:** Primarily free — revenue model is evolving. Limited paid conversion data available. May rely on job board partnerships or data licensing.

**Funding:** VC-backed (Y Combinator W22 graduate) — raised several million dollars. Optimizing for growth, not profitability currently.

## Tech Stack
- **AI:** GPT-4 (limited use) — **NOT Gemini**
- **Extension:** Chrome extension (1M+ installs, dominates recent grad market)
- **Autofill:** Deep form parsing using DOM analysis
- **Stack:** React + Firebase (!) — notable: they use Google Firebase too

## Strengths vs CareerVivid
- Free autofill with 500K+ company portal support is a significant network effect
- YC brand resonates with tech-sector job seekers
- Auto-tracking (extension records every application automatically) is seamless UX

## Weaknesses vs CareerVivid
- No Gemini integration — GPT only for limited AI features
- Revenue model unclear — hard to document strong MRR for XPRIZE
- No voice interview coaching
- No autonomous apply submission (user still clicks "Submit")
- No CLI tool
- No MCP server
- No B2B employer portal
- Freemium with unclear monetization path = weak Business Viability score
- Limited AI depth — primarily a form-filler, not a career intelligence platform

## XPRIZE Assessment
Simplify's YC pedigree and user count are impressive, but their revenue story is weak (free product, early monetization). XPRIZE requires "real revenue" — if Simplify can't show MRR from paying customers, they'll score poorly on Business Viability despite millions of users. Their AI depth is also shallow.

## What to Steal
- Auto-tracking (the extension silently records every application) removes friction from the tracker — CareerVivid's extension should auto-create a Kanban card when it detects a form submission
- Referral network feature (connect with employees at target companies) is a differentiated trust-building feature — adds network value beyond tools
- 500K+ company portal support number is a marketing anchor — CareerVivid should count and publicize the number of ATS platforms their autofill supports
