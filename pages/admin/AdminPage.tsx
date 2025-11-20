import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Shield, BarChart, Loader2, ChevronUp, ChevronDown, Star, MessageSquare, AlertTriangle, Mail, FileText, PenTool, Trash2, Plus, X, Save, Eye, Wand2, Image as ImageIcon, UploadCloud, CheckCircle, Brush, Upload, Link as LinkIcon, Unlink, ExternalLink, Edit2, Check } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { UserProfile, TrackEventType, ContactMessage, BlogPost } from '../../types';
import AlertModal from '../../components/AlertModal';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AIImprovementPanel from '../../components/AIImprovementPanel';
import AIImageEditModal from '../../components/AIImageEditModal';
import AutoResizeTextarea from '../../components/AutoResizeTextarea';
import { uploadImage, dataURLtoBlob } from '../../services/storageService';


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
                {/* ... rest of analytics UI ... */}
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
     // ... (FeedbackManagement component code remains the same)
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
    // ... (ErrorManagement component code remains the same)
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


// --- NEW COMPONENTS FOR MESSAGES & BLOGS ---

const MessagesManagement: React.FC = () => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

    useEffect(() => {
        const messagesCol = collection(db, 'contact_messages');
        const q = query(messagesCol, orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
            setMessages(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const toggleStatus = async (msg: ContactMessage) => {
        const newStatus = msg.status === 'read' ? 'unread' : 'read';
        await updateDoc(doc(db, 'contact_messages', msg.id), { status: newStatus });
    };

    if (loading) return <Loader2 className="animate-spin mx-auto" />;

    return (
        <div>
            {selectedMessage && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-xl shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedMessage.subject}</h3>
                            <button onClick={() => setSelectedMessage(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="text-sm text-gray-500 mb-4 flex justify-between">
                            <span>From: {selectedMessage.name} ({selectedMessage.email})</span>
                            <span>{selectedMessage.timestamp?.toDate().toLocaleString()}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-6">
                            {selectedMessage.message}
                        </div>
                        <div className="flex justify-end">
                            <button onClick={() => { toggleStatus(selectedMessage); setSelectedMessage(null); }} className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium text-sm">
                                Mark as {selectedMessage.status === 'read' ? 'Unread' : 'Read'} & Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {messages.map(msg => (
                            <tr key={msg.id} className={msg.status === 'unread' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${msg.status === 'unread' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {msg.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {msg.name}
                                    <br/>
                                    <span className="text-gray-500 font-normal">{msg.email}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                    {msg.subject}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {msg.timestamp?.toDate().toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => setSelectedMessage(msg)} className="text-primary-600 hover:text-primary-900 mr-4">View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Reusable Section Component to match Resume Builder style
const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8 p-6 bg-white dark:bg-gray-800/50 dark:border dark:border-gray-700 rounded-lg shadow-md">
    <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">{title}</h2>
    {children}
  </div>
);

const LinkManagerCard = ({ link, onUpdate, onUnlink, onRemove }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(link.text);
    const [url, setUrl] = useState(link.url);

    useEffect(() => {
        if (!isEditing) {
            setText(link.text);
            setUrl(link.url);
        }
    }, [link, isEditing]);

    const handleSave = () => {
        onUpdate(text, url);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setText(link.text);
        setUrl(link.url);
        setIsEditing(false);
    };

    return (
        <div className="p-3 mb-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
            {isEditing ? (
                <div className="space-y-2">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Text</label>
                        <input className="w-full p-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500" value={text} onChange={e => setText(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">URL</label>
                        <input className="w-full p-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500" value={url} onChange={e => setUrl(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={handleCancel} className="p-1 text-gray-500 hover:text-gray-700"><X size={14}/></button>
                        <button onClick={handleSave} className="p-1 text-green-500 hover:text-green-700"><Check size={14}/></button>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-primary-600 dark:text-primary-400 truncate pr-2" title={link.text}>{link.text}</span>
                        <div className="flex gap-1 shrink-0">
                            <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-blue-500" title="Edit"><Edit2 size={12} /></button>
                            <button onClick={onUnlink} className="p-1 text-gray-400 hover:text-orange-500" title="Unlink"><Unlink size={12} /></button>
                            <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500" title="Delete"><Trash2 size={12} /></button>
                        </div>
                    </div>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 hover:underline truncate">
                        <ExternalLink size={10} /> {link.url}
                    </a>
                </div>
            )}
        </div>
    )
}

const LinkManager = ({ content, onUpdateContent }: { content: string, onUpdateContent: (c: string) => void }) => {
    const links = useMemo(() => {
        const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const results = [];
        let match;
        while ((match = regex.exec(content)) !== null) {
            results.push({
                index: match.index,
                fullMatch: match[0],
                text: match[1],
                url: match[2]
            });
        }
        return results;
    }, [content]);

    const updateLink = (index: number, newText: string, newUrl: string) => {
        const link = links[index];
        const before = content.substring(0, link.index);
        const after = content.substring(link.index + link.fullMatch.length);
        onUpdateContent(`${before}[${newText}](${newUrl})${after}`);
    };

    const unlink = (index: number) => {
        const link = links[index];
        const before = content.substring(0, link.index);
        const after = content.substring(link.index + link.fullMatch.length);
        onUpdateContent(`${before}${link.text}${after}`);
    };

    const removeLink = (index: number) => {
        const link = links[index];
        const before = content.substring(0, link.index);
        const after = content.substring(link.index + link.fullMatch.length);
        onUpdateContent(`${before}${after}`);
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 border-l dark:border-gray-700 h-full flex flex-col">
            <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <LinkIcon size={16}/> Link Inspector <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs">{links.length}</span>
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {links.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center italic mt-4">No links found in content.</p>
                ) : (
                    links.map((link, i) => (
                        <LinkManagerCard 
                            key={`${link.index}-${link.text}`}
                            link={link}
                            onUpdate={(t: string, u: string) => updateLink(i, t, u)}
                            onUnlink={() => unlink(i)}
                            onRemove={() => removeLink(i)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

const BlogEditor: React.FC<{ post?: BlogPost; onSave: () => void; onCancel: () => void }> = ({ post, onSave, onCancel }) => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState<Partial<BlogPost>>({
        title: '',
        category: 'Career Advice',
        excerpt: '',
        content: '',
        coverImage: '',
        author: 'CareerVivid Team'
    });
    
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '' });
    const [activeAIField, setActiveAIField] = useState<string | null>(null);
    const [isImageEditModalOpen, setIsImageEditModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (post) setFormData(post);
    }, [post]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setTempImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content) {
            setAlertState({ isOpen: true, title: 'Validation Error', message: 'Title and Content are required.' });
            return;
        }

        setLoading(true);
        try {
            let coverImageUrl = formData.coverImage;

            if (tempImage && currentUser) {
                 const blob = dataURLtoBlob(tempImage);
                 if (!blob) throw new Error("Failed to process image.");
                 const path = `public/blog_assets/blog_${Date.now()}_cover.png`;
                 coverImageUrl = await uploadImage(blob, path);
            }

            const postData = {
                ...formData,
                coverImage: coverImageUrl,
                updatedAt: serverTimestamp()
            };

            if (!post) {
                // New Post
                await addDoc(collection(db, 'blog_posts'), {
                    ...postData,
                    publishedAt: serverTimestamp()
                });
            } else {
                // Update Post
                await updateDoc(doc(db, 'blog_posts', post.id), postData);
            }
            onSave();
        } catch (error: any) {
            console.error("Error saving post:", error);
             setAlertState({ isOpen: true, title: 'Save Failed', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const toggleAI = (field: string) => setActiveAIField(activeAIField === field ? null : field);
    
    const displayImage = tempImage || formData.coverImage;

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen pb-20">
             <AlertModal 
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                onClose={() => setAlertState({ isOpen: false, title: '', message: '' })}
            />

            {/* AI Image Editor Modal */}
            {isImageEditModalOpen && displayImage && currentUser && (
                <AIImageEditModal
                    userId={currentUser.uid}
                    currentPhoto={displayImage}
                    onClose={() => setIsImageEditModalOpen(false)}
                    onSave={(newUrl) => {
                         setFormData({ ...formData, coverImage: newUrl });
                         setTempImage(null);
                    }}
                    onUseTemp={(dataUrl) => setTempImage(dataUrl)}
                    onError={(t, m) => setAlertState({ isOpen: true, title: t, message: m })}
                    savePath={`public/blog_assets/blog_${Date.now()}_edited.png`}
                    promptOptions={[
                        'Modern tech workspace',
                        'Minimalist document layout',
                        'Professional writing desk',
                        'Bright office environment',
                        'Abstract career concept art',
                        'Soft lighting and clean background'
                    ]}
                />
            )}

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{post ? 'Edit Blog Post' : 'New Blog Post'}</h1>
                    <div className="flex gap-3">
                        <button onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                        <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 flex items-center gap-2">
                            {loading && <Loader2 className="animate-spin" size={18}/>}
                            Save & Publish
                        </button>
                    </div>
                </div>

                <FormSection title="Post Details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Title</label>
                            <input 
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                            <button onClick={() => toggleAI('title')} className="mt-2 flex items-center gap-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"><Wand2 size={14}/> Improve Title with AI</button>
                             {activeAIField === 'title' && currentUser && (
                                <AIImprovementPanel
                                    userId={currentUser.uid}
                                    sectionName="Blog Title"
                                    currentText={formData.title || ''}
                                    language="English"
                                    onAccept={(text) => { setFormData({ ...formData, title: text }); setActiveAIField(null); }}
                                    onClose={() => setActiveAIField(null)}
                                    onError={(t, m) => setAlertState({ isOpen: true, title: t, message: m })}
                                    contextType="blog post"
                                />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Category</label>
                            <select 
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option>Career Advice</option>
                                <option>Resume Tips</option>
                                <option>Interview Prep</option>
                                <option>Tech Trends</option>
                                <option>Job Search Strategies</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Excerpt (Short Summary)</label>
                             <textarea 
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                rows={3}
                                value={formData.excerpt}
                                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                            />
                             <button onClick={() => toggleAI('excerpt')} className="mt-2 flex items-center gap-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"><Wand2 size={14}/> Improve Excerpt with AI</button>
                             {activeAIField === 'excerpt' && currentUser && (
                                <AIImprovementPanel
                                    userId={currentUser.uid}
                                    sectionName="Blog Excerpt"
                                    currentText={formData.excerpt || ''}
                                    language="English"
                                    onAccept={(text) => { setFormData({ ...formData, excerpt: text }); setActiveAIField(null); }}
                                    onClose={() => setActiveAIField(null)}
                                    onError={(t, m) => setAlertState({ isOpen: true, title: t, message: m })}
                                    contextType="blog post"
                                />
                            )}
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Media">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                         <div className="w-full md:w-64 aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center border border-gray-300 dark:border-gray-600">
                            {displayImage ? (
                                <img src={displayImage} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center">
                                    <ImageIcon size={32} />
                                    <span className="text-xs mt-2">No Image</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-grow">
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Cover Image</label>
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                            />
                            <div className="flex flex-wrap gap-3">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2 text-sm font-medium"
                                >
                                    <UploadCloud size={16}/> {displayImage ? 'Change Image' : 'Upload Image'}
                                </button>
                                {displayImage && (
                                    <>
                                        <button 
                                            onClick={() => setIsImageEditModalOpen(true)}
                                            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/40 flex items-center gap-2 text-sm font-medium"
                                        >
                                            <Brush size={16}/> Edit with AI
                                        </button>
                                        <button 
                                            onClick={() => { setFormData({...formData, coverImage: ''}); setTempImage(null); }}
                                            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center gap-2 text-sm font-medium"
                                        >
                                            <Trash2 size={16}/> Remove
                                        </button>
                                    </>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Recommended size: 1200×630px. Supported formats: JPG, PNG.</p>
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Content">
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Post Body (Markdown Supported)</label>
                        <div className="flex flex-col xl:flex-row gap-6 items-start">
                            {/* Main Editor Column */}
                            <div className="flex-grow w-full">
                                <AutoResizeTextarea 
                                    required 
                                    className="w-full p-4 border rounded-md dark:bg-gray-700 dark:border-gray-600 font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm" 
                                    value={formData.content || ''} 
                                    onChange={e => setFormData({ ...formData, content: e.target.value })} 
                                    placeholder="# Introduction..." 
                                    minHeight={500}
                                    maxHeight={800}
                                />
                                
                                <button 
                                    type="button"
                                    onClick={() => toggleAI('content')} 
                                    className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                                >
                                    <Wand2 size={16}/> Improve Content with AI
                                </button>
                                
                                {activeAIField === 'content' && currentUser && (
                                    <AIImprovementPanel
                                        userId={currentUser.uid}
                                        sectionName="Blog Content"
                                        currentText={formData.content || ''}
                                        language="English"
                                        onAccept={(text) => {
                                            setFormData({ ...formData, content: text });
                                            setActiveAIField(null);
                                        }}
                                        onClose={() => setActiveAIField(null)}
                                        onError={(t, m) => setAlertState({ isOpen: true, title: t, message: m })}
                                        contextType="blog post"
                                    />
                                )}
                            </div>

                            {/* Link Manager Sidebar Column */}
                            <div className="w-full xl:w-80 flex-shrink-0 xl:sticky xl:top-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                                <LinkManager content={formData.content || ''} onUpdateContent={(c) => setFormData({...formData, content: c})} />
                            </div>
                        </div>
                    </div>
                </FormSection>
            </div>
        </div>
    );
};

const BlogManagement: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState<BlogPost | undefined>(undefined);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    useEffect(() => {
        const postsCol = collection(db, 'blog_posts');
        const q = query(postsCol, orderBy('publishedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
            setPosts(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string) => {
        if(window.confirm('Delete this post?')) {
            await deleteDoc(doc(db, 'blog_posts', id));
        }
    };

    if (isEditorOpen) {
        return <BlogEditor post={editingPost} onSave={() => setIsEditorOpen(false)} onCancel={() => setIsEditorOpen(false)} />;
    }
    
    if (loading) return <Loader2 className="animate-spin mx-auto" />;

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={() => { setEditingPost(undefined); setIsEditorOpen(true); }} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-700">
                    <Plus size={20}/> New Post
                </button>
            </div>
            <div className="space-y-4">
                {posts.map(post => (
                    <div key={post.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{post.title}</h3>
                            <p className="text-sm text-gray-500">{post.category} • {post.publishedAt?.toDate().toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                            <a 
                                href={`#/blog/${post.id}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                                title="View Live Post"
                            >
                                <Eye size={18}/>
                            </a>
                            <button onClick={() => { setEditingPost(post); setIsEditorOpen(true); }} className="p-2 text-gray-500 hover:text-primary-600" title="Edit"><PenTool size={18}/></button>
                            <button onClick={() => handleDelete(post.id)} className="p-2 text-gray-500 hover:text-red-600" title="Delete"><Trash2 size={18}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// --- Main Dashboard ---
const AdminDashboardPage: React.FC = () => {
    const { logOut } = useAuth();
    const { users, loading: usersLoading } = useUsers();
    const { logs, loading: logsLoading } = useUsageLogs();
    const [activeTab, setActiveTab] = useState('users');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'users': return <UserManagement users={users} logs={logs} loading={usersLoading || logsLoading} />;
            case 'analytics': return <Analytics />;
            case 'messages': return <MessagesManagement />;
            case 'blog': return <BlogManagement />;
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
                    <button onClick={logOut} className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-500">Sign Out</button>
                </div>
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    {[
                        { id: 'users', label: 'Users', icon: User },
                        { id: 'analytics', label: 'Analytics', icon: BarChart },
                        { id: 'messages', label: 'Messages', icon: Mail },
                        { id: 'blog', label: 'Blog', icon: FileText },
                        { id: 'feedback', label: 'Feedback', icon: MessageSquare },
                        { id: 'error_reports', label: 'Errors', icon: AlertTriangle },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 px-1 text-sm font-semibold flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
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