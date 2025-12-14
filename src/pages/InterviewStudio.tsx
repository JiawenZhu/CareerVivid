import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CAREER_PATHS, Industry } from '../data/careers';
import { ArrowRight, Mic, Loader2, ChevronLeft, LayoutDashboard } from 'lucide-react';
import { generateInterviewQuestions } from '../services/geminiService';
import AIInterviewAgentModal from '../components/AIInterviewAgentModal';
import { usePracticeHistory } from '../hooks/useJobHistory';
import { Job, PracticeHistoryEntry, ResumeData } from '../types';
import { navigate } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { useResumes } from '../hooks/useResumes';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAICreditCheck } from '../hooks/useAICreditCheck';

const formatResumeForContext = (resume: ResumeData): string => {
    let context = `Name: ${resume.personalDetails.firstName} ${resume.personalDetails.lastName}\n`;
    context += `Job Title: ${resume.personalDetails.jobTitle}\n\n`;
    context += `SUMMARY:\n${resume.professionalSummary}\n\n`;

    if (resume.employmentHistory.length > 0) {
        context += `EXPERIENCE:\n`;
        resume.employmentHistory.forEach(job => {
            context += `- ${job.jobTitle} at ${job.employer} (${job.startDate} - ${job.endDate})\n`;
            const descriptionText = job.description.replace(/^- /gm, '  - ');
            context += `  ${descriptionText.replace(/\n/g, '\n  ')}\n`;
        });
        context += '\n';
    }

    if (resume.skills.length > 0) {
        context += `SKILLS: ${resume.skills.map(s => s.name).join(', ')}\n\n`;
    }

    if (resume.education.length > 0) {
        context += `EDUCATION:\n`;
        resume.education.forEach(edu => {
            context += `- ${edu.degree} from ${edu.school} (${edu.startDate} - ${edu.endDate})\n`;
        });
    }
    return context;
};

const loadingMessages = [
    "Warming up the AI interviewer...",
    "Reviewing the job description for insights...",
    "Crafting tailored, insightful questions...",
    "Setting up the virtual interview room...",
    "Final checks... Get ready to shine!",
    "Just a moment...",
];

const placeholderPrompts = [
    'A behavioral interview for a product manager role',
    'A technical interview for a front-end developer position',
    'First-round screening call for a marketing associate',
    'Final-round interview for a senior data scientist',
    'Case study interview for a management consultant',
    'A mock interview focused on leadership skills',
    'Systems design interview for a backend engineer role',
];

interface InterviewStudioProps {
    jobId?: string;
}

const InterviewStudio: React.FC<InterviewStudioProps> = ({ jobId }) => {
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
    const [placeholder, setPlaceholder] = useState('');

    const { practiceHistory, addJob } = usePracticeHistory();
    const { resumes } = useResumes();

    // AI Credit Check Hook
    const { checkCredit, CreditLimitModal } = useAICreditCheck();

    const [interviewState, setInterviewState] = useState<{
        jobId: string;
        prompt: string;
        questions: string[];
        isFirstTime: boolean;
        resumeContext: string;
        jobTitle: string;
        jobCompany: string;
    } | null>(null);
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    useEffect(() => {
        let interval: number;
        if (isLoading && !isInterviewModalOpen) {
            setLoadingMessageIndex(0); // Reset on start
            interval = window.setInterval(() => {
                setLoadingMessageIndex(prevIndex => {
                    if (prevIndex >= loadingMessages.length - 1) {
                        return prevIndex; // Stay on the last message
                    }
                    return prevIndex + 1;
                });
            }, 2000); // 2 seconds per message
        }
        return () => clearInterval(interval);
    }, [isLoading, isInterviewModalOpen]);

    // Typing effect for the placeholder
    useEffect(() => {
        let isMounted = true;
        let promptIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let timeoutId: number;

        const typingSpeed = 100;
        const deletingSpeed = 50;
        const pauseDurations = [2000, 4000, 8000];
        let pauseIndex = 0;

        const type = () => {
            if (!isMounted) return;

            const currentPrompt = placeholderPrompts[promptIndex];

            if (isDeleting) {
                setPlaceholder(currentPrompt.substring(0, charIndex - 1));
                charIndex--;
            } else {
                setPlaceholder(currentPrompt.substring(0, charIndex + 1));
                charIndex++;
            }

            if (!isDeleting && charIndex === currentPrompt.length) {
                isDeleting = true;
                const pause = pauseDurations[pauseIndex % pauseDurations.length];
                pauseIndex = (pauseIndex + 1) % pauseDurations.length;
                timeoutId = window.setTimeout(type, pause);
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                promptIndex = (promptIndex + 1) % placeholderPrompts.length;
                timeoutId = window.setTimeout(type, 500);
            } else {
                timeoutId = window.setTimeout(type, isDeleting ? deletingSpeed : typingSpeed);
            }
        };

        timeoutId = window.setTimeout(type, 1500);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);


    const handleStartInterview = async (generationPrompt: string, jobData?: Omit<Job, 'id'>) => {
        if (!generationPrompt.trim() || !currentUser) return;

        // CHECK CREDIT BEFORE STARTING
        if (!checkCredit()) return;

        setIsLoading(true);
        setError('');
        try {
            // Generate interview questions
            const questions = await generateInterviewQuestions(currentUser.uid, generationPrompt);
            const job: Omit<Job, 'id'> = jobData || {
                title: generationPrompt,
                company: 'Custom Practice',
                location: '',
                description: generationPrompt,
                url: ''
            };

            // Add job to practice history
            const newJobId = await addJob(job, questions);

            // Get authentication token for microservice (us-west1 region)
            const functions = getFunctions(undefined, 'us-west1');
            const getToken = httpsCallable(functions, 'getInterviewAuthToken');
            const result = await getToken();
            const { token } = result.data as { token: string };

            // Construct redirect URL to Interview Microservice
            const baseUrl = 'https://careervivid-371634100960.us-west1.run.app';
            const targetUrl = `${baseUrl}/#/interview-studio/${newJobId}?token=${token}`;

            // Redirect to external microservice
            window.location.href = targetUrl;
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setIsLoading(false);
        }
    };

    // Handle "Practice Again" from Dashboard
    useEffect(() => {
        const practiceJobData = sessionStorage.getItem('practiceJob');
        if (practiceJobData) {
            sessionStorage.removeItem('practiceJob');
            try {
                const jobEntry: PracticeHistoryEntry = JSON.parse(practiceJobData);
                const jobData = {
                    title: jobEntry.job.title,
                    company: jobEntry.job.company || 'Custom Practice',
                    location: jobEntry.job.location,
                    description: jobEntry.job.description || jobEntry.job.title,
                    url: jobEntry.job.url,
                };
                handleStartInterview(jobData.description, jobData);
            } catch (e) {
                console.error("Failed to parse practice job data", e);
            }
        }
    }, []);

    // Handle Deep Linking from Email
    useEffect(() => {
        if (jobId && !isLoading && practiceHistory.length > 0) {
            const foundJob = practiceHistory.find(h => h.id === jobId);
            if (foundJob) {
                // Auto-start the interview
                const startSavedInterview = async () => {
                    setIsLoading(true);
                    try {
                        const functions = getFunctions(undefined, 'us-west1');
                        const getToken = httpsCallable(functions, 'getInterviewAuthToken');
                        const result = await getToken();
                        const { token } = result.data as { token: string };

                        const baseUrl = 'https://careervivid-371634100960.us-west1.run.app';
                        const targetUrl = `${baseUrl}/#/interview-studio/${jobId}?token=${token}`;
                        window.location.href = targetUrl;
                    } catch (e) {
                        setError("Failed to start scheduled interview. Please try again.");
                        setIsLoading(false);
                    }
                };
                startSavedInterview();
            }
        }
    }, [jobId, practiceHistory, isLoading]);

    const handlePromptSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleStartInterview(prompt);
    };

    const handleRoleSelect = (roleName: string) => {
        const industryName = selectedIndustry?.name || 'General';
        const fullPrompt = `A mock interview for the role of '${roleName}' in the '${industryName}' industry.`;
        const jobData = {
            title: roleName,
            company: 'CareerVivid',
            location: '',
            description: fullPrompt,
            url: ''
        };
        handleStartInterview(fullPrompt, jobData);
    };

    const renderContent = () => {
        if (selectedIndustry) {
            return (
                <div>
                    <button onClick={() => setSelectedIndustry(null)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4 font-semibold">
                        <ChevronLeft size={18} /> {t('interview_studio.back_to_industries')}
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('interview_studio.select_role', { industry: selectedIndustry.name })}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {selectedIndustry.roles.map(role => (
                            <button
                                key={role.name}
                                onClick={() => handleRoleSelect(role.name)}
                                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-soft hover:shadow-md hover:border-primary-500 dark:hover:border-primary-400 border border-transparent transition-all text-left flex items-center justify-between group"
                            >
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{role.name}</h3>
                                <ArrowRight size={20} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('interview_studio.select_career')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {CAREER_PATHS.map(industry => (
                        <button
                            key={industry.name}
                            onClick={() => setSelectedIndustry(industry)}
                            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-soft hover:shadow-md hover:border-primary-500 dark:hover:border-primary-400 border border-transparent transition-all text-left flex items-center justify-between group"
                        >
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{industry.name}</h3>
                            <ArrowRight size={20} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <>
            <CreditLimitModal />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative">
                <div className="absolute top-6 right-6">
                    <a
                        href="/"
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg shadow-soft border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <LayoutDashboard size={20} />
                        {t('nav.dashboard')}
                    </a>
                </div>
                {isLoading && !isInterviewModalOpen ? (
                    <div className="text-center">
                        <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto" />
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-6">{t('interview_studio.preparing')}</h1>
                        <div className="h-6 mt-2">
                            <p key={loadingMessageIndex} className="text-gray-500 dark:text-gray-400 animate-fade-in">
                                {t(`interview_studio.loading_${loadingMessageIndex + 1}`)}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl mx-auto">
                        <div className="text-center mb-10">
                            <Mic className="w-12 h-12 mx-auto text-indigo-500" />
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mt-4">{t('interview_studio.title')}</h1>
                            <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">{t('interview_studio.subtitle')}</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-10">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('interview_studio.start_title')}</h2>
                            <form onSubmit={handlePromptSubmit} className="flex flex-col sm:flex-row gap-4">
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={placeholder}
                                    className="flex-grow w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow"
                                />
                                <button
                                    type="submit"
                                    className="flex-shrink-0 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow-soft hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:bg-indigo-300"
                                    disabled={!prompt.trim() || isLoading}
                                >
                                    {t('interview_studio.start_btn')} <ArrowRight size={20} />
                                </button>
                            </form>
                        </div>

                        {renderContent()}

                        {error && <p className="text-red-500 text-center mt-6 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg">{error}</p>}
                    </div>
                )}
            </div>
            {isInterviewModalOpen && interviewState && (
                <AIInterviewAgentModal
                    jobId={interviewState.jobId}
                    interviewPrompt={interviewState.prompt}
                    questions={interviewState.questions}
                    isFirstTime={interviewState.isFirstTime}
                    resumeContext={interviewState.resumeContext}
                    jobTitle={interviewState.jobTitle}
                    jobCompany={interviewState.jobCompany}
                    onClose={() => {
                        setIsInterviewModalOpen(false);
                        setInterviewState(null);
                    }}
                />
            )}
        </>
    );
};

export default InterviewStudio;