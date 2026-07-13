<<<<<<< HEAD
<div align="center">

<img src="docs/media/readme-banner.svg" alt="CareerVivid — Learn, Practice, Get hired" width="100%" />

<br/><br/>

# ✨ CareerVivid

### The open-source **AI career workspace** — job search, interview prep & AI learning in one beautiful app

*Accelerate your career: learn AI hands-on, master coding & system design interviews,*
*optimize your resume, discover verified tech jobs, and auto-apply — all in one continuous workflow.*

<br/>

[![Website](https://img.shields.io/badge/🌐_Live_App-careervivid.app-6c5ce7?style=for-the-badge)](https://careervivid.app)
[![License](https://img.shields.io/badge/License-Source_Available_+_Attribution-4534a0?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-15803d?style=for-the-badge)](CONTRIBUTING.md)

[![React](https://img.shields.io/badge/React_18-20232a?style=flat-square&logo=react&logoColor=61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-e64bcb?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Firebase](https://img.shields.io/badge/Firebase-ffca28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)

<br/>

**[🎓 Courses](https://careervivid.app/learning)** · **[🎤 Interview Studio](https://careervivid.app/interview-studio)** · **[💼 Jobs](https://careervivid.app/jobs/recommend)** · **[📊 Open Metrics](https://careervivid.app/open)**

<br/>

⭐ **If CareerVivid helps your job search, star the repo — it helps other job seekers find it.** ⭐

</div>

<br/>

---

## 🧭 Why CareerVivid

> Job searching is fragmented: one tab for jobs, one for LeetCode, one for system design notes, one for your resume, one spreadsheet for tracking.
>
> **CareerVivid unifies the entire loop — `Learn → Practice → Get hired` — so every hour you invest compounds toward an offer.**

Built for new grads, career switchers, and engineers targeting **tech jobs and AI jobs**. Everything renders in a warm, animation-rich UI that makes interview preparation feel like a game, not a grind.

<br/>

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 🎓 Courses where *every concept is animated*

**🤖 AI Agent Builder Curriculum** — 10 modules from LLM foundations to a shipped agent portfolio project: animated playgrounds *(token prediction · RAG pipelines · agent loops · prompt-injection defense)*, quizzes & in-browser code labs

**🧩 Coding Interview Patterns** — sliding window, two pointers, binary search, backtracking, BFS, DP… each with its **own step-through animation** + test-graded code labs

**🏗️ System Design Interview** — 13 chapters · 85 exercises: the 45-minute interview clock, consistent-hash rings, circuit breakers, feed fan-out, latency flashcards, capacity quick-fire & spot-the-flaw games

</td>
<td width="50%" valign="top">

### 🎤 Company-specific interview practice

**300+ tech companies** with real-format interview guides

Live **AI mock interviews** with voice, task briefs, live objectives & countdown timer

Coding battles · system design whiteboard with **AI diagram review** · Socratic coaching

### ⚔️ Classic Questions Arena

Bit.ly · Twitter timeline · WhatsApp · web crawler · rate limiter · Dropbox sync — every question as a 4-phase drill: **Clarify → Estimate → Design → Follow-up**

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 💼 Verified live jobs + auto-apply

Real-time feed from **official ATS APIs** *(Greenhouse · Lever · Ashby)* across **160+ live company boards** — no scraped spam, no dead links

**AI job matching** ranked against your resume, skills & location

**Auto-apply tooling** + full application tracker: status pipeline, saved JDs, validated apply links
=======
# CareerVivid

> An AI career workspace that turns a candidate's resume, job search, interview
> practice, and learning plan into one continuous application workflow.

## Competition Submission

- **Submission branch:** [`competition-2026`](https://github.com/JiawenZhu/CareerVivid/tree/competition-2026)
- **Eligibility marker:** [`competition-start`](https://github.com/JiawenZhu/CareerVivid/tree/competition-start)
- **Competition window:** May 19, 2026 at 10:00 AM PDT to August 17, 2026 at 1:00 PM PDT
- **Detailed record:** [COMPETITION.md](COMPETITION.md)

The `competition-start` annotated tag points to
[`42320189`](https://github.com/JiawenZhu/CareerVivid/commit/423201899f3717876c8f3645eaaffed57c5028b8),
the first qualifying commit after the competition opened. This branch preserves
the repository's actual history; no timestamps or prior commits have been rewritten.

## What To Review

CareerVivid is designed around the candidate's complete preparation loop:

1. **Choose a target resume and application profile.**
2. **Discover and rank verified job opportunities** against that candidate's
   experience, skills, and location preferences.
3. **Tailor application materials and track progress** through an application
   pipeline.
4. **Practice interviews with company-specific challenges, a whiteboard, AI
   diagram review, and Socratic coaching.**
5. **Build durable skills through interactive courses,** then return to a
   course-owned timed mock without losing progress or mixing results with the
   Company Quest experience.

## Competition Highlights

### Resume-Grounded Job Recommendations

Recommendations are driven by the selected target resume and application
preferences rather than a fixed technical profile. The product prioritizes
location and country preferences, identifies missing skills, and keeps direct
apply links validated before jobs are surfaced.

### Interactive Learning That Resumes

The AI Agent Builder Curriculum, Coding Interview Patterns, and System Design
Interview courses use persisted per-lesson progress. A learner who returns to a
course starts at the next incomplete lesson, including after a refresh or a
saved course URL.

### System Design Interview Course

The System Design Interview course has twelve modules across three experience
roadmaps:

- **Foundations:** interview framing, estimation, APIs/data models, and core
  building blocks.
- **Product Scale:** caching, rate limiting, data at scale, event processing,
  and reliability.
- **Senior Systems:** real-time systems, feeds/search/analytics, distributed
  systems, and a changing-requirements capstone.

Each module moves from concept recognition to a deterministic simulation,
scenario decision, quiz, architecture exercise, answer drill, and a separate
course-owned timed mock. The course reuses canonical system-design prompts but
keeps its navigation and saved results separate from Company Quest.

### Simulation-Led Practice

Interactive lessons model real, visible state transitions such as request flow,
capacity, caching, rate limiting, partitioning, replication lag, consumer lag,
backpressure, circuit breakers, and regional failover. Learners can change a
meaningful constraint and inspect the resulting behavior instead of viewing a
static diagram.

## Product Walkthrough

### 1. Turn a target role into an actionable plan

The dashboard makes the candidate's job search state visible in one place: the
selected resume, target role, readiness, interview progress, application plan,
and the next action to take.

![CareerVivid dashboard showing the job-search setup map, readiness score, target role, resume, and interview progress](docs/screenshots/dashboard.png)

### 2. Find jobs that fit the selected resume

The recommendation feed evaluates a job against the selected target resume and
application profile. The result explains its match, identifies gaps to review,
prioritizes the candidate's location, and provides verified apply actions.

![Resume-grounded job recommendations with match reasons, gaps to review, salary, location, and apply actions](docs/screenshots/job-recommendations.png)

### 3. Practice the interview a company is likely to run

The Interview Studio brings company-specific preparation, career paths, saved
sessions, difficulty, mode, and duration into one starting point.

![Interview Studio with company-specific interview quests, search, filters, recent sessions, and career paths](docs/screenshots/interview-studio.png)

### 4. Follow a complete company interview loop

Each Company Quest breaks a realistic interview into recruiter screen, coding,
system design, behavioral, and final-round stages. Candidates can resume an
unfinished stage, review results, and earn progress for clearing a stage.

![SAP Company Quest showing five interview stages, quest progress, badges, and resume actions](docs/screenshots/company-quest-overview.png)

### 5. Run an adaptive live voice interview

The live voice workspace maintains the interview brief, queued questions,
transcript, session path, and real-time signals together so the candidate can
practice speaking under interview conditions.

![Live SAP recruiter-screen voice interview with transcript, question queue, task requirements, and session metrics](docs/screenshots/live-voice-interview.png)

### 6. Resume the exact coding problem that needs work

After a coding stage, the candidate can select a specific problem to improve
instead of restarting the entire interview loop.

![Company Quest coding stage with a problem picker for targeted practice](docs/screenshots/quest-coding-picker.png)

### 7. Code, test, and submit inside the interview workflow

The coding workspace provides the problem brief, requirements, language-aware
editor, test runner, and review submission in a focused interview surface.

![Coding workspace for the Climbing Stairs problem with Python editor, requirements, tests, and submit-for-review action](docs/screenshots/coding-workspace.png)

### 8. Get an AI coaching hint without leaving the editor

The code coach converts a spoken or typed question into an editable draft and
returns a focused next step, helping the candidate improve reasoning rather
than merely revealing an answer.

![AI Code Coach in the coding workspace with an optimization hint and suggested test cases](docs/screenshots/ai-code-coach.png)

### 9. Practice system design on an editable whiteboard

The system-design stage supplies a concrete design brief and acceptance
criteria, then lets the candidate construct and review an architecture diagram
with AI feedback and voice coaching available from the same workspace.

![System-design whiteboard workspace with requirements, drawing guidance, AI generation, coaching, and submit-for-review action](docs/screenshots/system-design-whiteboard.png)

### 10. Turn each attempt into a clear practice plan

Interview reports combine overall score, metric breakdowns, strengths, and
specific next-practice guidance. Candidates can inspect transcripts and export
their feedback.

![Interview report with overall score, communication confidence and relevance metrics, strengths, practice recommendations, and export actions](docs/screenshots/interview-report.png)

### 11. Learn by doing between interviews

The course catalog links interview readiness to skill-building. Progress across
AI agents, coding patterns, and system design remains visible at the course
level and each course resumes at the next incomplete lesson.

![Course catalog showing AI Agent Builder, Coding Interview Patterns, System Design Interview, progress bars, and upcoming courses](docs/screenshots/course-catalog.png)

### 12. Make LLM concepts tangible with interactive playgrounds

The AI Agent Builder Curriculum uses hands-on widgets instead of passive
reading. Learners can change inputs, observe state changes, and complete an
explicit learning objective.

#### Tokenization and cost intuition

![Tokenizer playground showing editable text, token segmentation, token count, characters per token, and estimated usage costs](docs/screenshots/tokenizer-playground.png)

#### Context-window behavior

![Context-window visualizer showing model context capacity, message types, and the effect of a pasted document](docs/screenshots/context-window-playground.png)

#### Curated video in the learning flow

![AI course video lesson with course progress, lesson framing, learning objectives, and previous-next navigation](docs/screenshots/video-lesson.png)

#### Retrieval-Augmented Generation

![RAG playground showing a selected query, ranked retrieved chunks, similarity scores, and a grounded answer with citation](docs/screenshots/rag-playground.png)

## Architecture

| Area | Implementation |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Authentication and persistence | Firebase Auth and Firestore |
| AI capabilities | Gemini through a controlled application proxy |
| Interactive course content | JSON course definitions rendered by React widgets |
| Whiteboard practice | Excalidraw with AI diagram review and voice coaching |
| Production build | Vite and Firebase Hosting |

## Reproduce The Submission

```bash
git clone --branch competition-2026 https://github.com/JiawenZhu/CareerVivid.git
cd CareerVivid
npm ci
npm test -- --run src/lib/interactiveCourses.test.ts src/lib/codingInterviewRoadmap.test.ts src/lib/learningSeo.test.ts src/lib/systemDesignQuestionBank.test.ts
npm run build:vite
```

For local development, provide the Firebase and AI proxy configuration through
your normal environment file, then run:

```bash
npm run dev
```

## Repository Guide

- [COMPETITION.md](COMPETITION.md): eligibility and submission timeline
- `data/courses/`: data-driven course definitions
- `src/components/CourseWidgets/`: interactive lesson and simulation widgets
- `src/components/Quest/`: Company Quest and system-design practice surfaces
- `src/pages/`: application routes and course experiences
- `functions/`: Firebase Functions, SEO generation, and backend services
>>>>>>> origin/main

</td>
<td width="50%" valign="top">

<<<<<<< HEAD
### 📄 Resume & career tools

**AI resume optimization** tailored per job description

Application profiles · cover letter drafting · progress analytics with **XP & levels**

Per-lesson persisted progress — return to any course and **resume exactly where you left off**

</td>
</tr>
</table>

<br/>

## 🚀 Quick start

```bash
git clone https://github.com/JiawenZhu/CareerVivid.git
cd CareerVivid
npm install
cp .env.example .env   # add your Firebase + AI provider keys
npm run dev
```

> [!TIP]
> Course content is **data-driven**: each course is one JSON file in `data/courses/`, and every animation is a lazy-loaded widget in the registry. Adding a course or animation needs **zero framework changes** — see [CONTRIBUTING.md](CONTRIBUTING.md).

Requires **Node 18+**. Firebase (Auth / Firestore / Cloud Functions) powers the backend — see `.env.example` for the key list.

<br/>

## 🧱 Architecture at a glance

```
data/courses/*.json ──▶ course engine ──▶ lesson pages
                            │
src/components/CourseWidgets/ ──▶ widget registry (40+ animations, lazy-loaded)
src/lib/systemDesignQuestionBank.ts ──▶ case drills · flashcards · flaw scenes
functions/ ──▶ ATS job ingestion (cron) · AI interview agents · SEO
```

`React 18` · `TypeScript` · `Vite` · `Tailwind CSS` · `Framer Motion` · `Firebase` · `Vitest`

<br/>

## 🗺️ Roadmap

| Status | Milestone |
|:------:|-----------|
| 🔜 | More algorithm animations — heap/top-K · tries · topological sort |
| 🔜 | More Arena cases — YouTube · Uber · notification systems |
| 💡 | Community interview guides & course translations |
| 💡 | Public API for the verified jobs feed |

**Contributions welcome** — see [CONTRIBUTING.md](CONTRIBUTING.md) or grab a [`good first issue`](https://github.com/JiawenZhu/CareerVivid/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

<br/>

## 📄 License & commercial use

> [!IMPORTANT]
> CareerVivid is **source-available**: free for personal use, learning, and your own job search.
> **Commercial use requires visible attribution** — a working link to [careervivid.app](https://careervivid.app) in your product **and** README. Full terms in [LICENSE](LICENSE).

The `third_party/` directory and course source materials keep their original licenses (see `data/learning/sources.json`). System design content built on [The System Design Primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0) is attributed in-app.

<br/>

## 🏆 Competition submission

| | |
|---|---|
| **Submission branch** | [`competition-2026`](https://github.com/JiawenZhu/CareerVivid/tree/competition-2026) |
| **Eligibility marker** | [`competition-start`](https://github.com/JiawenZhu/CareerVivid/tree/competition-start) |
| **Window** | May 19, 2026 10:00 AM PDT → August 17, 2026 1:00 PM PDT |
| **Details** | [COMPETITION.md](COMPETITION.md) |

The `competition-start` annotated tag points to [`42320189`](https://github.com/JiawenZhu/CareerVivid/commit/423201899f3717876c8f3645eaaffed57c5028b8), the first qualifying commit after the competition opened. The branch preserves the repository's actual history; no timestamps or prior commits have been rewritten.

<br/>

## ⭐ Star history

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=JiawenZhu/CareerVivid&type=Date)](https://star-history.com/#JiawenZhu/CareerVivid&Date)

</div>

---

<div align="center">

<sub>

**job search** · **interview preparation** · **coding interview patterns** · **system design interview** · **AI learning courses** · **resume optimization** · **auto apply jobs** · **mock interviews** · **career development** · **tech jobs** · **AI jobs**

</sub>

<br/>

Built with ❤️ by [**Jiawen Zhu**](https://github.com/JiawenZhu) · [**careervivid.app**](https://careervivid.app)

<br/>

<img src="https://img.shields.io/badge/Learn-8f7ad9?style=for-the-badge" alt="Learn"/> <img src="https://img.shields.io/badge/→-2a2150?style=for-the-badge" alt=""/> <img src="https://img.shields.io/badge/Practice-6c5ce7?style=for-the-badge" alt="Practice"/> <img src="https://img.shields.io/badge/→-2a2150?style=for-the-badge" alt=""/> <img src="https://img.shields.io/badge/Get_hired-e8a33d?style=for-the-badge" alt="Get hired"/>

</div>
=======
Licensed under the [GNU General Public License v3.0](LICENSE).
>>>>>>> origin/main
