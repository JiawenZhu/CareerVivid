export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    html: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
    {
        id: 'welcome_premium',
        name: 'Welcome to Premium',
        subject: 'Welcome to CareerVivid Premium! 🚀',
        html: `<h2>Welcome to Premium!</h2>
<p>Hi there,</p>
<p>Thank you for upgrading to CareerVivid Premium. We are thrilled to have you on board!</p>
<p>You now have access to:</p>
<ul>
    <li>Unlimited AI Resume Improvements</li>
    <li>Advanced Interview Practice</li>
    <li>Personalized Portfolio Website</li>
</ul>
<p>If you have any questions, feel free to reply to this email.</p>
<br>
<p>Best regards,</p>
<p>The CareerVivid Team</p>`
    },
    {
        id: 'account_warning',
        name: 'Account Warning',
        subject: 'Action Required: Notice regarding your account',
        html: `<h2>Account Notice</h2>
<p>Hello,</p>
<p>We noticed some unusual activity on your account that violates our terms of service.</p>
<p>Please review our community guidelines. Continued violations may result in account suspension.</p>
<p>If you believe this is a mistake, please contact us immediately.</p>
<br>
<p>Best,</p>
<p>CareerVivid Security Team</p>`
    },
    {
        id: 'feature_announcement',
        name: 'New Feature Announcement',
        subject: 'Introducing: AI Mock Interviews 🤖',
        html: `<h2>New Feature Alert!</h2>
<p>Hi,</p>
<p>We are excited to announce our newest feature: <strong>AI Mock Interviews</strong>.</p>
<p>You can now practice real-time conversations with our AI interviewer to prepare for your dream job.</p>
<p><a href="https://careervivid.app/interview">Try it now</a></p>
<br>
<p>Happy hunting!</p>
<p>CareerVivid Product Team</p>`
    },
    {
        id: 'payment_failed',
        name: 'Payment Failed (Manual)',
        subject: 'Action Required: Payment Failed',
        html: `<h2>Payment Failed</h2>
<p>Hello,</p>
<p>We attempted to process your subscription renewal but the payment failed.</p>
<p>Please update your payment method to avoid service interruption.</p>
<p><a href="https://careervivid.app/subscription">Update Payment Method</a></p>
<br>
<p>Thank you,</p>
<p>CareerVivid Billing</p>`
    },
    {
        id: 'generic_notification',
        name: 'Generic Notification',
        subject: 'Important Update from CareerVivid',
        html: `<p>Hello,</p>
<p>[Your message here]</p>
<br>
<p>Best regards,</p>
<p>The CareerVivid Team</p>`
    }
];
