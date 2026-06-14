# Next.js Public Page Migration Tooling

This folder contains the migration tooling for moving CareerVivid public SEO pages from the Vite SPA shell into static/exported Next.js pages.

## Commands

```bash
npm run next-migration:audit
npm run next-migration:deps
npm run next-migration:verify-hosting
npm run next-migration:verify-hybrid -- http://127.0.0.1:5002
```

## Tools

- `ts-morph`: TypeScript-aware public route and dependency inspection.
- `jscodeshift`: codemods for repeatable source transforms.
- `madge`: dependency graph inspection for import coupling.
- `verify-hosting-rewrites.mjs`: checks that migrated public routes have Firebase Hosting rewrites pointing at exported Next HTML files.
- `verify-hybrid-runtime.mjs`: checks a running Firebase Hosting emulator and verifies public routes serve Next HTML while private/editor routes serve the Vite shell.

## Rules

- Audit first, then migrate one public page at a time.
- Keep authenticated app routes in Vite.
- Do not add Firebase Hosting rewrites until a page has build, SEO-source, and visual parity evidence.
- Review codemod output in dry-run mode before applying.
