import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, Wand2, FileText, Briefcase, Sparkles, Volume2, Minus, Plus, ExternalLink } from 'lucide-react';
import { JobApplicationData, ApplicationStatus, WorkModel, APPLICATION_STATUSES, WORK_MODELS } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { parseJobDescriptionFromText } from '../../services/geminiService';

interface AddJobModalProps {
    onClose: () => void;
    onJobAdded: (jobData: Omit<JobApplicationData, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
    initialJobDescription?: string;
    initialJobPostUrl?: string;
    autoSubmit?: boolean;
}

const AddJobModal: React.FC<AddJobModalProps> = ({ 
    onClose, 
    onJobAdded,
    initialJobDescription = '',
    initialJobPostUrl = '',
    autoSubmit = false
}) => {
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    
    // Core pasted text flow states
    const [description, setDescription] = useState(initialJobDescription);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);

    // Modal state machine mode: 'paste' | 'edit'
    const [mode, setMode] = useState<'paste' | 'edit'>('paste');

    // Premium Form states (hydrated from LLM parsing)
    const [jobTitle, setJobTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [location, setLocation] = useState('');
    const [salaryRange, setSalaryRange] = useState('');
    const [status, setStatus] = useState<ApplicationStatus>('To Apply');
    const [workModel, setWorkModel] = useState<WorkModel>('On-site');
    const [interviewStage, setInterviewStage] = useState('');
    const [dateApplied, setDateApplied] = useState('');
    const [jobPostURL, setJobPostURL] = useState(initialJobPostUrl);
    const [directApplicationURL, setDirectApplicationURL] = useState('');

    const handleAnalyzeText = async (textToAnalyze: string) => {
        if (!textToAnalyze.trim() || !currentUser) {
            setError(t('job_tracker.modal.error_empty'));
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Call our updated parse service, passing down the initial job post url context
            const parsedData = await parseJobDescriptionFromText(currentUser.uid, textToAnalyze, initialJobPostUrl);

            // Hydrate LLM extracted fields directly into the interactive form states
            setJobTitle(parsedData.jobTitle || 'Untitled Job');
            setCompanyName(parsedData.companyName || 'Unknown Company');
            setLocation(parsedData.location || '');
            setSalaryRange(parsedData.salaryRange || '');
            
            // Programmatically default the application date to the current system date (Standard JS execution)
            const today = new Date().toISOString().split('T')[0];
            setDateApplied(today);

            // Capture URLs - prioritize context metadata URL or fall back to LLM parsed jobPostURL
            setJobPostURL(initialJobPostUrl || parsedData.jobPostURL || '');
            setDirectApplicationURL(parsedData.directApplicationURL || '');
            
            // Default initial status/work model states if parsed or fallback
            setStatus('To Apply');
            setWorkModel('On-site');
            setInterviewStage('');

            // Transition directly into the interactive review form stage
            setMode('edit');
        } catch (err: any) {
            console.error("Error parsing description:", err);
            setError(err.message || t('job_tracker.modal.error_parsing'));
            
            // Fallback: Populate form with placeholder values so the user can still edit manually
            setJobTitle('Untitled Job (Manual)');
            setCompanyName('Unknown Company');
            setLocation('');
            setSalaryRange('');
            setDateApplied(new Date().toISOString().split('T')[0]);
            setJobPostURL(initialJobPostUrl);
            setDirectApplicationURL('');
            setStatus('To Apply');
            setWorkModel('On-site');
            setInterviewStage('');
            setMode('edit');
        } finally {
            setIsLoading(false);
        }
    };

    const handleParseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleAnalyzeText(description);
    };

    const handleSaveJob = (e: React.FormEvent) => {
        e.preventDefault();
        onJobAdded({
            jobTitle: jobTitle || 'Untitled Job',
            companyName: companyName || 'Unknown Company',
            location: location || '',
            salaryRange: salaryRange || '',
            applicationStatus: status,
            workModel: workModel,
            interviewStage: interviewStage || '',
            dateApplied: dateApplied ? new Date(dateApplied) : null,
            jobPostURL: jobPostURL || '',
            applicationURL: directApplicationURL || '', // Map directApplicationURL state to applicationURL schema property
            jobDescription: description,
        });
    };

    useEffect(() => {
        if (initialJobDescription) {
            setDescription(initialJobDescription);
        }
        if (initialJobPostUrl) {
            setJobPostURL(initialJobPostUrl);
        }
        if (autoSubmit && initialJobDescription && currentUser && !hasAutoSubmitted) {
            setHasAutoSubmitted(true);
            handleAnalyzeText(initialJobDescription);
        }
    }, [initialJobDescription, initialJobPostUrl, autoSubmit, currentUser, hasAutoSubmitted]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
            <div className={`bg-white dark:bg-[#1a1820] rounded-2xl shadow-2xl w-full ${mode === 'edit' ? 'max-w-4xl' : 'max-w-2xl'} overflow-hidden border border-gray-200 dark:border-[#2e2b38] transition-all duration-300`}>
                
                {/* 1. Paste Mode Layout */}
                {mode === 'paste' && (
                    <>
                        <header className="p-5 border-b border-gray-100 dark:border-[#2e2b38] flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <Sparkles size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {t('job_tracker.modal.track_new_title')}
                                </h2>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2c2937] text-gray-500 transition-colors">
                                <X size={18} />
                            </button>
                        </header>
                        
                        <form onSubmit={handleParseSubmit} className="p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
                                {t('job_tracker.modal.paste_desc')}
                            </p>
                            <div className="relative group">
                                <FileText className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t('job_tracker.modal.paste_placeholder')}
                                    required
                                    rows={12}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-[#2e2b38] bg-white dark:bg-[#201e27] text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all resize-none shadow-inner"
                                />
                            </div>
                            {error && (
                                <div className="p-3 bg-red-500/10 dark:bg-red-500/20 text-red-500 rounded-lg text-sm mt-3 font-medium">
                                    {error}
                                </div>
                            )}
                            <div className="mt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-indigo-400 disabled:scale-100"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                                    {isLoading ? t('job_tracker.modal.analyzing') : t('job_tracker.modal.analyze_btn')}
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {/* 2. Interactive Hydrated Edit Mode Layout */}
                {mode === 'edit' && (
                    <form onSubmit={handleSaveJob}>
                        {/* Premium Header conforming to Screenshot 2026-05-22 at 4.01.39 AM.png */}
                        <header className="p-6 border-b border-gray-100 dark:border-[#2e2b38] flex justify-between items-center bg-gray-50/50 dark:bg-[#201e27]/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm">
                                    <Briefcase size={26} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white truncate">
                                        {jobTitle || 'Untitled Job'}
                                    </h2>
                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                        {companyName || 'Unknown Company'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Decorative & Control elements mapping exactly to upper right frame in Screenshot */}
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                                <button type="button" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2c2937] rounded-full transition-colors">
                                    <Volume2 size={16} />
                                </button>
                                <button type="button" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2c2937] rounded-full transition-colors">
                                    <Minus size={16} />
                                </button>
                                <button type="button" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2c2937] rounded-full transition-colors">
                                    <Plus size={16} />
                                </button>
                                <span className="w-px h-6 bg-gray-200 dark:bg-[#2e2b38] mx-1 sm:mx-1.5"></span>
                                <button onClick={onClose} type="button" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </header>

                        {/* Interactive Hydration Form Card Grid */}
                        <div className="p-6 sm:p-8 bg-white dark:bg-[#1a1820]">
                            <div className="p-6 bg-gray-50 dark:bg-[#201e27] border border-gray-100 dark:border-[#2e2b38] rounded-2xl shadow-sm mb-6">
                                
                                {/* Grid Row 1: Core metadata */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                                    {/* Job Title */}
                                    <div className="relative">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                                            {t('job_tracker.modal.job_title')}
                                        </label>
                                        <input
                                            type="text"
                                            value={jobTitle}
                                            onChange={(e) => setJobTitle(e.target.value)}
                                            placeholder="e.g., Software Engineer"
                                            required
                                            className="w-full bg-transparent border-b border-gray-300 dark:border-[#2e2b38] py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium text-sm focus:ring-0"
                                        />
                                    </div>

                                    {/* Company Name */}
                                    <div className="relative">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                                            {t('job_tracker.modal.company')}
                                        </label>
                                        <input
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="e.g., Google"
                                            required
                                            className="w-full bg-transparent border-b border-gray-300 dark:border-[#2e2b38] py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium text-sm focus:ring-0"
                                        />
                                    </div>

                                    {/* Location */}
                                    <div className="relative">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                                            {t('job_tracker.modal.location')}
                                        </label>
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="e.g., San Francisco, CA"
                                            className="w-full bg-transparent border-b border-gray-300 dark:border-[#2e2b38] py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium text-sm focus:ring-0"
                                        />
                                    </div>

                                    {/* Salary Range */}
                                    <div className="relative">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                                            {t('job_tracker.modal.salary_range')}
                                        </label>
                                        <input
                                            type="text"
                                            value={salaryRange}
                                            onChange={(e) => setSalaryRange(e.target.value)}
                                            placeholder="e.g., $120k - $150k"
                                            className="w-full bg-transparent border-b border-gray-300 dark:border-[#2e2b38] py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium text-sm focus:ring-0"
                                        />
                                    </div>
                                </div>

                                {/* Grid Row 2: Status & Timeline details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                                    {/* Status selector */}
                                    <div className="relative">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                                            {t('job_tracker.modal.status.label', { defaultValue: 'Status' })}
                                        </label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                                            className="w-full bg-transparent border-b border-gray-300 dark:border-[#2e2b38] py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium text-sm dark:bg-[#201e27] cursor-pointer focus:ring-0"
                                        >
                                            {APPLICATION_STATUSES.map(opt => (
                                                <option key={opt} value={opt} className="dark:bg-[#201e27]">{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Work Model selector */}
                                    <div className="relative">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                                            {t('job_tracker.modal.work_model')}
                                        </label>
                                        <select
                                            value={workModel}
                                            onChange={(e) => setWorkModel(e.target.value as WorkModel)}
                                            className="w-full bg-transparent border-b border-gray-300 dark:border-[#2e2b38] py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium text-sm dark:bg-[#201e27] cursor-pointer focus:ring-0"
                                        >
                                            {WORK_MODELS.map(opt => (
                                                <option key={opt} value={opt} className="dark:bg-[#201e27]">{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Interview Stage */}
                                    <div className="relative">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                                            {t('job_tracker.modal.interview_stage')}
                                        </label>
                                        <input
                                            type="text"
                                            value={interviewStage}
                                            onChange={(e) => setInterviewStage(e.target.value)}
                                            placeholder="e.g., Technical Screen"
                                            className="w-full bg-transparent border-b border-gray-300 dark:border-[#2e2b38] py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium text-sm focus:ring-0"
                                        />
                                    </div>

                                    {/* Date Applied */}
                                    <div className="relative">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                                            {t('job_tracker.modal.date_applied')}
                                        </label>
                                        <input
                                            type="date"
                                            value={dateApplied}
                                            onChange={(e) => setDateApplied(e.target.value)}
                                            className="w-full bg-transparent border-b border-gray-300 dark:border-[#2e2b38] py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium text-sm cursor-pointer focus:ring-0"
                                        />
                                    </div>
                                </div>

                                {/* Grid Row 3: URLs */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Job Post URL */}
                                    <div className="relative">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                                {t('job_tracker.modal.job_post_url')}
                                            </label>
                                            {jobPostURL && (jobPostURL.startsWith('http://') || jobPostURL.startsWith('https://')) && (
                                                <a
                                                    href={jobPostURL}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
                                                >
                                                    <span>Open URL</span>
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>
                                        <input
                                            type="url"
                                            value={jobPostURL}
                                            onChange={(e) => setJobPostURL(e.target.value)}
                                            placeholder="https://openai.com/careers/..."
                                            className="w-full bg-transparent border-b border-gray-300 dark:border-[#2e2b38] py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium text-sm focus:ring-0"
                                        />
                                    </div>

                                    {/* Direct Application URL */}
                                    <div className="relative">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                                {t('job_tracker.modal.direct_app_url')}
                                            </label>
                                            {directApplicationURL && (directApplicationURL.startsWith('http://') || directApplicationURL.startsWith('https://')) && (
                                                <a
                                                    href={directApplicationURL}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
                                                >
                                                    <span>Open URL</span>
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>
                                        <input
                                            type="url"
                                            value={directApplicationURL}
                                            onChange={(e) => setDirectApplicationURL(e.target.value)}
                                            placeholder="https://jobs.ashbyhq.com/..."
                                            className="w-full bg-transparent border-b border-gray-300 dark:border-[#2e2b38] py-2 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors font-medium text-sm focus:ring-0"
                                        />
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Footer Controls */}
                        <footer className="p-6 border-t border-gray-100 dark:border-[#2e2b38] flex justify-between items-center bg-gray-50/30 dark:bg-[#1a1820]">
                            <button
                                type="button"
                                onClick={() => setMode('paste')}
                                className="text-xs font-semibold uppercase tracking-wider text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-[#201e27] px-3.5 py-2 rounded-xl transition-all"
                            >
                                ← Parse New Text
                            </button>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2c2937] font-semibold py-2 px-5 rounded-xl transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all text-sm flex items-center gap-2"
                                >
                                    <Sparkles size={16} />
                                    Save to Pipeline
                                </button>
                            </div>
                        </footer>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddJobModal;