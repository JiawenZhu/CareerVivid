import React, { useEffect, useState } from 'react';
import { functions } from '../../../../firebase';
import { httpsCallable } from 'firebase/functions';
import { Loader2, Heart, Play } from 'lucide-react';

interface TikTokWidgetProps {
    username: string;
    isDark: boolean;
}

interface TikTokStats {
    followerCount: number;
    heartCount: number;
    videoCount: number;
    topVideos: Array<{
        id: string;
        thumbnailUrl: string;
        views: number;
        url: string;
    }>;
}

const TikTokWidget: React.FC<TikTokWidgetProps> = ({ username, isDark }) => {
    const [stats, setStats] = useState<TikTokStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const getSocialStats = httpsCallable(functions, 'getSocialStats');
                const result = await getSocialStats({ platform: 'tiktok', username });
                const data = (result.data as any).data;
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch TikTok stats:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchStats();
        }
    }, [username]);

    if (loading) return <div className="animate-pulse h-32 bg-gray-100 dark:bg-white/5 rounded-xl"></div>;
    if (error || !stats) return null;

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
    };

    return (
        <div className={`rounded-xl p-6 border ${isDark ? 'bg-[#1a1d24] border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-full">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>@{username}</h3>
                        <div className="flex gap-4 text-sm opacity-80">
                            <span><b>{formatNumber(stats.followerCount)}</b> Followers</span>
                            <span><b>{formatNumber(stats.heartCount)}</b> Likes</span>
                        </div>
                    </div>
                </div>
                <a
                    href={`https://www.tiktok.com/@${username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-[#FE2C55] text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    Follow
                </a>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {stats.topVideos.map(video => (
                    <a
                        key={video.id}
                        href={video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="aspect-[3/4] rounded-lg overflow-hidden relative group"
                    >
                        <img src={video.thumbnailUrl} alt="TikTok Video" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-bold shadow-black drop-shadow-md">
                            <Play size={12} fill="white" />
                            {formatNumber(video.views)}
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default TikTokWidget;
