# CareerVivid Command Center Feature Spec

Last updated: 2026-05-31

## Product Positioning

CareerVivid is a job-search operating system.

The command center should help users answer:

- What should I apply to?
- How do I stand out?
- Who should I contact?
- What should I do today?

## Primary User

Overwhelmed job seeker who is applying to multiple roles, using multiple resume versions, and losing track of follow-ups, saved jobs, interviews, and recruiter contacts.

Secondary users:

- Recent graduates.
- Laid-off workers.
- Career changers.
- International students.
- Local candidates working with agencies.
- Recruiters reviewing candidate readiness links.

## V1 Product Loop

1. Save a job.
2. Analyze job fit.
3. Select the best resume or tailor a new version.
4. Generate application material.
5. Find or add a contact.
6. Set the next action and follow-up date.
7. Prepare for interview.
8. Share resume or readiness page when appropriate.
9. Track the result.

## Core Data Model

Extend tracked job records carefully. Reuse existing fields where possible.

Recommended tracked job fields:

| Field | Type | Purpose |
|---|---|---|
| `id` | string | Stable job record id |
| `title` | string | Job title |
| `company` | string | Employer name |
| `location` | string | Location or remote status |
| `salary` | string | Extracted salary text when available |
| `sourceUrl` | string | Original job posting |
| `sourcePlatform` | string | linkedin, indeed, greenhouse, lever, workday, company_site, manual |
| `status` | string | wishlist, applying, applied, interviewing, offer, rejected |
| `matchScore` | number | 0-100 fit score |
| `matchSummary` | string | Short explanation |
| `strongMatches` | string[] | Skills/experience already aligned |
| `missingKeywords` | string[] | Keywords missing from resume/profile |
| `experienceGaps` | string[] | Practical gaps or weaker evidence |
| `suggestedResumeAngle` | string | Recommended positioning for this role |
| `recommendedAction` | string | apply_now, tailor_first, network_first, skip_for_now |
| `resumeId` | string | Resume selected or used |
| `resumeTitle` | string | Resume display name |
| `coverLetterId` | string | Generated/attached cover letter |
| `contactName` | string | Recruiter/hiring manager/contact |
| `contactUrl` | string | LinkedIn, email, company profile |
| `contactChannel` | string | linkedin, email, referral, agency, other |
| `nextAction` | string enum | User-facing next step from a controlled action list, including `No action` |
| `followUpAt` | timestamp | Follow-up reminder |
| `interviewPrepStatus` | string | not_started, generated, practiced, completed |
| `createdAt` | timestamp | Created time |
| `updatedAt` | timestamp | Last update |

## Feature A: Pipeline Dashboard

### User Story

As a job seeker, I want one dashboard that shows each job, its status, the resume I used, and the next action, so I know what to do today.

### Requirements

- Jobs are grouped by stage.
- Each job card shows:
  - title
  - company
  - status
  - match score if available
  - next action
  - follow-up date if available
  - resume used if available
- Job detail view allows editing:
  - status
  - next action from a select list
  - follow-up date
  - contact
  - resume used
- Dashboard includes a Today panel:
  - follow-ups due
  - high-fit saved jobs not applied
  - jobs missing next action
  - interview prep due

### Acceptance Criteria

- User can update a job's next action without opening a separate admin page.
- User can choose `No action` when a tracked job should not appear in action prompts.
- User can set or clear a follow-up date.
- User can associate a resume with a job.
- Mobile view uses compact cards without horizontal overflow.
- Existing Kanban behavior still works.

### Likely Files

- `src/pages/JobTrackerPage.tsx`
- `src/components/JobTracker/JobCard.tsx`
- `src/components/JobTracker/JobDetailModal.tsx`
- `src/components/JobTracker/KanbanBoard.tsx`
- `src/hooks/useJobHistory.ts`
- `src/types.ts`

## Feature B: Chrome Extension Save + Analyze

### User Story

As a job seeker browsing job pages, I want to save and analyze a role in one click, so I do not have to copy and paste job descriptions manually.

### Requirements

- Primary CTA says `Save + Analyze Fit`.
- On save, user can choose stage:
  - Wishlist
  - Applying
  - Applied
  - Interviewing
  - Offer
  - Rejected
- Job extraction captures:
  - title
  - company
  - location
  - salary if visible
  - source URL
  - job description
- Extension sends job to the web app tracker.
- If match analysis is available, the job card stores fit output.
- Extension carries the selected resume id and title into the saved job.
- If match analysis was generated for that selected resume, it is persisted under that resume id.

### Acceptance Criteria

- User can save a job from the extension without opening the dashboard.
- The stage selected in the extension appears in the web app tracker.
- Salary is shown when extracted, but the flow still works without salary.
- `Mark as Applied` works for application pages and manually filled applications.
- Job detail opens with the selected resume preselected when a job was saved from the extension.

### Likely Files

- `src/extension-ui/pages/ExtensionHome.tsx`
- `src/extension-ui/components/MatchBreakdownCard.tsx`
- `src/background.ts`
- `src/content.ts`
- `src/types/autofill.types.ts`

## Feature C: Honest Match Score

### User Story

As a job seeker, I want to understand why I match or do not match a job, so I can decide whether to apply, tailor, network, or skip.

### Requirements

Match analysis must include:

- overall score
- strong matches
- missing keywords
- experience gaps
- suggested resume angle
- recommended action

Recommended actions:

- `Apply now`
- `Tailor first`
- `Network first`
- `Skip for now`

### Acceptance Criteria

- The user can understand the recommendation without reading the entire job description.
- The explanation does not overpromise an interview or ATS success.
- The output points to a next action.
- The match result can be reused by resume tailoring and lifecycle emails.

### Likely Files

- `src/services/geminiService.ts`
- `src/services/geminiProxyClient.ts`
- `functions/src/geminiProxy.ts`
- `functions/src/llmGateway.ts`
- `src/components/JobTracker/AIReportTab.tsx`
- `src/components/JobTracker/AIReportActionCard.tsx`

## Feature C2: Networking Copilot

### User Story

As a job seeker, I want to quickly draft a recruiter or hiring-manager message from the job and my selected resume angle, so networking becomes part of my pipeline instead of a separate task.

### Requirements

- Chrome extension has a `Draft outreach` action when a job is detected.
- First version should work from visible browser context, especially LinkedIn profiles and job pages, before deeper platform integrations.
- Draft can use:
  - job title
  - company
  - selected resume title
  - suggested resume angle
  - strong matches
- User can save contact metadata:
  - contact name
  - contact URL
  - channel
  - relationship note
- Contact discovery should begin as user-directed capture from LinkedIn or other visible pages. Do not require LinkedIn API access for v1.
- User can copy the message and set a follow-up date.
- Pipeline shows contact and next action on the same job.

### Acceptance Criteria

- Draft is concise, professional, and editable before the user sends it.
- Contact fields persist to the job tracker.
- Copying a message can create or update the next action.
- No message claims the user has a referral or relationship unless the user provided it.

### Likely Files

- `src/extension-ui/pages/ExtensionHome.tsx`
- `src/extension-ui/components/MatchBreakdownCard.tsx`
- `src/components/JobTracker/JobDetailSidebar.tsx`
- `src/services/geminiService.ts`
- `functions/src/llmGateway.ts`
- `src/types.ts`

### Platform Direction

Start with the Chrome extension because it can assist users where they already search:

- On a job page, draft a recruiter or hiring-manager message from the job and selected resume.
- On a LinkedIn profile or company people page, let the user attach the visible contact to an existing pipeline job.
- Store the selected contact URL/channel in CareerVivid, then set a follow-up action.

Deeper integrations with LinkedIn, job boards, or CRM-style contact search should be evaluated after the manual extension-assisted flow proves useful.

## Feature D: Daily Job Search Plan

### User Story

As an overwhelmed job seeker, I want CareerVivid to tell me what to do today, so I can make progress without deciding everything from scratch.

### Requirements

Daily plan should prioritize:

1. Follow-ups due today or overdue.
2. High-match jobs not applied.
3. Saved jobs with no next action.
4. Jobs with interviews or prep due.
5. Resume improvements tied to active jobs.

Example plan:

- Apply to 2 high-fit jobs.
- Follow up with 1 recruiter.
- Improve 1 resume bullet.
- Practice 1 interview question.

### Acceptance Criteria

- Plan uses real user workspace data.
- Empty state gives one useful starter action.
- Plan does not create fake urgency.
- User can jump from a plan item to the relevant page.

### Likely Files

- `src/pages/Dashboard.tsx`
- `src/components/Dashboard/DashboardSections.tsx`
- `src/components/Dashboard/DashboardSummaryCards.tsx`
- `src/hooks/useJobHistory.ts`
- `src/hooks/useResumes.ts`

## Feature E: Lifecycle Email Activation

### User Story

As a user, I want helpful reminders based on my actual workspace progress, so I return to useful next actions instead of generic marketing.

### Email Triggers

| Email | Trigger | Primary CTA | Goal |
|---|---|---|---|
| Welcome setup | Account created, no profile/resume activity | Initialize profile | `profile_initialized` |
| First resume completed | Resume reaches usable completion | Tailor for a job | `resume_tailor_started` |
| First job saved | First tracked job created | Analyze fit | `job_match_generated` |
| Review completed | AI review finishes | View suggestions | `resume_suggestion_viewed` |
| Saved jobs inactive | Jobs saved but no action | Create next action | `job_next_action_set` |
| Interview prep | Interviewing stage or prep signal | Start interview prep | `interview_prep_started` |
| Advocacy | User has completed clear value moment | Share feedback | `feedback_submitted` |

### Requirements

- Hydrate user data from Firestore.
- Respect `emailPreferences`.
- Respect lifecycle unsubscribe.
- Respect frequency preferences.
- Include active production routes.
- Use one primary CTA.

### Acceptance Criteria

- No lifecycle email sends when the user's preferences suppress the category or track.
- Email route opens a valid production page.
- Demo sends are marked as demo.
- Mail queue documents include category and lifecycle metadata.

### Likely Files

- `functions/src/emailDataBinding.ts`
- `functions/src/emailPolicy.ts`
- `functions/src/lifecycleEmails.ts`
- `functions/src/emailTemplateLibrary.ts`
- `functions/src/emailTemplates.ts`

## Feature F: Recruiter-Ready Shared Resume

### User Story

As a recruiter or agency partner, I want to open a candidate resume quickly and see readiness context, so I can decide whether to contact the candidate.

### Requirements

- Shared resume page loads quickly.
- Readiness banner appears only when candidate toggles readiness.
- Show:
  - candidate name
  - target title
  - resume score
  - ready for recruiter review
  - last updated
  - contact CTA when allowed
- Keep candidate-controlled sharing.

### Acceptance Criteria

- Recruiter can open a shared resume without signing in.
- Agency dashboard does not expose private resume/report details before candidate consent.
- Shared resume remains readable on mobile.
- Public page avoids editor-only controls.

### Likely Files

- `src/pages/PublicResumePage.tsx`
- `src/components/ShareResumeModal.tsx`
- `functions/src/publicResumeApi.ts`
- `functions/src/index.ts`
- `src/pages/AgencyPartnerDashboard.tsx`
- `src/pages/AgencyPreparePage.tsx`
- `src/services/agencyPartnerService.ts`

## Analytics Events

Recommended events:

| Event | When |
|---|---|
| `job_saved` | Job is created from extension or web app |
| `job_stage_selected` | User chooses or changes pipeline stage |
| `job_match_generated` | Match analysis completes |
| `job_next_action_set` | User sets next action |
| `follow_up_set` | User sets follow-up date |
| `resume_used_for_job` | User associates resume with job |
| `resume_tailor_started` | Tailoring starts from job context |
| `cover_letter_created` | Cover letter generated from job |
| `recruiter_message_generated` | Outreach message generated |
| `interview_prep_started` | User starts prep tied to job |
| `shared_resume_opened` | Public resume page loads |
| `ready_for_recruiter_enabled` | User toggles readiness |

## Quality Bar

- No generic `/editor` lifecycle links.
- No hash-fragment interview links.
- No shared resume content exposed before permission allows it.
- No overlapping preview controls on desktop or mobile.
- No dashboard cards that require horizontal scroll on mobile.
- No fake urgency in lifecycle email copy.
- No production deploy without explicit approval.
