import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Headphones, Play, Pause, X } from 'lucide-react';
import { storage } from '../../firebase';
import { ref, getDownloadURL } from 'firebase/storage';

interface ArticleAudioPlayerProps {
    articleId: string;
}

const ArticleAudioPlayer: React.FC<ArticleAudioPlayerProps> = ({ articleId }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [playbackRate, setPlaybackRate] = useState<number>(1);
    const [isVisible, setIsVisible] = useState(true);
    const [error, setError] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [audioSrc, setAudioSrc] = useState<string | null>(null);

    useEffect(() => {
        const fetchAudioUrl = async () => {
            if (!articleId) return;

            // Reset state
            setIsPlaying(false);
            setDuration(0);
            setCurrentTime(0);
            setIsExpanded(false);
            setError(false);
            setIsVisible(true);
            setAudioSrc(null);

            try {
                const audioRef = ref(storage, `blog-audio/${articleId}.mp3`);
                const url = await getDownloadURL(audioRef);
                setAudioSrc(url);
            } catch (err: any) {
                setError(true);
                setIsVisible(false);
            }
        };

        fetchAudioUrl();
    }, [articleId]);

    useEffect(() => {
        if (audioSrc && audioRef.current) {
            audioRef.current.load();
        }
    }, [audioSrc]);

    const togglePlayback = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!audioRef.current) return;

        if (!isExpanded) {
            setIsExpanded(true);
            setTimeout(() => {
                audioRef.current?.play().catch(console.error);
                setIsPlaying(true);
            }, 0);
            return;
        }

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(console.error);
        }
        setIsPlaying(!isPlaying);
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setIsExpanded(false);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleMetadataLoaded = () => {
        if (audioRef.current) {
            const d = audioRef.current.duration;
            if (isFinite(d)) {
                setDuration(d);
            }
        }
    };

    const handleSpeedChange = (e: React.MouseEvent) => {
        e.stopPropagation();
        const speeds = [1, 1.25, 1.5, 2];
        const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
        setPlaybackRate(nextSpeed);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextSpeed;
        }
    };

    const formatTime = (time: number) => {
        if (!isFinite(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatDurationText = (seconds: number) => {
        if (!isFinite(seconds) || seconds === 0) return 'Loading...';
        const minutes = Math.ceil(seconds / 60);
        return `${minutes} min read`;
    };

    if (!isVisible || error) return null;

    return (
        <>
            {/* Hidden Audio Element */}
            <audio
                ref={audioRef}
                src={audioSrc}
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleMetadataLoaded}
                onEnded={() => setIsPlaying(false)}
                onError={() => {
                    setError(true);
                    setIsVisible(false);
                }}
                className="hidden"
            />

            {/* EXPANDED PLAYER (Floating at bottom center via Portal) */}
            {isExpanded && typeof window !== 'undefined' && document.body && createPortal(
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] flex items-center justify-between min-w-[320px] bg-white dark:bg-gray-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] rounded-full px-4 py-2 layout-fixed border border-gray-100 dark:border-gray-700 animate-in slide-in-from-bottom-8 fade-in duration-300">

                    <div className="flex items-center gap-3">
                        {/* Play/Pause Button */}
                        <button
                            onClick={togglePlayback}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:scale-105 transition-transform shadow-md flex-shrink-0"
                        >
                            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-1" />}
                        </button>

                        {/* Time Display */}
                        <div className="font-mono text-sm font-medium text-gray-500 dark:text-gray-400 tabular-nums min-w-[90px] text-center select-none flex-shrink-0">
                            <span className="text-gray-900 dark:text-white">{formatTime(currentTime)}</span>
                            <span className="mx-1.5 opacity-40">/</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Speed Toggle */}
                        <button
                            onClick={handleSpeedChange}
                            className="flex items-center justify-center w-10 h-8 text-xs font-bold border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                        >
                            {playbackRate}x
                        </button>

                        <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="p-2 text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                            aria-label="Close player"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* COLLAPSED PILL (Original position in article header) */}
            {!isExpanded && (
                <div className="flex justify-center my-8 h-12 relative z-20">
                    <button
                        onClick={togglePlayback}
                        className="group flex items-center gap-0 bg-white dark:bg-gray-800 border-2 border-primary-200 dark:border-primary-800 rounded-full pl-4 pr-1 py-1 shadow-sm hover:shadow-md hover:border-primary-400 transition-all duration-300 active:scale-95"
                    >
                        <div className="flex items-center gap-2 pr-3">
                            <Headphones size={16} className="text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                Listen to this article
                            </span>
                        </div>
                        <div className="pl-2 pr-2 border-l border-primary-100 dark:border-primary-900">
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 block">
                                {formatDurationText(duration)}
                            </span>
                        </div>
                    </button>
                </div>
            )}
        </>
    );
};

export default ArticleAudioPlayer;
