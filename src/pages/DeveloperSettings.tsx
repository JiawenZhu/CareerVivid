import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import {
    ArrowLeft, Key, Eye, EyeOff, Copy, Trash2, Plus,
    Terminal, CheckCircle, AlertCircle, Loader2, Zap, BookOpen, Shield
} from 'lucide-react';

type KeyState = 'loading' | 'no_key' | 'has_key';

const DeveloperSettings: React.FC = () => {
    const { currentUser } = useAuth();
    const [keyState, setKeyState] = useState<KeyState>('loading');
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isWorking, setIsWorking] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back</span>
                    </button>
                    <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
                    <div className="flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Developer Settings</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
                {/* Hero Banner */}
                <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-px shadow-xl">
                    <div className="rounded-2xl bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-pink-600/10 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 px-8 py-7">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                    AI Agent Publishing API
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xl">
                                    Connect your local AI coding agents (Cursor, Claude, Copilot) to CareerVivid via the{' '}
                                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">MCP server</span>.
                                    Agents can automatically publish tech articles and architecture diagrams to your portfolio.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* API Key Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Secret API Key</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Treat this like a password — never share or commit to version control.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-green-500" />
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">Encrypted at rest</span>
                        </div>
                    </div>

                    <div className="px-6 py-6">
                        {keyState === 'loading' && (
                            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">Checking for existing key…</span>
                            </div>
                        )}

                        {keyState === 'no_key' && (
                            <div className="flex flex-col items-start gap-5">
                                <div className="w-full rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-8 flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
                                    <Key className="w-8 h-8" />
                                    <p className="text-sm">No API key generated yet</p>
                                </div>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isWorking}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                                >
                                    {isWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Generate API Key
                                </button>
                            </div>
                        )}

                        {keyState === 'has_key' && apiKey && (
                            <div className="space-y-4">
                                {/* Key Input Row */}
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            id="api-key-input"
                                            type={showKey ? 'text' : 'password'}
                                            readOnly
                                            value={showKey ? apiKey : maskedKey}
                                            className="w-full px-4 py-2.5 pr-12 font-mono text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none"
                                        />
                                    </div>

                                    {/* Toggle visibility */}
                                    <button
                                        onClick={() => setShowKey(v => !v)}
                                        title={showKey ? 'Hide key' : 'Reveal key'}
                                        className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>

                                    {/* Copy */}
                                    <button
                                        onClick={handleCopy}
                                        title="Copy to clipboard"
                                        className={`p-2.5 rounded-xl border transition-colors ${copied
                                            ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                    >
                                        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>

                                {copied && (
                                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Copied to clipboard</p>
                                )}

                                {/* Revoke */}
                                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Generating a new key will immediately invalidate the current one.
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleGenerate}
                                            disabled={isWorking}
                                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                        >
                                            Regenerate
                                        </button>
                                        <button
                                            onClick={handleRevoke}
                                            disabled={isWorking}
                                            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {isWorking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                            Revoke
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Setup Guide */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">MCP Server Setup</h3>
                    </div>
                    <div className="px-6 py-6 space-y-6 text-sm text-gray-700 dark:text-gray-300">

                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white mb-2">1. Install the MCP server</p>
                            <pre className="bg-gray-900 text-green-400 font-mono text-xs rounded-xl px-4 py-3 overflow-x-auto whitespace-pre-wrap">
                                {`# Clone and install
cd careervivid/mcp-server
npm install && npm run build`}
                            </pre>
                        </div>

                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white mb-2">2. Configure in Cursor / Claude Desktop</p>
                            <pre className="bg-gray-900 text-green-400 font-mono text-xs rounded-xl px-4 py-3 overflow-x-auto whitespace-pre-wrap">
                                {`// cursor settings.json  or  claude_desktop_config.json
{
  "mcpServers": {
    "careervivid": {
      "command": "node",
      "args": ["/path/to/careervivid/mcp-server/dist/index.js"],
      "env": {
        "CV_API_KEY": "cv_live_your_key_here",
        "CV_API_URL": "https://careervivid.app/api/publish"
      }
    }
  }
}`}
                            </pre>
                        </div>

                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white mb-2">3. Use in your AI agent</p>
                            <pre className="bg-gray-900 text-blue-300 font-mono text-xs rounded-xl px-4 py-3 overflow-x-auto whitespace-pre-wrap">
                                {`> Analyze my codebase and publish a tech article summarizing 
  the architecture to my CareerVivid portfolio.

# The agent will call publish_to_careervivid automatically.`}
                            </pre>
                        </div>

                        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3 flex gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 dark:text-amber-300">
                                <strong>Security:</strong> Store your API key only in local environment variables. Never commit it to version control. Revoke it immediately if exposed.
                            </p>
                        </div>
                    </div>
                </div>

                {/* API Reference quick card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Direct API Reference</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Use this if you're building a custom integration (not MCP).</p>
                    </div>
                    <div className="px-6 py-5">
                        <pre className="bg-gray-900 text-green-400 font-mono text-xs rounded-xl px-4 py-3 overflow-x-auto whitespace-pre-wrap">
                            {`POST https://careervivid.app/api/publish
x-api-key: cv_live_your_key_here
Content-Type: application/json

{
  "type": "article",          // article | whiteboard | portfolio
  "dataFormat": "markdown",   // markdown | mermaid | blocknote_json
  "title": "My Article Title",
  "content": "# Heading\\n\\nContent here...",
  "tags": ["typescript", "architecture"],
  "coverImage": "https://..."  // optional
}

// Response 201
{ "postId": "abc123", "url": "https://careervivid.app/community/post/abc123" }`}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeveloperSettings;
