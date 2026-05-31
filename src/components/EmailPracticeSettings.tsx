import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bell, Info, Loader2, Mail, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { EmailPreferences } from '../types';

type EmailCategoryKey =
    | 'onboarding'
    | 'feature_spotlight'
    | 'weekly_digest'
    | 'practice'
    | 'advocacy';

const defaultPreferences: EmailPreferences = {
    enabled: false,
    frequency: 'every_week',
    topicSource: 'smart',
    manualTopic: '',
    disabled: false,
    categories: {
        onboarding: true,
        feature_spotlight: true,
        weekly_digest: true,
        practice: false,
        advocacy: true,
    },
};

const categoryRows: Array<{
    key: EmailCategoryKey;
    title: string;
    description: string;
}> = [
        {
            key: 'onboarding',
            title: 'Onboarding and workspace tips',
            description: 'Profile setup, resume context, and practical ways to keep your job-search workspace current.',
        },
        {
            key: 'feature_spotlight',
            title: 'Product and editor updates',
            description: 'Focused notes about AI editor workflows, resume improvements, and new workspace features.',
        },
        {
            key: 'weekly_digest',
            title: 'Weekly status digest',
            description: 'A compact summary of saved jobs, deadlines, interviews, and prep modules.',
        },
        {
            key: 'practice',
            title: 'Scheduled practice interviews',
            description: 'Personalized interview practice prompts when this track becomes available.',
        },
        {
            key: 'advocacy',
            title: 'Feedback and review requests',
            description: 'Occasional requests for product feedback, reviews, or research participation.',
        },
    ];

const mergePreferences = (incoming?: EmailPreferences): EmailPreferences => ({
    ...defaultPreferences,
    ...(incoming || {}),
    disabled: false,
    categories: {
        ...defaultPreferences.categories,
        ...(incoming?.categories || {}),
        practice: incoming?.categories?.practice ?? incoming?.enabled ?? defaultPreferences.categories?.practice,
    },
});

export default function EmailPracticeSettings() {
    const { userProfile, updateUserProfile } = useAuth();
    const [preferences, setPreferences] = useState<EmailPreferences>(() => mergePreferences(userProfile?.emailPreferences));
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    useEffect(() => {
        setPreferences(mergePreferences(userProfile?.emailPreferences));
    }, [userProfile?.emailPreferences]);

    const activeCount = useMemo(
        () => categoryRows.filter(row => preferences.categories?.[row.key] !== false).length,
        [preferences.categories]
    );

    const allOptionalPaused = useMemo(
        () => categoryRows.every(row => preferences.categories?.[row.key] === false),
        [preferences.categories]
    );

    const setCategory = (key: EmailCategoryKey, enabled: boolean) => {
        setPreferences(prev => ({
            ...prev,
            enabled: key === 'practice' ? enabled : prev.enabled,
            categories: {
                ...(prev.categories || {}),
                [key]: enabled,
            },
        }));
    };

    const setAllOptionalCategories = (enabled: boolean) => {
        setPreferences(prev => ({
            ...prev,
            disabled: false,
            enabled,
            categories: {
                ...(prev.categories || {}),
                ...Object.fromEntries(categoryRows.map(row => [row.key, enabled])),
            },
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus(null);

        try {
            await updateUserProfile({ emailPreferences: preferences });
            setStatus({ type: 'success', msg: 'Email settings saved.' });
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            console.error('Error saving email preferences:', error);
            setStatus({ type: 'error', msg: 'Email settings could not be saved.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="bg-white dark:bg-[#161b22] p-6 lg:p-8 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-shadow duration-300">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3f2ff] text-[#625bd5] dark:bg-primary-900/30 dark:text-primary-300">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Email notification settings</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
                            Choose which CareerVivid email tracks can reach your inbox. Account, security, and billing messages stay on.
                        </p>
                    </div>
                </div>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    <Bell className="h-3.5 w-3.5" />
                    {activeCount} active tracks
                </span>
            </div>

            <div className="mb-5 rounded-xl border border-amber-200/70 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20 px-4 py-3">
                <label className="flex items-start justify-between gap-4">
                    <span>
                        <span className="block text-sm font-bold text-gray-900 dark:text-gray-100">Pause optional lifecycle emails</span>
                        <span className="block text-xs leading-5 text-gray-600 dark:text-gray-400 mt-0.5">
                            Stops optional onboarding, feature, digest, practice, and feedback emails. Required account notifications are still sent.
                        </span>
                    </span>
                    <input
                        type="checkbox"
                        checked={allOptionalPaused}
                        onChange={event => setAllOptionalCategories(!event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-[#625bd5] focus:ring-[#625bd5]"
                    />
                </label>
            </div>

            <div className="grid gap-3">
                {categoryRows.map(row => {
                    const checked = preferences.categories?.[row.key] !== false;

                    return (
                        <label
                            key={row.key}
                            className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-[#c8c5f2] dark:border-gray-800 dark:bg-[#0f131a] dark:hover:border-primary-700/60"
                        >
                            <span className="min-w-0">
                                <span className="block text-sm font-bold text-gray-900 dark:text-gray-100">{row.title}</span>
                                <span className="block text-xs leading-5 text-gray-600 dark:text-gray-400 mt-0.5">{row.description}</span>
                            </span>
                            <span className="relative inline-flex items-center">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={event => setCategory(row.key, event.target.checked)}
                                    className="sr-only peer"
                                />
                                <span className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-[#625bd5] peer-focus-visible:ring-2 peer-focus-visible:ring-[#625bd5]/40 peer-disabled:opacity-50 dark:bg-gray-700 transition-colors" />
                                <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5 peer-disabled:opacity-70" />
                            </span>
                        </label>
                    );
                })}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <label className="block">
                    <span className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Digest frequency</span>
                    <select
                        value={preferences.frequency}
                        onChange={event => setPreferences(prev => ({ ...prev, frequency: event.target.value as EmailPreferences['frequency'] }))}
                        className="w-full sm:max-w-xs px-3 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-[#0a0c10] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#625bd5]/40"
                    >
                        <option value="daily">Daily</option>
                        <option value="every_3_days">Every 3 days</option>
                        <option value="every_5_days">Every 5 days</option>
                        <option value="every_week">Every week</option>
                        <option value="every_10_days">Every 10 days</option>
                        <option value="every_14_days">Every 2 weeks</option>
                    </select>
                </label>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#625bd5] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#514abf] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                    Save settings
                </button>
            </div>

            {status && (
                <div className={`mt-4 rounded-xl px-4 py-3 flex items-start gap-2 text-sm ${status.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                    }`}>
                    {status.type === 'success' ? <Info className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                    <span>{status.msg}</span>
                </div>
            )}
        </section>
    );
}
