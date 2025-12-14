import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Loader2, Save, Mail, AlertCircle, Info } from 'lucide-react';
import { EmailPreferences } from '../types';

export default function EmailPracticeSettings() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const [preferences, setPreferences] = useState<EmailPreferences>({
        enabled: false,
        frequency: 'every_week',
        topicSource: 'smart',
        manualTopic: '',
    });

    useEffect(() => {
        const fetchPreferences = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (data.emailPreferences) {
                        setPreferences(data.emailPreferences);
                    }
                }
            } catch (error) {
                console.error("Error fetching email preferences:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPreferences();
    }, [currentUser]);

    const handleSave = async () => {
        if (!currentUser) return;
        setSaving(true);
        setStatus(null);

        // Validation for manual topic
        if (preferences.topicSource === 'manual' && !preferences.manualTopic.trim()) {
            setStatus({ type: 'error', msg: "Please enter a topic for manual selection." });
            setSaving(false);
            return;
        }

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                emailPreferences: preferences
            });
            setStatus({ type: 'success', msg: "Preferences saved successfully!" });

            // Clear success message after 3 seconds
            setTimeout(() => setStatus(null), 3000);
        } catch (error) {
            console.error("Error saving preferences:", error);
            setStatus({ type: 'error', msg: "Failed to save preferences." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-primary-500" /></div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-indigo-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Scheduled Practice Interviews</h2>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                Receive personalized practice interviews in your inbox. Stay sharp by practicing regularly.
            </p>

            <div className="space-y-6">
                {/* Enable Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <label htmlFor="enable-practice" className="font-medium text-gray-900 dark:text-gray-100 block">Enable Email Practice</label>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Receive practice interviews in your inbox.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            id="enable-practice"
                            className="sr-only peer"
                            checked={preferences.enabled}
                            onChange={(e) => setPreferences({ ...preferences, enabled: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                {preferences.enabled && (
                    <div className="space-y-6 animate-fade-in border-t border-gray-100 dark:border-gray-700 pt-6">
                        {/* Frequency */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frequency</label>
                            <select
                                value={preferences.frequency}
                                onChange={(e) => setPreferences({ ...preferences, frequency: e.target.value as any })}
                                className="w-full sm:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="daily">Daily</option>
                                <option value="every_3_days">Every 3 Days</option>
                                <option value="every_5_days">Every 5 Days</option>
                                <option value="every_week">Every Week</option>
                                <option value="every_10_days">Every 10 Days</option>
                                <option value="every_14_days">Every 2 Weeks</option>
                            </select>
                        </div>

                        {/* Topic Preference */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Topic Preference</label>
                            <div className="space-y-3">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="topicSource"
                                        value="smart"
                                        checked={preferences.topicSource === 'smart'}
                                        onChange={() => setPreferences({ ...preferences, topicSource: 'smart' })}
                                        className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">Smart Recommendation</span>
                                        <span className="block text-xs text-gray-500 dark:text-gray-400">Based on your latest resume and improved skills.</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="topicSource"
                                        value="manual"
                                        checked={preferences.topicSource === 'manual'}
                                        onChange={() => setPreferences({ ...preferences, topicSource: 'manual' })}
                                        className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                    />
                                    <div className="w-full">
                                        <span className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Choose a topic</span>
                                        {preferences.topicSource === 'manual' && (
                                            <input
                                                type="text"
                                                value={preferences.manualTopic}
                                                onChange={(e) => setPreferences({ ...preferences, manualTopic: e.target.value })}
                                                placeholder="e.g., Senior Software Engineer, Behavioral Questions"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                            />
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Status Message */}
                        {status && (
                            <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                                {status.type === 'success' ? <Info className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {status.msg}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {saving && <Loader2 className="animate-spin w-4 h-4" />}
                                Save Preferences
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
