# CareerVivid Public SEO Next.js Migration Plan

## Objective

Improve Google indexing for CareerVivid public pages without changing the logged-in React/Vite product experience.

The migration should be incremental: keep the current Vite app as the owner of authenticated workspace routes, and use Next.js only for public, indexable pages where server-rendered or statically exported HTML gives Google clearer content, metadata, canonical URLs, structured data, and sitemap alignment.

## Current Decision

- Keep Vite for application routes such as dashboard, resume editing, job tracking, interview studio, application tools, and authenticated workflows.
- Use Next.js for public pages only: home, product, pricing, contact, privacy, terms, partners, topic pages, and selected stable marketing/blog pages.
- Preserve the current CareerVivid warm editorial design system and product UI screenshots. The migration is not a redesign.
- Migrate one page first, prove visual and SEO parity, then expand page by page.

## Why Not A Full Rewrite

A full Vite-to-Next rewrite would create unnecessary risk:

- The current app has many client-only workflows: Firebase auth, job tracker state, resume editor flows, Chrome extension bridges, dashboard data, and browser APIs.
- Recreating these inside Next.js would increase UI drift and regression risk.
- Google indexing only needs stable public pages to render strong HTML. Authenticated app pages should generally stay out of the index.

## Open Source Toolchain

Use well-known open source tools to reduce manual migration work.

### Official Next.js Migration Guidance

Use the official Next.js Vite migration guide as the baseline for routing, asset handling, environment variables, metadata, and build behavior.

### `@next/codemod`

Use official Next.js codemods where they apply to framework-level upgrades and Next-specific source changes.

Expected use:

- Keep the existing `next-app` aligned with supported Next conventions.
- Apply official transformations before writing custom codemods.
- Avoid hand-editing repeated framework patterns.

### `jscodeshift`

Use `jscodeshift` for CareerVivid-specific source transforms.

Candidate codemods:

- Convert selected route component wrappers into Next page files.
- Replace `react-helmet-async` metadata usage with static Next metadata exports where possible.
- Rewrite import paths for shared public components.
- Insert `"use client"` only for components that truly need hooks, browser APIs, Firebase client SDKs, animation state, or interactive controls.
- Flag unsupported usage of `window`, `document`, `localStorage`, `sessionStorage`, `navigator`, and `chrome.*` in candidate public pages.

### `ts-morph`

Use `ts-morph` when TypeScript-aware analysis is safer than text-based codemods.

Expected use:

- Build a dependency graph for each public page candidate.
- Identify whether a component can be server-rendered or must remain client-side.
- Detect imports from authenticated/product-only modules.
- Generate migration reports before moving code.

### `dependency-cruiser` Or `madge`

Use one dependency graph tool to prevent accidental coupling between public Next pages and private app code.

Expected use:

- Trace every dependency imported by a public page.
- Block imports from dashboard, auth-only, extension, interview runtime, resume editor internals, and Firebase mutation modules unless intentionally wrapped.
- Produce a route dependency report before each page migration.

### Playwright Visual Regression

Use Playwright screenshots to prevent UI drift.

Expected use:

- Compare Vite `/product` with Next `/product` before routing traffic to Next.
- Test desktop and mobile widths.
- Catch typography, spacing, color, and product mockup differences.

## Current Repo Considerations

The repo already has a hybrid shape:

- Vite builds the main app into `dist`.
- `next-app` exists and can export static pages.
- The build script already copies `next-app/out` into `dist/nextjs`.
- Firebase Hosting already has `_next` asset routing and some exact Next page rewrites.

The risky part is that `next-app` currently uses a different app stack from the main Vite app. Before migrating pages, align the public-page styling contract:

- Reuse or mirror the current CareerVivid global CSS and design tokens.
- Keep Tailwind behavior compatible with the Vite app where public pages depend on existing classes.
- Avoid rebuilding public UI from scratch in a separate visual language.

## Migration Scope

### In Scope

Public pages that should be indexable:

- `/`
- `/product`
- `/pricing`
- `/contact`
- `/privacy`
- `/terms`
- `/partners`
- `/partners/academic`
- `/partners/business`
- `/partners/agency`
- `/partners/hiring`
- `/partners/students`
- `/topic/*`
- Selected stable blog/article pages after content review

### Out Of Scope

Keep these in Vite and exclude from SEO migration:

- `/dashboard`
- `/job-tracker`
- `/newresume`
- `/interview-studio`
- `/jobs/recommend`
- Resume editor internals
- Portfolio/editor workspaces
- Community authenticated views
- Chrome extension surfaces
- Any route requiring authenticated Firebase state

## Phase Plan

### Phase 0: Safety Snapshot

Before implementation:

1. Confirm the working tree and branch.
2. Commit this plan separately.
3. Do not stage unrelated dirty work unless the user explicitly asks.
4. Do not deploy from a dirty worktree.

### Phase 1: Automated Public Route Audit

Create scripts under `scripts/next-migration/`.

Outputs:

- Public route list.
- Candidate component path.
- Metadata source.
- Client-only API usage.
- Dependency graph.
- Migration risk rating.
- Suggested Next target path.

Recommended scripts:

- `scripts/next-migration/audit-public-routes.mjs`
- `scripts/next-migration/trace-page-deps.mjs`
- `scripts/next-migration/report-client-only-usage.mjs`

### Phase 2: Tooling And Codemod Setup

Add migration tooling without changing runtime behavior.

Expected additions:

- `jscodeshift` codemods under `scripts/next-migration/codemods/`.
- `ts-morph` analysis helpers.
- One dependency graph tool.
- Documentation on running audits.

No Firebase rewrites should change in this phase.

### Phase 3: First Page Pilot

Start with `/product`.

Goals:

- Render the same public product page in Next.
- Preserve the same visible layout and CareerVivid design system.
- Ensure source HTML contains the main headline, body copy, canonical URL, Open Graph metadata, and structured data.
- Run side-by-side Playwright screenshots against the current Vite page.

Exit criteria:

- `npm run build` passes.
- Vite `/product` and Next `/product` screenshots match within an agreed threshold.
- Page source contains useful indexable content without requiring client hydration.
- No private dashboard/auth modules are pulled into the public Next bundle.

### Phase 4: Firebase Exact Rewrite

After the pilot page passes:

- Add an exact Firebase Hosting rewrite for `/product` to the exported Next HTML.
- Keep the Vite catch-all unchanged for the rest of the app.
- Verify `_next` assets return JavaScript/CSS assets, not HTML.

### Phase 5: Expand By Page Group

Recommended order:

1. `/product`
2. `/pricing`
3. `/contact`, `/privacy`, `/terms`
4. `/partners` and partner subpages
5. `/topic/*`
6. Stable blog/article pages

Each group must pass the same visual, build, route, and SEO checks before Firebase rewrites are expanded.

### Phase 6: Sitemap And Canonical Cleanup

Update sitemap generation only after migrated pages are stable.

Rules:

- Include only canonical, indexable public pages.
- Remove placeholder localized pages unless real translated content exists.
- Avoid submitting duplicate pages that point to the same content.
- Keep protected app routes out of sitemap.
- Add `hreflang` only for real localized pages with meaningful translated content.

## Acceptance Gates

Before any Next-rendered public page goes live:

- Build passes.
- Visual comparison passes on desktop and mobile.
- HTML source contains primary content.
- Metadata and canonical are correct.
- Page is included or excluded from sitemap intentionally.
- No authenticated route dependencies are imported.
- Firebase rewrite is exact and does not affect the Vite app catch-all.
- Live asset MIME types are correct after deploy.

## Rollback Strategy

Because this migration uses exact Firebase rewrites, rollback should be simple:

1. Remove the specific public-page rewrite.
2. Rebuild.
3. Deploy hosting only.
4. The Vite catch-all resumes serving that route.

Do not remove the current service-worker and hosting cache safeguards. They protect against stale hashed chunk failures.

## Commit Strategy

Use small commits:

1. `docs: plan public next seo migration`
2. `chore: add next migration audit tooling`
3. `feat: migrate product page to next export`
4. `test: add public page visual parity checks`
5. `chore: route product page through next hosting`

Avoid mixing unrelated dashboard, extension, billing, or security changes into the SEO migration commits.

## Immediate Next Step

Commit this plan first. Then build the automated audit scripts before moving any public page.
