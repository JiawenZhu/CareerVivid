# Team USA x Google Cloud Hackathon Plan
## "Vibe Code for Gold with Google" — v2 (Competitive Intelligence Upgrade)

> **Status:** DRAFT v2 — Awaiting approval before scaffolding begins.
> **Deadline:** May 11, 2026 at 8:00 PM EDT
> **Prize Pool:** $75,000 USD + Google Cloud Credits

---

## Part 1 — Competitive Intelligence & Winning Strategy

### 1.1 What the 80 Other Participants Are Building

Based on current developer community trends (Dev.to, GitHub, Reddit) and recent 2026 Devpost/Google hackathon patterns, the majority of submissions will be:

| Submission Type | Why It Loses |
|---|---|
| Single-prompt Gemini dashboards | No engineering depth. Easy to prompt, easy to copy. |
| Browser extensions (tab summarizers) | Very common vibe-coding output. No backend. |
| Simple web games | Zero technical differentiation. |
| Hardcoded JSON / localStorage "apps" | Not production-ready. Fails the "real system" test. |

### 1.2 What Actually Wins Google Cloud Hackathons in 2026

Recent Google Gemini + GKE hackathon winners share a pattern:

- **Multi-agent orchestration** — multiple Gemini models with distinct roles talking to each other (Agent-to-Agent protocols), not a single chatbot
- **Production backend** — Firebase, Firestore, Cloud Run, not localhost + JSON
- **Practical, real-world utility** — solves a genuine problem, not a toy
- **Engineering maturity** — handles failure modes (hallucination correction, rollback, validation)

### 1.3 Our Differentiation Strategy

We are building an **enterprise-grade multi-agent AI system** on top of Challenge 4, not a single-prompt toy.

**Three specific differentiators that no vibe-coder will have:**

1. **Multi-Agent Pipeline** — 4 Gemini agents with distinct roles, orchestrated via Gemini Function Calling. Judges obsess over this.
2. **Firebase Firestore backend** — Production-ready persistence using CareerVivid's existing Firebase infrastructure. Most submissions will have no backend at all.
3. **Hallucination Validator Agent** — A critic agent that cross-checks Gemini's generated athlete facts against the real dataset before showing the user. This demonstrates engineering maturity that will separate us from every other project.

---

## Part 2 — Project: TeamUSA Archetype Oracle

### 2.1 Selected Challenge

**Challenge 4: The Athlete Archetype Agent** — *"Find Yourself in Team USA"*

**Elevator Pitch:**

> A fan-facing AI system powered by a 4-agent Gemini pipeline that takes a user's body metrics and surfaces historically similar Team USA athletes across 120 years — both Olympic and Paralympic — using K-means clustering and multi-agent narrative generation. A dedicated Validator Agent prevents hallucinated stats from reaching the user. Results are persisted to Firebase Firestore. The system demonstrates not just what Gemini can do, but how to build a production-grade agentic workflow.

---

## Part 3 — System Architecture

```
USER BROWSER
     │
     │ POST /api/archetype {height, weight, age, activity}
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (FastAPI / Cloud Run)                │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  AGENT 1 — Data Gatherer                                     │   │
│  │  Model: gemini-2.0-flash                                     │   │
│  │  Tools: get_athlete_cluster(biometrics) → matched_athletes[] │   │
│  │         get_paralympic_matches(biometrics) → para_athletes[] │   │
│  │  Output: structured athlete context JSON                     │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
│                               │                                      │
│  ┌────────────────────────────▼─────────────────────────────────┐   │
│  │  AGENT 2 — Validator / Critic                                │   │
│  │  Model: gemini-2.0-flash                                     │   │
│  │  Tools: verify_athlete_stat(name, stat, value) → bool        │   │
│  │         correct_hallucination(claim) → verified_claim        │   │
│  │  Input: Agent 1 output                                       │   │
│  │  Output: validated, corrected athlete context                │   │
│  │  Purpose: Cross-checks every athlete fact against the CSV    │   │
│  │           dataset. Corrects hallucinations before they reach │   │
│  │           the user. This is the engineering maturity signal. │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
│                               │                                      │
│  ┌────────────────────────────▼─────────────────────────────────┐   │
│  │  AGENT 3 — Narrator                                          │   │
│  │  Model: gemini-2.0-flash (streaming)                         │   │
│  │  Input: Validated athlete context from Agent 2               │   │
│  │  System: "You are a Team USA sports historian. Use ONLY the  │   │
│  │           verified facts provided. Conditional language only."│   │
│  │  Output: SSE stream of archetype narrative                   │   │
│  │  Parity: Must include ≥1 Olympic and ≥1 Paralympic match     │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
│                               │                                      │
│  ┌────────────────────────────▼─────────────────────────────────┐   │
│  │  AGENT 4 — LA28 Predictor                                    │   │
│  │  Model: gemini-2.0-flash                                     │   │
│  │  Tools: get_la28_sports(), get_momentum_data(sport)          │   │
│  │  Input: User archetype + validated cluster                   │   │
│  │  Output: ranked list of LA28 sports that could suit the user │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
│                               │                                      │
│  ┌────────────────────────────▼─────────────────────────────────┐   │
│  │  PERSISTENCE — Firebase Firestore                            │   │
│  │  Collection: archetype_results/{userId}                      │   │
│  │  Fields: archetype, matched_athletes[], narrative, la28_recs │   │
│  │          validator_corrections[], timestamp, sessionId       │   │
│  │  Purpose: Users can return and see their saved archetype.    │   │
│  │           Aggregate stats: "most common archetype this week" │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
     │
     │ SSE stream → typewriter reveal
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 14 / Cloud Run)               │
│  • Archetype reveal card (animated, Framer Motion)                  │
│  • 120-year scatter plot (Recharts — user dot highlighted)          │
│  • Streaming Gemini narrative (typewriter)                          │
│  • "Validator shield" badge — shows how many hallucinations were    │
│    corrected (this is the visual demo moment judges will love)      │
│  • Matched athletes (Olympic + Paralympic pair, equal prominence)   │
│  • LA28 sports panel (forward-looking)                              │
│  • Multi-turn chat agent (grounded in user's validated archetype)   │
│  • Community stats: "You share an archetype with X% of visitors"   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Part 4 — Tech Stack

### 4.1 Frontend
| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | React framework, SSR, API routes |
| **TypeScript 5.x** | Type safety |
| **Tailwind CSS 3.x** | Styling |
| **Recharts 2.x** | 120-year scatter plot timeline |
| **Framer Motion 11.x** | Archetype card reveal, validator badge animation |
| **shadcn/ui** | Component primitives |
| **Firebase JS SDK** | Auth (anonymous) + Firestore reads for community stats |

### 4.2 Backend (Orchestrator)
| Technology | Purpose |
|---|---|
| **Python 3.11** | Primary backend |
| **FastAPI 0.111** | Async REST + SSE streaming |
| **scikit-learn 1.4** | K-means clustering, precomputed centroids |
| **pandas 2.x** | Dataset manipulation |
| **firebase-admin** | Firestore writes from backend |
| **Docker** | Cloud Run container |

### 4.3 Google Cloud
| Service | Purpose |
|---|---|
| **Gemini 2.0 Flash** | All 4 agents — primary model |
| **Gemini Function Calling** | Tools given to each agent (verify_stat, get_cluster, etc.) |
| **Vertex AI** | Gemini API with GCP auth |
| **Cloud Run** | Serverless backend + frontend deployment |
| **Cloud Storage** | Athlete CSVs + precomputed centroids.pkl |
| **Artifact Registry** | Docker images |
| **Firebase Firestore** | Archetype result persistence (CareerVivid Firebase project) |

### 4.4 Data Sources
| Dataset | Source | Notes |
|---|---|---|
| US Olympic biometrics (1896–2024) | Kaggle: "120 years of Olympic history" | Filter to US athletes |
| US Paralympic athlete data | IPC public results archive | Manual supplement |
| LA28 sports + schedule | la28.org | 28 sports confirmed |
| Geographic hometown data | US Census / public | For potential Challenge 2 layer |

---

## Part 5 — Agent Design (The Technical Core)

### Agent 1 — Data Gatherer

**Role:** Given user biometrics, finds the nearest K-means cluster and retrieves the top matched athletes.

**Gemini Function Calling Tools:**
```python
get_athlete_cluster(height_cm, weight_kg, age, activity_level)
  → { cluster_id, archetype_label, centroid_distance, matched_athletes[5] }

get_paralympic_matches(height_cm, weight_kg, activity_level)
  → { para_matched_athletes[3] }
```

**Why Function Calling (not just a prompt):** The athlete data lives in a pandas DataFrame, not in Gemini's training data. Function Calling is the correct tool — the model decides when to call these tools, which demonstrates proper agentic architecture to judges.

---

### Agent 2 — Validator / Critic (The Differentiator)

**Role:** Cross-checks every factual claim Agent 1 produces against ground truth CSV data before it reaches the user. This is the "hallucination firewall."

**Gemini Function Calling Tools:**
```python
verify_athlete_stat(athlete_name, stat_name, claimed_value)
  → { is_accurate: bool, actual_value: str, source: "csv" }

get_athlete_record(athlete_name)
  → { sports, years, events, results_summary }
```

**Behavior:**
- Agent 2 receives Agent 1's structured output
- It calls `verify_athlete_stat` for each claim
- If `is_accurate = False`: replaces the hallucinated value with `actual_value`
- It tracks corrections: `validator_corrections: [{ field, original, corrected }]`
- These corrections are saved to Firestore AND displayed in the UI as a "🛡️ Validated — X corrections made" badge

**Demo moment:** Judge sees the badge showing "3 facts auto-corrected before display." This is engineering maturity no other submission will show.

---

### Agent 3 — Narrator (The Story)

**Role:** Generates the fan-facing narrative from validated context only.

**System prompt constraints:**
- Use ONLY the verified facts from Agent 2's output (no free-form hallucination)
- Minimum 1 Olympic athlete reference, minimum 1 Paralympic athlete reference
- Conditional language required ("could align with," "historically similar builds have excelled in," "may suggest")
- No performance guarantees
- Tone: inspiring sports historian, not a stat sheet

**Streaming:** Outputs via SSE so the frontend can do the typewriter reveal.

---

### Agent 4 — LA28 Predictor (Forward-Looking)

**Role:** Maps the user's validated archetype to LA28 sports, providing a "road to 2028" narrative.

**Gemini Function Calling Tools:**
```python
get_la28_sports()
  → [{ sport, discipline, olympic: bool, paralympic: bool }]

get_archetype_sport_affinity(archetype_label)
  → [{ sport, affinity_score, historical_basis }]
```

**Output:** Ranked list of 3–5 LA28 sports with a Gemini-generated explanation of why each could suit the user's archetype.

---

## Part 6 — Firebase Integration (The Production Signal)

Using CareerVivid's existing Firebase project.

### Firestore Schema

```
Collection: archetype_results
  Document: {sessionId}
    archetype_label: "Aerobic Engine"
    cluster_id: 2
    matched_athletes: [
      { sport: "Marathon", era: "1984", type: "olympic" },
      { sport: "Para-Triathlon", era: "2020", type: "paralympic" }
    ]
    narrative: "Your build shares characteristics with..."
    la28_recommendations: ["Triathlon", "Cycling", "Para-Handcycle"]
    validator_corrections: [
      { field: "marathon_record", original: "2:08:00", corrected: "2:09:21" }
    ]
    timestamp: Firestore.serverTimestamp()
    anonymous_uid: "uid_xyz"

Collection: archetype_stats  (aggregate, for community panel)
  Document: "global"
    archetype_counts: { "Aerobic Engine": 142, "Powerhouse": 89, ... }
    total_sessions: 231
    corrections_made: 47  ← great stat to show in demo
```

### Why This Matters for Judging

- Proves the app is **production-ready and scalable** — not localStorage
- Uses the **Google Cloud ecosystem** (Firebase is Google Cloud) — scores Technical Depth
- The **community stats panel** ("You share an archetype with 31% of visitors") creates a live, dynamic element that makes the demo feel real

---

## Part 7 — The "Hallucination Handling" Feature (Engineering Maturity)

This is the feature no other hackathon submission will have. We build it explicitly because:

1. Judges are reading developer discussions about AI hallucinations in vibe coding
2. It demonstrates that we understand the real limitations of LLMs — not just prompt-and-pray
3. It's a natural fit for the data-driven challenge (we have ground truth to check against)

**How it works in the demo:**
1. Enter biometrics → pipeline runs
2. The UI shows a loading state: "🔍 Validating athlete facts..."
3. Archetype card reveals with a "🛡️ Shield" badge: "3 AI-generated facts were auto-corrected before display"
4. Clicking the badge shows a diff: `Before: "Won gold in 1996" → After: "Competed in 1996" (corrected from dataset)`

**In the Devpost submission text:** explicitly call out that our system validates Gemini output against ground truth, correcting hallucinations before they reach users. This is the single most impressive engineering decision we can make.

---

## Part 8 — Phased Execution Strategy

### Phase 1 — Environment Setup & Data (Days 1–2)

- [ ] GitHub repo: `teamusa-archetype-oracle`, Apache 2.0 license in About
- [ ] Next.js 14 scaffolded in `/frontend`
- [ ] FastAPI scaffolded in `/backend`
- [ ] GCP project setup, enable: Vertex AI, Cloud Run, Artifact Registry, Cloud Storage
- [ ] Firebase Firestore: create `archetype_results` and `archetype_stats` collections
- [ ] Download + clean Kaggle Olympic dataset (filter to US athletes)
- [ ] Supplement with Paralympic data
- [ ] Exploratory K-means clustering (k=6), compute centroids, save `centroids.pkl` to GCS
- [ ] Write `cloudbuild.yaml` + `Dockerfile` for backend

**Deliverable:** Clean dataset, centroids computed, both services run locally.

---

### Phase 2 — Multi-Agent Backend (Days 3–6)

- [ ] Agent 1: `get_athlete_cluster` + `get_paralympic_matches` function tools
- [ ] Agent 2: `verify_athlete_stat` + `get_athlete_record` function tools — Validator pipeline
- [ ] Agent 3: Streaming narrator with parity constraints in system prompt
- [ ] Agent 4: LA28 predictor with `get_la28_sports` + `get_archetype_sport_affinity`
- [ ] Orchestrator: `POST /api/archetype` — chains all 4 agents, returns SSE stream
- [ ] `POST /api/chat` — multi-turn agent grounded in user's saved archetype (Firestore read)
- [ ] Firebase writes: save result + corrections to Firestore after Agent 4
- [ ] Unit tests for validator agent (verify it catches known bad data)
- [ ] Deploy backend to Cloud Run

**Deliverable:** Full 4-agent pipeline runs end-to-end, results saved to Firestore.

---

### Phase 3 — Frontend (Days 7–10)

- [ ] Landing page: hero, "Find Your Archetype" CTA, anonymous Firebase auth
- [ ] Biometric input form (height, weight, age, activity level)
- [ ] Loading state: "Running 4-agent analysis..." with step indicators
- [ ] Archetype reveal: animated card flip (Framer Motion), archetype icon + label
- [ ] **Validator shield badge**: "🛡️ X facts auto-corrected" — clickable diff view
- [ ] 120-year scatter plot (Recharts): historical athletes, user's dot highlighted
- [ ] Streaming narrative panel (SSE typewriter reveal)
- [ ] Matched athletes: Olympic + Paralympic side-by-side (equal visual prominence)
- [ ] LA28 panel: ranked sports recommendations
- [ ] Community stats: "You share this archetype with X% of visitors" (Firestore read)
- [ ] Multi-turn chat agent UI (floating, grounded in saved archetype)
- [ ] Responsive + accessible (WCAG AA)

**Deliverable:** Complete user flow in browser, all panels functional.

---

### Phase 4 — Polish & Submission (Days 11–14)

- [ ] Cloud Run: min-instances=1 for judging window
- [ ] End-to-end smoke test on production URLs
- [ ] Record 3-minute demo video:
  - [ ] Enter biometrics → show the 4-agent loading steps
  - [ ] Archetype reveal + validator badge (show the diff — this is the wow moment)
  - [ ] 120-year scatter plot
  - [ ] Paralympic athlete match explicitly shown
  - [ ] GCP console: Cloud Run services, Firestore data, Vertex AI usage
  - [ ] Code: show the 4-agent orchestration + Firebase write
- [ ] Devpost text: explicitly mention hallucination validator, multi-agent architecture, Firebase persistence
- [ ] Submit before May 11, 8:00 PM EDT

---

## Part 9 — Risk Register

| Risk | Mitigation |
|---|---|
| Paralympic biometric data is thin | Supplement manually from IPC; Gemini narrative covers gaps |
| K-means clusters don't cleanly separate | PCA first; tune k=6–8; validate silhouette scores |
| Validator catches too many "corrections" on real data | Tune thresholds; show 1–3 corrections per session for demo impact without crying wolf |
| Firebase cold read latency in demo | Pre-warm community stats on landing page load |
| Cloud Run cold start | min-instances=1 during judging window |
| Agent chain takes >10s | Show step-by-step loading indicators so latency feels like "working hard" not "broken" |

---

## Part 10 — Judging Scorecard (Self-Assessment)

| Criterion | Weight | Our Advantage |
|---|---|---|
| **Impact (40%)** | 40% | Fan-facing "Digital Mirror" concept. Paralympic parity baked in at equal depth. Inspiring "find yourself in 120 years of history" narrative. |
| **Technical Depth (30%)** | 30% | 4-agent Gemini pipeline with Function Calling. Validator agent. Firebase Firestore persistence. SSE streaming. Not a chatbot. |
| **Presentation (30%)** | 30% | Animated archetype reveal. Validator badge diff view (the "wow" moment). 120-year scatter plot. Streaming typewriter narrative. Strong story arc. |

**Predicted differentiation:** Every other submission will be a single Gemini prompt in a nice UI. We are presenting a multi-agent system with a production backend, hallucination correction, and a compelling fan story. This is the gap.

---

## Part 11 — Submission Checklist

- [ ] Gemini API — 4 agents with Function Calling ✓
- [ ] Google Cloud deployment (Cloud Run) ✓
- [ ] Firebase Firestore — production persistence ✓
- [ ] Apache 2.0 license visible in repo About ✓
- [ ] Live hosted URL ✓
- [ ] 3-min YouTube unlisted demo video ✓
- [ ] Devpost description (features, agents, validator, data, findings) ✓
- [ ] Paralympic parity: equal analytical depth shown in video ✓
- [ ] Conditional language — no performance guarantees ✓
- [ ] No individual athlete NIL usage ✓

---

*Plan v2 — updated with competitive intelligence. Awaiting approval before Phase 1 scaffolding begins.*
