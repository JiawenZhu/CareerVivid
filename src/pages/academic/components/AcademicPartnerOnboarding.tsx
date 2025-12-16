import React from 'react';
import { Share2, Users, Award, Monitor, Download, Zap } from 'lucide-react';

const AcademicPartnerOnboarding: React.FC = () => {
    const steps = [
        {
            icon: <Share2 className="w-6 h-6 text-white" />,
            title: "1. Share Your Link",
            description: "Copy your unique referral link below and share it with your students via email or LMS.",
            color: "bg-blue-500"
        },
        {
            icon: <Users className="w-6 h-6 text-white" />,
            title: "2. Students Join",
            description: "Students sign up using your link and automatically get a 1-Month Free Premium Trial.",
            color: "bg-purple-500"
        },
        {
            icon: <Award className="w-6 h-6 text-white" />,
            title: "3. Track Success",
            description: "Monitor their progress and grant extensions directly from this dashboard.",
            color: "bg-green-500"
        }
    ];

    const benefits = [
        {
            icon: <Monitor className="w-5 h-5 text-blue-600" />,
            title: "Real-time Tracking",
            description: "See exactly which students have activated their accounts."
        },
        {
            icon: <Zap className="w-5 h-5 text-purple-600" />,
            title: "Instant Premium",
            description: "No manual codes needed. The link handles everything."
        },
        {
            icon: <Download className="w-5 h-5 text-green-600" />,
            title: "Resume Export",
            description: "Students can export unlimited professional resumes."
        },
        {
            icon: <Award className="w-5 h-5 text-orange-600" />,
            title: "AI Interview Prep",
            description: "Access to our advanced mock interview agents."
        }
    ];

    return (
        <div className="space-y-8">
            {/* Steps Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {steps.map((step, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className={`absolute top-0 left-0 w-1 h-full ${step.color}`}></div>
                        <div className={`w-12 h-12 rounded-lg ${step.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                            {step.icon}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            {step.description}
                        </p>
                    </div>
                ))}
            </div>

            {/* Benefits Section */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-8 border border-blue-100 dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Why use the Partner Portal?</h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Empower your students with industry-leading tools.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-white/60 dark:bg-gray-900/40 rounded-lg backdrop-blur-sm border border-white/20 dark:border-gray-700">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm shrink-0">
                                {benefit.icon}
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{benefit.title}</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-snug">
                                    {benefit.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AcademicPartnerOnboarding;
