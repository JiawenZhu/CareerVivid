import React from 'react';
import { Building2, Search, Zap, Target } from 'lucide-react';
import { navigate } from '../../utils/navigation';
import PublicHeader from '../../components/PublicHeader';
import Footer from '../../components/Footer';

const editorialGridStyle: React.CSSProperties = {
    backgroundColor: '#f7f1e7',
    backgroundImage: 'linear-gradient(rgba(228, 211, 188, 0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(228, 211, 188, 0.32) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
};

const BusinessPartnerPage: React.FC = () => {
    return (
        <div className="text-[#211b16] min-h-screen flex flex-col selection:bg-[#ead9c3]" style={editorialGridStyle}>
            <PublicHeader variant="editorial" />
            <main className="flex-grow pt-20">
                <section className="bg-[#fffaf1]/70 py-20 px-4 border-b border-[#e4d3bc]">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center p-3 bg-[#ead9c3] rounded-lg text-[#8b5a16] mb-6">
                            <Building2 size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#211b16]">Hire Smarter, Faster</h1>
                        <p className="text-xl text-[#665a4a] mb-8 max-w-2xl mx-auto">
                            Access a pipeline of pre-vetted, interview-ready candidates optimized by our AI.
                        </p>
                        <button
                            onClick={() => navigate('/partners/apply?type=business')}
                            className="px-8 py-3 bg-[#211b16] text-[#fffaf1] rounded-lg font-bold hover:bg-[#3a2f26] transition-colors"
                        >
                            Become a Hiring Partner
                        </button>
                    </div>
                </section>

                <section className="py-20 max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="p-6 border border-[#e4d3bc] rounded-lg bg-[#fffaf1] shadow-sm shadow-[#8b5a16]/5">
                            <Search className="w-8 h-8 text-[#8b5a16] mb-4" />
                            <h3 className="text-xl font-semibold mb-2 text-[#211b16]">Talent Discovery</h3>
                            <p className="text-[#665a4a]">Search our database of portfolios and AI-optimized resumes.</p>
                        </div>
                        <div className="p-6 border border-[#e4d3bc] rounded-lg bg-[#fffaf1] shadow-sm shadow-[#8b5a16]/5">
                            <Zap className="w-8 h-8 text-[#2f6f5e] mb-4" />
                            <h3 className="text-xl font-semibold mb-2 text-[#211b16]">Co-Branded Sprints</h3>
                            <p className="text-[#665a4a]">Host virtual hiring events directly on the CareerVivid platform.</p>
                        </div>
                        <div className="p-6 border border-[#e4d3bc] rounded-lg bg-[#fffaf1] shadow-sm shadow-[#8b5a16]/5">
                            <Target className="w-8 h-8 text-[#a05a2c] mb-4" />
                            <h3 className="text-xl font-semibold mb-2 text-[#211b16]">Precision Matching</h3>
                            <p className="text-[#665a4a]">Our AI matches candidates to your job descriptions with 95% accuracy.</p>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default BusinessPartnerPage;
