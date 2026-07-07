import React, { Suspense, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import {
    CheckCircle2,
    ClipboardList,
    Code2,
    Lightbulb,
    Loader2,
    Play,
    Send,
    Terminal,
    X,
    XCircle,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { analyzeCodingSubmission } from '../../services/geminiService';
import { InterviewAnalysis, QuestCodingArtifact } from '../../types';
import {
    CODING_LANGUAGES,
    CODING_LANGUAGE_LABELS,
    CodingBrief,
    CodingLanguage,
    CodingRunSummary,
    ExecutableCodingLanguage,
    getCodingFunctionName,
    getCodingStarterCode,
    isExecutableCodingLanguage,
} from '../../lib/codingChallenges';
import { useQuestCodeRunner } from '../../hooks/useQuestCodeRunner';
import type { RunnerResponse } from '../../workers/questCodeRunner.worker';

const InterviewReportModal = React.lazy(() => import('../InterviewReportModal'));

interface CodingBattleProps {
    userId: string;
    company: string;
    stageTitle: string;
    brief: CodingBrief;
    preferredLanguage: CodingLanguage;
    initialArtifact?: QuestCodingArtifact;
    /** Persist the analysis and return the saved record (with id + timestamp). */
    saveAnalysis: (analysis: Omit<InterviewAnalysis, 'id' | 'timestamp'>) => Promise<InterviewAnalysis>;
    onAnalysisComplete: (analysis: InterviewAnalysis) => void;
    onClose: () => void;
}

const JS_TIMEOUT_MS = 5_000;
/** First Python run downloads the Pyodide runtime, so the budget is generous. */
const PY_TIMEOUT_MS = 60_000;

const summarize = (response: RunnerResponse, hiddenIncluded: boolean): CodingRunSummary => {
    const results = response.results.filter((r) => hiddenIncluded || !r.hidden);
    return {
        passed: results.filter((r) => r.pass).length,
        total: results.length,
        results,
        durationMs: response.durationMs,
    };
};

const isCodingLanguage = (value: string | undefined): value is CodingLanguage =>
    !!value && (CODING_LANGUAGES as readonly string[]).includes(value);

const buildInitialCodeByLanguage = (
    brief: CodingBrief,
    artifact: QuestCodingArtifact | undefined,
): Record<CodingLanguage, string> => {
    const starter = Object.fromEntries(
        CODING_LANGUAGES.map((lang) => [lang, getCodingStarterCode(brief.challenge, lang)]),
    ) as Record<CodingLanguage, string>;
    if (!artifact || artifact.challengeId !== brief.challenge.id) {
        return starter;
    }

    return Object.fromEntries(
        CODING_LANGUAGES.map((lang) => [
            lang,
            artifact.codeByLanguage?.[lang] ?? (artifact.language === lang ? artifact.code : starter[lang]),
        ]),
    ) as Record<CodingLanguage, string>;
};

const CodingBattle: React.FC<CodingBattleProps> = ({
    userId,
    company,
    stageTitle,
    brief,
    preferredLanguage,
    initialArtifact,
    saveAnalysis,
    onAnalysisComplete,
    onClose,
}) => {
    const { resolvedTheme } = useTheme();
    const { run } = useQuestCodeRunner();
    const { challenge } = brief;
    const initialLanguage = initialArtifact?.challengeId === challenge.id && isCodingLanguage(initialArtifact.language)
        ? initialArtifact.language
        : preferredLanguage;

    const [language, setLanguage] = useState<CodingLanguage>(initialLanguage);
    const [codeByLanguage, setCodeByLanguage] = useState<Record<CodingLanguage, string>>(
        () => buildInitialCodeByLanguage(brief, initialArtifact),
    );
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [runSummary, setRunSummary] = useState<CodingRunSummary | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [reportEntry, setReportEntry] = useState<InterviewAnalysis | null>(null);

    const code = codeByLanguage[language];
    const canRunLocally = isExecutableCodingLanguage(language);
    const extensions = useMemo(
        () => (language === 'python' ? [python()] : language === 'javascript' ? [javascript()] : []),
        [language],
    );
    const visibleTests = useMemo(() => challenge.tests.filter((t) => !t.hidden), [challenge]);

    const executeTests = async (
        runLanguage: ExecutableCodingLanguage,
        includeHidden: boolean,
    ): Promise<CodingRunSummary> => {
        const response = await run({
            language: runLanguage,
            code,
            functionName: getCodingFunctionName(challenge, runLanguage),
            tests: includeHidden ? challenge.tests : visibleTests,
            timeoutMs: runLanguage === 'python' ? PY_TIMEOUT_MS : JS_TIMEOUT_MS,
        });
        setLogs(response.logs);
        if (!response.ok) throw new Error(response.error || 'Your code failed to run.');
        return summarize(response, includeHidden);
    };

    const handleRun = async () => {
        if (!canRunLocally) {
            setRunSummary(null);
            setLogs([]);
            setError(`${CODING_LANGUAGE_LABELS[language]} is AI-reviewed here. Local test execution is available for JavaScript and Python.`);
            return;
        }
        setIsRunning(true);
        setError('');
        try {
            setRunSummary(await executeTests(language, false));
        } catch (e) {
            setRunSummary(null);
            setError(e instanceof Error ? e.message : 'Failed to run your code.');
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmit = async () => {
        if (code.trim() === getCodingStarterCode(challenge, language).trim() || !code.trim()) {
            setError('Write your solution first — replace the starter code before submitting.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            const summary = canRunLocally
                ? await executeTests(language, true)
                : { passed: 0, total: 0, results: [], durationMs: 0 };
            setRunSummary(summary);

            const analysisData = await analyzeCodingSubmission(userId, {
                language,
                code,
                brief: brief.prompt,
                passed: summary.passed,
                total: summary.total,
                failures: summary.results
                    .filter((r) => !r.pass)
                    .slice(0, 5)
                    .map((r) => `input=${r.input} expected=${r.expected} received=${r.error ?? r.received}`),
            });

            const saved = await saveAnalysis({
                ...analysisData,
                transcript: [],
                questArtifact: {
                    type: 'coding',
                    challengeId: challenge.id,
                    language,
                    code,
                    codeByLanguage,
                },
            });
            setReportEntry(saved);
            onAnalysisComplete(saved);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to review your solution. Please try again.');
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
                            <Code2 size={18} />
                        </span>
                        <div className="min-w-0">
                            <h2 className="truncate text-base font-extrabold tracking-tight text-gray-900 dark:text-gray-100">{company} · {stageTitle}</h2>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {canRunLocally ? 'Write and run your solution, then submit for AI review' : 'Write your solution, then submit for AI code review'}
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <div className="flex max-w-[23rem] flex-wrap overflow-hidden rounded-lg border border-gray-200 text-xs font-bold dark:border-gray-700">
                            {CODING_LANGUAGES.map((lang) => (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => { setLanguage(lang); setRunSummary(null); setLogs([]); setError(''); }}
                                    className={`px-3 py-1.5 transition-colors ${language === lang
                                        ? 'bg-[#625bd5] text-white dark:bg-[#7069dc]'
                                        : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'}`}
                                >
                                    {CODING_LANGUAGE_LABELS[lang]}
                                    {lang === preferredLanguage && (
                                        <span className="ml-1 text-[9px] font-extrabold uppercase opacity-75">Rec</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={handleRun}
                            disabled={isRunning || isSubmitting || !canRunLocally}
                            title={canRunLocally ? undefined : 'Local test execution is available for JavaScript and Python.'}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 text-xs font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                            {isRunning ? 'Running…' : 'Run tests'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting || isRunning}
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

                {/* Body: brief + editor + results */}
                <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                    {/* Brief panel */}
                    <aside className="shrink-0 overflow-y-auto border-b border-[#ececf4] bg-[#fbfbfe] p-5 dark:border-gray-800 dark:bg-gray-900/60 lg:w-80 lg:border-b-0 lg:border-r xl:w-[360px]">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#625bd5] dark:text-[#9b96ef]">
                            <ClipboardList size={13} /> Coding brief
                        </div>
                        <p className="mt-2.5 text-base font-bold leading-snug text-gray-900 dark:text-gray-100">{challenge.title}</p>
                        <p className="mt-2 text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">{challenge.description}</p>
                        <p className="mt-5 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Requirements</p>
                        <ul className="mt-2 space-y-2.5">
                            {challenge.requirements.map((req, reqIndex) => (
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
                                <Lightbulb size={13} /> Example
                            </p>
                            <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                                {challenge.example}
                            </p>
                        </div>
                        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                            <CheckCircle2 size={13} className="text-[#15803d] dark:text-emerald-300" /> Submitting runs a hidden test suite — passing it clears this stage.
                        </p>
                    </aside>

                    {/* Editor + results */}
                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 overflow-auto">
                            <CodeMirror
                                value={code}
                                height="100%"
                                style={{ height: '100%' }}
                                theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                                extensions={extensions}
                                onChange={(value) => setCodeByLanguage((prev) => ({ ...prev, [language]: value }))}
                                basicSetup={{ lineNumbers: true, foldGutter: false, autocompletion: true }}
                            />
                        </div>

                        {/* Test results / console */}
                        <div className="h-52 shrink-0 overflow-y-auto border-t border-gray-200 bg-[#fbfbfe] p-4 dark:border-gray-800 dark:bg-gray-900/60">
                            <div className="flex items-center justify-between">
                                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                    <Terminal size={12} /> Test results
                                </p>
                                {runSummary && (
                                    <p className={`text-[11px] font-bold ${runSummary.passed === runSummary.total ? 'text-[#15803d] dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                                        {runSummary.passed}/{runSummary.total} passed · {runSummary.durationMs} ms
                                    </p>
                                )}
                            </div>
                            {!runSummary && !logs.length && (
                                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                    {canRunLocally
                                        ? 'Press “Run tests” to execute your solution against the sample cases. Python starts a one-time runtime download on first run.'
                                        : `${CODING_LANGUAGE_LABELS[language]} is reviewed by AI in this version. Switch to JavaScript or Python to run local sample tests.`}
                                </p>
                            )}
                            {runSummary && (
                                <ul className="mt-2 space-y-1">
                                    {runSummary.results.map((r, i) => (
                                        <li key={i} className="flex items-start gap-1.5 font-mono text-[11px] leading-relaxed">
                                            {r.pass
                                                ? <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[#15803d] dark:text-emerald-300" />
                                                : <XCircle size={13} className="mt-0.5 shrink-0 text-rose-500 dark:text-rose-300" />}
                                            <span className="min-w-0 break-all text-gray-600 dark:text-gray-300">
                                                {r.hidden ? '[hidden] ' : ''}f({r.input.slice(1, -1)}) → {r.error ? `⚠ ${r.error}` : r.received}
                                                {!r.pass && !r.error && <span className="text-gray-400 dark:text-gray-500"> · expected {r.expected}</span>}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {logs.length > 0 && (
                                <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-800">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Console</p>
                                    <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-[11px] text-gray-500 dark:text-gray-400">{logs.join('\n')}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodingBattle;
