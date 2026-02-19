import React, { useState, useRef, useEffect } from 'react';
import { Headphones, Play, Pause, X } from 'lucide-react';
import { storage } from '../../../firebase';
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
        <div className="flex justify-center my-8 h-12 relative z-20">
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

            {/* EXPANDED PLAYER (Image 1 Style) */}
            {isExpanded ? (
                <div className="absolute top-0 flex items-center gap-4 bg-white dark:bg-gray-800 shadow-xl rounded-full pl-2 pr-4 py-1.5 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">

                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="Close player"
                    >
                        <X size={14} />
                    </button>

                    {/* Play/Pause Button */}
                    <button
                        onClick={togglePlayback}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:scale-105 transition-transform shadow-sm"
                    >
                        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                    </button>

                    {/* Time Display */}
                    <div className="font-mono text-xs font-medium text-gray-500 dark:text-gray-400 tabular-nums min-w-[80px] text-center select-none">
                        <span className="text-gray-900 dark:text-white">{formatTime(currentTime)}</span>
                        <span className="mx-1 opacity-40">/</span>
                        <span>{formatTime(duration)}</span>
                    </div>

                    {/* Speed Toggle */}
                    <button
                        onClick={handleSpeedChange}
                        className="flex items-center gap-0.5 px-2 py-1 text-xs font-bold border border-gray-200 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[36px] justify-center"
                    >
                        {playbackRate}x
                    </button>
                </div>
            ) : (
                /* COLLAPSED PILL (Image 2 Style) */
                <button
                    onClick={togglePlayback}
                    className="group absolute top-0 flex items-center gap-0 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full pl-4 pr-1 py-1 shadow-sm hover:shadow-md hover:border-primary-100 transition-all duration-300 active:scale-95"
                >
                    <div className="flex items-center gap-2 pr-3">
                        <Headphones size={16} className="text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            Listen to this article
                        </span>
                    </div>
                    <div className="pl-2 pr-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400 border border-gray-100 dark:border-gray-600">
                            {formatDurationText(duration)}
                        </span>
                    </div>
                </button>
            )}
        </div>
    );
};

export default ArticleAudioPlayer;
