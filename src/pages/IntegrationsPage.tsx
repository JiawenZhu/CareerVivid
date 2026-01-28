import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import Logo from '../components/Logo';
import { Music, Calendar, FileText, CheckCircle, Video, Lock, ExternalLink, Users, Heart, Film, RefreshCw } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';

// TikTok Profile Interface
interface TikTokProfile {
    displayName: string;
    avatarUrl: string | null;
    followerCount: number | null;
    likesCount: number | null;
    videoCount: number | null;
    isVerified?: boolean;
    videos?: Array<{ coverUrl: string; title: string; link: string }>;
}

// Hardcoded Widget Data
const WIDGETS = [
    { id: 'calendar', name: 'Calendar Booking', icon: <Calendar size={24} />, connected: false, desc: 'Allow visitors to book calls directly.' },
    { id: 'spotify', name: 'Spotify Embed', icon: <Music size={24} />, connected: true, desc: 'Showcase your latest tracks or playlists.' },
    { id: 'resume', name: 'Resume Download', icon: <FileText size={24} />, connected: false, desc: 'Let recruiters download your CV.' },
];

// Helper to format large numbers
const formatNumber = (num: number | null): string => {
    if (num === null || num === undefined) return '—';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

const IntegrationsPage: React.FC = () => {
    const { currentUser } = useAuth();

    // TikTok Connection State
    const [isTikTokConnected, setIsTikTokConnected] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [tikTokProfile, setTikTokProfile] = useState<TikTokProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    // Fetch TikTok Data on Mount
    useEffect(() => {
        const fetchTikTokData = async () => {
            if (!currentUser) return;
            setIsLoadingProfile(true);
            try {
                const tikTokDoc = await getDoc(doc(db, 'users', currentUser.uid, 'integrations', 'tiktok'));
                if (tikTokDoc.exists()) {
                    const data = tikTokDoc.data();
                    if (data.connected) {
                        setIsTikTokConnected(true);
                        setTikTokProfile({
                            ...data.profile,
                            videos: data.videos || []
                        } as TikTokProfile);
                    }
                }
            } catch (err) {
                console.error('Error fetching TikTok data:', err);
            } finally {
                setIsLoadingProfile(false);
            }
        };
        fetchTikTokData();
    }, [currentUser]);

    // Handle Disconnect
    const handleDisconnectTikTok = async () => {
        if (!currentUser || !confirm('Are you sure you want to disconnect TikTok? This will remove your Media Kit from your page.')) return;

        try {
            const tiktokRef = doc(db, 'users', currentUser.uid, 'integrations', 'tiktok');
            await updateDoc(tiktokRef, {
                connected: false,
                profile: deleteField(),
                videos: deleteField(),
                accessToken: deleteField(),
                refreshToken: deleteField()
            });

            setIsTikTokConnected(false);
            setTikTokProfile(null);
        } catch (err) {
            console.error('Error disconnecting TikTok:', err);
            alert('Failed to disconnect. Please try again.');
        }
    };

    // Real TikTok Auth Flow
    const handleConnectTikTok = () => {
        setIsAuthenticating(true);

        // 1. Generate Random State for security
        const csrfState = Math.random().toString(36).substring(7);
        localStorage.setItem('tiktok_csrf_state', csrfState);

        // 2. Construct OAuth URL
        const clientKey = 'aw1crl350g7yvps2'; // Production Client Key
        const redirectUri = `${window.location.origin}/dashboard/integrations`; // Auto-detect current domain
        const scope = 'user.info.basic,user.info.profile,user.info.stats,video.list';

        const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${csrfState}`;

        // 3. Redirect User
        window.location.href = url;
    };

    // Handle Callback (Check for code in URL)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');

        // Only process if we have a code and haven't processed it yet
        if (code && !isTikTokConnected) {
            const storedState = localStorage.getItem('tiktok_csrf_state');
            if (state !== storedState) {
                console.error("CSRF State Mismatch");
                return; // Security check
            }

            setIsAuthenticating(true);

            // Call Backend to Exchange Token
            const exchangeToken = async () => {
                try {
                    const idToken = await currentUser?.getIdToken();
                    const response = await fetch('https://us-west1-jastalk-firebase.cloudfunctions.net/connectTikTok', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`
                        },
                        body: JSON.stringify({
                            code,
                            redirectUri: `${window.location.origin}/dashboard/integrations`
                        })
                    });

                    const data = await response.json();
                    if (data.success) {
                        setIsTikTokConnected(true);
                        // Also fetch and set profile data
                        if (data.profile) {
                            setTikTokProfile({
                                displayName: data.profile.display_name || data.profile.displayName || 'TikTok User',
                                avatarUrl: data.profile.avatar_url || data.profile.avatarUrl || null,
                                followerCount: data.profile.follower_count ?? data.profile.followerCount ?? null,
                                likesCount: data.profile.likes_count ?? data.profile.likesCount ?? null,
                                videoCount: data.profile.video_count ?? data.profile.videoCount ?? null,
                                isVerified: data.profile.is_verified || false,
                                videos: [] // Videos come from a separate call in backend, handled by initial fetch or refresh
                            });
                        }
                        // Clean up URL
                        window.history.replaceState({}, document.title, window.location.pathname);

                        // Trigger a re-fetch to get the videos that were just saved
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    } else {
                        console.error("Integrations Error:", data.error);
                        alert("Failed to connect TikTok: " + data.error);
                    }
                } catch (err) {
                    console.error("Network Error:", err);
                } finally {
                    setIsAuthenticating(false);
                    localStorage.removeItem('tiktok_csrf_state');
                }
            };

            if (currentUser) exchangeToken();
        } else if (error) {
            console.error("TikTok Auth Error:", error);
            setIsAuthenticating(false);
        }
    }, [currentUser, isTikTokConnected]);

    return (
        <div className="bg-[#f0f0f0] min-h-screen flex flex-col font-sans" style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px'
        }}>
            {/* Header (Same as BioLinksPage) */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b-4 border-black shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <a href="/dashboard" className="flex items-center gap-2">
                            <Logo className="h-8 w-8" />
                            <span className="text-xl font-black text-black">CareerVivid</span>
                        </a>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 bg-black text-white font-bold text-sm border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-grow pt-32 pb-20 flex flex-col lg:flex-row max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-12">

                {/* Left Column: Integrations Grid */}
                <div className="flex-1">
                    <h1 className="text-4xl md:text-5xl font-black text-black mb-8 uppercase tracking-tighter">
                        <span className="bg-white px-4 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] inline-block">
                            Integrations
                        </span>
                    </h1>

                    <p className="text-xl font-bold text-gray-700 mb-12 font-mono">
                        Power up your Bio-Link with third-party widgets.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* TikTok Card (Hero) */}
                        <div className={`p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all ${isTikTokConnected ? 'bg-[#dcfce7]' : 'bg-white'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 rounded-none border-4 border-black ${isTikTokConnected ? 'bg-green-500 text-white' : 'bg-black text-white'}`}>
                                    <Video size={32} />
                                </div>
                                {isTikTokConnected && (
                                    <div className="px-3 py-1 bg-green-500 text-white font-black text-xs uppercase border-2 border-black">
                                        Active
                                    </div>
                                )}
                            </div>
                            <h3 className="text-2xl font-black uppercase mb-2">TikTok</h3>
                            <p className="font-mono text-sm text-gray-600 mb-8 border-b-2 border-black pb-4">
                                Display your latest videos and public stats automatically.
                            </p>

                            {isTikTokConnected ? (
                                <div className="space-y-2">
                                    <button className="w-full py-3 bg-white text-black font-black uppercase border-4 border-black cursor-default flex items-center justify-center gap-2">
                                        <CheckCircle size={20} className="text-green-600" /> Connected
                                    </button>
                                    <button
                                        onClick={handleDisconnectTikTok}
                                        className="w-full text-xs text-red-500 font-bold hover:underline uppercase tracking-wider"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectTikTok}
                                    disabled={isAuthenticating}
                                    className="w-full py-4 bg-[#fe2c55] text-white font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                                >
                                    {isAuthenticating ? 'Connecting...' : 'Connect TikTok'} <ExternalLink size={18} />
                                </button>
                            )}
                        </div>

                        {/* TikTok Media Kit Card - Full Width */}
                        {isTikTokConnected && tikTokProfile && (
                            <div className="md:col-span-2 p-8 bg-gradient-to-br from-[#fe2c55] to-[#ff6b8a] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-black text-white uppercase flex items-center gap-2">
                                        <Video size={28} /> Your Media Kit
                                    </h2>
                                    <span className="px-3 py-1 bg-white text-[#fe2c55] font-black text-xs uppercase border-2 border-black">
                                        Live Data
                                    </span>
                                </div>

                                {/* Profile Header */}
                                <div className="flex items-center gap-4 mb-8 bg-white/10 p-4 border-2 border-white/30 backdrop-blur-sm">
                                    {tikTokProfile.avatarUrl ? (
                                        <img
                                            src={tikTokProfile.avatarUrl}
                                            alt={tikTokProfile.displayName}
                                            className="w-16 h-16 rounded-full border-4 border-white object-cover"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full border-4 border-white bg-black/20 flex items-center justify-center">
                                            <Video size={24} className="text-white" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-white font-black text-xl flex items-center gap-2">
                                            @{tikTokProfile.displayName}
                                            {tikTokProfile.isVerified && <CheckCircle size={20} className="text-blue-400 fill-current" />}
                                        </p>
                                        <p className="text-white/70 font-mono text-sm">TikTok Creator</p>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div className="bg-white p-6 border-4 border-black text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <Users size={24} className="mx-auto mb-2 text-[#fe2c55]" />
                                        <p className="text-3xl font-black text-black">{formatNumber(tikTokProfile.followerCount)}</p>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Followers</p>
                                    </div>
                                    <div className="bg-white p-6 border-4 border-black text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <Heart size={24} className="mx-auto mb-2 text-[#fe2c55]" />
                                        <p className="text-3xl font-black text-black">{formatNumber(tikTokProfile.likesCount)}</p>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Likes</p>
                                    </div>
                                    <div className="bg-white p-6 border-4 border-black text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <Film size={24} className="mx-auto mb-2 text-[#fe2c55]" />
                                        <p className="text-3xl font-black text-black">{formatNumber(tikTokProfile.videoCount)}</p>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Videos</p>
                                    </div>
                                </div>

                                {/* Recent Videos Grid */}
                                {tikTokProfile.videos && tikTokProfile.videos.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-white font-black uppercase mb-4 flex items-center gap-2">
                                            <Film size={18} /> Recent Content
                                        </h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            {tikTokProfile.videos.map((video, idx) => (
                                                <a
                                                    key={idx}
                                                    href={video.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block aspect-[9/16] bg-black/20 border-2 border-white/50 hover:border-white transition-all rounded-lg overflow-hidden group"
                                                >
                                                    <img
                                                        src={video.coverUrl}
                                                        alt={video.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Refresh Note */}
                                <div className="mt-6 flex items-center justify-center gap-2 text-white/70 text-xs font-mono">
                                    <RefreshCw size={12} />
                                    Stats auto-update when you connect
                                </div>
                            </div>
                        )}

                        {/* Other Widgets */}
                        {WIDGETS.map((widget) => (
                            <div key={widget.id} className="p-6 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] opacity-75 hover:opacity-100 transition-opacity">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-gray-100 border-4 border-black text-black">
                                        {widget.icon}
                                    </div>
                                    {widget.connected && <CheckCircle size={20} className="text-green-600" />}
                                </div>
                                <h3 className="text-xl font-black uppercase mb-2">{widget.name}</h3>
                                <p className="font-mono text-xs text-gray-600 mb-6">{widget.desc}</p>
                                <button className="w-full py-2 bg-gray-200 text-gray-500 font-bold uppercase border-2 border-gray-400 cursor-not-allowed text-xs">
                                    {widget.connected ? 'Manage' : 'Coming Soon'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Placeholder for Help Content */}
                    <div className="mt-16 bg-[#fffbeb] border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                            <Lock size={24} /> TikTok Verification Guide
                        </h3>
                        <div className="aspect-video bg-black/10 border-4 border-black border-dashed flex items-center justify-center">
                            <p className="font-mono text-gray-500 font-bold">[VIDEO_EMBED_HERE]</p>
                        </div>
                        <p className="mt-4 font-mono text-sm">
                            Need help? Watch this quick guide on how to verify your account.
                        </p>
                    </div>

                </div>

                {/* Right Column: Phone Preview */}
                <div className="w-full lg:w-[400px] flex-shrink-0 relative">
                    <div className="sticky top-32">
                        <div className="bg-black rounded-[3rem] p-4 border-8 border-gray-900 shadow-2xl h-[750px] w-full max-w-[360px] mx-auto relative overflow-hidden bg-white">
                            {/* Phone Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20"></div>

                            {/* Mock Bio-Link Page Inside Phone */}
                            <div className="h-full w-full bg-[#f3f4f6] overflow-y-auto no-scrollbar pt-12 pb-8 px-4 flex flex-col items-center">
                                {/* Profile Header */}
                                <div className="w-20 h-20 bg-gray-300 rounded-full border-4 border-black mb-4"></div>
                                <div className="w-32 h-6 bg-gray-300 rounded mb-2"></div>
                                <div className="w-48 h-4 bg-gray-200 rounded mb-8"></div>

                                {/* Links */}
                                <div className="w-full space-y-3 mb-8">
                                    <div className="w-full h-12 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg"></div>
                                    <div className="w-full h-12 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg"></div>
                                    <div className="w-full h-12 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg"></div>
                                </div>

                                {/* TikTok Widget Preview */}
                                {isTikTokConnected ? (
                                    <div className="w-full bg-black rounded-xl overflow-hidden shadow-lg border-2 border-black animate-scale-in">
                                        <div className="bg-[#fe2c55] px-3 py-2 flex justify-between items-center">
                                            <span className="text-white font-bold text-xs flex items-center gap-1"><Video size={12} /> TikTok</span>
                                            <span className="text-white text-[10px] opacity-80">@careervivid</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-0.5 bg-black p-0.5 h-32">
                                            <div className="bg-gray-800 animate-pulse"></div>
                                            <div className="bg-gray-800 animate-pulse delay-75"></div>
                                            <div className="bg-gray-800 animate-pulse delay-150"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-32 border-2 border-dashed border-gray-400 rounded-xl flex items-center justify-center p-4">
                                        <p className="text-xs text-gray-400 text-center">
                                            TikTok Widget will appear here once connected.
                                        </p>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>

            </main>
            <Footer variant="brutalist" />
        </div>
    );
};

export default IntegrationsPage;
