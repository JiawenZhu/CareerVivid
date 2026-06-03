# CareerVivid CTO / Staff Engineer Agent Coordination Log

Owner: Lead Codex acting as CareerVivid CTO + Staff Software Engineer
Started: 2026-05-31
Last updated: 2026-05-31

## Purpose

This file tracks when lead Codex should coordinate with other agents, what each agent owns, and the short memo that should be written after each meaningful coordination point.

The goal is to keep CareerVivid moving toward the 30-day revenue sprint without agents colliding, duplicating work, or changing product/security boundaries without review.

## Lead Review Role

Lead Codex reviews agent output as both CTO and Staff PM:

- CTO lens: correctness, security, privacy, performance, code ownership, tests, release risk, deploy scope.
- Staff PM lens: activation, retention, conversion, trust, demoability, sales value, user friction.
- Release lens: whether work is safe to ship, needs review, or should be blocked.

Default review stance: lead with findings, then decisions, then next actions.

## Target Agent Model

This is the working agent structure from the 2026-05-31 planning conversation. Use it when splitting future CareerVivid work.

| Role | Status | Primary Ownership | Should Not Own |
|---|---|---|---|
| Lead Codex | Active | CTO/staff engineer reviewer, integrator, final technical judgment, release scope, cross-agent coordination | Unreviewed broad implementation without task boundaries |
| Senior PM / Research / SWE | Active | Product strategy, sprint direction, revenue prioritization, research, acceptance criteria, agency and lifecycle strategy | Final security gate or production deploy decision |
| Security Agent | Active | Weekly security review, Dependabot, audits, access-control findings, release security gate | Product UX changes, pricing, broad refactors, deploy/merge |
| Release QA + Performance Agent | Planned | Speed, mobile quality, regression screenshots, Lighthouse/Web Vitals, shared resume performance, interview studio load/close behavior | Product strategy or security remediation |
| Growth + Lifecycle Agent | Planned | Activation, retention, conversion, lifecycle emails, onboarding funnel, upgrade CTA audit, analytics events | Core security gate or large product architecture |

Default expansion rule: do not add more agents until the current agents have a clear backlog and the next agent has a non-overlapping lane. Add Release QA + Performance before Growth + Lifecycle if the next release is blocked by speed, mobile, or regression risk. Add Growth + Lifecycle first if the product is stable but activation or conversion is the bottleneck.

## Communication Cadence

| Agent / Workstream | Agent ID / Location | Cadence | Trigger | Lead Codex Action |
|---|---|---|---|---|
| Senior PM | `019e7e8c-a598-7903-9553-4f496f23c55c` | Weekly Sunday after PM sprint update; daily only during urgent revenue decisions | New sprint priorities, blocked PM decision, revenue direction change | Align product priorities, confirm implementation lanes, update `docs/pm/30-day-revenue-sprint.md` if needed |
| Security Agent | `019e7343-58e9-7a53-ae19-94a3a1239efd` | Weekly Monday after security review; immediate if release is blocked | Dependabot alert, audit finding, access-control risk, deploy-readiness claim | Review evidence, confirm gate status, update `docs/security/weekly-security-tracker.md` |
| Agency Partner Agents | Claude Code, Antigravity, Codex agency workers | Weekly Friday or after agency work completion | Agency dashboard, prep sessions, consent/share helpers, demo seeding, docs/spreadsheets | Enforce guardrails, review B2B sales value, verify no core-code sprawl |
| Implementation Agents | Any coding sub-agent | At task claim and task completion | New implementation task or handoff | Check scope, files touched, tests, build, QA, deploy requirement |
| Lead Codex Self-Review | This thread | Daily during active sprint, otherwise weekly | Large diff, release prep, user asks for status | Reconcile progress board, sprint doc, security tracker, and blockers |

## Standing Coordination Rules

- Agents must not deploy production without Evan's explicit approval.
- Agents should claim or update work in `docs/pm/agent-progress-board.md` before implementation.
- Agency-specific work stays in:
  - `src/features/agency-partner/`
  - `functions/src/agencyPartner/`
  - `docs/agency-partnerships/`
- Security work defaults to `/Users/jiawenzhu/Developer/careervivid-release`.
- Security findings need evidence from Dependabot, npm audit, code review, tests, or Firebase rules review.
- PM work should produce implementation-ready tasks, not broad product wishes.
- Lead Codex should review completed agent work before merge, deploy, or public rollout.

## Memo Format

Use this format after meaningful communication:

```md
### YYYY-MM-DD - Agent / Workstream

- Contacted:
- Reason:
- What they found:
- Lead Codex judgment:
- Decision:
- Follow-up owner:
- Next communication date:
```

## Memo Log

### 2026-05-31 - Senior PM

- Contacted: `019e7e8c-a598-7903-9553-4f496f23c55c`
- Reason: Evan asked lead Codex and Senior PM to split work for the 30-day revenue sprint.
- What they found: The sprint needs clean lanes so product strategy and implementation do not collide.
- Lead Codex judgment: Senior PM should own revenue strategy, weekly sprint framing, agency pilot packaging, lifecycle conversion map, and implementation-ready acceptance criteria. Lead Codex should own scoped implementation, QA, security/release review, and deploy readiness.
- Decision: Senior PM lane and implementation lane were documented in the message sent to that thread.
- Follow-up owner: Senior PM owns PM docs and prioritization; lead Codex owns implementation/review.
- Next communication date: 2026-06-07, or sooner if PM decisions block implementation.

### 2026-05-31 - Security Agent

- Contacted: `019e7343-58e9-7a53-ae19-94a3a1239efd`
- Reason: Evan asked the security agent and lead Codex to coordinate and report today's security status.
- What they found: Dependabot returned zero open alerts, audits were clean across root/functions/next-app/remotion-commercial/mcp-server, and the local public resume API guard is valid. Release remains blocked by public root `users/{userId}` reads in Firestore rules.
- Lead Codex judgment: Security status is `BLOCKED`. Clean dependency/audit status is not enough while root user docs are publicly readable and the public resume API fix is uncommitted.
- Decision: Do not deploy. Fix or redesign public user-doc reads, commit/push the public resume API guard, open a security PR, rerun GitHub checks, then reassess deploy readiness.
- Follow-up owner: Security agent owns security patch/report. Lead Codex reviews before merge/deploy.
- Next communication date: 2026-06-01 after the scheduled weekly security review, or immediately if the access-control patch is ready.

## Upcoming Communication Queue

| Date | Agent / Workstream | Agenda |
|---|---|---|
| 2026-06-01 | Security Agent | Review Firestore user-doc access fix, public resume API guard, PR/check status, deploy-readiness gate |
| 2026-06-02 | Implementation Agents | Confirm command center P0 work: shared resume speed, next action, follow-up, extension save/analyze |
| 2026-06-06 | Agency Partner Agents | Review agency pilot flow, consent/readiness, demo branch, pipeline tracker updates |
| 2026-06-07 | Senior PM | Refresh 30-day revenue sprint, revenue blockers, top 1-3 actions, lifecycle email priorities |

## Review Checklist For Agent Work

- Did the agent stay in its assigned lane?
- Did it touch only expected files?
- Did it preserve privacy, consent, billing, and auth boundaries?
- Did it improve the 30-day revenue sprint path?
- Did it run the right tests/builds?
- Did it document deploy scope?
- Is the work ready to ship, needs review, or blocked?
