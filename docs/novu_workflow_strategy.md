# CareerVivid Comprehensive Novu Workflow Strategy

This document outlines a professional-grade notification and workflow architecture using Novu. It is designed to maximize user engagement, drive conversions, prevent churn, and provide deep analytics tracking across the CareerVivid platform.

---

## 1. User Lifecycle & Onboarding Workflows
*Goal: Guide the user to the "Aha!" moment and ensure they complete their profile.*

### `onboarding-welcome`
- **Trigger Event:** User signs up successfully.
- **Channels:** In-App Inbox ➔ Email (Immediate)
- **Payload:** `{ firstName, dashboardUrl, setupGuideUrl }`
- **Logic:** Send a warm welcome email. If the user doesn't open the email within 24 hours, push an In-App notification reminding them to complete their profile.

### `onboarding-incomplete-profile`
- **Trigger Event:** Scheduled cron job detecting profiles < 80% complete after 3 days.
- **Channels:** In-App Inbox ➔ Email
- **Payload:** `{ missingFieldsList, profileEditUrl }`
- **Logic:** Nudge the user to upload their resume or connect their LinkedIn to unlock AI features.

### `milestone-achieved`
- **Trigger Event:** User applies to their 10th job or completes their first AI Mock Interview.
- **Channels:** In-App Inbox (with celebration animation)
- **Payload:** `{ milestoneType, shareOnLinkedInUrl }`
- **Logic:** Positive reinforcement to build habit-forming behavior.

---

## 2. Marketing & Engagement Automation
*Goal: Re-engage dormant users and broadcast product value.*

### `marketing-feature-announcement`
- **Trigger Event:** Admin dispatches from the `CampaignDashboard`.
- **Channels:** In-App Inbox ➔ Email ➔ Push (Mobile)
- **Payload:** `{ featureName, featureDescription, ctaUrl, utmTags }`
- **Logic:** Broadcast out new features (e.g., "New Cover Letter API is Live!"). Uses UTM tags so clicks are tracked back to the UTM Builder analytics.

### `reengagement-dormant-user`
- **Trigger Event:** User hasn't logged in for 14 days.
- **Channels:** Email ➔ SMS (if opted in)
- **Payload:** `{ unseenJobsCount, communityActivityDigestUrl }`
- **Logic:** "You've missed 14 new jobs matching your profile." Creates FOMO to drive the user back to the platform.

### `abandoned-cart-subscription`
- **Trigger Event:** User visits the checkout page but doesn't upgrade to Pro within 4 hours.
- **Channels:** Email
- **Payload:** `{ discountCode, expirationTime, checkoutUrl }`
- **Logic:** Sent via Novu's delay node. If they haven't upgraded after 4 hours, send a 10% off code valid for 24 hours.

---

## 3. Usage Tracking & Billing
*Goal: Monetize effectively and prevent service disruption.*

### `usage-limit-warning`
- **Trigger Event:** User consumes 80% of their monthly AI credits.
- **Channels:** In-App Inbox (Urgent/Red badge) ➔ Email
- **Payload:** `{ creditsRemaining, creditsTotal, upgradePlanUrl }`
- **Logic:** Crucial for the AI credit-based model. Alerts the user *before* they hit a hard wall, offering a seamless upgrade path.

### `usage-limit-exceeded`
- **Trigger Event:** User hits 100% of AI credits.
- **Channels:** In-App Modal / Inbox ➔ Email
- **Payload:** `{ upgradePlanUrl }`
- **Logic:** Hard stop notification. Immediate upsell to Weekly Pro or Monthly Pro.

### `billing-upcoming-renewal`
- **Trigger Event:** 3 days before subscription renews.
- **Channels:** Email
- **Payload:** `{ renewalDate, amount, planName }`
- **Logic:** Reduces chargebacks and builds trust by transparently notifying users before their card is charged.

### `billing-payment-failed`
- **Trigger Event:** Stripe webhook detects failed payment.
- **Channels:** In-App Inbox (Persistent) ➔ Email ➔ SMS
- **Payload:** `{ updateBillingUrl, gracePeriodEnd }`
- **Logic:** High-priority workflow to recover revenue before the account is downgraded.

---

## 4. Platform Activity & Tracking
*Goal: Create a sticky, community-driven ecosystem.*

### `job-match-alert`
- **Trigger Event:** A new job is scraped/added that matches the user's saved preferences.
- **Channels:** In-App Inbox ➔ Push ➔ Email (Daily Digest)
- **Payload:** `{ jobTitle, company, salary, matchPercentage, applyUrl }`
- **Logic:** Novu handles digest logic here. Instead of 10 emails a day, Novu's "Digest" node groups all matched jobs into a single 5 PM email, but pushes them to the In-App Inbox instantly.

### `community-post-engagement`
- **Trigger Event:** Someone likes or comments on the user's community feed post.
- **Channels:** In-App Inbox
- **Payload:** `{ actorName, actionType, postTitle, postUrl }`
- **Logic:** Immediate dopamine hit. Drives the user back to the community feed to reply.

### `profile-view-alert`
- **Trigger Event:** A recruiter or another user views their public portfolio.
- **Channels:** In-App Inbox
- **Payload:** `{ viewerCompany (if known), timeOfView, portfolioAnalyticsUrl }`
- **Logic:** Highly engaging notification type (similar to LinkedIn's "Someone viewed your profile").

---

## 5. Implementation Roadmap for CareerVivid

### Phase 1: Core Lifecycle (Week 1)
1. Map `onboarding-welcome` to Firebase Auth creation.
2. Map `usage-limit-warning` to the `agentCredits.ts` Cloud Function.
3. Hook up the `messagingTrigger` (already completed in `messaging.ts`) to handle marketing broadcasts.

### Phase 2: Digest & Community (Week 2)
1. Utilize Novu's **Digest Node** for `job-match-alert` to prevent spamming users.
2. Wire up Firestore triggers on the `posts` and `comments` collections to fire `community-post-engagement`.

### Phase 3: Advanced Billing & SMS (Week 3)
1. Connect Stripe Webhooks to trigger `billing-payment-failed` and `billing-upcoming-renewal`.
2. Activate Twilio integration in the Novu dashboard for high-priority SMS alerts (like abandoned checkouts).
