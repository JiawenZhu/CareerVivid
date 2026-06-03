# CareerVivid Chrome Extension — Quality Upgrade Roadmap

> Competitive benchmark: Huntr (4.9★, 1,300+ reviews, 90K users).
> Goal: match their core extension UX, then exceed it with our AI Smart Fill moat.

---

## Feature Overview

| # | Feature | Impact | Effort | Status |
|---|---------|--------|--------|--------|
| 1 | Mark as Applied button | High | Low | 🔲 Pending |
| 2 | Stage selector on job save | High | Low–Med | 🔲 Pending |
| 3 | Salary extraction & display | Med | Low | 🔲 Pending |
| 4 | Quick action shortcuts | Med | Low | 🔲 Pending |
| 5 | On-page keyword highlighting | High | Med–High | 🔲 Pending |

---

## Feature 1 — Mark as Applied Button

### Problem
`markedApplied` state already exists in `ExtensionHome.tsx` (line 125) but is wired to zero UI. After a user fills an application, there is no way to mark the job as applied without opening the full dashboard.

### Acceptance Criteria
- On application pages (`isApplicationPage === true`), after the autofill completes (`fillResult` is set), a **"✓ Mark as Applied"** button appears below the AutoFillCard.
- Clicking it updates the job's status in `chrome.storage.local` (`trackedJobs`) and fires a best-effort update to the `cliJobsHunt` Cloud Function with `status: 'Applied'`.
- The button toggles to a **"Applied ✓"** green chip and cannot be clicked again.
- If no `fillResult` yet (user hasn't autofilled), the button still appears as **"Mark as Applied"** on application pages — the user may have manually filled the form.

### Visual Design
```
┌─────────────────────────────────────┐
│  ✓ Application Workspace      [ATS] │  ← AutoFillCard
│  12 fields synced                   │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  [ ✓ Mark as Applied ]              │  ← new button, full-width
└─────────────────────────────────────┘
```
- Default state: `bg-slate-100 text-slate-700 border border-slate-200` pill
- Applied state: `bg-emerald-50 text-emerald-700 border border-emerald-200` with a checkmark, non-interactive

### Files to Modify
| File | Change |
|------|--------|
| `src/extension-ui/pages/ExtensionHome.tsx` | Wire `markedApplied` state, add button UI below AutoFillCard, implement `handleMarkApplied()` |
| `src/background.ts` | Add `UPDATE_JOB_STATUS` message handler to patch `trackedJobs` in storage and push to Cloud Function |

### Implementation Notes
- `handleMarkApplied` should: set `markedApplied(true)`, update `chrome.storage.local` trackedJobs matching by URL or title+company, then send `UPDATE_JOB_STATUS` to background.
- Deduplicate: if the job was never saved (not in `trackedJobs`), create the entry with `status: 'Applied'` automatically.

---

## Feature 2 — Stage Selector on Job Save

### Problem
"Save Job to Tracker" silently sends every job to a default `'To Apply'` status. Users who are mid-process (already interviewed, already applied) have no way to correctly log the stage from the extension — they must open the dashboard and drag the card.

### Acceptance Criteria
- The "Save Job to Tracker" button in the MatchBreakdownCard becomes a two-step flow:
  1. First click: expand an inline stage-selector panel (no new page, no modal).
  2. User picks a stage, then taps **"Save"** to confirm. Alternatively, pressing the original button again without picking a stage defaults to "Wishlist".
- Stages available: **Wishlist · Applying · Applied · Interviewing · Offer · Rejected**
- Selected stage is passed through the transit doc system to the job tracker.
- The panel animates in from below with `animate-in slide-in-from-bottom-2 duration-200`.

### Visual Design
```
[ + Save Job to Tracker ]          ← first click opens panel below

┌─────────────────────────────────────────┐
│  Where are you in this process?         │
│  ○ Wishlist  ● Applying  ○ Applied      │
│  ○ Interviewing  ○ Offer  ○ Rejected    │
│  [ Save to Tracker ]  [ Cancel ]        │
└─────────────────────────────────────────┘
```
- Stage pills: `rounded-full px-3 py-1 text-[11px] font-bold border cursor-pointer`
- Selected pill: `bg-indigo-600 text-white border-indigo-600`
- Unselected pill: `bg-white text-slate-600 border-slate-200 hover:border-indigo-300`

### Files to Modify
| File | Change |
|------|--------|
| `src/extension-ui/pages/ExtensionHome.tsx` | Add `showStageSelector` + `selectedStage` state; rewrite `handleAction('save_job')` to show the panel on first click, save with stage on confirm |
| `src/background.ts` | Pass `stage` field through `CREATE_TRANSIT_DOC` payload and `AUTO_LOG_APPLICATION` entry |
| `src/types/autofill.types.ts` | Add `stage?: string` to `JobData` interface |

### Implementation Notes
- Valid stage values (match dashboard Kanban column keys): `'wishlist' | 'applying' | 'applied' | 'interviewing' | 'offer' | 'rejected'`
- Default selection when panel opens: `'wishlist'`
- The stage should be stored in the transit doc so the web app can pre-set the Kanban column on import.

---

## Feature 3 — Salary Extraction & Display

### Problem
`extractJobData()` in `content.ts` captures title, company, location, and description — but not salary. Salary is visible on most job postings and is high-value data for the tracker.

### Acceptance Criteria
- `extractJobData()` returns an optional `salary?: string` field.
- Salary is extracted from LinkedIn, Indeed, and generic pages via regex patterns.
- When a salary is detected, it is shown as a small badge inside the `MatchBreakdownCard` next to the job title/company line.
- Salary is stored in `trackedJobs` and passed through the transit doc to the web app tracker.

### Salary Extraction Patterns
```
LinkedIn:  .job-details-jobs-unified-top-card__job-insight span
           .compensation-and-workplace-type span

Indeed:    [data-testid="attribute_snippet_testid"] (first match with $)

Generic:   Regex over full page text:
           /\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:\s*(?:per|\/)\s*(?:year|yr|hour|hr|month|mo|k))?/i
           Match first occurrence in: h1~h3 siblings, job header area
```

### Visual Design
```
┌──────────────────────────────────────────┐
│  [Job Detected]  [87% Match]             │
│  Software Engineer                       │
│  Google  ·  $180K–$240K/yr  ← new badge │
└──────────────────────────────────────────┘
```
- Salary badge: `inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100`
- DollarSign icon (Lucide, size 9) prefix

### Files to Modify
| File | Change |
|------|--------|
| `src/content.ts` | Extend `extractJobData()` return type and extraction logic for all three platforms |
| `src/types/autofill.types.ts` | Add `salary?: string` to `JobData` |
| `src/extension-ui/components/MatchBreakdownCard.tsx` | Add salary badge in the header area |
| `src/extension-ui/pages/ExtensionHome.tsx` | Update `scrapedJob` type to include `salary`, pass through to MatchBreakdownCard |
| `src/background.ts` | Include `salary` in transit doc fields and `AUTO_LOG_APPLICATION` entry |

---

## Feature 4 — Quick Action Shortcuts

### Problem
The extension footer has a single "Open Dashboard" link. Users who want to create a new resume, open the cover letter generator, or jump to interview practice must navigate manually after landing on the dashboard.

### Acceptance Criteria
- The footer is replaced by a **4-icon quick-action row** above the existing "Open Dashboard" text link.
- Actions: **Resume Builder · Cover Letter · Interview Studio · Dashboard**
- Each icon opens the relevant app page in a new tab.
- Icons are rendered as small rounded-square buttons with a label beneath — consistent with the secondary action card style already used in the popup.

### Visual Design
```
┌──────────────────────────────────────────┐
│  [📄]      [✉]      [🎤]      [⊞]       │
│ Resume  Cover Ltr  Interview  Dashboard  │
├──────────────────────────────────────────┤
│         Open Full Dashboard  ↗           │  ← keep existing link
└──────────────────────────────────────────┘
```
- Icon container: `h-9 w-9 rounded-xl flex items-center justify-center`
- Resume: `bg-indigo-50 text-indigo-600`
- Cover Letter: `bg-violet-50 text-violet-600`
- Interview: `bg-pink-50 text-pink-600`
- Dashboard: `bg-slate-100 text-slate-600`
- Label: `text-[9px] font-bold text-gray-500 mt-1`

### Files to Modify
| File | Change |
|------|--------|
| `src/extension-ui/pages/ExtensionHome.tsx` | Replace footer with quick-action row + preserved "Open Dashboard" text link |

### URL Targets
| Action | URL |
|--------|-----|
| Resume Builder | `getResumeBuilderUrl()` (already imported) |
| Cover Letter | `getAppUrl('/cover-letter')` |
| Interview Studio | `getAppUrl('/interview-studio')` |
| Dashboard | `https://careervivid.app/dashboard` |

---

## Feature 5 — On-Page Keyword Highlighting

### Problem
CareerVivid shows matched/missing keywords inside the extension popup. Huntr's killer feature is overlaying color highlights **directly on the job posting page**, so users see at a glance which skills they have and which are gaps — without opening the popup.

### Acceptance Criteria
- After the match analysis completes and the popup has `matchAnalysis` data, it sends a `HIGHLIGHT_KEYWORDS` message to the active tab's content script.
- The content script finds the job description container on the page and wraps matching keyword occurrences in `<mark>` elements.
  - **Matched keywords** → green highlight
  - **Missing keywords** → amber/orange highlight
- Highlights are injected only once per page load; re-opening the popup does not double-inject.
- A small **"Keywords highlighted on page"** status chip appears in the popup below the match score.
- Highlights are cleaned up when the tab navigates away (standard DOM lifecycle).
- Does not break the page layout — uses inline `<mark>` elements with `border-radius` and `padding: 0 2px`.

### Visual Design — Popup Chip
```
┌──────────────────────────────────────┐
│  [87% Match]  [Keywords on page ✓]  │  ← new status chip
│  Software Engineer                   │
│  Google                              │
└──────────────────────────────────────┘
```
Chip style: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-100`

### Visual Design — On-Page Highlights
```css
/* Injected via content script */
.cv-keyword-matched {
  background-color: #dcfce7;   /* green-100 */
  color: #15803d;              /* green-700 */
  border-radius: 3px;
  padding: 0 3px;
  font-weight: 600;
}

.cv-keyword-missing {
  background-color: #fff7ed;   /* orange-50 */
  color: #c2410c;              /* orange-700 */
  border-radius: 3px;
  padding: 0 3px;
  font-weight: 600;
}
```

### Message Protocol
```
Popup → Content Script:
{
  type: 'HIGHLIGHT_KEYWORDS',
  matchedKeywords: string[],
  missingKeywords: string[]
}

Content Script → Popup (response):
{
  success: boolean,
  highlightedCount: number
}
```

### Algorithm
1. Locate job description container: try `#job-details`, `#jobDescriptionText`, `.job-description`, `[class*="description"]` in order.
2. Walk text nodes inside the container using a `TreeWalker`.
3. For each text node, scan for keyword occurrences (case-insensitive, whole-word boundary `\b`).
4. Split the text node and insert `<mark>` elements for each hit.
5. Guard with a `data-cv-highlighted="true"` attribute on the container so re-sends are idempotent.

### Files to Modify
| File | Change |
|------|--------|
| `src/content.ts` | Add `HIGHLIGHT_KEYWORDS` message handler + `highlightKeywordsOnPage()` function |
| `src/extension-ui/pages/ExtensionHome.tsx` | After `matchAnalysis` is set, send `HIGHLIGHT_KEYWORDS` to active tab; show "Keywords on page ✓" chip |
| `src/types/autofill.types.ts` | Add `HIGHLIGHT_KEYWORDS` to `ExtensionMessage` union |
| `src/extension-ui/components/MatchBreakdownCard.tsx` | Accept `keywordsHighlighted?: boolean` prop and render chip |

---

## Implementation Order

```
Week 1
  Day 1–2   Feature 1: Mark as Applied
  Day 3–4   Feature 2: Stage Selector
  Day 5     Feature 3: Salary Extraction

Week 2
  Day 1     Feature 4: Quick Action Shortcuts
  Day 2–4   Feature 5: On-Page Keyword Highlighting
  Day 5     QA pass + build verification
```

---

## Shared Design Principles

1. **No modals for small interactions.** Stage picker and "Mark as Applied" are inline — they expand within the popup, not above it.
2. **Optimistic UI.** All state changes update locally first; Cloud Function sync is fire-and-forget.
3. **Consistent color vocabulary:**
   - Indigo = primary action / AI feature
   - Emerald = success / matched / applied
   - Amber = warning / missing
   - Violet = creative (cover letter, resume)
   - Pink = interview / practice
   - Slate = neutral / secondary
4. **Extension popup is 380px wide, max-height screen.** All new UI must stay within these constraints.
5. **No new dependencies.** Use Lucide icons already imported and Tailwind classes already in the build.
