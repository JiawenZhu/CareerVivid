# 7-Day CareerVivid Command Center Sprint

Last updated: 2026-05-31

## Sprint Thesis

CareerVivid should not become another job board. It should become a job-search operating system for people who feel stuck, laid off, underemployed, or overwhelmed by applications.

The product promise for this sprint:

> CareerVivid turns your job search into a daily action plan.

The product loop:

`Save job -> Analyze fit -> Choose resume -> Tailor -> Contact recruiter -> Set next action -> Follow up -> Prepare interview -> Track result`

## Current Product Assets We Already Have

- Resume editor and AI review.
- Resume score and suggestions.
- Public shared resume pages.
- Job tracker and dashboard.
- Chrome extension with job capture and autofill work in progress.
- Interview studio.
- Portfolio editor/public portfolio.
- Lifecycle email templates and preference gates in progress.
- Agency partner prep flow, dashboard, consent model, and docs.

The gap is not a lack of features. The gap is that the features need to feel like one connected command center.

## Sprint Outcome

By the end of 7 days, CareerVivid should have a demoable path:

1. User saves a job from the Chrome extension.
2. CareerVivid analyzes fit and recommends the next action.
3. User sees the job in a pipeline dashboard with a clear next step.
4. User tailors a resume or generates a cover letter from the job.
5. User creates a recruiter/contact message or follow-up.
6. User can prepare for an interview tied to the saved job.
7. User can share a fast recruiter-ready resume link.

## Day 1: Scope Lock And Product Map

Objective: lock the exact v1 loop and prevent scattered implementation.

Deliverables:

- Define the v1 pipeline fields:
  - job title
  - company
  - source URL
  - status
  - match score
  - match explanation
  - resume used
  - cover letter used
  - contact name
  - contact channel
  - next action
  - follow-up date
  - interview prep status
- Define the product event list:
  - `job_saved`
  - `job_stage_selected`
  - `job_match_generated`
  - `resume_tailor_started`
  - `cover_letter_created`
  - `recruiter_message_generated`
  - `recruiter_message_copied`
  - `follow_up_set`
  - `interview_prep_started`
  - `shared_resume_opened`
- Confirm which existing Firestore fields can be reused before adding new ones.
- Update `docs/pm/agent-progress-board.md` with claimed work.

Recommended owner: PM/architecture agent.

Done when:

- v1 data shape is clear.
- build order is clear.
- no agent is guessing which feature to start.

## Day 2: Pipeline Dashboard Upgrade

Objective: make the job tracker feel like a command center instead of a static board.

Build:

- `Next Action` field on each tracked job.
- `Follow-up Date` field on each tracked job.
- `Resume Used` field on each tracked job.
- Quick actions:
  - Tailor Resume
  - Generate Cover Letter
  - Find Contact
  - Prepare Interview
- Today panel:
  - follow-ups due
  - saved jobs with no next action
  - high-fit jobs not applied
  - interview prep due

Likely files:

- `src/pages/JobTrackerPage.tsx`
- `src/components/JobTracker/JobCard.tsx`
- `src/components/JobTracker/JobDetailModal.tsx`
- `src/components/JobTracker/KanbanBoard.tsx`
- `src/hooks/useJobHistory.ts`
- `src/types.ts`

Done when:

- A user can open the tracker and immediately see what to do next.
- Existing job tracker behavior still works.
- Mobile cards remain readable.

## Day 3: Chrome Extension Save And Analyze Loop

Objective: make the extension the fastest acquisition path into CareerVivid Pipeline.

Build:

- Rename the primary job action to `Save + Analyze Fit`.
- Add stage selector:
  - Wishlist
  - Applying
  - Applied
  - Interviewing
  - Offer
  - Rejected
- Add `Mark as Applied`.
- Extract salary where possible.
- Preserve job source URL.
- Push job stage and source data into the web app tracker.

Likely files:

- `src/extension-ui/pages/ExtensionHome.tsx`
- `src/extension-ui/components/MatchBreakdownCard.tsx`
- `src/background.ts`
- `src/content.ts`
- `src/types/autofill.types.ts`

Related doc:

- `docs/chrome-extension-publish/quality-upgrade-roadmap.md`
- `docs/pm/job-search-growth-sprint-breakdown.md`

Done when:

- User can save a job from a job page without copy-paste.
- Saved job appears in the pipeline with status and useful source data.
- Selected resume context carries into the saved job so match analysis and next actions are tied to the resume the user chose.

## Day 4: Honest Match Score

Objective: make match score actionable, not decorative.

Build:

- Overall fit score.
- Strong match list.
- Missing keyword list.
- Experience gap list.
- Suggested resume angle.
- Recommended action:
  - Apply now
  - Tailor first
  - Network first
  - Skip for now
- CTA: `Use this angle in resume`.

Likely files:

- `src/services/geminiService.ts`
- `src/services/geminiProxyClient.ts`
- `functions/src/geminiProxy.ts`
- `functions/src/llmGateway.ts`
- `src/components/JobTracker/AIReportTab.tsx`
- `src/components/JobTracker/AIReportActionCard.tsx`
- `src/utils/resumeScoreUtils.ts`

Done when:

- A job match result tells the user exactly why the job is or is not worth action.
- Match result is readable on mobile and desktop.

## Day 5: Daily Plan And Lifecycle Emails

Objective: bring users back with useful, preference-aware next steps.

Build:

- Daily plan card:
  - Apply to high-fit jobs.
  - Follow up with contacts.
  - Improve one resume bullet.
  - Practice one interview question.
- Product-triggered lifecycle email mapping:
  - Welcome/profile setup.
  - First resume completed.
  - First job saved.
  - Review completed.
  - Saved jobs without action.
  - Advocacy request after clear value.
- Enforce profile preferences and frequency rules.
- Keep active job seekers pointed back to dashboard/job tracker when there are saved jobs, due follow-ups, or missing next actions.

Likely files:

- `src/pages/Dashboard.tsx`
- `src/components/Dashboard/DashboardSections.tsx`
- `src/components/Dashboard/DashboardSummaryCards.tsx`
- `functions/src/emailDataBinding.ts`
- `functions/src/emailPolicy.ts`
- `functions/src/lifecycleEmails.ts`
- `functions/src/emailTemplateLibrary.ts`

Related docs:

- `docs/lifecycle-email-production-copy.md`
- `docs/lifecycle-email-template-library.md`

Done when:

- The dashboard gives a realistic next action list.
- Lifecycle emails are tied to real user state and can be suppressed by preferences.

## Day 6: Recruiter And Agency Trust Path

Objective: make shared resumes and agency review fast enough to support sales conversations.

Build:

- Keep shared resume page fast.
- Show recruiter readiness only when the candidate enables it.
- Add recruiter-facing context:
  - resume score
  - ready for review
  - last updated
  - contact CTA
- Keep agency prep dashboard focused on:
  - status
  - score lift
  - consent state
  - shared report availability

Likely files:

- `src/pages/PublicResumePage.tsx`
- `src/components/ShareResumeModal.tsx`
- `src/pages/AgencyPartnerDashboard.tsx`
- `src/pages/AgencyPreparePage.tsx`
- `src/services/agencyPartnerService.ts`
- `functions/src/agencyPartner/`

Related docs:

- `docs/agency-partnerships/agency-partnerships-overview.md`
- `docs/agency-partnerships/AGENCY_AGENT_GUARDRAILS.md`

Done when:

- Recruiter can open a shared resume and understand readiness quickly.
- Agency cannot see private resume/report details before candidate consent.

## Day 7: QA, Demo, Release Plan, Outreach

Objective: package the sprint into something sellable.

QA checklist:

- Desktop dashboard.
- Mobile dashboard.
- Resume editor preview and controls.
- Shared resume load speed.
- Extension popup.
- Job tracker stage updates.
- Email links.
- Interview studio route.
- Agency prep consent flow.

Demo script:

1. Save a job from a job posting.
2. Analyze fit.
3. See job in pipeline.
4. Tailor resume from job angle.
5. Generate recruiter message.
6. Set follow-up.
7. Start interview prep.
8. Share recruiter-ready resume.

Release checklist:

- Build passes.
- Relevant tests pass.
- Known risks documented.
- Deploy scope identified.
- Evan explicitly approves production deploy.

Outreach:

- Send pilot message to 5 local agencies or recruiters.
- Show the fast shared resume and agency readiness flow.
- Ask for one pilot branch or one recruiter feedback call.

## Priority If Time Is Limited

If only three items can ship this week:

1. Chrome extension `Save + Analyze Fit`.
2. Pipeline dashboard `Next Action`.
3. Fast recruiter-ready shared resume.

These cover acquisition, retention, and agency sales.
