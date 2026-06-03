# CareerVivid Documentation Map

Use this folder for planning, research, launch handoffs, security notes, and business-development artifacts. Keep the repository root focused on app code, package/config files, and the primary `README.md`.

## Core Areas

| Folder | Purpose |
| --- | --- |
| `agency-partnerships/` | Agency partner pilot plan, implementation tracker, and agency pipeline tracker. |
| `chrome-extension-publish/` | Chrome extension roadmap, implementation progress, publication prep, and store assets. |
| `competitive-research/` | Competitor analysis and market research that is not source code. |
| `community/content/` | Ignored draft community articles, case studies, guides, and interview notes. |
| `hackathon/` | Hackathon plans and judge-facing strategy documents. |
| `security/` | Security audit logs, branch protection setup, and security process notes. |
| `pm/` | Product management plans and revenue sprint materials. |
| `resumes/` | Resume drafts, tailored resumes, and related career documents. |
| `guides/` | General workflows and long-form technical guides. |
| `diagrams/` | Mermaid architecture and data-model diagrams. |
| `cli/` | CLI-specific documentation. |

## Root Folder Rule

New standalone Markdown or spreadsheet artifacts should usually go under `docs/` unless they are required by a package manager, GitHub, Firebase, or the app runtime.

## Local Workspace Rule

Ignored local tools, scratch repos, and old manual backups belong under `.local-workspaces/` instead of the project root. Current local-only folders there include `browser-use/`, `cli/`, `claude-code-source-code/`, `backups/`, and `marketing-studio/`.

Non-code marketing exports, videos, rendered Remotion outputs, Chrome Web Store ZIPs, local avatars, and local security credential setup files are ignored by default. Keep durable instructions and audit notes under `docs/`; keep credential files out of the repo.
