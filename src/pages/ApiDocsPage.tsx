import React, { useState, useEffect, useRef } from 'react';
import { navigate } from '../utils/navigation';
import {
    ChevronRight, Copy, Check, ExternalLink,
    Code2, BookOpen, KeyRound, FileText, List, Search, PlusCircle, ArrowLeft
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Primitive components
// ─────────────────────────────────────────────────────────────────────────────

const METHOD_STYLES: Record<string, string> = {
    GET: 'bg-blue-600 text-white',
    POST: 'bg-emerald-600 text-white',
    PUT: 'bg-amber-500 text-white',
    PATCH: 'bg-amber-500 text-white',
    DELETE: 'bg-red-600 text-white',
};

const MethodBadge: React.FC<{ method: string }> = ({ method }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wider font-mono ${METHOD_STYLES[method] ?? 'bg-gray-600 text-white'}`}>
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
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            {title && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-mono uppercase tracking-wide">{title}</span>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        aria-label="Copy code"
                    >
                        {copied ? <><Check size={13} className="text-emerald-500" /> Copied</> : <><Copy size={13} /> Copy</>}
                    </button>
                </div>
            )}
            <pre className="bg-gray-950 dark:bg-black text-gray-100 p-5 overflow-x-auto text-sm leading-relaxed font-mono">
                <code>{code.trim()}</code>
            </pre>
        </div>
    );
};

const ParamRow: React.FC<{ name: string; type: string; required?: boolean; description: string }> = ({ name, type, required, description }) => (
    <tr className="border-b border-gray-100 dark:border-gray-800 last:border-0">
        <td className="py-3 pr-4 align-top">
            <div className="flex items-center gap-2">
                <code className="text-sm font-mono font-semibold text-primary-600 dark:text-primary-400">{name}</code>
                {required && <span className="text-xs font-bold text-red-500 uppercase tracking-wide">required</span>}
            </div>
        </td>
        <td className="py-3 pr-4 align-top">
            <code className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{type}</code>
        </td>
        <td className="py-3 align-top text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{description}</td>
    </tr>
);

const SectionTitle: React.FC<{ id: string; method?: string; path?: string; title?: string }> = ({ id, method, path, title }) => (
    <div id={id} className="scroll-mt-24 mb-6 pt-10 first:pt-0">
        {method && path ? (
            <div className="flex items-center gap-3 flex-wrap">
                <MethodBadge method={method} />
                <h2 className="font-mono text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{path}</h2>
            </div>
        ) : (
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{title}</h2>
        )}
    </div>
);

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
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────

const ApiDocsPage: React.FC = () => {
    const [activeSection, setActiveSection] = useState('introduction');
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
                <aside className="hidden lg:flex flex-col w-60 xl:w-72 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-gray-100 dark:border-gray-800 py-6 px-3">
                    {NAV_SECTIONS.map(section => (
                        <div key={section.label} className="mb-6">
                            <div className="flex items-center gap-2 px-3 mb-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                {section.icon} {section.label}
                            </div>
                            {section.items.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollTo(item.id)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left cursor-pointer
                                        ${activeSection === item.id
                                            ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-semibold'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900'
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
                                    {activeSection === item.id && <ChevronRight size={14} className="ml-auto text-primary-500" />}
                                </button>
                            ))}
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
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">
        {/* Left — description */}
        <div className="px-6 sm:px-10 py-8 xl:border-r border-gray-100 dark:border-gray-800 xl:pr-8">
            {left}
        </div>
        {/* Right — code blocks */}
        <div className="px-6 sm:px-10 xl:pl-8 py-8 bg-gray-50/50 dark:bg-gray-900/30">
            {right}
        </div>
    </div>
);

const Divider: React.FC = () => (
    <div className="border-t border-gray-100 dark:border-gray-800" />
);

export default ApiDocsPage;
