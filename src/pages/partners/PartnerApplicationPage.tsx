import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Briefcase, CheckCircle2, Loader2, Rocket, Building2, GraduationCap, Users } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Footer from '../../components/Footer';
import type { PartnerApplicationType } from '../../types';

const editorialGridStyle: React.CSSProperties = {
    backgroundColor: '#f7f1e7',
    backgroundImage: 'linear-gradient(rgba(228, 211, 188, 0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(228, 211, 188, 0.32) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
};

const partnerTypes: PartnerApplicationType[] = ['academic', 'business', 'agency', 'student'];

const normalizePartnerType = (type: string | null): PartnerApplicationType => {
    if (type === 'hiring') return 'business';
    if (type && partnerTypes.includes(type as PartnerApplicationType)) {
        return type as PartnerApplicationType;
    }
    return 'academic';
};

const PartnerApplicationPage: React.FC = () => {
    // Parse URL parameters manually since we are not using react-router-dom provider in App.tsx
    const searchParams = new URLSearchParams(window.location.search);
    const typeParam = normalizePartnerType(searchParams.get('type'));

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
            <div className="min-h-screen flex flex-col text-[#211b16] selection:bg-[#ead9c3]" style={editorialGridStyle}>
                <PublicHeader variant="editorial" />
                <main className="flex-grow flex items-center justify-center p-4">
                    <div className="text-center max-w-lg mx-auto bg-[#fffaf1] border border-[#e4d3bc] rounded-lg p-8 shadow-xl shadow-[#8b5a16]/10">
                        <div className="w-20 h-20 bg-[#e8f0e6] text-[#2f6f5e] rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} />
                        </div>
                        <h1 className="text-3xl font-bold mb-4 text-[#211b16]">Application Received!</h1>
                        <p className="text-[#665a4a] mb-8">
                            Thank you for your interest in the CareerVivid Partner Program. Our team will review your application and get back to you within <strong className="text-[#211b16]">24-48 hours</strong> during business days.
                        </p>
                        <a href="/" className="text-[#8b5a16] font-semibold hover:underline">
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
            case 'agency': return <Briefcase className="w-6 h-6" />;
            case 'student': return <Users className="w-6 h-6" />;
            default: return <GraduationCap className="w-6 h-6" />;
        }
    };

    const getTitle = () => {
        switch (formData.type) {
            case 'business': return "Business Partner Application";
            case 'agency': return "Agency Partner Application";
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
            case 'agency':
                return [
                    "Start a 14-day branch pilot",
                    "Prepare walk-in applicants",
                    "Co-brand a candidate prep portal",
                    "Track resume readiness scores",
                    "Reduce recruiter resume cleanup time"
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
        <div className="text-[#211b16] min-h-screen flex flex-col selection:bg-[#ead9c3]" style={editorialGridStyle}>
            <PublicHeader variant="editorial" />
            <main className="flex-grow pt-24 pb-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center p-3 bg-[#ead9c3] rounded-lg mb-4 text-[#8b5a16]">
                            {getTypeIcon()}
                        </div>
                        <h1 className="text-3xl font-bold mb-2 text-[#211b16]">{getTitle()}</h1>
                        <p className="text-[#665a4a]">
                            Fill out the details below and we'll be in touch shortly.
                        </p>
                    </div>

                    {/* Response Time Notice */}
                    <div className="bg-[#fffaf1]/90 border border-[#e4d3bc] rounded-lg p-6 mb-8 shadow-sm shadow-[#8b5a16]/5">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-[#ead9c3] rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-[#8b5a16]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-[#211b16] mb-1">
                                    Quick Response Guaranteed
                                </h3>
                                <p className="text-sm text-[#665a4a]">
                                    Our partnership team reviews all applications carefully. You can expect to hear back from us within <span className="font-semibold text-[#8b5a16]">24-48 hours</span> during business days.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-[#fffaf1] p-8 rounded-lg shadow-lg shadow-[#8b5a16]/10 border border-[#e4d3bc] space-y-6">

                        {/* Partner Type Selector */}
                        <div className="grid grid-cols-2 gap-3 p-1 bg-[#f1e2ce] rounded-lg sm:grid-cols-4">
                            {partnerTypes.map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type })}
                                    className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${formData.type === type
                                        ? 'bg-[#fffaf1] text-[#8b5a16] shadow-sm'
                                        : 'text-[#665a4a] hover:text-[#211b16]'
                                        }`}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[#211b16]">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#fdf5e8] border border-[#e4d3bc] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa782] text-[#211b16] placeholder-[#a8957f]"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[#211b16]">Work Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#fdf5e8] border border-[#e4d3bc] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa782] text-[#211b16] placeholder-[#a8957f]"
                                    placeholder="jane.doe@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[#211b16]">
                                {formData.type === 'student' ? 'University / College' : 'Organization Name'}
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.organization}
                                onChange={e => setFormData({ ...formData, organization: e.target.value })}
                                className="w-full px-4 py-3 bg-[#fdf5e8] border border-[#e4d3bc] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa782] text-[#211b16] placeholder-[#a8957f]"
                                placeholder={formData.type === 'student' ? 'Stanford University' : 'Acme Corp'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[#211b16]">Website / LinkedIn</label>
                            <input
                                type="text"
                                value={formData.website}
                                onChange={e => setFormData({ ...formData, website: e.target.value })}
                                className="w-full px-4 py-3 bg-[#fdf5e8] border border-[#e4d3bc] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa782] text-[#211b16] placeholder-[#a8957f]"
                                placeholder="https://..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[#211b16]">How can we help you?</label>

                            {/* Goal Templates */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {getGoalTemplates(formData.type).map((template, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, message: template })}
                                        className="px-3 py-1.5 text-xs font-medium bg-[#f7f1e7] hover:bg-[#ead9c3] text-[#665a4a] hover:text-[#211b16] rounded-full transition-colors border border-[#e4d3bc] hover:border-[#bfa782]"
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
                                className="w-full px-4 py-3 bg-[#fdf5e8] border border-[#e4d3bc] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa782] text-[#211b16] placeholder-[#a8957f]"
                                placeholder="Tell us about your goals..."
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-[#f4d9d2] text-[#9d3f2b] rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#211b16] hover:bg-[#3a2f26] text-[#fffaf1] font-bold rounded-lg transition-all shadow-lg hover:shadow-[#8b5a16]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
