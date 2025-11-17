import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Shield, BarChart, Loader2, ChevronUp, ChevronDown, Star, MessageSquare, AlertTriangle } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, TrackEventType } from '../../types';
import AlertModal from '../../components/AlertModal';

// --- Cost Calculation Constants ---
const GEMINI_PRO_AVG_COST_PER_TOKEN = 0.00000875; // Avg of ($3.5 input + $10.5 output per 1M tokens) with 1:3 ratio
const GEMINI_FLASH_AVG_COST_PER_TOKEN = 0.000000875; // Avg of ($0.35 input + $1.05 output per 1M tokens) with 1:3 ratio
const IMAGE_GENERATION_COST = 0.0013; // per image
const LIVE_AUDIO_COST_PER_SECOND = 0.0004; // estimated $0.024/min for audio in/out + processing

const COST_MAP: Record<string, { perToken?: number, perEvent?: number, perSecond?: number }> = {
  // Pro Models (per token)
  'resume_parse_text': { perToken: GEMINI_PRO_AVG_COST_PER_TOKEN },
  'resume_parse_file': { perToken: GEMINI_PRO_AVG_COST_PER_TOKEN },
  'resume_generate_prompt': { perToken: GEMINI_PRO_AVG_COST_PER_TOKEN },
  'interview_analysis': { perToken: GEMINI_PRO_AVG_COST_PER_TOKEN, perSecond: LIVE_AUDIO_COST_PER_SECOND },

  // Flash Models (per token)
  'resume_suggestion': { perToken: GEMINI_FLASH_AVG_COST_PER_TOKEN },
  'ai_assistant_query': { perToken: GEMINI_FLASH_AVG_COST_PER_TOKEN },
  'question_generation': { perToken: GEMINI_FLASH_AVG_COST_PER_TOKEN },
  'job_parse_description': { perToken: GEMINI_FLASH_AVG_COST_PER_TOKEN },
  'job_prep_generation': { perToken: GEMINI_FLASH_AVG_COST_PER_TOKEN },
  'job_prep_regeneration': { perToken: GEMINI_FLASH_AVG_COST_PER_TOKEN },

  // Image Models (per event)
  'image_generation': { perEvent: IMAGE_GENERATION_COST },

  // Events without direct token cost (cost is 0)
  'sign_in': {}, 'sign_out': {}, 'interview_start': {}, 'resume_download': {}, 'checkout_session_start': {},
};


// --- Hooks ---
const useUsers = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, snapshot => {
            const usersFromDb = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
            setUsers(usersFromDb);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    return { users, loading, setUsers };
};

const useUsageLogs = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const logsCol = collection(db, 'usage_logs');
        const q = query(logsCol, orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, snapshot => {
            const logsFromDb = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setLogs(logsFromDb);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching usage logs:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    return { logs, loading };
};


// --- Components ---

const UserManagement: React.FC<{ logs: any[], users: UserProfile[], loading: boolean }> = ({ logs, users, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'email' | 'createdAt' | 'tokens' | 'cost'>('createdAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '' });

    const userTokenStats = useMemo(() => {
        const stats: Record<string, { total: number, byCategory: Record<string, number> }> = {};
        if (!users || !logs) return stats;

        users.forEach(user => {
            stats[user.uid] = { total: 0, byCategory: {} };
        });

        logs.forEach(log => {
            if (log.userId && stats[log.userId]) {
                const tokenUsage = typeof log.tokenUsage === 'number' ? log.tokenUsage : 0;
                let usage = tokenUsage;
                if (log.eventType === 'image_generation' && tokenUsage === 0) {
                  // image_generation is per event, count as 1 event if no tokens
                  usage = 1;
                }
                
                if (usage > 0) {
                    stats[log.userId].total += usage;
                    const category = log.eventType as TrackEventType;
                    stats[log.userId].byCategory[category] = (stats[log.userId].byCategory[category] || 0) + usage;
                }
            }
        });
        return stats;
    }, [users, logs]);

    const userCostStats = useMemo(() => {
        const stats: Record<string, { total: number, byCategory: Record<string, number> }> = {};
        if (!users || !logs) return stats;

        users.forEach(user => {
            stats[user.uid] = { total: 0, byCategory: {} };
        });

        logs.forEach(log => {
            if (log.userId && stats[log.userId]) {
                const category = log.eventType as TrackEventType;
                const costInfo = COST_MAP[category];
                if (!costInfo) return;

                let cost = 0;
                if (costInfo.perToken && typeof log.tokenUsage === 'number' && log.tokenUsage > 0) {
                    cost += log.tokenUsage * costInfo.perToken;
                }
                if (costInfo.perEvent) {
                    cost += costInfo.perEvent;
                }
                if (costInfo.perSecond && typeof log.durationInSeconds === 'number' && log.durationInSeconds > 0) {
                    cost += log.durationInSeconds * costInfo.perSecond;
                }

                if (cost > 0) {
                    stats[log.userId].total += cost;
                    stats[log.userId].byCategory[category] = (stats[log.userId].byCategory[category] || 0) + cost;
                }
            }
        });
        return stats;
    }, [users, logs]);

    const sortedAndFilteredUsers = useMemo(() => {
        let filtered = users.filter(user =>
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => {
            let compareA: any;
            let compareB: any;

            switch (sortBy) {
                case 'email':
                    compareA = a.email.toLowerCase();
                    compareB = b.email.toLowerCase();
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
    
    const handleUpdateUser = async (uid: string, data: Partial<UserProfile>) => {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, data);
    };
    
    const SortIndicator = ({ column }: { column: 'email' | 'createdAt' | 'tokens' | 'cost' }) => {
        if (sortBy !== column) return <span className="text-gray-400 opacity-50"><ChevronUp size={12} /><ChevronDown size={12} className="-mt-2"/></span>;
        return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div>;

    return (
        <div>
            <AlertModal 
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                onClose={() => setAlertState({ isOpen: false, title: '', message: '' })}
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
                        {sortedAndFilteredUsers.map(user => (
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
                                            onChange={(e) => handleUpdateUser(user.uid, { promotions: { ...user.promotions, isPremium: e.target.checked } })}
                                            className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                                        />
                                        <span className="ml-2">Premium</span>
                                    </label>
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
                                        className="text-red-600 hover:text-red-900" 
                                        onClick={() => setAlertState({ isOpen: true, title: 'Action Required', message: "User deletion must be handled via Firebase Console or backend functions for security." })}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Analytics: React.FC = () => {
    const { logs, loading } = useUsageLogs();
    const [demoStats, setDemoStats] = useState<{ 
        totalResumeGenerations?: number; 
        totalInterviewStarts?: number;
        convertedResumeUsers?: number;
        convertedInterviewUsers?: number;
    } | null>(null);
    const [demoStatsLoading, setDemoStatsLoading] = useState(true);

    useEffect(() => {
        const statsRef = doc(db, 'analytics', 'demo_page_events');
        const unsubscribe = onSnapshot(statsRef, (docSnap) => {
            if (docSnap.exists()) {
                setDemoStats(docSnap.data());
            } else {
                setDemoStats({ totalResumeGenerations: 0, totalInterviewStarts: 0, convertedResumeUsers: 0, convertedInterviewUsers: 0 });
            }
            setDemoStatsLoading(false);
        }, (error) => {
            console.error("Error fetching demo stats:", error);
            setDemoStatsLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    const aggregatedData = useMemo(() => {
        if (!logs.length) return { totalEvents: 0, totalCost: 0, sortedByType: [] };
        
        const byType: Record<string, { count: number, tokens: number, cost: number }> = {};
        let totalCost = 0;
        
        logs.forEach(log => {
            const category = log.eventType as TrackEventType;
            if (!COST_MAP[category]) return;

            if (!byType[category]) {
                byType[category] = { count: 0, tokens: 0, cost: 0 };
            }
            
            byType[category].count++;
            
            const tokenUsage = typeof log.tokenUsage === 'number' ? log.tokenUsage : 0;
            byType[category].tokens += tokenUsage;
            
            const costInfo = COST_MAP[category];
            let cost = 0;
            if (costInfo?.perToken && tokenUsage > 0) {
                cost += tokenUsage * costInfo.perToken;
            }
            if (costInfo?.perEvent) {
                cost += costInfo.perEvent;
            }
            if (costInfo?.perSecond && typeof log.durationInSeconds === 'number' && log.durationInSeconds > 0) {
                cost += log.durationInSeconds * costInfo.perSecond;
            }
            
            byType[category].cost += cost;
            totalCost += cost;
        });

        const sortedByType = Object.entries(byType).sort(([, aData], [, bData]) => bData.cost - aData.cost);
        
        return {
            totalEvents: logs.length,
            totalCost,
            sortedByType,
        };

    }, [logs]);

    const convertedResumeUsers = demoStats?.convertedResumeUsers || 0;
    const totalResumeGenerations = demoStats?.totalResumeGenerations || 0;
    const convertedInterviewUsers = demoStats?.convertedInterviewUsers || 0;
    const totalInterviewStarts = demoStats?.totalInterviewStarts || 0;

    const resumeConversionRate = totalResumeGenerations > 0 ? (convertedResumeUsers / totalResumeGenerations) * 100 : 0;
    const interviewConversionRate = totalInterviewStarts > 0 ? (convertedInterviewUsers / totalInterviewStarts) * 100 : 0;

    if (loading || demoStatsLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-2">Total Events Logged</h3>
                    <p className="text-4xl font-extrabold text-primary-500">{aggregatedData.totalEvents.toLocaleString()}</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg shadow border border-yellow-300 dark:border-yellow-700">
                    <h3 className="font-bold text-lg mb-2 text-yellow-800 dark:text-yellow-200">Total Estimated Cost</h3>
                    <p className="text-4xl font-extrabold text-yellow-600 dark:text-yellow-400">${aggregatedData.totalCost.toFixed(2)}</p>
                </div>

                {/* Resume Analytics */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-2">Demo Users (Signed Up - Resume)</h3>
                    <p className="text-4xl font-extrabold text-indigo-500">{convertedResumeUsers.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-2">Total Demo Resume Generations</h3>
                    <p className="text-4xl font-extrabold text-indigo-500/70">{totalResumeGenerations.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg shadow border border-green-300 dark:border-green-700">
                    <h3 className="font-bold text-lg mb-2 text-green-800 dark:text-green-200">Demo Resume Conversion Rate</h3>
                    <p className="text-4xl font-extrabold text-green-600 dark:text-green-400">{resumeConversionRate.toFixed(1)}%</p>
                </div>

                 {/* Interview Analytics */}
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-2">Demo Users (Signed Up - Interview)</h3>
                    <p className="text-4xl font-extrabold text-teal-500">{convertedInterviewUsers.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-2">Total Demo Interview Starts</h3>
                    <p className="text-4xl font-extrabold text-teal-500/70">{totalInterviewStarts.toLocaleString()}</p>
                </div>
                 <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg shadow border border-green-300 dark:border-green-700">
                    <h3 className="font-bold text-lg mb-2 text-green-800 dark:text-green-200">Demo Interview Conversion Rate</h3>
                    <p className="text-4xl font-extrabold text-green-600 dark:text-green-400">{interviewConversionRate.toFixed(1)}%</p>
                </div>
            </div>
             <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="font-bold text-lg mb-2">Usage & Cost by Category</h3>
                <div className="overflow-y-auto max-h-[40rem]">
                    <ul className="text-sm space-y-1">
                       {aggregatedData.sortedByType.map(([type, data]) => (
                            <li key={type} className="grid grid-cols-3 items-center p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                <span className="font-semibold col-span-1">{type}</span>
                                <div className="text-right text-gray-500 col-span-1">
                                    {data.count.toLocaleString()} events
                                    {data.tokens > 0 && ` / ${data.tokens.toLocaleString()} tokens`}
                                </div>
                                <strong className="text-right text-green-600 dark:text-green-400 col-span-1">
                                    ${data.cost.toFixed(4)}
                                </strong>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const FeedbackManagement: React.FC = () => {
    const [feedback, setFeedback] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const feedbackCol = collection(db, 'feedback');
        const q = query(feedbackCol, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, snapshot => {
            const feedbackFromDb = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setFeedback(feedbackFromDb);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching feedback:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (id: string, newStatus: string) => {
        const feedbackRef = doc(db, 'feedback', id);
        await updateDoc(feedbackRef, { status: newStatus });
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div>;
    
    const statusColors: { [key: string]: string } = {
        'New': 'bg-blue-100 text-blue-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        'Resolved': 'bg-green-100 text-green-800',
        'Archived': 'bg-gray-100 text-gray-800',
    };

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted At</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {feedback.map(item => (
                        <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.userEmail}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} className={i < item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                                    ))}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-sm truncate" title={item.comment}>
                                {item.comment || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {item.createdAt?.toDate().toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <select 
                                    value={item.status} 
                                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                    className={`p-1 rounded text-xs border-transparent focus:ring-2 focus:ring-primary-500 ${statusColors[item.status] || 'bg-gray-100'}`}
                                >
                                    <option value="New">New</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Archived">Archived</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ErrorManagement: React.FC = () => {
    const [errors, setErrors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedError, setSelectedError] = useState<any | null>(null);

    useEffect(() => {
        const errorsCol = collection(db, 'error_reports');
        const q = query(errorsCol, orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, snapshot => {
            const errorsFromDb = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setErrors(errorsFromDb);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching errors:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (id: string, newStatus: string) => {
        const errorRef = doc(db, 'error_reports', id);
        await updateDoc(errorRef, { status: newStatus });
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div>;
    
    const statusColors: { [key: string]: string } = {
        'New': 'bg-red-100 text-red-800',
        'Acknowledged': 'bg-yellow-100 text-yellow-800',
        'Resolved': 'bg-green-100 text-green-800',
    };

    return (
        <div>
            {selectedError && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl shadow-xl">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Error Details</h3>
                        <div className="text-sm space-y-2 mb-4">
                            <p><strong>Message:</strong> {selectedError.message}</p>
                            <p><strong>User:</strong> {selectedError.userEmail}</p>
                            <p><strong>URL:</strong> {selectedError.url}</p>
                        </div>
                        <h4 className="font-semibold mb-2">Stack Trace:</h4>
                        <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md text-xs overflow-auto max-h-60">
                            <code>{selectedError.stack || 'No stack trace available.'}</code>
                        </pre>
                        <div className="flex justify-end mt-6">
                            <button onClick={() => setSelectedError(null)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold text-sm">Close</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {errors.map(err => (
                            <tr key={err.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{err.userEmail || 'N/A'}</td>
                                <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400 max-w-md truncate">
                                    <button onClick={() => setSelectedError(err)} className="hover:underline">{err.message}</button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{err.url}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{err.timestamp?.toDate().toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select 
                                        value={err.status} 
                                        onChange={(e) => handleStatusChange(err.id, e.target.value)}
                                        className={`p-1 rounded text-xs border-transparent focus:ring-2 focus:ring-primary-500 ${statusColors[err.status] || 'bg-gray-100'}`}
                                    >
                                        <option value="New">New</option>
                                        <option value="Acknowledged">Acknowledged</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const AdminDashboardPage: React.FC = () => {
    const { logOut } = useAuth();
    const { users, loading: usersLoading } = useUsers();
    const { logs, loading: logsLoading } = useUsageLogs();
    const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'feedback' | 'error_reports'>('users');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'users': return <UserManagement users={users} logs={logs} loading={usersLoading || logsLoading} />;
            case 'analytics': return <Analytics />;
            case 'feedback': return <FeedbackManagement />;
            case 'error_reports': return <ErrorManagement />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary-500" />
                        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    </div>
                    <button onClick={logOut} className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-500">
                        Sign Out
                    </button>
                </div>
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                        <button onClick={() => setActiveTab('users')} className={`py-3 px-1 text-sm font-semibold flex items-center gap-2 ${activeTab === 'users' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}>
                            <User size={16} /> User Management
                        </button>
                        <button onClick={() => setActiveTab('analytics')} className={`py-3 px-1 text-sm font-semibold flex items-center gap-2 ${activeTab === 'analytics' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}>
                            <BarChart size={16} /> Analytics
                        </button>
                        <button onClick={() => setActiveTab('feedback')} className={`py-3 px-1 text-sm font-semibold flex items-center gap-2 ${activeTab === 'feedback' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}>
                            <MessageSquare size={16} /> Feedback
                        </button>
                        <button onClick={() => setActiveTab('error_reports')} className={`py-3 px-1 text-sm font-semibold flex items-center gap-2 ${activeTab === 'error_reports' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}>
                            <AlertTriangle size={16} /> Error Reports
                        </button>
                    </div>
                </nav>
            </header>
            <main className="py-10">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {renderTabContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboardPage;