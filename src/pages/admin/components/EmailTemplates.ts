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
        subject: 'Welcome to CareerVivid Business Partner Program! 🤝',
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; font-family: 'Arial Black', Arial, sans-serif; background-color:#FFE951;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFE951; padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#000000; border:6px solid #000000; box-shadow: 12px 12px 0 rgba(0,0,0,1);">
                    <!-- Neo-Brutalist Header -->
                    <tr>
                        <td style="background-color:#FF6B6B; padding:40px 30px; text-align:center; border-bottom:6px solid #000000;">
                            <h1 style="color:#000000; margin:0; font-size:36px; font-weight:900; text-transform:uppercase; letter-spacing:2px;">WELCOME!</h1>
                            <p style="color:#000000; margin:10px 0 0 0; font-size:18px; font-weight:700;">Business Partner Program</p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding:40px 30px; background-color:#FFFFFF;">
                            <div style="background-color:#00D9FF; padding:20px; border:4px solid #000000; box-shadow: 6px 6px 0 rgba(0,0,0,1); margin-bottom:30px;">
                                <h2 style="color:#000000; font-size:24px; margin:0; font-weight:900; text-transform:uppercase;">CONGRATS!</h2>
                            </div>
                            
                            <p style="color:#000000; font-size:16px; line-height:1.6; margin:0 0 20px 0; font-weight:600;">
                                You're now part of the <strong style="background-color:#FFE951; padding:2px 6px;">CareerVivid Business Partner Program</strong>. Let's connect you with top talent! 🚀
                            </p>
                            
                            <!-- Credentials Box - Neo-Brutalist Style -->
                            <div style="background-color:#B4F8C8; border:5px solid #000000; padding:24px; box-shadow: 8px 8px 0 rgba(0,0,0,1); margin:30px 0;">
                                <h3 style="color:#000000; font-size:20px; margin:0 0 20px 0; font-weight:900; text-transform:uppercase;">🔑 LOGIN INFO</h3>
                                
                                <div style="background-color:#FFFFFF; border:3px solid #000000; padding:16px; margin-bottom:12px;">
                                    <strong style="color:#000000; font-size:12px; text-transform:uppercase; letter-spacing:1px; font-weight:900;">EMAIL:</strong>
                                    <p style="margin:8px 0 0 0; color:#000000; font-size:16px; font-weight:700; font-family:monospace;">[USER_EMAIL]</p>
                                </div>
                                
                                <div style="background-color:#FFFFFF; border:3px solid #000000; padding:16px;">
                                    <strong style="color:#000000; font-size:12px; text-transform:uppercase; letter-spacing:1px; font-weight:900;">PASSWORD:</strong>
                                    <p style="margin:8px 0 0 0; color:#000000; font-size:16px; font-family:monospace; font-weight:900;">careervivid123456</p>
                                </div>
                                
                                <div style="background-color:#FF6B6B; border:3px solid #000000; padding:12px; margin-top:16px;">
                                    <p style="color:#000000; font-size:13px; margin:0; font-weight:700;">
                                        ⚠️ CHANGE PASSWORD AFTER FIRST LOGIN!
                                    </p>
                                </div>
                            </div>
                            
                            <!-- Features List -->
                            <div style="background-color:#FFE951; border:4px solid #000000; padding:24px; box-shadow: 6px 6px 0 rgba(0,0,0,1); margin:30px 0;">
                                <h3 style="color:#000000; font-size:20px; margin:0 0 16px 0; font-weight:900; text-transform:uppercase;">WHAT YOU GET:</h3>
                                <ul style="color:#000000; font-size:15px; line-height:1.8; margin:0; padding-left:20px; font-weight:700;">
                                    <li>Post job opportunities</li>
                                    <li>Access talent pool</li>
                                    <li>Track applications</li>
                                    <li>Build employer brand</li>
                                    <li>Priority support</li>
                                </ul>
                            </div>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://careervivid.app/business-partner/dashboard" style="display:inline-block; background-color:#00D9FF; color:#000000; text-decoration:none; padding:18px 40px; border:5px solid #000000; font-weight:900; font-size:18px; text-transform:uppercase; box-shadow: 6px 6px 0 rgba(0,0,0,1); letter-spacing:1px;">
                                            START NOW →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color:#000000; font-size:15px; line-height:1.6; margin:30px 0 20px 0; font-weight:600;">
                                Need help? Just reply to this email. Our team is ready! 💪
                            </p>
                            
                            <p style="color:#000000; font-size:15px; line-height:1.6; margin:0; font-weight:600;">
                                Let's build the future together!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#000000; padding:30px; text-align:center;">
                            <p style="color:#FFE951; font-size:16px; margin:0 0 12px 0; font-weight:900; text-transform:uppercase;">CareerVivid Team</p>
                            <p style="color:#FFFFFF; font-size:13px; margin:0; font-weight:700;">
                                <a href="https://careervivid.app/contact" style="color:#00D9FF; text-decoration:none; font-weight:900;">HELP CENTER</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
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
