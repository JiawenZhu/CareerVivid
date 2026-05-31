

import React from 'react';
import { Rocket, Users, Building2, Briefcase, GraduationCap, ArrowRight, Globe, Award } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Footer from '../../components/Footer';
import InteractiveParticleTitle from '../../components/InteractiveParticleTitle';
import ParticleBackground from '../../components/ParticleBackground';
import { navigate } from '../../utils/navigation';

const editorialGridStyle: React.CSSProperties = {
    backgroundColor: '#f7f1e7',
    backgroundImage: 'linear-gradient(rgba(228, 211, 188, 0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(228, 211, 188, 0.32) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
};

const PartnerLandingPage: React.FC = () => {
    // Mouse tracking state removed as it is handled inside ParticleBackground now

    return (
        <div className="text-[#211b16] min-h-screen flex flex-col font-sans selection:bg-[#ead9c3]" style={editorialGridStyle}>
            <PublicHeader variant="editorial" />
            <main className="flex-grow pt-20">
                {/* Hero Section */}
                <section className="relative py-24 sm:py-32 overflow-hidden transition-colors duration-500">
                    <div className="absolute inset-0 opacity-20 sepia">
                        <ParticleBackground />
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fffaf1]/90 backdrop-blur-sm border border-[#e4d3bc] text-sm font-bold text-[#8b5a16] mb-8 shadow-sm shadow-[#8b5a16]/5">
                            <Rocket size={16} />
                            <span>Fueling the Future of Work</span>
                        </div>

                        {/* Interactive Particle Title */}
                        <div className="mb-6 -mt-4">
                            <InteractiveParticleTitle />
                        </div>
                        <p className="text-xl text-[#665a4a] max-w-2xl mx-auto mb-10 leading-relaxed">
                            Join us in our mission to help candidates become ready faster. Whether you're an educator, employer, staffing agency, or student leader, we have a focused partner path.
                        </p>
                        <button
                            onClick={() => navigate('/partners/apply')}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-[#211b16] text-[#fffaf1] rounded-lg font-bold text-lg hover:bg-[#3a2f26] transition-all transform hover:-translate-y-0.5 shadow-lg shadow-[#8b5a16]/15"
                        >
                            Become a Partner <ArrowRight size={20} />
                        </button>
                    </div>
                </section>

                {/* Tracks Section */}
                <section className="py-24 bg-[#fffaf1]/70 border-y border-[#e4d3bc]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-[#211b16] mb-4">Choose Your Path</h2>
                            <p className="text-[#665a4a]">Discover which partnership program aligns with your goals.</p>
                        </div>

                        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
                            {/* Academic Track */}
                            <div className="group relative bg-[#fffaf1] rounded-lg p-8 border border-[#e4d3bc] hover:border-[#bfa782] hover:shadow-xl hover:shadow-[#8b5a16]/10 transition-all duration-300">
                                <div className="absolute top-0 left-0 w-full h-1 bg-[#8b5a16] rounded-t-lg transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                                <div className="w-14 h-14 bg-[#e8f0e6] text-[#2f6f5e] rounded-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                                    <GraduationCap size={28} />
                                </div>
                                <h3 className="text-2xl font-bold text-[#211b16] mb-3">Academic</h3>
                                <p className="text-[#665a4a] mb-6 min-h-[80px]">
                                    For universities, colleges, and bootcamps. Empower your students with AI-driven career tools and track their placement success.
                                </p>
                                <button
                                    onClick={() => navigate('/partners/academic')}
                                    className="text-[#8b5a16] font-semibold flex items-center gap-2 group-hover:gap-3 transition-all"
                                >
                                    Learn More <ArrowRight size={16} />
                                </button>
                            </div>

                            {/* Business Track */}
                            <div className="group relative bg-[#fffaf1] rounded-lg p-8 border border-[#e4d3bc] hover:border-[#bfa782] hover:shadow-xl hover:shadow-[#8b5a16]/10 transition-all duration-300">
                                <div className="absolute top-0 left-0 w-full h-1 bg-[#a05a2c] rounded-t-lg transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                                <div className="w-14 h-14 bg-[#ead9c3] text-[#8b5a16] rounded-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                                    <Building2 size={28} />
                                </div>
                                <h3 className="text-2xl font-bold text-[#211b16] mb-3">Business</h3>
                                <p className="text-[#665a4a] mb-6 min-h-[80px]">
                                    For companies and HR teams. Access a curated pipeline of top talent and streamline your recruitment process using AI.
                                </p>
                                <button
                                    onClick={() => navigate('/partners/business')}
                                    className="text-[#8b5a16] font-semibold flex items-center gap-2 group-hover:gap-3 transition-all"
                                >
                                    Learn More <ArrowRight size={16} />
                                </button>
                            </div>

                            {/* Agency Track */}
                            <div className="group relative bg-[#fffaf1] rounded-lg p-8 border border-[#e4d3bc] hover:border-[#bfa782] hover:shadow-xl hover:shadow-[#8b5a16]/10 transition-all duration-300">
                                <div className="absolute top-0 left-0 w-full h-1 bg-[#2f6f5e] rounded-t-lg transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                                <div className="w-14 h-14 bg-[#e8f0e6] text-[#2f6f5e] rounded-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                                    <Briefcase size={28} />
                                </div>
                                <h3 className="text-2xl font-bold text-[#211b16] mb-3">Agency</h3>
                                <p className="text-[#665a4a] mb-6 min-h-[80px]">
                                    For staffing branches. Give walk-in applicants a prep portal before recruiters spend time fixing resumes.
                                </p>
                                <button
                                    onClick={() => navigate('/partners/agency')}
                                    className="text-[#8b5a16] font-semibold flex items-center gap-2 group-hover:gap-3 transition-all"
                                >
                                    Learn More <ArrowRight size={16} />
                                </button>
                            </div>

                            {/* Ambassador Track */}
                            <div className="group relative bg-[#fffaf1] rounded-lg p-8 border border-[#e4d3bc] hover:border-[#bfa782] hover:shadow-xl hover:shadow-[#8b5a16]/10 transition-all duration-300">
                                <div className="absolute top-0 left-0 w-full h-1 bg-[#2f6f5e] rounded-t-lg transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                                <div className="w-14 h-14 bg-[#e8f0e6] text-[#2f6f5e] rounded-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                                    <Users size={28} />
                                </div>
                                <h3 className="text-2xl font-bold text-[#211b16] mb-3">Ambassadors</h3>
                                <p className="text-[#665a4a] mb-6 min-h-[80px]">
                                    For student leaders and influencers. Represent CareerVivid on your campus, earn rewards, and boost your own resume.
                                </p>
                                <button
                                    onClick={() => navigate('/partners/students')}
                                    className="text-[#8b5a16] font-semibold flex items-center gap-2 group-hover:gap-3 transition-all"
                                >
                                    Learn More <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Global Impact Section */}
                <section className="py-24 bg-[#f7f1e7]/80 border-t border-[#e4d3bc]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-4xl font-bold text-[#211b16] mb-6">Global Impact. <br /> Local Reach.</h2>
                                <p className="text-lg text-[#665a4a] mb-8 leading-relaxed">
                                    Our partners are at the forefront of the AI revolution in career development. By joining our ecosystem, you're not just getting tools; you're shaping the workforce of tomorrow.
                                </p>
                                <div className="space-y-4">
                                    {[
                                        { icon: <Globe size={20} />, text: "Active in over 20 countries" },
                                        { icon: <Award size={20} />, text: "Award-winning AI technology" },
                                        { icon: <Users size={20} />, text: "Growing community of 50k+ professionals" }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 text-[#665a4a]">
                                            <div className="w-8 h-8 rounded-full bg-[#ead9c3] text-[#8b5a16] flex items-center justify-center shrink-0">
                                                {item.icon}
                                            </div>
                                            <span className="font-medium">{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#ead9c3] rounded-lg transform rotate-3 scale-105 opacity-70"></div>
                                <img
                                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                                    alt="Global Community"
                                    className="relative rounded-lg shadow-2xl shadow-[#8b5a16]/15"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-[#211b16] text-center px-4">
                    <h2 className="text-3xl font-bold text-[#fffaf1] mb-6">Ready to make a difference?</h2>
                    <button
                        onClick={() => navigate('/partners/apply')}
                        className="px-10 py-4 bg-[#fffaf1] text-[#211b16] rounded-lg font-bold text-lg hover:bg-[#f7f1e7] transition-colors"
                    >
                        Apply to Partner Program
                    </button>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default PartnerLandingPage;
