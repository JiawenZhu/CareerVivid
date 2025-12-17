import React from 'react';
import { ArrowRight, Briefcase, Target, BarChart3, Zap, CheckCircle2, Users } from 'lucide-react';
import { navigate } from '../../App';
import PublicHeader from '../../components/PublicHeader';
import Footer from '../../components/Footer';

const HRPartnerPage: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
            <PublicHeader />
            <main className="flex-grow pt-20">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950/30 dark:via-gray-950 dark:to-blue-950/30 py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl text-purple-600 dark:text-purple-300 mb-6">
                            <Briefcase size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            Hire Smarter, Faster
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                            Access a pipeline of pre-vetted, interview-ready candidates optimized by our AI.
                        </p>
                        <button
                            onClick={() => navigate('/partners/apply?type=hiring')}
                            className="px-8 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mx-auto"
                        >
                            Become a Hiring Partner
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center group hover:scale-105 transition-transform">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600 dark:text-purple-400 group-hover:shadow-lg transition-shadow">
                                <Target size={32} />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Talent Discovery</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Search our database of portfolios and AI-optimized resumes.
                            </p>
                        </div>

                        <div className="text-center group hover:scale-105 transition-transform">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600 dark:text-purple-400 group-hover:shadow-lg transition-shadow">
                                <Zap size={32} />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Co-Branded Sprints</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Host virtual hiring events directly on the CareerVivid platform.
                            </p>
                        </div>

                        <div className="text-center group hover:scale-105 transition-transform">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600 dark:text-purple-400 group-hover:shadow-lg transition-shadow">
                                <BarChart3 size={32} />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Precision Matching</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Our AI matches candidates to your job descriptions with 95% accuracy.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="bg-gray-50 dark:bg-gray-900/50 py-20">
                    <div className="max-w-4xl mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center mb-12">Why Partner With Us?</h2>
                        <div className="space-y-6">
                            {[
                                'Access to pre-screened candidates who have completed AI interview practice',
                                'Streamlined application process - candidates apply with their CareerVivid resumes',
                                'Advanced applicant tracking with AI-powered insights',
                                'Real-time analytics on application trends and candidate quality',
                                'Integrated messaging and scheduling tools',
                                'Co-branded hiring events and job fairs'
                            ].map((benefit, idx) => (
                                <div key={idx} className="flex items-start gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-white">
                        <Users className="w-16 h-16 mx-auto mb-6" />
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Transform Your Hiring?
                        </h2>
                        <p className="text-lg mb-8 text-purple-100">
                            Join top companies using CareerVivid to build exceptional teams.
                        </p>
                        <button
                            onClick={() => navigate('/partners/apply?type=hiring')}
                            className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg inline-flex items-center gap-2"
                        >
                            Get Started Today
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default HRPartnerPage;
