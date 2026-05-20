# Aikido Autofix Workflow

This document defines the CareerVivid security remediation loop for Aikido findings. The goal is to make every scan actionable: scan, classify, fix, verify, and record the reusable fix pattern.

## Operating Rule

After every Aikido scan, all actionable findings must be triaged and remediated through an autofix workflow. Fixes should be applied as small, reviewable patches and verified before they are considered resolved.

Do not auto-merge security fixes. The automation should create a branch or PR with evidence, then a human can approve it.

## Standard Loop

1. Run Aikido scan.
2. Export or inspect each finding.
3. Classify the issue by type and severity.
4. Confirm the vulnerable package, secret, file, function, or data flow.
5. Apply the smallest safe fix.
6. Run local verification.
7. Run Aikido scan again.
8. If clean, document the fix pattern and commit the patch.
9. If still failing, repeat the fix and rescan cycle.

## Issue Classes

### Dependency Vulnerability

Examples: vulnerable `axios`, `next`, `@xmldom/xmldom`, `cookie`, `ws`.

Fix pattern:

1. Identify the exact package root and lockfile.
2. Confirm the currently installed version.
3. Upgrade to the fixed version recommended by Aikido or the package advisory.
4. Update the matching lockfile.
5. Run install/build/test for that package root.
6. Confirm the vulnerable version no longer appears in the lockfile.

Verification:

```bash
npm run build
rg '"package-name"|vulnerable-version' package-lock.json functions/package-lock.json next-app/package-lock.json
```

### Exposed Secret

Examples: API keys, provider tokens, webhook secrets, private keys.

Fix pattern:

1. Remove the hardcoded secret from source, scripts, generated output, and test fixtures.
2. Replace production usage with Secret Manager, environment variables, or runtime config.
3. Make test scripts fail fast when the required environment variable is missing.
4. Search the repo for the exact exposed value.
5. Rebuild generated code if compiled output contained the secret.
6. Rotate the exposed key in the provider dashboard.

Verification:

```bash
rg 'exact-secret-value' -g '!**/node_modules/**'
npm run build
```

Required follow-up:

- Rotate the exposed key. Code removal does not revoke an already leaked credential.

### SSRF

Examples: untrusted URLs passed to `fetch`, `axios`, image loaders, proxy endpoints, or metadata fetchers.

Fix pattern:

1. Identify whether user input controls the destination URL.
2. Prefer allowlisted hosts or internal route identifiers over raw URLs.
3. Parse URLs with `new URL()`.
4. Reject non-HTTP protocols unless explicitly needed.
5. Block localhost, link-local, private, and metadata IP ranges for server-side requests.
6. Disable redirect chains or re-validate every redirect target.
7. Add tests for blocked destinations.

Verification:

```bash
rg 'fetch\\(|axios\\.|http://' functions/src src next-app/src
npm test
```

### XSS Or Unsafe HTML

Examples: `dangerouslySetInnerHTML`, markdown rendering, template HTML, user-provided rich text.

Fix pattern:

1. Confirm whether input is trusted or user-controlled.
2. Sanitize HTML with an approved sanitizer.
3. Prefer plain text rendering where rich HTML is not required.
4. Restrict allowed tags and attributes.
5. Add tests for script, event-handler, and URL-based payloads.

Verification:

```bash
rg 'dangerouslySetInnerHTML|rehypeRaw|innerHTML' src functions/src next-app/src
npm test
```

### Unsafe Redirect

Fix pattern:

1. Replace raw redirect URLs with route IDs or allowlisted domains.
2. Parse redirect targets with `new URL()`.
3. Reject protocol-relative URLs and unknown origins.
4. Default to a safe internal route.

### License Or Policy Finding

Examples: `UNLICENSED`, prohibited license, missing metadata.

Fix pattern:

1. Confirm whether the finding is for first-party package metadata or a third-party dependency.
2. Add explicit first-party license metadata when appropriate.
3. For third-party packages, replace the dependency or document legal approval.
4. Update lockfiles if package metadata changes.

## Commit And PR Standard

Each security fix PR should include:

- Affected Aikido issue names.
- Files changed.
- Fix summary.
- Verification commands and results.
- Any required manual follow-up, especially secret rotation.

Commit messages should be direct:

```text
Fix Aikido security findings
```

or, for a narrower fix:

```text
Fix exposed Novu secret handling
```

## Automation Direction

The long-term automation target is:

```text
Aikido scan
-> classify finding
-> generate patch
-> run build/test
-> run Aikido rescan
-> open PR with evidence
```

Automation should start with low-risk classes:

1. Dependency upgrades.
2. First-party license metadata.
3. Hardcoded secret removal into environment or Secret Manager.

Code-level SAST fixes should stay human-reviewed until the fix patterns have been proven repeatedly in this repo.
