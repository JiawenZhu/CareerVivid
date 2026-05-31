

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { Send, Loader2, CheckCircle, CreditCard, Activity } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import FAQSection from '../components/FAQSection';

const ContactPage: React.FC = () => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !subject || !message) {
            setError("Please fill in all fields.");
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const submitContactMessage = httpsCallable(functions, 'submitContactMessage');
            await submitContactMessage({
                name,
                email,
                subject,
                message,
            });
            setSuccess(t('contact.success_message'));
            setName('');
            setEmail('');
            setSubject('');
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            setError(t('contact.error_send_failed'));
        } finally {
            setIsSubmitting(false);
        }
    };

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
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 text-[#211b16]">Support & Contact</h1>
                        <p className="text-xl font-medium text-[#665a4a] mb-12">
                            {t('contact.subtitle')}
                        </p>

                        {/* Direct Email Channels */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                            <a href="mailto:support@careervivid.app" className="block rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-6 shadow-sm shadow-[#8b5a16]/5 transition-all hover:-translate-y-1 hover:border-[#a97935] hover:shadow-xl hover:shadow-[#8b5a16]/10 group">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#2563eb]">
                                    <Send size={20} />
                                </div>
                                <h3 className="font-black text-lg mb-1 text-[#211b16] transition-colors group-hover:text-[#2563eb]">General Support</h3>
                                <p className="text-sm font-medium text-[#665a4a]">support@careervivid.app</p>
                            </a>
                            <a href="mailto:billing@careervivid.app" className="block rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-6 shadow-sm shadow-[#8b5a16]/5 transition-all hover:-translate-y-1 hover:border-[#a97935] hover:shadow-xl hover:shadow-[#8b5a16]/10 group">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f4e5cf] text-[#a97935]">
                                    <CreditCard size={20} />
                                </div>
                                <h3 className="font-black text-lg mb-1 text-[#211b16] transition-colors group-hover:text-[#a97935]">Billing & Subscriptions</h3>
                                <p className="text-sm font-medium text-[#665a4a]">billing@careervivid.app</p>
                            </a>
                            <a href="mailto:partners@careervivid.app" className="block rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-6 shadow-sm shadow-[#8b5a16]/5 transition-all hover:-translate-y-1 hover:border-[#a97935] hover:shadow-xl hover:shadow-[#8b5a16]/10 group">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#2563eb]">
                                    <Activity size={20} />
                                </div>
                                <h3 className="font-black text-lg mb-1 text-[#211b16] transition-colors group-hover:text-[#2563eb]">Partnerships & Media</h3>
                                <p className="text-sm font-medium text-[#665a4a]">partners@careervivid.app</p>
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* FAQ Section */}
                        <div>
                            <h2 className="text-2xl font-black mb-8 flex items-center gap-2 text-[#211b16]">
                                <span className="rounded-lg bg-[#eef4ff] p-2 text-[#2563eb]">?</span>
                                {t('contact.faq_title')}
                            </h2>
                            <style>
                                {`
                                    .editorial-faq-shell section {
                                        background: transparent !important;
                                        padding-top: 0 !important;
                                        padding-bottom: 0 !important;
                                    }

                                    .editorial-faq-shell section > div {
                                        max-width: none !important;
                                        padding-left: 0 !important;
                                        padding-right: 0 !important;
                                    }

                                    .editorial-faq-shell section > div > div:first-child .inline-flex {
                                        background: #eef4ff !important;
                                        color: #2563eb !important;
                                    }

                                    .editorial-faq-shell section > div > div:last-child > div {
                                        background: #fffaf1 !important;
                                        border-color: #e4d3bc !important;
                                        border-radius: 0.75rem !important;
                                    }

                                    .editorial-faq-shell h2,
                                    .editorial-faq-shell button span {
                                        color: #211b16 !important;
                                    }

                                    .editorial-faq-shell p,
                                    .editorial-faq-shell div[class*="leading-relaxed"] {
                                        color: #665a4a !important;
                                    }

                                    .editorial-faq-shell svg {
                                        color: #a97935 !important;
                                    }

                                    .editorial-faq-shell div[class*="border-t"] {
                                        border-color: #eadbc5 !important;
                                    }

                                    html.dark .editorial-faq-shell section > div > div:first-child .inline-flex {
                                        background: #302e2a !important;
                                        color: #caa26c !important;
                                    }

                                    html.dark .editorial-faq-shell section > div > div:last-child > div {
                                        background: #262522 !important;
                                        border-color: #37332d !important;
                                    }

                                    html.dark .editorial-faq-shell h2,
                                    html.dark .editorial-faq-shell button span {
                                        color: #f4f1e9 !important;
                                    }

                                    html.dark .editorial-faq-shell p,
                                    html.dark .editorial-faq-shell div[class*="leading-relaxed"] {
                                        color: #aaa39a !important;
                                    }

                                    html.dark .editorial-faq-shell svg {
                                        color: #caa26c !important;
                                    }

                                    html.dark .editorial-faq-shell div[class*="border-t"] {
                                        border-color: #37332d !important;
                                    }
                                `}
                            </style>
                            <div className="editorial-faq-shell overflow-hidden rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-6 shadow-sm shadow-[#8b5a16]/5">
                                <FAQSection />
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="rounded-xl border border-[#e4d3bc] bg-[#fffaf1] p-8 shadow-xl shadow-[#8b5a16]/10">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black mb-2 text-[#211b16]">{t('contact.form_title')}</h2>
                                <p className="text-[#665a4a]">
                                    {t('contact.form_subtitle')}
                                </p>
                            </div>
                            {success && (
                                <div className="bg-[#f7fff8] text-[#137245] p-4 rounded-xl flex items-center gap-3 animate-fade-in mb-6 border border-[#bcdcc9]">
                                    <CheckCircle size={20} />
                                    <div>
                                        <p className="font-bold">{t('contact.success_title')}</p>
                                        <p className="text-sm">{success}</p>
                                    </div>
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-bold text-[#211b16] mb-1">{t('contact.label_name')}</label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-lg border border-[#e4d3bc] bg-[#fffaf1] px-4 py-3 text-[#211b16] transition-all placeholder:text-[#9a8c7a] focus:border-transparent focus:ring-2 focus:ring-[#2563eb]"
                                        placeholder={t('contact.placeholder_name')}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-bold text-[#211b16] mb-1">{t('contact.label_email')}</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-lg border border-[#e4d3bc] bg-[#fffaf1] px-4 py-3 text-[#211b16] transition-all placeholder:text-[#9a8c7a] focus:border-transparent focus:ring-2 focus:ring-[#2563eb]"
                                        placeholder={t('contact.placeholder_email')}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-bold text-[#211b16] mb-1">{t('contact.label_subject')}</label>
                                    <input
                                        type="text"
                                        id="subject"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full rounded-lg border border-[#e4d3bc] bg-[#fffaf1] px-4 py-3 text-[#211b16] transition-all placeholder:text-[#9a8c7a] focus:border-transparent focus:ring-2 focus:ring-[#2563eb]"
                                        placeholder={t('contact.placeholder_subject')}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-bold text-[#211b16] mb-1">{t('contact.label_message')}</label>
                                    <textarea
                                        id="message"
                                        rows={4}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full resize-none rounded-lg border border-[#e4d3bc] bg-[#fffaf1] px-4 py-3 text-[#211b16] transition-all placeholder:text-[#9a8c7a] focus:border-transparent focus:ring-2 focus:ring-[#2563eb]"
                                        placeholder={t('contact.placeholder_message')}
                                        required
                                    ></textarea>
                                </div>
                                {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] py-4 font-bold text-white shadow-lg shadow-[#2563eb]/15 transition-all hover:-translate-y-1 hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                                    {isSubmitting ? t('common.loading') : t('contact.button_send')}
                                </button>
                            </form>
                            {success && (
                                <div className="mt-6 text-center">
                                    <button onClick={() => setSuccess(null)} className="font-bold text-[#2563eb] hover:text-[#a97935] hover:underline">
                                        {t('contact.send_another_message')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ContactPage;
