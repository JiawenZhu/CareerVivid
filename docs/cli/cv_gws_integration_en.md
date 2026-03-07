# CareerVivid + Google Workspace CLI Integration Guide

The CareerVivid CLI (`cv`) is now deeply integrated with the [Google Workspace CLI](https://github.com/googleworkspace/cli) (`gws`). By performing secure local OAuth authentication, you can now export CareerVivid resume data to Google Docs or automatically generate job tracking spreadsheets by scanning Gmail—all directly from your terminal.

This guide provides a step-by-step walkthrough for configuring your environment and using the integrated commands.

---

## 1. Prerequisites & Initial Configuration

Because these features interact with real Google Drive and Gmail data, you must install `gws` and authorize it on your local machine.

### 1.1 Install GWS CLI
First, install the Google Workspace CLI globally:
```bash
npm install -g @googleworkspace/cli
```

### 1.2 Perform Local Authorization
Run the following command to start the setup wizard:
```bash
gws auth setup
```

**Key Configuration Notes:**
- **GCP Project**: Create or select a GCP project (e.g., `jastalk-firebase`).
- **Workspace APIs**: The wizard will prompt you to enable the required APIs. Ensure you check `Google Drive`, `Google Sheets`, `Gmail`, `Google Calendar`, and `Google Docs`.
- **OAuth Client ID**: If prompted for a Client ID, your environment requires manual credential issuance.
  1. Go to the [Credentials page](https://console.cloud.google.com/apis/credentials) in the GCP Console.
  2. Click **Create Credentials -> OAuth client ID**.
  3. **Application type MUST be "Desktop app"**.
  4. Paste the generated Client ID and Client Secret back into the terminal prompt.

### 1.3 Login & Save Token
Finally, run:
```bash
gws auth login
```
The terminal will provide a link and open your browser. Select your account and grant the requested permissions. Once successful, the OAuth Token will be encrypted and saved locally (e.g., `~/.config/gws/credentials.enc`). You won't need to re-authenticate for future commands.

---

## 2. Core Features & Usage

Once configured, you can use these exclusive `cv` commands for seamless workflow automation!

### 🦸‍♂️ Feature 1: Workspace Health Check
Test your integration status at any time before running advanced automations.

```bash
cv workspace check
# Or use the alias:
cv gws check
```

**Success Message:**
> ✔ Google Workspace integration is fully configured.

---

### 📄 Feature 2: Export Resume to Google Docs
Convert your CareerVivid resume JSON data into a collaborative, formatted Google Doc for easy sharing and feedback.

**Command:**
```bash
cv profile export --format gdoc [optional-path-to-resume.json]
```

**How it works:**
1. The CLI calls `gws docs documents create` to establish a new cloud document.
2. It then constructs a `batchUpdate` JSON payload to inject your experiences, projects, and skills into the document.
3. Upon completion, it returns a direct link: `https://docs.google.com/document/d/.../edit`.

---

### 📧 Feature 3: Sync Gmail Applications to Google Sheets
Stop manually tracking your job applications. This command scans your Gmail for application receipts and logs them into an automated tracking spreadsheet.

**Command:**
```bash
cv jobs sync-gmail
```

**How it works:**
1. The CLI uses `gws gmail users messages list` to find relevant emails (e.g., matching `applied` or `application`).
2. It uses mock AI logic to extract the company name, role, and date from the email snippet.
3. It calls `gws sheets spreadsheets create` to generate a "CareerVivid Job Tracker" sheet.
4. It then uses the `values append` API to log your application data into the sheet.

---

## 3. Troubleshooting

**Q: `cv workspace check` returns `Exit code: 1` or `✖ GWS CLI is installed but not authenticated`.**  
A: Your local environment is missing a valid token. Run `gws auth login` again. Do not interrupt the process (e.g., via `Ctrl+C`) until the terminal shows a success checkmark.

**Q: `cv jobs sync-gmail` reports `No recent application emails found.`**  
A: This means no emails matching the job application markers were found in your recent history. Try checking your primary job-hunting email account.

**Q: Can I revoke access?**  
A: Yes. Go to your Google Account **Security -> Third-party apps with account access**, find your app, and click "Remove access". The local CLI will immediately lose all permissions.
