import React, { useEffect, useState } from 'react';
import { BarChart3, Users, MousePointer2, Loader2 } from 'lucide-react';
import { collection, query, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Inbox } from './Inbox';

interface AnalyticsDashboardProps {
    portfolioId: string;
    ownerId: string;
}

interface AnalyticsEvent {
    type: 'view' | 'click';
    source?: string;
    targetId?: string;
    label?: string;
    visitorId?: string;
    timestamp: any;
}

interface MessageData {
    id: string;
    senderName: string;
    senderEmail: string;
    subject: string;
    text: string;
    createdAt: any;
    read: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ portfolioId, ownerId }) => {
    const [dateRange, setDateRange] = useState<'1d' | '7d' | '14d' | '30d' | '90d'>('30d');
    const [stats, setStats] = useState({
        views: 0,
        uniqueVisitors: 0,
        clicks: 0,
        ctr: 0
    });


    // Top 5 clicked elements
    const [heatmapData, setHeatmapData] = useState<{ label: string, clicks: number }[]>([]);

    // Traffic Sources
    const [sourceData, setSourceData] = useState<{ source: string, count: number, percentage: number }[]>([]);

    // Recent Messages
    const [messages, setMessages] = useState<MessageData[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!portfolioId || !ownerId) {
                setLoading(false);
                return;
            }
            setLoading(true);

            try {
                // Calculate Start Date based on Range
                const startDate = new Date();
                const daysMap = { '1d': 1, '7d': 7, '14d': 14, '30d': 30, '90d': 90 };
                startDate.setDate(startDate.getDate() - daysMap[dateRange]);

                const statsRef = collection(db, 'users', ownerId, 'portfolios', portfolioId, 'stats');
                const q = query(
                    statsRef,
                    where('timestamp', '>=', Timestamp.fromDate(startDate))
                );

                const snapshot = await getDocs(q);
                const events: AnalyticsEvent[] = snapshot.docs.map(doc => doc.data() as AnalyticsEvent);

                // --- Client-side Aggregation ---

                // 1. KPI Cards
                const views = events.filter(e => e.type === 'view');
                const clicks = events.filter(e => e.type === 'click');
                const uniqueVisitors = new Set(views.map(e => e.visitorId).filter(Boolean)).size;
                const ctr = views.length > 0 ? (clicks.length / views.length) * 100 : 0;

                setStats({
                    views: views.length,
                    uniqueVisitors: uniqueVisitors || views.length, // Fallback if visitorId missing
                    clicks: clicks.length,
                    ctr: parseFloat(ctr.toFixed(1))
                });

                // 2. Interaction Heatmap (Top Clicks)
                const clickMap = new Map<string, number>();
                clicks.forEach(c => {
                    const key = c.label || 'Unknown';
                    clickMap.set(key, (clickMap.get(key) || 0) + 1);
                });

                const sortedClicks = Array.from(clickMap.entries())
                    .map(([label, count]) => ({ label, clicks: count }))
                    .sort((a, b) => b.clicks - a.clicks)
                    .slice(0, 5); // Top 5

                setHeatmapData(sortedClicks);

                // 3. Traffic Sources
                const sourceMap = new Map<string, number>();
                views.forEach(v => {
                    const source = v.source || 'direct';
                    sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
                });

                const totalSources = views.length;
                const sortedSources = Array.from(sourceMap.entries())
                    .map(([source, count]) => ({
                        source,
                        count,
                        percentage: totalSources > 0 ? Math.round((count / totalSources) * 100) : 0
                    }))
                    .sort((a, b) => b.count - a.count);

                setSourceData(sortedSources);

            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [portfolioId, ownerId, dateRange]);

    if (loading) {
        return <div className="p-8 text-center opacity-50 flex flex-col items-center justify-center gap-2"><Loader2 className="animate-spin" /> Loading analytics...</div>;
    }

    return (
        <div className="flex-1 bg-gray-50 dark:bg-black/20 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Analytics Overview</h2>
                        <p className="text-gray-500 text-sm">Performance metrics for your portfolio.</p>
                    </div>

                    {/* Date Range Picker */}
                    <div className="flex bg-white dark:bg-[#1a1d24] border dark:border-white/10 rounded-lg p-1 shadow-sm self-start">
                        {(['1d', '7d', '14d', '30d', '90d'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${dateRange === range
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 dark:text-gray-400'
                                    }`}
                            >
                                {range === '1d' ? '24h' : range.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-[#1a1d24] p-5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2 opacity-60">
                            <BarChart3 size={18} />
                            <span className="text-sm font-medium">Total Page Views</span>
                        </div>
                        <div className="text-3xl font-bold">{stats.views}</div>
                        <div className="text-xs text-green-500 mt-2 font-medium">Updated just now</div>
                    </div>
                    <div className="bg-white dark:bg-[#1a1d24] p-5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2 opacity-60">
                            <Users size={18} />
                            <span className="text-sm font-medium">Unique Visitors</span>
                        </div>
                        <div className="text-3xl font-bold">{stats.uniqueVisitors}</div>
                        <div className="text-xs text-green-500 mt-2 font-medium">Unique IDs</div>
                    </div>
                    <div className="bg-white dark:bg-[#1a1d24] p-5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2 opacity-60">
                            <MousePointer2 size={18} />
                            <span className="text-sm font-medium">Click-through Rate</span>
                        </div>
                        <div className="text-3xl font-bold">{stats.ctr}%</div>
                        <div className="text-xs text-gray-500 mt-2 font-medium">Based on {stats.clicks} total interactions</div>
                    </div>
                </div>

                {/* Messages Inbox */}
                <Inbox portfolioId={portfolioId} ownerId={ownerId} />

                <div className="grid md:grid-cols-2 gap-6">

                    {/* Interaction Heatmap */}
                    <div className="bg-white dark:bg-[#1a1d24] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <h3 className="font-bold mb-6">Top Interactions</h3>
                        <div className="space-y-4">
                            {heatmapData.length === 0 ? (
                                <p className="text-center text-gray-400 py-8 text-sm">No interaction data yet.</p>
                            ) : (
                                heatmapData.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold opacity-70">{i + 1}</span>
                                            <span className="truncate max-w-[150px]">{item.label}</span>
                                        </div>
                                        <div className="font-mono font-medium">{item.clicks} clicks</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Traffic Sources */}
                    <div className="bg-white dark:bg-[#1a1d24] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <h3 className="font-bold mb-6">Traffic Sources</h3>
                        <div className="space-y-6">
                            {sourceData.length === 0 ? (
                                <p className="text-center text-gray-400 py-8 text-sm">No traffic data yet.</p>
                            ) : (
                                sourceData.map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="capitalize">{item.source}</span>
                                            <span className="font-mono opacity-60">{item.percentage}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full"
                                                style={{ width: `${item.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
