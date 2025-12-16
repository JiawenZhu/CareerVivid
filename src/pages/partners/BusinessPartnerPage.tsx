import React from 'react';
import { Building2, Search, Zap, Target } from 'lucide-react';
import { navigate } from '../../App';
import PublicHeader from '../../components/PublicHeader';
import Footer from '../../components/Footer';

const BusinessPartnerPage: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
            <PublicHeader />
            <main className="flex-grow pt-20">
                <section className="bg-purple-50 dark:bg-purple-900/20 py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center p-3 bg-purple-100 dark:bg-purple-800 rounded-xl text-purple-600 dark:text-purple-300 mb-6">
                            <Building2 size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">Hire Smarter, Faster</h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                            Access a pipeline of pre-vetted, interview-ready candidates optimized by our AI.
                        </p>
                        <button
                            onClick={() => navigate('/partners/apply?type=business')}
                            className="px-8 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors"
                        >
                            Become a Hiring Partner
                        </button>
                    </div>
                </section>

                <section className="py-20 max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="p-6 border border-gray-100 dark:border-gray-800 rounded-xl">
                            <Search className="w-8 h-8 text-purple-600 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Talent Discovery</h3>
                            <p className="text-gray-600 dark:text-gray-400">Search our database of portfolios and AI-optimized resumes.</p>
                        </div>
                        <div className="p-6 border border-gray-100 dark:border-gray-800 rounded-xl">
                            <Zap className="w-8 h-8 text-purple-600 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Co-Branded Sprints</h3>
                            <p className="text-gray-600 dark:text-gray-400">Host virtual hiring events directly on the CareerVivid platform.</p>
                        </div>
                        <div className="p-6 border border-gray-100 dark:border-gray-800 rounded-xl">
                            <Target className="w-8 h-8 text-purple-600 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Precision Matching</h3>
                            <p className="text-gray-600 dark:text-gray-400">Our AI matches candidates to your job descriptions with 95% accuracy.</p>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default BusinessPartnerPage;
