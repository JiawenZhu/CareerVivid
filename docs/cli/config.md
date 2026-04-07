# `cv config`

View and update local CLI settings.

## Available Configuration Keys

- \`apiKey\`: Your CareerVivid API key.
- \`geminiKey\`: Your Gemini API key for local AI-powered job application tracking and parsing.
- \`targetCompanies\`: Comma-separated list of target organizations to focus search on ATS boards (used by \`cv jobs hunt\`).
- \`apiUrl\`: Optional API endpoint override (default: \`https://careervivid.app/api\`).

## Commands

### `cv config show`
Print the full configuration.

```bash
cv config show
```

### `cv config get`
Retrieve a specific configuration value.

```bash
cv config get <key>
```

### `cv config set`
Update a specific configuration value.

```bash
cv config set <key> <value>
```

## Environment Variables
The CLI respects the following environment variables:

- `CV_API_KEY`: Override the saved API key.
- `CV_API_URL`: Override the publish endpoint.
