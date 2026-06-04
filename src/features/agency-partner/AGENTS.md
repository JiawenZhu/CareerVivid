# Agency Partner Frontend Guardrails

Read first: `docs/agency-partnerships/AGENCY_AGENT_GUARDRAILS.md`.

Required skill context before UI/copy work:

- `careervivid-design-system`: `/Users/jiawenzhu/.codex/skills/careervivid-design-system/SKILL.md`
- `careervivid-email-marketing`: `/Users/jiawenzhu/.codex/skills/careervivid-email-marketing/SKILL.md`

This directory is the allowed frontend workspace for agency partnership work.

Allowed here:

- Agency pages and page wrappers
- Agency UI components
- Agency hooks
- Agency frontend services
- Agency frontend types
- Agency tests

Do not edit CareerVivid core frontend files from an agency task unless Evan explicitly approves a minimal integration exception. If a route, admin nav item, shared type export, or Firestore rule is needed, keep the edit small and document it in the handoff.

New agency logic should be placed here instead of expanding legacy files under `src/pages/`, `src/services/`, or `src/utils/`.
