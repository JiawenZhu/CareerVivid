import React from 'react';
import { CheckCircle, FileText, Loader2, Zap, Sparkles, AlertCircle } from 'lucide-react';

export interface AutoFillResult {
    platform: string;
    filledCount: number;
    skippedCount: number;
    errorCount: number;
    timestamp: string;
}

interface AutoFillCardProps {
    isApplicationPage: boolean;
    atsPlatform: string | null;
    hasProfile: boolean;
    selectedResumeId: string | null;
    resumes: any[];
    onSelectResume: (resumeId: string) => void;
    fillResult: AutoFillResult | null;
    isFilling: boolean;
    isGeneratingAI: boolean;
    prefetchReady: boolean;
    aiError: string | null;
    onAutofill: () => void;
    onSmartFill: () => void;
}

export const AutoFillCard: React.FC<AutoFillCardProps> = ({
    isApplicationPage,
    atsPlatform,
    hasProfile,
    selectedResumeId,
    resumes,
    onSelectResume,
    fillResult,
    isFilling,
    isGeneratingAI,
    prefetchReady,
    aiError,
    onAutofill,
    onSmartFill
}) => {
    if (!isApplicationPage) return null;

    return (
        <div className="rounded-[20px] overflow-hidden shadow-[0_10px_28px_rgba(79,70,229,0.10)] border border-indigo-100/80 bg-gradient-to-br from-indigo-50 via-white to-white">
            <div className="p-3.5">
                <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-indigo-700 text-[10px] font-bold uppercase tracking-wider border border-indigo-100 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        {atsPlatform || 'Application'} Detected
                    </span>
                </div>
                <h2 className="text-[15px] font-extrabold text-gray-950 mt-2">Autofill Application</h2>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Fill profile fields and generate stronger screening answers.</p>
                {hasProfile && (
                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                        <FileText size={12} className="text-indigo-500 flex-shrink-0" />
                        <span className="font-medium">Using:</span>
                        <select
                            value={selectedResumeId || resumes[0]?.id || ''}
                            onChange={(e) => onSelectResume(e.target.value)}
                            className="bg-transparent hover:bg-white/80 border border-gray-200 hover:border-indigo-300 text-gray-700 text-xs font-semibold rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 max-w-[170px] truncate shadow-sm transition-all cursor-pointer"
                        >
                            {resumes.map((resume) => (
                                <option key={resume.id} value={resume.id}>
                                    {resume.title || 'Untitled Resume'}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Fill Result Panel */}
                {fillResult && (
                    <div className="mt-3 p-2.5 bg-white rounded-xl border border-gray-100 space-y-1.5">
                        <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                            <CheckCircle size={14} />
                            Autofill Complete — {fillResult.platform}
                        </div>
                        <div className="flex gap-3 text-xs">
                            <span className="text-green-600 font-medium">✅ {fillResult.filledCount} filled</span>
                            {fillResult.skippedCount > 0 && (
                                <span className="text-amber-500 font-medium">⚠️ {fillResult.skippedCount} skipped</span>
                            )}
                            {fillResult.errorCount > 0 && (
                                <span className="text-red-500 font-medium">❌ {fillResult.errorCount} errors</span>
                            )}
                        </div>
                        {fillResult.skippedCount > 0 && (
                            <p className="text-[10px] text-gray-400">
                                Skipped fields may need manual input. Try <strong>Smart Fill</strong> for AI answers.
                            </p>
                        )}
                    </div>
                )}

                {/* Two fill buttons */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                        onClick={onAutofill}
                        disabled={isFilling || isGeneratingAI}
                        title="Fills standard fields (name, email, phone, education) instantly"
                        className="flex items-center justify-center gap-1.5 bg-gray-950 hover:bg-black disabled:opacity-60 text-white py-2.5 rounded-xl font-semibold shadow transition-all hover:scale-[1.02] active:scale-[0.98] text-xs"
                    >
                        {isFilling ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                        Auto Fill Profile
                    </button>
                    <button
                        onClick={onSmartFill}
                        disabled={isFilling || isGeneratingAI}
                        title={prefetchReady ? 'AI answers are pre-generated and ready!' : 'Uses AI to generate personalized answers for open-ended questions'}
                        className={`flex items-center justify-center gap-1.5 disabled:opacity-60 text-white py-2.5 rounded-xl font-semibold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] text-xs ${
                            prefetchReady
                                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                        }`}
                    >
                        {isGeneratingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {isGeneratingAI ? 'Thinking...' : prefetchReady ? 'Auto Fill AI' : 'Auto Fill AI'}
                    </button>
                </div>

                {/* AI Error */}
                {aiError && (
                    <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={12} /> {aiError}
                    </p>
                )}
            </div>
        </div>
    );
};
