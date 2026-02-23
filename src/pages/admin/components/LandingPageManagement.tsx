import React, { useState, useEffect } from 'react';
import { Save, ExternalLink, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { subscribeToLandingPageSettings, updateLandingPageSettings, DEFAULT_LANDING_PAGE_SETTINGS } from '../../../services/systemSettingsService';

const LandingPageManagement: React.FC = () => {
    const { currentUser } = useAuth();
    const [suffix, setSuffix] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [lastUpdated, setLastUpdated] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = subscribeToLandingPageSettings((settings) => {
            setSuffix(settings.featuredResumeSuffix || DEFAULT_LANDING_PAGE_SETTINGS.featuredResumeSuffix);
            setLastUpdated(settings.updatedAt);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async () => {
        if (!currentUser) return;
        setSaving(true);
        setMessage(null);

        // Basic validation
        // Should look like: shared/USER_ID/RESUME_ID
        // We strip leading slashes or domains if user pasted full URL
        let cleanSuffix = suffix.trim();
        if (cleanSuffix.startsWith('https://careervivid.app/')) {
            cleanSuffix = cleanSuffix.replace('https://careervivid.app/', '');
        }
        if (cleanSuffix.startsWith('/')) {
            cleanSuffix = cleanSuffix.substring(1);
        }
        // Remove hash if present (legacy compat)
        if (cleanSuffix.includes('/#/')) {
            cleanSuffix = cleanSuffix.replace('/#/', '/');
        }

        try {
            await updateLandingPageSettings({ featuredResumeSuffix: cleanSuffix }, currentUser.uid);
            setMessage({ type: 'success', text: 'Landing page updated successfully!' });
            setSuffix(cleanSuffix); // update input with cleaned version
        } catch (error) {
            console.error('Failed to update settings:', error);
            setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary-500" /></div>;

    const previewUrl = `https://careervivid.app/${suffix}`;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Landing Page Configuration</h2>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4">Featured Resume Link</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    This controls the interactive resume preview shown on the public Landing Page.
                    Enter the path suffix (e.g., <code>shared/USER_ID/RESUME_ID</code>).
                </p>

                <div className="space-y-4 max-w-2xl">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Resume Path Suffix
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={suffix}
                                onChange={(e) => setSuffix(e.target.value)}
                                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                                placeholder="shared/..."
                            />
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {message.text}
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Preview</h4>
                        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline flex items-center gap-1 text-sm break-all">
                            {previewUrl} <ExternalLink size={12} />
                        </a>
                        {lastUpdated && (
                            <p className="text-xs text-gray-400 mt-2">
                                Last updated: {lastUpdated?.toDate ? lastUpdated.toDate().toLocaleString() : 'Just now'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPageManagement;
