import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import {
    ArrowLeft, Key, Eye, EyeOff, Copy, Trash2, Plus,
    Terminal, CheckCircle, AlertCircle, Loader2, Zap, BookOpen, Shield,
    Code2, LayoutTemplate, FileJson
} from 'lucide-react';

type KeyState = 'loading' | 'no_key' | 'has_key';
type SetupTab = 'cursor' | 'claude' | 'cli' | 'custom';

const InteractiveCodeBlock = ({ children, copyText, className = "ml-7" }: { children: React.ReactNode, copyText: string, className?: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(copyText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className={`${className} relative group rounded-xl bg-[#0d1117] border border-gray-800 overflow-hidden`}>
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Copy to clipboard"
            >
                {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <pre className="p-4 text-[13px] font-mono leading-relaxed overflow-x-auto">
                {children}
            </pre>
        </div>
    );
};

const DeveloperSettings: React.FC = () => {
    const { currentUser } = useAuth();
    const [keyState, setKeyState] = useState<KeyState>('loading');
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isWorking, setIsWorking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<SetupTab>('cursor');

    // ── Auth Guard ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!currentUser) navigate('/signin?redirect=/developer');
    }, [currentUser]);

    // ── Fetch existing key on mount ───────────────────────────────────────────
    const fetchKey = useCallback(async () => {
        if (!currentUser) return;
        setKeyState('loading');
        setError(null);
        try {
            const manageApiKey = httpsCallable(functions, 'manageApiKey');
            const result: any = await manageApiKey({ action: 'get' });
            if (result.data.key) {
                setApiKey(result.data.key);
                setKeyState('has_key');
            } else {
                setKeyState('no_key');
            }
        } catch (err: any) {
            setError('Failed to load key status. Please refresh.');
            setKeyState('no_key');
        }
    }, [currentUser]);

    useEffect(() => {
        fetchKey();
    }, [fetchKey]);

    // ── Actions ───────────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        setIsWorking(true);
        setError(null);
        try {
            const manageApiKey = httpsCallable(functions, 'manageApiKey');
            const result: any = await manageApiKey({ action: 'generate' });
            setApiKey(result.data.key);
            setShowKey(true);
            setKeyState('has_key');
        } catch (err: any) {
            setError('Failed to generate key. Please try again.');
        } finally {
            setIsWorking(false);
        }
    };

    const handleRevoke = async () => {
        if (!window.confirm('Revoke this API key? Any agents using it will lose access immediately.')) return;
        setIsWorking(true);
        setError(null);
        try {
            const manageApiKey = httpsCallable(functions, 'manageApiKey');
            await manageApiKey({ action: 'revoke' });
            setApiKey(null);
            setShowKey(false);
            setKeyState('no_key');
        } catch (err: any) {
            setError('Failed to revoke key. Please try again.');
        } finally {
            setIsWorking(false);
        }
    };

    const handleCopy = async () => {
        if (!apiKey) return;
        try {
            await navigator.clipboard.writeText(apiKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const ta = document.createElement('textarea');
            ta.value = apiKey;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const maskedKey = apiKey ? `${apiKey.slice(0, 14)}${'•'.repeat(Math.max(0, apiKey.length - 14))}` : '';

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
            {/* Minimal Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-gray-900 dark:text-gray-100" />
                        <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Developer Settings</h1>
                    </div>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
                {/* Header Content */}
                <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        AI Agent Integration (Publishing & Portfolios)
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl text-base">
                        Connect local AI coding assistants directly to your profile via the Model Context Protocol (MCP). Let agents sync new projects to your portfolio, generate architecture diagrams, and publish technical articles automatically.
                    </p>
                </div>

                {error && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* API Key Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">Authentication</h3>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">

                        <div className="px-6 py-6">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        Personal API Key
                                        {keyState === 'has_key' && (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-medium border border-green-200 dark:border-green-500/20">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                Active
                                            </span>
                                        )}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        This key provides full access to publish as you. Keep it secret.
                                    </p>
                                </div>
                            </div>

                            {keyState === 'loading' && (
                                <div className="flex items-center gap-3 text-gray-500 py-4">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-sm font-medium">Verifying access...</span>
                                </div>
                            )}

                            {keyState === 'no_key' && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3">
                                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700">
                                        <Key className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Generate a secure key to connect your AI agents.</p>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isWorking}
                                        className="mt-2 flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {isWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Generate new key
                                    </button>
                                </div>
                            )}

                            {keyState === 'has_key' && apiKey && (
                                <div className="space-y-5">
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative flex-1 group">
                                            <input
                                                id="api-key-input"
                                                type={showKey ? 'text' : 'password'}
                                                readOnly
                                                value={showKey ? apiKey : maskedKey}
                                                className="w-full pl-4 pr-12 py-3 font-mono text-sm bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-shadow"
                                            />
                                            <div className="absolute inset-y-0 right-2 flex items-center">
                                                <button
                                                    onClick={() => setShowKey(v => !v)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                    title={showKey ? 'Hide key' : 'Reveal key'}
                                                >
                                                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCopy}
                                            className="flex-shrink-0 flex items-center justify-center h-[46px] w-[46px] sm:w-auto sm:px-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all"
                                        >
                                            {copied ? (
                                                <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium text-sm">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Copied</span>
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2 font-medium text-sm">
                                                    <Copy className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Copy</span>
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                            <Shield className="w-3.5 h-3.5" />
                                            Store securely.
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handleGenerate}
                                                disabled={isWorking}
                                                className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:white transition-colors disabled:opacity-50"
                                            >
                                                Roll Key
                                            </button>
                                            <div className="w-px h-3 bg-gray-200 dark:bg-gray-700"></div>
                                            <button
                                                onClick={handleRevoke}
                                                disabled={isWorking}
                                                className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                            >
                                                Revoke Access
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Setup Instructions */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-gray-400" />
                        Integration Guide
                    </h3>

                    <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5">

                        {/* Tabs Navigation */}
                        <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                            {[
                                { id: 'cursor', label: 'Cursor', icon: Code2 },
                                { id: 'claude', label: 'Claude Desktop', icon: LayoutTemplate },
                                { id: 'cli', label: 'CLI Tool', icon: Terminal },
                                { id: 'custom', label: 'Custom Agent (REST)', icon: FileJson },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as SetupTab)}
                                        className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all ${isActive
                                            ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white bg-white dark:bg-gray-800'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tab Content */}
                        <div className="px-6 py-6">

                            {/* CURSOR OR CLAUDE TAB */}
                            {(activeTab === 'cursor' || activeTab === 'claude') && (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">1</span>
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Build the MCP Server</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">Clone the CareerVivid repository locally and compile the server.</p>
                                        <InteractiveCodeBlock copyText="cd path/to/careervivid/mcp-server&#10;npm install&#10;npm run build">
                                            <span className="text-gray-500"># Run in your terminal</span>{'\n'}
                                            <span className="text-[#e2b93d]">cd</span><span className="text-[#a5d6ff]"> path/to/careervivid/mcp-server</span>{'\n'}
                                            <span className="text-[#e2b93d]">npm install</span>{'\n'}
                                            <span className="text-[#e2b93d]">npm run</span><span className="text-[#a5d6ff]"> build</span>
                                        </InteractiveCodeBlock>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">2</span>
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Configure the IDE</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                                            {activeTab === 'cursor' ? 'Add this to Cursor Settings > Features > MCP Servers.' : 'Add this to your claude_desktop_config.json file.'}
                                        </p>
                                        <InteractiveCodeBlock copyText={`"mcpServers": {\n  "careervivid": {\n    "command": "node",\n    "args": ["/absolute/path/to/careervivid/mcp-server/dist/index.js"],\n    "env": {\n      "CV_API_KEY": "${apiKey || 'cv_live_your_key_here'}",\n      "CV_API_URL": "https://careervivid.app/api/publish"\n    }\n  }\n}`}>
                                            <span className="text-[#ff7b72]">"mcpServers"</span><span className="text-gray-300">: {`{`}</span>
                                            <span className="text-[#79c0ff]">"careervivid"</span><span className="text-gray-300">: {`{`}</span>
                                            <span className="text-[#79c0ff]">"command"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"node"</span><span className="text-gray-300">,</span>
                                            <span className="text-[#79c0ff]">"args"</span><span className="text-gray-300">: [</span><span className="text-[#a5d6ff]">"/absolute/path/to/careervivid/mcp-server/dist/index.js"</span><span className="text-gray-300">],</span>
                                            <span className="text-[#79c0ff]">"env"</span><span className="text-gray-300">: {`{`}</span>
                                            <span className="text-[#79c0ff]">"CV_API_KEY"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"{apiKey || 'cv_live_your_key_here'}"</span><span className="text-gray-300">,</span>
                                            <span className="text-[#79c0ff]">"CV_API_URL"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"https://careervivid.app/api/publish"</span>
                                            <span className="text-gray-300">{`}`}</span>
                                            <span className="text-gray-300">{`}`}</span>
                                            <span className="text-gray-300">{`}`}</span>
                                        </InteractiveCodeBlock>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">3</span>
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Publish with AI</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">Interact with {activeTab === 'cursor' ? 'Cursor Composer' : 'Claude'} to use the tool naturally.</p>
                                        <InteractiveCodeBlock className="ml-7 !bg-indigo-50 dark:!bg-indigo-500/10 !border-indigo-100 dark:!border-indigo-500/20" copyText="Analyze this directory and publish a technical summary of the system architecture to my CareerVivid profile. Then, sync this project as a new case study to my developer portfolio.">
                                            <span className="text-indigo-900 dark:text-indigo-200">"Analyze this directory and publish a technical summary of the system architecture to my CareerVivid profile. Then, sync this project as a new case study to my developer portfolio."</span>
                                        </InteractiveCodeBlock>
                                    </div>
                                </div>
                            )}

                            {/* CLI TAB */}
                            {activeTab === 'cli' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">1</span>
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Install the CLI</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                                            Install the official <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[13px]">careervivid</code> package globally. Once installed, the <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[13px]">cv</code> command will be available in your terminal.
                                        </p>
                                        <InteractiveCodeBlock copyText="npm install -g careervivid">
                                            <span className="text-gray-500"># Install globally (macOS / Linux / Windows)</span>{'\n'}
                                            <span className="text-[#e2b93d]">npm</span><span className="text-gray-300"> install -g careervivid</span>
                                        </InteractiveCodeBlock>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">2</span>
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Authenticate</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                                            Securely save your API key. It will be stored at <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[13px]">~/.careervividrc.json</code>.
                                        </p>
                                        <InteractiveCodeBlock copyText={`cv auth set-key ${apiKey || 'cv_live_your_key_here'}\n# verify it works\ncv auth check`}>
                                            <span className="text-[#e2b93d]">cv auth</span><span className="text-gray-300"> set-key </span><span className="text-[#a5d6ff]">{apiKey || 'cv_live_your_key_here'}</span>{'\n'}
                                            <span className="text-gray-500"># verify it works</span>{'\n'}
                                            <span className="text-[#e2b93d]">cv auth</span><span className="text-gray-300"> check</span>
                                        </InteractiveCodeBlock>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">3</span>
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Publish Output</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                                            Publish markdown articles or mermaid diagrams. Use <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[13px]">--json</code> for machine-readable output and <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[13px]">--dry-run</code> to validate without posting.
                                        </p>
                                        <InteractiveCodeBlock copyText={"# Publish a markdown file\ncv publish article.md --tags \"typescript,react\"\n\n# Pipe from an AI agent — structured JSON output\ncat diagram.mmd | cv publish - --title \"System Architecture\" --json\n\n# Validate without publishing\ncv publish article.md --dry-run"}>
                                            <span className="text-gray-500"># Publish a markdown file</span>{'\n'}
                                            <span className="text-[#e2b93d]">cv publish</span><span className="text-gray-300"> article.md </span><span className="text-[#ff7b72]">--tags</span><span className="text-gray-300"> </span><span className="text-[#a5d6ff]">"typescript,react"</span>{'\n\n'}
                                            <span className="text-gray-500"># Pipe from an AI agent — structured JSON output</span>{'\n'}
                                            <span className="text-[#e2b93d]">cat</span><span className="text-gray-300"> diagram.mmd | </span><span className="text-[#e2b93d]">cv publish</span><span className="text-gray-300"> - </span><span className="text-[#ff7b72]">--title</span><span className="text-gray-300"> </span><span className="text-[#a5d6ff]">"System Architecture"</span><span className="text-gray-300"> </span><span className="text-[#ff7b72]">--json</span>{'\n\n'}
                                            <span className="text-gray-500"># Validate without publishing</span>{'\n'}
                                            <span className="text-[#e2b93d]">cv publish</span><span className="text-gray-300"> article.md </span><span className="text-[#ff7b72]">--dry-run</span>
                                        </InteractiveCodeBlock>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">4</span>
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Portfolio Automation <span className="ml-2 px-2 py-0.5 text-[11px] rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-medium">New in v2.0</span></h4>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                                            Pipe JSON outputs directly from AI agents into your actively hosted CareerVivid portfolio without ever leaving the terminal.
                                        </p>
                                        <InteractiveCodeBlock copyText={"# Scaffold a new foundational portfolio\ncv portfolio init --title \"My Dev Site\"\n\n# Sync analyzed projects directly to your site\ncat projects.json | cv portfolio add-project - --id \"YOUR_PORTFOLIO_ID\"\n\n# Get a quick preview URL\ncv portfolio preview --id \"YOUR_PORTFOLIO_ID\""}>
                                            <span className="text-gray-500"># Scaffold a new foundational portfolio</span>{'\n'}
                                            <span className="text-[#e2b93d]">cv portfolio</span><span className="text-gray-300"> init </span><span className="text-[#ff7b72]">--title</span><span className="text-gray-300"> </span><span className="text-[#a5d6ff]">"My Dev Site"</span>{'\n\n'}
                                            <span className="text-gray-500"># Sync analyzed projects directly to your site</span>{'\n'}
                                            <span className="text-[#e2b93d]">cat</span><span className="text-gray-300"> projects.json | </span><span className="text-[#e2b93d]">cv portfolio</span><span className="text-gray-300"> add-project - </span><span className="text-[#ff7b72]">--id</span><span className="text-gray-300"> </span><span className="text-[#a5d6ff]">"YOUR_PORTFOLIO_ID"</span>{'\n\n'}
                                            <span className="text-gray-500"># Get a quick preview URL</span>{'\n'}
                                            <span className="text-[#e2b93d]">cv portfolio</span><span className="text-gray-300"> preview </span><span className="text-[#ff7b72]">--id</span><span className="text-gray-300"> </span><span className="text-[#a5d6ff]">"YOUR_PORTFOLIO_ID"</span>
                                        </InteractiveCodeBlock>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">5</span>
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Whiteboard Diagrams</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                                            Create Mermaid architecture diagrams with built-in templates — no extra packages needed. Try the new <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[13px]">cv new</code> and <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[13px]">cv list-templates</code> shortcuts.
                                        </p>
                                        <InteractiveCodeBlock copyText={"# Scaffold a new diagram interactively\ncv new\n\n# Publish your diagram\ncv whiteboard publish my-arch.mmd --title \"System Architecture\""}>
                                            <span className="text-gray-500"># Scaffold a new diagram interactively</span>{'\n'}
                                            <span className="text-[#e2b93d]">cv new</span>{'\n\n'}
                                            <span className="text-gray-500"># Publish your diagram</span>{'\n'}
                                            <span className="text-[#e2b93d]">cv whiteboard</span><span className="text-gray-300"> publish my-arch.mmd </span><span className="text-[#ff7b72]">--title</span><span className="text-gray-300"> </span><span className="text-[#a5d6ff]">"System Architecture"</span>
                                        </InteractiveCodeBlock>
                                    </div>
                                </div>
                            )}

                            {/* CUSTOM AGENT TAB */}
                            {activeTab === 'custom' && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        If you're building a custom script or using a framework like LangChain/CrewAI not running via MCP, use the standard REST endpoint.
                                    </p>

                                    <InteractiveCodeBlock className="" copyText={`POST https://careervivid.app/api/publish\nx-api-key: ${apiKey || 'cv_live_your_key_here'}\nContent-Type: application/json\n\n{\n  "type": "article",\n  "dataFormat": "markdown",\n  "title": "My Article Title",\n  "content": "# Heading\\n\\nContent here...",\n  "tags": ["typescript", "architecture"],\n  "coverImage": "https://..."\n}`}>
                                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/50">
                                            <span className="text-xs font-mono text-gray-400">POST /api/publish (Publishing Content)</span>
                                        </div>
                                        <span className="text-[#ff7b72]">POST</span><span className="text-gray-300"> https://careervivid.app/api/publish</span>{'\n'}
                                        <span className="text-[#79c0ff]">x-api-key</span><span className="text-gray-300">: {apiKey || 'cv_live_your_key_here'}</span>{'\n'}
                                        <span className="text-[#79c0ff]">Content-Type</span><span className="text-gray-300">: application/json</span>{'\n'}{'\n'}

                                        <span className="text-gray-300">{`{`}</span>{'\n'}
                                        <span className="text-[#79c0ff]">  "type"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"article"</span><span className="text-gray-300">,          </span><span className="text-gray-500">// article | whiteboard</span>{'\n'}
                                        <span className="text-[#79c0ff]">  "dataFormat"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"markdown"</span><span className="text-gray-300">,   </span><span className="text-gray-500">// markdown | mermaid</span>{'\n'}
                                        <span className="text-[#79c0ff]">  "title"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"My Article Title"</span><span className="text-gray-300">,</span>{'\n'}
                                        <span className="text-[#79c0ff]">  "content"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"# Heading\\n\\nContent here..."</span><span className="text-gray-300">,</span>{'\n'}
                                        <span className="text-[#79c0ff]">  "tags"</span><span className="text-gray-300">: [</span><span className="text-[#a5d6ff]">"typescript"</span><span className="text-gray-300">, </span><span className="text-[#a5d6ff]">"architecture"</span><span className="text-gray-300">],</span>{'\n'}
                                        <span className="text-gray-300">{`}`}</span>
                                    </InteractiveCodeBlock>

                                    <InteractiveCodeBlock className="mt-4 border-emerald-900/30 ring-1 ring-emerald-500/10" copyText={`PATCH https://careervivid.app/api/portfolio/projects\nx-api-key: ${apiKey || 'cv_live_your_key_here'}\nContent-Type: application/json\n\n{\n  "portfolioId": "abc12345",\n  "projects": [\n    {\n      "title": "Auth microservice",\n      "description": "Led backend refactor"\n    }\n  ],\n  "techStack": ["go", "redis"]\n}`}>
                                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/50">
                                            <span className="text-xs font-mono text-gray-400">PATCH /api/portfolio/projects (Syncing Data)</span>
                                            <span className="px-2 py-0.5 text-[11px] rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">New</span>
                                        </div>
                                        <span className="text-[#ff7b72]">PATCH</span><span className="text-gray-300"> https://careervivid.app/api/portfolio/projects</span>{'\n'}
                                        <span className="text-[#79c0ff]">x-api-key</span><span className="text-gray-300">: {apiKey || 'cv_live_your_key_here'}</span>{'\n'}
                                        <span className="text-[#79c0ff]">Content-Type</span><span className="text-gray-300">: application/json</span>{'\n'}{'\n'}

                                        <span className="text-gray-300">{`{`}</span>{'\n'}
                                        <span className="text-[#79c0ff]">  "portfolioId"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"abc12345"</span><span className="text-gray-300">,</span>{'\n'}
                                        <span className="text-[#79c0ff]">  "projects"</span><span className="text-gray-300">: [</span>{'\n'}
                                        <span className="text-gray-300">    {`{`} </span><span className="text-[#79c0ff]">"title"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"Auth service"</span><span className="text-gray-300">, </span><span className="text-[#79c0ff]">"description"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"..."</span><span className="text-gray-300"> {`}`}</span>{'\n'}
                                        <span className="text-gray-300">  ],</span>{'\n'}
                                        <span className="text-[#79c0ff]">  "techStack"</span><span className="text-gray-300">: [</span><span className="text-[#a5d6ff]">"go"</span><span className="text-gray-300">, </span><span className="text-[#a5d6ff]">"redis"</span><span className="text-gray-300">]</span>{'\n'}
                                        <span className="text-gray-300">{`}`}</span>
                                    </InteractiveCodeBlock>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Agent Guidelines */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        AI Agent Instructions
                    </h3>
                    <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                        <div className="px-6 py-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
                                Empower your AI editor with specialized knowledge. Copy these instructions into your agent's system prompt or configuration file to enable proactive, high-quality portfolio building.
                            </p>
                            <InteractiveCodeBlock
                                className="!m-0"
                                copyText={`# CareerVivid AI Integration Rules\n\nYou are an expert technical writer and senior software architect. Your secondary directive—after writing and fixing code—is to proactively help the user document their work and build their CareerVivid portfolio using the local \`cv\` CLI or MCP tools.\n\n## 1. Triggers (When to Propose a Sync/Post)\nDo not wait for the user to ask. Propose integrating with CareerVivid when:\n- You complete a significant new feature, module, or architecture.\n- You wrap up a new independent tool or app.\n- The user explicitly says "document this", "publish to CareerVivid", or "add to my portfolio".\n\n## 2. Security & Sanitization (CRITICAL)\nBefore syncing *anything*, you MUST scrub the data.\n- NEVER upload actual API keys, secrets, database passwords, or internal IP addresses.\n- Anonymize proprietary business logic unless the user tells you this is a public/open-source project.\n\n## 3. Tool Selection: Portfolio Sync vs Custom Posts\nChoose the best path based on the user's intent:\n\nIf they built a new feature/app (PORTFOLIO TOOL):\n- Use \`add_project_to_portfolio\` to sync the project details directly to their portfolio site. Summarize the technical challenge and your solution.\n- Suggest a "vibe" update using \`suggest_portfolio_theme\` if the project has a distinct characteristic (e.g. a dark "cyberpunk" theme for a security tool).\n\nIf they want to explain how a system works (PUBLISH TOOL):\n- For Architecture/Data Flows: Generate a clean Mermaid.js diagram and use \`publish_to_careervivid\` (type: whiteboard).\n- For Devlogs: Generate a Markdown article explaining the "Why" and "How" and use \`publish_to_careervivid\` (type: article).\n\n## 4. The Consent Gate\n- ALWAYS ask for explicit permission before firing an MCP tool.\n- Summarize exactly what you are going to upload and ask: "Shall I push this to CareerVivid?"`}
                            >
                                <span className="text-[#a5d6ff] font-bold"># CareerVivid AI Integration Rules</span>{'\n\n'}
                                <span className="text-gray-300">You are an expert technical writer and senior architect. Your secondary directive—after writing and fixing code—is to proactively help the user build their CareerVivid portfolio using the local </span><span className="text-[#ff7b72] font-mono">`cv`</span><span className="text-gray-300"> CLI or MCP tools.</span>{'\n\n'}
                                <span className="text-[#79c0ff] font-bold">## 1. Triggers (When to Propose a Sync/Post)</span>{'\n'}
                                <span className="text-gray-300">Do not wait. Propose integrating with CareerVivid when:</span>{'\n'}
                                <span className="text-gray-500">- You complete a significant new feature, module, or architecture.</span>{'\n'}
                                <span className="text-gray-500">- You wrap up a new independent tool or app.</span>{'\n'}
                                <span className="text-gray-500">- The user explicitly says "add to my portfolio".</span>{'\n\n'}
                                <span className="text-[#79c0ff] font-bold">## 2. Tool Selection: Portfolios vs Posts</span>{'\n'}
                                <span className="text-gray-300">Choose the best path based on the user's intent:</span>{'\n\n'}
                                <span className="text-emerald-400 font-medium">If they built a new feature/app (PORTFOLIO):</span>{'\n'}
                                <span className="text-gray-500">- Use </span><span className="text-white bg-gray-800 px-1 rounded font-mono text-xs">add_project_to_portfolio</span><span className="text-gray-500"> to sync the details explicitly to their site.</span>{'\n'}
                                <span className="text-gray-500">- Suggest an aesthetic update using </span><span className="text-white bg-gray-800 px-1 rounded font-mono text-xs">suggest_portfolio_theme</span><span className="text-gray-500">.</span>{'\n\n'}
                                <span className="text-blue-400 font-medium">If they want to explain a system log (PUBLISH):</span>{'\n'}
                                <span className="text-gray-500">- Use </span><span className="text-white bg-gray-800 px-1 rounded font-mono text-xs">publish_to_careervivid</span><span className="text-gray-500"> (type: article | whiteboard).</span>{'\n\n'}
                                <span className="text-[#79c0ff] font-bold">## 3. The Consent Gate</span>{'\n'}
                                <span className="text-gray-300">- ALWAYS ask for explicit permission before firing an MCP tool.</span>{'\n'}
                                <span className="text-gray-300">- Summarize exactly what you are going to upload and ask: "Shall I push this?"</span>
                            </InteractiveCodeBlock>
                        </div>
                    </div>
                </div>

                <div className="h-10 border-none pb-10 m-0"></div>
            </main>
        </div>
    );
};

export default DeveloperSettings;
