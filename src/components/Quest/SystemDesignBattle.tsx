import React, { Suspense, useRef, useState } from 'react';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { ClipboardList, Loader2, Send, Swords, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { analyzeSystemDesignDiagram } from '../../services/geminiService';
import { InterviewAnalysis } from '../../types';
import { SystemDesignBrief } from '../../lib/companyQuests';

const InterviewReportModal = React.lazy(() => import('../InterviewReportModal'));

interface SystemDesignBattleProps {
    userId: string;
    company: string;
    stageTitle: string;
    brief: SystemDesignBrief;
    /** Persist the analysis and return the saved record (with id + timestamp). */
    saveAnalysis: (analysis: Omit<InterviewAnalysis, 'id' | 'timestamp'>) => Promise<InterviewAnalysis>;
    onAnalysisComplete: (analysis: InterviewAnalysis) => void;
    onClose: () => void;
}

const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

const SystemDesignBattle: React.FC<SystemDesignBattleProps> = ({
    userId,
    company,
    stageTitle,
    brief,
    saveAnalysis,
    onAnalysisComplete,
    onClose,
}) => {
    const { resolvedTheme } = useTheme();
    const excalidrawAPIRef = useRef<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [reportEntry, setReportEntry] = useState<InterviewAnalysis | null>(null);

    const handleSubmit = async () => {
        const api = excalidrawAPIRef.current;
        if (!api) return;

        const elements = api.getSceneElements().filter((el: any) => !el.isDeleted);
        if (elements.length < 2) {
            setError('Draw your design first — add a few components and connections before submitting.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            const blob = await exportToBlob({
                elements,
                appState: { ...api.getAppState(), exportWithDarkMode: false, exportBackground: true },
                files: api.getFiles(),
                mimeType: 'image/png',
                quality: 0.92,
            });
            const dataUrl = await blobToDataUrl(blob);

            const analysisData = await analyzeSystemDesignDiagram(userId, dataUrl, brief.prompt);

            const saved = await saveAnalysis({ ...analysisData, transcript: [] });
            setReportEntry(saved);
            onAnalysisComplete(saved);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to review your design. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (reportEntry) {
        const historyEntry = {
            id: reportEntry.id,
            job: {
                id: reportEntry.id,
                title: `${company} quest — ${stageTitle}`,
                company,
                location: '',
                description: brief.prompt,
                url: '',
            },
            questions: [],
            timestamp: reportEntry.timestamp,
            interviewHistory: [reportEntry],
        };
        return (
            <Suspense fallback={<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" size={28} /></div>}>
                <InterviewReportModal jobHistoryEntry={historyEntry} onClose={onClose} />
            </Suspense>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#171411]/70 p-2 backdrop-blur-sm sm:p-4">
            <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
                {/* Header */}
                <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                            <Swords size={16} />
                        </span>
                        <div className="min-w-0">
                            <h2 className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">{company} · {stageTitle}</h2>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">Draw your architecture, then submit for AI review</p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            {isSubmitting ? 'Reviewing…' : 'Submit for review'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="shrink-0 border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                        {error}
                    </div>
                )}

                {/* Body: brief + canvas */}
                <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                    {/* Brief panel */}
                    <aside className="shrink-0 overflow-y-auto border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60 lg:w-72 lg:border-b-0 lg:border-r">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                            <ClipboardList size={13} /> Design brief
                        </div>
                        <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">{brief.challenge}</p>
                        <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Requirements</p>
                        <ul className="mt-1.5 space-y-1.5">
                            {brief.requirements.map((req) => (
                                <li key={req} className="flex gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                                    {req}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 rounded-lg bg-white p-2.5 text-[11px] leading-relaxed text-gray-500 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700">
                            Tip: label your boxes (clients, services, databases, caches, queues) and draw arrows for data flow. The AI grades clarity, coverage, and scalability.
                        </p>
                    </aside>

                    {/* Excalidraw canvas */}
                    <div className="relative min-h-[380px] flex-1">
                        <Excalidraw
                            excalidrawAPI={(api: any) => { excalidrawAPIRef.current = api; }}
                            theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                            initialData={{ appState: { viewBackgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff' } }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemDesignBattle;
