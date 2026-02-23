import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useResumes } from '../hooks/useResumes';
import { usePracticeHistory } from '../hooks/useJobHistory';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { ArrowLeft, KeyRound, Trash2, Loader2, User as UserIcon, CreditCard, Mail } from 'lucide-react';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { EmailPreferences } from '../types';
import EmailPracticeSettings from '../components/EmailPracticeSettings';

const defaultEmailPrefs: EmailPreferences = {
    enabled: false,
    frequency: 'every_week',
    topicSource: 'smart',
    manualTopic: '',
};

const ProfilePage: React.FC = () => {
    const { currentUser, userProfile, updateUserProfile, logOut, isPremium } = useAuth();
    const { t } = useTranslation();
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

    // Upgrade Guide State
    const [showUpgradeGuide, setShowUpgradeGuide] = useState(() => {
        const step = localStorage.getItem('upgrade_guide_step');
        return step === '3';
    });

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
            setEmailPrefsSuccess(t('profile.preferences_saved'));
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
            setPasswordError(t('profile.password_mismatch'));
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
            setPasswordSuccess(t('profile.password_updated'));
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
                ? t('profile.no_subscription_found', "You do not have a paid subscription to manage.")
                : t('profile.portal_error', "Could not open management portal. Please try again later.")
            );
        } finally {
            setPortalLoading(false);
        }
    };

    const DeleteConfirmationModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl transform transition-all">
                <h3 className="text-lg font-bold mb-4 text-red-600 dark:text-red-400">{t('profile.delete_modal_title')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {t('profile.delete_modal_desc')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {t('profile.delete_modal_confirm')} <strong className="font-mono text-red-500">DELETE</strong>
                </p>
                <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 bg-white dark:bg-gray-700"
                />
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {t('profile.delete_modal_password')}
                </p>
                <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder={t('profile.current_password')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 bg-white dark:bg-gray-700"
                />
                {deleteError && <p className="text-red-500 text-sm mb-4">{deleteError}</p>}
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold text-sm">{t('common.cancel')}</button>
                    <button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE' || deleteLoading || !deletePassword}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold text-sm disabled:bg-red-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {deleteLoading && <Loader2 size={16} className="animate-spin" />}
                        {deleteLoading ? t('profile.deleting') : t('profile.delete_btn')}
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
                    <a href="/dashboard" title="Back to Dashboard" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ArrowLeft size={24} />
                    </a>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('profile.title')}</h1>
                </div>
            </header>
            <main className="py-10">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-8">
                    {/* Account Info Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex items-center mb-4">
                            <UserIcon className="text-primary-500 h-6 w-6 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('profile.account_info')}</h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                            <strong>{t('profile.email')}:</strong> {currentUser?.email}
                        </p>
                        {currentUser?.providerData[0]?.providerId === 'google.com' && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                {t('profile.google_signin_note')}
                            </p>
                        )}
                    </div>

                    {/* Email Preferences Section */}
                    <EmailPracticeSettings />

                    {/* Change Password Section */}
                    {currentUser?.providerData[0]?.providerId === 'password' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <div className="flex items-center mb-4">
                                <KeyRound className="text-primary-500 h-6 w-6 mr-3" />
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('profile.change_password')}</h2>
                            </div>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder={t('profile.current_password')} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" />
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t('profile.new_password')} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" />
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t('profile.confirm_password')} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" />
                                {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                                {passwordSuccess && <p className="text-green-500 text-sm">{passwordSuccess}</p>}
                                <button type="submit" disabled={passwordLoading} className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-primary-700 flex items-center gap-2 disabled:bg-primary-300">
                                    {passwordLoading && <Loader2 size={16} className="animate-spin" />}
                                    {t('profile.update_password')}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Manage Subscription Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex items-center mb-4">
                            <CreditCard className="text-primary-500 h-6 w-6 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('profile.payment_subscription')}</h2>
                        </div>
                        <div className="mb-4">
                            <p className="text-gray-600 dark:text-gray-300">
                                <strong>{t('profile.current_plan')}:</strong> <span className="font-semibold text-primary-600 dark:text-primary-400">
                                    {isPremium ? (
                                        userProfile?.plan === 'pro_sprint' ? t('profile.plan_sprint') :
                                            userProfile?.plan === 'pro_monthly' ? t('profile.plan_monthly') :
                                                t('profile.plan_premium')
                                    ) : t('profile.plan_free')}
                                </span>
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('profile.beta_note')}</p>
                        </div>
                        {portalError && <p className="text-red-500 text-sm mb-4">{portalError}</p>}
                        <a
                            href="/subscription"
                            onClick={() => {
                                localStorage.setItem('upgrade_guide_step', '4'); // Mark as done
                                setShowUpgradeGuide(false);
                            }}
                            className="relative inline-block bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            {t('profile.manage_subscription')}
                            {/* Animated Arrow Logic - Step 3 - Pointing Left from Right Side */}
                            {!isPremium && showUpgradeGuide && (
                                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 flex items-center gap-2 animate-bounce-horizontal">
                                    <svg className="w-8 h-8 text-orange-500 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                    <span className="text-orange-500 font-bold text-sm whitespace-nowrap hidden sm:block">Upgrade Here</span>
                                </div>
                            )}
                        </a>
                    </div>

                    {/* Danger Zone Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-red-300 dark:border-red-700">
                        <div className="flex items-center mb-4">
                            <Trash2 className="text-red-500 h-6 w-6 mr-3" />
                            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">{t('profile.danger_zone')}</h2>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            {t('profile.delete_account_desc')}
                        </p>
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700"
                        >
                            {t('profile.delete_account')}
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default ProfilePage;