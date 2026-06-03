# CareerVivid PM Docs

Last updated: 2026-05-31

This folder is the operating center for CareerVivid product and revenue sprint work.

## Current Priority

The active 7-day sprint is:

**CareerVivid Job Search Command Center**

CareerVivid should help an overwhelmed job seeker answer:

> What should I apply to, how do I stand out, who should I contact, and what should I do today?

The near-term product loop is:

1. Save a job.
2. Analyze fit.
3. Pick or tailor the right resume.
4. Generate the next outreach or application action.
5. Set a follow-up.
6. Prepare for the interview.
7. Track the result.

## Read These First

1. `docs/pm/7-day-command-center-sprint.md`
2. `docs/pm/command-center-feature-spec.md`
3. `docs/pm/job-search-growth-sprint-breakdown.md`
4. `docs/pm/agent-progress-board.md`
5. `docs/pm/agent-handoff-template.md`
6. `docs/pm/cto-staff-engineer-agent-coordination.md`
7. `docs/pm/cto-strategic-heartbeat.md`
8. `docs/pm/heartbeat-index.md`

Related docs:

- `docs/pm/30-day-revenue-sprint.md`
- `docs/pm/job-search-growth-sprint-breakdown.md`
- `docs/pm/cto-staff-engineer-agent-coordination.md`
- `docs/pm/cto-strategic-heartbeat.md`
- `docs/pm/heartbeat-index.md`
- `docs/chrome-extension-publish/quality-upgrade-roadmap.md`
- `docs/lifecycle-email-production-copy.md`
- `docs/lifecycle-email-template-library.md`
- `docs/agency-partnerships/agency-partnerships-overview.md`
- `docs/agency-partnerships/AGENCY_AGENT_GUARDRAILS.md`

## Agent Working Rules

- Before starting implementation, claim a task in `docs/pm/agent-progress-board.md`.
- Keep changes tightly scoped to the task you claimed.
- Update the progress board when you start, pause, block, finish, or hand off work.
- If touching UI, follow the CareerVivid design system skill:
  `/Users/jiawenzhu/.codex/skills/careervivid-design-system/SKILL.md`
- If touching lifecycle emails, follow:
  `/Users/jiawenzhu/.codex/skills/careervivid-email-marketing/SKILL.md`
- If touching agency-specific work, stay inside the agency guardrails:
  `docs/agency-partnerships/AGENCY_AGENT_GUARDRAILS.md`
- Do not deploy production without explicit approval from Evan.
- When creating a new heartbeat, add a markdown record and link it through `docs/pm/heartbeat-index.md` so the chain always points back to the weekly strategic heartbeat.

## Definition Of Done

A task is not done until the agent documents:

- files changed
- behavior changed
- tests/builds run
- manual QA performed
- known risks or follow-up work
- whether deploy is required
