# CareerVivid Lifecycle Email Production Copy

Last updated: 2026-05-28

Use these blocks as production copy for lifecycle emails. Placeholders use `{{snake_case}}` so they can be mapped directly from Firebase user, resume, job, and lifecycle state.

## Track 1: Onboarding & Welcome

**Template category:** Onboarding and welcome  
**Primary goal:** `profile_initialized`  
**Recommended trigger:** New account created and no initialized profile after 15-30 minutes  
**Primary CTA:** Initialize your profile -> `{{cta_url}}`

### Subject Lines

- Start your CareerVivid workspace
- Move your job search out of the spreadsheet
- Your responsive job-search workspace is ready

### Preheaders

- Initialize your profile so CareerVivid can track roles, tailor resumes, and keep your next steps current.
- Replace static tracking sheets with a living workspace built around your resume, saved jobs, and applications.
- Set up the profile CareerVivid will use for matching, tracking, and application prep.

### Body Content Blocks

**Eyebrow:** Welcome to CareerVivid

**Headline:** Your job search workspace is ready

**Greeting:** Hi `{{user_name}}`,

**Intro copy:**

CareerVivid is built for a job search that changes every week. Instead of managing a rigid tracking sheet, you get a responsive workspace that keeps your resume, saved roles, application status, and AI prep connected.

Start by initializing your profile. That gives CareerVivid the baseline it needs to match your resume to roles, prepare application materials, and keep your tracker useful as your search moves.

**Value bullets:**

- Build one profile that can support resume matching, cover letters, interview prep, and autofill.
- Save jobs into a living pipeline instead of copying links into a static spreadsheet.
- Track deadlines, interviews, notes, and follow-ups from the same workspace.
- Let each saved role become context for the next resume edit or application step.

**Checklist module:**

1. **Initialize your profile**  
   Add your contact details, target role, and current resume baseline.

2. **Save one role you actually care about**  
   CareerVivid works best when the workspace has a real job description to learn from.

3. **Turn the role into next steps**  
   Review match gaps, prep a tailored resume, and track what needs to happen before the deadline.

**CTA block:**

Button: Initialize your profile  
URL: `{{cta_url}}`

Secondary link: Open dashboard -> `{{dashboard_url}}`

Helper text: You can update your profile later as your target roles change.

**Plain-text fallback:**

Hi `{{user_name}}`, CareerVivid is ready for your job search. Initialize your profile so your resume, saved jobs, application status, and AI prep can stay connected in one workspace. Start here: `{{cta_url}}`

## Track 2: Feature Spotlight: AI & Editor Experience

**Template category:** Feature spotlight  
**Primary goal:** `editor_ai_chunk_used`  
**Recommended trigger:** User has a resume but has not used chunk-level AI editing or contextual toolbar actions  
**Primary CTA:** Open the active resume editor -> `{{resume_editor_url}}`

### Subject Lines

- Edit stronger resume bullets without rewriting everything
- A faster way to tune each resume bullet
- Use CareerVivid AI where the resume actually needs work

### Preheaders

- Select a short chunk, open the contextual toolbar, and improve one bullet at a time.
- CareerVivid helps you manage compact, role-specific resume bullets without losing your voice.
- Use granular AI edits for clearer impact, stronger verbs, and tighter role alignment.

### Body Content Blocks

**Eyebrow:** AI editor spotlight

**Headline:** Improve the exact bullet that needs attention

**Greeting:** Hi `{{user_name}}`,

**Intro copy:**

You do not need to rewrite an entire resume to make it stronger. CareerVivid is designed around granular editing, so you can work on short, focused chunks of content: one bullet, one summary line, or one responsibility at a time.

When you highlight a section in the editor, the contextual toolbar appears beside your work. From there, you can tighten a bullet, add role-specific detail, or turn a vague task into a clearer impact statement.

**Feature bullets:**

- **Chunk-level control:** Work on one sentence or bullet without changing the rest of the resume.
- **Contextual toolbar overlays:** Keep editing actions close to the selected text instead of hunting through menus.
- **Shorter, sharper bullets:** Convert dense paragraphs into readable proof points hiring teams can scan.
- **Role-aware edits:** Use the saved job context to align wording with the position you are targeting.

**Product education module:**

**Before:** Managed cross-functional work across multiple internal projects and supported team execution.  
**After:** Coordinated 4 cross-functional launch tasks, clarified owners, and reduced weekly status churn for the product team.

Use the editor for bullets that need to be more specific, more measurable, or easier to read.

**CTA block:**

Button: Open the active resume editor  
URL: `{{resume_editor_url}}`

Secondary link: Open dashboard -> `{{dashboard_url}}`

Helper text: Start with one bullet. Small edits compound quickly across a resume.

**Plain-text fallback:**

Hi `{{user_name}}`, CareerVivid lets you edit resume content in small chunks. Highlight one bullet, use the contextual toolbar, and improve the exact line that needs attention. Open the active resume editor: `{{resume_editor_url}}`

## Track 3: Weekly Status Digest

**Template category:** Weekly transactional digest  
**Primary goal:** `weekly_digest_reengagement`  
**Recommended trigger:** Weekly digest enabled and user has upcoming deadlines, interviews, saved jobs, or incomplete preparation tasks  
**Primary CTA:** Open weekly workspace -> `{{cta_url}}`

### Subject Lines

- Your CareerVivid week: `{{deadline_count}}` deadlines, `{{interview_count}}` interviews
- Weekly job-search status for `{{week_label}}`
- Your next application steps are ready

### Preheaders

- Review deadlines, interviews, saved roles, and AI preparation modules for the week ahead.
- Your tracker, prep tasks, and application deadlines are organized in one weekly view.
- Open your workspace to update stages, prepare interviews, and finish the next application packet.

### Body Content Blocks

**Eyebrow:** Weekly status digest

**Headline:** Your job-search week is organized

**Greeting:** Hi `{{user_name}}`,

**Intro copy:**

Here is your CareerVivid status for `{{week_label}}`. This digest pulls together the work that usually gets scattered across calendars, tracking sheets, notes, and saved links.

Use it to update stale roles, prepare for upcoming interviews, and finish application materials before deadlines get close.

**Summary grid:**

| Metric | Value | What it means |
| --- | ---: | --- |
| Saved jobs | `{{saved_jobs_count}}` | Roles currently in your tracker |
| Deadlines | `{{deadline_count}}` | Applications or follow-ups due soon |
| Interviews | `{{interview_count}}` | Scheduled interview events |
| AI prep modules | `{{ai_prep_count}}` | Resume, cover letter, or interview prep tasks ready |

**Tracking deadlines table:**

| Due | Role | Company | Next action |
| --- | --- | --- | --- |
| `{{deadline_1_date}}` | `{{deadline_1_role}}` | `{{deadline_1_company}}` | `{{deadline_1_next_action}}` |
| `{{deadline_2_date}}` | `{{deadline_2_role}}` | `{{deadline_2_company}}` | `{{deadline_2_next_action}}` |
| `{{deadline_3_date}}` | `{{deadline_3_role}}` | `{{deadline_3_company}}` | `{{deadline_3_next_action}}` |

**Upcoming interviews table:**

| Time | Role | Interview type | Prep module |
| --- | --- | --- | --- |
| `{{interview_1_time}}` | `{{interview_1_role}}` | `{{interview_1_type}}` | `{{interview_1_prep_module}}` |
| `{{interview_2_time}}` | `{{interview_2_role}}` | `{{interview_2_type}}` | `{{interview_2_prep_module}}` |

**AI preparation modules:**

- **Resume match review:** `{{resume_match_module_status}}`
- **Cover letter draft:** `{{cover_letter_module_status}}`
- **Interview focus plan:** `{{interview_focus_module_status}}`
- **Application answer prep:** `{{application_answers_module_status}}`

**Recommended next steps:**

1. Update any role that changed status this week.
2. Open the highest-priority deadline and finish the missing application packet.
3. Run one interview prep module for the next scheduled conversation.

**CTA block:**

Button: Open weekly workspace  
URL: `{{cta_url}}`

Secondary link: Manage email preferences -> `{{preferences_url}}`

Helper text: You are receiving this because weekly job-search digests are enabled for your CareerVivid account.

**Plain-text fallback:**

Hi `{{user_name}}`, your CareerVivid weekly status is ready for `{{week_label}}`. Review `{{deadline_count}}` deadlines, `{{interview_count}}` interviews, and `{{ai_prep_count}}` AI prep modules here: `{{cta_url}}`
