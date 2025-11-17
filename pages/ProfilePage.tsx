import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useResumes } from '../hooks/useResumes';
import { usePracticeHistory } from '../hooks/useJobHistory';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { ArrowLeft, KeyRound, Trash2, Loader2, User as UserIcon, CreditCard, Mail } from 'lucide-react';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { EmailPreferences } from '../types';

const defaultEmailPrefs: EmailPreferences = {
    enabled: false,
    frequency: 'every_week',
    topicSource: 'smart',
    manualTopic: '',
};

const ProfilePage: React.FC = () => {
    const { currentUser, userProfile, updateUserProfile, logOut, isPremium } = useAuth();
    const { deleteAllResumes } = useResumes();
    const { deleteAllPracticeHistory } = usePracticeHistory();

    // Email Preferences state
    const [emailPrefs, setEmailPrefs] = useState<EmailPreferences>(defaultEmailPrefs);
    const [emailPrefsLoading, setEmailPrefsLoading] = useState(false);
    const [emailPrefsSuccess, setEmailPrefsSuccess] = useState('');

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    
    // Delete account state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    // Subscription management state
    const [portalLoading, setPortalLoading] = useState(false);
    const [portalError, setPortalError] = useState('');
    
    useEffect(() => {
        if (userProfile?.emailPreferences) {
            setEmailPrefs(userProfile.emailPreferences);
        }
    }, [userProfile]);

    const handleEmailPrefsChange = <K extends keyof EmailPreferences>(key: K, value: EmailPreferences[K]) => {
        setEmailPrefs(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveEmailPrefs = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailPrefsLoading(true);
        setEmailPrefsSuccess('');
        try {
            await updateUserProfile({ emailPreferences: emailPrefs });
            setEmailPrefsSuccess('Preferences saved successfully!');
            setTimeout(() => setEmailPrefsSuccess(''), 3000);
        } catch (error) {
            console.error("Failed to save email preferences:", error);
        } finally {
            setEmailPrefsLoading(false);
        }
    };


    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords don't match.");
            return;
        }
        if (!currentUser || !currentUser.email) {
            setPasswordError("Could not verify current user.");
            return;
        }

        setPasswordLoading(true);
        try {
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);
            await updatePassword(currentUser, newPassword);
            setPasswordSuccess("Password updated successfully!");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setPasswordError(error.message.replace('Firebase: ', ''));
        } finally {
            setPasswordLoading(false);
        }
    };
    
    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE' || !currentUser || !currentUser.email) return;

        setDeleteError('');
        setDeleteLoading(true);
        try {
            const credential = EmailAuthProvider.credential(currentUser.email, deletePassword);
            await reauthenticateWithCredential(currentUser, credential);
            
            // Delete all user data from Firestore
            await Promise.all([
                deleteAllResumes(),
                deleteAllPracticeHistory()
            ]);
            
            // Delete the user from Auth
            await deleteUser(currentUser);

            // Auth state will change and App.tsx will redirect to AuthPage
            logOut();

        } catch (error: any) {
             setDeleteError(error.message.replace('Firebase: ', ''));
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        setPortalLoading(true);
        setPortalError('');
        try {
            const createPortalLink = httpsCallable(functions, 'createPortalLink');
            const result: any = await createPortalLink();
            window.location.href = result.data.url;
        } catch (error: any) {
            console.error("Error creating portal link:", error);
            setPortalError(error.message.includes("No subscription found") 
                ? "You do not have a paid subscription to manage."
                : "Could not open management portal. Please try again later."
            );
        } finally {
            setPortalLoading(false);
        }
    };

    const DeleteConfirmationModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl transform transition-all">
                <h3 className="text-lg font-bold mb-4 text-red-600 dark:text-red-400">Permanently Delete Account</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    This action is irreversible. All of your resumes and interview history will be permanently deleted.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Please type <strong className="font-mono text-red-500">DELETE</strong> to confirm.
                </p>
                <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 bg-white dark:bg-gray-700"
                />
                 <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    For your security, please re-enter your password.
                </p>
                <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 bg-white dark:bg-gray-700"
                />
                {deleteError && <p className="text-red-500 text-sm mb-4">{deleteError}</p>}
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold text-sm">Cancel</button>
                    <button 
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE' || deleteLoading || !deletePassword}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold text-sm disabled:bg-red-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {deleteLoading && <Loader2 size={16} className="animate-spin" />}
                        {deleteLoading ? 'Deleting...' : 'Delete My Account'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            {isDeleteModalOpen && <DeleteConfirmationModal />}
            <header className="bg-white dark:bg-gray-800 shadow-sm dark:border-b dark:border-gray-700">
                <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
                    <a href="#/" title="Back to Dashboard" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ArrowLeft size={24} />
                    </a>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile Settings</h1>
                </div>
            </header>
            <main className="py-10">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-8">
                    {/* Account Info Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex items-center mb-4">
                            <UserIcon className="text-primary-500 h-6 w-6 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Account Information</h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                            <strong>Email:</strong> {currentUser?.email}
                        </p>
                        {currentUser?.providerData[0]?.providerId === 'google.com' && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                You are signed in with Google. To change your password, please manage it through your Google account.
                            </p>
                        )}
                    </div>

                    {/* Email Preferences Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex items-center mb-4">
                            <Mail className="text-primary-500 h-6 w-6 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Scheduled Practice Interviews</h2>
                        </div>
                        <form onSubmit={handleSaveEmailPrefs}>
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">Enable Email Practice</span>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive practice interviews in your inbox.</p>
                                </div>
                                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                    <input
                                        type="checkbox"
                                        checked={emailPrefs.enabled}
                                        onChange={(e) => handleEmailPrefsChange('enabled', e.target.checked)}
                                        className="checked:bg-primary-600 outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                    />
                                    <label className="block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"></label>
                                </div>
                            </label>

                            {emailPrefs.enabled && (
                                <div className="mt-6 space-y-4 border-t pt-4 border-gray-200 dark:border-gray-700">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                                        <select
                                            value={emailPrefs.frequency}
                                            onChange={(e) => handleEmailPrefsChange('frequency', e.target.value as EmailPreferences['frequency'])}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700"
                                        >
                                            <option value="daily">Every day</option>
                                            <option value="every_3_days">Every 3 days</option>
                                            <option value="every_5_days">Every 5 days</option>
                                            <option value="every_week">Every week</option>
                                            <option value="every_10_days">Every 10 days</option>
                                            <option value="every_14_days">Every 14 days</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Topic Preference</label>
                                        <div className="space-y-2">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="topicSource"
                                                    value="smart"
                                                    checked={emailPrefs.topicSource === 'smart'}
                                                    onChange={() => handleEmailPrefsChange('topicSource', 'smart')}
                                                    className="form-radio h-4 w-4 text-primary-600"
                                                />
                                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Smart Recommendation (based on latest resume)</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="topicSource"
                                                    value="manual"
                                                    checked={emailPrefs.topicSource === 'manual'}
                                                    onChange={() => handleEmailPrefsChange('topicSource', 'manual')}
                                                    className="form-radio h-4 w-4 text-primary-600"
                                                />
                                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Choose a topic</span>
                                            </label>
                                        </div>
                                    </div>
                                    {emailPrefs.topicSource === 'manual' && (
                                        <div>
                                            <input
                                                type="text"
                                                value={emailPrefs.manualTopic}
                                                onChange={(e) => handleEmailPrefsChange('manualTopic', e.target.value)}
                                                placeholder="e.g., Senior Software Engineer"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-6 flex items-center gap-4">
                                <button
                                    type="submit"
                                    disabled={emailPrefsLoading}
                                    className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-primary-700 flex items-center gap-2 disabled:bg-primary-300"
                                >
                                    {emailPrefsLoading && <Loader2 size={16} className="animate-spin" />}
                                    Save Preferences
                                </button>
                                {emailPrefsSuccess && <p className="text-sm text-green-600 dark:text-green-400">{emailPrefsSuccess}</p>}
                            </div>
                        </form>
                    </div>

                    {/* Change Password Section */}
                    {currentUser?.providerData[0]?.providerId === 'password' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <div className="flex items-center mb-4">
                                <KeyRound className="text-primary-500 h-6 w-6 mr-3" />
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Change Password</h2>
                            </div>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current Password" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" />
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" />
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" />
                                {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                                {passwordSuccess && <p className="text-green-500 text-sm">{passwordSuccess}</p>}
                                <button type="submit" disabled={passwordLoading} className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-primary-700 flex items-center gap-2 disabled:bg-primary-300">
                                     {passwordLoading && <Loader2 size={16} className="animate-spin" />}
                                    Update Password
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Manage Subscription Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex items-center mb-4">
                            <CreditCard className="text-primary-500 h-6 w-6 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Subscription</h2>
                        </div>
                         <div className="mb-4">
                            <p className="text-gray-600 dark:text-gray-300">
                                <strong>Current Plan:</strong> <span className="font-semibold text-primary-600 dark:text-primary-400">{isPremium ? 'Premium (Free Trial)' : 'Free'}</span>
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All features are currently available for free during our beta period.</p>
                        </div>
                        {portalError && <p className="text-red-500 text-sm mb-4">{portalError}</p>}
                        <button 
                            onClick={handleManageSubscription}
                            disabled={portalLoading}
                            className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center gap-2 disabled:opacity-50"
                        >
                            {portalLoading && <Loader2 size={16} className="animate-spin" />}
                            Manage Subscription
                        </button>
                    </div>

                    {/* Danger Zone Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-red-300 dark:border-red-700">
                        <div className="flex items-center mb-4">
                            <Trash2 className="text-red-500 h-6 w-6 mr-3" />
                            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Danger Zone</h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Permanently delete your account and all associated data, including resumes and interview history. This action cannot be undone.
                        </p>
                        <button 
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700"
                        >
                            Delete Account
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default ProfilePage;