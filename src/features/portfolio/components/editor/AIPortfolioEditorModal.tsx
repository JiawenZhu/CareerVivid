import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Sparkles, Loader2, Check, RotateCcw, Wand2, Zap, MessageSquare, ChevronRight, Lightbulb, FileText, ChevronDown, Code2, Copy, Trash2 } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';
import { PortfolioData } from '../../types/portfolio';
import PortfolioPreview from './PortfolioPreview';
import { ResumeData } from '@/types';

interface AIPortfolioEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    portfolioData: PortfolioData;
    onApply: (patch: Partial<PortfolioData>) => void;
    editorTheme?: 'light' | 'dark';
    resumes?: ResumeData[];
}

type Step = 'INPUT' | 'PREVIEW';
type ActiveTab = 'edit' | 'generate' | 'style';

const QUICK_PROMPTS = [
    { label: 'Rewrite About', icon: '✍️', prompt: 'Rewrite my About section to sound more confident, senior, and impactful. Keep it under 80 words.' },
    { label: 'Punch up Hero', icon: '⚡', prompt: 'Make my hero headline and subheadline more punchy, memorable, and keyword-rich for recruiters.' },
    { label: 'Add a Project', icon: '🚀', prompt: 'Add a placeholder project called "New Project" with a description, URL, and tech stack I can fill in.' },
    { label: 'Add a Skill', icon: '🛠️', prompt: 'Add React, TypeScript, and Node.js to my tech stack if they are not already there.' },
    { label: 'Clean Timeline', icon: '🗓️', prompt: 'Tighten the descriptions in my work experience — make each bullet point shorter, stronger, and result-focused.' },
    { label: 'Remove Oldest Job', icon: '🗑️', prompt: 'Remove the oldest entry from my work experience timeline.' },
];

const QUICK_STYLE_PROMPTS = [
    { icon: '🎨', label: 'Gradient Headings', prompt: 'Make all section headings a purple-to-indigo gradient text' },
    { icon: '✨', label: 'Fade-in Sections', prompt: 'Add a subtle fade-in animation to each section as it enters the viewport' },
    { icon: '📐', label: 'Left Accent Border', prompt: 'Add a thin colored left border accent to each section heading' },
    { icon: '🔵', label: 'Rounded Buttons', prompt: 'Make all buttons and CTA elements fully rounded pill shapes' },
    { icon: '🌗', label: 'Card Shadows', prompt: 'Add soft drop shadows to all card and project elements' },
    { icon: '🔤', label: 'Tighter Typography', prompt: 'Reduce letter-spacing on headings to -0.5px for a premium editorial look' },
    { icon: '💫', label: 'Hover Effects', prompt: 'Add smooth hover scale effects to all project cards and links' },
    { icon: '🗑️', label: 'Reset Styles', prompt: 'Remove all custom CSS and return to the default template styling' },
];

const SECTION_LABELS: Record<string, string> = {
    hero: '🎯 Hero',
    about: '👤 About',
    timeline: '🗓️ Experience',
    education: '🎓 Education',
    techStack: '🛠️ Tech Stack',
    projects: '🚀 Projects',
    socialLinks: '🔗 Social Links',
    contactEmail: '📧 Contact',
    sectionLabels: '🏷️ Labels',
};

const AIPortfolioEditorModal: React.FC<AIPortfolioEditorModalProps> = ({
    isOpen,
    onClose,
    portfolioData,
    onApply,
    editorTheme = 'light',
    resumes = [],
}) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('edit');
    const [step, setStep] = useState<Step>('INPUT');
    const [instruction, setInstruction] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processMessage, setProcessMessage] = useState('');
    const [patch, setPatch] = useState<Partial<PortfolioData> | null>(null);
    const [summary, setSummary] = useState('');
    const [changedSections, setChangedSections] = useState<string[]>([]);
    const [previewData, setPreviewData] = useState<PortfolioData | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Generate-from-resume state
    const [selectedResumeId, setSelectedResumeId] = useState<string>('');

    // AI Style state
    const [styleInstruction, setStyleInstruction] = useState('');
    const [generatedCss, setGeneratedCss] = useState<string | null>(null);
    const [aiStyleSummary, setAiStyleSummary] = useState('');
    const [isStyleApplied, setIsStyleApplied] = useState(false);

    const currentCss = portfolioData?.theme?.customCss || '';

    useEffect(() => {
        if (!isOpen) {
            setActiveTab('edit');
            setStep('INPUT');
            setInstruction('');
            setPatch(null);
            setSummary('');
            setChangedSections([]);
            setPreviewData(null);
            setErrorMessage('');
            setSelectedResumeId('');
            setStyleInstruction('');
            setGeneratedCss(null);
            setAiStyleSummary('');
            setIsStyleApplied(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // ── Edit Portfolio ─────────────────────────────────────────────────────────
    const handleSend = async () => {
        if (!instruction.trim()) return;
        setIsProcessing(true);
        setErrorMessage('');
        setProcessMessage('Reading your portfolio and thinking...');
        try {
            const editFn = httpsCallable(functions, 'editPortfolio');
            const result = await editFn({ portfolioData, instruction, action: 'edit' });
            const data = result.data as {
                success: boolean;
                patch: Partial<PortfolioData>;
                summary: string;
                changedSections: string[];
            };
            if (data.success && data.patch) {
                setPatch(data.patch);
                setSummary(data.summary);
                setChangedSections(data.changedSections || []);
                setPreviewData({ ...portfolioData, ...data.patch });
                setStep('PREVIEW');
            } else {
                throw new Error('No changes were returned.');
            }
        } catch (error: any) {
            setErrorMessage(error.message || 'An error occurred. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // ── Generate from Resume ────────────────────────────────────────────────────
    const handleGenerateFromResume = async () => {
        const resume = resumes.find((r) => r.id === selectedResumeId);
        if (!resume) return;
        setIsProcessing(true);
        setErrorMessage('');
        setProcessMessage('Reading your resume and generating portfolio...');
        try {
            const editFn = httpsCallable(functions, 'editPortfolio');
            const result = await editFn({ portfolioData, action: 'generate_from_resume', resumeData: resume });
            const data = result.data as {
                success: boolean;
                patch: Partial<PortfolioData>;
                summary: string;
                changedSections: string[];
            };
            if (data.success && data.patch) {
                setPatch(data.patch);
                setSummary(data.summary);
                setChangedSections(data.changedSections || []);
                setPreviewData({ ...portfolioData, ...data.patch });
                setStep('PREVIEW');
            } else {
                throw new Error('No content was generated.');
            }
        } catch (error: any) {
            setErrorMessage(error.message || 'An error occurred. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // ── AI Style / CSS ──────────────────────────────────────────────────────────
    const handleGenerateCss = async () => {
        if (!styleInstruction.trim()) return;
        setIsProcessing(true);
        setErrorMessage('');
        setIsStyleApplied(false);
        setProcessMessage('Generating portfolio styles…');
        try {
            const generateFn = httpsCallable(functions, 'generateResumeCSS');
            const result = await generateFn({
                instruction: styleInstruction,
                templateId: portfolioData.templateId,
                currentCss,
                themeColor: portfolioData.theme?.primaryColor,
            });
            const data = result.data as { success: boolean; css: string; summary: string };
            if (data.success) {
                setGeneratedCss(data.css);
                setAiStyleSummary(data.summary);
            }
        } catch (error: any) {
            setErrorMessage(error.message || 'Style generation failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApplyStyle = (mode: 'replace' | 'append') => {
        const newCss = mode === 'append' && currentCss
            ? `${currentCss}\n\n/* AI Generated */\n${generatedCss}`
            : (generatedCss || '');
        onApply({ theme: { ...portfolioData.theme, customCss: newCss } });
        setIsStyleApplied(true);
    };

    const handleResetCss = () => {
        onApply({ theme: { ...portfolioData.theme, customCss: '' } });
        setGeneratedCss(null);
        setAiStyleSummary('');
        setIsStyleApplied(false);
    };

    // ── Apply edit/generate patch ───────────────────────────────────────────────
    const handleApply = () => {
        if (patch) { onApply(patch); onClose(); }
    };

    const isDark = editorTheme === 'dark';

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className={`
                relative w-full max-w-5xl flex flex-col rounded-2xl shadow-2xl
                h-[90vh] overflow-hidden transition-all duration-300
                ${isDark ? 'bg-[#0f1117] text-gray-200 border border-white/10' : 'bg-white text-gray-900'}
            `}>
                {/* ── Header ── */}
                <header className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/10 bg-[#0f1117]' : 'border-gray-100 bg-white'}`}>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-xl">
                            <Sparkles className="text-indigo-600 dark:text-indigo-400 fill-indigo-600/20" size={22} />
                        </div>
                        <div>
                            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Portfolio Editor</h2>
                            <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Powered by Gemini 2.5 Flash <Zap size={10} className="text-yellow-400 fill-yellow-400" />
                            </p>
                        </div>

                        {/* Tab Switcher — INPUT step only */}
                        {step === 'INPUT' && (
                            <div className={`ml-4 flex rounded-xl p-1 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                {([
                                    { id: 'edit', label: '✏️ Edit', title: 'Edit Portfolio' },
                                    { id: 'generate', label: '📄 From Resume', title: 'Generate from Resume' },
                                    { id: 'style', label: '🎨 AI Style', title: 'CSS & Animation' },
                                ] as { id: ActiveTab; label: string; title: string }[]).map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setActiveTab(tab.id); setErrorMessage(''); }}
                                        title={tab.title}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                            activeTab === tab.id
                                                ? isDark ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 shadow-sm'
                                                : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                        <X size={20} />
                    </button>
                </header>

                {/* ── Body ── */}
                <div className="flex-1 overflow-hidden flex relative">

                    {/* ── STEP 1: INPUT ── */}
                    {step === 'INPUT' && (
                        <div className={`w-full h-full flex flex-col p-6 md:p-8 ${isDark ? 'bg-[#0f1117]' : 'bg-white'}`}>

                            {/* ════════ TAB: EDIT PORTFOLIO ════════ */}
                            {activeTab === 'edit' && (
                                <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 h-full">
                                    <div className="text-center">
                                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>What would you like to change?</h3>
                                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Describe any update in plain English — insert, rewrite, or remove anything.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {QUICK_PROMPTS.map((qp) => (
                                            <button key={qp.label} onClick={() => setInstruction(qp.prompt)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:border-indigo-500 hover:text-indigo-400' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                                                <span>{qp.icon}</span> {qp.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative flex-1 flex flex-col">
                                        <textarea
                                            className={`w-full flex-1 p-5 text-sm leading-relaxed rounded-xl resize-none border-2 border-dashed focus:outline-none focus:border-indigo-500 transition-all placeholder:opacity-50 ${isDark ? 'bg-white/5 border-white/10 text-gray-100' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                                            placeholder={`e.g. "Add a new project called CareerVivid AI — a full-stack job platform with 1,000+ users, React, Firebase, Gemini AI"\n\ne.g. "Rewrite my About section to emphasize my leadership in AI products"\n\ne.g. "Add TypeScript and Next.js to my tech stack"`}
                                            value={instruction}
                                            onChange={(e) => setInstruction(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(); }}
                                            style={{ minHeight: '180px' }}
                                        />
                                        <div className={`absolute bottom-3 right-3 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>⌘↵ to send</div>
                                    </div>
                                    {errorMessage && <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">{errorMessage}</div>}
                                    <div className={`flex items-start gap-2 text-xs rounded-xl px-4 py-3 ${isDark ? 'bg-white/5 text-gray-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <Lightbulb size={14} className="mt-0.5 shrink-0" />
                                        <span>The AI reads your entire portfolio before making changes — be as specific as possible for best results.</span>
                                    </div>
                                    <button onClick={handleSend} disabled={!instruction.trim() || isProcessing}
                                        className={`w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg ${(!instruction.trim() || isProcessing) ? 'bg-indigo-300 cursor-not-allowed text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 hover:-translate-y-0.5'}`}>
                                        {isProcessing ? <><Loader2 size={18} className="animate-spin" /> {processMessage}</> : <><Wand2 size={18} /> Apply with AI <ChevronRight size={16} /></>}
                                    </button>
                                </div>
                            )}

                            {/* ════════ TAB: GENERATE FROM RESUME ════════ */}
                            {activeTab === 'generate' && (
                                <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 h-full">
                                    <div className="text-center">
                                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Generate Portfolio from Resume</h3>
                                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Pick a resume — Gemini 2.5 Flash will populate your entire portfolio automatically.
                                        </p>
                                    </div>
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
                                                <select value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)}
                                                    className={`w-full px-4 py-3 pr-10 text-sm rounded-xl border-2 appearance-none cursor-pointer focus:outline-none focus:border-indigo-500 transition-all ${isDark ? 'bg-white/5 border-white/10 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                                                    <option value="">— Choose a resume —</option>
                                                    {resumes.map((r) => (
                                                        <option key={r.id} value={r.id}>
                                                            {r.title || 'Untitled Resume'}{r.personalDetails?.firstName ? ` (${r.personalDetails.firstName} ${r.personalDetails.lastName || ''})`.trim() : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                                            </div>
                                        </div>
                                    )}
                                    {selectedResumeId && (() => {
                                        const r = resumes.find((x) => x.id === selectedResumeId);
                                        if (!r) return null;
                                        return (
                                            <div className={`rounded-xl border p-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                                                        {(r.personalDetails?.firstName || r.title || 'R')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{r.title || 'Untitled Resume'}</p>
                                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{r.personalDetails?.jobTitle || 'Resume'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {r.employmentHistory?.slice(0, 3).map((e) => (
                                                        <span key={e.id} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                                            {e.jobTitle} @ {e.employer}
                                                        </span>
                                                    ))}
                                                    {r.skills && <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>{r.skills.length} skills</span>}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    <div className={`rounded-xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-emerald-50 border-emerald-100'}`}>
                                        <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-emerald-700'}`}>✨ What gets populated</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {Object.values(SECTION_LABELS).map((label) => (
                                                <span key={label} className={`text-xs ${isDark ? 'text-gray-400' : 'text-emerald-700'}`}>{label}</span>
                                            ))}
                                        </div>
                                    </div>
                                    {errorMessage && <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">{errorMessage}</div>}
                                    <div className={`flex items-start gap-2 text-xs rounded-xl px-4 py-3 ${isDark ? 'bg-white/5 text-gray-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <Lightbulb size={14} className="mt-0.5 shrink-0" />
                                        <span>Your existing portfolio theme and template are preserved. Only content sections are regenerated from the resume.</span>
                                    </div>
                                    <button onClick={handleGenerateFromResume} disabled={!selectedResumeId || isProcessing}
                                        className={`w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg ${(!selectedResumeId || isProcessing) ? 'bg-indigo-300 cursor-not-allowed text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 hover:-translate-y-0.5'}`}>
                                        {isProcessing ? <><Loader2 size={18} className="animate-spin" /> {processMessage}</> : <><Sparkles size={18} /> Generate Portfolio <ChevronRight size={16} /></>}
                                    </button>
                                </div>
                            )}

                            {/* ════════ TAB: AI STYLE / CSS ════════ */}
                            {activeTab === 'style' && (
                                <div className="w-full max-w-2xl mx-auto flex flex-col gap-5 h-full overflow-y-auto">
                                    <div className="text-center">
                                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>AI Style & Animation</h3>
                                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Describe a visual change — Gemini generates scoped CSS for your portfolio.
                                        </p>
                                    </div>

                                    {/* Quick Style Chips */}
                                    <div>
                                        <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Quick Styles</p>
                                        <div className="flex flex-wrap gap-2">
                                            {QUICK_STYLE_PROMPTS.map((q) => (
                                                <button key={q.label} onClick={() => setStyleInstruction(q.prompt)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:scale-105 ${isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:border-indigo-500 hover:text-indigo-400' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                                                    <span>{q.icon}</span> {q.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Instruction */}
                                    <div className="relative">
                                        <textarea
                                            className={`w-full p-4 pr-10 text-sm rounded-xl border-2 border-dashed resize-none focus:outline-none focus:border-indigo-500 transition-all ${isDark ? 'bg-white/5 border-white/10 text-gray-100' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                                            rows={3}
                                            placeholder={'e.g. "Add a fade-in animation to each section"\ne.g. "Make section headings an indigo gradient"\ne.g. "Add hover scale effects to project cards"'}
                                            value={styleInstruction}
                                            onChange={(e) => setStyleInstruction(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerateCss(); }}
                                        />
                                        <span className={`absolute bottom-3 right-3 text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>⌘↵</span>
                                    </div>

                                    {/* Generate Button */}
                                    <button onClick={handleGenerateCss} disabled={!styleInstruction.trim() || isProcessing}
                                        className={`w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${(!styleInstruction.trim() || isProcessing) ? 'bg-violet-300 cursor-not-allowed text-white' : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/30 hover:-translate-y-0.5'}`}>
                                        {isProcessing ? <><Loader2 size={16} className="animate-spin" /> {processMessage}</> : <><Code2 size={16} /> Generate CSS <ChevronRight size={14} /></>}
                                    </button>

                                    {/* Error */}
                                    {errorMessage && <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">{errorMessage}</div>}

                                    {/* Generated CSS Output */}
                                    {generatedCss !== null && (
                                        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                            <div className={`flex items-center justify-between px-4 py-2.5 ${isDark ? 'bg-white/5' : 'bg-gray-50'} border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                                <div className="flex items-center gap-2">
                                                    {isStyleApplied ? <Check size={14} className="text-green-500" /> : <Sparkles size={14} className="text-violet-500" />}
                                                    <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        {isStyleApplied ? '✅ Applied!' : (aiStyleSummary || 'Generated CSS')}
                                                    </span>
                                                </div>
                                                <button onClick={() => navigator.clipboard.writeText(generatedCss || '')}
                                                    className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`} title="Copy">
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                            <pre className={`text-xs p-4 overflow-x-auto font-mono leading-relaxed max-h-44 overflow-y-auto ${isDark ? 'bg-[#0a0c12] text-emerald-400' : 'bg-gray-900 text-emerald-400'}`}>
                                                {generatedCss || '/* No CSS — custom styles removed */'}
                                            </pre>
                                            {!isStyleApplied && (
                                                <div className={`flex gap-2 p-3 ${isDark ? 'bg-white/5' : 'bg-gray-50'} border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                                    <button onClick={() => handleApplyStyle('replace')}
                                                        className="flex-1 h-9 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                                                        <Check size={14} /> Replace & Apply
                                                    </button>
                                                    {currentCss && (
                                                        <button onClick={() => handleApplyStyle('append')}
                                                            className={`flex-1 h-9 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 border transition-colors ${isDark ? 'border-white/20 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                                                            <Code2 size={14} /> Append
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Active CSS Status */}
                                    {currentCss && (
                                        <div className={`rounded-xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-amber-50 border-amber-100'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-amber-700'}`}>
                                                    ⚡ Active Custom CSS ({currentCss.length} chars)
                                                </span>
                                                <button onClick={handleResetCss} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors">
                                                    <Trash2 size={12} /> Remove All
                                                </button>
                                            </div>
                                            <pre className={`text-[10px] font-mono opacity-60 truncate ${isDark ? 'text-gray-400' : 'text-amber-800'}`}>
                                                {currentCss.slice(0, 120)}{currentCss.length > 120 ? '…' : ''}
                                            </pre>
                                        </div>
                                    )}

                                    <div className={`flex items-start gap-2 text-xs rounded-xl px-4 py-3 ${isDark ? 'bg-white/5 text-gray-400' : 'bg-violet-50 text-violet-700'}`}>
                                        <Lightbulb size={13} className="mt-0.5 shrink-0" />
                                        <span>CSS is scoped to your portfolio canvas only. Animations are CSS-only and work on all devices. Changes save with your portfolio.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 2: PREVIEW (edit/generate tabs only) ── */}
                    {step === 'PREVIEW' && previewData && (
                        <div className="flex w-full h-full divide-x divide-gray-200 dark:divide-white/10">
                            {/* Left: Summary Panel */}
                            <div className={`w-80 flex-shrink-0 flex flex-col h-full overflow-y-auto ${isDark ? 'bg-[#0a0c12]' : 'bg-gray-50'}`}>
                                <div className="p-5 space-y-5">
                                    <div className={`rounded-xl border p-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                                <Check size={16} />
                                            </div>
                                            <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {activeTab === 'generate' ? 'Portfolio Generated' : 'AI Applied Changes'}
                                            </p>
                                        </div>
                                        <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{summary}</p>
                                    </div>

                                    {changedSections.length > 0 && (
                                        <div>
                                            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {activeTab === 'generate' ? 'Sections Generated' : 'Sections Modified'}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {changedSections.map((s) => (
                                                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium">
                                                        {SECTION_LABELS[s] || s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'edit' && (
                                        <div>
                                            <p className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                <MessageSquare size={12} /> Try Again
                                            </p>
                                            <div className="relative">
                                                <textarea
                                                    className={`w-full p-3 pr-10 text-sm rounded-xl resize-none border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-white/5 border-white/10 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}
                                                    placeholder="Not quite right? Tell me more…"
                                                    value={instruction}
                                                    onChange={(e) => setInstruction(e.target.value)}
                                                    rows={3}
                                                />
                                                <button onClick={handleSend} disabled={!instruction.trim() || isProcessing}
                                                    className="absolute bottom-2 right-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors" title="Re-run">
                                                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <button onClick={() => setStep('INPUT')}
                                        className={`flex items-center gap-1.5 text-sm transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                                        <RotateCcw size={13} /> Start Over
                                    </button>
                                </div>
                            </div>

                            {/* Right: Live Portfolio Preview */}
                            <div className={`flex-1 h-full overflow-y-auto ${isDark ? 'bg-[#0f1117]' : 'bg-gray-100'} flex items-start justify-center p-6`}>
                                <div className="bg-white shadow-xl rounded-xl overflow-hidden origin-top" style={{ width: '800px', transform: 'scale(0.72)', transformOrigin: 'top center', marginBottom: '-25%' }}>
                                    <PortfolioPreview
                                        portfolioData={previewData}
                                        activeDevice="desktop"
                                        viewMode="preview"
                                        isMobile={false}
                                        onFocusField={() => {}}
                                        onUpdate={() => {}}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Global Loading Overlay ── */}
                    {isProcessing && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                            <div className={`p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-xs text-center border ${isDark ? 'bg-[#0f1117] border-white/10' : 'bg-white border-gray-100'}`}>
                                <div className="relative mb-4">
                                    <Loader2 size={44} className="text-indigo-600 animate-spin" />
                                    <Sparkles size={18} className="text-indigo-400 absolute -top-1 -right-1 animate-pulse" />
                                </div>
                                <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{processMessage}</h3>
                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Gemini 2.5 Flash is working its magic…</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer (Preview Step Only) ── */}
                {step === 'PREVIEW' && (
                    <footer className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-t ${isDark ? 'border-white/10 bg-[#0a0c12]' : 'border-gray-100 bg-white'}`}>
                        <p className={`text-xs italic ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>* Changes are not saved until you click Apply.</p>
                        <div className="flex gap-3">
                            <button onClick={onClose} className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-colors ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}>
                                Discard
                            </button>
                            <button onClick={handleApply} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center gap-2">
                                <Check size={16} /> Apply Changes
                            </button>
                        </div>
                    </footer>
                )}
            </div>
        </div>,
        document.body
    );
};

export default AIPortfolioEditorModal;
