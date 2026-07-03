
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { CAREER_PATHS, Industry } from '../data/careers';
import { ArrowRight, Mic, Loader2, ChevronLeft, Clock, SlidersHorizontal, Sparkles, Trash2, BarChart3, Building2, Search, ListChecks, ExternalLink, Swords, X } from 'lucide-react';
import { navigate } from '../utils/navigation';
import { generateInterviewQuestions } from '../services/geminiService';
import { usePracticeHistory } from '../hooks/useJobHistory';
import { InterviewSessionDraft, Job, PracticeHistoryEntry, ResumeData, TranscriptEntry } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useResumes } from '../hooks/useResumes';
import { db } from '../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useAICreditCheck } from '../hooks/useAICreditCheck';
import { InterviewHistoryCardSkeleton } from '../components/Dashboard/DashboardSkeletons';
import ConfirmationModal from '../components/ConfirmationModal';
import AppLayout from '../components/Layout/AppLayout';
import { INTERVIEW_GUIDE_TOTALS, InterviewGuideSummary } from '../data/interviewGuideSummaries.generated';
import {
    buildLocalInterviewGuidePrompt,
    filterInterviewGuideSummaries,
    formatGuideTopicChip,
    getGuideQuestionPool,
    getQuestionTargetCount,
    GUIDE_CATEGORIES,
    loadLocalInterviewGuide,
} from '../lib/localInterviewGuides';

// Lazy load modal
const InterviewReportModal = React.lazy(() => import('../components/InterviewReportModal'));
const loadAIInterviewAgentModal = () => import('../components/AIInterviewAgentModal');
const AIInterviewAgentModal = React.lazy(loadAIInterviewAgentModal);
const preloadAIInterviewAgentModal = () => loadAIInterviewAgentModal().catch(() => undefined);

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

type InterviewMode = 'Behavioral' | 'Technical' | 'Mixed' | 'Screening';
type InterviewDifficulty = 'Entry' | 'Standard' | 'Senior';
type InterviewDuration = '5 min' | '15 min' | '30 min';

const interviewModes: InterviewMode[] = ['Behavioral', 'Technical', 'Mixed', 'Screening'];
const interviewDifficulties: InterviewDifficulty[] = ['Entry', 'Standard', 'Senior'];
const interviewDurations: InterviewDuration[] = ['5 min', '15 min', '30 min'];

const getResumableDraft = (entry: PracticeHistoryEntry): InterviewSessionDraft | null => {
    const draft = entry.activeInterviewDraft;
    const draftQuestions = draft?.questions?.length ? draft.questions : entry.questions;
    if (!draft || !draft.transcript?.length || !draftQuestions?.length) return null;
    if (draft.questionIndex >= draftQuestions.length) return null;
    return { ...draft, questions: draftQuestions };
};

const getResumeQuestionLabel = (draft: InterviewSessionDraft) =>
    `Q${Math.min(draft.questionIndex + 1, draft.questions.length)}/${draft.questions.length}`;

interface InterviewStudioProps {
    jobId?: string;
}

const InterviewStudio: React.FC<InterviewStudioProps> = ({ jobId }) => {
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState('');
    const [interviewMode, setInterviewMode] = useState<InterviewMode>('Behavioral');
    const [interviewDifficulty, setInterviewDifficulty] = useState<InterviewDifficulty>('Standard');
    const [interviewDuration, setInterviewDuration] = useState<InterviewDuration>('15 min');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
    const [placeholder, setPlaceholder] = useState('');
    const [guideSearch, setGuideSearch] = useState('');
    const [guideCategory, setGuideCategory] = useState('all');
    const [guideLimit, setGuideLimit] = useState(12);
    const [selectedGuideSlug, setSelectedGuideSlug] = useState<string | null>(null);
    const guideSearchRef = useRef<HTMLInputElement>(null);

    // "/" focuses the company guide search unless the user is already typing somewhere
    useEffect(() => {
        const handleSlashShortcut = (event: KeyboardEvent) => {
            if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
            const target = event.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
            event.preventDefault();
            guideSearchRef.current?.focus();
        };
        window.addEventListener('keydown', handleSlashShortcut);
        return () => window.removeEventListener('keydown', handleSlashShortcut);
    }, []);

    const { practiceHistory, addJob, isLoading: isLoadingHistory, deletePracticeHistory, saveInterviewDraft } = usePracticeHistory();
    const { resumes } = useResumes();
    const [isSyncingTransit, setIsSyncingTransit] = useState(false);

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
        initialTranscript?: TranscriptEntry[];
        resumeFromQuestionIndex?: number;
    } | null>(null);
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [handledDeepLinkJobId, setHandledDeepLinkJobId] = useState<string | null>(null);

    // Modal States
    const [selectedJobForReport, setSelectedJobForReport] = useState<PracticeHistoryEntry | null>(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Delete',
        onConfirm: async () => { },
    });

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

    useEffect(() => {
        const syncTransitPractice = async () => {
            const params = new URLSearchParams(window.location.search);
            const source = params.get('source');
            const scrapeId = params.get('scrapeId');
            const resumeId = params.get('resumeId');

            if (source === 'extension_practice' && scrapeId) {
                if (!currentUser) return; // Wait until auth state is resolved

                setIsSyncingTransit(true);
                try {
                    const docRef = doc(db, 'users', currentUser.uid, 'temporaryScrapes', scrapeId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const jobData = {
                            title: data.title || 'Unknown Role',
                            company: data.company || 'Custom Practice',
                            location: '',
                            description: data.description || '',
                            url: data.url || ''
                        };

                        // Delete transit document immediately for privacy
                        await deleteDoc(docRef);

                        // Cleanse URL
                        const newUrl = window.location.pathname;
                        window.history.replaceState({}, document.title, newUrl);

                        // Start interview immediately
                        await handleStartInterview(jobData.description, jobData, resumeId || undefined);
                    }
                } catch (error) {
                    console.error('Error syncing transit job:', error);
                } finally {
                    setIsSyncingTransit(false);
                }
            }
        };

        syncTransitPractice();
    }, [currentUser, resumes]);


    const buildQuestionGenerationPrompt = (basePrompt: string) => {
        return [
            'Interview setup:',
            `- Mode: ${interviewMode}`,
            `- Difficulty: ${interviewDifficulty}`,
            `- Target duration: ${interviewDuration}`,
            '',
            'Job or practice context:',
            basePrompt.trim(),
            '',
            'Generate interview questions that match the setup, seniority, and target duration.',
        ].join('\n');
    };

    const handleStartInterview = async (generationPrompt: string, jobData?: Omit<Job, 'id'>, resumeId?: string) => {
        if (!generationPrompt.trim() || !currentUser) return;

        // CHECK CREDIT BEFORE STARTING
        if (!checkCredit()) return;

        setIsLoading(true);
        setError('');
        void preloadAIInterviewAgentModal();
        try {
            // Generate interview questions
            const questions = await generateInterviewQuestions(currentUser.uid, buildQuestionGenerationPrompt(generationPrompt));
            const job: Omit<Job, 'id'> = jobData || {
                title: generationPrompt,
                company: 'Custom Practice',
                location: '',
                description: generationPrompt,
                url: ''
            };

            // Add job to practice history
            const newJobId = await addJob(job, questions);

            /*
            // Get authentication token for microservice (us-west1 region)
            const functions = getFunctions(undefined, 'us-west1');
            const getToken = httpsCallable(functions, 'getInterviewAuthToken');
            const result = await getToken();
            const { token } = result.data as { token: string };

            // Construct redirect URL to Interview Microservice
            const baseUrl = 'https://careervivid-371634100960.us-west1.run.app';
            const targetUrl = `${baseUrl}/interview-studio/${newJobId}?token=${token}`;

            // Redirect to external microservice
            window.location.href = targetUrl;
            */

            const activeResume = (resumeId && resumes.find(r => r.id === resumeId)) || resumes.find(r => r.isDefault) || resumes[0];
            const resumeContext = activeResume ? formatResumeForContext(activeResume) : '';

            setInterviewState({
                jobId: newJobId,
                prompt: job.description || job.title,
                questions,
                isFirstTime: true,
                resumeContext,
                jobTitle: job.title,
                jobCompany: job.company || 'Custom Practice',
            });
            setIsInterviewModalOpen(true);
            setIsLoading(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setIsLoading(false);
        }
    };

    // Starts a clean attempt and clears any saved draft for this role.
    const handlePracticeAgainDirect = (jobEntry: PracticeHistoryEntry) => {
        const jobData = {
            title: jobEntry.job.title,
            company: jobEntry.job.company || 'Custom Practice',
            location: jobEntry.job.location,
            description: jobEntry.job.description || jobEntry.job.title,
            url: jobEntry.job.url,
        };
        handleStartInterview(jobData.description, jobData);
    };

    const handleResumeSessionDirect = (jobEntry: PracticeHistoryEntry) => {
        const draft = getResumableDraft(jobEntry);
        if (!draft) {
            handlePracticeAgainDirect(jobEntry);
            return;
        }

        const activeResume = resumes.find(r => r.isDefault) || resumes[0];
        const resumeContext = activeResume ? formatResumeForContext(activeResume) : '';

        void preloadAIInterviewAgentModal();
        setInterviewState({
            jobId: jobEntry.id,
            prompt: jobEntry.job.description || jobEntry.job.title,
            questions: draft.questions,
            isFirstTime: false,
            resumeContext,
            jobTitle: jobEntry.job.title,
            jobCompany: jobEntry.job.company || 'Custom Practice',
            initialTranscript: draft.transcript,
            resumeFromQuestionIndex: draft.questionIndex,
        });
        setIsInterviewModalOpen(true);
    };

    // Handle "Practice Again" from Dashboard (other pages via sessionStorage)
    useEffect(() => {
        const practiceJobData = sessionStorage.getItem('practiceJob');
        if (practiceJobData) {
            sessionStorage.removeItem('practiceJob');
            try {
                const jobEntry: PracticeHistoryEntry = JSON.parse(practiceJobData);
                if (getResumableDraft(jobEntry)) {
                    handleResumeSessionDirect(jobEntry);
                    return;
                }
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

    const decodedJobId = jobId ? decodeURIComponent(jobId) : undefined;

    // Handle deep links from scheduled practice emails.
    useEffect(() => {
        if (!decodedJobId || handledDeepLinkJobId === decodedJobId || isInterviewModalOpen || isLoadingHistory) {
            return;
        }

        const foundJob = practiceHistory.find(h => h.id === decodedJobId);
        if (!foundJob) {
            setError("This scheduled practice session was not found for the signed-in account. Confirm you are using the same CareerVivid account that received the email.");
            setHandledDeepLinkJobId(decodedJobId);
            return;
        }

        const startSavedInterview = async () => {
            setIsLoading(true);
            setError('');
            try {
                void preloadAIInterviewAgentModal();
                /*
                const functions = getFunctions(undefined, 'us-west1');
                const getToken = httpsCallable(functions, 'getInterviewAuthToken');
                const result = await getToken();
                const { token } = result.data as { token: string };

                const baseUrl = 'https://careervivid-371634100960.us-west1.run.app';
                const targetUrl = `${baseUrl}/interview-studio/${decodedJobId}?token=${token}`;
                window.location.href = targetUrl;
                */

                const activeResume = resumes.find(r => r.isDefault) || resumes[0];
                const resumeContext = activeResume ? formatResumeForContext(activeResume) : '';
                const draft = getResumableDraft(foundJob);

                setInterviewState({
                    jobId: foundJob.id,
                    prompt: foundJob.job.description || foundJob.job.title,
                    questions: draft?.questions || foundJob.questions || [],
                    isFirstTime: false,
                    resumeContext,
                    jobTitle: foundJob.job.title,
                    jobCompany: foundJob.job.company || 'Custom Practice',
                    initialTranscript: draft?.transcript,
                    resumeFromQuestionIndex: draft?.questionIndex,
                });
                setHandledDeepLinkJobId(decodedJobId);
                setIsInterviewModalOpen(true);
                setIsLoading(false);
            } catch (e) {
                setError("Failed to start scheduled interview. Please try again.");
                setHandledDeepLinkJobId(decodedJobId);
                setIsLoading(false);
            }
        };

        startSavedInterview();
    }, [decodedJobId, handledDeepLinkJobId, isInterviewModalOpen, isLoadingHistory, practiceHistory, resumes]);

    const handlePromptSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleStartInterview(prompt);
    };

    const { guides: visibleGuideSummaries, total: guideMatchTotal } = filterInterviewGuideSummaries({
        query: guideSearch,
        categoryId: guideCategory,
        limit: guideLimit,
    });

    const handleCompanyGuideInterview = async (guideSummary: InterviewGuideSummary) => {
        if (!currentUser) {
            setError('Please sign in to start a company interview.');
            return;
        }

        if (!checkCredit()) return;

        setSelectedGuideSlug(guideSummary.slug);
        setIsLoading(true);
        setError('');
        void preloadAIInterviewAgentModal();

        try {
            const guide = await loadLocalInterviewGuide(guideSummary.slug);
            if (!guide) throw new Error(`Interview guide not found for ${guideSummary.company}.`);

            const guidePrompt = buildLocalInterviewGuidePrompt(guide, {
                mode: interviewMode,
                difficulty: interviewDifficulty,
                duration: interviewDuration,
            });
            const questionTarget = getQuestionTargetCount(interviewDuration);
            const guideQuestions = getGuideQuestionPool(guide, interviewMode).slice(0, questionTarget);
            const questions = guideQuestions.length >= Math.min(3, questionTarget)
                ? guideQuestions
                : await generateInterviewQuestions(currentUser.uid, buildQuestionGenerationPrompt(guidePrompt));

            const job = {
                title: `${guide.company} ${interviewMode} Interview`,
                company: guide.company,
                location: '',
                description: guidePrompt,
                url: guide.url,
            };

            const newJobId = await addJob(job, questions);
            const activeResume = resumes.find(r => r.isDefault) || resumes[0];
            const resumeContext = activeResume ? formatResumeForContext(activeResume) : '';

            setInterviewState({
                jobId: newJobId,
                prompt: guidePrompt,
                questions,
                isFirstTime: true,
                resumeContext,
                jobTitle: job.title,
                jobCompany: guide.company,
            });
            setIsInterviewModalOpen(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to start the company interview.');
        } finally {
            setIsLoading(false);
            setSelectedGuideSlug(null);
        }
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

    const handleDeleteClick = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Session',
            message: 'Are you sure you want to delete this interview session? This action cannot be undone.',
            confirmText: 'Delete',
            onConfirm: async () => {
                await deletePracticeHistory(id);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const formatSessionDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    const renderSegmentedControl = <T extends string,>(
        label: string,
        options: T[],
        value: T,
        onChange: (option: T) => void,
        icon: React.ReactNode
    ) => (
        <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {icon}
                <span>{label}</span>
            </div>
            <div className={`grid ${options.length === 4 ? 'grid-cols-2' : 'grid-cols-3'} gap-1 rounded-lg bg-gray-100 dark:bg-gray-900/70 p-1`}>
                {options.map(option => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onChange(option)}
                        className={`min-h-[34px] rounded-md px-2 text-xs font-semibold leading-tight transition-colors ${value === option
                            ? 'bg-white text-indigo-700 shadow-sm dark:bg-gray-700 dark:text-indigo-200'
                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                            }`}
                        aria-pressed={value === option}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );


    const renderContent = () => {
        if (selectedIndustry) {
            return (
                <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-sm">
                    <button onClick={() => setSelectedIndustry(null)} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4 font-semibold">
                        <ChevronLeft size={16} /> {t('interview_studio.back_to_industries')}
                    </button>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t('interview_studio.select_role', { industry: selectedIndustry.name })}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 @[960px]/interview-page:grid-cols-1 gap-2.5">
                        {selectedIndustry.roles.map(role => (
                            <button
                                key={role.name}
                                onClick={() => handleRoleSelect(role.name)}
                                className="min-h-[54px] p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 border border-gray-200 dark:border-gray-700 transition-all text-left flex items-center justify-between gap-3 group"
                            >
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{role.name}</h3>
                                <ArrowRight size={16} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
                            </button>
                        ))}
                    </div>
                </section>
            );
        }

        return (
            <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t('interview_studio.select_career')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 @[960px]/interview-page:grid-cols-1 gap-2.5">
                    {CAREER_PATHS.map(industry => (
                        <button
                            key={industry.name}
                            onClick={() => setSelectedIndustry(industry)}
                            className="min-h-[54px] p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 border border-gray-200 dark:border-gray-700 transition-all text-left flex items-center justify-between gap-3 group"
                        >
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{industry.name}</h3>
                            <ArrowRight size={16} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
                        </button>
                    ))}
                </div>
            </section>
        );
    };

    const GUIDE_AVATAR_TONES = [
        'bg-[#f3f2ff] text-[#625bd5] ring-[#dfdcff]',
        'bg-[#eef0ff] text-[#7069dc] ring-[#dfe2ff]',
        'bg-[#f7f1ff] text-[#7c5fd6] ring-[#eadfff]',
        'bg-[#f5f7ff] text-[#5c62d6] ring-[#e0e5ff]',
    ];

    const getGuideAvatarTone = (company: string) => {
        let hash = 0;
        for (let i = 0; i < company.length; i++) hash = (hash * 31 + company.charCodeAt(i)) | 0;
        return GUIDE_AVATAR_TONES[Math.abs(hash) % GUIDE_AVATAR_TONES.length];
    };

    const getDifficultyBadge = (difficulty: number | null) => {
        if (!difficulty) return null;
        const tone = difficulty >= 8
            ? 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900'
            : difficulty >= 6.5
                ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900'
                : 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900';
        return (
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${tone}`}>
                <BarChart3 size={11} />
                {difficulty}/10
            </span>
        );
    };

    const formatGuideMeta = (guide: InterviewGuideSummary) => {
        const parts: string[] = [];
        if (guide.questionCount > 0) parts.push(`${guide.questionCount} questions`);
        if (guide.stageCount > 0) parts.push(`${guide.stageCount} stages`);
        if (guide.tipCount > 0) parts.push(`${guide.tipCount} tips`);
        return parts.length ? parts.join(' · ') : 'Company guide overview';
    };

    const renderCompanyGuideCards = () => (
        <section className="@container/guides overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {/* Header */}
            <div className="border-b border-gray-100 bg-gradient-to-br from-[#f3f2ff]/80 via-white to-white p-4 sm:p-5 dark:border-gray-800 dark:from-[#2f2b55]/35 dark:via-gray-900 dark:to-gray-900">
                <div className="flex flex-col gap-3 @[720px]/guides:flex-row @[720px]/guides:items-center @[720px]/guides:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f2ff] text-[#625bd5] ring-1 ring-[#dfdcff] dark:bg-[#2f2b55]/70 dark:text-[#bbb8ff] dark:ring-[#484273]">
                                <Building2 size={16} />
                            </span>
                            <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                Practice from real company guides
                            </h2>
                        </div>
                        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                            Verified stages, topics, and sample questions — turned into a company-style mock interview.
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center divide-x divide-gray-200 rounded-xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800/80">
                        {[
                            { value: INTERVIEW_GUIDE_TOTALS.companies, label: 'companies' },
                            { value: INTERVIEW_GUIDE_TOTALS.questions, label: 'questions' },
                            { value: INTERVIEW_GUIDE_TOTALS.stages, label: 'stages' },
                        ].map((stat) => (
                            <div key={stat.label} className="px-4 py-2 text-center first:pl-4 last:pr-4">
                                <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">{stat.value.toLocaleString()}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Search + category filters */}
                <div className="mt-4 flex flex-col gap-2.5">
                    <div className="group/search flex min-h-[46px] items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 transition-all duration-200 focus-within:border-gray-400 focus-within:bg-white focus-within:shadow-[0_1px_2px_rgba(16,24,40,0.05),0_4px_14px_rgba(16,24,40,0.08)] hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/60 dark:focus-within:border-gray-500 dark:focus-within:bg-gray-800 dark:focus-within:shadow-none">
                        <Search size={17} strokeWidth={2.25} className="shrink-0 text-gray-400 transition-colors group-focus-within/search:text-gray-700 dark:group-focus-within/search:text-gray-200" />
                        <input
                            ref={guideSearchRef}
                            type="search"
                            value={guideSearch}
                            onChange={(event) => { setGuideSearch(event.target.value); setGuideLimit(12); }}
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                    setGuideSearch('');
                                    setGuideLimit(12);
                                    event.currentTarget.blur();
                                }
                            }}
                            placeholder="Search Google, Stripe, OpenAI, system design..."
                            aria-label="Search company interview guides"
                            className="min-w-0 flex-1 border-0 bg-transparent p-0 py-3 text-sm font-medium text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-0 focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-500 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
                        />
                        {guideSearch ? (
                            <button
                                type="button"
                                onClick={() => { setGuideSearch(''); setGuideLimit(12); guideSearchRef.current?.focus(); }}
                                aria-label="Clear search"
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200/70 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            >
                                <X size={14} strokeWidth={2.5} />
                            </button>
                        ) : (
                            <kbd className="hidden shrink-0 items-center rounded-md border border-gray-200 bg-white px-1.5 py-0.5 font-sans text-[11px] font-semibold text-gray-400 shadow-[0_1px_0_rgba(16,24,40,0.06)] @[480px]/guides:inline-flex dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                /
                            </kbd>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {GUIDE_CATEGORIES.map((category) => {
                            const isActive = guideCategory === category.id;
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => { setGuideCategory(category.id); setGuideLimit(12); }}
                                    aria-pressed={isActive}
                                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${isActive
                                        ? 'bg-gray-950 text-white shadow-sm dark:bg-gray-100 dark:text-gray-950'
                                        : 'border border-gray-200 bg-white text-gray-600 hover:border-[#dfdcff] hover:bg-[#fbfbff] hover:text-[#625bd5] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-[#484273] dark:hover:text-[#bbb8ff]'
                                        }`}
                                >
                                    {category.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Cards */}
            <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-3 @[640px]/guides:grid-cols-2 @[1000px]/guides:grid-cols-3">
                    {visibleGuideSummaries.map((guide) => {
                        const isStarting = selectedGuideSlug === guide.slug && isLoading;
                        const topicChips = guide.topics.slice(0, 2).map((topic) => formatGuideTopicChip(topic));
                        return (
                            <article
                                key={guide.slug}
                                className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#dfdcff] hover:bg-[#fbfbff] hover:shadow-md hover:shadow-[#625bd5]/8 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:border-[#484273] dark:hover:bg-[#24233a]/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ring-1 shadow-sm ${getGuideAvatarTone(guide.company)} dark:bg-[#2f2b55]/70 dark:text-[#bbb8ff] dark:ring-[#484273]`}>
                                        {guide.company.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">{guide.company}</h3>
                                            {getDifficultyBadge(guide.difficulty)}
                                        </div>
                                        <p className="mt-0.5 truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                                            {formatGuideMeta(guide)}
                                        </p>
                                    </div>
                                </div>

                                {topicChips.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {topicChips.map((topic) => (
                                            <span
                                                key={topic}
                                                className="max-w-full truncate rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 group-hover:bg-[#f3f2ff] group-hover:text-[#625bd5] dark:bg-gray-900/80 dark:text-gray-300 dark:group-hover:bg-[#2f2b55]/60 dark:group-hover:text-[#bbb8ff]"
                                            >
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-auto flex items-center gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/quest/${guide.slug}`)}
                                        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#eef0ff] px-3 text-xs font-semibold text-[#625bd5] ring-1 ring-[#dfe2ff] shadow-sm transition-colors hover:bg-[#e5e7ff] hover:text-[#514ac5] dark:bg-[#2f2b55]/70 dark:text-[#bbb8ff] dark:ring-[#484273] dark:hover:bg-[#383266]"
                                    >
                                        <Swords size={14} />
                                        Start quest
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleCompanyGuideInterview(guide)}
                                        disabled={isLoading}
                                        title="Single mock interview (no quest)"
                                        aria-label={`Single mock interview for ${guide.company}`}
                                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition-colors hover:border-gray-300 hover:text-[#625bd5] disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500 dark:hover:text-[#bbb8ff]"
                                    >
                                        {isStarting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    </button>
                                    <a
                                        href={`https://www.techinterview.org/companies/${guide.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500 dark:hover:text-gray-200"
                                        aria-label={`Open ${guide.company} source guide`}
                                        title="View source guide"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {visibleGuideSummaries.length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-10 text-center dark:border-gray-700 dark:bg-gray-800/50">
                        <ListChecks className="mx-auto text-gray-400" size={22} />
                        <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-200">No matching company guides</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Try a company name, interview topic, or system design keyword.</p>
                    </div>
                )}

                {guideMatchTotal > visibleGuideSummaries.length && (
                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => setGuideLimit((prev) => prev + 12)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            Show more companies
                            <span className="text-gray-400">({guideMatchTotal - visibleGuideSummaries.length} more)</span>
                        </button>
                    </div>
                )}
            </div>
        </section>
    );

    if ((isLoading || isSyncingTransit) && !isInterviewModalOpen) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-6">
                        {isSyncingTransit ? "Synchronizing Job Details..." : t('interview_studio.preparing')}
                    </h1>
                    <div className="h-6 mt-2">
                        <p key={loadingMessageIndex} className="text-gray-500 dark:text-gray-400 animate-fade-in">
                            {isSyncingTransit ? "Preparing your AI mock interview room..." : t(`interview_studio.loading_${loadingMessageIndex + 1}`)}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <AppLayout>
            <CreditLimitModal />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16 relative text-left">
                <div id="start-session" className="@container/interview-page max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-5">
                    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Recent sessions</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{practiceHistory.length} saved</p>
                            </div>
                            <Mic className="text-indigo-500 flex-shrink-0" size={20} />
                        </div>

                        <div className="grid grid-cols-1 @[720px]/interview-page:grid-cols-2 @[1040px]/interview-page:grid-cols-3 gap-3">
                            {isLoadingHistory
                                ? Array.from({ length: 3 }).map((_, i) => <InterviewHistoryCardSkeleton key={i} />)
                                : practiceHistory.length > 0 ? (
                                    practiceHistory.map(entry => {
                                        const practiceCount = entry.interviewHistory?.length || 0;
                                        const resumableDraft = getResumableDraft(entry);
                                        return (
                                            <article
                                                key={entry.id}
                                                className="flex min-h-[132px] flex-col rounded-lg border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-800/60"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
                                                            {entry.job.title}
                                                        </h3>
                                                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                                                            {entry.job.company || 'Custom Practice'}
                                                        </p>
                                                    </div>
                                                    {(practiceCount > 0 || resumableDraft) && (
                                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                                            {practiceCount > 0 && (
                                                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                                                                    {practiceCount} {practiceCount === 1 ? 'practice' : 'practices'}
                                                                </span>
                                                            )}
                                                            {resumableDraft && (
                                                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
                                                                    {getResumeQuestionLabel(resumableDraft)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-2 flex h-5 min-w-0 items-center gap-1.5 text-xs">
                                                    {resumableDraft && (
                                                        <>
                                                            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/25 dark:text-amber-200 dark:ring-amber-900/50">
                                                                Saved draft
                                                            </span>
                                                            <span className="text-gray-300 dark:text-gray-600">·</span>
                                                        </>
                                                    )}
                                                    <span className="truncate text-gray-500 dark:text-gray-400">
                                                        Last activity: {formatSessionDate(entry.timestamp)}
                                                    </span>
                                                </div>
                                                <div className="mt-auto flex flex-nowrap items-center gap-1.5 pt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteClick(entry.id)}
                                                        aria-label={`Delete ${entry.job.title}`}
                                                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                    {resumableDraft && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleResumeSessionDirect(entry)}
                                                            aria-label="Resume session"
                                                            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-amber-100 px-2.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/60 dark:hover:bg-amber-950/70"
                                                        >
                                                            <Clock size={14} /> Resume
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePracticeAgainDirect(entry)}
                                                        aria-label={resumableDraft ? 'Start over' : 'Practice Again'}
                                                        className={`${resumableDraft ? 'w-8 justify-center px-0' : 'px-2.5'} inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-white text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-800`}
                                                    >
                                                        <Sparkles size={14} />
                                                        {!resumableDraft && 'Practice Again'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedJobForReport(entry)}
                                                        disabled={!entry.interviewHistory || entry.interviewHistory.length === 0}
                                                        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900/60 dark:hover:bg-indigo-950/70"
                                                    >
                                                        <BarChart3 size={14} /> Report
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })
                                ) : (
                                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-8 text-center dark:border-gray-700 dark:bg-gray-800/50 @[720px]/interview-page:col-span-2 @[1040px]/interview-page:col-span-3">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No interview sessions found.</p>
                                    </div>
                                )
                            }
                        </div>
                    </section>

                    <div className="grid grid-cols-1 @[960px]/interview-page:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
                        <main className="space-y-4">
                            <section className="@container/setup bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 @[720px]/setup:p-6 shadow-sm">
                                <div className="flex flex-col gap-5">
                                    <div>
                                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-full px-2.5 py-1 mb-3">
                                            <Mic size={14} />
                                            <span>Interview workspace</span>
                                        </div>
                                        <h1 className="text-2xl @[560px]/setup:text-3xl font-extrabold text-gray-900 dark:text-gray-100">{t('interview_studio.title')}</h1>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-2xl">{t('interview_studio.subtitle')}</p>
                                    </div>

                                    <form onSubmit={handlePromptSubmit} className="space-y-4">
                                        <div>
                                            <label htmlFor="interview-prompt" className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                                {t('interview_studio.start_title')}
                                            </label>
                                            <div className="flex flex-col @[560px]/setup:flex-row gap-3">
                                                <input
                                                    id="interview-prompt"
                                                    type="text"
                                                    value={prompt}
                                                    onChange={(e) => setPrompt(e.target.value)}
                                                    placeholder={placeholder}
                                                    className="flex-grow w-full px-3.5 py-2.5 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow"
                                                />
                                                <button
                                                    type="submit"
                                                    className="flex-shrink-0 min-h-[42px] bg-indigo-600 text-white text-sm font-semibold py-2.5 px-4 rounded-lg shadow-soft hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                                                    disabled={!prompt.trim() || isLoading}
                                                >
                                                    {t('interview_studio.start_btn')} <ArrowRight size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 @[560px]/setup:grid-cols-3 gap-4">
                                            {renderSegmentedControl('Mode', interviewModes, interviewMode, setInterviewMode, <Sparkles size={16} className="text-indigo-500" />)}
                                            {renderSegmentedControl('Difficulty', interviewDifficulties, interviewDifficulty, setInterviewDifficulty, <SlidersHorizontal size={16} className="text-indigo-500" />)}
                                            {renderSegmentedControl('Duration', interviewDurations, interviewDuration, setInterviewDuration, <Clock size={16} className="text-indigo-500" />)}
                                        </div>
                                    </form>
                                </div>
                            </section>
                            {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg">{error}</p>}
                            {renderCompanyGuideCards()}
                        </main>
                        <div>
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" /></div>}>
                {selectedJobForReport && <InterviewReportModal jobHistoryEntry={selectedJobForReport} onClose={() => setSelectedJobForReport(null)} />}
            </Suspense>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />

            <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" /></div>}>
                {isInterviewModalOpen && interviewState && (
                    <AIInterviewAgentModal
                        jobId={interviewState.jobId}
                        interviewPrompt={interviewState.prompt}
                        questions={interviewState.questions}
                        isFirstTime={interviewState.isFirstTime}
                        resumeContext={interviewState.resumeContext}
                        jobTitle={interviewState.jobTitle}
                        jobCompany={interviewState.jobCompany}
                        initialTranscript={interviewState.initialTranscript}
                        resumeFromQuestionIndex={interviewState.resumeFromQuestionIndex}
                        onDraftChange={(draft) => saveInterviewDraft(interviewState.jobId, draft)}
                        onClose={() => {
                            setIsInterviewModalOpen(false);
                            setInterviewState(null);
                        }}
                    />
                )}
            </Suspense>
        </AppLayout>
    );
};

export default InterviewStudio;
