# CareerVivid Chrome Web Store Publication Prep

Last reviewed: 2026-05-28

Package-prep update: production package no longer includes `localhost` or `127.0.0.1` entries in `public/manifest.json`, and the public privacy policy now includes a Chrome-extension-specific disclosure section.

This file is a publication handoff for the CareerVivid Chrome extension. It summarizes the current manifest, extension surfaces, Chrome Web Store review fields, and draft listing copy. It does not change extension source code or `public/manifest.json`.

## Current Extension Package

- Manifest: `public/manifest.json`
- Manifest version: MV3
- Extension name: `CareerVivid - Job Tracker & AI Career Coach`
- Extension version: `1.1.3`
- Latest package: `release/chrome-extension/careervivid-extension-1.1.3.zip`
- Latest package SHA-256: `c8d0d20e2800178c7d90fb269a9b8b387d5593e38e99ed599666f65adb37d1bd`
- Build script: `npm run build:extension`
- Build output: `dist-extension`
- Build flow: `scripts/build-extension.mjs` runs `vite build --config vite.extension.config.ts`, copies `public/manifest.json`, `public/icons`, and `public/content.css`, then renames `index.extension.html` to `index.html`.
- Last verified build: `npm run build:extension` completed successfully on 2026-05-28.

## Chrome Web Store Requirements Reviewed

Chrome's publication flow expects:

- A narrow, easy-to-understand single purpose.
- A justification for each declared permission.
- Accurate privacy practices and user data disclosures.
- A privacy policy URL that is consistent with the disclosures.
- Disclosure of whether the extension executes remote code. MV3 does not allow remotely hosted executable code.
- Testing for crashes, broken features, and bugs before submission.

Sources:

- https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- https://developer.chrome.com/docs/webstore/program-policies/policies
- https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines
- https://developer.chrome.com/docs/webstore/program-policies/disclosure-requirements/

## Single Purpose Statement

CareerVivid helps job seekers save job postings, analyze job descriptions, generate application assistance, and autofill job application forms using the user's selected CareerVivid resume profile.

Shorter dashboard field draft:

CareerVivid helps job seekers apply faster by connecting their CareerVivid resume profile to job postings and application forms, so they can save roles, tailor materials, answer application questions, and autofill forms from the browser.

## Extension Surfaces

- Native Chrome side panel: `side_panel.default_path` points to `index.html`, mounted from `src/entry-extension.tsx` and `src/extension-ui/layout/ExtensionLayout.tsx`.
- Background service worker: `src/background.ts` handles auth hydration, local storage, profile sync, Firestore REST calls, Cloud Function calls, context menus, side panel opening, token refresh alarms, and content-script messaging.
- Content script: `src/content.ts` is injected on configured host pages to detect job pages and application forms, extract job data, show CareerVivid save/autofill UI, run autofill, and prefetch AI answers or cover letters.
- Web app bridge: `externally_connectable` allows `careervivid.app` production origins to send auth and resume-selection events into the extension.
- Context menu: "Save Job to CareerVivid" is registered on LinkedIn, Indeed, Greenhouse, and Lever job pages.

## Developer Account Profile Checklist

Chrome Web Store profile updates happen from the Developer Dashboard `Account` page in the left menu, not from the extension listing tabs. Before uploading or submitting CareerVivid, update or verify:

- Publisher name: use the public brand name that should appear below the extension title. Use `CareerVivid`.
- Contact email: add and verify a monitored support email. Use `support@careervivid.app`.
- Physical address: required if the extension offers purchases, additional paid features, or subscriptions. Current provided address: `306 Nelson Ct, Champaign, IL 61820`. Confirm you are comfortable with Google and possibly users seeing it before public submission.
- Trusted tester accounts: add individual tester emails for private testing. Chrome does not support group emails in this account-level field; use item-level private visibility if testing with a group.
- Email notifications: enable review, policy, and account notifications for the publishing inbox. Current value must be checked in the Chrome Web Store Developer Dashboard `Account` page; it is not stored in this repository.
- Account identity: the developer account email cannot be changed after account creation; changing it later requires creating a new account and transferring items.

Recommended public profile posture:

- Use a business/brand publisher identity instead of a personal name if the verified account supports it.
- Keep support, privacy, and product URLs on the `careervivid.app` domain for trust consistency.
- Avoid submitting until the profile contact email and privacy policy URL are both verified and consistent with the listing.

## Permission Justifications

Use these as the initial Chrome Web Store dashboard permission justifications. Tighten wording if the manifest is narrowed before submission.

| Permission | Draft justification |
| --- | --- |
| `storage` | Stores the signed-in user's CareerVivid extension state locally, including selected resume ID, normalized autofill profile, cached resume PDF data, AI answer and cover-letter cache entries, auth sync metadata, and locally tracked saved jobs. |
| `unlimitedStorage` | Supports larger local cache entries needed for resume PDF upload support and application assistance caches. The extension stores this data locally so job form autofill can work quickly without repeatedly fetching the same resume or generated answer data. |
| `cookies` | Reads CareerVivid session cookies only for CareerVivid-owned domains so the extension can recognize the user's existing CareerVivid login and avoid a separate extension-only login. |
| `activeTab` | Allows the extension to act on the user's currently active tab after user interaction, such as opening the side panel, extracting the current job context, or sending autofill commands to the page the user is applying on. |
| `tabs` | Finds the active tab for job extraction/autofill, opens CareerVivid sign-in and onboarding pages, listens for tab activation or navigation so the side panel reflects the current job page, broadcasts auth/resume changes to open tabs, and looks for CareerVivid tabs during auth sync. |
| `contextMenus` | Adds a page context menu item that lets users save the current job posting to CareerVivid from supported job sites. |
| `scripting` | Injects the extension content script into CareerVivid-owned pages when needed for auth sync and runs a limited script to read the user's CareerVivid web auth state from the page's IndexedDB. It is not used to execute remotely hosted code. |
| `alarms` | Schedules refresh checks before Firebase auth tokens expire so the user remains signed in while using the extension. |
| `sidePanel` | Provides the primary extension UI as a Chrome side panel while users review job context, select resumes, generate answers, create cover letters, and run autofill. |

## Host Permission Justifications

| Host permission | Draft justification |
| --- | --- |
| `https://*/*` | Required by the current manifest because CareerVivid detects and assists with job postings and application forms across many employer sites and applicant tracking systems. The content script extracts job title, company, location, salary, description, and form labels/options only when needed for visible job-search and application-assistance features. |
| `https://careervivid.app/*` | Allows the extension to sync authentication, selected resume state, and CareerVivid account data with the production web app. |

## Externally Connectable Justification

`externally_connectable.matches` currently allows:

- `https://careervivid.app/*`
- `https://*.careervivid.app/*`

Draft justification:

CareerVivid web pages use external messaging to sync a user's successful web login and selected resume into the installed extension. The background service worker validates sender origins before accepting auth, sign-out, or resume-selection messages.

Publication note: localhost and 127.0.0.1 matches were removed from the production manifest for public Chrome Web Store submission.

## Remote Code Declaration

Draft dashboard answer: No, the extension does not execute remotely hosted code.

Support notes:

- MV3 extension scripts are bundled by Vite into `dist-extension`.
- The extension calls remote APIs and Cloud Functions for authenticated CareerVivid features, but those responses are data, not executable extension code.
- The extension displays remote image assets from Firebase Storage in the UI, but does not load remote JavaScript for execution.

## User Data Disclosure Notes

Likely Chrome Web Store data categories to disclose based on current code:

- Personally identifiable information: name, email, phone, location, social/profile URLs, resume contact information.
- Authentication information: Firebase ID token, refresh token, token expiration time, and account UID are stored locally for authenticated extension use.
- User content: resume data, generated application answers, generated cover letters, job descriptions, saved jobs, application statuses, and resume PDF cache data.
- Website content: job page data and application form questions/options extracted from pages the user visits for job-search and application assistance.
- Web history or browsing activity: the extension can observe current tab URLs and job/application pages to provide job detection, save-to-tracker, autofill, and AI assistance. The disclosure should narrowly describe this as job-search/application page usage, not general browsing analytics.

Draft user-facing disclosure:

CareerVivid collects and processes job posting content, application form labels/options, selected resume profile data, generated application answers, generated cover letters, saved job records, and account authentication state only to provide job-search, resume tailoring, application tracking, and autofill features requested by the user. CareerVivid does not sell this data or use it for personalized advertising.

Draft Limited Use statement for the website/privacy policy:

The use of information received from Google APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements. CareerVivid uses extension-collected data only to provide and improve its job-search, resume tailoring, application tracking, and autofill features.

Current repo privacy policy note:

- `src/pages/PrivacyPolicyPage.tsx` has a general privacy policy effective January 19, 2026.
- It now includes Chrome-extension-specific disclosures and the Chrome Web Store Limited Use statement above.

## Test Account And Review Instructions

Replace placeholders before submission.

Test account:

- Email: `[TODO: Chrome Web Store reviewer test email]`
- Password: `[TODO: Chrome Web Store reviewer test password]`
- Account setup: `[TODO: confirm account has at least one completed resume]`
- Subscription/credits: `[TODO: confirm whether reviewer account has AI credits or premium access]`

Suggested review path:

1. Install the unpacked extension from the submitted package.
2. Click the CareerVivid toolbar icon to open the side panel.
3. Sign in with the reviewer test account, or visit `https://careervivid.app/signin?redirect=%2Fextension-auth-complete` and sign in there.
4. Confirm the extension side panel shows the selected resume and job tools.
5. Open a public job posting on LinkedIn, Indeed, Greenhouse, or Lever.
6. Use the side panel to extract the job context and save the job to the tracker.
7. Open an application form page on Greenhouse, Lever, Workday, or Ashby.
8. Use "Autofill Application" to fill detected fields from the selected CareerVivid resume.
9. Use the AI answer flow on a form with text questions, if credits are enabled for the test account.
10. Use "Mark as Applied" to confirm the local tracker update.

Test fixture URLs:

- Job posting URL: `[TODO: add stable public job posting URL]`
- Application form URL: `[TODO: add stable public ATS test application URL]`
- CareerVivid dashboard URL: `https://careervivid.app/dashboard`

## Listing Copy Draft

Title:

CareerVivid - Job Tracker & AI Career Coach

Short description:

Save jobs, tailor your resume, generate application answers, and autofill job applications from your CareerVivid resume profile.

Detailed description:

CareerVivid is a browser companion for job seekers who want a faster, more organized application workflow.

Use CareerVivid to:

- Save job postings to your CareerVivid tracker.
- Analyze job descriptions against your selected resume.
- Generate tailored resume, cover-letter, and application-answer support.
- Autofill supported job application forms from your CareerVivid resume profile.
- Track applied roles and keep your pipeline organized.

The extension works with your CareerVivid account and opens in Chrome's side panel so your job search tools stay next to the posting or application form you are reviewing.

Privacy summary:

CareerVivid uses your resume profile, selected job posting content, application form labels/options, and saved-job data only to provide job-search, application-assistance, tracking, and autofill features. We do not sell your personal data or use extension-collected data for personalized advertising.

## Store Listing Visual Assets

Required before public submission:

- Store icon: 128x128 PNG. Current package includes `public/icons/icon128.png`.
- Screenshots: at least one, preferably five, at `1280x800` or `640x400`. Use `1280x800` for sharper high-resolution display.
- Small promotional tile: `440x280` PNG or JPEG.

Generated upload-ready files:

- Store icon: `public/icons/icon128.png`
- Small promotional tile: `docs/chrome-extension-publish/assets/promo-small-440x280.png`
- Screenshot 1: `docs/chrome-extension-publish/assets/01-track-every-job-1280x800.png`
- Screenshot 2: `docs/chrome-extension-publish/assets/02-know-what-to-do-next-1280x800.png`
- Screenshot 3: `docs/chrome-extension-publish/assets/03-match-resumes-to-roles-1280x800.png`
- Screenshot 4: `docs/chrome-extension-publish/assets/04-tailor-and-review-faster-1280x800.png`
- Screenshot 5: `docs/chrome-extension-publish/assets/05-practice-with-ai-coaching-1280x800.png`

Recommended but optional:

- Marquee promotional tile: `1400x560` PNG or JPEG. Needed if we want better eligibility for prominent Chrome Web Store featuring. Generated file: `docs/chrome-extension-publish/assets/promo-marquee-1400x560.png`.
- YouTube promo video: a short feature walkthrough. This can be added later, but a 45-75 second video would help explain the side-panel workflow better than screenshots alone.

Recommended first screenshot set:

1. `Track every opportunity`: Career Pipeline Kanban with compact job cards, metrics, filters, and enough visible jobs to show it scales beyond a small demo.
2. `Map your search strategy`: Career Pipeline Strategy Map showing resume/job nodes and match lines, cropped to make the visual graph obvious.
3. `Every detail, one place`: Job detail modal with prep notes on the left and resume match/pipeline controls on the right.
4. `Tailor stronger resumes`: Resume editor with PDF preview, score, template controls, and AI Tailor visible.
5. `Practice before the call`: Interview practice modal or report dashboard showing live coaching/report output.

Huntr-inspired production notes:

- Use a light lavender/off-white background frame with a single clear headline, similar to Huntr's "Autofill Applications in Seconds" and "Every Detail at your fingertips" cards.
- Place the real CareerVivid UI inside a rounded browser/app frame instead of uploading raw browser screenshots with Chrome tabs, bookmarks, and personal sidebar data visible.
- Use 3-6 word headlines with one emphasized phrase in CareerVivid blue/purple.
- Crop tightly around the product surface. The Chrome Web Store carousel is small, so large browser chrome, sidebars, and dense tables reduce clarity.
- Keep each image focused on one job-to-be-done: track, map, prep, tailor, practice.
- Avoid exposing real personal email, phone, home address, live resume details, AI credit counts, and private job history in store assets.

Draft screenshot headlines:

- `Track Every Job`
- `Know What To Do Next`
- `Match Resumes To Roles`
- `Tailor And Review Faster`
- `Practice With AI Coaching`

Small promotional tile:

- Size: `440x280`.
- Concept: CareerVivid logo plus a clean side-panel mockup.
- Copy: `AI job search, resume tailoring, autofill, and interview prep`.
- Visual: one side-panel card, one resume/job match card, and one small pipeline card. No browser chrome.

Marquee promotional tile:

- Size: `1400x560`.
- Concept: a horizontal product montage with the dashboard, extension side panel, and resume match card.
- Copy: `From saved job to tailored application`.
- Use this if we want stronger Chrome Web Store featuring potential.

Video:

- Optional for initial submission, but Huntr uses a video thumbnail first in the carousel. A 45-75 second walkthrough would be valuable after the first listing is live.
- Recommended flow: detect job -> save to pipeline -> match resume -> autofill/review -> prep/interview.

Visual direction:

- Use real product UI, not generic marketing art, for screenshots.
- Keep text large enough to remain legible after Chrome downscales screenshots.
- Use the small promo tile for brand and core value, not a raw screenshot.
- Do not show private user data, real addresses, personal emails, or non-demo resumes.

## Publication Blockers And Review Risks

- `https://*/*` host access and matching content script access are broad. This may be justified by cross-site job board and ATS support, but it is the highest review-risk area. If possible later, narrow host permissions to known ATS/job-board domains or move broader access to optional permissions.
- `cookies`, `tabs`, `scripting`, and `unlimitedStorage` are sensitive/high-scrutiny permissions. The current code has reasons for them, but the dashboard text and listing copy should make the auth sync, side panel, autofill, and local cache behavior clear.
- Reviewer test account and stable test URLs are still placeholders.
- No build or browser smoke test was run as part of this metadata-only update.
