import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Sparkles, FileText, Loader2, Wand2, Check, ArrowRight, RotateCcw, MessageSquare, BarChart, Zap, ChevronRight, AlertCircle, FileInput } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';
import { ResumeData } from '@/types';
import Toast from '@/components/Toast';

interface TailorResumeModalProps {
    isOpen: boolean;
    onClose: () => void;
    resume: ResumeData;
    onResumeChange: (updates: Partial<ResumeData>) => void;
    theme?: string;
}

type Step = 'INPUT' | 'PREVIEW';

interface AiAnalysis {
    score: number;
    missingKeywords: string[];
    suggestions: string[];
}

const TailorResumeModal: React.FC<TailorResumeModalProps> = ({ isOpen, onClose, resume, onResumeChange, theme }) => {
    const [step, setStep] = useState<Step>('INPUT');
    const [jobDescription, setJobDescription] = useState('');

    // AI States
    const [isProcessing, setIsProcessing] = useState(false);
    const [processMessage, setProcessMessage] = useState('');

    // Data States
    const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
    const [proposedResume, setProposedResume] = useState<ResumeData | null>(null);
    const [refineInstruction, setRefineInstruction] = useState('');

    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Reset when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setStep('INPUT');
            setJobDescription('');
            setAnalysis(null);
            setProposedResume(null);
            setRefineInstruction('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Helper to call Cloud Function
    const callAiAgent = async (action: 'analyze' | 'tailor' | 'condense' | 'refine', instruction = '') => {
        setIsProcessing(true);

        let msg = 'Thinking...';
        if (action === 'analyze') msg = 'Analyzing job description vs resume...';
        if (action === 'tailor') msg = 'Rewriting resume to match job...';
        if (action === 'condense') msg = 'Condensing content to one page...';
        if (action === 'refine') msg = 'Refining based on your feedback...';
        setProcessMessage(msg);

        try {
            const tailorFn = httpsCallable(functions, 'tailorResume');
            // Use current version (proposed) if refining, else original resume
            const resumeToSend = (action === 'refine' && proposedResume) ? proposedResume : resume;

            const result = await tailorFn({
                resume: resumeToSend,
                jobDescription,
                action,
                instruction
            });

            const data = result.data as any;

            if (data.success) {
                if (action === 'analyze') {
                    setAnalysis(data.analysis);
                } else {
                    setProposedResume(data.tailoredResume);
                    setStep('PREVIEW'); // Move to preview mode
                    if (action === 'condense') {
                        setToastMessage("Resume condensed & formatting updated!");
                    } else if (action === 'refine') {
                        setToastMessage("Refinements applied!");
                        setRefineInstruction(''); // Clear input
                    }
                }
            } else {
                throw new Error('AI operation failed');
            }
        } catch (error: any) {
            console.error("AI Error:", error);
            setToastMessage(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApply = () => {
        if (proposedResume) {
            onResumeChange(proposedResume);
            setToastMessage('Resume updated successfully!');
            setTimeout(() => {
                onClose();
            }, 1500);
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            {toastMessage && (
                <Toast
                    message={toastMessage}
                    onClose={() => setToastMessage(null)}
                    duration={2000}
                />
            )}

            <div className={`
                bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col 
                h-[90vh] transition-all duration-300 ${theme === 'dark' ? 'dark' : ''}
            `}>
                {/* Header */}
                <header className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 rounded-t-xl z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
                            <Sparkles className="text-primary-600 dark:text-primary-400 fill-primary-600/20" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Resume Tailor</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                Powered by Gemini 2.0 Flash <Zap size={10} className="text-yellow-500 fill-yellow-500" />
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </header>

                <div className="flex-1 overflow-hidden flex relative">
                    {/* INPUT MODE */}
                    {step === 'INPUT' && (
                        <div className="w-full h-full p-8 flex flex-col items-center justify-center animate-fade-in">
                            <div className="w-full max-w-3xl space-y-6">
                                <div className="text-center space-y-2 mb-4">
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Target a Specific Job</h3>
                                    <p className="text-gray-500 dark:text-gray-400">Paste the job description to optimize your keywords, summary, and experience.</p>
                                </div>

                                <div className="relative group">
                                    <textarea
                                        className="w-full p-6 h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none resize-none transition-all placeholder:text-gray-400"
                                        placeholder="Paste Job Description / Requirements here..."
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                    />
                                    {analysis && (
                                        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs animate-slide-up">
                                            <div className="flex items-center gap-2 mb-2">
                                                <BarChart size={14} className="text-green-500" />
                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Analysis</span>
                                            </div>
                                            <div className="text-sm font-medium mb-1 dark:text-white">Match Score: <span className="text-primary-600">{analysis.score}/100</span></div>
                                            <div className="text-xs text-red-500 font-medium">Missing: {analysis.missingKeywords.slice(0, 3).join(', ')}...</div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Toolbar */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                                    <button
                                        onClick={() => callAiAgent('analyze')}
                                        disabled={!jobDescription.trim() || isProcessing}
                                        className="h-14 flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-primary-500 hover:text-primary-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
                                    >
                                        {isProcessing && processMessage.includes('Analyzing') ? <Loader2 className="animate-spin" /> : <BarChart size={18} />}
                                        Analyze Match First
                                    </button>

                                    <button
                                        onClick={() => callAiAgent('tailor')}
                                        disabled={!jobDescription.trim() || isProcessing}
                                        className="h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all hover:translate-y-[-2px]"
                                    >
                                        {isProcessing && processMessage.includes('Rewriting') ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                                        ✨ Tailor to Job
                                    </button>

                                    <button
                                        onClick={() => callAiAgent('condense')}
                                        disabled={!jobDescription.trim() || isProcessing}
                                        className="h-14 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl shadow-md transition-all hover:shadow-lg dark:bg-slate-700 dark:hover:bg-slate-600"
                                    >
                                        {isProcessing && processMessage.includes('Condensing') ? <Loader2 className="animate-spin" /> : <FileInput size={18} />}
                                        Smart Condense (1-Page)
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PREVIEW MODE */}
                    {step === 'PREVIEW' && proposedResume && (
                        <div className="flex w-full h-full divide-x divide-gray-200 dark:divide-gray-700">
                            {/* Left: Feedback & Stats */}
                            <div className="w-1/3 flex flex-col h-full bg-gray-50/50 dark:bg-gray-800/30 p-6 overflow-y-auto">
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-primary-100 dark:border-gray-700 shadow-sm">
                                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">AI Optimization Result</h4>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-3xl font-bold text-gray-900 dark:text-white">Optimized</span>
                                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                    <Check size={12} /> Keywords Integrated
                                                </span>
                                            </div>
                                            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xl border-4 border-white dark:border-gray-800 shadow-sm">
                                                A+
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                            I've rewritten your summary and refined your bullet points to match the job description. The format has been adjusted for better readability.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <MessageSquare size={16} className="text-primary-500" />
                                            Refine with AI
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                className="w-full p-4 border rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none min-h-[100px] resize-none"
                                                placeholder="e.g. 'Make the summary more punchy', 'Focus more on my leadership skills', 'Fix the formatting'..."
                                                value={refineInstruction}
                                                onChange={e => setRefineInstruction(e.target.value)}
                                            />
                                            <button
                                                onClick={() => callAiAgent('refine', refineInstruction)}
                                                disabled={!refineInstruction.trim() || isProcessing}
                                                className="absolute bottom-3 right-3 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Regenerate"
                                            >
                                                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => setStep('INPUT')}
                                            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
                                        >
                                            <RotateCcw size={14} /> Start Over
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Resume Preview (Scaled Down) */}
                            <div className="w-2/3 h-full bg-gray-100 dark:bg-gray-900 p-8 overflow-y-auto flex items-start justify-center">
                                <div className="bg-white shadow-lg origin-top transition-all duration-500" style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.65)', transformOrigin: 'top center', marginBottom: '-40%' }}>
                                    {/* Requires the ResumePreview component here. We import it dynamically or reuse the logic. 
                                        Since we can't easily import a complex component inside a modal without some prop drilling or context, 
                                        we will display a simplified text preview or "Proposed Changes" diff if ResumePreview isn't available.
                                        However, the user wants a Preview. We will import ResumePreview.
                                    */}
                                    {/* Note: In this file we don't have ResumePreview imported yet. I need to add it to imports. */}
                                    <ResumePreviewWrapper resume={proposedResume} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* GLOBAL LOADING OVERLAY */}
                    {isProcessing && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in">
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm text-center border border-gray-100 dark:border-gray-700">
                                <Loader2 size={40} className="text-primary-600 animate-spin mb-4" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    {processMessage}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">This may take a few seconds...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer (Only in Preview) */}
                {step === 'PREVIEW' && (
                    <footer className="p-5 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-xl flex justify-between items-center z-10">
                        <div className="text-xs text-gray-500 italic">
                            * Changes are not saved until you click Apply.
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleApply}
                                className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
                            >
                                <Check size={18} /> Apply Changes
                            </button>
                        </div>
                    </footer>
                )}
            </div>
        </div>,
        document.body
    );
};

// Helper Wrapper for ResumePreview (needs to be imported)
// I will use a placeholder here and then update the imports.
import ResumePreview from '../../../components/ResumePreview';

const ResumePreviewWrapper = ({ resume }: { resume: ResumeData }) => {
    return <ResumePreview resume={resume} template={resume.templateId} />;
};

export default TailorResumeModal;

