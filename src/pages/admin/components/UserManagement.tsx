import React, { useState, useMemo, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { UserProfile, TrackEventType } from '../../../types';
import { COST_MAP } from '../adminConstants';
import PaginationControls from './PaginationControls';
import AlertModal from '../../../components/AlertModal';
import { Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';

const UserManagement: React.FC<{ logs: any[], users: UserProfile[], loading: boolean }> = ({ logs, users, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'email' | 'createdAt' | 'tokens' | 'cost'>('createdAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [alertState, setAlertState] = useState<{ isOpen: boolean, title: string, message: string }>({ isOpen: false, title: '', message: '' });

    // Calculate user usage stats (memoized)
    const { userTokenStats, userCostStats } = useMemo(() => {
        const tokenStats: Record<string, { total: number, byCategory: Record<string, number> }> = {};
        const costStats: Record<string, { total: number, byCategory: Record<string, number> }> = {};

        logs.forEach(log => {
            if (!log.userId) return;

            if (!tokenStats[log.userId]) tokenStats[log.userId] = { total: 0, byCategory: {} };
            if (!costStats[log.userId]) costStats[log.userId] = { total: 0, byCategory: {} };

            // Token Stats
            const tokens = typeof log.tokenUsage === 'number' ? log.tokenUsage : 0;
            tokenStats[log.userId].total += tokens;
            const category = log.eventType as string;
            tokenStats[log.userId].byCategory[category] = (tokenStats[log.userId].byCategory[category] || 0) + tokens;

            // Cost Stats
            const costInfo = COST_MAP[category as TrackEventType];
            let cost = 0;
            if (costInfo) {
                if (costInfo.perToken && tokens > 0) cost += tokens * costInfo.perToken;
                if (costInfo.perEvent) cost += costInfo.perEvent;
                if (costInfo.perSecond && typeof log.durationInSeconds === 'number' && log.durationInSeconds > 0) {
                    cost += log.durationInSeconds * costInfo.perSecond;
                }
            }
            costStats[log.userId].total += cost;
            costStats[log.userId].byCategory[category] = (costStats[log.userId].byCategory[category] || 0) + cost;
        });

        return { userTokenStats: tokenStats, userCostStats: costStats };
    }, [logs]);

    const handleUpdateUser = async (uid: string, data: Partial<UserProfile>) => {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, data);
    };

    const sortedAndFilteredUsers = useMemo(() => {
        let filtered = users.filter(user =>
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => {
            let compareA: any;
            let compareB: any;

            switch (sortBy) {
                case 'email':
                    compareA = (a.email || '').toLowerCase();
                    compareB = (b.email || '').toLowerCase();
                    break;
                case 'createdAt':
                    compareA = a.createdAt?.toMillis() || 0;
                    compareB = b.createdAt?.toMillis() || 0;
                    break;
                case 'tokens':
                    compareA = userTokenStats[a.uid]?.total || 0;
                    compareB = userTokenStats[b.uid]?.total || 0;
                    break;
                case 'cost':
                    compareA = userCostStats[a.uid]?.total || 0;
                    compareB = userCostStats[b.uid]?.total || 0;
                    break;
                default:
                    return 0;
            }

            if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
            if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [users, searchTerm, sortBy, sortDirection, userTokenStats, userCostStats]);

    const handleSort = (column: 'email' | 'createdAt' | 'tokens' | 'cost') => {
        if (sortBy === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('desc');
        }
    };

    const SortIndicator = ({ column }: { column: string }) => {
        if (sortBy !== column) return null;
        return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Reset page when search or sort changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy, sortDirection]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedAndFilteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedAndFilteredUsers, currentPage]);

    // Modal State for Partner Promotion
    const [promoteModal, setPromoteModal] = useState<{ isOpen: boolean, user: UserProfile | null }>({ isOpen: false, user: null });
    const [promoteDurationItems] = useState([1, 3, 6, 8, 12, 'Custom']); // Removed setPromoteDurationItems as it's unused
    const [selectedDuration, setSelectedDuration] = useState<number | string>(12);
    const [customDuration, setCustomDuration] = useState<number>(12);

    const openPromoteModal = (user: UserProfile) => {
        setSelectedDuration(12);
        setCustomDuration(12);
        setPromoteModal({ isOpen: true, user });
    };

    const handleConfirmPromote = async () => {
        if (!promoteModal.user) return;

        const finalDuration = selectedDuration === 'Custom' ? customDuration : (selectedDuration as number);

        // Validation
        if (typeof finalDuration !== 'number' || finalDuration <= 0) {
            alert("Please enter a valid duration in months.");
            return;
        }

        try {
            const grantRole = httpsCallable(functions, 'grantAcademicPartnerRole');
            await grantRole({ targetUserId: promoteModal.user.uid, durationInMonths: finalDuration });
            alert(`Success! ${promoteModal.user.email} is now an Academic Partner for ${finalDuration} months.`);
            // Optimistic update
            handleUpdateUser(promoteModal.user.uid, { role: 'academic_partner' });
            setPromoteModal({ isOpen: false, user: null });
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    const totalPages = Math.ceil(sortedAndFilteredUsers.length / ITEMS_PER_PAGE);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div>;

    return (
        <div>
            {promoteModal.isOpen && promoteModal.user && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Promote to Academic Partner</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Select the duration of Premium access for <strong>{promoteModal.user.email}</strong>.
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration (Months)</label>
                            <select
                                value={selectedDuration}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedDuration(val === 'Custom' ? 'Custom' : Number(val));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
                            >
                                {promoteDurationItems.map(item => (
                                    <option key={item} value={item}>{item === 'Custom' ? 'Custom' : `${item} Months`}</option>
                                ))}
                            </select>

                            {selectedDuration === 'Custom' && (
                                <div>
                                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Enter Months (Number)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={customDuration}
                                        onChange={(e) => setCustomDuration(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setPromoteModal({ isOpen: false, user: null })}
                                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmPromote}
                                className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-md font-medium"
                            >
                                Confirm Promotion
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState({ ...alertState, isOpen: false })}
                title={alertState.title}
                message={alertState.message}
            />
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by user email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th onClick={() => handleSort('email')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                                <div className="flex items-center gap-2">User <SortIndicator column="email" /></div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promotions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires At</th>
                            <th onClick={() => handleSort('createdAt')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                                <div className="flex items-center gap-2">Registered At <SortIndicator column="createdAt" /></div>
                            </th>
                            <th onClick={() => handleSort('tokens')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                                <div className="flex items-center gap-2">Total Tokens <SortIndicator column="tokens" /></div>
                            </th>
                            <th onClick={() => handleSort('cost')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                                <div className="flex items-center gap-2">Total Cost <SortIndicator column="cost" /></div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage Breakdown</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedUsers.map(user => (
                            <tr key={user.uid}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</div>
                                    <div className="text-sm text-gray-500">{user.uid}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={user.status}
                                        onChange={(e) => handleUpdateUser(user.uid, { status: e.target.value as 'active' | 'suspended' })}
                                        className={`p-1 rounded text-xs ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                    >
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={!!user.promotions?.isPremium}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                const updateData: any = {
                                                    promotions: { ...user.promotions, isPremium: isChecked }
                                                };
                                                // If granting premium manually, clear expiration and ensure active status to override any past cancellations
                                                if (isChecked) {
                                                    updateData.expiresAt = null;
                                                    updateData.plan = 'pro_monthly'; // Ensure they have a valid plan for UI
                                                    updateData.stripeSubscriptionStatus = 'active'; // Force active status
                                                    updateData.subscriptionStatus = 'active'; // Consistency with backend
                                                } else {
                                                    // If cancelling premium manually, fully downgrade the user
                                                    updateData.expiresAt = null;
                                                    updateData.plan = 'free';
                                                    updateData.stripeSubscriptionStatus = 'canceled';
                                                    updateData.subscriptionStatus = 'canceled';
                                                }
                                                handleUpdateUser(user.uid, updateData);
                                            }}
                                            className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                                        />
                                        <span className="ml-2">Premium</span>
                                    </label>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {(() => {
                                        const now = Date.now();
                                        const expiresAtMillis = user.expiresAt?.toMillis ? user.expiresAt.toMillis() : null;

                                        if (!expiresAtMillis) {
                                            // No expiration date
                                            if (user.promotions?.isPremium) {
                                                return <span className="text-green-600 dark:text-green-400 font-medium">Permanent</span>;
                                            }
                                            return <span className="text-gray-400">-</span>;
                                        }

                                        const isExpired = expiresAtMillis < now;
                                        const expirationDate = new Date(expiresAtMillis);
                                        const formattedDate = expirationDate.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        });

                                        return (
                                            <div className="flex flex-col">
                                                <span className={isExpired ? 'text-red-600 dark:text-red-400 font-medium' : 'text-blue-600 dark:text-blue-400 font-medium'}>
                                                    {formattedDate}
                                                </span>
                                                {isExpired && (
                                                    <span className="text-xs text-red-500">Expired</span>
                                                )}
                                                {!isExpired && (
                                                    <span className="text-xs text-gray-500">
                                                        {Math.ceil((expiresAtMillis - now) / (1000 * 60 * 60 * 24))} days left
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {user.createdAt?.toDate().toLocaleString() || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                                    {userTokenStats[user.uid]?.total.toLocaleString() || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                                    ${userCostStats[user.uid]?.total.toFixed(4) || '0.0000'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs">
                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                        {userTokenStats[user.uid] && Object.entries(userTokenStats[user.uid].byCategory)
                                            .sort(([, a], [, b]) => (b as number) - (a as number))
                                            .map(([cat, val]) => (
                                                <span key={cat} className="inline-block bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                                                    {cat}: {(cat === 'image_generation' ? val : (val as number).toLocaleString())}
                                                    {userCostStats[user.uid]?.byCategory[cat] && <span className="text-green-700 dark:text-green-400"> (~${(userCostStats[user.uid].byCategory[cat] as number).toFixed(4)})</span>}
                                                </span>
                                            ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        className="text-red-600 hover:text-red-900 mr-4"
                                        onClick={() => setAlertState({ isOpen: true, title: 'Action Required', message: "User deletion must be handled via Firebase Console or backend functions for security." })}
                                    >
                                        Delete
                                    </button>
                                    {!user.role || user.role === 'user' ? (
                                        <button
                                            className="text-blue-600 hover:text-blue-900"
                                            onClick={() => openPromoteModal(user)}
                                        >
                                            Promote to Partner
                                        </button>
                                    ) : (
                                        <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                            {user.role === 'academic_partner' ? 'Partner' : user.role}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};

export default UserManagement;
