# CareerVivid 30-Day Revenue Sprint

Start date: 2026-05-25
Target: $2,000 revenue in 30 days
Current week: Week 1, updated 2026-05-31

## Sprint North Star

CareerVivid needs one revenue story that is easy to demo and easy to sell:

> CareerVivid turns a scattered job search into a daily action plan, then gives candidates and recruiters a fast, trustworthy way to review readiness.

The sprint is not about adding disconnected features. The sprint is about tightening the path from acquisition to paid value:

`Chrome extension/job capture -> command center -> resume improvement -> cover letter/interview prep -> fast shared resume -> recruiter or agency trust`

## Operating Rules

- Code, local tools, analysis, and draft content can move without additional approval.
- Ask before production deploys, pricing changes, public posts, paid spend, customer outreach, destructive data changes, or final app/store submissions.
- Treat Stripe, Firebase, feedback, errors, and conversion data as the daily source of truth.
- Keep work reviewable. Do not let the 30-day sprint become a broad rewrite.
- Every weekly update should record shipped work, local-only work, blocked work, revenue impact, and the next 1-3 highest-ROI actions.

## Baseline From 2026-05-25

- Stripe live balance: $0 available, $0 pending.
- Stripe subscriptions: 1 total subscription found, currently canceled.
- Recent Stripe payments found: $1.99, $1.99, and $2.99.
- Active products include Pro, Pro Max, Enterprise, Download Once, and NFC card products.
- Firestore users: 19.
- New users in last 30 days: 1.
- Users with AI credits used in 2026-05: 3.
- User plans: 7 `pro_monthly`, 7 `free`, 5 unknown.
- Subscription statuses: 5 active, 1 canceled, 13 unknown.
- Feedback records: 19, mostly empty 5-star ratings.
- Error reports: 139, with repeated AI proxy and model/request-format failures.

## Immediate Revenue Priorities

1. Fix repeated AI proxy errors that can block resume, portfolio, and whiteboard value moments.
2. Improve feedback capture so ratings require a useful comment when rating is low or when the source is a revenue-critical flow.
3. Audit the subscription page and upgrade prompts against the actual Stripe products and prices.
4. Convert the Chrome extension launch into an acquisition loop with a clear landing page and first-run onboarding.
5. Create a daily PM snapshot from Firebase plus Stripe to track users, credit usage, feedback, errors, and paid conversion.

## Week 1 Progress Snapshot, 2026-05-25 To 2026-05-31

### Implemented Or Substantially Built

- Agency partnership pilot surface:
  - Public agency partner route: `/partners/agency`.
  - Agency partner application support.
  - Admin approval support for agency applications.
  - Agency dashboard route: `/agency-partner/dashboard`.
  - Candidate prep portal route: `/prepare/{agencySlug}`.
  - Demo branch and demo candidate data documented for sales conversations.
  - Guardrails added so other agents keep agency work isolated from core CareerVivid code.
- Candidate-controlled recruiter readiness:
  - Resume share modal now supports a `Ready for recruiter review` toggle after public access is enabled.
  - Public resume page can show recruiter-facing readiness only when the candidate opts in.
  - Share button remains available when `Review Feedback` exists, instead of being replaced by the feedback action.
- Shared resume performance path:
  - Public resume API path added for fast public resume fetches.
  - Firebase Hosting rewrite points `/api/publicResume` to `publicResumeApi`.
  - Shared resume loading was optimized for recruiter-facing access and mobile readability work.
- Lifecycle email foundation:
  - Production lifecycle email copy and template library docs were added.
  - Email preference logic now includes category, track, disabled category, disabled track, unsubscribe, and frequency checks.
  - Notification settings confirmation email is queued after preference updates.
  - Resume performance milestone email path was added for score-based re-engagement.
  - Interview email URL helper was corrected toward canonical app routes instead of hash-fragment deep links.
- 7-day Command Center sprint planning:
  - Added sprint plan, feature spec, progress board, and handoff template under `docs/pm/`.
  - Defined the connected loop: save job, analyze fit, choose resume, tailor, contact recruiter, follow up, prepare interview, track result.
- Performance and mobile polish in progress:
  - Resume templates are moving toward lazy-loaded chunks.
  - Shared resume and public portfolio loading paths were reviewed for smaller first loads.
  - Resume editor preview controls were adjusted for mobile and desktop so zoom controls do not cover the resume content.
- Extension and job-search workflow improvements in progress:
  - Chrome extension UI, capture, autofill adapters, background flow, and tests have active changes.
  - Job tracker, dashboard, match breakdown, and application workflow files have active changes toward the command center flow.

### Shipped Or Deployment Status

- Agency frontend changes were documented as deployed to Firebase Hosting on 2026-05-30.
- Current repo contains additional local changes that still need scoped review, build verification, and explicit deploy approval before production release.
- Cloud Functions should only be redeployed when function changes are intentionally included in the release scope.

### New Operating Assets

- `docs/pm/README.md`
- `docs/pm/7-day-command-center-sprint.md`
- `docs/pm/command-center-feature-spec.md`
- `docs/pm/agent-progress-board.md`
- `docs/pm/agent-handoff-template.md`
- `docs/agency-partnerships/agency-partnerships-overview.md`
- `docs/agency-partnerships/AGENCY_AGENT_GUARDRAILS.md`
- `docs/agency-partnerships/agency_partner_functionality_tracker.xlsx`
- `docs/agency-partnerships/agency_partner_pipeline_tracker.xlsx`
- `docs/lifecycle-email-production-copy.md`
- `docs/lifecycle-email-template-library.md`

## Current Revenue Thesis

The highest-probability revenue path is a focused agency/recruiter pilot plus individual user activation:

1. Agencies need speed and trust. Fast shared resumes, candidate readiness, and prep progress are easier to sell than a full ATS replacement.
2. Job seekers need a daily action plan. The command center can convert existing features into a paid workflow.
3. Lifecycle emails should bring users back only when the message is tied to real workspace progress and profile preferences allow it.

## Active Revenue Workstreams

| Workstream | Revenue Goal | Current State | Next Action |
|---|---|---|---|
| Agency partner pilot | Get first agency pilot or recruiter feedback call | Demo flow and guardrails exist; pipeline tracker exists | Use demo branch in outreach and record every agency conversation |
| Shared resume speed | Build recruiter trust and reduce drop-off | API and page optimizations in progress | QA public shared resume on desktop/mobile and deploy scoped hosting changes |
| Command center | Improve activation and retention | Sprint docs and active code changes exist | Ship `Save + Analyze Fit`, next action, and follow-up fields |
| Lifecycle email | Increase return visits and feature adoption | Templates, preference checks, settings confirmation, and resume milestone path exist | Add first-job-saved and review-completed trigger QA |
| Subscription and pricing | Convert active users | Baseline Stripe audit exists | Verify pricing page, upgrade modal, and Stripe product mapping |
| AI reliability | Protect paid value moments | AI proxy, LLM gateway, Gemini proxy, and credit paths have active changes | Run focused function tests/build and deploy only intentional fixes |

## Active 7-Day Product Sprint

The active product sprint is the CareerVivid Job Search Command Center:

- Sprint plan: `docs/pm/7-day-command-center-sprint.md`
- Feature spec: `docs/pm/command-center-feature-spec.md`
- Sprint breakdown: `docs/pm/job-search-growth-sprint-breakdown.md`
- Agent progress board: `docs/pm/agent-progress-board.md`
- Handoff template: `docs/pm/agent-handoff-template.md`

This sprint connects existing CareerVivid assets into one revenue-facing loop:

`Save job -> Analyze fit -> Choose resume -> Tailor -> Contact recruiter -> Set next action -> Follow up -> Prepare interview -> Track result`

### 7-Day Sprint Upgrade

The original sprint structure is good, but execution should stay narrower:

1. P0: make the Chrome extension save a job into the tracker with enough source data to analyze.
2. P0: make the job tracker show the next action and follow-up date.
3. P0: make shared resume links fast and recruiter-readable on mobile and desktop.
4. P1: add honest match explanations and a suggested resume angle.
5. P1: add lifecycle emails only after preference and frequency behavior is verified.

If time is limited, skip broad dashboard redesign and ship the three P0 items first.

## Feature Ledger

| Feature Area | Implemented / In Progress | Revenue Purpose | Open Risk |
|---|---|---|---|
| Agency partner docs and guardrails | Implemented | Allows other agents to build agency sales workflow without touching core product | Needs outreach execution |
| Agency dashboard and prep portal | Implemented/in progress | Demoable B2B pilot path | Needs consent QA and pilot metrics |
| Recruiter readiness toggle | Implemented/in progress | Lets candidates decide when recruiters see readiness | Needs public-page QA before broad release |
| Public shared resume API | Implemented/in progress | Faster recruiter review | Needs production load verification |
| Resume editor preview responsiveness | In progress | Reduces editor friction and improves mobile trust | Needs desktop/mobile visual QA |
| Portfolio responsiveness/performance | In progress | Improves public credibility | Needs targeted QA |
| Lifecycle email preference gates | Implemented/in progress | Prevents unwanted emails and protects trust | Needs function build and end-to-end queue QA |
| Resume score milestone email | Implemented/in progress | Re-engages users from real progress data | Needs cadence and duplicate-send QA |
| Notification settings confirmation | Implemented/in progress | Builds trust around email controls | Must send once per settings update debounce, not by digest cadence |
| Interview deep-link route cleanup | Implemented/in progress | Fixes broken practice email CTA | Needs live route verification after deploy |
| Chrome extension command center loop | In progress | Acquisition and activation | Needs scoped release and Chrome QA |
| Job tracker next-action workflow | In progress | Retention and daily use | Needs data shape audit |
| AI proxy and LLM reliability | In progress | Protects core paid features | Needs focused release scope |

## Daily Snapshot Command

Run from the repo root:

```bash
node scripts/pm-firebase-snapshot.mjs
```

The script uses local Google Application Default Credentials and performs read-only Firestore aggregation.

## Weekly Maintenance Cadence

Every week, update this file with:

1. New Stripe/Firebase snapshot if credentials are available.
2. Features shipped to production.
3. Features implemented locally but not deployed.
4. Highest-ROI next 1-3 actions.
5. Blockers that require Evan's decision.
6. Any broken user-facing flows found in QA.
7. Whether Cloud Functions, Hosting, Firestore rules, Chrome extension, or no deploy is required.

Weekly update day: Sunday morning.

## Next 7 Days, Recommended Execution Order

1. Finish and QA the fast shared resume path.
   - Desktop and mobile public shared resume.
   - Recruiter readiness banner only when enabled.
   - No private resume exposure before candidate consent.
2. Finish the minimum command center loop.
   - Save job.
   - Analyze fit.
   - Show next action.
   - Set follow-up.
   - Connect to resume tailor or cover letter.
3. Finish lifecycle email QA.
   - Welcome/profile setup.
   - First resume completed.
   - Review completed.
   - First job saved.
   - Preferences and frequency suppression.
4. Prepare agency outreach.
   - Use the demo branch.
   - Track every agency in the pipeline workbook.
   - Ask for one pilot branch or one recruiter feedback call.

## Current Blockers And Decisions Needed

- Decide whether the first paid pilot offer is agency branch prep, individual Pro upgrade, or both.
- Decide whether to deploy the current shared resume/editor performance work as a scoped hosting release.
- Decide whether Cloud Functions changes are ready for a scoped deploy or should remain local until email/API QA is complete.
- Keep the repo organized before broad release; the current workspace has many active changes across core, extension, agency, email, and portfolio areas.
