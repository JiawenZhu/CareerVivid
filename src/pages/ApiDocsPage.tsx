import React, { useState, useEffect, useRef } from 'react';
import { navigate } from '../utils/navigation';
import {
    ChevronRight, Copy, Check, ExternalLink,
    Code2, BookOpen, KeyRound, FileText, List, Search, PlusCircle, ArrowLeft,
    CheckCircle, Terminal, LayoutTemplate, FileJson, Zap
} from 'lucide-react';

type SetupTab = 'cursor' | 'claude' | 'cli' | 'custom';

// ─────────────────────────────────────────────────────────────────────────────
// Primitive components
// ─────────────────────────────────────────────────────────────────────────────

const METHOD_STYLES: Record<string, string> = {
    GET: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    POST: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    PUT: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    PATCH: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    DELETE: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
};

const MethodBadge: React.FC<{ method: string }> = ({ method }) => (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold tracking-wider font-mono border ${METHOD_STYLES[method] ?? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'}`}>
        {method}
    </span>
);

const CodeSnippet: React.FC<{ code: string; language?: string; title?: string }> = ({ code, language = 'bash', title }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 bg-[#0d1117] my-4 first:mt-0">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#ff5f56]/20" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#ffbd2e]/20" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#27c93f]/20" />
                    </div>
                    {title && <span className="text-[12px] font-medium text-gray-400 font-mono tracking-wide">{title}</span>}
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-all cursor-pointer"
                    aria-label="Copy code"
                >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-gray-300">
                <code>{code.trim()}</code>
            </pre>
        </div>
    );
};

const ParamRow: React.FC<{ name: string; type: string; required?: boolean; description: string }> = ({ name, type, required, description }) => (
    <tr className="border-b border-gray-100 dark:border-gray-800/60 last:border-0 group">
        <td className="py-4 pr-4 align-top w-1/3">
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                    <code className="text-[13px] font-mono font-semibold text-gray-900 dark:text-gray-100">{name}</code>
                    {required && <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-1.5 py-0.5 rounded">Required</span>}
                </div>
                <code className="text-[12px] font-mono text-gray-500 dark:text-gray-400">{type}</code>
            </div>
        </td>
        <td className="py-4 align-top text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
            {description}
        </td>
    </tr>
);

const SectionTitle: React.FC<{ id: string; method?: string; path?: string; title?: string }> = ({ id, method, path, title }) => (
    <div id={id} className="scroll-mt-28 mb-6 pt-10 first:pt-0">
        {method && path ? (
            <div className="flex items-center gap-3 mb-2 flex-wrap">
                <MethodBadge method={method} />
                <h2 className="font-mono text-lg font-semibold text-gray-900 dark:text-white tracking-tight">{path}</h2>
            </div>
        ) : (
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">{title}</h2>
        )}
    </div>
);

const InteractiveCodeBlock: React.FC<{ children: React.ReactNode, copyText: string, className?: string }> = ({ children, copyText, className = "ml-7" }) => {
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
                className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer"
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

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar nav config
// ─────────────────────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
    {
        label: 'Getting Started',
        icon: <BookOpen size={15} />,
        items: [
            { id: 'introduction', label: 'Introduction' },
            { id: 'authentication', label: 'Authentication' },
            { id: 'base-url', label: 'Base URL & Versioning' },
            { id: 'errors', label: 'Error Codes' },
            { id: 'guidances', label: 'Best Practices & Guidances' },
        ],
    },
    {
        label: 'Articles',
        icon: <FileText size={15} />,
        items: [
            { id: 'list-articles', label: 'List Articles', method: 'GET' },
            { id: 'get-article', label: 'Get Article', method: 'GET' },
            { id: 'create-article', label: 'Create Article', method: 'POST' },
            { id: 'update-article', label: 'Update Article', method: 'PUT' },
            { id: 'delete-article', label: 'Delete Article', method: 'DELETE' },
        ],
    },
    {
        label: 'Users',
        icon: <KeyRound size={15} />,
        items: [
            { id: 'get-user', label: 'Get User', method: 'GET' },
            { id: 'list-users', label: 'List Authors', method: 'GET' },
        ],
    },
    {
        label: 'Integrations & Tools',
        icon: <Terminal size={15} />,
        items: [
            { id: 'integration-guide', label: 'MCP & CLI Guides' },
            { id: 'agent-rules', label: 'AI Agent Rules' },
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────

const ApiDocsPage: React.FC = () => {
    const [activeSection, setActiveSection] = useState('introduction');
    const [activeTab, setActiveTab] = useState<SetupTab>('cursor');
    const mainRef = useRef<HTMLDivElement>(null);

    // Highlight the active section as user scrolls
    useEffect(() => {
        const allIds = NAV_SECTIONS.flatMap(s => s.items.map(i => i.id));
        const observers: IntersectionObserver[] = [];

        allIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
                { rootMargin: '-20% 0px -75% 0px', threshold: 0 }
            );
            obs.observe(el);
            observers.push(obs);
        });

        return () => observers.forEach(o => o.disconnect());
    }, []);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        setActiveSection(id);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Top Header */}
            <header className="sticky top-0 z-30 h-14 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md flex items-center px-4 sm:px-6 gap-4">
                <button
                    onClick={() => navigate('/community')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                    <ArrowLeft size={16} /> Community
                </button>
                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-2">
                    <Code2 size={18} className="text-primary-600 dark:text-primary-400" />
                    <span className="font-bold text-gray-900 dark:text-white">API Reference</span>
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 rounded-full">v1</span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <a
                        href="https://github.com/jastalk/careervivid"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                        <ExternalLink size={14} /> GitHub
                    </a>
                </div>
            </header>

            <div className="flex">
                {/* ── Sticky Left Sidebar ─────────────────────────────────── */}
                <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-gray-100 dark:border-gray-800/60 py-8 px-4">
                    {NAV_SECTIONS.map(section => (
                        <div key={section.label} className="mb-8">
                            <div className="flex items-center gap-2 px-3 mb-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                {section.icon} {section.label}
                            </div>
                            <div className="flex flex-col gap-0.5">
                                {section.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => scrollTo(item.id)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-all duration-200 text-left cursor-pointer
                                            ${activeSection === item.id
                                                ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 font-medium'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                            }`}
                                    >
                                        {item.method && (
                                            <span className={`text-[10px] font-bold font-mono ${item.method === 'GET' ? 'text-blue-500' :
                                                item.method === 'POST' ? 'text-emerald-500' :
                                                    item.method === 'PUT' ? 'text-amber-500' :
                                                        'text-red-500'
                                                }`}>
                                                {item.method}
                                            </span>
                                        )}
                                        {item.label}
                                        {activeSection === item.id && <ChevronRight size={14} className="ml-auto text-primary-500 opacity-70" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </aside>

                {/* ── Main Content + Right Code Column ───────────────────── */}
                <div ref={mainRef} className="flex-1 min-w-0">
                    <div className="max-w-[1100px] mx-auto">

                        {/* ═══════════════════════════════════════════════════
                         INTRODUCTION
                        ═══════════════════════════════════════════════════ */}
                        <DocSection
                            left={
                                <>
                                    <SectionTitle id="introduction" title="Introduction" />
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                        The <strong>CareerVivid API</strong> is a RESTful HTTP API that allows developers to programmatically access community articles, user profiles, and job listings — the same data powering the CareerVivid web app.
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                        All responses are JSON. All timestamps are ISO 8601. The API follows the <a href="https://www.openapis.org/" className="text-primary-600 dark:text-primary-400 hover:underline">OpenAPI 3.0 specification</a>.
                                    </p>
                                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
                                        <strong>Note:</strong> This API is currently in <strong>Public Beta</strong>. Endpoints and schemas may change. Subscribe to our changelog for updates.
                                    </div>
                                </>
                            }
                            right={
                                <CodeSnippet
                                    title="Base URL"
                                    code={`https://api.careervivid.app/v1`}
                                />
                            }
                        />

                        <Divider />

                        {/* ═══════════════════════════════════════════════════
                         AUTHENTICATION
                        ═══════════════════════════════════════════════════ */}
                        <DocSection
                            left={
                                <>
                                    <SectionTitle id="authentication" title="Authentication" />
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                        All API requests require a personal API key. Pass your key in every request via the <code className="text-primary-600 dark:text-primary-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">api-key</code> HTTP header.
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                        You can generate an API key from your <strong>Profile → Settings → API Keys</strong> page. Keep your key secret — anyone with your key can act on your behalf.
                                    </p>
                                    <table className="w-full text-sm mb-0">
                                        <tbody>
                                            <ParamRow name="api-key" type="string (header)" required description="Your personal CareerVivid API key." />
                                        </tbody>
                                    </table>
                                </>
                            }
                            right={
                                <CodeSnippet
                                    title="cURL — Authenticated Request"
                                    code={`curl https://api.careervivid.app/v1/articles \\
  -H "api-key: cv_live_xxxxxxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json"`}
                                />
                            }
                        />

                        <Divider />

                        {/* ═══════════════════════════════════════════════════
                         BASE URL & VERSIONING
                        ═══════════════════════════════════════════════════ */}
                        <DocSection
                            left={
                                <>
                                    <SectionTitle id="base-url" title="Base URL & Versioning" />
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                        The API version is embedded in the path prefix (<code className="font-mono text-primary-600 dark:text-primary-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">/v1/</code>). We guarantee non-breaking changes within a version. When breaking changes are needed, a new version (e.g., <code className="font-mono text-sm">/v2/</code>) will be released.
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                        Old API versions remain available for at minimum <strong>12 months</strong> after a new version is released.
                                    </p>
                                </>
                            }
                            right={
                                <CodeSnippet
                                    title="Supported Versions"
                                    code={`# Current stable
https://api.careervivid.app/v1/

# Legacy (deprecated)
# https://api.careervivid.app/v0/`}
                                />
                            }
                        />

                        <Divider />

                        {/* ═══════════════════════════════════════════════════
                         ERROR CODES
                        ═══════════════════════════════════════════════════ */}
                        <DocSection
                            left={
                                <>
                                    <SectionTitle id="errors" title="Error Codes" />
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
                                        The API uses standard HTTP status codes. Errors always include a JSON body with <code className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">error</code> and <code className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">status</code> fields.
                                    </p>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="text-left py-2 pr-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                                <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Meaning</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                ['200 OK', 'Success'],
                                                ['201 Created', 'Resource created successfully'],
                                                ['400 Bad Request', 'Invalid parameters or missing required fields'],
                                                ['401 Unauthorized', 'Missing or invalid API key'],
                                                ['403 Forbidden', 'You don\'t have permission for this action'],
                                                ['404 Not Found', 'Resource not found'],
                                                ['422 Unprocessable', 'Validation errors on submitted data'],
                                                ['429 Too Many Requests', 'Rate limit exceeded — wait and retry'],
                                                ['500 Server Error', 'CareerVivid server error'],
                                            ].map(([status, meaning]) => (
                                                <tr key={status} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                                                    <td className="py-2.5 pr-4"><code className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100">{status}</code></td>
                                                    <td className="py-2.5 text-gray-600 dark:text-gray-400 text-sm">{meaning}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            }
                            right={
                                <CodeSnippet
                                    title="Error Response"
                                    code={`{
  "status": 401,
  "error": "Unauthorized",
  "message": "Missing or invalid API key."
}`}
                                />
                            }
                        />

                        <Divider />

                        {/* ═══════════════════════════════════════════════════
                         BEST PRACTICES & GUIDANCES
                        ═══════════════════════════════════════════════════ */}
                        <DocSection
                            left={
                                <>
                                    <SectionTitle id="guidances" title="Best Practices & Guidances" />
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                        To ensure a reliable and performant integration with the CareerVivid API, we recommend following these standard guidelines.
                                    </p>

                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2 mt-6">1. Rate Limiting</h4>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm mb-4">
                                        The API limits requests to <strong>100 requests per minute</strong> per API key. If you exceed this limit, you will receive a <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">429 Too Many Requests</code> response. Implement exponential backoff in your client to handle rate limits gracefully.
                                    </p>

                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2 mt-6">2. Pagination Strategy</h4>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm mb-4">
                                        Endpoints that return lists use page-based pagination. For rendering fast UIs, fetch pages sequentially using the <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">page</code> parameter. Do not request pages beyond <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">total_pages</code> as that will return empty arrays.
                                    </p>

                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2 mt-6">3. Idempotent Requests</h4>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                                        For <code className="font-mono text-xs font-bold text-emerald-500">POST</code> requests, consider sending an <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">Idempotency-Key</code> header to safely retry requests without accidentally performing the same operation twice (e.g., publishing duplicate articles).
                                    </p>
                                </>
                            }
                            right={
                                <>
                                    <CodeSnippet
                                        title="Handling Rate Limits (Node.js)"
                                        language="javascript"
                                        code={`async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    
    // Success
    if (res.status !== 429) return res;
    
    // Rate limited, wait and retry
    const delay = Math.pow(2, i) * 1000;
    console.warn(\`Rate limited. Retrying in \${delay}ms...\`);
    await new Promise(r => setTimeout(r, delay));
  }
  throw new Error("Max retries exceeded");
}`}
                                    />
                                    <div className="mt-4">
                                        <CodeSnippet
                                            title="Idempotency Header"
                                            code={`curl -X POST "https://api.careervivid.app/v1/articles" \\
  -H "api-key: cv_live_..." \\
  -H "Idempotency-Key: uuid-v4-generated-string" \\
  ...`}
                                        />
                                    </div>
                                </>
                            }
                        />

                        {/* ════════════════════════════════════════════════════
                         ARTICLES — SECTION HEADER
                        ════════════════════════════════════════════════════ */}
                        <div className="px-6 sm:px-10 py-6">
                            <div className="flex items-center gap-3 py-4">
                                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-4">Articles / Posts</span>
                                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                            </div>
                        </div>

                        {/* ═══════════════════════════════════════════════════
                         LIST ARTICLES
                        ═══════════════════════════════════════════════════ */}
                        <DocSection
                            left={
                                <>
                                    <SectionTitle id="list-articles" method="GET" path="/api/articles" />
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                        Retrieve a paginated list of the most recent published articles. Use query parameters to filter by tag, page, or results per page.
                                    </p>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Query Parameters</h4>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <ParamRow name="page" type="integer" description="Page number for pagination. Default: 1." />
                                            <ParamRow name="per_page" type="integer" description="Number of articles per page. Default: 10. Max: 50." />
                                            <ParamRow name="tag" type="string" description="Filter articles by a specific tag slug (e.g. react, system-design)." />
                                            <ParamRow name="author_id" type="string" description="Filter articles by the author's Firebase UID." />
                                            <ParamRow name="sort" type="string" description={`Sort order. Options: "latest" (default), "popular"`} />
                                        </tbody>
                                    </table>
                                </>
                            }
                            right={
                                <>
                                    <CodeSnippet
                                        title="cURL"
                                        code={`curl "https://api.careervivid.app/v1/articles?page=1&per_page=3&tag=react" \\
  -H "api-key: cv_live_xxxxxxxxxxxxxxxx"`}
                                    />
                                    <div className="mt-4">
                                        <CodeSnippet
                                            title="Response 200 OK"
                                            code={`{
  "articles": [
    {
      "id": "GNCDBKCcPQRNm8yOlBC8",
      "title": "Why Your React Portfolio Isn't Getting You Interviews",
      "slug": "why-your-react-portfolio-isnt-getting-you-interviews",
      "author": {
        "id": "seed_user_2",
        "name": "Maya Patel",
        "avatar": "https://i.pravatar.cc/150?u=maya_patel",
        "role": "Frontend Lead @ Netflix"
      },
      "tags": ["react", "portfolio", "career-advice"],
      "cover_image": "https://images.unsplash.com/photo-...",
      "read_time": 5,
      "metrics": {
        "likes": 234,
        "comments": 67,
        "views": 5120
      },
      "created_at": "2026-02-18T00:00:00.000Z",
      "updated_at": "2026-02-18T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 3,
    "total": 42
  }
}`}
                                        />
                                    </div>
                                </>
                            }
                        />

                        <Divider />

                        {/* ═══════════════════════════════════════════════════
                         GET ARTICLE
                        ═══════════════════════════════════════════════════ */}
                        <DocSection
                            left={
                                <>
                                    <SectionTitle id="get-article" method="GET" path="/api/articles/:id" />
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                        Retrieve a single article by its unique ID. This endpoint returns the full article including the <code className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">body_markdown</code> field, suitable for rendering in your own interface.
                                    </p>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Path Parameters</h4>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <ParamRow name=":id" type="string" required description="The unique Firestore document ID of the article." />
                                        </tbody>
                                    </table>
                                </>
                            }
                            right={
                                <>
                                    <CodeSnippet
                                        title="cURL"
                                        code={`curl "https://api.careervivid.app/v1/articles/GNCDBKCcPQRNm8yOlBC8" \\
  -H "api-key: cv_live_xxxxxxxxxxxxxxxx"`}
                                    />
                                    <div className="mt-4">
                                        <CodeSnippet
                                            title="Response 200 OK"
                                            code={`{
  "id": "GNCDBKCcPQRNm8yOlBC8",
  "title": "Why Your React Portfolio Isn't Getting You Interviews",
  "body_markdown": "## The Brutal Truth\\n\\nI've reviewed 200+ portfolios...",
  "author": {
    "id": "seed_user_2",
    "name": "Maya Patel",
    "avatar": "https://i.pravatar.cc/150?u=maya_patel",
    "role": "Frontend Lead @ Netflix"
  },
  "tags": ["react", "portfolio", "career-advice"],
  "cover_image": null,
  "read_time": 5,
  "metrics": {
    "likes": 234,
    "comments": 67,
    "views": 5121
  },
  "created_at": "2026-02-18T00:00:00.000Z",
  "updated_at": "2026-02-25T01:14:32.000Z"
}`}
                                        />
                                    </div>
                                </>
                            }
                        />

                        <Divider />

                        {/* ═══════════════════════════════════════════════════
                         CREATE ARTICLE
                        ═══════════════════════════════════════════════════ */}
                        <DocSection
                            left={
                                <>
                                    <SectionTitle id="create-article" method="POST" path="/api/articles" />
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                        Publish a new community article. The article will be attributed to the user whose <code className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">api-key</code> is provided. Read time is calculated automatically.
                                    </p>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Body Parameters (JSON)</h4>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <ParamRow name="title" type="string" required description="The article title. Maximum 250 characters." />
                                            <ParamRow name="body_markdown" type="string" required description="The full article content in Markdown format." />
                                            <ParamRow name="tags" type="string[]" description="Array of tag slugs. Maximum 4 tags. E.g. ['react', 'career']." />
                                            <ParamRow name="cover_image" type="string (URL)" description="A publicly accessible URL to use as the article's cover image." />
                                            <ParamRow name="published" type="boolean" description="Set to false to save as a draft. Default: true." />
                                        </tbody>
                                    </table>
                                </>
                            }
                            right={
                                <>
                                    <CodeSnippet
                                        title="cURL"
                                        code={`curl -X POST "https://api.careervivid.app/v1/articles" \\
  -H "api-key: cv_live_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Building Scalable React Apps in 2026",
    "body_markdown": "## Introduction\\n\\nScalability starts with...",
    "tags": ["react", "architecture", "performance"],
    "cover_image": "https://example.com/cover.jpg",
    "published": true
  }'`}
                                    />
                                    <div className="mt-4">
                                        <CodeSnippet
                                            title="Response 201 Created"
                                            code={`{
  "id": "newDocumentId123abc",
  "title": "Building Scalable React Apps in 2026",
  "slug": "building-scalable-react-apps-in-2026",
  "author": {
    "id": "uid_of_api_key_owner",
    "name": "Your Name"
  },
  "tags": ["react", "architecture", "performance"],
  "read_time": 3,
  "metrics": {
    "likes": 0,
    "comments": 0,
    "views": 0
  },
  "created_at": "2026-02-25T20:14:00.000Z"
}`}
                                        />
                                    </div>
                                </>
                            }
                        />

                        <Divider />

                        {/* ═══════════════════════════════════════════════════
                         UPDATE ARTICLE
                        ═══════════════════════════════════════════════════ */}
                        <DocSection
                            left={
                                <>
                                    <SectionTitle id="update-article" method="PUT" path="/api/articles/:id" />
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                        Update an existing article. You may only update articles you authored. All fields are optional — only provided fields will be updated.
                                    </p>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Body Parameters (JSON)</h4>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <ParamRow name="title" type="string" description="Updated article title." />
                                            <ParamRow name="body_markdown" type="string" description="Updated article body in Markdown." />
                                            <ParamRow name="tags" type="string[]" description="Replace all tags with this new array." />
                                            <ParamRow name="cover_image" type="string (URL)" description="Updated cover image URL. Pass null to remove." />
                                            <ParamRow name="published" type="boolean" description="Toggle published/draft state." />
                                        </tbody>
                                    </table>
                                </>
                            }
                            right={
                                <CodeSnippet
                                    title="Response 200 OK"
                                    code={`{
  "id": "GNCDBKCcPQRNm8yOlBC8",
  "title": "Updated Title Here",
  "updated_at": "2026-02-25T21:00:00.000Z",
  "message": "Article updated successfully."
}`}
                                />
                            }
                        />

                        <Divider />

                        {/* ═══════════════════════════════════════════════════
                         DELETE ARTICLE
                        ═══════════════════════════════════════════════════ */}
                        <DocSection
                            left={
                                <>
                                    <SectionTitle id="delete-article" method="DELETE" path="/api/articles/:id" />
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                        Permanently delete an article. This action is <strong>irreversible</strong>. You may only delete articles you authored. Admins may delete any article.
                                    </p>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Path Parameters</h4>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <ParamRow name=":id" type="string" required description="The unique Firestore document ID of the article to delete." />
                                        </tbody>
                                    </table>
                                </>
                            }
                            right={
                                <>
                                    <CodeSnippet
                                        title="cURL"
                                        code={`curl -X DELETE "https://api.careervivid.app/v1/articles/GNCDBKCcPQRNm8yOlBC8" \\
  -H "api-key: cv_live_xxxxxxxxxxxxxxxx"`}
                                    />
                                    <div className="mt-4">
                                        <CodeSnippet
                                            title="Response 204 No Content"
                                            code={`# Empty body returned on successful deletion`}
                                        />
                                    </div>
                                </>
                            }
                        />

                        {/* ════════════════════════════════════════════════════
                         USERS — SECTION HEADER
                        ════════════════════════════════════════════════════ */}
                        <div className="px-6 sm:px-10 py-6">
                            <div className="flex items-center gap-3 py-4">
                                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-4">Users</span>
                                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                            </div>
                        </div>

                        {/* ═══════════════════════════════════════════════════
                         GET USER
                        ═══════════════════════════════════════════════════ */}
                        <DocSection
                            left={
                                <>
                                    <SectionTitle id="get-user" method="GET" path="/api/users/:id" />
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                        Retrieve a public user profile by their CareerVivid UID or username. Returns publicly available profile information only.
                                    </p>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <ParamRow name=":id" type="string" required description="The user's Firebase UID or their CareerVivid username." />
                                        </tbody>
                                    </table>
                                </>
                            }
                            right={
                                <CodeSnippet
                                    title="Response 200 OK"
                                    code={`{
  "id": "seed_user_2",
  "name": "Maya Patel",
  "username": "mayapatel",
  "avatar": "https://i.pravatar.cc/150?u=maya_patel",
  "role": "Frontend Lead @ Netflix",
  "bio": "Building fast UIs at scale.",
  "article_count": 12,
  "joined_at": "2025-08-01T00:00:00.000Z",
  "portfolio_url": "https://careervivid.app/portfolio/mayapatel"
}`}
                                />
                            }
                        />

                        <Divider />

                        {/* ═══════════════════════════════════════════════════
                         LIST AUTHORS
                        ═══════════════════════════════════════════════════ */}
                        <DocSection
                            left={
                                <>
                                    <SectionTitle id="list-users" method="GET" path="/api/users" />
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                        Retrieve a list of active community authors. Useful for building author directories or contributor leaderboards.
                                    </p>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <ParamRow name="role" type="string" description={`Filter by role. Options: "author", "company"`} />
                                            <ParamRow name="per_page" type="integer" description="Number of users per page. Default: 10. Max: 30." />
                                        </tbody>
                                    </table>
                                </>
                            }
                            right={
                                <CodeSnippet
                                    title="Response 200 OK"
                                    code={`{
  "users": [
    {
      "id": "seed_user_2",
      "name": "Maya Patel",
      "username": "mayapatel",
      "avatar": "https://i.pravatar.cc/150?u=maya_patel",
      "role": "Frontend Lead @ Netflix",
      "article_count": 12
    },
    { "...": "..." }
  ],
  "meta": {
    "page": 1,
    "per_page": 10,
    "total": 38
  }
}`}
                                />
                            }
                        />

                        {/* ════════════════════════════════════════════════════
                         INTEGRATIONS & TOOLS — SECTION HEADER
                        ════════════════════════════════════════════════════ */}
                        <div className="px-6 sm:px-10 py-6">
                            <div className="flex items-center gap-3 py-4">
                                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-4">Integrations & Tools</span>
                                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                            </div>
                        </div>

                        {/* ═══════════════════════════════════════════════════
                         INTEGRATION GUIDE (MCP & CLI)
                        ═══════════════════════════════════════════════════ */}
                        <div id="integration-guide" className="scroll-mt-28 px-6 sm:px-10 mb-10 pt-10">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">AI Agent Integration</h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                Connect local AI coding assistants directly to your profile via the Model Context Protocol (MCP). Let agents sync new projects to your portfolio, generate architecture diagrams, and publish technical articles automatically.
                            </p>

                            {/* Login CTA Banner for Public Page */}
                            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-800/50 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                                        <KeyRound size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Need your real API Key?</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Log in to fetch your personal <code className="text-xs">cv_live_...</code> key for integration.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/developer')}
                                    className="shrink-0 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm cursor-pointer"
                                >
                                    Get API Key
                                </button>
                            </div>

                            <div className="bg-white dark:bg-[#0d1117] shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                                {/* Tabs Navigation */}
                                <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/80">
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
                                                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${isActive
                                                    ? 'border-primary-600 dark:border-primary-500 text-primary-700 dark:text-primary-400 bg-white dark:bg-[#0d1117]'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                                                    }`}
                                            >
                                                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Tab Content */}
                                <div className="p-6 sm:p-8 bg-white dark:bg-[#0a0c10]">

                                    {/* CURSOR OR CLAUDE TAB */}
                                    {(activeTab === 'cursor' || activeTab === 'claude') && (
                                        <div className="space-y-8">
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
                                                <InteractiveCodeBlock copyText={`"mcpServers": {\n  "careervivid": {\n    "command": "node",\n    "args": ["/absolute/path/to/careervivid/mcp-server/dist/index.js"],\n    "env": {\n      "CV_API_KEY": "YOUR_API_KEY",\n      "CV_API_URL": "https://careervivid.app/api/publish"\n    }\n  }\n}`}>
                                                    <span className="text-[#ff7b72]">"mcpServers"</span><span className="text-gray-300">: {`{`}</span>{'\n'}
                                                    <span className="text-[#79c0ff]">  "careervivid"</span><span className="text-gray-300">: {`{`}</span>{'\n'}
                                                    <span className="text-[#79c0ff]">    "command"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"node"</span><span className="text-gray-300">,</span>{'\n'}
                                                    <span className="text-[#79c0ff]">    "args"</span><span className="text-gray-300">: [</span><span className="text-[#a5d6ff]">"/absolute/path/to/careervivid/mcp-server/dist/index.js"</span><span className="text-gray-300">],</span>{'\n'}
                                                    <span className="text-[#79c0ff]">    "env"</span><span className="text-gray-300">: {`{`}</span>{'\n'}
                                                    <span className="text-[#79c0ff]">      "CV_API_KEY"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"YOUR_API_KEY"</span><span className="text-gray-300">,</span>{'\n'}
                                                    <span className="text-[#79c0ff]">      "CV_API_URL"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"https://careervivid.app/api/publish"</span>{'\n'}
                                                    <span className="text-gray-300">    {`}`}</span>{'\n'}
                                                    <span className="text-gray-300">  {`}`}</span>{'\n'}
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
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">1</span>
                                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Install the CLI</h4>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                                                    Install the official <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[13px]">careervivid</code> package globally. Once installed, the <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[13px]">cv</code> command will be available.
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
                                                    Securely save your API key to <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[13px]">~/.careervividrc.json</code>.
                                                </p>
                                                <InteractiveCodeBlock copyText={`cv auth set-key YOUR_API_KEY\n# verify it works\ncv auth check`}>
                                                    <span className="text-[#e2b93d]">cv auth</span><span className="text-gray-300"> set-key </span><span className="text-[#a5d6ff]">YOUR_API_KEY</span>{'\n'}
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
                                                    Publish markdown articles or mermaid diagrams right from your terminal.
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
                                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Portfolio Automation</h4>
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
                                        </div>
                                    )}

                                    {/* CUSTOM AGENT TAB */}
                                    {activeTab === 'custom' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                If you're building a custom script or using a framework like LangChain/CrewAI not running via MCP, use the standard REST endpoint.
                                            </p>

                                            <InteractiveCodeBlock className="!ml-0" copyText={`POST https://careervivid.app/api/publish\nx-api-key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "type": "article",\n  "dataFormat": "markdown",\n  "title": "My Article Title",\n  "content": "# Heading\\n\\nContent here...",\n  "tags": ["typescript", "architecture"],\n  "coverImage": "https://..."\n}`}>
                                                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#161b22]">
                                                    <span className="text-xs font-mono text-gray-400">POST /api/publish (Publishing Content)</span>
                                                </div>
                                                <span className="text-[#ff7b72]">POST</span><span className="text-gray-300"> https://careervivid.app/api/publish</span>{'\n'}
                                                <span className="text-[#79c0ff]">x-api-key</span><span className="text-gray-300">: YOUR_API_KEY</span>{'\n'}
                                                <span className="text-[#79c0ff]">Content-Type</span><span className="text-gray-300">: application/json</span>{'\n'}{'\n'}

                                                <span className="text-gray-300">{`{`}</span>{'\n'}
                                                <span className="text-[#79c0ff]">  "type"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"article"</span><span className="text-gray-300">,          </span><span className="text-gray-500">// article | whiteboard</span>{'\n'}
                                                <span className="text-[#79c0ff]">  "dataFormat"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"markdown"</span><span className="text-gray-300">,   </span><span className="text-gray-500">// markdown | mermaid</span>{'\n'}
                                                <span className="text-[#79c0ff]">  "title"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"My Article Title"</span><span className="text-gray-300">,</span>{'\n'}
                                                <span className="text-[#79c0ff]">  "content"</span><span className="text-gray-300">: </span><span className="text-[#a5d6ff]">"# Heading\\n\\nContent here..."</span><span className="text-gray-300">,</span>{'\n'}
                                                <span className="text-[#79c0ff]">  "tags"</span><span className="text-gray-300">: [</span><span className="text-[#a5d6ff]">"typescript"</span><span className="text-gray-300">, </span><span className="text-[#a5d6ff]">"architecture"</span><span className="text-gray-300">],</span>{'\n'}
                                                <span className="text-gray-300">{`}`}</span>
                                            </InteractiveCodeBlock>

                                            <InteractiveCodeBlock className="!ml-0 border-emerald-900/30 ring-1 ring-emerald-500/10" copyText={`PATCH https://careervivid.app/api/portfolio/projects\nx-api-key: YOUR_API_KEY\nContent-Type: application/json\n\n{\n  "portfolioId": "abc12345",\n  "projects": [\n    {\n      "title": "Auth microservice",\n      "description": "Led backend refactor"\n    }\n  ],\n  "techStack": ["go", "redis"]\n}`}>
                                                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#161b22]">
                                                    <span className="text-xs font-mono text-gray-400">PATCH /api/portfolio/projects (Syncing Data)</span>
                                                    <span className="px-2 py-0.5 text-[11px] rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">New</span>
                                                </div>
                                                <span className="text-[#ff7b72]">PATCH</span><span className="text-gray-300"> https://careervivid.app/api/portfolio/projects</span>{'\n'}
                                                <span className="text-[#79c0ff]">x-api-key</span><span className="text-gray-300">: YOUR_API_KEY</span>{'\n'}
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

                        {/* ═══════════════════════════════════════════════════
                         AI AGENT RULES
                        ═══════════════════════════════════════════════════ */}
                        <div id="agent-rules" className="scroll-mt-28 px-6 sm:px-10 pb-12 pt-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">AI Agent System Instructions</h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                Empower your AI editor with specialized knowledge. Copy these instructions into your agent's configuration file (or system prompt) to enable proactive, high-quality portfolio building.
                            </p>

                            <div className="bg-white dark:bg-[#0d1117] shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden p-6 sm:p-8">
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

                        {/* Footer padding */}
                        <div className="h-24" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Layout Helpers
// ─────────────────────────────────────────────────────────────────────────────

const DocSection: React.FC<{ left: React.ReactNode; right: React.ReactNode }> = ({ left, right }) => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 group">
        {/* Left — description */}
        <div className="px-6 sm:px-10 py-10 xl:py-12 xl:border-r border-gray-100 dark:border-gray-800/60 xl:pr-10">
            {left}
        </div>
        {/* Right — code blocks */}
        <div className="px-6 sm:px-10 xl:pl-10 py-8 xl:py-12 bg-[#f8f9fa] dark:bg-[#0a0c10]">
            {right}
        </div>
    </div>
);

const Divider: React.FC = () => (
    <div className="border-t border-gray-100 dark:border-gray-800/60 xl:hidden" />
);

export default ApiDocsPage;
