import React from 'react';
import { Users, Gift, TrendingUp, Award } from 'lucide-react';
import { navigate } from '../../utils/navigation';
import PublicHeader from '../../components/PublicHeader';
import Footer from '../../components/Footer';

const editorialGridStyle: React.CSSProperties = {
    backgroundColor: '#f7f1e7',
    backgroundImage: 'linear-gradient(rgba(228, 211, 188, 0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(228, 211, 188, 0.32) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
};

const StudentAmbassadorPage: React.FC = () => {
    return (
        <div className="text-[#211b16] min-h-screen flex flex-col selection:bg-[#ead9c3]" style={editorialGridStyle}>
            <PublicHeader variant="editorial" />
            <main className="flex-grow pt-20">
                <section className="bg-[#fffaf1]/70 py-20 px-4 border-b border-[#e4d3bc]">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center p-3 bg-[#ead9c3] rounded-lg text-[#8b5a16] mb-6">
                            <Users size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#211b16]">Lead the Change on Campus</h1>
                        <p className="text-xl text-[#665a4a] mb-8 max-w-2xl mx-auto">
                            Become a CareerVivid Ambassador. Inspire your peers, earn rewards, and build your leadership portfolio.
                        </p>
                        <button
                            onClick={() => navigate('/partners/apply?type=student')}
                            className="px-8 py-3 bg-[#211b16] text-[#fffaf1] rounded-lg font-bold hover:bg-[#3a2f26] transition-colors"
                        >
                            Apply Now
                        </button>
                    </div>
                </section>

                <section className="py-20 max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-[#fffaf1] border border-[#e4d3bc] p-6 rounded-lg shadow-sm shadow-[#8b5a16]/5">
                            <Gift className="w-8 h-8 text-[#8b5a16] mb-4" />
                            <h3 className="font-bold mb-2 text-[#211b16]">Free Premium</h3>
                            <p className="text-sm text-[#665a4a]">Get lifetime Pro access for you and discounts for friends.</p>
                        </div>
                        <div className="bg-[#fffaf1] border border-[#e4d3bc] p-6 rounded-lg shadow-sm shadow-[#8b5a16]/5">
                            <TrendingUp className="w-8 h-8 text-[#2f6f5e] mb-4" />
                            <h3 className="font-bold mb-2 text-[#211b16]">Resume Boost</h3>
                            <p className="text-sm text-[#665a4a]">Add "Campus Ambassador" to your experience. We verify it.</p>
                        </div>
                        <div className="bg-[#fffaf1] border border-[#e4d3bc] p-6 rounded-lg shadow-sm shadow-[#8b5a16]/5">
                            <Award className="w-8 h-8 text-[#a05a2c] mb-4" />
                            <h3 className="font-bold mb-2 text-[#211b16]">Cash Rewards</h3>
                            <p className="text-sm text-[#665a4a]">Earn commission for every student that signs up via your link.</p>
                        </div>
                        <div className="bg-[#fffaf1] border border-[#e4d3bc] p-6 rounded-lg shadow-sm shadow-[#8b5a16]/5">
                            <Users className="w-8 h-8 text-[#8b5a16] mb-4" />
                            <h3 className="font-bold mb-2 text-[#211b16]">Exclusive Network</h3>
                            <p className="text-sm text-[#665a4a]">Direct access to the CareerVivid team and other student leaders.</p>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default StudentAmbassadorPage;
