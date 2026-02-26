import React, { useState } from 'react';
import { Copy, Check, Code2, Eye, Palette, Settings, ExternalLink } from 'lucide-react';
import { CompanyProfile, EmbedWidgetTheme, EmbedWidgetMode, EmbedFontFamily } from '../../types';

interface EmbedWidgetGeneratorProps {
    companyProfile: CompanyProfile | null;
    onSaveProfile: (profile: Partial<CompanyProfile>) => void;
}

const EmbedWidgetGenerator: React.FC<EmbedWidgetGeneratorProps> = ({
    companyProfile,
    onSaveProfile,
}) => {
    const [copied, setCopied] = useState(false);
    const [mode, setMode] = useState<EmbedWidgetMode>('inline');
    const [theme, setTheme] = useState<EmbedWidgetTheme>(companyProfile?.theme || 'minimalist');
    const [primaryColor, setPrimaryColor] = useState(companyProfile?.primaryColor || '#7c3aed');
    const [fontFamily, setFontFamily] = useState<EmbedFontFamily>(companyProfile?.fontFamily || 'inter');
    const [maxJobs, setMaxJobs] = useState(5);
    const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'branding'>('code');
    const [slug, setSlug] = useState(companyProfile?.slug || 'your-company');
    const [slugError, setSlugError] = useState('');
    const [previewJobs, setPreviewJobs] = useState<any[]>([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState('');

    const validateSlug = (value: string): boolean => {
        // Slug must be lowercase alphanumeric with hyphens, no spaces
        const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!value) {
            setSlugError('Slug cannot be empty');
            return false;
        }
        if (value.length < 3) {
            setSlugError('Slug must be at least 3 characters');
            return false;
        }
        if (value.length > 50) {
            setSlugError('Slug must be less than 50 characters');
            return false;
        }
        if (!slugPattern.test(value)) {
            setSlugError('Slug can only contain lowercase letters, numbers, and hyphens');
            return false;
        }
        setSlugError('');
        return true;
    };

    const handleSlugChange = (value: string) => {
        // Auto-format: convert to lowercase and replace invalid chars with hyphens
        const formatted = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
        setSlug(formatted);
        validateSlug(formatted);
    };

    const generateEmbedCode = () => {
        const attributes = [
            `src="https://careervivid.app/embed.js"`,
            `data-company="${slug}"`,
            `data-mode="${mode}"`,
            `data-theme="${theme}"`,
            `data-primary-color="${primaryColor}"`,
            `data-font="${fontFamily}"`,
            `data-max-jobs="${maxJobs}"`,
        ];

        return `<script ${attributes.join('\n       ')}></script>`;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generateEmbedCode());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Fetch real job data for preview
    const fetchPreviewJobs = async () => {
        if (!slug || slugError) return;

        setPreviewLoading(true);
        setPreviewError('');

        try {
            const response = await fetch(
                `https://us-west1-jastalk-firebase.cloudfunctions.net/getCompanyJobs?company=${slug}`
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch jobs');
            }

            const jobs = await response.json();
            setPreviewJobs(jobs);
        } catch (error) {
            console.error('Preview fetch error:', error);
            setPreviewError(error instanceof Error ? error.message : 'Failed to load jobs');
        } finally {
            setPreviewLoading(false);
        }
    };

    // Fetch jobs when preview tab is opened
    React.useEffect(() => {
        if (activeTab === 'preview') {
            fetchPreviewJobs();
        }
    }, [activeTab, slug]);

    const themeOptions: { id: EmbedWidgetTheme; name: string; description: string }[] = [
        { id: 'minimalist', name: 'Minimalist', description: 'Clean, light design' },
        { id: 'executive', name: 'Executive', description: 'Dark, professional look' },
        { id: 'creative', name: 'Creative (Neo Brutalism)', description: 'Bold colors & borders' },
    ];

    const fontOptions: { id: EmbedFontFamily; name: string }[] = [
        { id: 'system', name: 'System Default' },
        { id: 'inter', name: 'Inter' },
        { id: 'roboto', name: 'Roboto' },
        { id: 'outfit', name: 'Outfit' },
    ];

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Embed Job Widget</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Add your job listings to any website with a simple code snippet.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => setActiveTab('code')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'code'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Code2 size={16} />
                    Get Code
                </button>
                <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'preview'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Eye size={16} />
                    Preview
                </button>
                <button
                    onClick={() => setActiveTab('branding')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'branding'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Palette size={16} />
                    Branding
                </button>
            </div>

            {/* Content */}
            <div className="p-6">
                {activeTab === 'code' && (
                    <div className="space-y-6">
                        {/* Configuration */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Display Mode
                                </label>
                                <select
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value as EmbedWidgetMode)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    <option value="inline">Inline (in-page list)</option>
                                    <option value="floating">Floating (bottom-right widget)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Theme
                                </label>
                                <select
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value as EmbedWidgetTheme)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    {themeOptions.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Max Jobs to Show
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={maxJobs}
                                    onChange={(e) => setMaxJobs(parseInt(e.target.value) || 5)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Primary Color
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="w-12 h-10 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Code Block */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Embed Code
                                </label>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                    {copied ? 'Copied!' : 'Copy Code'}
                                </button>
                            </div>
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                <code>{generateEmbedCode()}</code>
                            </pre>
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                How to Use
                            </h4>
                            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                                <li>Copy the embed code above</li>
                                <li>Paste it into your website&apos;s HTML where you want jobs to appear</li>
                                <li>The widget will automatically load and display your published jobs</li>
                            </ol>
                        </div>
                    </div>
                )}

                {activeTab === 'preview' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Live preview of your published jobs
                            </p>
                            <button
                                onClick={fetchPreviewJobs}
                                disabled={previewLoading}
                                className="text-sm text-purple-600 hover:text-purple-700 disabled:opacity-50"
                            >
                                {previewLoading ? 'Loading...' : 'Refresh'}
                            </button>
                        </div>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 min-h-[300px]">
                            {/* Real widget preview */}
                            {previewLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading jobs...</p>
                                    </div>
                                </div>
                            ) : previewError ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <p className="text-sm text-red-600 dark:text-red-400">{previewError}</p>
                                        <button
                                            onClick={fetchPreviewJobs}
                                            className="mt-2 text-sm text-purple-600 hover:text-purple-700"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            ) : previewJobs.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">No jobs found for this company</p>
                                </div>
                            ) : (
                                <div className={`rounded-lg p-4 ${theme === 'executive' ? 'bg-gray-900' : 'bg-white'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`font-semibold ${theme === 'executive' ? 'text-white' : 'text-gray-900'}`}>
                                            Open Positions
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${theme === 'executive' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {previewJobs.length} opening{previewJobs.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {previewJobs.slice(0, maxJobs).map((job) => (
                                            <div
                                                key={job.id}
                                                className={`p-3 rounded-lg border ${theme === 'executive'
                                                    ? 'bg-gray-800 border-gray-700'
                                                    : 'bg-gray-50 border-gray-200'
                                                    }`}
                                            >
                                                <div className={`font-medium ${theme === 'executive' ? 'text-white' : 'text-gray-900'}`}>
                                                    {job.jobTitle}
                                                </div>
                                                <div className={`text-sm mt-1 ${theme === 'executive' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {job.location} • {job.employmentType.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'branding' && (
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Company Slug (URL)
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">careervivid.app/jobs/</span>
                                    <input
                                        type="text"
                                        value={slug}
                                        onChange={(e) => handleSlugChange(e.target.value)}
                                        className={`flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${slugError
                                            ? 'border-red-500 dark:border-red-500'
                                            : 'border-gray-300 dark:border-gray-700'
                                            }`}
                                        placeholder="your-company"
                                    />
                                </div>
                                {slugError ? (
                                    <p className="text-xs text-red-500 mt-1">
                                        {slugError}
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Only lowercase letters, numbers, and hyphens. Will auto-format as you type.
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Font Family
                                </label>
                                <select
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value as EmbedFontFamily)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    {fontOptions.map((f) => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Theme Preset
                            </label>
                            <div className="grid md:grid-cols-3 gap-4">
                                {themeOptions.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTheme(t.id)}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${theme === t.id
                                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="font-medium text-gray-900 dark:text-white">{t.name}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">{t.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    if (validateSlug(slug)) {
                                        onSaveProfile({ slug, theme, primaryColor, fontFamily });
                                    }
                                }}
                                disabled={!!slugError}
                                className={`px-4 py-2 rounded-lg transition-colors ${slugError
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                                    }`}
                            >
                                Save Branding Settings
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Public Page Link */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Your public job board:
                    </span>
                    <a
                        href={`https://careervivid.app/jobs/${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                    >
                        careervivid.app/jobs/{slug}
                        <ExternalLink size={12} />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default EmbedWidgetGenerator;
