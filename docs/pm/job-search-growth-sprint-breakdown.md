# CareerVivid Job Search Growth Sprint Breakdown

Last updated: 2026-05-31

This document breaks the command center work into smaller implementation sprints so agents can ship without colliding. The goal is to make CareerVivid the daily workspace for active job seekers:

`Find job -> save to pipeline -> choose resume -> analyze fit -> draft outreach -> set next action -> follow up -> prepare -> share readiness`

## Product Principles

- The dashboard is the home base for active job seekers. It should answer what to do today.
- The Chrome extension is the fastest capture path. It should save a job with the selected resume context in one flow.
- Networking is a first-class job-search action, not an afterthought. Contacts, message drafts, and follow-ups belong in the pipeline.
- Integrations should start with user-visible, permissioned capture. Avoid fragile or policy-risky private scraping.
- Lifecycle emails should bring users back to real workspace actions and respect profile preferences.

## Sprint 1: Dashboard Daily Home

Status: In progress

Objective: Make the dashboard/job tracker the place an active job seeker opens every day.

Ship:

- Today panel with due follow-ups, high-fit jobs, missing next actions, and interview prep.
- Pipeline cards that surface status, next action, due date, match score, contact, and selected resume.
- Controlled next-action list so users choose from common job-search actions instead of typing from scratch.
- Dashboard CTA back to the job tracker when the user has active jobs.
- Empty state for new users: save the first job from Chrome or paste a job URL.

Acceptance criteria:

- User can see the next 3-5 job-search actions without opening every job.
- Every plan item opens the relevant job or workflow.
- `No action` is available and does not keep reappearing as a missing next step.
- Mobile cards do not require horizontal scrolling.

Primary files:

- `src/pages/JobTrackerPage.tsx`
- `src/components/JobTracker/JobCard.tsx`
- `src/components/JobTracker/KanbanBoard.tsx`
- `src/components/JobTracker/JobDetailModal.tsx`
- `src/components/Dashboard/DashboardSections.tsx`

## Sprint 2: Chrome Save With Selected Resume

Status: In progress

Objective: Make extension capture save the job together with the resume the user selected.

Ship:

- `Save + analyze fit` CTA.
- Stage selector before saving.
- Selected resume id and title carried into the pipeline.
- Match analysis saved against the selected resume when available.
- Mark as Applied flow for application pages.

Acceptance criteria:

- A job saved from Chrome opens in CareerVivid Pipeline with job metadata, stage, source URL, selected resume, and match result when available.
- If auth/token transit fails, fallback URL transit still carries enough job and resume context.
- The job detail resume picker persists changes back to the job record.

Primary files:

- `src/extension-ui/pages/ExtensionHome.tsx`
- `src/extension-ui/components/MatchBreakdownCard.tsx`
- `src/background.ts`
- `src/pages/JobTrackerPage.tsx`
- `src/components/JobTracker/AddJobUrlModal.tsx`
- `src/components/JobTracker/JobDetailSidebar.tsx`
- `src/types.ts`

## Sprint 3: Job Source Integrations

Status: Not started

Objective: Help users find and save jobs from the places they already search.

Phase 1 sources:

- Chrome extension capture on LinkedIn, Indeed, Greenhouse, Lever, Ashby, Workday, SmartRecruiters, Workable, BambooHR, and company career pages.
- Manual job URL import in the web app.
- Job alert email copy/paste or URL import helper.
- Dashboard import inbox for captured jobs that need review.

Phase 2 sources:

- Gmail job alert parser only if permission and privacy model are clear.
- Google Search or Google Jobs handoff through user-visible extension capture.
- ATS-specific apply-state detection after a user submits an application.

Acceptance criteria:

- Every source stores `sourceUrl` or `jobPostURL`, `sourcePlatform`, title, company, description when available, and capture confidence.
- The user always reviews before CareerVivid creates noisy pipeline entries.
- No integration requires private credentials or hidden scraping without a clear user permission model.

Primary files:

- `src/content.ts`
- `src/background.ts`
- `src/types/autofill.types.ts`
- `src/components/JobTracker/AddJobUrlModal.tsx`
- `src/services/trackingService.ts`

## Sprint 4: Networking Copilot

Status: Not started

Objective: Turn networking into a quick action inside the extension and pipeline.

Ship:

- Chrome extension action: `Draft outreach`.
- Message draft uses job title, company, selected resume angle, and user's profile.
- LinkedIn/contact v1 is extension-assisted: user finds a recruiter, job poster, product manager, or hiring manager in the browser, then CareerVivid drafts the message and saves the contact.
- Contact capture fields:
  - contact name
  - contact URL
  - channel: LinkedIn, email, referral, agency, other
  - relationship note
- Pipeline quick action: set follow-up after copying a message.
- Track generated/copied/sent events.

Acceptance criteria:

- User can draft a recruiter or hiring-manager message in under 30 seconds.
- The draft avoids spammy language and stays concise.
- Contact and follow-up are saved to the same job record.
- The message can be regenerated from a different resume angle.
- No v1 dependency on LinkedIn API approval or hidden platform scraping.

Primary files:

- `src/extension-ui/pages/ExtensionHome.tsx`
- `src/extension-ui/components/MatchBreakdownCard.tsx`
- `src/components/JobTracker/JobDetailSidebar.tsx`
- `src/services/geminiService.ts`
- `functions/src/llmGateway.ts`
- `src/types.ts`

## Sprint 5: Lifecycle Return Loops

Status: Not started

Objective: Bring users back to the dashboard with useful, preference-aware job-search actions.

Ship:

- First job saved email: open dashboard/job tracker and analyze or set next action.
- Saved jobs without action email: set next action, tailor resume, or draft outreach.
- Follow-up due digest: only when due actions exist and frequency allows.
- Review completed email: return to real resume editor and suggestions.

Acceptance criteria:

- Every optional lifecycle email runs through preference and frequency checks.
- CTA routes use `https://careervivid.app/` canonical paths.
- Emails use real user data from resumes, job tracker, and practice history.
- Notification settings confirmation remains a settings-change confirmation, not a daily-frequency send.

Primary files:

- `functions/src/emailDataBinding.ts`
- `functions/src/emailPolicy.ts`
- `functions/src/lifecycleEmails.ts`
- `functions/src/emailTemplateLibrary.ts`
- `docs/lifecycle-email-production-copy.md`

## Sprint 6: Agency And Recruiter Speed

Status: In progress

Objective: Make shared candidate review fast and trustworthy for agencies and recruiters.

Ship:

- Fast shared resume route for public recruiter links.
- Recruiter readiness only when the candidate enables it.
- Agency prep session status that never exposes private details before consent.
- Agency pilot demo branch and tracker kept current.

Acceptance criteria:

- Shared resume opens quickly on desktop and mobile.
- Recruiter sees readiness context without editor-only controls.
- Candidate controls public access and readiness.
- Agency work stays inside the agency guardrails unless a core change is explicitly approved.

Primary files:

- `src/pages/PublicResumePage.tsx`
- `src/components/ShareResumeModal.tsx`
- `functions/src/publicResumeApi.ts`
- `src/features/agency-partner/`
- `functions/src/agencyPartner/`

## Agent Split

| Lane | Owner Type | Scope |
|---|---|---|
| PM strategy | Senior PM agent | Sprint framing, packaging, pricing, sales story, acceptance criteria |
| Core implementation | Codex implementation | Job tracker, dashboard, extension, shared resume, QA |
| Lifecycle marketing | Email agent | Trigger map, templates, preference gates, demo sends |
| Agency pilot | Agency agent | Agency guardrailed files only |
| QA/release | Release agent | Build, tests, screenshots, deploy scope, rollback notes |

## This Week's Narrow Shipping Order

1. Finish selected-resume extension save and pipeline persistence.
2. QA job tracker Today panel and job detail resume persistence.
3. Build networking draft task spec and first UI skeleton.
4. Implement first-job-saved lifecycle email only after preference gates are verified.
5. Run shared resume speed QA before any agency outreach demo.

## Tracking Rules

- Claim work in `docs/pm/agent-progress-board.md` before editing.
- Keep one task per branch or worktree where possible.
- Update status after every implementation or handoff.
- Record build/test commands in the board and final handoff.
- Do not deploy production without Evan's explicit approval.
