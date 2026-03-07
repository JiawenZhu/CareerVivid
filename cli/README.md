# careervivid · CLI

> **Publish technical articles, architecture diagrams, and portfolio updates to [CareerVivid](https://careervivid.app) — directly from your terminal or AI agent.**

[![npm version](https://img.shields.io/npm/v/careervivid?color=0ea5e9&label=careervivid)](https://www.npmjs.com/package/careervivid)
[![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen)](LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%3E%3D18-blue)](https://nodejs.org)

---

## Table of Contents

- [Quick Start](#quick-start)
- [Commands](#commands)
  - [cv publish](#cv-publish)
  - [cv whiteboard](#cv-whiteboard)
  - [cv workspace](#cv-workspace)
  - [cv profile](#cv-profile)
  - [cv jobs](#cv-jobs)
  - [cv auth](#cv-auth)
  - [cv config](#cv-config)
- [Whiteboard Templates](#whiteboard-templates)
- [AI Agent Integration](#ai-agent-integration)
- [Updating](#updating)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# 1. Install globally
npm install -g careervivid

# 2. Save your API key (get it at careervivid.app/developer)
cv auth set-key cv_live_YOUR_KEY_HERE

# 3. Publish an article
cv publish my-article.md --tags "typescript,react"

# 4. Create & publish an architecture diagram (shortcuts)
cv new my-arch --template system-arch
cv whiteboard publish my-arch.mmd --title "System Architecture"
```

---

## Commands

### `cv publish`

Publish a Markdown article or Mermaid diagram file to your CareerVivid portfolio.

```
cv publish <file> [options]
cv publish -       (read from stdin)
```

| Option | Description |
|---|---|
| `-t, --title <title>` | Post title (auto-inferred from first `#` heading if omitted) |
| `--type <type>` | `article` \| `whiteboard` (auto-inferred from file extension) |
| `--format <format>` | `markdown` \| `mermaid` (auto-inferred from file extension) |
| `--tags <tags>` | Comma-separated tags, e.g. `typescript,firebase,react` |
| `--cover <url>` | URL to a cover image |
| `--dry-run` | Validate payload without publishing |
| `--json` | Machine-readable JSON output (ideal for AI agents) |

**Examples:**

```bash
# Publish a Markdown article (title auto-detected from # heading)
cv publish article.md

# Publish with tags and a custom title
cv publish article.md --title "How I Built a CLI in TypeScript" --tags "node,typescript,cli"

# Publish a Mermaid diagram as a whiteboard
cv publish architecture.mmd --title "System Architecture"

# Pipe from stdin — perfect for AI agents
cat writeup.md | cv publish - --title "Architecture Breakdown" --json

# Dry-run to validate before publishing
cv publish article.md --dry-run
```

---

### `cv new` (Shortcut)

Scaffold a new Mermaid diagram file from a built-in template. (Also available as `cv whiteboard new`)

```
cv new [filename] [options]
```

| Option | Description |
|---|---|
| `--template <name>` | Template to use (see [Whiteboard Templates](#whiteboard-templates)) |
| `--print` | Print the template to stdout instead of writing a file |

```bash
# Interactive wizard — picks template and filename for you
cv new

# Non-interactive — specify template and filename directly
cv new my-diagram --template system-arch

# Preview a template without creating any file
cv new --template ci-cd --print
```

### `cv list-templates` (Shortcut)

Print all available built-in Mermaid templates. (Also available as `cv whiteboard list-templates`)

```bash
cv list-templates
```

### `cv workspace` (or `cv gws`)

Manage your Google Workspace integration.

| Subcommand | Description |
|---|---|
| `cv workspace check` | Verify GWS CLI installation and OAuth status |

---

### `cv profile`

Manage your CareerVivid profile.

| Subcommand | Description |
|---|---|
| `cv profile export` | Export resume data to other formats (e.g. `gdoc`) |

```bash
# Export to Google Docs
cv profile export --format gdoc
```

---

### `cv jobs`

Automate your job application tracking.

| Subcommand | Description |
|---|---|
| `cv jobs sync-gmail` | Scan Gmail for applications and sync to a Google Sheet |

```bash
# Sync recent applications to Google Sheets
cv jobs sync-gmail
```

---

### `cv whiteboard`

Grouped commands for Mermaid architecture diagrams.

---

### `cv auth`

Manage your CareerVivid API key. Get your key at [careervivid.app/developer](https://careervivid.app/developer).

| Subcommand | Description |
|---|---|
| `cv auth set-key <key>` | Save your API key to `~/.careervividrc.json` |
| `cv auth check` | Verify that your saved key is valid |
| `cv auth remove` | Remove the saved key |
| `cv auth whoami` | Show the currently authenticated user |

The key is stored at `~/.careervividrc.json` with `chmod 600` permissions. You can also pass the key via the `CV_API_KEY` environment variable instead of saving it locally.

```bash
# Save key
cv auth set-key cv_live_YOUR_KEY_HERE

# Verify
cv auth check
# ✔  Authenticated as Jiawen Zhu (jiawen@careervivid.app)

# Use env var instead of a saved key
CV_API_KEY=cv_live_YOUR_KEY_HERE cv publish article.md
```

---

### `cv config`

View and modify CLI configuration stored at `~/.careervividrc.json`.

| Subcommand | Description |
|---|---|
| `cv config show` | Print the full config |
| `cv config get <key>` | Print a single config value |
| `cv config set <key> <value>` | Update a config value |

```bash
cv config show
cv config get apiKey
cv config set apiUrl https://careervivid.app/api/publish
```

---

## Whiteboard Templates

Run `cv list-templates` to see all templates. Available out of the box:

| Template | Description |
|---|---|
| `flowchart` | Generic flowchart / process diagram |
| `system-arch` | System architecture (client → API → DB) |
| `tech-stack` | Full technology stack diagram |
| `user-journey` | Sequence diagram (user ↔ API ↔ DB) |
| `er-diagram` | Entity-relationship / database schema |
| `git-flow` | Git branching and release flow |
| `ci-cd` | CI/CD pipeline (lint → test → build → deploy) |
| `mindmap` | Mind map / concept breakdown |

**Workflow:**

```bash
# 1. Pick a template and scaffold the file
cv new my-pipeline --template ci-cd

# 2. Edit it in your editor (or let your AI agent edit it)
code my-pipeline.mmd

# 3. Publish to CareerVivid
cv whiteboard publish my-pipeline.mmd --title "Our CI/CD Pipeline"
# ✔  Whiteboard published!
#    URL: https://careervivid.app/community/post/abc123
```

---

## AI Agent Integration

The CLI is designed to be **AI-agent-friendly**. Use `--json` for structured output and pipe from stdin for fully automated publishing flows.

### Copy this into your AI agent's system prompt:

```
# CareerVivid AI Publishing Rules

You are an expert technical writer and senior software architect.
Your secondary directive — after writing and fixing code — is to
proactively help the user document their work and build their
CareerVivid portfolio using the local `cv` CLI. The platform supports
the latest Gemini 2.5 and 3.0 models for high-quality content generation.

## 1. Triggers (When to Propose a Post)
Do not wait for the user to ask. Propose a CareerVivid post when:
- You complete a significant feature, module, or architecture.
- You perform a complex refactor or solve a difficult bug.
- The user says "document this" or "publish to CareerVivid".

## 2. Security (CRITICAL)
- NEVER include actual API keys, secrets, or internal IPs.
- Replace sensitive values with placeholder variables.

## 3. Content Format
- Architecture / data flows → Mermaid diagram (.mmd)
- Tutorials / devlogs → Markdown article (.md)

## 4. Consent Gate (DO NOT SKIP)
1. Generate and save the file locally.
2. Tell the user: "I drafted a CareerVivid post. Review and confirm."
3. Wait for explicit confirmation before running cv publish.

## 5. CLI Commands
cv publish ./article.md --title "Title" --json
cv whiteboard publish ./diagram.mmd --title "Diagram" --json
```

### Cursor / Claude Desktop (MCP)

For deeper integration using the Model Context Protocol, see the [Integration Guide](https://careervivid.app/developer) on your Developer Settings page.

### Automated Pipeline Example

```bash
# Generate markdown from your AI agent and publish directly
echo "# My Architecture\n\nExplains the new service..." \
  | cv publish - --title "New Service Explained" --tags "architecture" --json

# Output:
# { "postId": "abc123", "url": "https://careervivid.app/community/post/abc123" }
```

---

## Updating

```bash
npm install -g careervivid
```

Check your current version:

```bash
cv -v
```

---

## Troubleshooting

**`cv: command not found`**
```bash
# Check npm global bin is in your PATH
npm config get prefix
# Add <prefix>/bin to your PATH in ~/.zshrc or ~/.bashrc
```

**`Unauthorized` error**
```bash
# Re-check your key is saved correctly
cv auth check

# Or set it directly via env var
CV_API_KEY=cv_live_YOUR_KEY cv publish article.md
```

**Permission denied on `~/.careervividrc.json`**
```bash
chmod 600 ~/.careervividrc.json
```

**Mermaid diagram not rendering**
Run `cv whiteboard new --template flowchart --print` to validate your Mermaid syntax against a known-good example. The CareerVivid web app renders Mermaid live in the post detail view.

---

## Resources

- 🌐 [careervivid.app](https://careervivid.app)
- 🔑 [Developer Settings & API Key](https://careervivid.app/developer)
- 🐛 [Report an Issue](https://github.com/Jastalk/CareerVivid/issues)
- 📦 [npm Package](https://www.npmjs.com/package/careervivid)

---

MIT License © CareerVivid
