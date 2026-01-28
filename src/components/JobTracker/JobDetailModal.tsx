import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { JobApplicationData, ApplicationStatus, WorkModel, APPLICATION_STATUSES, WORK_MODELS, ResumeData, ResumeMatchAnalysis } from '../../types';
import { X, Briefcase, Building, MapPin, Link as LinkIcon, ExternalLink, Trash2, Loader2, Wand2, ChevronDown, Plus, Minus, FileText, CheckCircle, XCircle, ArrowRight, Play, Square, Settings, Volume2, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useResumes } from '../../hooks/useResumes';
import { generateJobPrepNotes, regenerateJobPrepSection, analyzeResumeMatch } from '../../services/geminiService';
import ConfirmationModal from '../ConfirmationModal';
import { navigate } from '../../utils/navigation';
import { useAICreditCheck } from '../../hooks/useAICreditCheck';

// Reusable components for the top section
const EditableField: React.FC<{ label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder }) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">{label}</label>
        <input
            type={type}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="mt-1 block w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 transition-colors"
        />
    </div>
);

const EditableSelect: React.FC<{ label: string; value: string; onChange: (value: string) => void; options: readonly string[] }> = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">{label}</label>
        <select value={value || ''} onChange={e => onChange(e.target.value)} className="mt-1 block w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 transition-colors dark:bg-gray-800">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

// --- NEW Enhanced Markdown Renderer ---
const MarkdownRenderer: React.FC<{ text: string }> = ({ text = '' }) => {
    const renderContent = (content: string) => {
        // Split content by links [text](url)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            // Text before link
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
            }
            // The link
            parts.push({ type: 'link', text: match[1], url: match[2] });
            lastIndex = linkRegex.lastIndex;
        }
        // Remaining text
        if (lastIndex < content.length) {
            parts.push({ type: 'text', content: content.slice(lastIndex) });
        }

        // If no links found, return single text part to process bold
        if (parts.length === 0) parts.push({ type: 'text', content });

        return parts.map((part, i) => {
            if (part.type === 'link') {
                return (
                    <a
                        key={i}
                        href={part.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 hover:underline break-words"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part.text}
                    </a>
                );
            } else {
                // Process bold (**text**) inside text parts
                const boldParts = part.content.split(/(\*\*.*?\*\*)/g);
                return boldParts.map((bp, j) => {
                    if (bp.startsWith('**') && bp.endsWith('**')) {
                        return <strong key={`${i}-${j}`}>{bp.slice(2, -2)}</strong>;
                    }
                    return <span key={`${i}-${j}`}>{bp}</span>;
                });
            }
        });
    };

    const lines = text.split('\n');
    const elements = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.trim().startsWith('### ')) {
            elements.push(<h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-primary-600 dark:text-primary-400">{renderContent(line.substring(4))}</h3>);
        } else if (line.trim().startsWith('## ')) {
            elements.push(<h2 key={i} className="text-xl font-bold mt-6 mb-3">{renderContent(line.substring(3))}</h2>);
        } else if (line.trim().startsWith('# ')) {
            elements.push(<h1 key={i} className="text-2xl font-extrabold mt-8 mb-4">{renderContent(line.substring(2))}</h1>);
        } else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            elements.push(
                <div key={i} className="flex items-start pl-4">
                    <span className="mr-2 mt-1 text-primary-500">•</span>
                    <span>{renderContent(line.substring(line.indexOf(' ') + 1))}</span>
                </div>
            );
        } else if (/^\d+\.\s/.test(line.trim())) {
            elements.push(
                <div key={i} className="flex items-start pl-2 my-2">
                    <span className="mr-2 font-semibold text-gray-600 dark:text-gray-400">{line.match(/^\d+\./)?.[0]}</span>
                    <span>{renderContent(line.substring(line.indexOf('.') + 2))}</span>
                </div>
            );
        } else if (line.trim() === '') {
            if (elements.length > 0 && elements[elements.length - 1].props.className !== 'h-2') {
                elements.push(<div key={i} className="h-2"></div>);
            }
        } else {
            if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                elements.push(<p key={i} className="font-semibold text-gray-800 dark:text-gray-200 mt-3 mb-1">{renderContent(line)}</p>);
            } else {
                elements.push(<p key={i}>{renderContent(line)}</p>);
            }
        }
    }

    return (
        <div className="text-gray-800 dark:text-gray-200 leading-relaxed space-y-1">
            {elements}
        </div>
    );
};


// --- NEW Interactive Editable Section ---
const EditablePrepSection: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onRegenerate: () => void;
    selectedVoice: SpeechSynthesisVoice | null;
}> = ({ label, value, onChange, placeholder, onRegenerate, selectedVoice }) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const [isPlaying, setIsPlaying] = useState(false);
    const [highlightRange, setHighlightRange] = useState<{ start: number, end: number } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            textareaRef.current.focus();
        }
    }, [isEditing, currentValue]);

    const handleSave = () => {
        setIsEditing(false);
        if (currentValue !== value) {
            onChange(currentValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape') {
            setCurrentValue(value);
            setIsEditing(false);
        }
    };

    const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCurrentValue(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const getCleanText = (text: string) => text.replace(/\*\*/g, '');

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.speechSynthesis.speaking && isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            setHighlightRange(null);
        } else {
            window.speechSynthesis.cancel();
            const textToRead = value || placeholder || "No text available.";
            const cleanText = getCleanText(textToRead);
            const utterance = new SpeechSynthesisUtterance(cleanText);

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            utterance.onboundary = (event) => {
                if (event.name === 'word') {
                    setHighlightRange({
                        start: event.charIndex,
                        end: event.charIndex + event.charLength
                    });
                }
            };

            utterance.onend = () => {
                setIsPlaying(false);
                setHighlightRange(null);
            };

            utterance.onerror = () => {
                setIsPlaying(false);
                setHighlightRange(null);
            };

            window.speechSynthesis.speak(utterance);
            setIsPlaying(true);
        }
    };

    const renderHighlightedText = () => {
        if (!value) return <span className="text-gray-400 italic">{placeholder}</span>;

        // If not playing or no highlight, fallback to standard markdown render
        if (!isPlaying || !highlightRange) {
            const parts = value.split(/(\*\*.*?\*\*)/g);
            return parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                return <span key={i}>{part}</span>;
            });
        }

        // Logic to render text with highlighting while preserving bold
        const parts = value.split(/(\*\*.*?\*\*)/g);
        let currentCleanIdx = 0;

        return parts.map((part, i) => {
            const isBold = part.startsWith('**') && part.endsWith('**');
            const content = isBold ? part.slice(2, -2) : part;

            // Map this part's range in the CLEAN text
            const partStart = currentCleanIdx;
            const partEnd = currentCleanIdx + content.length;
            currentCleanIdx += content.length;

            // Check overlap with highlightRange
            // Range: [partStart, partEnd] vs [highlightRange.start, highlightRange.end]
            if (highlightRange.end > partStart && highlightRange.start < partEnd) {
                // Determine intersection relative to this part's content
                const startInPart = Math.max(0, highlightRange.start - partStart);
                const endInPart = Math.min(content.length, highlightRange.end - partStart);

                const before = content.substring(0, startInPart);
                const highlight = content.substring(startInPart, endInPart);
                const after = content.substring(endInPart);

                const Wrapper = isBold ? 'strong' : 'span';

                return (
                    <Wrapper key={i}>
                        {before}
                        <span className="bg-yellow-200 dark:bg-yellow-900/50 rounded-sm px-0.5 transition-colors duration-75">{highlight}</span>
                        {after}
                    </Wrapper>
                );
            }

            return isBold ? <strong key={i}>{content}</strong> : <span key={i}>{content}</span>;
        });
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{label}</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePlay}
                        title={isPlaying ? "Stop Reading" : "Read Aloud"}
                        className={`p-1 transition-colors rounded-full ${isPlaying ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20'}`}
                    >
                        {isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    </button>
                    <button onClick={onRegenerate} title="Regenerate with AI" className="text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 p-1">
                        <Wand2 size={18} />
                    </button>
                </div>
            </div>

            <div
                className="cursor-pointer group min-h-[60px] p-2 -ml-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => !isEditing && setIsEditing(true)}
            >
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={currentValue || ''}
                        onChange={handleTextareaInput}
                        onBlur={handleSave}
                        onKeyDown={(e) => { if (e.key === 'Escape') handleSave(); }}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 resize-none overflow-hidden"
                        placeholder={placeholder}
                        autoFocus
                    />
                ) : (
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                        {renderHighlightedText()}
                    </div>
                )}
            </div>
        </div>
    );
};


// --- AI Regeneration Modal ---
const RegenerateModal: React.FC<{
    sectionName: string;
    onClose: () => void;
    onRegenerate: (instruction: string) => Promise<void>;
}> = ({ sectionName, onClose, onRegenerate }) => {
    const { t } = useTranslation();
    const [instruction, setInstruction] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        await onRegenerate(instruction);
        setIsLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-xl">
                <h3 className="text-lg font-bold mb-4">{t('job_tracker.modal.regenerate_modal_title', { section: sectionName })}</h3>
                <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder={t('job_tracker.modal.regenerate_placeholder')}
                    className="w-full p-2 border rounded-md mb-4 bg-white dark:bg-gray-700 dark:border-gray-600"
                    rows={3}
                />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">{t('common.cancel')}</button>
                    <button onClick={handleGenerate} disabled={isLoading} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-300 flex items-center gap-2">
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                        {isLoading ? t('job_tracker.modal.regenerating') : t('job_tracker.modal.regenerate')}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface JobDetailModalProps {
    job: JobApplicationData;
    onClose: () => void;
    onUpdate: (id: string, data: Partial<JobApplicationData>) => void;
    onDelete: (id: string) => void;
    highlightGenerateButton?: boolean;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose, onUpdate, onDelete, highlightGenerateButton = false }) => {
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const { resumes } = useResumes();

    // AI Credit Check Hook
    const { checkCredit, CreditLimitModal } = useAICreditCheck();
    const [localJob, setLocalJob] = useState(job);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);
    const [regenModalState, setRegenModalState] = useState<{ section: keyof JobApplicationData, name: string } | null>(null);
    const [showDescription, setShowDescription] = useState(false);
    const [fontSize, setFontSize] = useState(1); // 0: sm, 1: base, 2: lg
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [shouldAnimateButton, setShouldAnimateButton] = useState(highlightGenerateButton);

    const [isHighlighting, setIsHighlighting] = useState(false);
    const prepNotesContainerRef = useRef<HTMLDivElement>(null);
    const prevPrepNotesRef = useRef<string | undefined>(job.prep_RoleOverview);

    // New state for Resume Match feature
    const { resumes: allResumes } = useResumes();
    const [selectedResumeId, setSelectedResumeId] = useState<string>('');
    const [analysis, setAnalysis] = useState<ResumeMatchAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState('');

    useEffect(() => {
        if (selectedResumeId && localJob.matchAnalyses) {
            setAnalysis(localJob.matchAnalyses[selectedResumeId] || null);
        } else {
            setAnalysis(null);
        }
    }, [selectedResumeId, localJob.matchAnalyses]);


    // Sync local state when the job prop from the parent updates.
    useEffect(() => {
        setLocalJob(job);
    }, [job]);

    // Pre-select the first resume for analysis
    useEffect(() => {
        if (allResumes.length > 0 && !selectedResumeId) {
            setSelectedResumeId(allResumes[0].id);
        }
    }, [allResumes, selectedResumeId]);

    // Effect to scroll and highlight prep notes when they are first generated
    useEffect(() => {
        if (!prevPrepNotesRef.current && job.prep_RoleOverview) {
            const scrollTimer = setTimeout(() => {
                prepNotesContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setIsHighlighting(true);
            }, 100);

            const highlightTimer = setTimeout(() => {
                setIsHighlighting(false);
            }, 2100); // Duration of animation + buffer

            return () => {
                clearTimeout(scrollTimer);
                clearTimeout(highlightTimer);
            };
        }
        prevPrepNotesRef.current = job.prep_RoleOverview;
    }, [job.prep_RoleOverview]);

    const handleFontSizeChange = (direction: 'increase' | 'decrease') => {
        setFontSize(currentSize => {
            if (direction === 'increase') return Math.min(2, currentSize + 1);
            return Math.max(0, currentSize - 1);
        });
    };
    const textSizeClass = ['text-sm', 'text-base', 'text-lg'][fontSize];

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    useEffect(() => {
        if (isEditingDescription && descriptionTextareaRef.current) {
            descriptionTextareaRef.current.style.height = 'auto';
            descriptionTextareaRef.current.style.height = `${descriptionTextareaRef.current.scrollHeight} px`;
            descriptionTextareaRef.current.focus();
        }
    }, [isEditingDescription, localJob.jobDescription]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (JSON.stringify(localJob) !== JSON.stringify(job)) {
                onUpdate(localJob.id, localJob);
            }
        }, 1000);
        return () => clearTimeout(handler);
    }, [localJob, onUpdate, job]);

    const handleChange = (field: keyof JobApplicationData, value: any) => {
        setLocalJob(prev => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (dateString: string) => {
        if (dateString) {
            const date = new Date(dateString + 'T00:00:00');
            handleChange('dateApplied', date);
        } else {
            handleChange('dateApplied', null);
        }
    };

    const formatDateForInput = (date: any) => {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toISOString().split('T')[0];
    };

    const handleDelete = () => {
        setIsConfirmDeleteOpen(true);
    };

    const confirmDelete = () => {
        setIsDeleting(true);
        onDelete(job.id);
        setIsConfirmDeleteOpen(false);
        onClose();
    };

    const getResumeContext = (): string => {
        const latestResume = resumes[0];
        if (!latestResume) return "No resume available.";
        // ... (rest of the function is the same)
        let context = `Name: ${latestResume.personalDetails.firstName} ${latestResume.personalDetails.lastName} \n`;
        context += `Job Title: ${latestResume.personalDetails.jobTitle} \n\nSUMMARY: \n${latestResume.professionalSummary} \n\n`;
        if (latestResume.employmentHistory.length > 0) {
            context += `EXPERIENCE: \n`;
            latestResume.employmentHistory.forEach(job => {
                context += `- ${job.jobTitle} at ${job.employer} \n${job.description} \n`;
            });
        }
        if (latestResume.skills.length > 0) {
            context += `\nSKILLS: ${latestResume.skills.map(s => s.name).join(', ')} \n`;
        }
        return context;
    };

    const handleGenerateAllPrepNotes = async () => {
        if (!currentUser) return;

        // CHECK CREDIT
        if (!checkCredit()) return;
        setShouldAnimateButton(false);
        setIsGeneratingAll(true);
        try {
            const resumeContext = getResumeContext();
            const generatedNotes = await generateJobPrepNotes(currentUser.uid, localJob, resumeContext);
            // Directly update parent. The useEffect will handle the scroll and highlight.
            onUpdate(localJob.id, { ...localJob, ...generatedNotes });
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to generate notes.");
        } finally {
            setIsGeneratingAll(false);
        }
    };

    const handleRegenerateSection = async (instruction: string) => {
        if (!currentUser || !regenModalState) return;

        // CHECK CREDIT
        if (!checkCredit()) return;
        const resumeContext = getResumeContext();
        try {
            const newText = await regenerateJobPrepSection(
                currentUser.uid,
                regenModalState.name,
                localJob,
                resumeContext,
                instruction
            );
            handleChange(regenModalState.section, newText);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to regenerate section.");
        }
    };

    // --- New Resume Match Functions ---

    const formatResumeForAnalysis = (resume: ResumeData): string => {
        let text = `Title: ${resume.personalDetails.jobTitle} \n\n`;
        text += `Summary: ${resume.professionalSummary} \n\n`;
        text += `Skills: ${resume.skills.map(s => s.name).join(', ')} \n\n`;
        text += 'Experience:\n';
        resume.employmentHistory.forEach(job => {
            text += `- ${job.jobTitle} at ${job.employer} \n${job.description} \n`;
        });
        text += '\nEducation:\n';
        resume.education.forEach(edu => {
            text += `- ${edu.degree} from ${edu.school} \n`;
        });
        return text;
    };

    const handleAnalyzeMatch = async () => {
        if (!currentUser || !selectedResumeId || !localJob.jobDescription) {
            setAnalysisError('A resume must be selected and the job must have a description.');
            return;
        }

        // CHECK CREDIT
        if (!checkCredit()) return;

        const selectedResume = allResumes.find(r => r.id === selectedResumeId);
        if (!selectedResume) {
            setAnalysisError('Could not find the selected resume.');
            return;
        }

        setIsAnalyzing(true);
        setAnalysis(null);
        setAnalysisError('');

        try {
            const resumeText = formatResumeForAnalysis(selectedResume);
            const result = await analyzeResumeMatch(currentUser.uid, resumeText, localJob.jobDescription);
            setAnalysis(result);
            // Persist to job
            const updatedAnalyses = { ...(localJob.matchAnalyses || {}), [selectedResumeId]: result };
            handleChange('matchAnalyses', updatedAnalyses);
        } catch (error) {
            setAnalysisError(error instanceof Error ? error.message : 'An unknown error occurred during analysis.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleOptimizeResume = () => {
        sessionStorage.setItem('jobDescriptionForOptimization', job.jobDescription || '');
        sessionStorage.setItem('jobTitleForOptimization', job.jobTitle || '');
        if (analysis) {
            sessionStorage.setItem('jobMatchAnalysis', JSON.stringify(analysis));
        } else {
            sessionStorage.removeItem('jobMatchAnalysis');
        }
        navigate(`/ edit / ${selectedResumeId} `);
    };

    // --- Voice Selection State ---
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);

    // Robust Voice Loading
    useEffect(() => {
        const loadVoices = () => {
            // Array.from ensures we get a proper array from the browser API
            const allVoices = Array.from(window.speechSynthesis.getVoices());
            // Filter to only show Google voices as requested
            const googleVoices = allVoices.filter(v => v.name.includes('Google'));

            // If we have Google voices, use them; otherwise fall back to all voices (safety net)
            const finalVoices = googleVoices.length > 0 ? googleVoices : allVoices;

            setVoices(finalVoices);

            if (finalVoices.length > 0) {
                const savedVoiceURI = localStorage.getItem('preferredVoiceURI');
                if (savedVoiceURI) {
                    const found = finalVoices.find(v => v.voiceURI === savedVoiceURI);
                    if (found) setSelectedVoice(found);
                } else {
                    const defaultVoice = finalVoices.find(v => v.name.includes('Google US English')) || finalVoices[0];
                    setSelectedVoice(defaultVoice);
                }
            }
        };

        loadVoices();
        // Chrome needs this event to populate voices
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    const handleVoiceSelect = (voice: SpeechSynthesisVoice) => {
        setSelectedVoice(voice);
        localStorage.setItem('preferredVoiceURI', voice.voiceURI);
        setIsVoiceDropdownOpen(false);
    };

    const handleVoiceReset = () => {
        localStorage.removeItem('preferredVoiceURI');
        // Re-run logic to pick default
        const availVoices = window.speechSynthesis.getVoices();
        if (availVoices.length > 0) {
            const defaultVoice = availVoices.find(v => v.name.includes('Google US English'));
            if (defaultVoice) setSelectedVoice(defaultVoice);
            else setSelectedVoice(availVoices[0]);
        }
        setIsVoiceDropdownOpen(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <CreditLimitModal />
            {regenModalState && (
                <RegenerateModal
                    sectionName={regenModalState.name}
                    onClose={() => setRegenModalState(null)}
                    onRegenerate={handleRegenerateSection}
                />
            )}
            {isConfirmDeleteOpen && (
                <ConfirmationModal
                    isOpen={isConfirmDeleteOpen}
                    title={t('job_tracker.modal.delete_title')}
                    message={t('job_tracker.modal.delete_confirm')}
                    onConfirm={confirmDelete}
                    onCancel={() => setIsConfirmDeleteOpen(false)}
                    confirmText={t('job_tracker.modal.delete_btn')}
                />
            )}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[95vh] flex flex-col">
                <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0 relative">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                            <Briefcase size={22} className="text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{localJob.jobTitle}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{localJob.companyName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Voice Settings */}
                        <div className="relative">
                            <button
                                onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isVoiceDropdownOpen ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}
                                title="Voice Settings"
                            >
                                <Volume2 size={20} />
                            </button>
                            {isVoiceDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-2 max-h-80 overflow-y-auto flex flex-col gap-1">
                                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 px-2 mt-1">Select Voice</h4>

                                    <button
                                        onClick={handleVoiceReset}
                                        className="w-full text-left px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex items-center gap-2 mb-2 border-b border-gray-100 dark:border-gray-700 pb-2"
                                    >
                                        <RotateCcw size={12} /> Reset to Default
                                    </button>

                                    {voices.map(voice => (
                                        <button
                                            key={voice.voiceURI}
                                            onClick={() => handleVoiceSelect(voice)}
                                            className={`w-full text-left px-2 py-1.5 text-sm rounded-md truncate transition-colors flex justify-between items-center ${selectedVoice?.voiceURI === voice.voiceURI ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                                        >
                                            <span className="truncate flex-1">{voice.name}</span>
                                            <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{voice.lang}</span>
                                        </button>
                                    ))}
                                    {voices.length === 0 && (
                                        <div className="p-4 text-center">
                                            <p className="text-sm text-gray-500 mb-1">No voices found</p>
                                            <p className="text-xs text-gray-400">Your browser may not support voices without interaction.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-1 mr-2 border-r pr-2 border-gray-300 dark:border-gray-600">
                            <button onClick={() => handleFontSizeChange('decrease')} disabled={fontSize === 0} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Minus size={18} />
                            </button>
                            <button onClick={() => handleFontSizeChange('increase')} disabled={fontSize === 2} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Plus size={18} />
                            </button>
                        </div>
                        <button onClick={handleDelete} disabled={isDeleting} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                            {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X /></button>
                    </div>
                </header>
                <div className="flex-grow overflow-y-auto p-6 sm:p-8 bg-gray-100 dark:bg-gray-900">
                    <div className="p-6 mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                            <EditableField label={t('job_tracker.modal.job_title')} value={localJob.jobTitle} onChange={v => handleChange('jobTitle', v)} placeholder="e.g., Software Engineer" />
                            <EditableField label={t('job_tracker.modal.company')} value={localJob.companyName} onChange={v => handleChange('companyName', v)} placeholder="e.g., Google" />
                            <EditableField label={t('job_tracker.modal.location')} value={localJob.location || ''} onChange={v => handleChange('location', v)} placeholder="e.g., San Francisco, CA" />
                            <EditableField label={t('job_tracker.modal.salary_range')} value={localJob.salaryRange || ''} onChange={v => handleChange('salaryRange', v)} placeholder="e.g., $120k - $150k" />
                            <EditableSelect label={t('job_tracker.modal.status.label', { defaultValue: 'Status' })} value={localJob.applicationStatus} onChange={v => handleChange('applicationStatus', v as ApplicationStatus)} options={APPLICATION_STATUSES} />
                            <EditableSelect label={t('job_tracker.modal.work_model')} value={localJob.workModel || ''} onChange={v => handleChange('workModel', v as WorkModel)} options={WORK_MODELS} />
                            <EditableField label={t('job_tracker.modal.interview_stage')} value={localJob.interviewStage || ''} onChange={v => handleChange('interviewStage', v)} placeholder="e.g., Technical Screen" />
                            <EditableField label={t('job_tracker.modal.date_applied')} value={formatDateForInput(localJob.dateApplied)} onChange={handleDateChange} type="date" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <EditableField label={t('job_tracker.modal.job_post_url')} value={localJob.jobPostURL} onChange={v => handleChange('jobPostURL', v)} />
                            <EditableField label={t('job_tracker.modal.direct_app_url')} value={localJob.applicationURL || ''} onChange={v => handleChange('applicationURL', v)} />
                        </div>
                    </div>

                    {/* Resume Match Section */}
                    <div className="p-6 mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('job_tracker.modal.resume_match')}</h3>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-full sm:w-1/2">
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('job_tracker.modal.compare_resume')}</label>
                                <select
                                    value={selectedResumeId}
                                    onChange={e => setSelectedResumeId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700"
                                >
                                    {allResumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                </select>
                            </div>
                            <button
                                onClick={handleAnalyzeMatch}
                                disabled={isAnalyzing || !localJob.jobDescription}
                                className="w-full sm:w-auto mt-2 sm:mt-6 bg-indigo-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:bg-indigo-300"
                            >
                                {isAnalyzing ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                {isAnalyzing ? t('job_tracker.modal.analyzing') : t('job_tracker.modal.analyze_match')}
                            </button>
                        </div>
                        {analysisError && <p className="text-red-500 text-sm mt-2">{analysisError}</p>}

                        {analysis && (
                            <div className="mt-6 bg-blue-600/10 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-lg">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-grow">
                                        <div className="flex justify-between font-semibold">
                                            <span>{analysis.matchedKeywords.length} of {analysis.totalKeywords} keywords found</span>
                                            <span className="text-lg">{Math.round(analysis.matchPercentage)}% Match</span>
                                        </div>
                                        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5 mt-2">
                                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${analysis.matchPercentage}% ` }}></div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleOptimizeResume}
                                        className="flex-shrink-0 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {t('job_tracker.modal.optimize_resume')} <ArrowRight size={18} />
                                    </button>
                                </div>
                                <div className="mt-4 text-sm">
                                    <p className="font-semibold mb-2">{analysis.summary}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-bold text-green-700 dark:text-green-400 flex items-center gap-1"><CheckCircle size={16} /> {t('job_tracker.modal.matched_keywords')}</h4>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {analysis.matchedKeywords.map(k => <span key={k} className="bg-green-200/50 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs px-2 py-0.5 rounded-md">{k}</span>)}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-1"><XCircle size={16} /> {t('job_tracker.modal.missing_keywords')}</h4>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {analysis.missingKeywords.map(k => <span key={k} className="bg-yellow-200/50 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 text-xs px-2 py-0.5 rounded-md">{k}</span>)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>


                    {localJob.jobDescription && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-8">
                            <button
                                onClick={() => setShowDescription(!showDescription)}
                                className="w-full flex justify-between items-center"
                            >
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('job_tracker.modal.job_description')}</h3>
                                <ChevronDown className={`transition - transform duration - 200 ${showDescription ? 'rotate-180' : ''} `} />
                            </button>
                            {showDescription && (
                                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                                    {isEditingDescription ? (
                                        <textarea
                                            ref={descriptionTextareaRef}
                                            value={localJob.jobDescription || ''}
                                            onChange={(e) => {
                                                handleChange('jobDescription', e.target.value);
                                                e.target.style.height = 'auto';
                                                e.target.style.height = `${e.target.scrollHeight} px`;
                                            }}
                                            onBlur={() => setIsEditingDescription(false)}
                                            onKeyDown={(e) => e.key === 'Escape' && setIsEditingDescription(false)}
                                            className="w-full p-2 text-inherit leading-relaxed bg-white dark:bg-gray-700/50 rounded-md border-2 border-primary-500 focus:outline-none resize-none overflow-hidden"
                                        />
                                    ) : (
                                        <div
                                            onClick={() => setIsEditingDescription(true)}
                                            className="w-full min-h-[40px] p-2 rounded-md border border-transparent hover:bg-gray-200/50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer max-h-60 overflow-y-auto"
                                        >
                                            <p className="text-inherit text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{localJob.jobDescription}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="text-center mb-8">
                        <button
                            onClick={handleGenerateAllPrepNotes}
                            disabled={isGeneratingAll}
                            className={`bg - primary - 600 text - white font - semibold py - 2 px - 6 rounded - lg shadow - md hover: bg - primary - 700 transition - colors flex items - center justify - center gap - 2 disabled: bg - primary - 300 mx - auto ${shouldAnimateButton ? 'animate-gentle-pulse' : ''} `}
                        >
                            {isGeneratingAll ? <Loader2 className="animate-spin" /> : <Wand2 />}
                            {isGeneratingAll ? t('job_tracker.modal.generating') : t('job_tracker.modal.generate_prep')}
                        </button>
                    </div>

                    <div className={`space - y - 10 ${textSizeClass} transition - all duration - 300 ${isHighlighting ? 'animate-highlight p-4 -m-4 rounded-xl' : ''} `} ref={prepNotesContainerRef}>
                        <EditablePrepSection label={t('job_tracker.modal.prep_sections.role_research')} value={localJob.prep_RoleOverview || ''} onChange={v => handleChange('prep_RoleOverview', v)} placeholder={t('job_tracker.modal.prep_sections.role_research_ph')} onRegenerate={() => setRegenModalState({ section: 'prep_RoleOverview', name: t('job_tracker.modal.prep_sections.role_research') })} selectedVoice={selectedVoice} />
                        <EditablePrepSection label={t('job_tracker.modal.prep_sections.my_story')} value={localJob.prep_MyStory || ''} onChange={v => handleChange('prep_MyStory', v)} placeholder={t('job_tracker.modal.prep_sections.my_story_ph')} onRegenerate={() => setRegenModalState({ section: 'prep_MyStory', name: t('job_tracker.modal.prep_sections.my_story') })} selectedVoice={selectedVoice} />
                        <EditablePrepSection label={t('job_tracker.modal.prep_sections.interview_prep')} value={localJob.prep_InterviewPrep || ''} onChange={v => handleChange('prep_InterviewPrep', v)} placeholder={t('job_tracker.modal.prep_sections.interview_prep_ph')} onRegenerate={() => setRegenModalState({ section: 'prep_InterviewPrep', name: t('job_tracker.modal.prep_sections.interview_prep') })} selectedVoice={selectedVoice} />
                        <EditablePrepSection label={t('job_tracker.modal.prep_sections.questions_for_them')} value={localJob.prep_QuestionsForInterviewer || ''} onChange={v => handleChange('prep_QuestionsForInterviewer', v)} placeholder={t('job_tracker.modal.prep_sections.questions_for_them_ph')} onRegenerate={() => setRegenModalState({ section: 'prep_QuestionsForInterviewer', name: t('job_tracker.modal.prep_sections.questions_for_them') })} selectedVoice={selectedVoice} />
                        <EditablePrepSection label={t('job_tracker.modal.prep_sections.general_notes')} value={localJob.notes || ''} onChange={v => handleChange('notes', v)} placeholder={t('job_tracker.modal.prep_sections.general_notes_ph')} onRegenerate={() => setRegenModalState({ section: 'notes', name: t('job_tracker.modal.prep_sections.general_notes') })} selectedVoice={selectedVoice} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetailModal;