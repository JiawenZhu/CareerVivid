# Agency Partner Functions Guardrails

Read first: `docs/agency-partnerships/AGENCY_AGENT_GUARDRAILS.md`.

Required skill context before backend email, invite, notification, or CTA work:

- `careervivid-design-system`: `/Users/jiawenzhu/.codex/skills/careervivid-design-system/SKILL.md`
- `careervivid-email-marketing`: `/Users/jiawenzhu/.codex/skills/careervivid-email-marketing/SKILL.md`

This directory is the allowed Cloud Functions workspace for agency partnership backend work.

Allowed here:

- Agency branch setup
- Agency prep session creation and updates
- Candidate consent and share helpers
- Agency demo seeding
- Agency validation and serialization
- Agency backend tests

Do not add agency-specific business logic to broad shared function files. If a trigger export, Firestore rule, or index change is required, keep it minimal and document it as an integration exception.
