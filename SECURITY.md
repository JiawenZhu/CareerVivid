# Security Policy

## Supported Release

Security fixes are made against the current `main` branch and released through
the CareerVivid deployment pipeline.

## Public Configuration Versus Secrets

CareerVivid is a public SaaS application. A browser can legitimately see the
Firebase Web configuration required to connect to Firebase, including the
project identifier, Auth domain, and Firebase Web API key. These values are
identifiers, not administrator credentials. They are restricted to the Firebase
APIs required by the public client. Configure browser-origin restrictions where
they are compatible with every supported client; Chrome extensions require a
separate, tested authentication path before a web-only referrer restriction is
enabled.

The following must never be committed, bundled into the browser, copied into a
GitHub workflow, or supplied to a public user:

- Google Cloud service-account JSON, private keys, and Application Default
  Credentials files.
- IAM principal credentials or role grants.
- Stripe secret keys, webhook signing secrets, OpenRouter keys, SMTP passwords,
  and third-party OAuth client secrets.
- Firebase Admin SDK credentials.

Cloud Functions use their attached runtime service identity and Firebase Secret
Manager. Browser clients use Firebase Auth and narrowly scoped Firestore and
Storage Rules; they do not receive IAM permissions.

## Self-Hosted Or Bring-Your-Own-Cloud Deployments

Anyone deploying their own CareerVivid instance must create a separate Google
Cloud/Firebase project, configure their own least-privilege runtime identity,
and supply only their own values through local environment files and the cloud
secret manager. Start from [`.env.example`](.env.example); never copy
CareerVivid production credentials or IAM configuration.

## Reporting a Vulnerability

Do not open a public issue with credentials, proof-of-concept data, or personal
information. Use GitHub's private vulnerability reporting flow for this
repository when available; otherwise contact the project maintainer privately.
Include the affected route or component, reproduction steps, expected impact,
and any remediation guidance.
