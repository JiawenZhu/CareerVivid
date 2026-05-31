import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowRight, BarChart3, Bot, Briefcase, FileText, HelpCircle, MessageSquare, Mic, Send, Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generalChat } from '../services/geminiService';
import { useResumes } from '../hooks/useResumes';
import { useJobTracker } from '../hooks/useJobTracker';
import { usePracticeHistory } from '../hooks/useJobHistory';
import { useAuth } from '../contexts/AuthContext';
import { FREE_PLAN_CREDIT_LIMIT, PRO_PLAN_CREDIT_LIMIT } from '../config/creditCosts';
import { JobApplicationData, PracticeHistoryEntry, ResumeData } from '../types';
import { navigate } from '../utils/navigation';

type ChatAction = {
    label: string;
    path: string;
    tone?: 'primary' | 'secondary';
};

type ChatMessage = {
    role: 'user' | 'model';
    parts: { text: string }[];
    actions?: ChatAction[];
};

const FAQs = [
    { question: "How credit works?", answer: `Free users get ${FREE_PLAN_CREDIT_LIMIT} credits/month. Pro Month gets ${PRO_PLAN_CREDIT_LIMIT} credits! 1 credit = 1 AI response. Chat is free!` },
    { question: "How to export PDF?", answer: "Go to your Resume Dashboard, click 'Download' on any resume card." },
    { question: "Can I customize the design?", answer: "Yes! Use the 'Design' tab in the editor to change fonts, colors, and layouts." },
    { question: "How to upgrade?", answer: "Go to Profile -> Payment & Subscription -> Click on Manage Payment & Subscription button." }
];

const WORKSPACE_PROMPTS = [
    { label: 'Open my latest resume', value: 'Open my latest resume', icon: FileText },
    { label: 'Summarize applications', value: 'How many jobs have I applied to?', icon: BarChart3 },
    { label: 'Find a saved job', value: 'Where can I find my OpenAI job?', icon: Briefcase },
    { label: 'Interview next step', value: 'What mock interview should I work on next?', icon: Mic },
];

const STOP_WORDS = new Set([
    'a', 'an', 'and', 'any', 'applied', 'application', 'can', 'did', 'do', 'find', 'for', 'have', 'how',
    'i', 'in', 'job', 'jobs', 'me', 'my', 'of', 'on', 'open', 'resume', 'show', 'specific', 'the',
    'to', 'track', 'where', 'with',
]);

const formatDate = (value: any): string => {
    if (!value) return 'Not set';
    const date = value.toDate?.() || (typeof value === 'number' ? new Date(value) : new Date(value.seconds ? value.seconds * 1000 : value));
    return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const toTime = (value: any): number => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (value.toDate) return value.toDate().getTime();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
};

const getTokens = (text: string): string[] => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 2 && !STOP_WORDS.has(token));
};

const scoreTextMatch = (query: string, values: Array<string | undefined>): number => {
    const tokens = getTokens(query);
    if (!tokens.length) return 0;
    const haystack = values.join(' ').toLowerCase();
    return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
};

const summarizeJob = (job: JobApplicationData): string => {
    const matchScores = Object.values(job.matchAnalyses || {});
    const bestMatch = matchScores.length
        ? `${Math.max(...matchScores.map(score => score.matchPercentage || 0))}% match`
        : null;
    return [
        `${job.jobTitle || 'Untitled Job'} at ${job.companyName || 'Unknown company'}`,
        `Status: ${job.applicationStatus || 'To Apply'}`,
        `Applied: ${formatDate(job.dateApplied)}`,
        job.location ? `Location: ${job.location}` : null,
        job.interviewStage ? `Stage: ${job.interviewStage}` : null,
        job.nextAction ? `Next: ${job.nextAction}` : null,
        bestMatch,
    ].filter(Boolean).join(' | ');
};

const buildResumeResponse = (input: string, resumes: ResumeData[]): ChatMessage | null => {
    if (!resumes.length) {
        return {
            role: 'model',
            parts: [{ text: 'I do not see a resume in this workspace yet. Start a resume first, then I can route you directly to it from chat.' }],
            actions: [{ label: 'Create resume', path: '/newresume', tone: 'primary' }],
        };
    }

    const ranked = [...resumes]
        .map(resume => ({
            resume,
            score: scoreTextMatch(input, [
                resume.title,
                resume.personalDetails?.jobTitle,
                resume.personalDetails?.firstName,
                resume.personalDetails?.lastName,
            ]),
            updatedAt: toTime(resume.updatedAt),
        }))
        .sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt);

    const selected = ranked[0].resume;
    const otherResumes = ranked.slice(1, 4).map(item => item.resume.title).filter(Boolean);
    const title = selected.title || `${selected.personalDetails?.firstName || ''} ${selected.personalDetails?.lastName || ''}`.trim() || 'Untitled resume';

    return {
        role: 'model',
        parts: [{
            text: [
                `I found ${resumes.length} resume${resumes.length === 1 ? '' : 's'}.`,
                `Best match: ${title}.`,
                selected.personalDetails?.jobTitle ? `Profile title: ${selected.personalDetails.jobTitle}.` : null,
                otherResumes.length ? `Other recent resumes: ${otherResumes.join('; ')}.` : null,
            ].filter(Boolean).join('\n'),
        }],
        actions: [
            { label: 'Open resume', path: `/edit/${selected.id}`, tone: 'primary' },
            { label: 'Resume dashboard', path: '/dashboard', tone: 'secondary' },
        ],
    };
};

const buildJobResponse = (input: string, jobs: JobApplicationData[]): ChatMessage => {
    const submittedStatuses = new Set(['Applied', 'Interviewing', 'Offered', 'Rejected']);
    const submitted = jobs.filter(job => submittedStatuses.has(job.applicationStatus));
    const active = jobs.filter(job => job.applicationStatus !== 'Rejected');
    const byStatus = jobs.reduce<Record<string, number>>((acc, job) => {
        acc[job.applicationStatus] = (acc[job.applicationStatus] || 0) + 1;
        return acc;
    }, {});

    const ranked = [...jobs]
        .map(job => ({
            job,
            score: scoreTextMatch(input, [
                job.jobTitle,
                job.companyName,
                job.location,
                job.interviewStage,
                job.nextAction,
                job.notes,
            ]),
            updatedAt: toTime(job.updatedAt),
        }))
        .sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt);

    const hasSpecificQuery = getTokens(input).length > 0 && ranked[0]?.score > 0;
    const visibleJobs = (hasSpecificQuery ? ranked.filter(item => item.score > 0) : ranked).slice(0, 5).map(item => item.job);
    const focusJob = visibleJobs[0];

    if (!jobs.length) {
        return {
            role: 'model',
            parts: [{ text: 'I do not see any tracked jobs yet. Save a role from the Chrome extension or add one in the tracker, and I can summarize status, deadlines, and prep from here.' }],
            actions: [{ label: 'Open job tracker', path: '/job-tracker', tone: 'primary' }],
        };
    }

    return {
        role: 'model',
        parts: [{
            text: [
                `You have ${jobs.length} tracked job${jobs.length === 1 ? '' : 's'}: ${active.length} active, ${submitted.length} already submitted, ${byStatus.Interviewing || 0} interviewing, ${byStatus.Offered || 0} offers, ${byStatus.Rejected || 0} rejected.`,
                visibleJobs.length ? `Relevant jobs:\n${visibleJobs.map((job, index) => `${index + 1}. ${summarizeJob(job)}`).join('\n')}` : null,
                focusJob?.nextAction ? `Suggested next action: ${focusJob.nextAction}.` : 'Suggested next action: choose one active role and add the next follow-up or prep task.',
            ].filter(Boolean).join('\n\n'),
        }],
        actions: [
            focusJob ? { label: 'Open matched job', path: `/job-tracker?job=${encodeURIComponent(focusJob.id)}`, tone: 'primary' } : { label: 'Open job tracker', path: '/job-tracker', tone: 'primary' },
            { label: 'View pipeline', path: '/job-tracker', tone: 'secondary' },
        ],
    };
};

const buildInterviewResponse = (history: PracticeHistoryEntry[]): ChatMessage => {
    if (!history.length) {
        return {
            role: 'model',
            parts: [{ text: 'I do not see mock interview sessions yet. Start with the role that matters most this week, then I can track your reports and recommend what to practice next.' }],
            actions: [{ label: 'Start interview practice', path: '/interview-studio', tone: 'primary' }],
        };
    }

    const analyses = history.flatMap(entry => (entry.interviewHistory || []).map(analysis => ({ entry, analysis })));
    const lowest = analyses.length
        ? [...analyses].sort((a, b) => (a.analysis.overallScore || 0) - (b.analysis.overallScore || 0))[0]
        : null;
    const latest = [...history].sort((a, b) => toTime(b.timestamp) - toTime(a.timestamp))[0];
    const target = lowest?.entry || latest;
    const focus = lowest?.analysis?.areasForImprovement || target.questions?.slice(0, 2).join(' ') || 'Run one focused mock interview and review the report.';

    return {
        role: 'model',
        parts: [{
            text: [
                `I found ${history.length} mock interview workspace${history.length === 1 ? '' : 's'} and ${analyses.length} completed report${analyses.length === 1 ? '' : 's'}.`,
                `Recommended next practice: ${target.job?.title || 'Mock interview'}${target.job?.company ? ` at ${target.job.company}` : ''}.`,
                lowest ? `Lowest recent score: ${lowest.analysis.overallScore}/100. Work on: ${focus}` : `Work on: ${focus}`,
                latest?.questions?.length ? `Practice prompts available: ${latest.questions.slice(0, 3).join(' | ')}` : null,
            ].filter(Boolean).join('\n\n'),
        }],
        actions: [
            { label: 'Open recommended interview', path: `/interview-studio/${target.id}`, tone: 'primary' },
            { label: 'All interviews', path: '/interview-studio', tone: 'secondary' },
        ],
    };
};

const ChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDismissed, setIsDismissed] = useState(() => sessionStorage.getItem('careervivid_chatbot_dismissed') === 'true');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { currentUser } = useAuth();

    // Note: ChatBot is intentionally free and does not check for AI credits.

    const { resumes } = useResumes();
    const { jobApplications } = useJobTracker();
    const { practiceHistory } = usePracticeHistory();
    const language = resumes[0]?.language || 'English';
    const workspaceSummary = useMemo(() => {
        const appliedCount = jobApplications.filter(job => ['Applied', 'Interviewing', 'Offered', 'Rejected'].includes(job.applicationStatus)).length;
        const completedInterviews = practiceHistory.reduce((count, entry) => count + (entry.interviewHistory?.length || 0), 0);
        return {
            resumeCount: resumes.length,
            jobCount: jobApplications.length,
            appliedCount,
            interviewCount: practiceHistory.length,
            completedInterviews,
        };
    }, [jobApplications, practiceHistory, resumes]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleDismiss = (event: React.MouseEvent) => {
        event.stopPropagation();
        sessionStorage.setItem('careervivid_chatbot_dismissed', 'true');
        setIsOpen(false);
        setIsDismissed(true);
    };

    const handleFAQClick = (faq: typeof FAQs[0]) => {
        const userMessage: ChatMessage = { role: 'user', parts: [{ text: faq.question }] };
        const botMessage: ChatMessage = { role: 'model', parts: [{ text: faq.answer }] };
        setMessages(prev => [...prev, userMessage, botMessage]);
    };

    const getWorkspaceReply = (message: string): ChatMessage | null => {
        const lower = message.toLowerCase();
        const asksResume = /\b(resume|cv|editor|edit)\b/.test(lower);
        const asksJobs = /\b(job|jobs|applied|application|pipeline|tracker|company|role|openai|google|nvidia)\b/.test(lower);
        const asksInterview = /\b(interview|mock|practice|prep|question|report|score)\b/.test(lower);
        const asksDashboard = /\b(summary|status|workspace|next step|what should i do)\b/.test(lower);

        if (asksResume && !asksJobs && !asksInterview) return buildResumeResponse(message, resumes);
        if (asksInterview) return buildInterviewResponse(practiceHistory);
        if (asksJobs) return buildJobResponse(message, jobApplications);
        if (asksDashboard) {
            return {
                role: 'model',
                parts: [{
                    text: [
                        `Workspace snapshot: ${workspaceSummary.resumeCount} resume${workspaceSummary.resumeCount === 1 ? '' : 's'}, ${workspaceSummary.jobCount} tracked job${workspaceSummary.jobCount === 1 ? '' : 's'}, ${workspaceSummary.appliedCount} submitted application${workspaceSummary.appliedCount === 1 ? '' : 's'}, and ${workspaceSummary.completedInterviews} completed interview report${workspaceSummary.completedInterviews === 1 ? '' : 's'}.`,
                        'Best next move: open the most urgent active job, confirm the next action, then run one mock interview tied to that role.',
                    ].join('\n\n'),
                }],
                actions: [
                    { label: 'View pipeline', path: '/job-tracker', tone: 'primary' },
                    { label: 'Open interviews', path: '/interview-studio', tone: 'secondary' },
                    resumes[0] ? { label: 'Open latest resume', path: `/edit/${resumes[0].id}`, tone: 'secondary' } : { label: 'Create resume', path: '/newresume', tone: 'secondary' },
                ],
            };
        }

        return null;
    };

    const sendMessage = async (message: string) => {
        if (message.trim() === '' || isLoading || !currentUser) return;

        const trimmedMessage = message.trim();
        const userMessage: ChatMessage = { role: 'user', parts: [{ text: trimmedMessage }] };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        const workspaceReply = getWorkspaceReply(trimmedMessage);
        if (workspaceReply) {
            setMessages(prev => [...prev, workspaceReply]);
            return;
        }

        setIsLoading(true);

        try {
            const responseText = await generalChat(currentUser.uid, messages, trimmedMessage, language);
            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: responseText }] };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "Sorry, I'm having trouble connecting right now." }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        await sendMessage(input);
    };

    if (isDismissed) return null;

    return (
        <>
            <div className="fixed bottom-6 right-6 z-40">
                {!isOpen && (
                    <button
                        onClick={handleDismiss}
                        className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full border border-white/80 bg-white text-gray-500 shadow-lg flex items-center justify-center hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        aria-label="Hide chat"
                        title="Hide chat"
                    >
                        <X size={14} strokeWidth={2.5} />
                    </button>
                )}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-primary-600 text-white w-14 h-14 rounded-full shadow-xl shadow-primary-900/20 flex items-center justify-center hover:bg-primary-700 hover:shadow-2xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2"
                    aria-label="Toggle Chat"
                >
                    {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
                </button>
            </div>

            {isOpen && (
                <div className="fixed bottom-24 right-4 sm:right-6 w-[92vw] sm:w-[410px] h-[640px] max-h-[78vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right border border-[#e6dac8] dark:border-gray-700 z-40 animate-in slide-in-from-bottom-5 fade-in overflow-hidden">
                    {/* Header */}
                    <header className="bg-[#fffaf1] dark:bg-gray-900 text-[#211b16] dark:text-[#f4f1e9] px-4 py-3 border-b border-[#e6dac8] dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="bg-[#eef0ff] text-primary-600 p-2 rounded-lg mr-3 border border-[#e4e7ff]">
                                <Bot size={20} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-base leading-tight">Workspace assistant</h3>
                                <p className="text-xs text-[#665a4a] dark:text-gray-400">Resumes, jobs, and interview prep</p>
                            </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-lg border border-[#ececf4] bg-white/80 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800">
                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{workspaceSummary.resumeCount}</div>
                                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Resumes</div>
                            </div>
                            <div className="rounded-lg border border-[#ececf4] bg-white/80 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800">
                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{workspaceSummary.jobCount}</div>
                                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Jobs</div>
                            </div>
                            <div className="rounded-lg border border-[#ececf4] bg-white/80 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800">
                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{workspaceSummary.completedInterviews}</div>
                                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Reports</div>
                            </div>
                        </div>
                    </header>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto bg-[#fbfbfe] dark:bg-gray-950 p-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        {messages.length === 0 && (
                            <div className="text-center mt-5 mb-5">
                                <div className="w-14 h-14 bg-[#eef0ff] dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#e4e7ff] dark:border-primary-800">
                                    <Sparkles className="text-primary-600 dark:text-primary-300" size={28} />
                                </div>
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">What do you want to find?</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Ask for a resume, saved job, application count, or mock interview next step.</p>
                            </div>
                        )}

                        <div className="space-y-4 pb-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[88%] px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-primary-600 text-white rounded-tr-none'
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-[#ececf4] dark:border-gray-700'
                                        }`}>
                                        {msg.role === 'model' ? (
                                            <ReactMarkdown className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:text-inherit dark:prose-invert">
                                                {msg.parts[0].text}
                                            </ReactMarkdown>
                                        ) : (
                                            <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                                        )}
                                        {msg.actions && msg.actions.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {msg.actions.map((action, actionIndex) => (
                                                    <button
                                                        key={`${action.label}-${actionIndex}`}
                                                        type="button"
                                                        onClick={() => navigate(action.path)}
                                                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300 ${action.tone === 'primary'
                                                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                                                            : 'border border-[#dedaf8] bg-[#f3f2ff] text-primary-700 hover:bg-[#e8e6ff] dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-200'
                                                            }`}
                                                    >
                                                        {action.label}
                                                        <ArrowRight size={13} />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-[#ececf4] dark:border-gray-700">
                                        <div className="flex items-center space-x-1.5">
                                            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce delay-100"></span>
                                            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce delay-200"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* FAQs */}
                        {messages.length < 2 && (
                            <div className="mt-auto pt-4">
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-1">
                                    <Sparkles size={12} /> Workspace shortcuts
                                </p>
                                <div className="grid grid-cols-1 gap-2 mb-4">
                                    {WORKSPACE_PROMPTS.map((prompt) => {
                                        const Icon = prompt.icon;
                                        return (
                                            <button
                                                key={prompt.value}
                                                onClick={() => sendMessage(prompt.value)}
                                                className="text-left px-4 py-3 bg-white dark:bg-gray-800 hover:bg-[#f3f2ff] dark:hover:bg-gray-700 border border-[#ececf4] dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-100 transition-colors shadow-sm hover:shadow active:scale-[0.98] flex items-center gap-3"
                                            >
                                                <span className="h-8 w-8 rounded-lg bg-[#eef0ff] text-primary-600 flex items-center justify-center flex-shrink-0">
                                                    <Icon size={16} />
                                                </span>
                                                {prompt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-1">
                                    <HelpCircle size={12} /> Common questions
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    {FAQs.map((faq, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                if (faq.question === "How to upgrade?") {
                                                    localStorage.setItem('upgrade_guide_step', '1');
                                                    window.dispatchEvent(new Event('trigger-upgrade-guide'));
                                                }
                                                handleFAQClick(faq);
                                            }}
                                            className="text-left px-4 py-3 bg-white dark:bg-gray-800 hover:bg-[#fffaf1] dark:hover:bg-gray-700 border border-[#ececf4] dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors shadow-sm hover:shadow active:scale-[0.98]"
                                        >
                                            {faq.question}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white dark:bg-gray-900 border-t border-[#ececf4] dark:border-gray-700 rounded-b-2xl">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask for a resume, job, or interview..."
                                className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 border focus:border-primary-500 rounded-xl text-sm focus:outline-none transition-all dark:text-white"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="absolute right-2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:bg-gray-400 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                                aria-label="Send message"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatBot;
