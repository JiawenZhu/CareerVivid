import React from 'react';
import { ArrowRight, Briefcase, Target, BarChart3, Zap, CheckCircle2, Users } from 'lucide-react';
import { navigate } from '../../utils/navigation';
import PublicHeader from '../../components/PublicHeader';
import Footer from '../../components/Footer';

const editorialGridStyle: React.CSSProperties = {
    backgroundColor: '#f7f1e7',
    backgroundImage: 'linear-gradient(rgba(228, 211, 188, 0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(228, 211, 188, 0.32) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
};

const HRPartnerPage: React.FC = () => {
    return (
        <div className="text-[#211b16] min-h-screen flex flex-col selection:bg-[#ead9c3]" style={editorialGridStyle}>
            <PublicHeader variant="editorial" />
            <main className="flex-grow pt-20">
                {/* Hero Section */}
                <section className="bg-[#fffaf1]/70 py-20 px-4 border-b border-[#e4d3bc]">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center p-3 bg-[#ead9c3] rounded-lg text-[#8b5a16] mb-6">
                            <Briefcase size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#211b16]">
                            Hire Smarter, Faster
                        </h1>
                        <p className="text-xl text-[#665a4a] mb-8 max-w-2xl mx-auto">
                            Access a pipeline of pre-vetted, interview-ready candidates optimized by our AI.
                        </p>
                        <button
                            onClick={() => navigate('/partners/apply?type=hiring')}
                            className="px-8 py-4 bg-[#211b16] text-[#fffaf1] rounded-lg font-bold hover:bg-[#3a2f26] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mx-auto"
                        >
                            Become a Hiring Partner
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center group hover:-translate-y-1 transition-transform bg-[#fffaf1] border border-[#e4d3bc] rounded-lg p-6 shadow-sm shadow-[#8b5a16]/5">
                            <div className="w-16 h-16 bg-[#ead9c3] rounded-lg flex items-center justify-center mx-auto mb-4 text-[#8b5a16] group-hover:shadow-lg transition-shadow">
                                <Target size={32} />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-[#211b16]">Talent Discovery</h3>
                            <p className="text-[#665a4a]">
                                Search our database of portfolios and AI-optimized resumes.
                            </p>
                        </div>

                        <div className="text-center group hover:-translate-y-1 transition-transform bg-[#fffaf1] border border-[#e4d3bc] rounded-lg p-6 shadow-sm shadow-[#8b5a16]/5">
                            <div className="w-16 h-16 bg-[#e8f0e6] rounded-lg flex items-center justify-center mx-auto mb-4 text-[#2f6f5e] group-hover:shadow-lg transition-shadow">
                                <Zap size={32} />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-[#211b16]">Co-Branded Sprints</h3>
                            <p className="text-[#665a4a]">
                                Host virtual hiring events directly on the CareerVivid platform.
                            </p>
                        </div>

                        <div className="text-center group hover:-translate-y-1 transition-transform bg-[#fffaf1] border border-[#e4d3bc] rounded-lg p-6 shadow-sm shadow-[#8b5a16]/5">
                            <div className="w-16 h-16 bg-[#ead9c3] rounded-lg flex items-center justify-center mx-auto mb-4 text-[#8b5a16] group-hover:shadow-lg transition-shadow">
                                <BarChart3 size={32} />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-[#211b16]">Precision Matching</h3>
                            <p className="text-[#665a4a]">
                                Our AI matches candidates to your job descriptions with 95% accuracy.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="bg-[#fffaf1]/70 py-20 border-y border-[#e4d3bc]">
                    <div className="max-w-4xl mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center mb-12 text-[#211b16]">Why Partner With Us?</h2>
                        <div className="space-y-6">
                            {[
                                'Access to pre-screened candidates who have completed AI interview practice',
                                'Streamlined application process - candidates apply with their CareerVivid resumes',
                                'Advanced applicant tracking with AI-powered insights',
                                'Real-time analytics on application trends and candidate quality',
                                'Integrated messaging and scheduling tools',
                                'Co-branded hiring events and job fairs'
                            ].map((benefit, idx) => (
                                <div key={idx} className="flex items-start gap-4 bg-[#fffaf1] p-4 rounded-lg border border-[#e4d3bc]">
                                    <CheckCircle2 className="w-6 h-6 text-[#2f6f5e] flex-shrink-0 mt-0.5" />
                                    <span className="text-[#665a4a]">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center bg-[#211b16] rounded-lg p-12 text-[#fffaf1] border border-[#3a2f26] shadow-xl shadow-[#8b5a16]/15">
                        <Users className="w-16 h-16 mx-auto mb-6" />
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Transform Your Hiring?
                        </h2>
                        <p className="text-lg mb-8 text-[#d8c6ad]">
                            Join top companies using CareerVivid to build exceptional teams.
                        </p>
                        <button
                            onClick={() => navigate('/partners/apply?type=hiring')}
                            className="px-8 py-4 bg-[#fffaf1] text-[#211b16] rounded-lg font-bold hover:bg-[#f7f1e7] transition-all shadow-lg inline-flex items-center gap-2"
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
