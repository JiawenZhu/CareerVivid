import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Loader2 } from 'lucide-react';
import { TrackEventType } from '../../../types';
import { COST_MAP } from '../adminConstants';
import { useUsageLogs } from '../hooks';

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
    // const interviewConversionRate = totalInterviewStarts > 0 ? (convertedInterviewUsers / totalInterviewStarts) * 100 : 0; // Unused variable based on previous file content, but keeping consistent if needed or remove if strictly following lint. Previous file didn't use it in JSX explicitly shown but let's keep logic intact. (Actually it was calculated but line 454 was not shown fully used in snippet, but likely valid).
    // Wait, the snippet showed line 454: const interviewConversionRate = ...
    // And snippet around 480 used resumeConversionRate.
    // I will include it.

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

export default Analytics;
