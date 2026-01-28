import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { ChevronDown, Shield, FileText, CreditCard, Link as LinkIcon } from 'lucide-react';

interface PolicySection {
    icon: React.ReactNode;
    title: string;
    slug: string;
    items: { question: string; answer: string }[];
}

const PolicyPage: React.FC = () => {
    const { t } = useTranslation();
    const [openIndex, setOpenIndex] = useState<string | null>(null);

    const toggleItem = (id: string) => {
        setOpenIndex(openIndex === id ? null : id);
    };

    // Auto-scroll to section based on hash
    React.useEffect(() => {
        if (window.location.hash) {
            const id = window.location.hash.substring(1);
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    // Provide visual feedback
                    element.classList.add('ring-4', 'ring-indigo-200', 'dark:ring-indigo-900');
                    setTimeout(() => element.classList.remove('ring-4', 'ring-indigo-200', 'dark:ring-indigo-900'), 2000);
                }
            }, 500); // Small delay to ensure render
        }
    }, []);

    const policySections: PolicySection[] = [
        {
            icon: <CreditCard size={24} />,
            title: 'Refund Policy',
            slug: 'refund',
            items: [
                {
                    question: 'What is your refund policy?',
                    answer: 'We offer a 7-day money-back guarantee for all subscription plans (Monthly and Sprint). If you are not satisfied with your purchase, contact us within 7 days of your initial purchase for a full refund. Refunds are not available for one-time PDF download purchases once the download has been used.'
                },
                {
                    question: 'How do I request a refund?',
                    answer: 'To request a refund, email us at support@careervivid.app with your account email and order details. Include your reason for the refund request (optional but helpful for us to improve). We will process approved refunds within 5-10 business days to your original payment method.'
                },
                {
                    question: 'Are there any refund exceptions?',
                    answer: 'Refunds are not available after the 7-day window has passed, for renewed subscriptions (only initial purchases qualify), or if your account has been terminated for violating our Terms of Service. One-time PDF download credits cannot be refunded once they have been used to generate a PDF.'
                },
                {
                    question: 'What happens to my data after a refund?',
                    answer: 'After a refund is processed, your account will be downgraded to the Free plan. Your resumes and data will be preserved, but you will be subject to Free plan limitations (2 resumes max, 10 AI credits per month). You can continue to access and export your data at any time.'
                },
                {
                    question: 'Can I get a partial refund for monthly subscriptions?',
                    answer: 'We do not offer prorated refunds for monthly subscriptions. If you cancel your monthly subscription, you will retain access to Pro features until the end of your current billing period, and you will not be charged again. No refund will be issued for the remaining days in your billing cycle unless you are within the 7-day money-back guarantee window from your initial purchase.'
                },
                {
                    question: 'What about academic or business partner pricing?',
                    answer: 'Academic partners and business partners may have custom pricing agreements with different refund terms. Please refer to your partnership agreement or contact your partnership manager for specific refund policies applicable to your account.'
                }
            ]
        },
        {
            icon: <FileText size={24} />,
            title: 'Terms of Service',
            slug: 'terms',
            items: [
                {
                    question: 'Who can use CareerVivid?',
                    answer: 'CareerVivid is available to users who are at least 16 years old. By using our service, you represent that you meet this age requirement and have the legal capacity to enter into a binding agreement. If you are using the service on behalf of an organization, you represent that you have the authority to bind that organization.'
                },
                {
                    question: 'What is our acceptable use policy?',
                    answer: 'You agree not to use CareerVivid to create false or misleading resumes, violate any laws or regulations, infringe on intellectual property rights, transmit malicious code, or attempt to gain unauthorized access to our systems. You are responsible for maintaining the confidentiality of your account credentials.'
                },
                {
                    question: 'Who owns the content you create?',
                    answer: 'You retain all rights to the content you create using CareerVivid, including your resumes and portfolio. By using our service, you grant us a limited license to host, store, and display your content solely for the purpose of providing our services to you. We will never use your resume content for any other purpose without your explicit consent.'
                },
                {
                    question: 'What are the subscription terms?',
                    answer: 'Subscriptions automatically renew at the end of each billing period unless canceled. You can cancel your subscription at any time through your account settings. If you cancel, you will retain access to Pro features until the end of your current billing period. One-time purchases (Sprint plan, PDF downloads) do not auto-renew.'
                },
                {
                    question: 'Can we modify the service or terms?',
                    answer: 'We reserve the right to modify or discontinue the service at any time, with or without notice. We may also update these Terms of Service from time to time. If we make material changes, we will notify you by email or through a notice on our website. Your continued use of the service after such changes constitutes acceptance of the new terms.'
                },
                {
                    question: 'What is our liability disclaimer?',
                    answer: 'CareerVivid is provided "as is" without warranties of any kind. We do not guarantee that our service will be uninterrupted, secure, or error-free. To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the service.'
                }
            ]
        },
        {
            icon: <Shield size={24} />,
            title: 'Privacy Policy',
            slug: 'privacy',
            items: [
                {
                    question: 'What information do we collect?',
                    answer: 'We collect information you provide directly to us, including your name, email address, resume data, and any other information you choose to provide. We also automatically collect certain information about your device when you use our service, including IP address, browser type, and usage data.'
                },
                {
                    question: 'How do we use your information?',
                    answer: 'We treat your data with the utmost respect and use it primarily to deliver the CareerVivid experience. We analyze system usage and technical logs solely for the purpose of identifying bugs, resolving technical errors, and improving product stability. We do not use your personal data for any purpose other than providing and enhancing our service for you.'
                },
                {
                    question: 'How do we protect your information?',
                    answer: 'We implement appropriate technical and organizational security measures to protect your personal information. All data is encrypted in transit using SSL/TLS, and we use industry-standard encryption for data at rest. We regularly review and update our security practices.'
                },
                {
                    question: 'Do we sell or share your information?',
                    answer: 'No. **We strictly do not sell, trade, or rent your personal information to third-party companies.** Your data belongs exclusively to you. We strictly limit data sharing to essential service providers (like payment processors) or instances where you explicitly choose to publish or share your own content (such as sending a resume link). We only facilitate the sharing that you request.'
                },
                {
                    question: 'What are your data rights?',
                    answer: 'You have the right to access, update, or delete your personal information at any time through your account settings. You can also request a copy of your data or request that we delete your account and all associated data. Contact us at support@careervivid.app for data-related requests.'
                },
                {
                    question: 'Do we use cookies?',
                    answer: 'Yes, we use cookies and similar tracking technologies to track activity on our service and hold certain information. Cookies help us improve your experience, understand how you use our service, and deliver personalized content. You can control cookies through your browser settings.'
                }
            ]
        },
        {
            icon: <LinkIcon size={24} />,
            title: 'Bio-Link & Creators',
            slug: 'bio-link',
            items: [
                {
                    question: 'What content is allowed on my Bio-Link page?',
                    answer: 'Your Bio-Link page is a space for your personal brand. However, you strictly agree NOT to post: illegal content, hate speech, malware/phishing links, sexually explicit material, or content that infringes on others\' intellectual property. We reserve the right to suspend any account violating these guidelines without notice.'
                },
                {
                    question: 'Who is responsible for items sold via Bio-Link Store?',
                    answer: 'If you use the "Commerce" or "Store" features to sell digital or physical goods, YOU are the merchant of record. CareerVivid provides the platform but is not a party to the transaction. You are responsible for product fulfillment, customer support, refunds, and tax obligations associated with your sales. We are not liable for disputes between you and your customers.'
                },
                {
                    question: 'How do you track analytics for my Bio-Link?',
                    answer: 'We collect aggregated engagement data (page views, link clicks, device type) to provide you with the "Analytics Dashboard". This data is collected to help you grow your audience. We do not sell this visitor data to third-party advertisers. Visitor privacy is respected in accordance with our general Privacy Policy.'
                },
                {
                    question: 'Can I remove the "Powered by CareerVivid" branding?',
                    answer: 'Yes, users on the "Bio-Link Pro" or "All-Access" plans have the option to remove the footer branding from their public Bio-Link pages. Free plan users must retain the branding link.'
                },
                {
                    question: 'Are there limits on traffic or links?',
                    answer: 'We want you to grow! We currently do not enforce hard limits on traffic or the number of links for fair usage. However, we reserve the right to limit access to accounts with abnormal traffic patterns (e.g., bot attacks, DDoS originators) that threaten the stability of our platform for other users.'
                },
                {
                    question: 'Can I cancel my subscription anytime?',
                    answer: 'Absolutely. We believe in creative freedom, not contracts. You can cancel your Bio-Link Pro subscription at any time with a single click in your dashboard. You will retain access to Pro features until the end of your billing cycle, after which your account will revert to the Free plan. No questions asked.'
                },
                {
                    question: 'How does the TikTok integration work with my data?',
                    answer: 'Our TikTok integration uses the official TikTok API to display your public stats (followers, views, likes) on your Bio-Link page. This connection is READ-ONLY. We do NOT have access to your password, direct messages, or private settings. We simply fetch your public metrics to showcase them on your profile.'
                }
            ]
        }
    ];

    return (
        <div className="bg-white dark:bg-gray-950 min-h-screen flex flex-col font-sans text-gray-900 dark:text-white">
            <PublicHeader />
            <main className="flex-grow pt-24 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Hero Section */}
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Legal & Policies</h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400">
                            Our commitment to transparency, privacy, and your rights
                        </p>

                        {/* Quick Navigation */}
                        <div className="flex flex-wrap justify-center gap-4 mt-8">
                            {policySections.map((section) => (
                                <a
                                    key={section.slug}
                                    href={`#${section.slug}`}
                                    className="relative px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors shadow-sm text-sm font-medium"
                                >
                                    {section.title}
                                    {section.slug === 'bio-link' && (
                                        <span className="absolute -top-2 -right-2 flex h-4 w-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 text-[8px] text-white font-bold items-center justify-center border-2 border-white dark:border-gray-800">
                                            </span>
                                        </span>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Policy Sections */}
                    <div className="space-y-12">
                        {policySections.map((section, sectionIdx) => (
                            <div key={sectionIdx} id={section.slug} className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-8 md:p-12 scroll-mt-28">
                                {/* Section Header */}
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 p-3 rounded-xl">
                                        {section.icon}
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {section.title}
                                    </h2>
                                </div>

                                {/* Accordion Items */}
                                <div className="space-y-4">
                                    {section.items.map((item, itemIdx) => {
                                        const itemId = `${sectionIdx}-${itemIdx}`;
                                        const isOpen = openIndex === itemId;

                                        return (
                                            <div
                                                key={itemId}
                                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md"
                                            >
                                                <button
                                                    onClick={() => toggleItem(itemId)}
                                                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none group"
                                                >
                                                    <span className="text-lg font-semibold text-gray-900 dark:text-white pr-8 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                        {item.question}
                                                    </span>
                                                    <ChevronDown
                                                        className={`flex-shrink-0 text-gray-500 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''
                                                            }`}
                                                        size={20}
                                                    />
                                                </button>
                                                <div
                                                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                                        }`}
                                                >
                                                    <div className="p-6 pt-0 text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700/50 mt-2">
                                                        {item.answer}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Contact Section */}
                    <div className="mt-16 text-center bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-8 border border-primary-100 dark:border-primary-800">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Have Questions?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            If you have any questions about our policies or need clarification, we're here to help.
                        </p>
                        <a
                            href="/contact"
                            className="inline-block px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                            Contact Support
                        </a>
                    </div>

                    {/* Last Updated */}
                    <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
                        Last updated: December 16, 2025
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PolicyPage;
