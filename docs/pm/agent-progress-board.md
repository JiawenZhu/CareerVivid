# CareerVivid Command Center Agent Progress Board

Last updated: 2026-05-31

This board is the source of truth for agents working on the 7-day command center sprint.

## Status Legend

- `Not Started`
- `Claimed`
- `In Progress`
- `Blocked`
- `Needs Review`
- `Done`
- `Deferred`

## Agent Protocol

Before starting:

1. Pick one task.
2. Change status to `Claimed` or `In Progress`.
3. Add your agent name, branch/worktree, and start time.
4. Keep the task scope narrow.

While working:

1. Update status when blocked or when scope changes.
2. Add concrete blockers, not vague notes.
3. Do not claim multiple unrelated tasks unless Evan explicitly asks.

Before handoff:

1. Update this board.
2. Fill out `docs/pm/agent-handoff-template.md` in your final message or linked note.
3. List tests/builds run.
4. List deploy requirement.

## Current Work Claims

| Task ID | Task | Owner | Status | Branch/Worktree | Started | Last Update | Notes |
|---|---|---|---|---|---|---|---|
| PM-001 | Create command center PM docs | Codex | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Added sprint plan, feature spec, progress board, handoff template. |
| PM-003 | Preserve CTO strategic heartbeat | Codex | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-06-01 | 2026-06-01 | Added `docs/pm/cto-strategic-heartbeat.md` as the restorable source for the 30-day revenue sprint PM/CTO heartbeat. |
| PM-004 | Heartbeat chain convention | Codex | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-06-01 | 2026-06-01 | Added `docs/pm/heartbeat-index.md`; future heartbeats should link to the immediate previous heartbeat and the root weekly strategic heartbeat. |
| PIPE-001 | Pipeline data shape audit | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Existing tracker already supports next action, due date, priority, contact, salary, work model, stage, and resume match analyses. |
| PIPE-002 | Job card next action UI | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Confirmed existing card/detail UI already shows and edits next action plus due date. |
| PIPE-003 | Today panel | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Added job tracker command-center panel for due follow-ups, high-fit jobs, interview prep, and jobs with no next action. |
| PIPE-004 | Persist selected resume on tracked jobs | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Job detail resume picker now saves resume id/title; extension transit can create jobs with selected resume context. |
| PIPE-006 | Controlled next-action picker | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Replaced free-text next action with a structured list including `No action`; no-action jobs are excluded from due prompts. |
| PIPE-007 | Job detail modal cleanup and Today next actions | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Collapsed duplicate job/direct URLs, restyled detail modal, and surfaced selected `Next:` actions in Today's plan. |
| PIPE-008 | Pipeline focus rail and compact controls | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Replaced oversized status dropdown with compact stage focus pills; filtering to one status now collapses the board to that stage. |
| PIPE-009 | Missing job-description card indicator | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Added compact amber `No description` indicators to standard and queue-manager job cards. |
| PIPE-010 | Job tracker component split | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Split JobTrackerPage, AddJobUrlModal, and CandidatePipeline into smaller components; no relevant JobTracker/pipeline files remain over 500 lines. |
| EXT-001 | Save + Analyze CTA | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Updated extension job CTA copy to `Save + analyze fit`; transit flow already exists. |
| EXT-002 | Stage selector in extension | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Verified existing stage selector and stage transit payload. |
| EXT-003 | Mark as Applied | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Verified existing Mark as Applied state and background update handler. |
| EXT-004 | Selected resume context in extension save | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Extension `CREATE_TRANSIT_DOC` now carries resume id/title and selected-resume match analysis into the tracker flow. |
| EXT-007 | Job detected details-sync state | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Extension no longer pairs `Job detected` with no-job copy; CSOD requisition pages use visible job body fallback. |
| MATCH-001 | Match result schema | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Added optional recommended action, resume angle, strong match, and experience gap fields. |
| MATCH-002 | Match result UI | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Job detail match card now renders recommended action, angle, strong matches, and gaps when available. |
| PM-002 | Growth sprint breakdown | Codex implementation | Done | `/Users/jiawenzhu/Developer/careervivid` | 2026-05-31 | 2026-05-31 | Added smaller dashboard, extension, integration, networking, lifecycle, and agency sprint lanes. |
| EMAIL-001 | Lifecycle trigger map implementation | Unassigned | Not Started |  |  |  | Implement or update triggered emails based on feature spec. |
| EMAIL-002 | Preference/frequency QA | Unassigned | Not Started |  |  |  | Confirm muted tracks suppress optional lifecycle emails. |
| EMAIL-005 | First-job-saved return loop | Unassigned | Not Started |  |  |  | Hydrate real first saved job and route to dashboard/job tracker; suppress by preferences and frequency. |
| EMAIL-006 | Saved-jobs-without-action nudge | Unassigned | Not Started |  |  |  | Send only when saved jobs exist without next action and cadence allows. |
| INT-001 | Job source integration map | Unassigned | Not Started |  |  |  | Define sourcePlatform mapping and capture confidence for supported job sources. |
| INT-002 | Import inbox for captured jobs | Unassigned | Not Started |  |  |  | Let users review captured jobs before noisy pipeline creation. |
| NET-001 | Extension outreach draft | Unassigned | Not Started |  |  |  | Draft recruiter/hiring-manager message from job, selected resume, and match angle. |
| NET-002 | Contact capture in pipeline | Unassigned | Not Started |  |  |  | Persist contact name, URL, channel, note, and follow-up on the job record. |
| SHARE-001 | Shared resume speed QA | Unassigned | Not Started |  |  |  | Check public shared resume load path and bundle impact. |
| SHARE-002 | Recruiter readiness banner QA | Unassigned | Not Started |  |  |  | Candidate toggle controls public readiness context. |
| AGENCY-001 | Agency dashboard demo polish | Unassigned | Not Started |  |  |  | Must follow agency guardrails. |
| QA-001 | End-to-end demo script verification | Unassigned | Not Started |  |  |  | Save job -> analyze -> tailor -> outreach -> prep -> share. |

## Implementation Backlog

### Pipeline

| Task ID | Priority | Task | Acceptance Criteria | Likely Files |
|---|---:|---|---|---|
| PIPE-001 | P0 | Audit current job tracker data fields | Existing fields and missing fields documented before schema change | `src/types.ts`, `src/hooks/useJobHistory.ts`, `src/pages/JobTrackerPage.tsx` |
| PIPE-002 | P0 | Add next action and follow-up date | User can set/edit next action and follow-up; card displays both | `src/components/JobTracker/JobCard.tsx`, `src/components/JobTracker/JobDetailModal.tsx` |
| PIPE-003 | P1 | Build Today panel | Panel lists overdue follow-ups, no-action jobs, high-fit jobs | `src/pages/JobTrackerPage.tsx`, `src/components/Dashboard/` |
| PIPE-004 | P1 | Add resume used to job detail | User can associate a resume and see it on job details | `src/hooks/useResumes.ts`, `src/components/JobTracker/JobDetailModal.tsx` |
| PIPE-005 | P1 | Dashboard active-search entry point | Dashboard routes active job seekers back to due actions and pipeline | `src/pages/Dashboard.tsx`, `src/components/Dashboard/` |
| PIPE-006 | P0 | Controlled next-action picker | User selects from common next actions, including `No action`; due prompts ignore no-action jobs | `src/types.ts`, `src/components/JobTracker/AddJobUrlModal.tsx`, `src/components/JobTracker/JobDetailSidebar.tsx` |
| PIPE-007 | P0 | Job detail modal URL and next-action plan polish | Duplicate job/direct URLs collapse into one field; modal matches CareerVivid UI; selected next actions appear in Today's plan | `src/components/JobTracker/JobDetailModal.tsx`, `src/components/JobTracker/JobDetailSidebar.tsx`, `src/pages/JobTrackerPage.tsx` |
| PIPE-008 | P1 | Pipeline focus navigation | User can use compact filters and click a stage pill to focus the board on one status instead of scanning every column | `src/pages/JobTrackerPage.tsx`, `src/components/JobTracker/KanbanBoard.tsx` |
| PIPE-009 | P1 | Missing job-description indicator | Pipeline cards show a small, scannable indicator when a saved job has no description | `src/components/JobTracker/JobCard.tsx`, `src/components/JobTracker/KanbanBoard.tsx` |
| PIPE-010 | P2 | Split oversized JobTracker/pipeline components | Relevant JobTracker and pipeline implementation files are under 500 lines after extraction; behavior remains covered by focused tests/build | `src/pages/JobTrackerPage.tsx`, `src/components/JobTracker/AddJobUrlModal.tsx`, `src/components/hr/CandidatePipeline.tsx` |

### Chrome Extension

| Task ID | Priority | Task | Acceptance Criteria | Likely Files |
|---|---:|---|---|---|
| EXT-001 | P0 | Rename primary action to Save + Analyze Fit | CTA is visible and saves job into tracker | `src/extension-ui/pages/ExtensionHome.tsx` |
| EXT-002 | P0 | Add stage selector | Selected stage persists to tracker | `src/extension-ui/pages/ExtensionHome.tsx`, `src/background.ts` |
| EXT-003 | P1 | Add Mark as Applied | Button updates local and remote job state | `src/extension-ui/pages/ExtensionHome.tsx`, `src/background.ts` |
| EXT-004 | P0 | Persist selected resume context | Saved job carries selected resume id/title and match analysis | `src/extension-ui/pages/ExtensionHome.tsx`, `src/background.ts`, `src/pages/JobTrackerPage.tsx` |
| EXT-005 | P1 | Salary extraction | Salary appears when detected and does not break if missing | `src/content.ts`, `src/types/autofill.types.ts` |
| EXT-006 | P1 | Draft outreach from extension | User can generate and copy a concise recruiter message | `src/extension-ui/pages/ExtensionHome.tsx`, `src/services/geminiService.ts` |
| EXT-007 | P0 | Fix detected-job missing-description state | Title/company detection shows a valid sync state; no misleading no-job warning; CSOD pages scrape visible description text | `src/extension-ui/components/MatchBreakdownCard.tsx`, `src/extension-ui/pages/ExtensionHome.tsx`, `src/content.ts` |

### Job Source Integrations

| Task ID | Priority | Task | Acceptance Criteria | Likely Files |
|---|---:|---|---|---|
| INT-001 | P1 | Source platform mapping | Supported job pages store a normalized `sourcePlatform` and confidence | `src/content.ts`, `src/background.ts`, `src/types/autofill.types.ts` |
| INT-002 | P1 | Import review inbox | Captured jobs can be reviewed before creation to avoid noisy tracker data | `src/pages/JobTrackerPage.tsx`, `src/components/JobTracker/` |
| INT-003 | P2 | Job alert import helper | User can paste job-alert email/job URLs into an import queue | `src/components/JobTracker/AddJobUrlModal.tsx` |

### Networking

| Task ID | Priority | Task | Acceptance Criteria | Likely Files |
|---|---:|---|---|---|
| NET-001 | P1 | Extension outreach draft | Draft uses job, company, selected resume angle, and strong matches | `src/extension-ui/pages/ExtensionHome.tsx`, `src/services/geminiService.ts` |
| NET-002 | P1 | Contact capture fields | Contact URL/channel/note persist and display on job cards/detail | `src/types.ts`, `src/components/JobTracker/JobDetailSidebar.tsx`, `src/components/JobTracker/JobCard.tsx` |
| NET-003 | P1 | Follow-up from copied message | Copying outreach can set next action and due date | `src/extension-ui/pages/ExtensionHome.tsx`, `src/components/JobTracker/JobDetailModal.tsx` |
| NET-004 | P2 | LinkedIn visible-page contact assist | User attaches a visible LinkedIn/contact page to a pipeline job without API dependency | `src/content.ts`, `src/extension-ui/pages/ExtensionHome.tsx`, `src/background.ts` |

### Match Score

| Task ID | Priority | Task | Acceptance Criteria | Likely Files |
|---|---:|---|---|---|
| MATCH-001 | P0 | Define match output schema | Score includes explanation and recommendation | `src/services/geminiService.ts`, `functions/src/llmGateway.ts` |
| MATCH-002 | P0 | Show honest match card | Strong matches, gaps, and next action are readable | `src/components/JobTracker/AIReportTab.tsx` |
| MATCH-003 | P1 | Use match angle in resume tailoring | CTA carries suggested angle to editor/tailor flow | `src/pages/editor/`, `src/components/JobTracker/` |

### Lifecycle Emails

| Task ID | Priority | Task | Acceptance Criteria | Likely Files |
|---|---:|---|---|---|
| EMAIL-001 | P0 | Implement first-job-saved lifecycle | Implemented: first saved job queues a real-job application-packet email, suppressible by preferences | `functions/src/emailDataBinding.ts`, `functions/src/lifecycleEmails.ts` |
| EMAIL-002 | P0 | Implement review-completed lifecycle | Implemented: resume review events queue score/suggestion email back to the real resume editor | `functions/src/emailDataBinding.ts`, `functions/src/lifecycleEmails.ts`, `src/contexts/AIReviewContext.tsx` |
| EMAIL-003 | P1 | Implement saved-jobs-inactive lifecycle | Email asks user to set next action or tailor | `functions/src/lifecycleEmails.ts` |
| EMAIL-004 | P1 | Frequency QA | Daily/weekly/muted preferences behave correctly | `functions/src/emailPolicy.ts` |
| EMAIL-005 | P1 | Dashboard follow-up digest | Sends only when due actions exist and cadence allows | `functions/src/emailDataBinding.ts`, `functions/src/lifecycleEmails.ts` |

### Shared Resume And Agency

| Task ID | Priority | Task | Acceptance Criteria | Likely Files |
|---|---:|---|---|---|
| SHARE-001 | P0 | Shared resume performance QA | In progress: public shared resume API now records recruiter-view events without blocking response speed | `src/pages/PublicResumePage.tsx`, `functions/src/publicResumeApi.ts` |
| SHARE-002 | P0 | Recruiter readiness banner QA | Banner only appears when readiness toggle is enabled | `src/pages/PublicResumePage.tsx`, `src/components/ShareResumeModal.tsx` |
| AGENCY-001 | P1 | Agency demo path polish | Agency can view progress and consent state clearly | `src/features/agency-partner/`, `functions/src/agencyPartner/` |

## Blocker Log

| Date | Task ID | Blocker | Owner | Needed Decision |
|---|---|---|---|---|
| 2026-05-31 |  |  |  |  |

## Decision Log

| Date | Decision | Reason | Owner |
|---|---|---|---|
| 2026-05-31 | The sprint focuses on command center, not new job board features | Stronger differentiation and better use of existing product assets | PM |
| 2026-05-31 | Agency work remains a recruiter trust/distribution path, not a full ATS | Keeps pilot scope sellable and prevents core product sprawl | PM |
| 2026-05-31 | First priority is extension + pipeline + shared resume | Covers acquisition, retention, and agency revenue leverage | PM |

## QA Matrix

| Area | Desktop | Mobile | Auth Required | Notes |
|---|---|---|---|---|
| Dashboard Today panel | Build passed and local route returned 200 | Responsive classes added; visual browser QA pending | Yes | Implemented in job tracker page; Playwright browser QA unavailable in this session. |
| Job tracker cards | Tests passed | Tests passed | Yes | Existing next-action card/detail behavior and actionable match UI verified by focused tests/build. |
| Chrome extension popup | Extension build passed | N/A | Extension auth | CTA copy, stage transit, Mark as Applied, and selected resume transit path verified by code/build; live extension QA still useful. |
| Networking copilot | Pending | N/A | Extension auth | Planned; not implemented. |
| Shared resume | Pending | Pending | No | Must load quickly for recruiters. |
| Resume editor | Pending | Pending | Yes | Preview controls must not overlap resume content. |
| Lifecycle email links | Pending | Mobile Gmail preview recommended | No for CTA page if public, yes for dashboard | No hash fragments for app routes. |
| Agency prep portal | Pending | Pending | Candidate auth | Consent model must remain intact. |

## Verification Log

| Date | Scope | Command | Result |
|---|---|---|---|
| 2026-05-31 | Job tracker selected-resume persistence and Today panel | `npm run test -- src/pages/JobTrackerPage.test.tsx src/components/JobTracker/JobDetailModal.test.tsx src/components/JobTracker/JobTrackerComponents.test.tsx --run` | Passed: 3 files, 9 tests |
| 2026-05-31 | Web app build | `npm run build:vite` | Passed; existing large chunk warnings remain |
| 2026-05-31 | Chrome extension build | `npm run build:extension` | Passed; existing ineffective dynamic import warnings remain |
| 2026-05-31 | Controlled next-action picker | `npm run test -- src/pages/JobTrackerPage.test.tsx src/components/JobTracker/JobDetailModal.test.tsx src/components/JobTracker/JobTrackerComponents.test.tsx --run` | Passed: 3 files, 9 tests |
| 2026-05-31 | Controlled next-action picker build | `npm run build:vite` and `npm run build:extension` | Passed; existing bundle/import warnings remain |
| 2026-05-31 | Local route smoke | `curl -I http://127.0.0.1:3002/job-tracker` | Passed: 200 OK |
| 2026-05-31 | Extension detected-job sync state and CSOD description fallback | `npm run build:extension` and `git diff --check -- src/extension-ui/components/MatchBreakdownCard.tsx src/extension-ui/pages/ExtensionHome.tsx src/content.ts` | Passed; existing ineffective dynamic import/plugin timing warnings remain |
| 2026-05-31 | Job detail modal URL cleanup and Today next-action plan | `npm run test -- src/pages/JobTrackerPage.test.tsx src/components/JobTracker/JobDetailModal.test.tsx src/components/JobTracker/JobTrackerComponents.test.tsx --run`, `npm run build:vite`, and `git diff --check -- src/components/JobTracker/JobDetailModal.tsx src/components/JobTracker/JobDetailHeader.tsx src/components/JobTracker/JobDetailSidebar.tsx src/components/JobTracker/JobDetailModalParts.tsx src/pages/JobTrackerPage.tsx` | Passed: 3 files, 9 tests; build passed with existing large chunk warnings |
| 2026-05-31 | Pipeline compact controls and focus rail | `npm run test -- src/pages/JobTrackerPage.test.tsx src/components/JobTracker/JobTrackerComponents.test.tsx --run`, `npm run build:vite`, and `git diff --check -- src/pages/JobTrackerPage.tsx src/components/JobTracker/KanbanBoard.tsx` | Passed: 2 files, 6 tests; build passed with existing large chunk warnings |
| 2026-05-31 | Missing job-description card indicator | `npm run test -- src/components/JobTracker/JobTrackerComponents.test.tsx src/pages/JobTrackerPage.test.tsx --run`, `npm run build:vite`, and `git diff --check -- src/components/JobTracker/JobCard.tsx src/components/JobTracker/KanbanBoard.tsx src/components/JobTracker/JobTrackerComponents.test.tsx docs/pm/agent-progress-board.md` | Passed: 2 files, 6 tests; build passed with existing large chunk warnings |
| 2026-05-31 | JobTracker/pipeline oversized-file refactor | `npm run test -- src/pages/JobTrackerPage.test.tsx src/components/JobTracker/JobDetailModal.test.tsx src/components/JobTracker/JobTrackerComponents.test.tsx --run`, `npm run build:vite`, relevant line-count scan, and `git diff --check -- ...` | Passed: 3 files, 9 tests; build passed with existing large chunk warnings; no relevant files over 500 lines |
