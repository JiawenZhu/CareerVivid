import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2, Loader2, Rocket, Building2, GraduationCap, Users } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Footer from '../../components/Footer';

const PartnerApplicationPage: React.FC = () => {
    // Parse URL parameters manually since we are not using react-router-dom provider in App.tsx
    const searchParams = new URLSearchParams(window.location.search);
    const typeParam = searchParams.get('type') || 'academic';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        organization: '',
        website: '',
        type: typeParam,
        message: ''
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (typeParam) {
            setFormData(prev => ({ ...prev, type: typeParam }));
        }
    }, [typeParam]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await addDoc(collection(db, 'partner_applications'), {
                ...formData,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            setSuccess(true);
        } catch (err: any) {
            console.error("Error submitting application:", err);
            setError("Something went wrong. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-white dark:bg-gray-950 min-h-screen flex flex-col">
                <PublicHeader />
                <main className="flex-grow flex items-center justify-center p-4">
                    <div className="text-center max-w-lg mx-auto">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} />
                        </div>
                        <h1 className="text-3xl font-bold mb-4">Application Received!</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            Thank you for your interest in the CareerVivid Partner Program. Our team will review your application and get back to you within 48 hours.
                        </p>
                        <a href="/" className="text-primary-600 font-semibold hover:underline">
                            Return to Home
                        </a>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const getTypeIcon = () => {
        switch (formData.type) {
            case 'business': return <Building2 className="w-6 h-6" />;
            case 'student': return <Users className="w-6 h-6" />;
            default: return <GraduationCap className="w-6 h-6" />;
        }
    };

    const getTitle = () => {
        switch (formData.type) {
            case 'business': return "Business Partner Application";
            case 'student': return "Student Ambassador Application";
            default: return "Academic Partner Application";
        }
    };

    const getGoalTemplates = (type: string) => {
        switch (type) {
            case 'academic':
                return [
                    "Integrate CareerVivid into our curriculum",
                    "Provide premium access to all students",
                    "Track student placement & interview success",
                    "Request a demo for faculty",
                    "Explore partnership for career fair"
                ];
            case 'business':
                return [
                    "Hire interns or full-time graduates",
                    "Host a virtual hackathon or event",
                    "Sponsor student licenses",
                    "Access AI-vetted candidate pool",
                    "Improve our employer branding"
                ];
            case 'student':
                return [
                    "Start a CareerVivid club on campus",
                    "Host a resume workshop for peers",
                    "Become a campus brand ambassador",
                    "Earn rewards for referrals",
                    "Gain leadership experience"
                ];
            default:
                return [];
        }
    };

    return (
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
            <PublicHeader />
            <main className="flex-grow pt-24 pb-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center p-3 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4 text-primary-600">
                            {getTypeIcon()}
                        </div>
                        <h1 className="text-3xl font-bold mb-2">{getTitle()}</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Fill out the details below and we'll be in touch shortly.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 space-y-6">

                        {/* Partner Type Selector */}
                        <div className="grid grid-cols-3 gap-3 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            {['academic', 'business', 'student'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type })}
                                    className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${formData.type === type
                                        ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Work Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="john@company.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {formData.type === 'student' ? 'University / College' : 'Organization Name'}
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.organization}
                                onChange={e => setFormData({ ...formData, organization: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder={formData.type === 'student' ? 'Stanford University' : 'Acme Corp'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Website / LinkedIn</label>
                            <input
                                type="text"
                                value={formData.website}
                                onChange={e => setFormData({ ...formData, website: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="https://..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">How can we help you?</label>

                            {/* Goal Templates */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {getGoalTemplates(formData.type).map((template, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, message: template })}
                                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-full transition-colors border border-transparent hover:border-primary-100 dark:hover:border-primary-800"
                                    >
                                        {template}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                required
                                rows={4}
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Tell us about your goals..."
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Rocket size={20} />}
                            Submit Application
                        </button>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PartnerApplicationPage;
