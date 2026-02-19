
import React, { useState, useEffect } from 'react';
import { useResumes } from '../hooks/useResumes';
import { generateResumeFromPrompt, parseResume } from '../services/geminiService';
import { CAREER_PATHS, Industry } from '../data/careers';
import { ArrowRight, Zap, Loader2, ChevronLeft, LayoutDashboard, UploadCloud, FileText, Plus } from 'lucide-react';
import { navigate } from '../utils/navigation';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import ResumeImport from '../components/ResumeImport';
import ResumeCard from '../components/Dashboard/ResumeCard';
import { ResumeCardSkeleton } from '../components/Dashboard/DashboardSkeletons';
import ShareResumeModal from '../components/ShareResumeModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { ResumeData } from '../types';

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
    const { resumes, addAIGeneratedResume, updateResume, deleteResume, duplicateResume, isLoading: isLoadingResumes } = useResumes();
    const [prompt, setPrompt] = useState('');
    const [isFileImport, setIsFileImport] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [placeholder, setPlaceholder] = useState('');

    const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);

    // Modal States
    const [shareModalResume, setShareModalResume] = useState<ResumeData | null>(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Delete',
        onConfirm: async () => { },
    });

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

    const handleGenerate = async (inputContent: string) => {
        if (!inputContent.trim() || !currentUser) return;

        if (resumes.length === 0) {
            sessionStorage.setItem('isFirstResume', 'true');
        } else {
            sessionStorage.removeItem('isFirstResume');
        }

        setIsLoading(true);
        setError('');
        try {
            let aiData;

            if (isFileImport) {
                aiData = await parseResume(currentUser.uid, inputContent, 'English');
            } else {
                aiData = await generateResumeFromPrompt(currentUser.uid, inputContent);
            }

            if (!aiData || typeof aiData !== 'object' || !aiData.personalDetails) {
                console.error("Invalid data structure from AI:", aiData);
                throw new Error("AI failed to generate a valid resume structure. Please try a more specific prompt.");
            }

            const title = `${aiData.personalDetails.jobTitle || 'New'} Resume`;
            addAIGeneratedResume(aiData, title);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setIsLoading(false);
        }
    };

    const handlePromptSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        handleGenerate(prompt);
    };

    const handleFileProcessed = (text: string) => {
        setIsFileImport(true);
        handleGenerate(text);
    };

    const handleTextChange = (text: string) => {
        setPrompt(text);
        if (isFileImport) setIsFileImport(false);
    };

    const handleRoleSelect = (roleName: string) => {
        const industryName = selectedIndustry?.name;
        const fullPrompt = `Create a professional resume for the role of '${roleName}'. This role is in the '${industryName}' industry. The resume should be tailored to highlight key qualifications, skills, and experiences relevant to this specific career path.`;
        handleGenerate(fullPrompt);
    };

    const handleDeleteClick = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Resume',
            message: 'Are you sure you want to delete this resume? This action cannot be undone.',
            confirmText: 'Delete',
            onConfirm: async () => {
                await deleteResume(id);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-6">Generating your resume...</h1>
                    <div className="h-6 mt-2">
                        <p key={loadingMessageIndex} className="text-gray-500 dark:text-gray-400 animate-fade-in">
                            {loadingMessages[loadingMessageIndex]}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 relative text-left">
            {/* Dashboard Link */}
            {resumes.length > 0 && (
                <div className="absolute top-6 right-6 z-20">
                    <a
                        href="/"
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <LayoutDashboard size={18} />
                        <span className="hidden sm:inline">Dashboard</span>
                    </a>
                </div>
            )}

            {/* Top Section: My Resumes */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pt-8 pb-12 mb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <FileText className="text-primary-600" size={32} />
                            My Resumes
                        </h1>
                        <button
                            onClick={() => document.getElementById('create-section')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium"
                        >
                            <Plus size={20} /> New Resume
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {isLoadingResumes
                            ? Array.from({ length: 4 }).map((_, i) => <ResumeCardSkeleton key={i} />)
                            : resumes.length > 0 ? (
                                resumes.map(resume => (
                                    <ResumeCard
                                        key={resume.id}
                                        resume={resume}
                                        onUpdate={updateResume}
                                        onDuplicate={duplicateResume}
                                        onDelete={handleDeleteClick}
                                        onShare={setShareModalResume}
                                        onDragStart={(e) => e.preventDefault()}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't created any resumes yet.</p>
                                    <button
                                        onClick={() => document.getElementById('create-section')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="text-primary-600 font-medium hover:underline"
                                    >
                                        Create your first resume below
                                    </button>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>

            {/* Bottom Section: Create New */}
            <div id="create-section" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <Logo className="h-12 w-12 mx-auto" />
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mt-4">Create Your Next Resume</h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">Start with an AI-powered prompt or choose a guided path to generate a professional resume in seconds.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-10">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Generate or Import Your Resume</h2>
                    <div className="flex flex-col gap-4">
                        <ResumeImport
                            value={prompt}
                            onChange={handleTextChange}
                            onFileProcessed={handleFileProcessed}
                            placeholder={placeholder}
                            className="bg-transparent"
                            variant="modern"
                        >
                            <button
                                onClick={() => handlePromptSubmit()}
                                className="bg-primary-600 text-white p-3 rounded-lg shadow-soft hover:bg-primary-700 transition-colors flex items-center justify-center disabled:bg-primary-300 disabled:cursor-not-allowed"
                                disabled={!prompt.trim()}
                                title={isFileImport ? "Import & Parse" : "Generate Resume"}
                            >
                                <ArrowRight size={20} />
                            </button>
                        </ResumeImport>
                    </div>
                </div>

                {renderContent()}

                {error && <p className="text-red-500 text-center mt-6 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg">{error}</p>}
            </div>

            {/* Modals */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />

            {shareModalResume && (
                <ShareResumeModal
                    isOpen={!!shareModalResume}
                    onClose={() => setShareModalResume(null)}
                    resume={shareModalResume}
                    onUpdate={updateResume}
                />
            )}
        </div>
    );
};

export default GenerationHub;