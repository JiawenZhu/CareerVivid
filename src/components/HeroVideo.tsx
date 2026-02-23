import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Volume2, VolumeX, Maximize2, X } from 'lucide-react';
import { createPortal } from 'react-dom';

// Token-authenticated Firebase Storage URLs provided by user
const VIDEO_URLS: Record<string, string> = {
    en: 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Fvideo_assets%2FEN_The_AI_Career_Copilot.mp4?alt=media&token=0da390a7-6de9-45b0-a9a0-a6d00a6766fa',
    es: 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Fvideo_assets%2FSP_CareerVivid__Acelerador_de_IA.mp4?alt=media&token=941bb5cb-827a-4618-b36e-74753afa5807',
    zh: 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Fvideo_assets%2FCH_CareerVivid%EF%BC%9A%E4%BD%A0%E7%9A%84_AI_%E8%81%8C%E4%B8%9A%E5%8A%A0%E9%80%9F%E5%99%A8.mp4?alt=media&token=f1d36e41-8ff8-4779-9187-c5c8bc7a816e',
    ko: 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Fvideo_assets%2FCareerVivid__%E1%84%83%E1%85%A1%E1%86%BC%E1%84%89%E1%85%B5%E1%86%AB%E1%84%8B%E1%85%B4_AI_%E1%84%80%E1%85%B5%E1%84%87%E1%85%A1%E1%86%AB_%E1%84%8F%E1%85%A5%E1%84%85%E1%85%B5%E1%84%8B%E1%85%A5_%E1%84%87%E1%85%A9%E1%84%8C%E1%85%A9_%E1%84%8C%E1%85%A9%E1%84%8C%E1%85%A9%E1%86%BC%E1%84%89%E1%85%A1.mp4?alt=media&token=6f0dab15-2798-4fcc-8883-2094c30f563b',
    de: 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Fvideo_assets%2FCareerVivid__Ihr_KI-Karriere-Copilot.mp4?alt=media&token=d63c45a7-9b36-4829-92a3-9f2e1fc81319',
    ja: 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Fvideo_assets%2FCareerVivid__%E3%81%82%E3%81%AA%E3%81%9F%E3%81%AEAI%E3%82%AD%E3%83%A3%E3%83%AA%E3%82%A2%E3%83%BB%E3%82%B3%E3%83%8F%E3%82%9A%E3%82%A4%E3%83%AD%E3%83%83%E3%83%88.mp4?alt=media&token=bb9fe2ad-a21b-45ca-a4b9-7532eaa9b9eb',
    fr: 'https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Fvideo_assets%2FCareerVivid___L_IA_pour_la_carrie%CC%80re.mp4?alt=media&token=c7a1b8c5-bfdb-4f8e-97ff-2b9e9cfe984d',
};

const HeroVideo: React.FC = () => {
    const { i18n } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const modalVideoRef = useRef<HTMLVideoElement>(null);

    const [isHovered, setIsHovered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Get current language with robust normalization
    const rawLang = i18n.language || 'en';
    const currentLang = rawLang.split('-')[0].toLowerCase(); // en-US -> en, zh-CN -> zh

    // Check if we have a video for this language, otherwise fallback to English
    const videoSrc = VIDEO_URLS[currentLang] || VIDEO_URLS['en'];
    const storageKey = `hero_video_time_${currentLang}`;

    console.log('HeroVideo - Raw lang:', rawLang, 'Normalized:', currentLang, 'Video URL:', videoSrc);

    // Load saved time from localStorage
    const getSavedTime = () => {
        const saved = localStorage.getItem(storageKey);
        if (saved) return parseFloat(saved);
        // Default start times
        if (currentLang === 'en') return 64; // 1:04
        return 0;
    };

    // Save time to localStorage
    const saveTime = (time: number) => {
        localStorage.setItem(storageKey, time.toString());
    };

    // Reload video when language changes
    useEffect(() => {
        if (videoRef.current) {
            setIsLoading(true);
            setHasError(false);
            videoRef.current.load();
        }
    }, [currentLang]);

    // Handle inline video events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleCanPlay = () => {
            setIsLoading(false);
            // Always try to autoplay muted inline
            video.muted = true;
            video.play().catch(err => console.log('Autoplay prevented:', err));
        };

        const handleLoadedMetadata = () => {
            const saved = getSavedTime();
            // Only restore if saved time is valid and not at the very end (allow loop)
            if (saved > 0 && saved < video.duration - 0.5) {
                video.currentTime = saved;
            }
        };

        const handleError = () => {
            setIsLoading(false);
            setHasError(true);
        };

        const handleTimeUpdate = () => {
            // Save time periodically
            if (video.currentTime > 0) {
                saveTime(video.currentTime);
            }
        };

        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('error', handleError);
        video.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            video.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [videoSrc]);

    // Handle hover behavior (unmute and ensure play on hover)
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = !isHovered;
            if (isHovered && videoRef.current.paused) {
                videoRef.current.play().catch(() => { });
            }
        }
    }, [isHovered]);

    // Handle modal open/close and SYNC
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
            // Sync: Inline -> Modal
            if (videoRef.current) {
                const currentTime = videoRef.current.currentTime;
                videoRef.current.pause();
                // We'll set the time on the modal video once it mounts/loads
                // But we can also pass it via a ref or effect if the element exists immediately
                // Since createPortal renders immediately, we can try:
                setTimeout(() => {
                    if (modalVideoRef.current) {
                        modalVideoRef.current.currentTime = currentTime;
                        modalVideoRef.current.play().catch(() => { });
                    }
                }, 100); // Small delay to ensure render
            }
        } else {
            document.body.style.overflow = 'unset';
            // Sync: Modal -> Inline
            if (modalVideoRef.current && videoRef.current) {
                const currentTime = modalVideoRef.current.currentTime;
                videoRef.current.currentTime = currentTime;
                saveTime(currentTime); // Save on close
                videoRef.current.muted = true;
                videoRef.current.play().catch(() => { });
            }
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    return (
        <>
            {/* Inline Player */}
            <div
                className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 bg-gray-900 group cursor-pointer transform transition-transform duration-300 hover:scale-[1.02]"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setIsModalOpen(true)}
            >
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                >
                    <source src={videoSrc} type="video/mp4" />
                </video>

                {/* Loading Spinner */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Error State */}
                {hasError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm text-white p-6">
                        <p className="text-center text-sm">Video unavailable</p>
                    </div>
                )}

                {/* Overlays */}
                <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}></div>

                {/* Sound Indicator / CTA */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium transition-all duration-300 transform translate-y-0 opacity-100">
                    {isHovered ? (
                        <>
                            <Volume2 size={14} className="animate-pulse" />
                            <span>Click to expand</span>
                        </>
                    ) : (
                        <>
                            <VolumeX size={14} />
                            <span>Hover to listen</span>
                        </>
                    )}
                </div>

                {/* Center Play Icon (visible on hover) */}
                <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Maximize2 className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                </div>
            </div>

            {/* Modal Player */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={32} />
                    </button>

                    <div className="w-full max-w-6xl aspect-video px-4 md:px-8 relative">
                        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black">
                            <video
                                ref={modalVideoRef}
                                className="w-full h-full object-contain"
                                autoPlay
                                controls
                                playsInline
                                onTimeUpdate={(e) => saveTime(e.currentTarget.currentTime)}
                            >
                                <source src={videoSrc} type="video/mp4" />
                            </video>
                        </div>
                        <div className="mt-4 text-center">
                            <h3 className="text-white text-xl font-semibold tracking-tight">
                                {currentLang === 'en' && "The AI-Powered Career Copilot"}
                                {currentLang === 'es' && "Tu Acelerador de Carrera con IA"}
                                {currentLang === 'zh' && "您的 AI 职业加速器"}
                                {currentLang === 'ko' && "당신의 AI 기반 커리어 보조 조종사"}
                                {currentLang === 'de' && "Ihr KI-Karriere-Copilot"}
                                {currentLang === 'ja' && "あなたのAIキャリア・コパイロット"}
                                {currentLang === 'fr' && "L'IA pour la carrière"}
                            </h3>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default HeroVideo;
