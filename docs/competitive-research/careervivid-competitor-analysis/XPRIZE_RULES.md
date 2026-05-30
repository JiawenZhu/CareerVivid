# Build with Gemini XPRIZE — Rules & Judging Deep Dive

> Source: https://www.geminixprize.com/rules · https://xprize.devpost.com/

---

## The Core Requirement That Changes Everything

> **"Teams must launch a real business, acquire real users, and generate real revenue."**

This is not a demo competition. It is not a prototype competition. It requires:
- Real paying customers (arm's-length, not friends/family)
- Real revenue with monthly breakdown (May–August 2026)
- Proof: Stripe exports, bank statements, or P&L ledger
- Real agent execution logs proving AI is running in production

**Implication for CareerVivid:** The Stripe integration + Credits system + Business Partner Portal = revenue is already possible on day 1. Most new entrants need to build a business from scratch in 90 days.

---

## Three Judging Criteria (Equally Weighted)

### 1. Business Viability (33%)
- Total revenue from third-party customers (USD)
- Monthly breakdown showing growth trajectory
- Operating costs disclosed
- Business model sustainability beyond the 90-day window
- Related-party revenue counted separately (friends/family don't count as much)

**What judges want to see:** A product people pay for repeatedly, not a one-time novelty. Recurring subscription or usage-based billing beats one-time payments.

### 2. AI-Native Operations (33%)
- AI agents governing **key business decisions** — not just a feature
- Production-level deployment (not localhost, not demo mode)
- Continuous AI/API usage logs required
- Broad operational coverage — AI must permeate the product, not be a bolt-on

**What judges want to see:** Proof via screenshots, API usage dashboards, Vertex AI logs, Cloud Run metrics. "We use Gemini for chat" won't score well. "Gemini runs 8 distinct operations across interview coaching, resume generation, job matching, autonomous application submission, and voice synthesis" will.

### 3. Category Impact (33%)
- Either: **fundamentally redefines workflows** in the chosen category
- Or: **credible adoption scale** — many users genuinely using it
- Must show advancement, not just presence, in the chosen category

**What judges want to see:** A before/after story. Before CareerVivid: job seekers spend 4+ hours per application. After: 20 minutes, AI does the rest.

---

## Required Google Cloud Integration

- **Minimum:** 1 Google Cloud product + at least 1 Gemini API LLM call
- **Scoring signal:** Projects using more of the Google ecosystem score higher on AI-Native Operations
- **Eligible products:** Gemini API, Vertex AI, Cloud Run, Firebase, Cloud Storage, AI Studio, Antigravity, Stitch, Flow

**CareerVivid covers:** Gemini 2.5 & 3.0 (Vertex AI), Firebase Firestore, Firebase Auth, Firebase Storage, Cloud Run (voice coach microservice). This is one of the strongest Google Cloud footprints possible.

---

## Revenue Documentation Required

Submissions must include:

| Document | What to Show |
|---|---|
| Stripe dashboard export | MRR, transaction history, subscriber count |
| Monthly P&L | Revenue vs operating costs, net margin |
| Operating cost disclosure | Cloud Run, Firebase, Vertex AI costs |
| Customer testimonials | Real users saying the product helped them |
| Agent execution logs | Proof AI ran in production during the window |

---

## Category Descriptions

### Entrepreneurship & Job Creation ⭐ (CareerVivid's Primary)
> "Tools supporting new founders and economic growth"

This is intentionally broad. A platform that helps people find employment, launch freelance careers, or grow professionally directly advances entrepreneurship and job creation. CareerVivid is a natural fit.

### Professional Services Access ⭐ (CareerVivid's Secondary)
> "Connecting people with expert guidance"

Career coaching, resume review, interview preparation, and portfolio building are all professional services that were previously expensive and inaccessible. CareerVivid democratizes them with AI.

### Education & Human Potential (CareerVivid's Tertiary)
> "Workforce upskilling, alternative credentialing, personalized learning"

Interview coaching and skill-gap identification in job matching has an education angle.

---

## Eligibility Rules

- Individuals at majority age or older, **or teams**
- Organizations with **fewer than 25 employees** — CareerVivid qualifies
- Project must be **created after May 19, 2026** — this is the critical constraint
- Projects must use Google Cloud products

**Important:** "Created after May 19, 2026" — existing businesses can participate if they build a new product/feature within the competition window. CareerVivid can use its existing infrastructure but should launch a clearly new product or significant enhancement tied to the competition.

---

## Disqualifying Factors

- Financial support from sponsor (Google/XPRIZE) before the competition
- Not using required Google Cloud products
- Fake revenue (related-party transactions)
- IP violations
- Fewer than 25 employees rule violation

---

## Timeline

| Date | Event |
|---|---|
| May 19, 2026 | Competition opens, build period starts |
| August 17, 2026 1PM PDT | Submission deadline |
| ~September | Hacker Fund screening & verification |
| September 25, 2026 | Top 5 finalists pitch live at Moonshot Summit, LA |

---

## Strategic Implications for CareerVivid

### The Revenue Race
90 days to generate real revenue. CareerVivid has Stripe already wired in — this is a 2–4 week head start over teams building from scratch.

**Revenue levers to activate immediately:**
1. Stripe subscription tiers ($9.99, $19.99, $39.99/mo)
2. AI Credits sales via CLI and web
3. Business Partner Portal job postings ($50–$200/listing)
4. API key sales (BYO API key model in CLI generates zero revenue — convert to credits)

### The AI-Native Evidence Strategy
Every Gemini API call needs to be logged. Build a dashboard showing:
- Total Gemini API calls this month
- Which operations used AI (resume gen, interview coach, job match, auto-apply, etc.)
- User outcomes powered by AI

### The Category Impact Story
Before/after metrics:
- Average time to apply before CareerVivid: 45 min/application
- After: 8 min (with autofill + AI resume tailoring)
- Mock interview pass rate improvement
- Job offer rate for users who used the tool
