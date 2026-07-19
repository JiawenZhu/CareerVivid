# CareerVivid Agent Coordination

## Canonical Repository

Use this repository for coordinated CareerVivid work:

```bash
cd /Users/jiawenzhu/Developer/careervivid
```

The former `/Users/jiawenzhu/Developer/careervivid-release` worktree has been retired. Do not reference it in deployment, release, security, or packaging instructions.

Before a release operation, always inspect the active branch and working tree. If unrelated changes are present, create or use a clean worktree from this repository and bring over only the intended changes.

## Chrome Extension Packaging

- Prepare Chrome extension builds and upload zip files from `/Users/jiawenzhu/Developer/careervivid` or a clean worktree created from it.
- When only creating a Chrome Web Store upload zip, package from a copied staging directory so the original `dist-extension` folder remains untouched.
- Keep the upload folder free of obsolete extension zips so the latest `2.1.1` package is unambiguous.

## Ownership

- Lead Codex owns overall product direction, design quality, feature development, deployment sequencing, release safety, and final integration.
- Security Autofix owns security-focused work only: dependency alerts, auth/redirect hardening, secret exposure, CORS, Firebase rules/functions security, and regression tests for those fixes.
- Security Autofix should not redesign UI, roll back product features, change audio/interview logic, alter dashboard/portfolio/editor layouts, or deploy hosting unless the user and Lead Codex explicitly approve.

## Security Workflow

1. Start from `/Users/jiawenzhu/Developer/careervivid` or a clean worktree created from it.
2. Check `git status --short --branch` before editing.
3. Create a task branch from the verified clean current branch for each fix.
4. Use GitHub Dependabot as the required source of truth when GitHub is reachable.
5. Do not depend on removed or unavailable scanner integrations; use Dependabot plus local audits as the baseline workflow.
6. Keep security changes minimal, reviewable, and scoped to the finding.
7. Preserve existing product behavior and visual design unless the security finding requires a narrow product-facing change.
8. Run targeted tests for touched code, plus the relevant build command before marking work ready.

## Deploy Safety

- Do not deploy from a dirty worktree unless every changed file is intentionally in scope and has been reviewed.
- For hosting-only web changes, prefer:

```bash
npm run build && firebase deploy --only hosting
```

- Deploy Cloud Functions only when function code changed.
- After any hosting deploy, verify that live asset URLs under `/assets/*.js` return JavaScript, not `text/html`.
- Do not undo the service-worker and Firebase hosting cache safeguards added after the stale chunk incident.

## Current Incident Context

The clean release branch includes safeguards for SPA rewrites and service-worker caching. Future changes should preserve those protections.

## Video Creation & YouTube Deployment Workflow

When provided with a video project directory (e.g., `Resume editor demo video (1)` containing exporter scripts, HTML/React timeline code, soundtracks, and assets):

1. **Compile and Render the Video:**
   - Host the timeline page locally (e.g., on `localhost:8765`).
   - Run the frame exporter script using Playwright to capture screenshot frames. Ensure you programmatically hide temporary overlays, voiceover buttons, or recording indicators (e.g., `#vo-btn`, `#rec-btn`) if required.
   - Use `ffmpeg` to compile the image frames to an H.264 video at `1920x1080` resolution and mux the background soundtrack.
   - Clean up temporary files, silent tracks, and raw screenshotted frames.
2. **Obtain User Review:**
   - Present the rendered video file to the user for review.
   - Wait for the user to confirm there are no more changes.
3. **Deploy to YouTube:**
   - Once the user explicitly approves, upload the video to YouTube using the `hackathon-youtube-uploader` skill.
   - By default, the privacy setting must be set to `public`.
