# Extension Upgrade — Implementation Progress

> Plan reference: `quality-upgrade-roadmap.md`
> Branch: `codex-aikido-security-fixes` (current working branch)
> Last updated: 2026-05-24

---

## Legend
- 🔲 Not started
- 🔨 In progress
- ✅ Done
- ⚠️ Blocked / needs review

---

## Feature 1 — Mark as Applied Button ✅

**Goal:** Wire the dead `markedApplied` state to real UI. Show a one-tap "Mark as Applied" button on application pages after the user fills or submits.

| Task | Status | Notes |
|------|--------|-------|
| Add `UPDATE_JOB_STATUS` message handler in `background.ts` | ✅ | Patches `trackedJobs` in storage + calls `cliJobsHunt` |
| Implement `handleMarkApplied()` in `ExtensionHome.tsx` | ✅ | Sends UPDATE_JOB_STATUS, deduplicates by URL |
| Add "Mark as Applied" button UI below AutoFillCard | ✅ | Visible whenever `isApplicationPage === true` |
| Toggle to "Applied ✓" green chip on click | ✅ | Non-interactive after tap, emerald colour |
| Auto-create job entry if not yet in trackedJobs | ✅ | Handled in UPDATE_JOB_STATUS handler |
| Build passes `npm run build` | ✅ | |

---

## Feature 2 — Stage Selector on Job Save ✅

**Goal:** Replace the direct "Save Job to Tracker" one-click with a two-step inline stage picker.

| Task | Status | Notes |
|------|--------|-------|
| Add `showStageSelector` + `selectedStage` state to `MatchBreakdownCard.tsx` | ✅ | Internal to card component |
| Add `stage?: string` to `JobData` in `autofill.types.ts` | ✅ | |
| Rewrite save flow — first click shows panel, confirm saves with stage | ✅ | Default stage: `'wishlist'` |
| Build stage-selector inline panel UI in `MatchBreakdownCard.tsx` | ✅ | Animated slide-in, 6 stage pills, X dismiss |
| Change `onSaveJob` signature to `(stage: string) => void` | ✅ | |
| Update `handleAction('save_job')` in `ExtensionHome.tsx` to accept stage | ✅ | |
| Pass `stage` through `CREATE_TRANSIT_DOC` body in `background.ts` | ✅ | |
| Include `stage` in `AUTO_LOG_APPLICATION` entry in `background.ts` | ✅ | |
| Build passes `npm run build` | ✅ | |

---

## Feature 3 — Salary Extraction & Display ✅

**Goal:** Extract salary from LinkedIn / Indeed / generic pages and surface it in the popup and tracker.

| Task | Status | Notes |
|------|--------|-------|
| Add `salary?: string` to `JobData` in `autofill.types.ts` | ✅ | |
| Add `extractSalary()` helper in `content.ts` | ✅ | LinkedIn selectors + Indeed testid + generic regex |
| Add LinkedIn salary selectors in `extractJobData()` | ✅ | `.job-details-jobs-unified-top-card__job-insight` |
| Add Indeed salary selector | ✅ | `[data-testid="attribute_snippet_testid"]` |
| Add generic salary regex | ✅ | `$X–$Y/yr` pattern on h1–h3 + salary class names |
| Update `scrapedJob` type in `ExtensionHome.tsx` to include `salary` | ✅ | |
| Render salary badge in `MatchBreakdownCard.tsx` header | ✅ | Emerald pill with DollarSign icon, next to company |
| Pass `salary` through transit doc in `background.ts` | ✅ | Added to `CREATE_TRANSIT_DOC` Firestore fields |
| Include `salary` in `AUTO_LOG_APPLICATION` entry | ✅ | |
| Build passes `npm run build` | ✅ | |

---

## Feature 4 — Quick Action Shortcuts ✅

**Goal:** Replace the single "Open Dashboard" footer link with a 4-icon quick-action row.

| Task | Status | Notes |
|------|--------|-------|
| Replace footer in `ExtensionHome.tsx` with 4-icon grid | ✅ | Resume · Cover Letter · Interview · Dashboard |
| Preserve "Open Dashboard" as secondary text link | ✅ | Kept below the icon row as 10px text |
| All 4 URLs use correct getAppUrl / getResumeBuilderUrl helpers | ✅ | |
| Build passes `npm run build` | ✅ | |

---

## Feature 5 — On-Page Keyword Highlighting

**Goal:** Inject green/amber `<mark>` highlights for matched/missing keywords directly onto the job posting page.

| Task | Status | Notes |
|------|--------|-------|
| Add `HIGHLIGHT_KEYWORDS` to `ExtensionMessage` union in `autofill.types.ts` | 🔲 | |
| Implement `highlightKeywordsOnPage()` in `content.ts` | 🔲 | TreeWalker, whole-word match, idempotency guard |
| Add `HIGHLIGHT_KEYWORDS` message handler in `content.ts` | 🔲 | |
| Add CSS classes `.cv-keyword-matched` + `.cv-keyword-missing` in content.ts injected style | 🔲 | |
| In `ExtensionHome.tsx`: send `HIGHLIGHT_KEYWORDS` after `matchAnalysis` is set | 🔲 | |
| Track `keywordsHighlighted` state in `ExtensionHome.tsx` | 🔲 | |
| Pass `keywordsHighlighted` prop to `MatchBreakdownCard.tsx` | 🔲 | |
| Render "Keywords on page ✓" chip in `MatchBreakdownCard.tsx` | 🔲 | Below match-score badge |
| Test on LinkedIn, Indeed, Greenhouse, Lever | 🔲 | |
| Build passes `npm run build` | 🔲 | |

---

## Build Verification Log

| Feature | Build Status | Notes |
|---------|-------------|-------|
| Feature 1 | ✅ | Clean build, no TS errors |
| Feature 2 | ✅ | Clean build, no TS errors |
| Feature 3 | ✅ | Clean build, no TS errors |
| Feature 4 | ✅ | Clean build, no TS errors |
| Feature 5 | 🔲 | Not yet implemented |
| Full regression | ✅ | Single build pass covers F1–F4 |
