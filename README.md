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

## License

Licensed under the [GNU General Public License v3.0](LICENSE).
