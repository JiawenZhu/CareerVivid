import React from 'react';
import { Users, Gift, TrendingUp, Award } from 'lucide-react';
import { navigate } from '../../utils/navigation';
import PublicHeader from '../../components/PublicHeader';
import Footer from '../../components/Footer';

const StudentAmbassadorPage: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
            <PublicHeader />
            <main className="flex-grow pt-20">
                <section className="bg-pink-50 dark:bg-pink-900/20 py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center p-3 bg-pink-100 dark:bg-pink-800 rounded-xl text-pink-600 dark:text-pink-300 mb-6">
                            <Users size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">Lead the Change on Campus</h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                            Become a CareerVivid Ambassador. Inspire your peers, earn rewards, and build your leadership portfolio.
                        </p>
                        <button
                            onClick={() => navigate('/partners/apply?type=student')}
                            className="px-8 py-3 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition-colors"
                        >
                            Apply Now
                        </button>
                    </div>
                </section>

                <section className="py-20 max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm">
                            <Gift className="w-8 h-8 text-pink-500 mb-4" />
                            <h3 className="font-bold mb-2">Free Premium</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Get lifetime Pro access for you and discounts for friends.</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm">
                            <TrendingUp className="w-8 h-8 text-pink-500 mb-4" />
                            <h3 className="font-bold mb-2">Resume Boost</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Add "Campus Ambassador" to your experience. We verify it.</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm">
                            <Award className="w-8 h-8 text-pink-500 mb-4" />
                            <h3 className="font-bold mb-2">Cash Rewards</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Earn commission for every student that signs up via your link.</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm">
                            <Users className="w-8 h-8 text-pink-500 mb-4" />
                            <h3 className="font-bold mb-2">Exclusive Network</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Direct access to the CareerVivid team and other student leaders.</p>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default StudentAmbassadorPage;
