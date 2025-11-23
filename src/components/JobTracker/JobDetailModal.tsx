
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { JobApplicationData, ApplicationStatus, WorkModel, APPLICATION_STATUSES, WORK_MODELS, ResumeData, ResumeMatchAnalysis } from '../../types';
import { X, Briefcase, Building, MapPin, Link as LinkIcon, ExternalLink, Trash2, Loader2, Wand2, ChevronDown, Plus, Minus, FileText, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useResumes } from '../../hooks/useResumes';
import { generateJobPrepNotes, regenerateJobPrepSection, analyzeResumeMatch } from '../../services/geminiService';
import ConfirmationModal from '../ConfirmationModal';
import { navigate } from '../../App';

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
}> = ({ label, value, onChange, placeholder, onRegenerate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    useLayoutEffect(() => {
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

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{label}</h3>
                <button onClick={onRegenerate} title="Regenerate with AI" className="text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 p-1">
                    <Wand2 size={18} />
                </button>
            </div>
            
            <div 
                className="cursor-pointer group"
                onClick={() => !isEditing && setIsEditing(true)}
            >
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={currentValue || ''}
                        onChange={handleTextareaInput}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="w-full p-3 text-inherit leading-relaxed bg-white dark:bg-gray-700/50 rounded-md border-2 border-primary-500 focus:outline-none resize-none overflow-hidden"
                    />
                ) : (
                    <div className="w-full min-h-[40px] p-2 rounded-md border border-transparent group-hover:bg-gray-200/50 dark:group-hover:bg-gray-700/30 transition-colors">
                        {value ? (
                            <MarkdownRenderer text={value} />
                        ) : (
                             <p className="text-gray-400 italic">{placeholder}</p>
                        )}
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
                <h3 className="text-lg font-bold mb-4">Regenerate {sectionName}</h3>
                <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder={`e.g., "Focus on behavioral questions" or "Generate technical questions about Python"`}
                    className="w-full p-2 border rounded-md mb-4 bg-white dark:bg-gray-700 dark:border-gray-600"
                    rows={3}
                />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Cancel</button>
                    <button onClick={handleGenerate} disabled={isLoading} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-300 flex items-center gap-2">
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                        {isLoading ? 'Regenerating...' : 'Regenerate'}
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
    const { resumes } = useResumes();
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
    
    useLayoutEffect(() => {
        if (isEditingDescription && descriptionTextareaRef.current) {
            descriptionTextareaRef.current.style.height = 'auto';
            descriptionTextareaRef.current.style.height = `${descriptionTextareaRef.current.scrollHeight}px`;
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
        let context = `Name: ${latestResume.personalDetails.firstName} ${latestResume.personalDetails.lastName}\n`;
        context += `Job Title: ${latestResume.personalDetails.jobTitle}\n\nSUMMARY:\n${latestResume.professionalSummary}\n\n`;
        if (latestResume.employmentHistory.length > 0) {
            context += `EXPERIENCE:\n`;
            latestResume.employmentHistory.forEach(job => {
                context += `- ${job.jobTitle} at ${job.employer}\n${job.description}\n`;
            });
        }
        if (latestResume.skills.length > 0) {
            context += `\nSKILLS: ${latestResume.skills.map(s => s.name).join(', ')}\n`;
        }
        return context;
    };

    const handleGenerateAllPrepNotes = async () => {
        if (!currentUser) return;
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
        let text = `Title: ${resume.personalDetails.jobTitle}\n\n`;
        text += `Summary: ${resume.professionalSummary}\n\n`;
        text += `Skills: ${resume.skills.map(s => s.name).join(', ')}\n\n`;
        text += 'Experience:\n';
        resume.employmentHistory.forEach(job => {
            text += `- ${job.jobTitle} at ${job.employer}\n${job.description}\n`;
        });
        text += '\nEducation:\n';
        resume.education.forEach(edu => {
            text += `- ${edu.degree} from ${edu.school}\n`;
        });
        return text;
    };

    const handleAnalyzeMatch = async () => {
        if (!currentUser || !selectedResumeId || !localJob.jobDescription) {
            setAnalysisError('A resume must be selected and the job must have a description.');
            return;
        }

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
        } catch (error) {
            setAnalysisError(error instanceof Error ? error.message : 'An unknown error occurred during analysis.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleOptimizeResume = () => {
        sessionStorage.setItem('jobDescriptionForOptimization', job.jobDescription || '');
        sessionStorage.setItem('jobTitleForOptimization', job.jobTitle || '');
        navigate(`/edit/${selectedResumeId}`);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
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
                    title="Delete Tracked Job"
                    message="Are you sure you want to delete this tracked job? This action cannot be undone."
                    onConfirm={confirmDelete}
                    onCancel={() => setIsConfirmDeleteOpen(false)}
                    confirmText="Delete"
                />
            )}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[95vh] flex flex-col">
                <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
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
                        <div className="flex items-center gap-1 mr-2 border-r pr-2 border-gray-300 dark:border-gray-600">
                            <button onClick={() => handleFontSizeChange('decrease')} disabled={fontSize === 0} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Minus size={18} />
                            </button>
                            <button onClick={() => handleFontSizeChange('increase')} disabled={fontSize === 2} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Plus size={18} />
                            </button>
                        </div>
                        <button onClick={handleDelete} disabled={isDeleting} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                            {isDeleting ? <Loader2 className="animate-spin"/> : <Trash2 />}
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X/></button>
                    </div>
                </header>
                <div className="flex-grow overflow-y-auto p-6 sm:p-8 bg-gray-100 dark:bg-gray-900">
                    <div className="p-6 mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                            <EditableField label="Job Title" value={localJob.jobTitle} onChange={v => handleChange('jobTitle', v)} placeholder="e.g., Software Engineer"/>
                            <EditableField label="Company" value={localJob.companyName} onChange={v => handleChange('companyName', v)} placeholder="e.g., Google"/>
                            <EditableField label="Location" value={localJob.location || ''} onChange={v => handleChange('location', v)} placeholder="e.g., San Francisco, CA"/>
                            <EditableField label="Salary Range" value={localJob.salaryRange || ''} onChange={v => handleChange('salaryRange', v)} placeholder="e.g., $120k - $150k"/>
                            <EditableSelect label="Status" value={localJob.applicationStatus} onChange={v => handleChange('applicationStatus', v as ApplicationStatus)} options={APPLICATION_STATUSES} />
                            <EditableSelect label="Work Model" value={localJob.workModel || ''} onChange={v => handleChange('workModel', v as WorkModel)} options={WORK_MODELS} />
                            <EditableField label="Interview Stage" value={localJob.interviewStage || ''} onChange={v => handleChange('interviewStage', v)} placeholder="e.g., Technical Screen"/>
                            <EditableField label="Date Applied" value={formatDateForInput(localJob.dateApplied)} onChange={handleDateChange} type="date"/>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <EditableField label="Job Post URL" value={localJob.jobPostURL} onChange={v => handleChange('jobPostURL', v)} />
                             <EditableField label="Direct Application URL" value={localJob.applicationURL || ''} onChange={v => handleChange('applicationURL', v)} />
                        </div>
                    </div>
                    
                    {/* Resume Match Section */}
                    <div className="p-6 mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Resume Match</h3>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                             <div className="w-full sm:w-1/2">
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Compare with resume:</label>
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
                                {isAnalyzing ? 'Analyzing...' : 'Analyze Match'}
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
                                            <div className="bg-blue-500 h-2.5 rounded-full" style={{width: `${analysis.matchPercentage}%`}}></div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleOptimizeResume}
                                        className="flex-shrink-0 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        Optimize this Resume <ArrowRight size={18} />
                                    </button>
                                </div>
                                <div className="mt-4 text-sm">
                                    <p className="font-semibold mb-2">{analysis.summary}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-bold text-green-700 dark:text-green-400 flex items-center gap-1"><CheckCircle size={16} /> Matched Keywords</h4>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {analysis.matchedKeywords.map(k => <span key={k} className="bg-green-200/50 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs px-2 py-0.5 rounded-md">{k}</span>)}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-1"><XCircle size={16} /> Missing Keywords</h4>
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
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Job Description</h3>
                                <ChevronDown className={`transition-transform duration-200 ${showDescription ? 'rotate-180' : ''}`} />
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
                                                e.target.style.height = `${e.target.scrollHeight}px`;
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
                            className={`bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:bg-primary-300 mx-auto ${shouldAnimateButton ? 'animate-gentle-pulse' : ''}`}
                        >
                            {isGeneratingAll ? <Loader2 className="animate-spin"/> : <Wand2 />}
                            {isGeneratingAll ? 'Generating...' : 'Generate All Prep Notes with AI'}
                        </button>
                    </div>

                    <div className={`space-y-10 ${textSizeClass} transition-all duration-300 ${isHighlighting ? 'animate-highlight p-4 -m-4 rounded-xl' : ''}`} ref={prepNotesContainerRef}>
                       <EditablePrepSection label="Company & Role Research" value={localJob.prep_RoleOverview || ''} onChange={v => handleChange('prep_RoleOverview', v)} placeholder="Click to edit, or use AI to generate notes on the company, role, and responsibilities..." onRegenerate={() => setRegenModalState({ section: 'prep_RoleOverview', name: 'Company & Role Research' })} />
                        <EditablePrepSection label="My Story & Pitch" value={localJob.prep_MyStory || ''} onChange={v => handleChange('prep_MyStory', v)} placeholder="Click to edit, or use AI to craft a compelling story about how your skills align with this job..." onRegenerate={() => setRegenModalState({ section: 'prep_MyStory', name: 'My Story & Pitch' })} />
                        <EditablePrepSection label="Interview Prep Q&A" value={localJob.prep_InterviewPrep || ''} onChange={v => handleChange('prep_InterviewPrep', v)} placeholder="Click to edit, or use AI to generate practice questions and STAR method answers..." onRegenerate={() => setRegenModalState({ section: 'prep_InterviewPrep', name: 'Interview Prep Q&A' })} />
                        <EditablePrepSection label="Questions for Them" value={localJob.prep_QuestionsForInterviewer || ''} onChange={v => handleChange('prep_QuestionsForInterviewer', v)} placeholder="Click to edit, or use AI to generate insightful questions to ask your interviewers..." onRegenerate={() => setRegenModalState({ section: 'prep_QuestionsForInterviewer', name: 'Questions for Them' })} />
                        <EditablePrepSection label="General Notes" value={localJob.notes || ''} onChange={v => handleChange('notes', v)} placeholder="Click to add any other notes, like recruiter names, follow-up dates, etc..." onRegenerate={() => setRegenModalState({ section: 'notes', name: 'General Notes' })} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetailModal;
