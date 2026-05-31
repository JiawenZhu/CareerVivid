import React from 'react';
import { ChevronDown, ChevronRight, FileText, Lightbulb, Loader2, Sparkles } from 'lucide-react';
import { ResumeData } from '@/types';

interface AIPortfolioGenerateTabProps {
    resumes: ResumeData[];
    selectedResumeId: string;
    isDark: boolean;
    isProcessing: boolean;
    processMessage: string;
    errorMessage: string;
    sectionLabels: string[];
    onSelectResume: (resumeId: string) => void;
    onGenerate: () => void;
}

const AIPortfolioGenerateTab: React.FC<AIPortfolioGenerateTabProps> = ({
    resumes,
    selectedResumeId,
    isDark,
    isProcessing,
    processMessage,
    errorMessage,
    sectionLabels,
    onSelectResume,
    onGenerate,
}) => {
    const selectedResume = resumes.find((resume) => resume.id === selectedResumeId);

    return (
        <div className="w-full max-w-2xl mx-auto flex h-full min-h-0 flex-col">
            <div className="flex-shrink-0 pb-4 text-center">
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Generate Portfolio from Resume</h3>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Pick a resume — Gemini 2.5 Flash will populate your entire portfolio automatically.
                </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="flex flex-col gap-5 pb-5">
                    {resumes.length === 0 ? (
                        <div className={`flex flex-col items-center justify-center gap-3 py-12 rounded-2xl border-2 border-dashed ${isDark ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                            <FileText size={40} className="opacity-30" />
                            <p className="text-sm font-medium">No resumes found</p>
                            <p className="text-xs">Create a resume first, then come back here.</p>
                        </div>
                    ) : (
                        <div>
                            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Select Resume</label>
                            <div className="relative">
                                <select value={selectedResumeId} onChange={(e) => onSelectResume(e.target.value)}
                                    className={`w-full px-4 py-3 pr-10 text-sm rounded-xl border-2 appearance-none cursor-pointer focus:outline-none focus:border-indigo-500 transition-all ${isDark ? 'bg-white/5 border-white/10 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                                    <option value="">— Choose a resume —</option>
                                    {resumes.map((resume) => (
                                        <option key={resume.id} value={resume.id}>
                                            {resume.title || 'Untitled Resume'}{resume.personalDetails?.firstName ? ` (${resume.personalDetails.firstName} ${resume.personalDetails.lastName || ''})`.trim() : ''}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                            </div>
                            <p className={`mt-2 text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {resumes.length} resume{resumes.length === 1 ? '' : 's'} available
                            </p>
                        </div>
                    )}

                    {selectedResume && (
                        <div className={`rounded-xl border p-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                                    {(selectedResume.personalDetails?.firstName || selectedResume.title || 'R')[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className={`truncate font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedResume.title || 'Untitled Resume'}</p>
                                    <p className={`truncate text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedResume.personalDetails?.jobTitle || 'Resume'}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedResume.employmentHistory?.slice(0, 3).map((employment) => (
                                    <span key={employment.id} className={`max-w-full truncate text-xs px-2 py-1 rounded-full ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                        {employment.jobTitle} @ {employment.employer}
                                    </span>
                                ))}
                                {selectedResume.skills && <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>{selectedResume.skills.length} skills</span>}
                            </div>
                        </div>
                    )}

                    <div className={`rounded-xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-emerald-50 border-emerald-100'}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-emerald-700'}`}>✨ What gets populated</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {sectionLabels.map((label) => <span key={label} className={`text-xs ${isDark ? 'text-gray-400' : 'text-emerald-700'}`}>{label}</span>)}
                        </div>
                    </div>

                    {errorMessage && <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">{errorMessage}</div>}
                    <div className={`flex items-start gap-2 text-xs rounded-xl px-4 py-3 ${isDark ? 'bg-white/5 text-gray-400' : 'bg-indigo-50 text-indigo-600'}`}>
                        <Lightbulb size={14} className="mt-0.5 shrink-0" />
                        <span>Your existing portfolio theme and template are preserved. Only content sections are regenerated from the resume.</span>
                    </div>
                </div>
            </div>

            <div className={`flex-shrink-0 border-t pt-4 ${isDark ? 'border-white/10 bg-[#0f1117]' : 'border-gray-100 bg-white'}`}>
                <button onClick={onGenerate} disabled={!selectedResumeId || isProcessing}
                    className={`w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg ${(!selectedResumeId || isProcessing) ? 'bg-indigo-300 cursor-not-allowed text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 hover:-translate-y-0.5'}`}>
                    {isProcessing ? <><Loader2 size={18} className="animate-spin" /> {processMessage}</> : <><Sparkles size={18} /> Generate Portfolio <ChevronRight size={16} /></>}
                </button>
            </div>
        </div>
    );
};

export default AIPortfolioGenerateTab;
