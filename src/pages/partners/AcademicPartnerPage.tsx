import React from 'react';
import { ArrowRight, GraduationCap, Users, BarChart3, Clock, CheckCircle2 } from 'lucide-react';
import { navigate } from '../../App';
import PublicHeader from '../../components/PublicHeader';
import Footer from '../../components/Footer';

const AcademicPartnerPage: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
            <PublicHeader />
            <main className="flex-grow pt-20">
                <section className="bg-blue-50 dark:bg-blue-900/20 py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-800 rounded-xl text-blue-600 dark:text-blue-300 mb-6">
                            <GraduationCap size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">Empower Your Students to Succeed</h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                            Equip your career center with the world's most advanced AI interview and resume tools.
                        </p>
                        <button
                            onClick={() => navigate('/partners/apply?type=academic')}
                            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                        >
                            Become an Academic Partner
                        </button>
                    </div>
                </section>

                <section className="py-20 max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
                                <Users size={24} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Mass Onboarding</h3>
                            <p className="text-gray-600 dark:text-gray-400">Instantly grant premium access to all your students via a unique portal link.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
                                <BarChart3 size={24} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Placement Analytics</h3>
                            <p className="text-gray-600 dark:text-gray-400">Track student engagement and interview readiness in real-time.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
                                <Clock size={24} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Save Counselor Time</h3>
                            <p className="text-gray-600 dark:text-gray-400">Let AI handle the repetitive resume reviews so counselors can focus on career strategy.</p>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default AcademicPartnerPage;
