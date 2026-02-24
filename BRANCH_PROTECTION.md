# Branch Protection Setup Guide

Follow these steps to secure the `main` branch on GitHub.

## Navigate to Settings

1. Go to **your repo** → **Settings** → **Branches**
2. Click **Add branch protection rule** (or edit existing)
3. Set **Branch name pattern** to: `main`

## Recommended Rules Checklist

### Gate: Pull Requests

- [x] **Require a pull request before merging**
  - [x] Require approvals — set to **1** (or more for larger teams)
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from code owners *(if you have a CODEOWNERS file)*

### Gate: Status Checks

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - [x] Search and select: **`Build & Lint`** *(this is the job name from `pr-checks.yml`)*

### Gate: Branch Integrity

- [x] **Require conversation resolution before merging**
- [x] **Require signed commits** *(optional but recommended)*
- [x] **Require linear history** *(enforces rebase/squash, keeps history clean)*
- [x] **Do not allow bypassing the above settings** ← *Critical: applies rules to admins too*

### Safety

- [x] **Restrict who can push to matching branches** *(optional — add trusted team members only)*
- [ ] **Allow force pushes** → **Leave unchecked**
- [ ] **Allow deletions** → **Leave unchecked**

## After Saving

1. Push a test branch and open a PR to `main`
2. Verify the **"Build & Lint"** check appears and must pass
3. Verify that direct pushes to `main` are blocked
