# CareerVivid Heartbeat Index

Owner: Lead Codex / Senior PM coordination
Last updated: 2026-06-01

## Purpose

CareerVivid can have more than one heartbeat for a project. This index keeps those heartbeat prompts discoverable and prevents a temporary QA, release, or worker-monitor heartbeat from replacing the strategic weekly heartbeat.

## Heartbeat Creation Rule

When a new heartbeat is needed:

1. Create a markdown record for the heartbeat before or immediately after creating the automation.
2. Keep the weekly strategic heartbeat as the root source of truth.
3. Add a `Heartbeat Chain` section at the bottom of every heartbeat document.
4. In that chain, link to the immediate previous heartbeat and the root weekly heartbeat.
5. If the active automation is temporary, include a restore note that points back to the root weekly heartbeat prompt.
6. Update this index and `docs/pm/agent-progress-board.md`.

## Naming

Use one of these paths:

- Strategic/root heartbeat: `docs/pm/cto-strategic-heartbeat.md`
- PM or product heartbeat: `docs/pm/heartbeats/YYYY-MM-DD-short-purpose.md`
- Security heartbeat: `docs/security/heartbeats/YYYY-MM-DD-short-purpose.md`
- Agency heartbeat: `docs/agency-partnerships/heartbeats/YYYY-MM-DD-short-purpose.md`

If a folder does not exist yet, create it with the first heartbeat.

## Required Footer

Every heartbeat markdown file should end with this shape:

```md
## Heartbeat Chain

- Current heartbeat: `path/to/current-heartbeat.md`
- Previous heartbeat: `path/to/previous-heartbeat.md` or `None; this is the root heartbeat.`
- Root weekly heartbeat: `docs/pm/cto-strategic-heartbeat.md`
- Restore note: When this temporary heartbeat is complete, restore or recreate the weekly strategic heartbeat from the root prompt.
```

## Current Heartbeats

| Heartbeat | File | Purpose | Status | Previous | Root |
|---|---|---|---|---|---|
| CTO strategic weekly heartbeat | `docs/pm/cto-strategic-heartbeat.md` | Product, revenue, CTO, lifecycle, and release-readiness review for the 30-day revenue sprint | Root / restorable | None | Self |

## Operating Notes

- Do not overwrite the root weekly heartbeat when a one-off QA heartbeat is needed.
- Temporary heartbeats should be narrow and should end with a clear return path to the weekly heartbeat.
- If multiple temporary heartbeats exist, chain them in order so an agent can walk backward through the decisions.
- The final temporary heartbeat in a chain should explicitly say whether to restore the weekly heartbeat automation.
