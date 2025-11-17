import React, { useState, useEffect } from 'react';
import { generateResumeFromPrompt, generateDemoInterviewQuestions } from '../services/geminiService';
import { Loader2, Mic, Wand2, ArrowLeft } from 'lucide-react';
import { navigate } from '../App';
import AIInterviewAgentModal from '../components/AIInterviewAgentModal';
import { createBlankResume } from '../constants';
import { CAREER_PATHS } from '../data/careers';
import { trackDemoEvent } from '../services/trackingService';
import DemoResumeInfoModal from '../components/DemoResumeInfoModal';

const ACADEMIA_RESEARCH_PATH = {
  name: 'Academia & Research',
  roles: [
    { name: 'Research Scientist (Ph.D.)' },
    { name: 'Quantitative Analyst (Ph.D.)' },
    { name: 'Machine Learning Scientist (Ph.D.)' },
    { name: 'Data Scientist (Ph.D.)' },
    { name: 'University Professor' },
    { name: 'Postdoctoral Fellow' },
  ],
};

const ALL_DEMO_PATHS = [...CAREER_PATHS, ACADEMIA_RESEARCH_PATH];

const CATEGORY_COLORS: { [key: string]: string } = {
  'Technology': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  'Healthcare (Medical)': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  'Finance & Business': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  'Creative & Marketing': 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
  'Education': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  'Trades & Services': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  'Academia & Research': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
};

const resumeLoadingMessages = [
    "Analyzing your selected role...",
    "Drafting a professional summary...",
    "Highlighting key skills and experiences...",
    "Structuring the resume layout...",
    "Finalizing your preview...",
];

const interviewLoadingMessages = [
    "Warming up the AI interviewer, Vivid...",
    "Reviewing the role requirements...",
    "Crafting tailored, insightful questions...",
    "Setting up the virtual interview room...",
    "Final checks... Get ready to shine!",
];


const DemoPage: React.FC = () => {
    const [isGeneratingResume, setIsGeneratingResume] = useState(false);
    const [isPreparingInterview, setIsPreparingInterview] = useState(false);
    const [error, setError] = useState('');
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [selectedRoleForResume, setSelectedRoleForResume] = useState('');

    const [interviewState, setInterviewState] = useState<{
        jobId: string;
        prompt: string;
        questions: string[];
        isFirstTime: boolean;
        resumeContext: string;
        jobTitle: string;
        jobCompany: string;
    } | null>(null);

    const isLoading = isGeneratingResume || isPreparingInterview;

    useEffect(() => {
        let interval: number;
        const messages = isGeneratingResume ? resumeLoadingMessages : interviewLoadingMessages;

        if (isLoading) {
            setLoadingMessageIndex(0); // Reset on start
            interval = window.setInterval(() => {
                setLoadingMessageIndex(prevIndex => {
                    if (prevIndex >= messages.length - 1) {
                        return prevIndex; // Stay on the last message
                    }
                    return prevIndex + 1;
                });
            }, 1800);
        }
        return () => clearInterval(interval);
    }, [isGeneratingResume, isPreparingInterview]);

    const handleGenerateResume = async (name: string, experience: string) => {
        if (!experience.trim() || !selectedRoleForResume.trim()) return;

        await trackDemoEvent('totalResumeGenerations');

        const prompt = `A professional resume for a ${selectedRoleForResume} named ${name}. Their experience and goals are: ${experience}`;

        setIsGeneratingResume(true);
        setError('');
        try {
            const guestUid = `guest_${Date.now()}`;
            const aiData = await generateResumeFromPrompt(guestUid, prompt);

            if (!aiData || typeof aiData !== 'object' || !aiData.personalDetails) {
                throw new Error("AI failed to generate a valid resume. Please try a different prompt.");
            }
            
            const blankResume = createBlankResume();
            
            // Override AI-generated name with user-provided name for consistency
            const nameParts = name.split(' ');
            aiData.personalDetails.firstName = nameParts.shift() || '';
            aiData.personalDetails.lastName = nameParts.join(' ') || '';
            
            const guestResume = {
                ...blankResume,
                ...aiData,
                id: 'guest',
                title: `${aiData.personalDetails.jobTitle || 'New'} Resume`,
            };

            localStorage.setItem('guestResume', JSON.stringify(guestResume));
            navigate('/edit/guest');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsGeneratingResume(false);
            setIsResumeModalOpen(false);
        }
    };

    const handleGenerateResumeClick = (roleName: string) => {
        setSelectedRoleForResume(roleName);
        setIsResumeModalOpen(true);
    };
    
    const handleGenerateInterview = async (prompt: string, title: string) => {
        if (!prompt.trim()) return;

        await trackDemoEvent('totalInterviewStarts');

        setIsPreparingInterview(true);
        setError('');
        try {
            const questions = await generateDemoInterviewQuestions(prompt);
            setInterviewState({
                jobId: 'guest_interview',
                prompt: prompt,
                questions,
                isFirstTime: true,
                resumeContext: 'This is a demo session. No resume context is available.',
                jobTitle: title,
                jobCompany: 'CareerVivid',
            });
        } catch(e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsPreparingInterview(false);
        }
    };

    if (isLoading && !interviewState) {
        const messages = isGeneratingResume ? resumeLoadingMessages : interviewLoadingMessages;
        const loadingText = isGeneratingResume ? 'Generating your resume preview...' : 'Preparing your interview...';
        return (
            <div className="fixed inset-0 bg-gray-50 dark:bg-gray-950 z-50 flex flex-col items-center justify-center text-center p-4">
                 <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto" />
                 <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-6">{loadingText}</h1>
                 <div className="h-6 mt-2">
                    <p key={loadingMessageIndex} className="text-gray-500 dark:text-gray-400 animate-fade-in">
                        {messages[loadingMessageIndex]}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center p-4 sm:p-6 lg:p-8">
             <div className="w-full max-w-7xl mx-auto relative mb-10">
                <a 
                    href="#/" 
                    className="absolute top-2 left-0 flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold transition-colors"
                    aria-label="Back Home"
                >
                    <ArrowLeft size={20} />
                    <span>Back Home</span>
                </a>
                <div className="text-center pt-8">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-100">Try CareerVivid</h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
                        Experience our AI-powered tools without an account. Select a role below to start.
                    </p>
                    <a href="#/auth" className="mt-4 inline-block text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                        Or sign up to save your work
                    </a>
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto space-y-12">
                {ALL_DEMO_PATHS.map((industry) => (
                    <div key={industry.name}>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">{industry.name}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {industry.roles.map((role) => {
                                const interviewPrompt = `A mock interview for a ${role.name} position.`;
                                return (
                                    <div key={role.name} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-soft hover:shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col transform hover:-translate-y-1 transition-transform duration-300">
                                        <div>
                                            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mb-3 ${CATEGORY_COLORS[industry.name] || 'bg-gray-100 text-gray-800'}`}>
                                                {industry.name}
                                            </span>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{role.name}</h3>
                                        </div>
                                        <div className="mt-auto pt-4 flex flex-col space-y-3 sm:gap-3">
                                            <button
                                                onClick={() => handleGenerateResumeClick(role.name)}
                                                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2.5 px-3 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Wand2 size={16} /> Generate Resume
                                            </button>
                                            <button
                                                onClick={() => handleGenerateInterview(interviewPrompt, role.name)}
                                                className="w-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 font-semibold py-2.5 px-3 text-sm rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/80 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Mic size={16} /> Start Interview
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

             {error && <p className="text-red-500 text-center mt-6 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg max-w-4xl mx-auto">{error}</p>}
        </div>
        <DemoResumeInfoModal
            isOpen={isResumeModalOpen}
            onClose={() => setIsResumeModalOpen(false)}
            onGenerate={handleGenerateResume}
            roleName={selectedRoleForResume}
            isLoading={isGeneratingResume}
        />
        {interviewState && (
            <AIInterviewAgentModal
                jobId={interviewState.jobId}
                interviewPrompt={interviewState.prompt}
                questions={interviewState.questions}
                isFirstTime={interviewState.isFirstTime}
                resumeContext={interviewState.resumeContext}
                jobTitle={interviewState.jobTitle}
                jobCompany={interviewState.jobCompany}
                onClose={() => setInterviewState(null)}
                isGuestMode={true}
            />
        )}
        </>
    );
};

export default DemoPage;