# Lifecycle Email Asset Inventory

This folder is reserved for CareerVivid lifecycle email visual assets. Keep source captures and generated exports separate so Chrome Web Store screenshots, lifecycle emails, and public-site visuals do not overwrite each other.

Recommended structure:

```text
source/
  screenshots/
  mockups/
exports/
  2x/
  1x/
```

Asset naming:

- `cv-email-welcome-hero`
- `cv-email-resume-match`
- `cv-email-extension-panel`
- `cv-email-digest-stats`
- `cv-email-review-complete`
- `cv-email-cover-letter`
- `cv-email-review-request`

Rules:

- Use CareerVivid product UI or email-safe product mockups.
- Remove private emails, addresses, real resume details, live job history, and credit balances.
- Export 2x PNG first, then 1x PNG.
- Keep final email images under `560px` displayed width.
- Add meaningful alt text in the email template, not text baked into the filename.
