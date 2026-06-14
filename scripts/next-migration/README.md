# Next.js Public Page Migration Tooling

This folder contains the migration tooling for moving CareerVivid public SEO pages from the Vite SPA shell into static/exported Next.js pages.

## Commands

```bash
npm run next-migration:audit
npm run next-migration:deps
```

## Tools

- `ts-morph`: TypeScript-aware public route and dependency inspection.
- `jscodeshift`: codemods for repeatable source transforms.
- `madge`: dependency graph inspection for import coupling.

## Rules

- Audit first, then migrate one public page at a time.
- Keep authenticated app routes in Vite.
- Do not add Firebase Hosting rewrites until a page has build, SEO-source, and visual parity evidence.
- Review codemod output in dry-run mode before applying.
