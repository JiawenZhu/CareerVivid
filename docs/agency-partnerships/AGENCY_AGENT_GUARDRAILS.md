# Agency Partner Agent Guardrails

Last updated: 2026-05-30

## Purpose

This file defines the working boundary for Claude Code, Google Antigravity, Codex, and any other coding agent assigned to the CareerVivid agency partnership product.

The agency partner MVP should be isolated from CareerVivid core code as much as practical. Agents may read shared CareerVivid code to understand contracts, but should write only inside the agency namespaces unless Evan explicitly approves a small integration edit.

## Required CareerVivid Skills

Before changing agency UI, copy, dashboard surfaces, candidate prep flows, or email/pilot messaging, agents should load and follow these local CareerVivid skills:

- `careervivid-design-system`: `/Users/jiawenzhu/.codex/skills/careervivid-design-system/SKILL.md`
- `careervivid-email-marketing`: `/Users/jiawenzhu/.codex/skills/careervivid-email-marketing/SKILL.md`

Apply the design system to agency dashboards, prep portals, admin panels, recruiter views, demo data screens, and public partner pages. The agency product should feel like CareerVivid: warm, calm, operational, compact, and sales-demo ready.

Apply the email marketing skill to any agency invite email, readiness notification, lifecycle email, demo send, Firestore `mail` queue document, notification preference gate, or CTA routing work. Agency emails must use real hydrated user data, production routes, and preference-aware delivery.

## Allowed Write Scope

Agents assigned to agency partnership work may create or edit files under:

- `src/features/agency-partner/`
- `functions/src/agencyPartner/`
- `docs/agency-partnerships/`

Firestore data owned by this product must stay in these namespaces:

- `agencyBranches`
- `agencyPrepSessions`
- `agencyPartnerApplications` if separate agency application records become necessary

Spreadsheet and planning artifacts for this product belong in:

- `docs/agency-partnerships/agency_partner_functionality_tracker.xlsx`
- `docs/agency-partnerships/agency_partner_pipeline_tracker.xlsx`
- Future agency partner tracker files under `docs/agency-partnerships/`

## Read-Only Shared Surfaces

Agency code may depend on these shared CareerVivid surfaces, but agents should not modify them without approval:

- Authentication and user profile providers
- Resume editor and resume data model
- AI Review and resume scoring utilities
- Public resume sharing
- Admin shell/navigation
- Existing partner application approval logic
- Firestore rules and indexes
- Root routing files
- Global design system, Tailwind config, package files, and deploy config

## Integration Exception Rule

If an agency feature absolutely requires a core integration edit, keep it minimal and document it in the handoff:

- Route registration, such as wiring a page from `src/features/agency-partner/` into the app router
- Firestore rules or indexes for `agencyBranches`, `agencyPrepSessions`, or `agencyPartnerApplications`
- Admin navigation entry that links to an agency screen
- A type export that makes an agency module consumable

Do not refactor unrelated CareerVivid modules while making these integration edits.

For an approved integration exception, the scope checker can be run with:

```bash
node scripts/check-agency-scope.mjs --allow-integration
```

## Current Transitional Files

Some agency MVP files currently exist outside the desired isolated namespace:

- `src/pages/AgencyPartnerDashboard.tsx`
- `src/pages/AgencyPreparePage.tsx`
- `src/pages/partners/AgencyPartnerPage.tsx`
- `src/services/agencyPartnerService.ts`
- `src/utils/agencyPartnerUtils.ts`

Future agency work should migrate new logic into `src/features/agency-partner/` and leave these files as thin wrappers or route adapters. Do not expand these transitional files with new business logic.

## Backend Boundary

New backend logic should live under `functions/src/agencyPartner/`:

- Branch setup
- Prep session creation and updates
- Consent and readiness sharing helpers
- Demo seeding
- Agency-specific validation and serialization

Do not add agency-specific business logic to broad shared function modules unless it is a minimal export or trigger registration.

## Privacy Guardrail

The agency product defaults to progress-only before candidate consent.

Before consent, agency-facing reads may include:

- Candidate name and email when the candidate has started a prep session
- Prep status
- Starting score
- Latest score
- Score delta
- Readiness state
- Timestamps

Before consent, agency-facing reads must not expose:

- Full resume content
- Resume PDF
- AI Review details
- Readiness report details
- Private profile fields unrelated to agency preparation

Full resume/report access requires explicit candidate consent.

## Pre-Handoff Scope Check

Before handing agency work back, run:

```bash
node scripts/check-agency-scope.mjs
```

The checker flags modified files outside the agency namespace. If an integration edit is intentional, list it in the handoff and explain why it was necessary.

## Handoff Format

Every agency handoff should include:

- Files changed
- Whether any core integration exceptions were touched
- Firestore collections or indexes affected
- Privacy/consent behavior affected
- Tests/builds run
- Manual verification steps
