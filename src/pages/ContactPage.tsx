

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { Send, Loader2, CheckCircle, CreditCard, Activity } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
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
            await addDoc(collection(db, 'contact_messages'), {
                name,
                email,
                subject,
                message,
                status: 'unread',
                timestamp: serverTimestamp(),
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
        <div className="bg-white dark:bg-gray-950 min-h-screen flex flex-col font-sans text-gray-900 dark:text-white">
            <PublicHeader />
            <main className="flex-grow pt-24 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Support & Contact</h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
                            {t('contact.subtitle')}
                        </p>

                        {/* Direct Email Channels */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                            <a href="mailto:support@careervivid.app" className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 block group">
                                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Send size={20} />
                                </div>
                                <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">General Support</h3>
                                <p className="text-sm text-gray-500">support@careervivid.app</p>
                            </a>
                            <a href="mailto:billing@careervivid.app" className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 block group">
                                <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CreditCard size={20} />
                                </div>
                                <h3 className="font-bold text-lg mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Billing & Subscriptions</h3>
                                <p className="text-sm text-gray-500">billing@careervivid.app</p>
                            </a>
                            <a href="mailto:partners@careervivid.app" className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 block group">
                                <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Activity size={20} />
                                </div>
                                <h3 className="font-bold text-lg mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Partnerships & Media</h3>
                                <p className="text-sm text-gray-500">partners@careervivid.app</p>
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* FAQ Section */}
                        <div>
                            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                                <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 p-2 rounded-lg">?</span>
                                {t('contact.faq_title')}
                            </h2>
                            <FAQSection />
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold mb-2">{t('contact.form_title')}</h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {t('contact.form_subtitle')}
                                </p>
                            </div>
                            {success && (
                                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-xl flex items-center gap-3 animate-fade-in mb-6">
                                    <CheckCircle size={20} />
                                    <div>
                                        <p className="font-bold">{t('contact.success_title')}</p>
                                        <p className="text-sm">{success}</p>
                                    </div>
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('contact.label_name')}</label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 transition-all"
                                        placeholder={t('contact.placeholder_name')}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('contact.label_email')}</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 transition-all"
                                        placeholder={t('contact.placeholder_email')}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('contact.label_subject')}</label>
                                    <input
                                        type="text"
                                        id="subject"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 transition-all"
                                        placeholder={t('contact.placeholder_subject')}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('contact.label_message')}</label>
                                    <textarea
                                        id="message"
                                        rows={4}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 transition-all resize-none"
                                        placeholder={t('contact.placeholder_message')}
                                        required
                                    ></textarea>
                                </div>
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-primary-700 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                                    {isSubmitting ? t('common.loading') : t('contact.button_send')}
                                </button>
                            </form>
                            {success && (
                                <div className="mt-6 text-center">
                                    <button onClick={() => setSuccess(null)} className="text-primary-600 font-bold hover:underline">
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
