# CareerVivid Weekly Security Tracker

Last updated: 2026-05-31
Primary security agent: `019e7343-58e9-7a53-ae19-94a3a1239efd`
Cadence: weekly, Monday morning

## Purpose

Keep CareerVivid's security work continuous, reviewable, and separated from product feature work.

The security agent should find and fix real security risk without changing product behavior, UI, pricing, billing, lifecycle copy, interview logic, or deployment settings unless a specific validated finding requires a narrow change.

## Operating Boundaries

- Default worktree: `/Users/jiawenzhu/Developer/careervivid-release`
- Default branch: `codex/live-stable-baseline-20260529`
- Default PR: `#78`
- Do not deploy.
- Do not merge to `main`.
- Do not auto-merge PRs.
- Do not force-push, reset, or rebase public history.
- Keep fixes small and reviewable.
- The lead Codex/user decides whether to merge or deploy.

## Weekly Source Of Truth

The security agent must check these every week:

1. GitHub Dependabot open alerts for `JiawenZhu/CareerVivid`.
2. Local `npm audit --audit-level=low` for each package root with a lockfile:
   - root
   - `functions`
   - `next-app`
   - `remotion-commercial`
   - `mcp-server`
3. Secret exposure search for newly introduced hardcoded credentials.
4. High-risk code patterns:
   - unsafe redirects
   - SSRF-prone URL fetches
   - unsanitized HTML / XSS surfaces
   - public Firebase rules changes
   - public resume and agency consent access paths
5. PR #78 merge-readiness and GitHub check status.

## Weekly Report Format

Each weekly security report should include:

- Date and agent id.
- Branch, PR URL, and head commit.
- Dependabot open-alert count and severity breakdown.
- Local audit result per package root.
- Code-review findings by class:
  - dependency
  - secret
  - XSS
  - SSRF
  - unsafe redirect
  - Firebase rules / access control
  - license or policy
- Files changed and why.
- Verification commands run and results.
- Whether PR #78 remains mergeable.
- Unresolved risks or manual follow-up.
- Clear recommendation:
  - `No action needed`
  - `Review security patch`
  - `Manual secret rotation needed`
  - `Block release until fixed`

## Current Weekly Status

| Week | Status | Summary | Required Action |
|---|---|---|---|
| 2026-05-31 | Blocked | Dependabot returned 0 open alerts and `npm audit --audit-level=low` was clean for root, `functions`, `next-app`, `remotion-commercial`, and `mcp-server`. Security agent found one local public resume API hardening patch in `functions/src/publicResumeApi.ts`, but release remains blocked by public root `users/{userId}` reads in `firestore.rules`. | Fix or intentionally redesign public user document access, commit/push the public resume API guard, open a security PR, rerun GitHub checks, then reassess deploy readiness. |

## Lead Review Standard

After the security agent finishes, lead Codex reviews the report as CareerVivid CTO:

- Confirm the finding is real and exploitable or dependency-backed.
- Confirm the fix is narrow and does not change product behavior.
- Confirm tests/builds match the affected area.
- Confirm no production deploy or merge was performed without approval.
- Confirm unresolved risks are explicit enough for Evan to decide.
