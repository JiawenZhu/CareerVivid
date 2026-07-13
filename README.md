<div align="center">

# CareerVivid

**The open-source AI career workspace — job search, interview prep, and AI learning in one beautiful app.**

*Accelerate your career: learn AI hands-on, master coding & system design interviews, optimize your resume, discover verified tech jobs, and auto-apply — all in one continuous workflow.*

[**🌐 Live app → careervivid.app**](https://careervivid.app) · [Courses](https://careervivid.app/learning) · [Interview Studio](https://careervivid.app/interview-studio) · [Open Metrics](https://careervivid.app/open)

[![Website](https://img.shields.io/badge/website-careervivid.app-6c5ce7)](https://careervivid.app)
[![License](https://img.shields.io/badge/license-Source--Available%20%2B%20Attribution-blue)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)
[![Made with React](https://img.shields.io/badge/React%2018-TypeScript-61dafb)](#-tech-stack)

⭐ **If CareerVivid helps your job search, star the repo — it helps other job seekers find it.**

</div>

---

## Why CareerVivid

Job searching is fragmented: one tab for jobs, one for LeetCode, one for system design notes, one for your resume, one spreadsheet for tracking. CareerVivid unifies the entire loop — **Learn → Practice → Get hired** — so every hour you invest compounds toward an offer.

Built for new grads, career switchers, and engineers targeting **tech jobs and AI jobs**. Everything renders in a warm, animation-rich UI that makes interview preparation feel like a game, not a grind.

## ✨ Features

### 🎓 Interactive AI & interview courses — every concept animated
- **AI Agent Builder Curriculum** — 10 modules from LLM foundations to a shipped agent portfolio project: animated playgrounds (token prediction, RAG pipelines, agent loops, prompt-injection defense), quizzes, and in-browser code labs
- **Coding Interview Patterns** — sliding window, two pointers, binary search, backtracking, BFS, dynamic programming and more, each with its **own step-through animation** plus test-graded code labs
- **System Design Interview** — 13 chapters / 85 exercises: the 45-minute interview clock, consistent-hash rings, circuit breakers, feed fan-out, a **Classic Questions Arena** (Bit.ly, Twitter timeline, WhatsApp, web crawler, rate limiter, Dropbox sync), latency flashcards, capacity quick-fire drills, and spot-the-flaw games

### 🎤 Company-specific interview practice
- Interview guides for **300+ tech companies** with real-format questions
- Live AI mock interviews with voice, task briefs, live objectives, and a countdown timer
- Coding battles, a system design whiteboard with AI diagram review, and Socratic coaching

### 💼 Verified live jobs + auto-apply
- Real-time job feed pulled from **official ATS APIs** (Greenhouse, Lever, Ashby) across 160+ live company boards — no scraped spam, no dead links
- AI job matching ranked against your resume, skills, and location preferences
- **Auto-apply tooling** and a full application tracker: status pipeline, saved job descriptions, validated apply links

### 📄 Resume & career tools
- AI resume optimization tailored per job description
- Application profiles, cover letter drafting, and progress analytics with XP and levels
- Per-lesson persisted progress — return to any course and resume exactly where you left off

## 🚀 Quick start

```bash
git clone https://github.com/JiawenZhu/CareerVivid.git
cd CareerVivid
npm install
cp .env.example .env   # add your Firebase + AI provider keys
npm run dev
```

Requires Node 18+. Firebase (Auth / Firestore / Cloud Functions) powers the backend — see `.env.example` for the key list. Course content is data-driven: each course is one JSON file in `data/courses/`, and every animation is a lazy-loaded widget in the registry — adding a course or animation needs no framework changes.

## 🧱 Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · Firebase (Auth, Firestore, Cloud Functions) · Vitest — plus a data-driven course engine and widget registry.

## 🗺️ Roadmap

- More algorithm animations (heap/top-K, tries, topological sort)
- More Classic Questions Arena cases (YouTube, Uber, notification systems)
- Community-contributed interview guides and course translations
- Public API for the verified jobs feed

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) or grab a `good first issue`.

## 📄 License & commercial use

CareerVivid is **source-available**: free for personal use, learning, and your own job search.

**Commercial use requires visible attribution** — a working link to [careervivid.app](https://careervivid.app) in your product and README. Full terms in [LICENSE](LICENSE). The `third_party/` directory and course source materials keep their original licenses (see `data/learning/sources.json`; content built on [The System Design Primer](https://github.com/donnemartin/system-design-primer), CC BY 4.0, is attributed in-app).

## 🏆 Competition submission

- **Submission branch:** [`competition-2026`](https://github.com/JiawenZhu/CareerVivid/tree/competition-2026) · **Eligibility marker:** [`competition-start`](https://github.com/JiawenZhu/CareerVivid/tree/competition-start)
- **Window:** May 19, 2026 10:00 AM PDT → August 17, 2026 1:00 PM PDT · **Details:** [COMPETITION.md](COMPETITION.md)

The `competition-start` annotated tag points to [`42320189`](https://github.com/JiawenZhu/CareerVivid/commit/423201899f3717876c8f3645eaaffed57c5028b8), the first qualifying commit after the competition opened. The branch preserves the repository's actual history; no timestamps or prior commits have been rewritten.

---

<div align="center">

**CareerVivid** — job search · interview preparation · coding interview patterns · system design interview · AI learning courses · resume optimization · auto apply jobs · mock interviews · career development · tech jobs · AI jobs

Built with ❤️ by [Jiawen Zhu](https://github.com/JiawenZhu) · [careervivid.app](https://careervivid.app)

</div>
