# CareerVivid Apply Agent Desktop

Electron desktop runner for the CareerVivid Apply Agent.

## Stack

- Electron with context isolation, sandboxing, and no renderer Node integration.
- electron-vite with Vite, TypeScript, and React renderer.
- Playwright Library in the Electron main process for ATS browser automation.
- electron-builder for packaging, signing, notarization, and auto-update wiring.

## Local Development

```bash
cd apps/auto-apply-desktop
npm install
npm run dev
```

## Security Defaults

- Renderer loads only local trusted app code.
- Remote ATS pages run in Playwright, not inside the Electron renderer.
- Preload exposes a small typed IPC surface.
- Main process owns browser automation, queue claiming, and receipts.
- Runner stops for CAPTCHA, MFA, missing sensitive answers, file upload failure, and low submit confidence.
