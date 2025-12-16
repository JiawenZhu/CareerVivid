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
    <li>300 AI Credits per Month</li>
    <li>Unlimited Interview Practice</li>
    <li>Personalized Portfolio Website</li>
</ul>
<p>If you have any questions, feel free to reply to this email.</p>
<br>
<p>Best regards,</p>
<p>The CareerVivid Team</p>`
    },
    {
        id: 'welcome_partner',
        name: 'Welcome to Academic Partner Portal',
        subject: 'Welcome to the Academic Partner Program! 🎓',
        html: `<h2>Welcome, Partner!</h2>
<p>Dear Professor,</p>
<p>We are delighted to welcome you to the <strong>CareerVivid Academic Partner Program</strong>.</p>
<p>As a partner, you now have access to our exclusive portal where you can:</p>
<ul>
    <li>Monitor student progress</li>
    <li>Distribute premium access codes</li>
    <li>Access educational resources</li>
</ul>
<p>Your dedicated dashboard is ready for you to explore:</p><p><a href="https://careervivid.app/academic-partner" style="display:inline-block; padding:10px 20px; background-color:#4CAF50; color:white; text-decoration:none; border-radius:5px; font-weight:bold;">Launch Partner Portal</a></p><p>Thank you for your commitment to fostering the next generation of successful professionals.</p><p>Sincerely,</p><p>The CareerVivid Team</p>`
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
    },
    // --- Business Partner Templates ---
    {
        id: 'welcome_business_general',
        name: 'Welcome Business Partner (General)',
        subject: 'Welcome to the CareerVivid Business Partner Program! 🤝',
        html: `<h2>Welcome, Partner!</h2>
<p>Hello,</p>
<p>We are thrilled to welcome your organization to the <strong>CareerVivid Business Partner Program</strong>.</p>
<p>We look forward to collaborating with you to connect with top emerging talent.</p>
<p>As a next step, we'd love to schedule a quick onboarding call to understand your specific needs.</p>
<p>Briefly, here is what you can expect:</p>
<ul>
    <li>Access to our curated talent pool</li>
    <li>Employer branding opportunities</li>
    <li>Priority support</li>
</ul>
<p>Your dedicated dashboard is ready for you to explore:</p><p><a href="https://careervivid.app/partners/business" style="display:inline-block; padding:10px 20px; background-color:#4CAF50; color:white; text-decoration:none; border-radius:5px; font-weight:bold;">Launch Business Portal</a></p><p>Thank you for your commitment to fostering the next generation of successful professionals.</p><p>Sincerely,</p><p>The CareerVivid Partnership Team</p>`
    },
    {
        id: 'welcome_business_hiring',
        name: 'Welcome Business (Hiring Focus)',
        subject: 'Let\'s find your next great hire! 🚀',
        html: `<h2>Welcome to CareerVivid Hiring!</h2>
<p>Hello,</p>
<p>Thank you for joining us! We are excited to help you streamline your campus recruiting and find the best candidates for your open roles.</p>
<p>To get started, please share the job descriptions for the roles you are actively hiring for.</p>
<p>Our team will use our AI matching technology to shortlist the top candidates from our user base.</p>
<br>
<p>We look forward to helping you build your dream team.</p>
<p>Best,</p>
<p>CareerVivid Talent Solutions</p>`
    },
    {
        id: 'welcome_business_branding',
        name: 'Welcome Business (Branding/Events)',
        subject: 'Boosting your Employer Brand with CareerVivid ✨',
        html: `<h2>Welcome!</h2>
<p>Hello,</p>
<p>We are excited to partner with you on building a strong employer brand on campus.</p>
<p>Whether it's hosting a virtual hackathon, a resume workshop, or a webinar, we are here to support your initiatives.</p>
<p>Let's schedule a brainstorming session to plan your first event.</p>
<br>
<p>Cheers,</p>
<p>The CareerVivid Events Team</p>`
    },
    // --- Student Partner Templates ---
    {
        id: 'welcome_student_ambassador',
        name: 'Welcome Student Ambassador',
        subject: 'You\'re in! Welcome to the Ambassador Program 🌟',
        html: `<h2>Welcome Aboard!</h2>
<p>Hi there,</p>
<p>Congratulations! You have been selected as a <strong>CareerVivid Student Ambassador</strong>.</p>
<p>We were impressed by your application and your passion for helping peers succeed.</p>
<p><strong>Your Next Steps:</strong></p>
<ol>
    <li>Join our exclusive Discord community (Link coming soon)</li>
    <li>Review the Ambassador Handbook attached</li>
    <li>Share your unique referral code: [CODE]</li>
</ol>
<p>Your dedicated dashboard is ready for you to explore:</p><p><a href="https://careervivid.app/partners/students" style="display:inline-block; padding:10px 20px; background-color:#4CAF50; color:white; text-decoration:none; border-radius:5px; font-weight:bold;">Launch Ambassador Portal</a></p><p>Thank you for your commitment to fostering the next generation of successful professionals.</p><p>Sincerely,</p><p>The CareerVivid Community Manager</p>`
    },
    {
        id: 'welcome_student_club',
        name: 'Welcome Student (Club Leader)',
        subject: 'Partnership Confirmation for Your Club 🚀',
        html: `<h2>Hello Club Leader!</h2>
<p>Hi,</p>
<p>We are excited to partner with your student organization!</p>
<p>As an official partner club, you now have access to:</p>
<ul>
    <li>Free Premium memberships for your executive board</li>
    <li>Exclusive workshop materials</li>
    <li>Sponsorship for your upcoming events</li>
</ul>
<p>Please reply with a list of your board members' emails so we can upgrade their accounts.</p>
<br>
<p>Keep up the great work!</p>
<p>The CareerVivid Team</p>`
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
