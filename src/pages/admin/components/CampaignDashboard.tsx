import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Target, MousePointer2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import Toast from '../../../components/Toast';

const CampaignDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        reach: 0,
        clicks: 0,
        conversions: 0,
        convRate: '0.0%'
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        // Listen to active campaigns
        const unsubscribeCampaigns = onSnapshot(collection(db, 'campaigns'), (snapshot) => {
            const camps = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name || 'Unnamed Campaign',
                channel: doc.data().channel || 'Unknown',
                reach: doc.data().reach || 0,
                status: doc.data().status || 'Draft',
            }));
            setCampaigns(camps);
        }, (error) => {
            console.error("Error fetching campaigns:", error);
        });

        // Listen to messaging queue for stats
        const unsubscribeMessages = onSnapshot(collection(db, 'messaging_queue'), (snapshot) => {
            let reach = 0;
            let clicks = 0;
            let conversions = 0;
            
            // For chart data by date
            const dateMap = new Map();

            snapshot.forEach(doc => {
                const data = doc.data();
                reach++;
                if (data.clicked) clicks++;
                if (data.converted) conversions++;

                let dateStr = 'Unknown';
                if (data.createdAt && data.createdAt.toDate) {
                    dateStr = new Date(data.createdAt.toDate()).toLocaleDateString('en-US', { weekday: 'short' });
                }

                if (!dateMap.has(dateStr)) {
                    dateMap.set(dateStr, { name: dateStr, reach: 0, clicks: 0 });
                }
                const dayData = dateMap.get(dateStr);
                dayData.reach++;
                if (data.clicked) dayData.clicks++;
            });

            const rate = reach > 0 ? ((conversions / reach) * 100).toFixed(1) + '%' : '0.0%';

            setStats({
                reach,
                clicks,
                conversions,
                convRate: rate
            });

            // Convert map to array for chart
            let chartArray = Array.from(dateMap.values());
            // If empty, supply some default zeros so chart doesn't break
            if (chartArray.length === 0) {
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                chartArray = days.map(d => ({ name: d, reach: 0, clicks: 0 }));
            } else if (chartArray.length < 7 && !dateMap.has('Unknown')) {
                // simple padding if not enough data
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                days.forEach(d => {
                    if (!dateMap.has(d)) chartArray.push({ name: d, reach: 0, clicks: 0 });
                });
            }
            
            setChartData(chartArray);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching messaging queue:", error);
            setLoading(false);
        });

        return () => {
            unsubscribeCampaigns();
            unsubscribeMessages();
        };
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Marketing Campaign Dashboard</h2>
                <button 
                    onClick={() => setToastMessage("Campaign Creation Wizard will be available in the next release.")}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm text-sm font-medium active:scale-95"
                >
                    New Campaign
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Reach', value: loading ? '...' : stats.reach.toLocaleString(), icon: Users, color: 'text-blue-500' },
                    { label: 'Total Clicks', value: loading ? '...' : stats.clicks.toLocaleString(), icon: MousePointer2, color: 'text-purple-500' },
                    { label: 'Conversions', value: loading ? '...' : stats.conversions.toLocaleString(), icon: Target, color: 'text-green-500' },
                    { label: 'Conv. Rate', value: loading ? '...' : stats.convRate, icon: TrendingUp, color: 'text-amber-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-primary-500/50 transition-all">
                        <div className="flex justify-between items-start">
                            <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-900 ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-6">Channel Performance (Reach vs Clicks)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="reach" name="Reach" stroke="#3B82F6" fillOpacity={1} fill="url(#colorReach)" strokeWidth={2} />
                                <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorClicks)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[300px]">
                    <h3 className="text-lg font-semibold mb-4">Active Campaigns</h3>
                    <div className="space-y-4">
                        {loading ? (
                            <p className="text-sm text-gray-500">Loading campaigns...</p>
                        ) : campaigns.length === 0 ? (
                            <p className="text-sm text-gray-500">No active campaigns found.</p>
                        ) : (
                            campaigns.map((c, i) => (
                                <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 group transition-all">
                                    <div>
                                        <h4 className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{c.name}</h4>
                                        <p className="text-xs text-gray-500">{c.channel}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">{typeof c.reach === 'number' ? c.reach.toLocaleString() : c.reach}</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {c.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {toastMessage && (
                <Toast 
                    message={toastMessage} 
                    onClose={() => setToastMessage(null)} 
                />
            )}
        </div>
    );
};

export default CampaignDashboard;
