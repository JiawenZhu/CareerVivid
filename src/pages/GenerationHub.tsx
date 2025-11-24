
import React, { useState, useEffect } from 'react';
import { useResumes } from '../hooks/useResumes';
import { generateResumeFromPrompt } from '../services/geminiService';
import { CAREER_PATHS, Industry } from '../data/careers';
import { ArrowRight, Zap, Loader2, ChevronLeft, LayoutDashboard } from 'lucide-react';
import { navigate } from '../App';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

const loadingMessages = [
    "Analyzing your prompt...",
    "Accessing professional knowledge base...",
    "Drafting key achievements...",
    "Selecting impactful skills...",
    "Polishing the final layout...",
    "Almost there!",
];

const placeholderPrompts = [
    'A senior product manager resume for a fintech startup',
    'A recent computer science graduate resume with internship experience',
    'A registered nurse resume specializing in emergency room care',
    'A data scientist resume with a focus on machine learning models',
    'A UX/UI designer portfolio resume for a mobile app',
    'A marketing manager resume with social media campaign experience',
    'A cybersecurity analyst resume with certifications',
    'A project manager resume using Agile methodologies',
];

const GenerationHub: React.FC = () => {
    const { currentUser } = useAuth();
    const { resumes, addAIGeneratedResume } = useResumes();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [placeholder, setPlaceholder] = useState('');

    const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);

     useEffect(() => {
        let interval: number;
        if (isLoading) {
            setLoadingMessageIndex(0); // Reset on start
            interval = window.setInterval(() => {
                setLoadingMessageIndex(prevIndex => {
                    if (prevIndex >= loadingMessages.length - 1) {
                        return prevIndex; // Stay on the last message
                    }
                    return prevIndex + 1;
                });
            }, 1800);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

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
                // Deleting
                setPlaceholder(currentPrompt.substring(0, charIndex - 1));
                charIndex--;
            } else {
                // Typing
                setPlaceholder(currentPrompt.substring(0, charIndex + 1));
                charIndex++;
            }
            
            if (!isDeleting && charIndex === currentPrompt.length) {
                // Finished typing, start pause before deleting
                isDeleting = true;
                const pause = pauseDurations[pauseIndex % pauseDurations.length];
                pauseIndex = (pauseIndex + 1) % pauseDurations.length;
                timeoutId = window.setTimeout(type, pause);
            } else if (isDeleting && charIndex === 0) {
                // Finished deleting, move to next prompt
                isDeleting = false;
                promptIndex = (promptIndex + 1) % placeholderPrompts.length;
                timeoutId = window.setTimeout(type, 500); // Brief pause before typing next
            } else {
                // Continue typing/deleting
                timeoutId = window.setTimeout(type, isDeleting ? deletingSpeed : typingSpeed);
            }
        };

        // Start the effect after an initial delay
        timeoutId = window.setTimeout(type, 1500);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    const handleGenerate = async (generationPrompt: string) => {
        if (!generationPrompt.trim() || !currentUser) return;
        
        if (resumes.length === 0) {
            sessionStorage.setItem('isFirstResume', 'true');
        } else {
            sessionStorage.removeItem('isFirstResume');
        }

        setIsLoading(true);
        setError('');
        try {
            const aiData = await generateResumeFromPrompt(currentUser.uid, generationPrompt);

            // Defensive check to ensure the AI returns a valid object with the required nested structure.
            if (!aiData || typeof aiData !== 'object' || !aiData.personalDetails) {
                console.error("Invalid data structure from AI:", aiData);
                throw new Error("AI failed to generate a valid resume structure. Please try a more specific prompt.");
            }

            const title = `${aiData.personalDetails.jobTitle || 'New'} Resume`;
            addAIGeneratedResume(aiData, title);
            // Navigation happens in the hook
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setIsLoading(false);
        }
    };

    const handlePromptSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleGenerate(prompt);
    };

    const handleRoleSelect = (roleName: string) => {
        const industryName = selectedIndustry?.name;
        const fullPrompt = `Create a professional resume for the role of '${roleName}'. This role is in the '${industryName}' industry. The resume should be tailored to highlight key qualifications, skills, and experiences relevant to this specific career path.`;
        handleGenerate(fullPrompt);
    };

    const renderContent = () => {
        if (selectedIndustry) {
            return (
                <div>
                    <button onClick={() => setSelectedIndustry(null)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4 font-semibold">
                        <ChevronLeft size={18} /> Back to Industries
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Select a Role in {selectedIndustry.name}</h2>
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
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Or, select a career path</h2>
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative">
             {resumes.length > 0 && (
                <div className="absolute top-6 right-6">
                    <a
                        href="#/"
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg shadow-soft border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </a>
                </div>
            )}
            {isLoading ? (
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-6">Generating your resume...</h1>
                    <div className="h-6 mt-2">
                        <p key={loadingMessageIndex} className="text-gray-500 dark:text-gray-400 animate-fade-in">
                            {loadingMessages[loadingMessageIndex]}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <Logo className="h-12 w-12 mx-auto" />
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mt-4">Create Your Next Resume</h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">Start with an AI-powered prompt or choose a guided path to generate a professional resume in seconds.</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-10">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Start with a prompt</h2>
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
                                className="flex-shrink-0 bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg shadow-soft hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:bg-primary-300"
                                disabled={!prompt.trim()}
                            >
                                Generate Resume <ArrowRight size={20} />
                            </button>
                        </form>
                    </div>

                    {renderContent()}

                    {error && <p className="text-red-500 text-center mt-6 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg">{error}</p>}
                </div>
            )}
        </div>
    );
};
export default GenerationHub;