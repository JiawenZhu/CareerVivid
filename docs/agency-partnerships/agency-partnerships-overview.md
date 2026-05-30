# CareerVivid Agency Partnerships

Last updated: 2026-05-30

## Purpose

CareerVivid's agency partnership product is a candidate preparation layer for staffing agencies. It is not an ATS replacement and not a candidate marketplace. The first product goal is to help a local branch prepare the candidates it already receives, so recruiters spend less time fixing resumes and more time placing qualified people.

The pilot flow is:

1. Agency applies for a partner pilot.
2. Admin approves the agency application.
3. CareerVivid creates an agency branch profile and invite link.
4. Agency sends candidates to the branch prep portal.
5. Candidate signs in, selects or creates a resume, runs resume improvement/review, and downloads the final PDF.
6. Agency sees progress metrics before consent.
7. Candidate explicitly shares readiness before the agency can open the resume/report.

## Positioning

Primary message:

> CareerVivid helps staffing branches prepare applicants before recruiters spend manual time cleaning up resumes.

Pilot message:

> Start with a 14-day, zero-integration branch pilot for 10-20 candidates. Recruiters give candidates a prep link, candidates improve their resume score, and the branch sees readiness progress without changing its ATS.

What to avoid:

- Do not position this as "we give agencies candidates."
- Do not imply CareerVivid replaces the agency's ATS.
- Do not expose full candidate resumes before candidate consent.
- Do not lead with future API integrations during the first pilot conversation.

## Implemented Product Surface

### Public Agency Partner Page

- Route: `/partners/agency`
- File: `src/pages/partners/AgencyPartnerPage.tsx`
- Purpose: Agency-focused landing page for staffing branches.
- Current offer: 14-day pilot, branch prep link, no ATS integration, candidate-controlled sharing.
- Application CTA: `/partners/apply?type=agency`
- SEO: canonical agency URL, software application schema, staffing-agency keywords.

### Partner Application Flow

- Agency applications use `type: "agency"`.
- Existing partner application flow remains compatible with `academic`, `business`, `student`, and `agency`.
- File references:
  - `src/pages/partners/PartnerApplicationPage.tsx`
  - `src/types.ts`
  - `functions/src/triggers.ts`

### Admin Approval And Branch Creation

- Existing admin partner approval flow now supports agencies.
- On approved agency application, the Cloud Function assigns `agency_partner` role and creates an `agencyBranches` document.
- File: `functions/src/triggers.ts`
- Created branch defaults:
  - `ownerUserId`
  - `organization`
  - `branchName`
  - `slug`
  - `contactName`
  - `contactEmail`
  - `website`
  - `primaryColor`
  - `pilotStatus: "active"`
  - `inviteLimit: 20`

### Admin Agency Navigation

- Admin Partners tab includes an Agency Dashboards panel.
- Admin can open any agency dashboard directly without loading every agency workspace.
- Admin can copy branch invite links.
- File: `src/pages/admin/components/PartnerApplicationManagement.tsx`
- Admin dashboard URL pattern: `/agency-partner/dashboard?branchId={branchId}`

### Agency Partner Dashboard

- Route: `/agency-partner/dashboard`
- File: `src/pages/AgencyPartnerDashboard.tsx`
- Access:
  - `agency_partner` users see their own branches.
  - Admin users can view all branches or directly load a branch by `branchId`.
- Tabs:
  - `Prep Pipeline`
  - `Invite Link`
  - `Ready Reports`
  - `Pilot Metrics`
- Current metrics:
  - candidates started
  - ready candidates
  - shared reports
  - average latest score
  - average score lift

### Candidate Prep Portal

- Route: `/prepare/{agencySlug}`
- File: `src/pages/AgencyPreparePage.tsx`
- Candidate flow:
  - Open agency-branded prep portal.
  - Sign in if needed.
  - Select or create a resume.
  - Open the resume editor.
  - Run a deep review quickly and focus on interviews.
  - Share readiness when ready.
- Current helper copy tells candidates they can also email their resume ID or public link to local agencies.

### Candidate Readiness Sharing

- Candidate can share readiness from the agency prep page.
- Sharing turns on a viewer-only resume link and updates the agency prep session.
- File: `src/services/agencyPartnerService.ts`
- Shared fields include:
  - `consentToShare: true`
  - `status: "shared"`
  - `latestScore`
  - `scoreDelta`
  - `resumeSharePath`
  - `readinessReport`
  - `sharedAt`

### Resume Share Modal Improvements

- File: `src/components/ShareResumeModal.tsx`
- Public access copy now explains that recruiters may contact the candidate if the background matches an open role.
- A `Ready for recruiter review` toggle is available after public access is on.
- The readiness toggle stores:
  - `shareConfig.readyForRecruiters`
  - `shareConfig.readyAt`
- The public resume page shows a recruiter-facing readiness banner when this flag is enabled.
- File: `src/pages/PublicResumePage.tsx`

### Editor Toolbar Sharing Fix

- File: `src/pages/editor/components/EditorHeader.tsx`
- `Share` remains visible even when `Review Feedback` is available.
- `Review Feedback` remains a separate toggle-style action when comments or annotations exist.

## Data Model

### `agencyBranches/{branchId}`

Branch profile and invite-link source of truth.

Core fields:

- `ownerUserId`
- `organization`
- `branchName`
- `slug`
- `contactName`
- `contactEmail`
- `website`
- `primaryColor`
- `pilotStatus`
- `inviteLimit`
- `createdAt`
- `updatedAt`

### `agencyPrepSessions/{sessionId}`

Candidate preparation progress record for a branch.

Core fields:

- `agencyBranchId`
- `agencyOwnerUserId`
- `agencySlug`
- `candidateUserId`
- `candidateName`
- `candidateEmail`
- `resumeId`
- `resumeTitle`
- `resumeSharePath`
- `status`
- `startingScore`
- `latestScore`
- `scoreDelta`
- `consentToShare`
- `readinessReport`
- `createdAt`
- `updatedAt`
- `startedAt`
- `sharedAt`

Status sequence:

- `invited`
- `started`
- `resume_imported`
- `reviewed`
- `ready`
- `shared`
- `inactive`

### Resume Share Config

Stored on the existing user resume document.

Fields:

- `shareConfig.enabled`
- `shareConfig.permission`
- `shareConfig.shareId`
- `shareConfig.readyForRecruiters`
- `shareConfig.readyAt`

## Privacy Model

Default state: progress-only.

Before candidate consent, the agency dashboard should only show summary progress fields such as candidate name/email, status, resume score, score lift, and readiness state.

After candidate consent, the agency can view:

- readiness report summary
- shared resume URL
- viewer-only public resume page

The current share action sets resume public access to viewer mode. The editor permission is not granted by the agency readiness flow.

## Firebase Rules

File: `firestore.rules`

Implemented rules:

- `agencyBranches` are publicly readable so `/prepare/{slug}` can resolve branch branding.
- Branch creation is admin-only.
- Branch updates/deletes are admin or branch owner.
- Candidates can create/update their own `agencyPrepSessions`.
- Agency partners can read only sessions tied to their owned branch.
- Admin can read all agency prep sessions.
- Resume documents remain owned by the candidate/admin, with public read allowed only when `shareConfig.enabled` is true.

## Demo Records

Production demo data was seeded for branch demos.

- Branch ID: `demo-champaign-agency-2026`
- Slug: `champaign-agency-demo`
- Agency dashboard: `https://careervivid.app/agency-partner/dashboard?branchId=demo-champaign-agency-2026`
- Candidate invite link: `https://careervivid.app/prepare/champaign-agency-demo`

Demo public resumes:

- `https://careervivid.app/shared/demo-candidate-david-chen/demo-resume-david`
- `https://careervivid.app/shared/demo-candidate-amina-johnson/demo-resume-amina`

## Deployment Notes

The latest frontend changes were deployed to Firebase Hosting on 2026-05-30.

Validated commands:

```bash
npm run build
firebase deploy --only hosting --project jastalk-firebase
```

Live checks passed:

- `https://jastalk-firebase.web.app/`
- `https://careervivid.app/`

Cloud Functions and Firestore rules were not redeployed for the latest share/readiness UI change because the behavior was frontend-only.

## Open Implementation Gaps

### Product

- Invite seat usage and branch limits are not enforced yet.
- No candidate invite email flow yet.
- No agency-facing CSV export yet.
- No webhook or ATS sync yet.
- No agency billing or signed-contract workflow yet.
- No branch-level co-branding editor for logo/color beyond stored fields.
- No recruiter notes or internal candidate tags.
- No candidate reactivation or archived-candidate workflow.

### Privacy And Governance

- Need clearer audit history for candidate consent changes.
- Need a revoke-sharing flow from agency prep context.
- Need agency terms/privacy language for pilot participants.
- Need a stricter full-resume access model if agencies should not see public resume links outside the consent window.

### Metrics

- Need explicit time-saved estimate per prepared candidate.
- Need conversion metrics from invited to started, started to ready, ready to shared, shared to placed.
- Need branch-level pilot ROI summary.

### Sales Operations

- Need a spreadsheet-driven agency pipeline tracker.
- Need outreach templates by agency stage.
- Need pilot success criteria and deal terms.
- Need pricing model after first proof-of-value conversations.

## Next Priorities

1. Use the demo branch in conversations with local agencies.
2. Track all agency conversations in the agency pipeline spreadsheet.
3. Track product functionality and future features in the functionality tracker workbook.
4. Add a basic pilot outcome report once one branch tests the flow.
5. Add seat limits, CSV export, and consent revocation before paid rollout.

