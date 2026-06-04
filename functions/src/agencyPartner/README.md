# Agency Partner Functions Module

This module is the isolated backend home for agency partner logic.

Use this directory for:

- Branch setup
- Prep session updates
- Consent and share helpers
- Demo seeding
- Agency-specific validation

Firestore namespaces owned by this module:

- `agencyBranches`
- `agencyPrepSessions`
- `agencyPartnerApplications`

Keep agency-specific behavior out of broad shared function files except for minimal exports or trigger registration.
