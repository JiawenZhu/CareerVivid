# Agency Partner Agent Handoff Prompt

Use this prompt when handing agency work to Claude Code, Google Antigravity, Gemini, Codex, or another coding agent.

```text
You are working on CareerVivid's Agency Partner Pilot. This is a sales-critical product surface: the goal is to help staffing agencies see CareerVivid as a candidate preparation layer that saves recruiter time, improves candidate readiness, and creates a clear 14-day pilot path.

Read these guardrails first:
- docs/agency-partnerships/AGENCY_AGENT_GUARDRAILS.md
- src/features/agency-partner/AGENTS.md
- functions/src/agencyPartner/AGENTS.md

Load and follow these CareerVivid skills before changing UI, copy, dashboards, email, notification, invite, or CTA behavior:
- careervivid-design-system: /Users/jiawenzhu/.codex/skills/careervivid-design-system/SKILL.md
- careervivid-email-marketing: /Users/jiawenzhu/.codex/skills/careervivid-email-marketing/SKILL.md

Important boundary:
Work inside the agency module by default:
- src/features/agency-partner/
- functions/src/agencyPartner/
- docs/agency-partnerships/

Do not modify CareerVivid core code unless a small integration edit is truly required and explicitly documented.

Product mindset:
Study recruiting CRM/ATS workflows for inspiration: Ashby, Bullhorn, Greenhouse CRM, Lever, Gem, Crelate, Recruit CRM, Loxo, and similar staffing/recruiting tools. Do not copy their UI. Learn from their workflow logic: pipeline visibility, candidate readiness, stage movement, recruiter notes, activity timelines, source tracking, sharing controls, and team handoff patterns.

CareerVivid's agency product should feel like:
- A recruiter's prep command center
- Not an ATS replacement
- Not a candidate marketplace
- A zero-integration pilot that agencies can try quickly
- A privacy-first readiness workflow where candidates control resume/report sharing
- A CareerVivid-native workspace using the warm, calm, compact design system

Core flows to improve:
1. Agency branch dashboard
   - Prep Pipeline
   - Invite Link
   - Ready Reports
   - Pilot Metrics

2. Candidate prep portal
   - Select/create resume
   - Run AI Review/deep review
   - Improve readiness score
   - Share readiness only when ready

3. Admin agency navigation
   - Admin can find any agency branch quickly
   - Admin can open dashboards and copy invite links
   - Admin can demo the product without waiting on real agency data

4. Privacy model
   - Before consent: progress-only status
   - After consent: resume/report/PDF access allowed

5. Agency email and notification surfaces
   - Use real hydrated user/branch/session data
   - Use production CareerVivid routes only
   - Respect notification preferences and consent
   - Keep copy practical, warm, and recruiter/candidate focused

Be creative, but stay practical. Every screen should help Evan sell this to a local staffing agency: show time saved, candidate progress, readiness improvement, and clear next steps. Build things that make a demo easier, a pilot easier, and agency trust stronger.

Before handoff, run:
node scripts/check-agency-scope.mjs

If an approved integration edit was needed:
node scripts/check-agency-scope.mjs --allow-integration

In your handoff, clearly list:
- Files changed
- Any core integration exceptions
- Firestore collections affected
- Privacy/consent behavior affected
- Tests/builds run
- Demo steps
```
