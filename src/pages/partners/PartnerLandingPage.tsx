

import React from 'react';
import { Rocket, Users, Building2, GraduationCap, ArrowRight, CheckCircle2, Globe, Shield, Award } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Footer from '../../components/Footer';
import InteractiveParticleTitle from '../../components/InteractiveParticleTitle';
import ParticleBackground from '../../components/ParticleBackground';
import { navigate } from '../../App';

const PartnerLandingPage: React.FC = () => {
    // Mouse tracking state removed as it is handled inside ParticleBackground now

    return (
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col font-sans selection:bg-purple-100 dark:selection:bg-purple-900">
            <PublicHeader />
            <main className="flex-grow pt-20">
                {/* Hero Section */}
                <section className="relative py-24 sm:py-32 overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
                    <div className="absolute inset-0">
                        {/* Static Base Gradient for subtle color */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-50/30 to-blue-50/30 dark:from-purple-900/10 dark:to-blue-900/10"></div>
                        <ParticleBackground />
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-purple-200 dark:border-purple-800 text-sm font-medium text-purple-700 dark:text-purple-300 mb-8 shadow-sm">
                            <Rocket size={16} />
                            <span>Fueling the Future of Work</span>
                        </div>

                        {/* Interactive Particle Title */}
                        <div className="mb-6 -mt-4">
                            <InteractiveParticleTitle />
                        </div>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Join us in our mission to empower the next generation of professionals. Whether you're an educator, a business leader, or a student, we have a program for you.
                        </p>
                        <button
                            onClick={() => navigate('/partners/apply')}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold text-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
                        >
                            Become a Partner <ArrowRight size={20} />
                        </button>
                    </div>
                </section>

                {/* Tracks Section */}
                <section className="py-24 bg-white dark:bg-gray-950">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Path</h2>
                            <p className="text-gray-600 dark:text-gray-400">Discover which partnership program aligns with your goals.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Academic Track */}
                            <div className="group relative bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-xl transition-all duration-300">
                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 rounded-t-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <GraduationCap size={28} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Academic</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 min-h-[80px]">
                                    For universities, colleges, and bootcamps. Empower your students with AI-driven career tools and track their placement success.
                                </p>
                                <button
                                    onClick={() => navigate('/partners/academic')}
                                    className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all"
                                >
                                    Learn More <ArrowRight size={16} />
                                </button>
                            </div>

                            {/* Business Track */}
                            <div className="group relative bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-xl transition-all duration-300">
                                <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 rounded-t-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Building2 size={28} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Business</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 min-h-[80px]">
                                    For companies and HR teams. Access a curated pipeline of top talent and streamline your recruitment process using AI.
                                </p>
                                <button
                                    onClick={() => navigate('/partners/business')}
                                    className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all"
                                >
                                    Learn More <ArrowRight size={16} />
                                </button>
                            </div>

                            {/* Ambassador Track */}
                            <div className="group relative bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 hover:border-pink-200 dark:hover:border-pink-800 hover:shadow-xl transition-all duration-300">
                                <div className="absolute top-0 left-0 w-full h-1 bg-pink-500 rounded-t-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                                <div className="w-14 h-14 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Users size={28} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Ambassadors</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 min-h-[80px]">
                                    For student leaders and influencers. Represent CareerVivid on your campus, earn rewards, and boost your own resume.
                                </p>
                                <button
                                    onClick={() => navigate('/partners/students')}
                                    className="text-pink-600 dark:text-pink-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all"
                                >
                                    Learn More <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Global Impact Section */}
                <section className="py-24 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Global Impact. <br /> Local Reach.</h2>
                                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                                    Our partners are at the forefront of the AI revolution in career development. By joining our ecosystem, you're not just getting tools; you're shaping the workforce of tomorrow.
                                </p>
                                <div className="space-y-4">
                                    {[
                                        { icon: <Globe size={20} />, text: "Active in over 20 countries" },
                                        { icon: <Award size={20} />, text: "Award-winning AI technology" },
                                        { icon: <Users size={20} />, text: "Growing community of 50k+ professionals" }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center shrink-0">
                                                {item.icon}
                                            </div>
                                            <span className="font-medium">{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-green-200 to-blue-200 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl transform rotate-3 scale-105 opacity-50"></div>
                                <img
                                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                                    alt="Global Community"
                                    className="relative rounded-2xl shadow-2xl"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-gray-900 dark:bg-black text-center px-4">
                    <h2 className="text-3xl font-bold text-white mb-6">Ready to make a difference?</h2>
                    <button
                        onClick={() => navigate('/partners/apply')}
                        className="px-10 py-4 bg-white text-gray-900 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors"
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
