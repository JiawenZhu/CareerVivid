# CareerVivid Design System

**CareerVivid** ("The AI That Gets You Hired") is an AI-powered job-search workspace: resume builder, job application tracker (Kanban pipeline), AI interview coach (Interview Studio), portfolio/link-in-bio builder, job marketplace, whiteboard, and a Chrome extension that captures job postings and autofills applications. Built with React + TypeScript + Tailwind, Firebase, and Gemini.

## Sources

- Codebase: locally mounted folder `careervivid/` (careervivid-release repo). Key design references:
  - `docs/design/careervivid-system-theme.json` — first-party detailed theme spec (palette, semantic tokens, components, motion). **Primary source of truth for values here.**
  - `docs/careervivid-design-pattern.json` — brand direction, copy rules, layout patterns.
  - `src/index.css` — signature `cv-warm-*` classes, dark-mode strategy.
  - `src/pages/*`, `src/components/JobTracker/*`, `src/extension-ui/*` — real screens.
- Live product: https://careervivid.app
- Remote wordmark logos (Firebase Storage, not in repo — see Iconography):
  - light: `https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_light_mode.png?alt=media`
  - dark: `.../logo_assets%2Flogo_dark_mode.png?alt=media`

## Products / surfaces

1. **Marketing website** (careervivid.app public pages) — warm paper `#f7f1e7`, editorial, subtle 64px grid lines, amber eyebrows, product-UI-as-hero.
2. **App workspace** (dashboard, Career Pipeline job tracker, Interview Studio, resume builder) — cool near-white `#f8f8fb` shell, white cards, compact scannable density.
3. **Chrome extension side panel** — compact `#f8f8fb` panel, white 16–20px-radius action cards, sticky blurred header/footer, min-height 520px.

## Content fundamentals

**Tone: direct, warm, practical, outcome-oriented.** The product is a career workspace, not a flashy AI toy.

- **Voice**: speaks to "you", outcome-first. Product name used plainly ("CareerVivid turns it into a job-search workspace").
- **Casing**: sentence case almost everywhere — headings, buttons, labels ("Today's job-search plan", "Start for free"). Title Case only for proper nouns and a few legacy page titles. ALL-CAPS only in tiny eyebrow labels (0.22em tracking) and 10–11px badges.
- **Labels are short verb phrases**: "Save to tracker", "Tailor resume", "Match keywords", "Practice", "Start mock interview", "Open pipeline".
- **Headlines are concrete and product-led**: "Everything you need to land your next job — in one place.", "Upload, paste, or capture a role. CareerVivid turns it into a job-search workspace.", "From hidden job link to prepared application."
- **Avoid**: "revolutionary", "magic", "unlock your future", "AI-powered everything", long explanatory UI copy, oversized "NO JOB DETECTED"-style labels.
- **Errors**: name the failure and give the next action.
- **Emoji**: not used in product UI (only in the GitHub README). Don't use them.

## Visual foundations

- **Two background worlds**: warm paper (`--cv-bg-public: #f7f1e7`) for public pages; cool near-white (`--cv-bg-product: #f8f8fb`) for the app + extension. Never mix.
- **Purple is an accent, not a theme** (`#625bd5`, hover `#514ac5`): primary CTAs, selected states, focus rings only. Soft-purple secondary actions: bg `#eef0ff`, text `#625bd5`, ring `#dfe2ff`.
- **Amber eyebrows** on warm surfaces: `#a97935`, 12px, 700, uppercase, 0.22em tracking.
- **Type**: Inter body (12–14px, weight 500), Plus Jakarta Sans headings (weight 600–800), letter-spacing 0. Card titles 13–15px/700; metadata 10–12px/600; badges 10–11px/700. No hero-scale type inside cards/panels.
- **Backgrounds**: flat colors + the subtle 64px `cv-warm-grid` line pattern on public pages. NO gradients as surfaces, no blobs/orbs/bokeh. Product screenshots/concrete UI serve as hero imagery.
- **Cards**: white, 1px `#e5e7eb` border, 12px radius, shadow `0 1px 2px rgba(16,24,40,0.05)`. Warm public cards: `rgba(255,250,241,0.88)` bg, `#e4d3bc` border, shadow `0 1px 2px rgba(139,90,22,0.05)`. Hover: translateY(-2px), bg `#fbfbff`, border `#dfdcff`, shadow `0 8px 24px rgba(98,91,213,0.08)`. Never nest decorative cards.
- **Borders**: always 1px; 2px only for focus.
- **Radii**: controls 6–8px, cards 12–16px, big search inputs 16px, extension cards 16–20px, modals 18–24px, pills/avatars 999px.
- **Shadows**: thin and restrained (see `tokens/effects.css`); modal `0 24px 70px rgba(17,24,39,0.24)`.
- **Motion**: 120/200/320ms, ease `cubic-bezier(0.2,0,0,1)` (emphasized `0.34,1.56,0.64,1` for celebrations). Motion clarifies state; hover lift ≈ -2px; respect reduced motion.
- **Hover states**: subtle bg tint shifts (white→`#fbfbff`/`#f8f8fb`), border→purple tint, darker purple for primary buttons. Press: no shrink patterns in source.
- **Status color** appears only in small chips, 10px dots, tinted icon wells — never large blocks. Pipeline dots: gray/blue/yellow/green/red.
- **Transparency + blur**: sticky headers/footers use `white/95 + backdrop-blur`; warm cards use 88% opacity backgrounds.
- **Imagery**: warm-toned product screenshots; rabbit mascot avatar photos (`assets/avatars/`). No stock photography on core surfaces.
- **Dark mode**: `html.dark` class. Warm world → `#1f1f1d`/`#262522`; product world → navy `#0f172a`/`#111827`. Accents soften (purple → `#7069dc`/`#bbb8ff`, amber → `#caa26c`).
- **Layout**: public max-width 1120–1280px; app = sidebar + scrollable content; extension = sticky header/footer, 520px min height. Card grids min 260px col, 12–24px gap. Pipeline columns min 244px.

## Iconography

- **Icon system: [Lucide](https://lucide.dev) v0.344.0** (`lucide-react` in the app), stroke style, typically 11–18px in UI. Copied verbatim into `assets/icons/lucide/*.svg` (65 icons) and inlined as data in `components/icons/lucideIconData.js` for the `Icon` React component.
- Icons sit in **tinted "wells"**: 28–40px squares, 8–12px radius, tinted bg (`#f3f2ff` purple, `#fff7e8` amber, `#f7fff8`/`#eef9f2` green, `#fff6f6` rose) with matching icon color.
- Material Symbols and react-icons exist in the codebase for niche pages; Lucide is the product's system — use it.
- **Logo**: purple-gradient rounded-square "CV + arrow" mark (`assets/logo/careervivid-icon-128.png`, `-512.png`, from `public/icons/`). The horizontal wordmark logos live only on Firebase Storage (URLs above) — not copied (remote binaries). Where a wordmark is needed, use the mark + "CareerVivid" set in Plus Jakarta Sans 700.
- No emoji, no unicode-chars-as-icons.

## Index

- `styles.css` — global entry (imports everything below)
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `effects.css`, `fonts.css`, `base.css` (incl. signature `cv-warm-*` classes)
- `guidelines/` — foundation specimen cards (Design System tab)
- `assets/` — `logo/`, `avatars/` (rabbit mascots), `icons/lucide/`, `backgrounds/` (pipeline scenes), `images/resume-banner.png`
- `components/` — reusable primitives (inventory from `careervivid-system-theme.json` "components" section):
  - `icons/` — Icon (Lucide wrapper), IconWell
  - `forms/` — Button, Input, SearchInput, SegmentedControl, CategoryFilter
  - `display/` — Card, Badge, StatCard, Avatar, JobCard, CompanyGuideCard
  - `navigation/` — Sidebar
  - `feedback/` — Modal
- `ui_kits/marketing/` — public landing page recreation
- `ui_kits/app/` — app workspace (dashboard + Career Pipeline + Interview Studio)
- `ui_kits/extension/` — Chrome extension side panel
- `redesigns/` — **redesign proposals for the Quest/gamification surfaces** (July 2026 review): `CompanyQuestPage.html`, `SystemDesignBattle.html`, `XpStatusCard.html`. These replace the Tailwind-indigo + stone/slate styling in `src/pages/CompanyQuestPage.tsx`, `src/components/Quest/SystemDesignBattle.tsx`, and `src/components/Gamification/XpStatusCard.tsx` with brand purple `#625bd5`, spec success tones, and product neutrals. Reviewed and left unchanged (already on-brand): `InterviewStudio.tsx`, `LandingTrustSections.tsx`, `AIInterviewAgentModal.tsx`.
- `SKILL.md` — agent skill entry point

### Intentional additions
- `Icon` + `IconWell` wrappers — needed to use the copied Lucide set without npm.

### Caveats
- Fonts load from Google Fonts (same as production); no binaries in repo.
- Wordmark PNGs are remote-only (Firebase Storage); only the app-icon mark is local.
