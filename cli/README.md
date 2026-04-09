# careervivid · CLI

> **Your AI-powered career terminal — publish articles, run autonomous job-hunting agents, and build your portfolio from the command line.**

[![npm version](https://img.shields.io/npm/v/careervivid?color=0ea5e9&label=careervivid)](https://www.npmjs.com/package/careervivid)
[![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen)](LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%3E%3D18-blue)](https://nodejs.org)

---

## Table of Contents

- [Quick Start](#quick-start)
- [Commands](#commands)
  - [cv agent](#cv-agent) ⭐ **New**
  - [cv publish](#cv-publish)
  - [cv jobs](#cv-jobs)
  - [cv whiteboard](#cv-whiteboard)
  - [cv workspace](#cv-workspace)
  - [cv profile](#cv-profile)
  - [cv auth](#cv-auth)
  - [cv login](#cv-login)
  - [cv config](#cv-config)
- [AI Credits](#ai-credits)
- [Bring Your Own API Key (BYO)](#bring-your-own-api-key-byo)
- [Whiteboard Templates](#whiteboard-templates)
- [AI Agent Integration (MCP / CI)](#ai-agent-integration-mcp--ci)
- [Updating](#updating)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# 1. Install globally
npm install -g careervivid

# 2. Log in and get your free API key
cv login
# → opens careervivid.app/developer in your browser
# → copy your API key, then:
cv auth set-key cv_live_YOUR_KEY_HERE

# 3. Start the AI agent (uses your free AI credits)
cv agent

# 4. Or publish an article
cv publish my-article.md --tags "typescript,react"
```

> **Free tier includes 100 AI credits/month** — no credit card required.

---

## Commands

---

### `cv agent`

An **autonomous AI agent** that runs interactively in your terminal. Powered by Gemini models via the CareerVivid platform — credits deducted from your account automatically.

```bash
cv agent                  # General-purpose agent (Gemini Flash Lite)
cv agent --resume         # Load & discuss your CareerVivid resume
cv agent --jobs           # Job-hunting mode: search, save, update applications
cv agent --coding         # Full coding toolkit: file I/O, shell execution, search
cv agent --pro            # Gemini Pro with extended thinking (best for complex tasks)
```

**Options:**

| Option | Description |
|---|---|
| `--resume` | Add resume tools — load and discuss your CareerVivid resume |
| `--jobs` | Add job-hunting tools — search jobs, save to tracker, update statuses |
| `--coding` | Enable full coding tool suite (file read/write, shell, search) |
| `--pro` | Use `gemini-3.1-pro-preview` with thinking mode |
| `--think <budget>` | Enable thinking mode with a specific token budget (e.g. `8192`) |
| `--verbose` | Show thinking tokens in output (requires `--think` or `--pro`) |
| `--provider <name>` | Override provider: `careervivid` \| `openai` \| `anthropic` \| `openrouter` \| `gemini` \| `custom` |
| `--model <model>` | Override model (e.g. `gpt-4o`, `claude-opus-4-5`) |
| `--api-key <key>` | BYO API key for this session (not saved) |
| `--base-url <url>` | Custom OpenAI-compatible base URL |

**Examples:**

```bash
# Start a job search conversation
cv agent --jobs

# Analyze your resume with AI
cv agent --resume

# Use your own OpenAI key (no credits deducted)
cv agent --provider openai --model gpt-4o --api-key sk-...

# Use Anthropic Claude
cv agent --provider anthropic --model claude-opus-4-5 --api-key sk-ant-...

# Pro mode for complex analysis
cv agent --pro --resume --jobs
```

**Configure your default provider:**

```bash
cv agent config
# → Interactive wizard: pick provider, model, API key
```

---

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

```bash
cv publish article.md --title "How I Built a CLI" --tags "node,typescript"
cv publish architecture.mmd --title "System Architecture"
cat writeup.md | cv publish - --title "Architecture Breakdown" --json
```

---

### `cv jobs`

Automate your job application tracking with AI.

| Subcommand | Description |
|---|---|
| `cv jobs hunt` | AI-powered job search scored against your resume → auto-saves to job tracker |
| `cv jobs update` | Interactively update a job application status on your Kanban board |
| `cv jobs list` | View your current job tracker board |

```bash
cv jobs hunt --role "Software Engineer" --score 60
cv jobs list
cv jobs update
```

> **Tip:** Use `cv agent --jobs` for a conversational job-hunting experience instead.

---

### `cv whiteboard`

Create and publish Mermaid architecture diagrams.

| Subcommand | Description |
|---|---|
| `cv whiteboard new [file]` | Scaffold a Mermaid diagram from a built-in template |
| `cv whiteboard publish <file>` | Publish a `.mmd` diagram to your portfolio |
| `cv whiteboard list-templates` | List all available built-in templates |

**Shortcuts:**

```bash
cv new my-diagram --template system-arch   # same as cv whiteboard new
cv list-templates                           # same as cv whiteboard list-templates
```

---

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
cv profile export --format gdoc
```

---

### `cv auth`

Manage your CareerVivid API key. Get your key at [careervivid.app/developer](https://careervivid.app/developer).

| Subcommand | Description |
|---|---|
| `cv auth set-key <key>` | Save your API key to `~/.careervividrc.json` |
| `cv auth check` | Verify that your saved key is valid |
| `cv auth remove` | Remove the saved key |
| `cv auth whoami` | Show the currently authenticated user |

The key is stored at `~/.careervividrc.json` with `chmod 600` permissions. You can also set it via environment variable:

```bash
cv auth set-key cv_live_YOUR_KEY_HERE
cv auth check
# ✔  Authenticated as Jiawen Zhu (jiawen@careervivid.app)

# Or use env var without saving locally
CV_API_KEY=cv_live_YOUR_KEY_HERE cv publish article.md
```

---

### `cv login`

Open the CareerVivid sign-in page in your browser and interactively save your API key.

```bash
cv login
```

---

### `cv config`

View and modify CLI configuration stored at `~/.careervividrc.json`.

| Subcommand | Description |
|---|---|
| `cv config show` | Print the full config (sensitive keys are masked) |
| `cv config get <key>` | Print a single config value |
| `cv config set <key> <value>` | Update a config value |

**Available Keys:**

| Key | Description |
|---|---|
| `apiKey` | Your CareerVivid API key (set via `cv auth set-key` or `cv login`) |
| `apiUrl` | Optional API endpoint override (default: `https://careervivid.app/api`) |
| `targetCompanies` | Comma-separated target companies for `cv jobs hunt` |
| `llmProvider` | Your default BYO LLM provider (`openai`, `anthropic`, `openrouter`, etc.) |
| `llmModel` | Your default BYO model (e.g. `gpt-4o`, `claude-opus-4-5`) |
| `llmApiKey` | Your BYO LLM API key (masked in output) |
| `llmBaseUrl` | Custom OpenAI-compatible base URL for `custom` provider |

```bash
cv config show
cv config get targetCompanies
cv config set targetCompanies "OpenAI, Google, Vercel"
cv config set llmProvider openai
cv config set llmModel gpt-4o
cv config set llmApiKey sk-...
```

> **Security:** API keys are always masked in `cv config show` output. Internal platform credentials are never exposed.

---

## AI Credits

CareerVivid uses a simple AI credit system for platform-managed AI features (powered by Gemini).

| Plan | Credits / Month | Price |
|---|---|---|
| **Free** | 100 credits | $0 |
| **Pro** | 1,000 credits | Paid |
| **Max** | 10,000 credits | Paid |

**Credit costs per agent turn:**

| Model | Credits per Turn |
|---|---|
| `gemini-3.1-flash-lite-preview` (default) | 0.5 cr |
| `gemini-2.5-flash` | 1 cr |
| `gemini-3.1-pro-preview` (`--pro`) | 2 cr |

> **Bring Your Own Key:** If you use `--provider openai` (or any non-CareerVivid provider) with your own API key, **no credits are deducted** — you pay your provider directly.

Get your API key and check your credit balance at [careervivid.app/developer](https://careervivid.app/developer).

---

## Bring Your Own API Key (BYO)

The agent supports any OpenAI-compatible provider. Your key is never stored unless you save it with `cv agent config` or `cv config set llmApiKey`.

**Supported providers:**

| Provider | `--provider` value | Models |
|---|---|---|
| CareerVivid (default) | `careervivid` | Gemini Flash Lite, Flash, Pro |
| OpenAI | `openai` | gpt-4o, gpt-4-turbo, gpt-3.5-turbo, … |
| Anthropic | `anthropic` | claude-opus-4-5, claude-sonnet-4-5, … |
| Google Gemini (direct) | `gemini` | gemini-2.5-flash, gemini-3.1-pro-preview, … |
| OpenRouter | `openrouter` | Any model on openrouter.ai |
| Kimi / Moonshot | `custom` | `--base-url https://api.moonshot.cn/v1` |
| Qwen / Alibaba | `custom` | `--base-url https://dashscope.aliyuncs.com/compatible-mode/v1` |
| GLM / Zhipu | `custom` | `--base-url https://open.bigmodel.cn/api/paas/v4` |
| Any OpenAI-compatible | `custom` | `--base-url <your-url>` |

**Examples:**

```bash
# OpenAI
cv agent --provider openai --model gpt-4o --api-key sk-...

# Anthropic
cv agent --provider anthropic --model claude-opus-4-5 --api-key sk-ant-...

# OpenRouter (access 100+ models)
cv agent --provider openrouter --model mistralai/mistral-7b-instruct --api-key sk-or-...

# Save a provider permanently
cv agent config
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

```bash
cv new my-pipeline --template ci-cd
code my-pipeline.mmd
cv whiteboard publish my-pipeline.mmd --title "Our CI/CD Pipeline"
```

---

## AI Agent Integration (MCP / CI)

The CLI is designed to be **AI-agent-friendly**. Use `--json` for structured output.

### System Prompt for Cursor / Claude / Gemini

```
# CareerVivid CLI Rules

You have access to the `cv` CLI tool. Use it to help the user build their
CareerVivid portfolio and manage their job search.

## Available commands
- cv publish <file>               Publish an article or diagram
- cv agent --resume               Discuss the user's resume
- cv agent --jobs                 Job hunting conversations
- cv jobs hunt --role "..."       AI-powered job search
- cv jobs list                    View job tracker

## Publishing rules
1. Generate the file locally first.
2. Tell the user: "I drafted a CareerVivid post. Review and confirm."
3. Wait for explicit confirmation before running cv publish.
4. Use --json flag for machine-readable output.
5. NEVER include real API keys or secrets in published content.
```

### Automated Pipeline

```bash
# Pipe AI-generated markdown directly
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
npm config get prefix
# Add <prefix>/bin to your PATH in ~/.zshrc or ~/.bashrc
```

**`Unauthorized` error**
```bash
cv auth check
CV_API_KEY=cv_live_YOUR_KEY cv publish article.md
```

**`cannot add command 'agent'` error (< v1.12.2)**
```bash
npm install -g careervivid@latest
```

**Permission denied on `~/.careervividrc.json`**
```bash
chmod 600 ~/.careervividrc.json
```

**Mermaid diagram not rendering**  
Run `cv new --template flowchart --print` to validate your Mermaid syntax.

---

## Resources

- 🌐 [careervivid.app](https://careervivid.app)
- 🔑 [Developer Settings & API Key](https://careervivid.app/developer)
- 💳 [Pricing & AI Credits](https://careervivid.app/pricing)
- 🐛 [Report an Issue](https://github.com/Jastalk/CareerVivid/issues)
- 📦 [npm Package](https://www.npmjs.com/package/careervivid)

---

MIT License © CareerVivid
