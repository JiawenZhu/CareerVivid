# CareerVivid Lifecycle Email Template Library

Last updated: 2026-05-28

This document turns the provided Huntr email screenshots into a CareerVivid-owned lifecycle email system. The reference assets are used only for structural abstraction: layout pacing, module order, and campaign purpose. Copy, visual language, color, and component styling should remain CareerVivid-specific.

## Brand Governance

CareerVivid email assets should feel like the product: warm, calm, job-search focused, and operational. The reusable implementation lives in:

- `functions/src/emailTemplateLibrary.ts`
- Re-exported from `functions/src/emailTemplates.ts`

Core tokens:

| Token group | Values |
| --- | --- |
| Page | `#f7f1e7`, `#fffaf1`, `#fbfbfe`, `#f8f8fb` |
| Text | `#211b16`, `#0f172a`, `#665a4a`, `#64748b`, `#8a7a6a` |
| Borders | `#e4d3bc`, `#ececf4`, `#e5e7eb` |
| Action | `#625bd5`, hover `#5851c8`, soft `#eef0ff`, `#f3f2ff` |
| Warm accent | `#a97935`, `#fff5d8`, `#e9c56e` |
| Radius | `8px`, `12px`, `16px`, `18px` |
| Width | max container `640px`, readable copy `520px` |
| Typography | heading: Plus Jakarta Sans fallback, body: Inter/Helvetica/Arial, editorial hero optional Georgia |

Rules:

- Use purple for the primary CTA, not as the whole email background.
- Keep page and hero surfaces warm or near-white.
- Use thin borders and subtle table-card structure.
- Keep hero type confident but readable on mobile.
- Avoid decorative blobs, heavy gradients, or one-note purple compositions.
- Product images should be real product screenshots or email-safe UI mockups, never generic AI artwork.

## Reference Audit

### Product Update / Research Launch

Observed pattern:

- Centered launch hero with large title and date/source metadata.
- Concise intro paragraph.
- Short proof list or metrics.
- One primary link to the report or post.

CareerVivid abstraction:

- Use for market reports, product updates, and job-search insight drops.
- Keep the hero warm and restrained; use `content_launch` template with `hero + body + stats + cta`.
- Use proof points only when they are sourced from CareerVivid data or clearly labeled research.

### Welcome / Onboarding

Observed pattern:

- Large welcome hero.
- Short personal greeting.
- Ordered checklist of first jobs to be done.
- Multiple activation links.

CareerVivid abstraction:

- Use for new users with no completed resume.
- Keep the checklist short: base resume, save one job, tailor one application, install extension if relevant.
- Prefer one primary CTA plus a short secondary link.

### Milestone / Resume Completed

Observed pattern:

- Milestone statement at top.
- Large product mock or screenshot.
- Body explains the next recommended action.
- CTA moves from completed task to next workflow.

CareerVivid abstraction:

- Use after first resume, first job saved, first review completed, or first extension task.
- Pair with the next action: tailor for one role, prepare one application, or review suggestions.
- Use `milestone` hero variant with a mockup zone.

### Digest / Retention Report

Observed pattern:

- Plain operational greeting.
- Date or period marker.
- Stats grid.
- Activity sections with saved jobs, applications, interviews, and next steps.

CareerVivid abstraction:

- Use only when the user has activity or opted into digests.
- Lead with the reason to return: update stale jobs, prepare next action, or review follow-ups.
- Use `body + cta + stats + activityList`.

### Transactional Completion

Observed pattern:

- Minimal layout.
- Status title.
- Object name.
- One button to view the result.

CareerVivid abstraction:

- Use for resume review completed, export ready, billing notice, or job prep generated.
- Keep it short and delivery-focused.
- Use `status + cta`, with no marketing language.

### Feature Nudge

Observed pattern:

- Product hero image.
- Brief explanation of why the feature fits current behavior.
- Three benefit points.
- Primary CTA.

CareerVivid abstraction:

- Use after saved jobs with no cover letter, resume created with no match analysis, or extension installed with no autofill.
- Keep benefits practical and editable.
- Use `feature_nudge` with a product mockup or screenshot zone.

### Advocacy / Review Request

Observed pattern:

- Plain founder-style letter.
- Direct value acknowledgement.
- One review request.
- Reply path.

CareerVivid abstraction:

- Send only after clear value: extension used several times, autofill completed, or meaningful application packet created.
- Avoid fake urgency and inflated claims.
- Use `letter + cta`.

## Master Template List

| Template ID | Purpose | Module sequence | Placeholder zones | Success metric |
| --- | --- | --- | --- | --- |
| `cv-welcome-checklist` | New-user activation | `hero`, `body`, `checklist`, `cta` | user name, headline, 3-6 setup steps, CTA | `resume_created` within 24h |
| `cv-milestone-product-hero` | Move a completed task into next workflow | `hero`, `body`, `featureList`, `cta` | milestone label, product mock, benefit bullets, CTA | next workflow started |
| `cv-activity-digest` | Retention and progress review | `body`, `cta`, `stats`, `activityList` | period label, stats, activity rows, board CTA | dashboard opened or job updated |
| `cv-transaction-status` | Result delivery | `status`, `cta` | status title, object name, result link | result viewed |
| `cv-feature-nudge` | Related feature activation | `hero`, `body`, `featureList`, `cta` | feature mock, feature title, benefits, CTA | feature started |
| `cv-advocacy-letter` | Feedback or review request | `letter`, `cta` | value moment, review destination, signature | review clicked or feedback submitted |
| `cv-content-launch` | Report or product update | `hero`, `body`, `stats`, `cta` | report title, date/meta, proof metrics, read CTA | content clicked |

The same inventory is exported as `careerVividEmailTemplateCatalog`.

## Module Inventory

### `hero`

Use for the first visual signal in non-transactional campaigns.

Placeholders:

- `eyebrow`: short campaign label.
- `title`: one clear headline.
- `subtitle`: optional one-sentence support.
- `meta`: source, date, or period label.
- `visual`: optional `image` or `mockup`.

Variants:

- `default`: general campaign.
- `report`: content or research launch.
- `milestone`: completed-task emails.
- `feature`: feature education.

### `body`

Use for the human explanation.

Placeholders:

- `greeting` or `userName`.
- 1-3 concise paragraphs.

Guidance:

- Keep paragraphs under roughly 45 words.
- Say what changed, why it matters, and what to do next.

### `checklist`

Use for onboarding.

Placeholders:

- Section title.
- Ordered items with `title` and `body`.

Guidance:

- Use 3-6 items.
- Each item should be a real action, not a feature description.

### `featureList`

Use for product education or next-step nudges.

Placeholders:

- Section title.
- Feature cards with optional tiny labels.

Guidance:

- Use 2-4 features.
- Tie each feature to an existing user behavior.

### `stats`

Use for digests, research, and performance snapshots.

Placeholders:

- Section title.
- Up to 4 stats: `value`, `label`, optional `helper`.

Guidance:

- Do not use stats without a meaningful source.
- On mobile, stat cells stack vertically.

### `activityList`

Use for job tracker digest and application reminders.

Placeholders:

- Section title and subtitle.
- Activity rows with label, title, meta, and status.

Guidance:

- Keep row labels short: `Saved`, `Applied`, `Due`, `Prep`.
- Use status colors sparingly.

### `status`

Use for transactional completion and billing notices.

Placeholders:

- Title.
- Body.
- Optional rows for object name, date, plan, or amount.

Guidance:

- Keep it direct.
- Use `success`, `warning`, or `critical` only when the state actually requires it.

### `letter`

Use for founder/support/advocacy messages.

Placeholders:

- Paragraphs.
- Signature name and role.

Guidance:

- Do not use hero imagery.
- Send after a clear product value moment.

### `cta`

Use after body, status, or feature sections.

Placeholders:

- Primary button.
- Secondary link.
- Helper text.

Guidance:

- One primary action per email.
- Secondary link should be lower emphasis.

## Image And Mockup Asset Structure

Recommended repository structure for future image assets:

```text
docs/lifecycle-email-assets/
  README.md
  source/
    screenshots/
      tracker-dashboard.png
      resume-match.png
      extension-side-panel.png
      review-report.png
    mockups/
      application-packet-card.png
      resume-match-card.png
      digest-stats-card.png
  exports/
    2x/
      cv-email-welcome-hero@2x.png
      cv-email-resume-match@2x.png
      cv-email-extension-panel@2x.png
    1x/
      cv-email-welcome-hero.png
      cv-email-resume-match.png
      cv-email-extension-panel.png
```

Asset rules:

- Export at 2x first, then downscale for 1x.
- Use `560px` max image width for email body modules.
- Keep image text large enough after Gmail scaling.
- Use CareerVivid product UI or structured mockups.
- Avoid personal user data, private jobs, addresses, emails, live credit balances, or real resumes.
- Alt text should describe the product state, not the decorative style.

The TypeScript library also supports email-safe product mockups, so a campaign can ship before final bitmap exports are ready.

## Responsive Styling Tokens

The renderer includes a small email-safe media query:

```css
@media only screen and (max-width: 640px) {
  .cv-container { width: 100% !important; max-width: 100% !important; }
  .cv-shell { padding-left: 12px !important; padding-right: 12px !important; }
  .cv-pad { padding-bottom: 14px !important; }
  .cv-stat { display: block !important; width: 100% !important; padding-right: 0 !important; }
  .cv-mock { max-width: 100% !important; }
  h1 { font-size: 30px !important; }
}
```

Mobile behavior:

- Stats stack vertically.
- Mockups shrink to the full email width.
- Hero title reduces to 30px.
- Module spacing tightens but keeps readable white space.

## Example Usage

```ts
import { generateCareerVividModuleEmail } from "./emailTemplates";

const html = generateCareerVividModuleEmail({
  title: "Start your first CareerVivid resume",
  preheader: "Set up the profile CareerVivid will use for matching and applications.",
  userName: "Jiawen Zhu",
  modules: [
    {
      type: "hero",
      eyebrow: "Welcome to CareerVivid",
      title: "Start your first resume",
      subtitle: "One base resume gives CareerVivid the context it needs for matching, tracking, and applications.",
      variant: "milestone"
    },
    {
      type: "checklist",
      title: "First setup",
      items: [
        { title: "Add your resume", body: "Import or build the version you use most often." },
        { title: "Save one role", body: "Attach a real job so the next suggestions stay practical." },
        { title: "Run one match", body: "Review keywords, missing proof, and next edits." }
      ]
    },
    {
      type: "cta",
      primary: { text: "Build your resume", url: "https://careervivid.app/newresume" },
      secondary: { text: "Open dashboard", url: "https://careervivid.app/dashboard" }
    }
  ]
});
```

## QA Checklist

- Gmail desktop and mobile preview do not collapse text or buttons.
- Primary CTA is visible without dominating the full layout.
- Hero image or mockup has safe alt text.
- No hidden user data appears in screenshots.
- Copy is operational and direct.
- Every lifecycle email has a suppression rule and success metric before automation.
- Functions build passes after template changes.
