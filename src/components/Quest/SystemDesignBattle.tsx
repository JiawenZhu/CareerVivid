import React, { Suspense, useMemo, useRef, useState } from 'react';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { CheckCircle2, ClipboardList, Lightbulb, Loader2, Send, Swords, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { analyzeSystemDesignDiagram } from '../../services/geminiService';
import { InterviewAnalysis, QuestSystemDesignArtifact } from '../../types';
import { SystemDesignBrief } from '../../lib/companyQuests';

const InterviewReportModal = React.lazy(() => import('../InterviewReportModal'));

interface SystemDesignBattleProps {
    userId: string;
    company: string;
    stageTitle: string;
    brief: SystemDesignBrief;
    initialArtifact?: QuestSystemDesignArtifact;
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

const toSerializableScene = <T,>(value: T): T =>
    value == null ? value : JSON.parse(JSON.stringify(value));

const parseSceneJson = <T,>(value: string | undefined, fallback: T): T => {
    if (!value) return fallback;
    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
};

const getArtifactElements = (artifact: QuestSystemDesignArtifact | undefined): any[] => {
    if (!artifact) return [];
    if (artifact.elementsJson) return parseSceneJson<any[]>(artifact.elementsJson, []);
    return artifact.elements ?? [];
};

const getArtifactFiles = (artifact: QuestSystemDesignArtifact | undefined): Record<string, any> | undefined => {
    if (!artifact) return undefined;
    if (artifact.filesJson) return parseSceneJson<Record<string, any>>(artifact.filesJson, {});
    return artifact.files;
};

const SystemDesignBattle: React.FC<SystemDesignBattleProps> = ({
    userId,
    company,
    stageTitle,
    brief,
    initialArtifact,
    saveAnalysis,
    onAnalysisComplete,
    onClose,
}) => {
    const { resolvedTheme } = useTheme();
    const excalidrawAPIRef = useRef<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [reportEntry, setReportEntry] = useState<InterviewAnalysis | null>(null);
    const matchingInitialArtifact = initialArtifact?.type === 'system_design' && initialArtifact.challengeId === brief.challengeId
        ? initialArtifact
        : undefined;
    const initialData = useMemo(() => ({
        elements: getArtifactElements(matchingInitialArtifact),
        appState: { viewBackgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff' },
        files: getArtifactFiles(matchingInitialArtifact),
    }), [matchingInitialArtifact, resolvedTheme]);

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

            const files = api.getFiles();
            const serializedElements = toSerializableScene(elements);
            const serializedFiles = toSerializableScene(files) ?? {};
            const analysisData = await analyzeSystemDesignDiagram(userId, dataUrl, brief.prompt);

            const questArtifact: QuestSystemDesignArtifact = {
                type: 'system_design',
                challengeId: brief.challengeId,
                elementsJson: JSON.stringify(serializedElements),
                ...(Object.keys(serializedFiles).length ? { filesJson: JSON.stringify(serializedFiles) } : {}),
            };

            const saved = await saveAnalysis({
                ...analysisData,
                transcript: [],
                questArtifact,
            });
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
        <div className="fixed inset-0 z-50 flex flex-col bg-[#171411]/70 p-1.5 backdrop-blur-sm sm:p-3">
            <div className="mx-auto flex h-full w-full max-w-[1800px] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_24px_70px_rgba(17,24,39,0.24)] dark:border-gray-700 dark:bg-gray-900">
                {/* Header */}
                <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-5 py-3.5 dark:border-gray-800">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#625bd5] text-white shadow-[0_4px_12px_rgba(98,91,213,0.25)] dark:bg-[#7069dc]">
                            <Swords size={18} />
                        </span>
                        <div className="min-w-0">
                            <h2 className="truncate text-base font-extrabold tracking-tight text-gray-900 dark:text-gray-100">{company} · {stageTitle}</h2>
                            <p className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">Draw your architecture, then submit for AI review</p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-transparent bg-[#625bd5] px-3.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#514ac5] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#7069dc] dark:hover:bg-[#8d88e6]"
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
                    <aside className="shrink-0 overflow-y-auto border-b border-[#ececf4] bg-[#fbfbfe] p-5 dark:border-gray-800 dark:bg-gray-900/60 lg:w-80 lg:border-b-0 lg:border-r xl:w-[360px]">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#625bd5] dark:text-[#9b96ef]">
                            <ClipboardList size={13} /> Design brief
                        </div>
                        <p className="mt-2.5 text-base font-bold leading-snug text-gray-900 dark:text-gray-100">{brief.challenge}</p>
                        <p className="mt-5 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Requirements</p>
                        <ul className="mt-2 space-y-2.5">
                            {brief.requirements.map((req, reqIndex) => (
                                <li key={req} className="flex gap-2.5 text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#f3f2ff] text-[11px] font-extrabold text-[#625bd5] ring-1 ring-[#dfe2ff] dark:bg-[#312d6b]/50 dark:text-[#b8b4ff] dark:ring-[#625bd5]/40">
                                        {reqIndex + 1}
                                    </span>
                                    {req}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#a97935] dark:text-amber-300">
                                <Lightbulb size={13} /> Drawing tip
                            </p>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                                Label your boxes (clients, services, databases, caches, queues) and draw arrows for data flow. The AI grades clarity, coverage, and scalability.
                            </p>
                        </div>
                        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                            <CheckCircle2 size={13} className="text-[#15803d] dark:text-emerald-300" /> Pass this stage by covering the core requirements.
                        </p>
                    </aside>

                    {/* Excalidraw canvas */}
                    <div className="relative min-h-[480px] flex-1 bg-white">
                        <Excalidraw
                            excalidrawAPI={(api: any) => { excalidrawAPIRef.current = api; }}
                            theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                            initialData={initialData}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemDesignBattle;
