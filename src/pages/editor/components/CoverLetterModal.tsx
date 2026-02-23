import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Sparkles, Copy, Loader2, Check, FileText, Wand2 } from 'lucide-react';

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';
import { ResumeData } from '@/types';

interface CoverLetterModalProps {
    isOpen: boolean;
    onClose: () => void;
    resume: ResumeData;
    theme?: string;
}

const CoverLetterModal: React.FC<CoverLetterModalProps> = ({ isOpen, onClose, resume, theme }) => {
    const [jobDescription, setJobDescription] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!jobDescription.trim()) return;

        setIsLoading(true);
        setError(null);
        setGeneratedContent('');

        try {
            const generateFn = httpsCallable(functions, 'generateCoverLetter');
            const result = await generateFn({
                resumeId: resume.id,
                jobDescription: jobDescription
            });

            const data = result.data as any;
            if (data.success && data.coverLetter) {
                setGeneratedContent(data.coverLetter.content);
            } else {
                throw new Error('Failed to generate cover letter');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] ${theme === 'dark' ? 'dark' : ''}`}>

                {/* Header */}
                <header className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 rounded-t-lg">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {generatedContent ? 'Your Cover Letter' : 'AI Cover Letter Generator'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                    >
                        <X size={20} />
                    </button>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!generatedContent ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Paste the complete job description below. Our AI will analyze your resume and match it with the job requirements to write a tailored cover letter.
                            </p>

                            <div className="relative">
                                <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                                <textarea
                                    className="w-full pl-10 pr-4 py-3 h-64 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white resize-none"
                                    placeholder="Paste full job description here..."
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    required
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 mt-2">
                                    {error}
                                </p>
                            )}

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={handleGenerate}
                                    disabled={!jobDescription.trim() || isLoading}
                                    className="bg-primary-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:bg-primary-300 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 size={20} />
                                            Generate Cover Letter
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 h-full flex flex-col">
                            <textarea
                                className="flex-1 w-full min-h-[400px] p-6 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 leading-relaxed focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-serif"
                                value={generatedContent}
                                onChange={(e) => setGeneratedContent(e.target.value)}
                            />

                            <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => setGeneratedContent('')}
                                    className="text-sm text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 font-medium px-2"
                                >
                                    Start Over
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={handleCopy}
                                        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-2"
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CoverLetterModal;
