# CareerVivid Competition Evaluator Guide

## Submission Record

| Item | Evidence |
| --- | --- |
| Submission branch | [`competition-2026`](https://github.com/JiawenZhu/CareerVivid/tree/competition-2026) |
| Eligibility tag | [`competition-start`](https://github.com/JiawenZhu/CareerVivid/tree/competition-start) |
| First qualifying commit | [`42320189`](https://github.com/JiawenZhu/CareerVivid/commit/423201899f3717876c8f3645eaaffed57c5028b8) |
| Competition window | May 19, 2026 at 10:00 AM PDT to August 17, 2026 at 1:00 PM PDT |
| Live product | [careervivid.app](https://careervivid.app) |

`competition-start` is an annotated tag pointing to the first commit after the
competition opened. The repository preserves its real history and does not
rewrite timestamps or earlier commits.

## Reviewer Path

Use the following path to evaluate the integrated product workflow:

1. Open the **Dashboard** to see the candidate's selected resume, target role,
   readiness, and recommended next action.
2. Open **Jobs** to inspect an explainable match against that target resume,
   including evidence, gaps, location preference, and an apply action.
3. Open **Interview Studio**, choose a company, and enter a **Company Quest**.
4. Run a recruiter, coding, or system-design stage. Observe the task brief,
   coaching, saved progress, and review/report surface.
5. Open **Course** and resume an unfinished lesson. Interactive lessons expose
   meaningful inputs and deterministic state transitions rather than static
   diagrams.

The visual evidence for each step is documented in the [README](README.md).

## Submission Scope

### Career workflow

- Resume and application-profile selection
- Explainable, resume-grounded job recommendations
- Job tracking, target companies, validated application links, and tailoring
- Candidate readiness and next-action guidance

### Interview workflow

- Company-specific interview guides and staged practice
- Adaptive voice interview sessions with captured transcripts
- Coding workspace with tests and coaching
- System-design whiteboard with architecture review and coaching
- Persisted reports with strength and improvement guidance

### Learning workflow

- AI Agent Builder Curriculum with interactive LLM and RAG playgrounds
- Coding Interview Patterns with visual pattern exploration and code practice
- System Design Interview with simulation-led design exercises and a separate
  course-owned mock session
- Per-lesson progress persistence and direct resume behavior

## Implementation Evidence

| Concern | Source location |
| --- | --- |
| Course definitions | `data/courses/` |
| Course resume routing | `src/pages/CourseResumePage.tsx` |
| Course simulations | `src/components/CourseWidgets/` |
| Company Quest content | `src/lib/companyQuests.ts` |
| Coding and system-design practice | `src/components/Quest/` |
| Course-owned system-design results | `src/pages/SystemDesignCoursePracticePage.tsx` |
| Job match scoring | `src/utils/jobMatchScoring.ts` |
| Job ingestion and validation | `functions/` |

## Reproducible Verification

```bash
git clone --branch competition-2026 https://github.com/JiawenZhu/CareerVivid.git
cd CareerVivid
npm ci
npm test -- --run src/lib/interactiveCourses.test.ts src/lib/codingInterviewRoadmap.test.ts src/lib/learningSeo.test.ts src/lib/systemDesignQuestionBank.test.ts
npm run build:vite
```

The focused test suite validates course definitions, widget registration,
deterministic system-design state transitions, question-bank contracts, and the
experience-roadmap mapping. The Vite build verifies that the production bundle
can be generated from this branch.
