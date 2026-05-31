import React from 'react';
import { GraduationCap, Users, BarChart3, Clock } from 'lucide-react';
import { navigate } from '../../utils/navigation';
import PublicHeader from '../../components/PublicHeader';
import Footer from '../../components/Footer';

const editorialGridStyle: React.CSSProperties = {
    backgroundColor: '#f7f1e7',
    backgroundImage: 'linear-gradient(rgba(228, 211, 188, 0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(228, 211, 188, 0.32) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
};

const AcademicPartnerPage: React.FC = () => {
    return (
        <div className="text-[#211b16] min-h-screen flex flex-col selection:bg-[#ead9c3]" style={editorialGridStyle}>
            <PublicHeader variant="editorial" />
            <main className="flex-grow pt-20">
                <section className="bg-[#fffaf1]/70 py-20 px-4 border-b border-[#e4d3bc]">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center p-3 bg-[#e8f0e6] rounded-lg text-[#2f6f5e] mb-6">
                            <GraduationCap size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#211b16]">Empower Your Students to Succeed</h1>
                        <p className="text-xl text-[#665a4a] mb-8 max-w-2xl mx-auto">
                            Equip your career center with the world's most advanced AI interview and resume tools.
                        </p>
                        <button
                            onClick={() => navigate('/partners/apply?type=academic')}
                            className="px-8 py-3 bg-[#211b16] text-[#fffaf1] rounded-lg font-bold hover:bg-[#3a2f26] transition-colors"
                        >
                            Become an Academic Partner
                        </button>
                    </div>
                </section>

                <section className="py-20 max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center bg-[#fffaf1] border border-[#e4d3bc] rounded-lg p-6 shadow-sm shadow-[#8b5a16]/5">
                            <div className="w-12 h-12 bg-[#ead9c3] rounded-lg flex items-center justify-center mx-auto mb-4 text-[#8b5a16]">
                                <Users size={24} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-[#211b16]">Mass Onboarding</h3>
                            <p className="text-[#665a4a]">Instantly grant premium access to all your students via a unique portal link.</p>
                        </div>
                        <div className="text-center bg-[#fffaf1] border border-[#e4d3bc] rounded-lg p-6 shadow-sm shadow-[#8b5a16]/5">
                            <div className="w-12 h-12 bg-[#e8f0e6] rounded-lg flex items-center justify-center mx-auto mb-4 text-[#2f6f5e]">
                                <BarChart3 size={24} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-[#211b16]">Placement Analytics</h3>
                            <p className="text-[#665a4a]">Track student engagement and interview readiness in real-time.</p>
                        </div>
                        <div className="text-center bg-[#fffaf1] border border-[#e4d3bc] rounded-lg p-6 shadow-sm shadow-[#8b5a16]/5">
                            <div className="w-12 h-12 bg-[#ead9c3] rounded-lg flex items-center justify-center mx-auto mb-4 text-[#8b5a16]">
                                <Clock size={24} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-[#211b16]">Save Counselor Time</h3>
                            <p className="text-[#665a4a]">Let AI handle the repetitive resume reviews so counselors can focus on career strategy.</p>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default AcademicPartnerPage;
