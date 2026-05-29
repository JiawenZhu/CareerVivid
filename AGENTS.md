# CareerVivid Agent Coordination

## Canonical Worktree

Use this clean worktree for coordinated production work:

```bash
cd /Users/jiawenzhu/Developer/careervivid-release
```

Current baseline branch:

```bash
codex/live-stable-baseline-20260529
```

Do not use `/Users/jiawenzhu/Developer/careervivid` for new production work unless the user explicitly asks for it. That worktree has unrelated in-progress changes and should not be treated as the clean deploy base.

## Ownership

- Lead Codex owns overall product direction, design quality, feature development, deployment sequencing, release safety, and final integration.
- Security Autofix owns security-focused work only: dependency alerts, auth/redirect hardening, secret exposure, CORS, Firebase rules/functions security, and regression tests for those fixes.
- Security Autofix should not redesign UI, roll back product features, change audio/interview logic, alter dashboard/portfolio/editor layouts, or deploy hosting unless the user and Lead Codex explicitly approve.

## Security Workflow

1. Start from `/Users/jiawenzhu/Developer/careervivid-release`.
2. Check `git status --short --branch` before editing.
3. Create a task branch from the clean baseline for each fix.
4. Use GitHub Dependabot as the required source of truth when GitHub is reachable.
5. Do not depend on removed or unavailable scanner integrations; use Dependabot plus local audits as the baseline workflow.
6. Keep security changes minimal, reviewable, and scoped to the finding.
7. Preserve existing product behavior and visual design unless the security finding requires a narrow product-facing change.
8. Run targeted tests for touched code, plus the relevant build command before marking work ready.

## Deploy Safety

- Do not deploy from a dirty worktree.
- Do not deploy from `/Users/jiawenzhu/Developer/careervivid`.
- For hosting-only web changes, prefer:

```bash
npm run build && firebase deploy --only hosting
```

- Deploy Cloud Functions only when function code changed.
- After any hosting deploy, verify that live asset URLs under `/assets/*.js` return JavaScript, not `text/html`.
- Do not undo the service-worker and Firebase hosting cache safeguards added after the stale chunk incident.

## Current Incident Context

The previous live break was caused by stale cached SPA HTML being served for hashed JavaScript chunks, producing strict MIME errors such as:

```text
Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html"
```

The clean release branch includes safeguards for SPA rewrites and service-worker caching. Future changes should preserve those protections.
