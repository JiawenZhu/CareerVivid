import React from 'react';
import { PortfolioTemplateProps } from '../../types/portfolio';
import { Mail, Globe, MapPin, Share2, Music2, Heart, Users, Eye, TrendingUp } from 'lucide-react';
import TikTokWidget from '../../components/widgets/TikTokWidget';
import { functions } from '../../../../firebase';
import { httpsCallable } from 'firebase/functions';

const MediaKitTemplate: React.FC<PortfolioTemplateProps> = ({ data, onUpdate }) => {
    // Map PortfolioData fields to Template needs
    const { hero, about, theme, contactEmail, socialLinks } = data;
    const isDark = theme.darkMode;
    const canEdit = !!onUpdate;

    // Extract TikTok username if available
    const tiktokLink = socialLinks?.find(l => l.platform === 'tiktok' || l.url.includes('tiktok.com'));
    let tiktokUsername = '';
    if (tiktokLink) {
        const match = tiktokLink.url.match(/@([a-zA-Z0-9_.-]+)/);
        if (match) tiktokUsername = match[1];
    }

    const handleConnect = async () => {
        try {
            const initiateTikTokAuth = httpsCallable(functions, 'initiateTikTokAuth');
            const result = await initiateTikTokAuth();
            const { url } = (result.data as any);
            if (url) window.location.href = url;
        } catch (error) {
            console.error("Failed to initiate TikTok auth:", error);
            alert("Failed to connect to TikTok. Please try again.");
        }
    };

    // Mock aggregate stats (In real implementation, these would come from the API)
    const stats = [
        { label: 'Total Followers', value: '125.4K', icon: Users, color: 'text-blue-500' },
        { label: 'Avg. Views', value: '45.2K', icon: Eye, color: 'text-green-500' },
        { label: 'Engagement Rate', value: '8.5%', icon: TrendingUp, color: 'text-purple-500' },
        { label: 'Total Likes', value: '2.1M', icon: Heart, color: 'text-red-500' },
    ];

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#111111] text-white' : 'bg-gray-50 text-gray-900'} font-sans`}>

            {/* Header / Hero Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 pt-12 pb-24 text-white">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl flex-shrink-0">
                        {hero.avatarUrl ? (
                            <img src={hero.avatarUrl} alt={hero.headline} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center text-4xl font-bold">
                                {(hero.headline || 'User').charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-bold mb-2">{hero.headline || 'Your Name'}</h1>
                        <p className="text-xl opacity-90 mb-4">{hero.subheadline || 'Content Creator • Influencer'}</p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-medium">
                            {data.location && (
                                <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                                    <MapPin size={14} /> {data.location}
                                </span>
                            )}
                            {data.socialLinks?.find(l => !l.platform && l.label === 'Website')?.url && (
                                <a href={data.socialLinks.find(l => !l.platform && l.label === 'Website')?.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors">
                                    <Globe size={14} /> Website
                                </a>
                            )}
                            <a href={`mailto:${contactEmail}`} className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors">
                                <Mail size={14} /> Contact Me
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-16 pb-20">

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {stats.map((stat, i) => (
                        <div key={i} className={`${isDark ? 'bg-[#1a1d24] border-white/5' : 'bg-white border-gray-100'} p-6 rounded-2xl shadow-lg border backdrop-blur-sm`}>
                            <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-50'} flex items-center justify-center mb-3 ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                            <div className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
                            <div className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left Column: Bio & Info */}
                    <div className="space-y-8">
                        {/* About Card */}
                        <div className={`p-6 rounded-2xl ${isDark ? 'bg-[#1a1d24]' : 'bg-white'} shadow-sm`}>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Users size={20} className="text-indigo-500" />
                                About Me
                            </h2>
                            <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {about || "I create engaging content focused on lifestyle, tech, and productivity. Let's work together to bring your brand story to life through authentic storytelling."}
                            </p>
                        </div>

                        {/* Sponsorship Rates (Hidden if empty, mock for now) */}
                        <div className={`p-6 rounded-2xl ${isDark ? 'bg-[#1a1d24]' : 'bg-white'} shadow-sm`}>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Share2 size={20} className="text-pink-500" />
                                Partnership Rates
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-white/5">
                                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>TikTok Video</span>
                                    <span className="font-bold">$1,500+</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-white/5">
                                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Instagram Reel</span>
                                    <span className="font-bold">$1,200+</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Brand Story</span>
                                    <span className="font-bold">$500+</span>
                                </div>
                            </div>
                            <button className="w-full mt-6 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold hover:opacity-90 transition-opacity">
                                Inquire Now
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Content Showcase */}
                    <div className="md:col-span-2 space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Music2 size={24} className="text-[#FE2C55]" />
                                Recent Content
                            </h2>

                            {tiktokUsername ? (
                                <TikTokWidget username={tiktokUsername} isDark={isDark} />
                            ) : (
                                <div className={`p-8 rounded-2xl border-2 border-dashed ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'} text-center`}>
                                    <p className="text-gray-500 mb-4">Content will appear here when you connect your TikTok account.</p>
                                    {canEdit && (
                                        <button
                                            onClick={handleConnect}
                                            className="px-6 py-2 bg-[#FE2C55] text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
                                        >
                                            Connect TikTok
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default MediaKitTemplate;
