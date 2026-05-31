import React from 'react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { FileText, Activity, AlertTriangle, CreditCard, Shield } from 'lucide-react';

const TermsOfServicePage: React.FC = () => {
    const sections = [
        {
            icon: <FileText size={24} />,
            title: 'Account Terms',
            items: [
                {
                    title: 'Registration & Security',
                    content: 'By registering for CareerVivid, you agree to provide accurate and complete information. You are responsible for maintaining the security of your account credentials. You must immediately notify us of any unauthorized use of your account. We are not liable for any loss or damage arising from your failure to comply with this security obligation.'
                },
                {
                    title: 'Eligibility',
                    content: 'You must be at least 16 years old to use this Service. By creating an account, you warrant that you meet this age requirement and have the legal capacity to enter into a binding contract.'
                }
            ]
        },
        {
            icon: <Activity size={24} />,
            title: 'Acceptable Use Policy',
            items: [
                {
                    title: 'Prohibited Content',
                    content: 'You strictly agree NOT to use CareerVivid (including Bio-Link pages) to post: illegal content, hate speech, malware, phishing links, sexually explicit material, or content that infringes on intellectual property rights. We reserve the right to remove such content and suspend accounts without notice.'
                },
                {
                    title: 'Bio-Link Commerce',
                    content: 'If you use the "Store" feature, YOU are the Merchant of Record. CareerVivid is not a party to your transactions. You are solely responsible for product fulfillment, customer support, refunds, and tax obligations. You indemnify CareerVivid against any claims arising from your sales.'
                }
            ]
        },
        {
            icon: <CreditCard size={24} />,
            title: 'Payment & Subscriptions',
            items: [
                {
                    title: 'Subscription Terms',
                    content: 'Subscriptions renew automatically at the end of each billing period unless canceled. You authorize us to charge your payment method for the renewal term.'
                },
                {
                    title: 'Cancellation & Refunds',
                    content: 'You may cancel your "Bio-Link Pro" or other subscriptions at ANY TIME via your dashboard. You will retain access until the end of your complete billing cycle. We offer a 7-day money-back guarantee for initial purchases only. Refunds are not available for renewal charges or one-time digital downloads once used.'
                }
            ]
        },
        {
            icon: <Shield size={24} />,
            title: 'Intellectual Property',
            items: [
                {
                    title: 'Your Content',
                    content: 'You retain full ownership of the resumes, portfolios, and data you upload. You grant CareerVivid a limited license to host and display this content solely for providing the Service to you.'
                },
                {
                    title: 'Platform Rights',
                    content: 'CareerVivid owns all rights to the platform code, design, logos, and trademarks. You may not copy, modify, or reverse engineer any part of the Service.'
                }
            ]
        },
        {
            icon: <AlertTriangle size={24} />,
            title: 'Liability & Disclaimers',
            items: [
                {
                    title: 'Disclaimer of Warranties',
                    content: 'The Service is provided "AS IS" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, error-free, or completely secure.'
                },
                {
                    title: 'Limitation of Liability',
                    content: 'To the maximum extent permitted by law, CareerVivid shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use or inability to use the Service.'
                }
            ]
        },
        {
            icon: <AlertTriangle size={24} />,
            title: 'Legal Contact',
            items: [
                {
                    title: 'Formal Notices',
                    content: 'For any formal legal notices, subpoenas, or intellectual property disputes, please contact our legal department directly at: legal@careervivid.app. General support inquiries sent to this address will not receive a response.'
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-[#f7f1e7] font-sans text-[#211b16]">
            <PublicHeader variant="editorial" />
            <main className="relative flex-grow overflow-hidden pt-28 pb-20">
                <div
                    className="pointer-events-none absolute inset-0 opacity-55"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, rgba(139, 90, 22, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(139, 90, 22, 0.06) 1px, transparent 1px)',
                        backgroundSize: '64px 64px',
                    }}
                />
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 text-[#211b16]">Terms of Service</h1>
                        <p className="text-xl font-medium text-[#665a4a]">
                            Effective Date: January 19, 2026
                        </p>
                    </div>

                    <div className="space-y-12">
                        {sections.map((section, idx) => (
                            <div key={idx} className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-8 shadow-sm shadow-[#8b5a16]/5 md:p-12">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="rounded-xl bg-[#eef4ff] p-3 text-[#2563eb]">
                                        {section.icon}
                                    </div>
                                    <h2 className="text-2xl font-black text-[#211b16]">{section.title}</h2>
                                </div>
                                <div className="space-y-6">
                                    {section.items.map((item, itemIdx) => (
                                        <div key={itemIdx} className="border-b border-[#eadbc5] last:border-0 pb-6 last:pb-0">
                                            <h3 className="text-lg font-black mb-2 text-[#211b16]">{item.title}</h3>
                                            <p className="leading-relaxed text-[#665a4a]">
                                                {item.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TermsOfServicePage;
