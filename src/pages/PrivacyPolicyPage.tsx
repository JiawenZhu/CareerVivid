import React from 'react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { Shield, Lock, Eye, CheckCircle, Smartphone } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
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
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 text-[#211b16]">Privacy Policy</h1>
                        <p className="text-xl font-medium text-[#665a4a]">
                            Your privacy is our priority. Effective Date: January 19, 2026
                        </p>
                    </div>

                    <div className="space-y-12">
                        {/* Information Collection */}
                        <section className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-8 shadow-sm shadow-[#8b5a16]/5 md:p-12">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="rounded-xl bg-[#f4e5cf] p-3 text-[#a97935]">
                                    <Eye size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-[#211b16]">Information We Collect</h2>
                            </div>
                            <div className="space-y-4 leading-relaxed text-[#665a4a]">
                                <p><strong>Account Information:</strong> We collect your name, email address, and password when you register.</p>
                                <p><strong>Usage Data:</strong> We automatically collect log data such as your IP address, browser type, and pages visited to improve platform performance and security.</p>
                                <p><strong>Third-Party Integrations:</strong> If you connect accounts like TikTok or Google, we collect only the information you explicitly authorize (e.g., public profile stats). We do NOT access private messages or passwords.</p>
                                <p><strong>Cookies:</strong> We use cookies to maintain your session and preference settings.</p>
                            </div>
                        </section>

                        {/* Chrome Extension Specific Policy */}
                        <section className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-8 shadow-sm shadow-[#8b5a16]/5 md:p-12">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="rounded-xl bg-[#eef4ff] p-3 text-[#2563eb]">
                                    <Shield size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-[#211b16]">Chrome Extension Data Transparency</h2>
                            </div>
                            <div className="space-y-4 leading-relaxed text-[#665a4a]">
                                <p>
                                    The CareerVivid Chrome extension helps job seekers save job postings, tailor career materials,
                                    autofill application forms, track applications, and prepare for interviews from their CareerVivid account.
                                </p>
                                <p>
                                    To provide these user-facing features, the extension may process job posting content, application form
                                    labels and options, the current page URL and title, selected resume profile data, generated application
                                    answers, generated cover letters, saved job records, and authentication state needed to keep you signed in.
                                </p>
                                <p>
                                    Extension permissions are used only for CareerVivid job-search, resume-tailoring, application-tracking,
                                    and autofill features you request. We do <strong>NOT</strong> sell extension-collected data, use it for
                                    personalized advertising, or use it to determine creditworthiness.
                                </p>
                                <p>
                                    The use of information received from Google APIs will adhere to the Chrome Web Store User Data Policy,
                                    including the Limited Use requirements.
                                </p>
                            </div>
                        </section>

                        {/* TikTok Specific Policy */}
                        <section className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-8 shadow-sm shadow-[#8b5a16]/5 md:p-12">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="rounded-xl bg-[#eef4ff] p-3 text-[#2563eb]">
                                    <Smartphone size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-[#211b16]">TikTok Data Transparency</h2>
                            </div>
                            <div className="space-y-4 leading-relaxed text-[#665a4a]">
                                <p>
                                    Our "Media Kit" feature integrates with the official TikTok API. This integration is strictly <strong>READ-ONLY</strong>.
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>We only fetch <strong>Public Data</strong>: Follower count, video views, likes, and profile avatar.</li>
                                    <li>We do <strong>NOT</strong> have access to your Direct Messages (DMs).</li>
                                    <li>We do <strong>NOT</strong> have the ability to post video content on your behalf.</li>
                                    <li>We do <strong>NOT</strong> sell your TikTok engagement data to third-party advertisers.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Data Usage & Sharing */}
                        <section className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-8 shadow-sm shadow-[#8b5a16]/5 md:p-12">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="rounded-xl bg-[#eef4ff] p-3 text-[#2563eb]">
                                    <Lock size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-[#211b16]">How We Use & Share Information</h2>
                            </div>
                            <div className="space-y-4 leading-relaxed text-[#665a4a]">
                                <p>We use your data to:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Provide and maintain the Service.</li>
                                    <li>Process payments (via Stripe - we do not store credit card numbers).</li>
                                    <li>Send service notifications (e.g., billing, security alerts).</li>
                                </ul>
                                <p className="mt-4"><strong>Data Sharing:</strong> We do NOT sell your personal data. We only share data with trusted processors (like Firebase for hosting, Stripe for payments) necessary to operate the service.</p>
                            </div>
                        </section>

                        {/* User Rights */}
                        <section className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-8 shadow-sm shadow-[#8b5a16]/5 md:p-12">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="rounded-xl bg-[#f4e5cf] p-3 text-[#a97935]">
                                    <CheckCircle size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-[#211b16]">Your Rights</h2>
                            </div>
                            <div className="space-y-4 leading-relaxed text-[#665a4a]">
                                <p>Depending on your location (e.g., EU under GDPR, California under CCPA), you have rights to:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>Access:</strong> Request a copy of your personal data.</li>
                                    <li><strong>Correction:</strong> Update inaccurate information via your account settings.</li>
                                    <li><strong>Deletion:</strong> Request permanent deletion of your account and data.</li>
                                </ul>
                                <p className="mt-4">
                                    To exercise these rights, please contact us at <a href="mailto:privacy@careervivid.app" className="font-semibold text-[#2563eb] hover:text-[#a97935] hover:underline">privacy@careervivid.app</a>.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PrivacyPolicyPage;
