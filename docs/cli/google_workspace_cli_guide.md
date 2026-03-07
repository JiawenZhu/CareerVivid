# Google Workspace CLI (`gws`) Comprehensive Guide

The [Google Workspace CLI](https://github.com/googleworkspace/cli) (`gws`) is a powerful, dynamically built command-line tool that provides access to the complete surface area of Google APIs (Drive, Gmail, Calendar, Sheets, Docs, Chat, Admin, etc.) without writing manual cURL commands or maintaining custom REST scripts.

Every response is structured JSON, making it an ideal companion for **both human developers and AI Agents**.

---

## 🚀 1. Installation

The CLI provides pre-built native binaries, so a full compiler toolchain isn't required.

### Using npm (Recommended)

You can install `gws` via npm (requires Node.js 18+):

```bash
npm install -g @googleworkspace/cli
```

### From Source (Cargo)

If you prefer building from source, use standard Rust tooling:

```bash
cargo install --git https://github.com/googleworkspace/cli --locked
```

---

## 🔐 2. Authentication Workflows

The `gws` CLI supports multiple authentication methods depending on your environment (local laptop, CI/CD pipeline, or server).

### A. Interactive Local Desktop (The "Easy" Way)

If you are running the CLI on your personal machine with a browser available:

1. **Initial Setup**: Creates a Google Cloud Project, enables APIs, and initiates login. This requires the `gcloud` CLI to be installed.
   ```bash
   gws auth setup
   ```
2. **Subsequent Logins**: If you need to refresh scopes or change accounts:
   ```bash
   gws auth login -s drive,gmail,sheets
   ```
   _(Note: Credentials are encrypted at rest using AES-256-GCM and stored in your OS keyring)._

### B. Headless / CI (Export Flow)

For environments without browsers (like GitHub Actions or remote VPS):

1. Complete interactive auth on your laptop.
2. Export the credential payload:
   ```bash
   gws auth export --unmasked > credentials.json
   ```
3. Load it on the headless machine:
   ```bash
   export GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE=/path/to/credentials.json
   gws drive files list
   ```

### C. Service Account (Server-to-Server)

If you are building backend automation acting on behalf of an enterprise domain:

```bash
export GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE=/path/to/service-account.json
gws drive files list
```

---

## 🛠️ 3. Common Usage Patterns & Syntax

Because `gws` is dynamically built from Google's Discovery Service, it usually follows the pattern: `gws <service> <resource> <method>`.

### Google Drive

List the 10 most recent files:

```bash
gws drive files list --params '{"pageSize": 10}'
```

Upload a local file (Multipart Upload):

```bash
gws drive files create --json '{"name": "report.pdf"}' --upload ./report.pdf
```

Stream paginated results directly to `jq`:

```bash
gws drive files list --params '{"pageSize": 100}' --page-all | jq -r '.files[].name'
```

### Google Sheets

**CRITICAL**: Google Sheets uses `!` in range definitions (e.g., `Sheet1!A1`), which Bash interperts as history expansion. Always wrap parameters in single quotes (`'`).

Create a spreadsheet:

```bash
gws sheets spreadsheets create --json '{"properties": {"title": "Q1 Budget"}}'
```

Append rows to a sheet:

```bash
gws sheets spreadsheets values append \
  --params '{"spreadsheetId": "YOUR_SPREADSHEET_ID", "range": "Sheet1!A1", "valueInputOption": "USER_ENTERED"}' \
  --json '{"values": [["Name", "Score"], ["Alice", 95]]}'
```

### Google Chat

Send a Chat message to a space:

```bash
gws chat spaces messages create \
  --params '{"parent": "spaces/YOUR_SPACE_ID"}' \
  --json '{"text": "Deploy complete."}'
```

---

## 🤖 4. AI Agent Skills & Gemini Integration

The true power of `gws` lies in its ability to empower AI Agents, giving them secure read/write access to your digital life.

### Gemini CLI Extension

If you use the `gemini` CLI, you can pipe `gws` capabilities directly into it.

1. Authenticate `gws` first (`gws auth setup`).
2. Install the extension:
   ```bash
   gemini extensions install https://github.com/googleworkspace/cli
   ```
   The Gemini agent will inherit your `gws` credentials locally.

### Raw Agent Skills

The repository bundles over 100+ Agent `SKILL.md` files (compatible with tools like OpenClaw or custom agentic loops).

Install specific skills for your agents:

```bash
npx skills add https://github.com/googleworkspace/cli/tree/main/skills/gws-drive
npx skills add https://github.com/googleworkspace/cli/tree/main/skills/gws-gmail
```

---

## 🛡️ 5. Advanced: Model Armor Sanitization

When allowing AI agents to read from sources like Gmail, you risk **Prompt Injection** attacks. `gws` integrates directly with [Google Cloud Model Armor](https://cloud.google.com/security/products/model-armor) to sanitize API responses _before_ returning them to your agent.

```bash
gws gmail users messages get \
  --params '{"userId": "me", "id": "MESSAGE_ID"}' \
  --sanitize "projects/P/locations/L/templates/T"
```

You can globally enable this for all agent queries via environment variables:

```bash
export GOOGLE_WORKSPACE_CLI_SANITIZE_TEMPLATE="projects/P/locations/L/templates/T"
export GOOGLE_WORKSPACE_CLI_SANITIZE_MODE="block" # or "warn"
```
