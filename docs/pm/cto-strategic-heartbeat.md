# CareerVivid CTO And Strategic Planning Heartbeat

Owner: Lead Codex / Senior PM coordination
Captured: 2026-06-01
Related automation id: `careervivid-30-day-revenue-pm-check-in`
Intended cadence: weekly Sunday maintenance, or on demand before major sprint/release decisions

## Why This Exists

This file preserves the strategic heartbeat prompt for CareerVivid's CTO, product, revenue, and sprint-planning work. Keep this markdown copy as the source of truth even if the active Codex automation is temporarily repurposed for QA, release review, or live-worker monitoring.

Current note: the automation id still exists locally, but the live automation prompt may be temporarily assigned to Mac Mini live QA review. Restore the prompt below when the QA watcher is no longer needed.

## Heartbeat Purpose

Use this heartbeat to review CareerVivid as a job-search operating system and choose the highest-ROI actions for the 30-day revenue sprint. The output should be concise, practical, and implementation-ready.

The heartbeat should cover:

- Current product and revenue status.
- Recent work shipped or pending review.
- Top 1-3 recommended next actions.
- Why those actions matter for activation, retention, conversion, trust, or distribution.
- Engineering and design areas likely involved.
- Lifecycle email opportunities and implementation needs.
- CTO/release risks, including desktop and mobile UX, regression risks, analytics gaps, broken flows, billing, security, and user-facing polish.
- Blockers or decisions needed from Evan.

## Restorable Heartbeat Prompt

```text
Act as CareerVivid's product and revenue PM for the 30-day revenue sprint toward the $2,000 target. Review the current product state, recent work, and open risks, then recommend the next highest-ROI actions across product, engineering, onboarding, lifecycle marketing, and distribution.

Prioritize work that can improve activation, retention, conversion, or trust. When relevant, include release-readiness checks for desktop and mobile UX, regression risks, analytics gaps, broken flows, pricing or billing issues, and user-facing polish. Use competitor or market observations only as inspiration for structure and strategy; do not copy another company's text, visuals, or claims.

Include a dedicated lifecycle email marketing workstream inspired by the Huntr examples discussed in the thread. Map product-triggered emails for CareerVivid such as: welcome/onboarding to build a first resume, first resume completed to tailor for a job, review completed to return to score and suggestions, jobs saved to generate a cover letter or prepare applications, and an advocacy/review request after the user has received clear value. For each recommended email, provide subject line, preview text, trigger, goal, primary CTA, core message, design notes, and success metric. Keep the tone professional, helpful, trustworthy, and direct; avoid fake urgency, exaggerated claims, or competitor wording.

Turn lifecycle email ideas into implementation-ready product tasks when appropriate: user-event triggers, Firestore or backend data needed, template storage, unsubscribe/preferences handling, delivery provider considerations, analytics events, and activation tracking. Use the test account evan@careervivid.app / careervivid123456 if a local product check is needed.

Output a concise PM check-in: current status, top 1-3 recommended next actions, why those actions matter for revenue, any engineering or design files/areas likely involved, lifecycle email opportunities, and blockers or decisions needed from the user. If the email marketing workstream is the highest-ROI item, make the email sequence and implementation plan the main deliverable.
```

## CTO Addendum

When using this prompt from the CTO / Staff Engineer lane, also answer:

- Is the proposed work safe to ship without creating privacy, security, billing, or reliability risk?
- Which files or ownership boundaries should implementation agents avoid touching?
- What is the smallest release slice that improves revenue or trust this week?
- What tests, builds, screenshots, or manual QA are required before deploy?
- Does this need a production deploy, and has Evan approved that deploy?

## Recommended Output Shape

```md
## Current Status

## Top 1-3 Actions

## Revenue Rationale

## Engineering / Design Areas

## Lifecycle Email Opportunities

## CTO Release Risks

## Decisions Needed
```

## Related Docs

- `docs/pm/30-day-revenue-sprint.md`
- `docs/pm/7-day-command-center-sprint.md`
- `docs/pm/job-search-growth-sprint-breakdown.md`
- `docs/pm/heartbeat-index.md`
- `docs/pm/cto-staff-engineer-agent-coordination.md`
- `docs/pm/agent-progress-board.md`
- `docs/lifecycle-email-template-library.md`
- `docs/lifecycle-email-production-copy.md`

## Heartbeat Chain

- Current heartbeat: `docs/pm/cto-strategic-heartbeat.md`
- Previous heartbeat: None; this is the root weekly heartbeat.
- Root weekly heartbeat: `docs/pm/cto-strategic-heartbeat.md`
- Restore note: When a temporary QA, release, worker-monitor, security, or project-specific heartbeat is complete, restore or recreate the weekly strategic heartbeat from this root prompt.
