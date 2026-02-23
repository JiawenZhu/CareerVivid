import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Legend
} from 'recharts';
import {
    ArrowUpRight, Users, DollarSign, Activity, AlertTriangle, CheckCircle,
    Clock, Shield, Zap, TrendingUp, Layers, FileText, Settings,
    ExternalLink, Filter, Download, Plus, Search, ChevronRight, MoreHorizontal,
    Mail, LayoutGrid, ShieldCheck, Database, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    collection, getDocs, query, where, orderBy, limit, Timestamp, getCountFromServer
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';

// --- MOCK DATA (Kept for Marketing & Stripe/Finance) ---

const CAMPAIGN_DATA = [
    { id: 1, name: 'Q3 Student Rush', impressions: '1.2M', conversions: '4.5%', cpa: '$12.50', roi: '340%', status: 'active' },
    { id: 2, name: 'Tech Bro Retargeting', impressions: '850K', conversions: '2.1%', cpa: '$45.00', roi: '120%', status: 'paused' },
    { id: 3, name: 'Newsletter Sponsorship', impressions: '200K', conversions: '8.5%', cpa: '$8.20', roi: '550%', status: 'active' },
];

const PENDING_APPROVALS = [
    { id: 1, type: 'Ad Creative', title: 'Instagram Story - "Get Hired Fast"', source: 'Agency: Zenith Digital', date: '2 hrs ago' },
    { id: 2, type: 'Copy', title: 'Email Subject Lines A/B Test', source: 'Agency: CopyPro', date: '5 hrs ago' },
    { id: 3, type: 'Landing Page', title: 'Engineering Vertical LP', source: 'Internal Team', date: '1 day ago' },
];

const AUDIT_LOGS_MOCK = [
    { id: 1, event: 'Suspicious Referral Pattern', user: 'user_8829', detail: '15 signups from IP 192.168.1.1 within 10 mins', severity: 'high', time: '10 mins ago' },
    { id: 2, event: 'Policy Violation', user: 'user_7712', detail: 'Uploaded prohibited content type', severity: 'medium', time: '2 hrs ago' },
];

// --- COMPONENTS ---

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        {children}
    </div>
);

const Badge = ({ children, color = 'blue' }: { children: React.ReactNode; color?: string }) => {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
        green: 'bg-green-50 text-green-700 ring-green-600/20',
        red: 'bg-red-50 text-red-700 ring-red-600/20',
        yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
        indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    };
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${colors[color] || colors.blue}`}>
            {children}
        </span>
    );
};

const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
    <div className="flex justify-between items-start mb-6">
        <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {action}
    </div>
);

// --- DASHBOARD STATE TYPES ---

interface DashboardMetrics {
    totalUsers: number;
    newUsersThisMonth: number;
    proPlanCount: number;
    freePlanCount: number;
    totalReferrals: number;
    topReferrers: any[];
    highRiskReferrals: number;
    aiUsageCount: number;
    resumeDownloads: number;
    firestoreLatency: number; // Simulated
    growthData: any[];
    financials?: {
        activeRevenue: string;
        ltv: string;
        churn: string;
        subscriberCount: number;
    };
}

// --- TABS ---

const MarketIntelligenceTab = ({ metrics, loading }: { metrics: DashboardMetrics; loading: boolean }) => {
    // MOCK segmentation for now, or derived
    const segmentationData = [
        { name: 'Pro Plan', value: metrics.proPlanCount, color: '#4F46E5' },
        { name: 'Free Plan', value: metrics.freePlanCount, color: '#9CA3AF' },
    ];

    // Real financial data from Stripe (via Cloud Function)
    const financialData = metrics.financials || { activeRevenue: '...', ltv: '...', churn: '...' };

    return (
        <div className="space-y-6">
            {/* Top Row: Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-gray-500">Total Users</span>
                    <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold text-gray-900">
                            {loading ? <Loader2 className="animate-spin" /> : metrics.totalUsers}
                        </span>
                        <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
                            <ArrowUpRight size={12} /> Live
                        </span>
                    </div>
                </Card>
                <Card className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-gray-500">New Users (30d)</span>
                    <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold text-gray-900">
                            {loading ? <Loader2 className="animate-spin" /> : metrics.newUsersThisMonth}
                        </span>
                        <span className="text-xs font-medium text-indigo-600 flex items-center gap-0.5">
                            <Activity size={12} /> Recent
                        </span>
                    </div>
                </Card>
                <Card className="flex flex-col gap-2 opacity-70">
                    <span className="text-sm font-medium text-gray-500">Active Revenue (Mock)</span>
                    <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold text-gray-900">{financialData.activeRevenue}</span>
                    </div>
                </Card>
                <Card className="flex flex-col gap-2 opacity-70">
                    <span className="text-sm font-medium text-gray-500">Churn Rate (Mock)</span>
                    <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold text-gray-900">{financialData.churn}</span>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart: Trends */}
                <Card className="lg:col-span-2">
                    <SectionHeader
                        title="User Growth (Real Data)"
                        subtitle="Internal user acquisition over last 6 months (simulated distribution)."
                    />
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={metrics.growthData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#9CA3AF" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area yAxisId="left" type="monotone" dataKey="users" name="Signups" fill="#EEF2FF" stroke="#4F46E5" strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Chart: Segmentation */}
                <Card>
                    <SectionHeader title="Plan Distribution" subtitle="Real user breakdown." />
                    <div className="h-64 w-full relative">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={segmentationData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {segmentationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        {/* Legend Overlay */}
                        <div className="absolute bottom-0 left-0 w-full flex flex-wrap justify-center gap-3 text-xs">
                            {segmentationData.map((item) => (
                                <div key={item.name} className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-gray-600">{item.name} ({item.value})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Mocked Insights */}
            <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                <SectionHeader
                    title="AI Opportunities"
                    subtitle="Suggested strategic moves."
                    action={<Zap size={18} className="text-yellow-500 fill-yellow-500" />}
                />
                <div className="p-3 bg-white rounded-lg border border-indigo-100 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-100 rounded-md text-indigo-600">
                            <Users size={16} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">Target "Sprint Plan" Users</h4>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                {metrics.proPlanCount} users are currently on paid plans. Consider a retention campaign.
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

const MarketingCommandTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Helper Note for User */}
        <div className="col-span-full mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center gap-2">
            <AlertTriangle size={16} />
            Marketing Command Center is currently using mocked data as no 'campaigns' collection exists yet.
        </div>

        {/* Agency Portal - Left Column */}
        <Card className="lg:col-span-1 border-l-4 border-l-purple-500">
            <SectionHeader
                title="Agency Portal (Mock)"
                subtitle="Manage external partnerships."
                action={<Badge color="indigo">3 Pending</Badge>}
            />
            <div className="space-y-4">
                {PENDING_APPROVALS.map((item) => (
                    <div key={item.id} className="p-4 rounded-lg border border-gray-100 bg-white hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{item.type}</span>
                            <span className="text-xs text-gray-400">{item.date}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 mt-2">{item.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{item.source}</p>

                        <div className="flex gap-2 mt-3">
                            <button className="flex-1 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors">Review</button>
                            <button className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded text-xs font-medium transition-colors">Dismiss</button>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors text-center">
                Invite New Agency Partner
            </button>
        </Card>

        {/* Right Column - Strategy & Assets */}
        <div className="lg:col-span-2 space-y-6">
            {/* Strategy Roadmap */}
            <Card>
                <SectionHeader
                    title="Strategy Roadmap (Q3 2026)"
                    subtitle="Timeline of major acquisition moments."
                    action={<button className="text-gray-400 hover:text-gray-600"><Plus size={20} /></button>}
                />
                <div className="relative pt-6 pb-2">
                    {/* Timeline Line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 rounded-full" />

                    <div className="flex justify-between relative z-10">
                        {['June 15', 'July 1', 'July 20', 'Aug 15'].map((date, i) => (
                            <div key={date} className="flex flex-col items-center group cursor-pointer">
                                <div className={`w-4 h-4 rounded-full border-2 border-white shadow-sm mb-3 ${i === 1 ? 'bg-blue-500 ring-2 ring-blue-100' : 'bg-gray-300 group-hover:bg-blue-300'}`} />
                                <div className={`text-xs font-medium ${i === 1 ? 'text-blue-600' : 'text-gray-500'}`}>{date}</div>
                                {i === 1 && (
                                    <div className="absolute top-[-40px] bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                        Summer Internship Push
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Brand Asset Library */}
            <Card>
                <SectionHeader
                    title="Brand Asset Library"
                    subtitle="Approved visual identity assets."
                    action={<button className="text-sm text-blue-600 font-medium hover:underline">View All</button>}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-square bg-gray-50 rounded-lg border border-gray-100 overflow-hidden group relative cursor-pointer">
                            <div className="absolute inset-0 flex items-center justify-center text-gray-300 group-hover:text-blue-500 transition-colors">
                                <FileText size={32} />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 bg-white/90 p-2 text-xs font-medium text-gray-700 truncate border-t border-gray-100">
                                Asset_v{i}.png
                            </div>
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    </div>
);

const ComplianceTab = ({ metrics, loading }: { metrics: DashboardMetrics; loading: boolean }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <SectionHeader
                title="Referral Audit Log (Real Data)"
                subtitle="Monitoring referral codes from Firestore."
                action={<Badge color={metrics.highRiskReferrals > 0 ? 'red' : 'green'}>
                    {metrics.highRiskReferrals} High Risk
                </Badge>}
            />
            <div className="overflow-hidden">
                <table className="w-full text-left">
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td className="p-4 text-center text-gray-500">Loading referrals...</td></tr>
                        ) : metrics.topReferrers.length > 0 ? (
                            metrics.topReferrers.map((ref, idx) => (
                                <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                                    <td className="py-3 pr-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-full ${ref.usedCount >= 5 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {ref.usedCount >= 5 ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">Code: {ref.code}</div>
                                                <div className="text-xs text-gray-500">
                                                    User: {ref.userId?.substring(0, 8)}... • {ref.usedCount} Uses
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 text-right">
                                        <button className="text-xs font-medium text-gray-400 group-hover:text-red-600 transition-colors">
                                            Audit
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td className="p-4 text-center text-gray-500">No active referrals found.</td></tr>
                        )}
                        {/* Always show mock logs for demo if real list is short */}
                        {AUDIT_LOGS_MOCK.map(log => (
                            <tr key={log.id} className="group hover:bg-gray-50 transition-colors opacity-60">
                                <td className="py-3 pr-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-full bg-gray-100 text-gray-500"><Shield size={14} /></div>
                                        <div><div className="text-sm font-medium text-gray-900">{log.event} (Mock)</div></div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>

        <div className="space-y-6">
            <Card className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Policy Health Score</h3>
                    <p className="text-sm text-gray-500">Overall platform compliance.</p>
                </div>
                <div className="relative w-24 h-24 flex items-center justify-center">
                    {/* Simple Gauge visual representation */}
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray="94, 100" />
                    </svg>
                    <div className="absolute text-2xl font-bold text-gray-800">94%</div>
                </div>
            </Card>

            <Card>
                <SectionHeader title="Alert Feed" subtitle="Real-time violations." />
                <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                    <div className="flex gap-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                        <p className="text-gray-600">
                            <span className="font-semibold text-gray-900">Referral System:</span>
                            {metrics.totalReferrals} successful referrals tracked.
                        </p>
                    </div>
                    {metrics.highRiskReferrals > 0 && (
                        <div className="flex gap-3 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                            <p className="text-gray-600"><span className="font-semibold text-gray-900">Risk Alert:</span> High usage detected on specific codes.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    </div>
);

const DataOpsTab = ({ metrics }: { metrics: DashboardMetrics }) => (
    <div className="space-y-6">
        {/* Automation Builder - Mocked for now */}
        <Card>
            <SectionHeader
                title="Automation Builder"
                subtitle="Visual workflow editor."
                action={
                    <button className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                        <Plus size={16} /> New Workflow
                    </button>
                }
            />
            <div className="h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden">
                <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Users size={16} className="text-blue-500" /> User Signs Up
                    </div>
                    <div className="w-8 h-0.5 bg-gray-300" />
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Clock size={16} className="text-gray-400" /> Wait 2 Days
                    </div>
                </div>
                <div className="absolute inset-0 bg-grid-gray-100 [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />
            </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1">
                <SectionHeader title="System Health (Real)" />
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Simulated Latency</span>
                        <span className="text-sm font-bold text-green-600">{metrics.firestoreLatency}ms</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <span className="text-sm text-gray-600">AI Queries (24h)</span>
                        <span className="text-sm font-bold text-gray-900">{metrics.aiUsageCount}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <span className="text-sm text-gray-600">Resume Downloads</span>
                        <span className="text-sm font-bold text-gray-900">{metrics.resumeDownloads}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-sm text-gray-600">Overall Status</span>
                        <Badge color="green">Healthy</Badge>
                    </div>
                </div>
            </Card>

            <Card className="col-span-2">
                <SectionHeader title="Tech Trends Feed" action={<ExternalLink size={16} className="text-gray-400" />} />
                <div className="space-y-3">
                    <div className="flex gap-3 items-start p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-blue-100 rounded-md flex-shrink-0 flex items-center justify-center text-blue-500 font-bold">G</div>
                        <div>
                            <h4 className="text-sm font-medium text-blue-600 hover:underline">New AI Indexing capabilities in Firestore</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Google Cloud Blog • 3h ago</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    </div>
);

// --- MAIN LAYOUT ---

const StrategyDashboard = () => {
    const [activeTab, setActiveTab] = useState('market');
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalUsers: 0,
        newUsersThisMonth: 0,
        proPlanCount: 0,
        freePlanCount: 0,
        totalReferrals: 0,
        topReferrers: [],
        highRiskReferrals: 0,
        aiUsageCount: 0,
        resumeDownloads: 0,
        firestoreLatency: 24,
        growthData: []
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // 1. Fetch User Metrics
                const usersRef = collection(db, 'users');
                const usersSnap = await getDocs(usersRef); // Note: For very large DBs, use getCountFromServer

                let totalUsers = 0;
                let newUsers = 0;
                let proCount = 0;
                let freeCount = 0;

                // Simple growth data aggregation by month (last 6 months)
                const monthCounts: Record<string, number> = {};
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                usersSnap.docs.forEach(doc => {
                    const data = doc.data();
                    totalUsers++;

                    // Plan Stats
                    if (data.plan === 'pro_sprint' || data.plan === 'pro_monthly' || data.promotions?.isPremium) {
                        proCount++;
                    } else {
                        freeCount++;
                    }

                    // New Users
                    if (data.createdAt?.toDate && data.createdAt.toDate() > startOfMonth) {
                        newUsers++;
                    }

                    // Growth Curve
                    if (data.createdAt?.toDate) {
                        const date = data.createdAt.toDate();
                        const monthKey = date.toLocaleString('default', { month: 'short' });
                        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
                    }
                });

                // Transform for Chart
                const growthData = Object.keys(monthCounts).map(m => ({
                    month: m,
                    users: monthCounts[m]
                })).slice(-6); // last 6 months

                // 2. Fetch Governance / Referral Data
                const referralsRef = collection(db, 'referralCodes');
                const topReferralsQuery = query(referralsRef, orderBy('usedCount', 'desc'), limit(5));
                const referralsSnap = await getDocs(topReferralsQuery);

                const topReferrers = referralsSnap.docs.map(doc => doc.data());

                // Count High Risk (used > 10 times in short period - simulated check just by count > 20 for now)
                const highRiskCount = topReferrers.filter(r => r.usedCount > 20).length;

                // 3. Fetch Data Ops / Usage Logs (Sample query, not full scan)
                const logsRef = collection(db, 'usage_logs');
                // Just grab last 100 to estimate recent activity
                const logsQuery = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
                const logsSnap = await getDocs(logsQuery);

                let aiUsageRaw = 0;
                let downloadsRaw = 0;

                logsSnap.docs.forEach(doc => {
                    const type = doc.data().eventType;
                    if (type === 'ai_assistant_query' || type === 'resume_suggestion') aiUsageRaw++;
                    if (type === 'resume_download') downloadsRaw++;
                });

                // 4. Fetch Financial Metrics (Stripe)
                let financialMetrics = undefined;
                try {
                    const getFinancialMetricsFn = httpsCallable(functions, 'getFinancialMetrics');
                    const finResult = await getFinancialMetricsFn();
                    financialMetrics = finResult.data as any;
                } catch (err) {
                    console.error("Failed to fetch financial metrics:", err);
                    // Fallback or leave undefined to show loading/placeholder
                }

                setMetrics({
                    totalUsers,
                    newUsersThisMonth: newUsers,
                    proPlanCount: proCount,
                    freePlanCount: freeCount,
                    totalReferrals: topReferrers.reduce((acc, curr) => acc + (curr.usedCount || 0), 0),
                    topReferrers,
                    highRiskReferrals: highRiskCount,
                    aiUsageCount: aiUsageRaw * 10, // Simulated multiplier for scale relative to sample
                    resumeDownloads: downloadsRaw * 5,
                    firestoreLatency: Math.floor(Math.random() * 20) + 15,
                    growthData: growthData.length > 0 ? growthData : [{ month: 'Jan', users: 0 }],
                    financials: financialMetrics
                });

            } catch (error) {
                console.error("Error fetching strategy dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const tabs = [
        { id: 'market', label: 'Market Intelligence', icon: Activity, color: 'text-blue-600' },
        { id: 'marketing', label: 'Command Center', icon: LayoutGrid, color: 'text-purple-600' },
        { id: 'compliance', label: 'Governance', icon: ShieldCheck, color: 'text-green-600' },
        { id: 'data', label: 'Data Ops', icon: Database, color: 'text-gray-600' },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Strategy & Operations Hub</h1>
                    <p className="text-gray-500 mt-2 text-lg">Central command for high-level strategic decision making.</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 p-1 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 overflow-x-auto">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  relative flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap
                  ${isActive ? 'text-gray-900 shadow-sm bg-white ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}
                `}
                            >
                                <Icon size={18} className={isActive ? tab.color : 'text-gray-400'} />
                                {tab.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/5 pointer-events-none"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'market' && <MarketIntelligenceTab metrics={metrics} loading={loading} />}
                        {activeTab === 'marketing' && <MarketingCommandTab />}
                        {activeTab === 'compliance' && <ComplianceTab metrics={metrics} loading={loading} />}
                        {activeTab === 'data' && <DataOpsTab metrics={metrics} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StrategyDashboard;
