import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, User, Trophy, Crown, Medal, Play, ChevronUp } from 'lucide-react';
import { leaderboardService, LeaderboardPlayer } from '../../../../services/leaderboardService';
import GetMoreReviewLeaderboardModal from './GetMoreReviewLeaderboardModal';

// --- Types ---
interface Heart {
    id: number;
    x: number;
    y: number;
    rotation: number;
}

interface Player extends LeaderboardPlayer {
    isCurrentUser?: boolean;
}

type GameStep = 'UPLOAD' | 'ONBOARDING' | 'PLAYING';

const GetMoreReview01: React.FC = () => {
    // --- State ---
    const [step, setStep] = useState<GameStep>('UPLOAD');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [userName, setUserName] = useState('');

    // Game State
    const [followers, setFollowers] = useState(25);
    const [isFollowed, setIsFollowed] = useState(false);
    const [score, setScore] = useState(0); // Local Score for UI responsiveness
    const [hearts, setHearts] = useState<Heart[]>([]);
    const [leaderboard, setLeaderboard] = useState<Player[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showTutorial, setShowTutorial] = useState(false);
    const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Refs
    const clickCountRef = useRef(0);
    const lastClickTimeRef = useRef(0);
    const comboLevelRef = useRef(0);

    // --- Phase 1: Upload Logic ---
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setUploadedImage(url);
            setStep('ONBOARDING');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1
    });

    // --- Phase 2: Onboarding Logic ---
    // --- Phase 2: Onboarding Logic ---
    const startGame = async () => {
        if (!userName.trim()) return;

        try {
            // Create player in Firestore
            const playerId = await leaderboardService.addPlayer(userName);
            setCurrentUserId(playerId);

            setStep('PLAYING');
            setShowTutorial(true);
        } catch (error) {
            console.error("Failed to start game:", error);
            // Fallback?
        }
    };

    // --- Phase 3: Game Logic ---

    // --- Phase 3: Game Logic ---

    // Subscribe to real-time leaderboard
    useEffect(() => {
        const unsubscribe = leaderboardService.subscribeToLeaderboard((players) => {
            setLeaderboard(players.map(p => ({
                ...p,
                isCurrentUser: p.id === currentUserId
            })));
        });
        return () => unsubscribe();
    }, [currentUserId]);

    // specific effect to update local score from db if needed, 
    // but we can just trust the leaderboard stream or keep local optimistic UI
    // For simplicity, let's keep local score separate or sync it? 
    // If we want "score" state to reflect DB, we should sync it.
    useEffect(() => {
        if (currentUserId) {
            const me = leaderboard.find(p => p.id === currentUserId);
            if (me) setScore(me.score);
        }
    }, [leaderboard, currentUserId]);

    const handleFollow = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isFollowed) {
            setFollowers(prev => prev + 1);
            setIsFollowed(true);
            setScore(prev => prev + 10); // Optimistic UI

            if (currentUserId) {
                leaderboardService.updateScore(currentUserId, 10);
            }
            triggerConfetti(e.clientX, e.clientY);
        }
    };

    const handleContainerClick = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;

        // Spawn Heart
        const newHeart: Heart = {
            id: Date.now(),
            x: clientX,
            y: clientY,
            rotation: Math.random() * 30 - 15
        };
        setHearts(prev => [...prev, newHeart]);
        setTimeout(() => setHearts(prev => prev.filter(h => h.id !== newHeart.id)), 1000);

        // Increment Score
        setScore(prev => prev + 1); // Optimistic

        // Update DB (debouncing might be good for high traffic, but atomic increment handles concurrency well)
        if (currentUserId) {
            // Fire and forget for responsiveness
            leaderboardService.updateScore(currentUserId, 1);
        }

        // Fireworks Combo
        trackCombo();
    };

    const triggerConfetti = (x: number, y: number) => {
        confetti({
            particleCount: 30,
            spread: 50,
            origin: { x: x / window.innerWidth, y: y / window.innerHeight },
            colors: ['#FE2C55', '#25F4EE', '#ffffff'],
            disableForReducedMotion: true
        });
    };

    const trackCombo = () => {
        const now = Date.now();
        if (now - lastClickTimeRef.current < 500) {
            clickCountRef.current += 1;
        } else {
            clickCountRef.current = 1;
        }
        lastClickTimeRef.current = now;

        if (clickCountRef.current % 5 === 0) {
            comboLevelRef.current = Math.min(comboLevelRef.current + 1, 10);
            const count = 30 * comboLevelRef.current;
            confetti({
                particleCount: count,
                spread: 120,
                origin: { y: 0.6 },
                colors: ['#FE2C55', '#25F4EE', '#ffffff'],
                zIndex: 9999
            });
        }
    };

    const handleSkipUpload = () => {
        setUploadedImage('/assets/templates/tiktok/IMG_2395.png');
        setStep('ONBOARDING');
    };

    // --- Renders ---

    if (step === 'UPLOAD') {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Magic Mirror</h1>
                    <p className="text-gray-400 mb-8">Gamify your TikTok profile in seconds.</p>

                    <div
                        {...getRootProps()}
                        className={`
                            border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all
                            ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'}
                        `}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-gray-700 rounded-full">
                                <UploadCloud className="w-8 h-8 text-indigo-400" />
                            </div>
                            <div>
                                <p className="font-bold text-white text-lg">Upload Screenshot</p>
                                <p className="text-sm text-gray-500 mt-1">Take a screenshot of your TikTok profile</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSkipUpload}
                        className="text-sm text-gray-400 hover:text-white underline underline-offset-4 transition-colors mt-6"
                    >
                        Skip upload (Use Sample Profile)
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'ONBOARDING') {
        return (
            <div className="min-h-screen bg-black/90 flex items-center justify-center p-4 relative">
                {/* Background Context */}
                {uploadedImage && (
                    <img src={uploadedImage} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" />
                )}

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-10 max-w-sm w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
                >
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                            <User className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Who is playing?</h2>
                        <p className="text-white/60 text-sm">Enter your name to join the leaderboard.</p>
                    </div>

                    <input
                        type="text"
                        placeholder="Your Name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500 mb-6 text-center text-lg font-medium"
                        autoFocus
                    />

                    <button
                        onClick={startGame}
                        disabled={!userName.trim()}
                        className="w-full py-4 bg-white text-black font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Play className="w-5 h-5 fill-current" /> Start Game
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div
            className="relative w-full min-h-screen bg-black overflow-hidden flex justify-center selection:bg-transparent"
            onClick={handleContainerClick}
        >
            {/* Tutorial Overlay */}
            <AnimatePresence>
                {showTutorial && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-8 text-center"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowTutorial(false);
                        }}
                    >
                        <div className="max-w-xs space-y-8 pointer-events-none">
                            <div className="space-y-2">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-pink-500/50 animate-pulse">
                                    <span className="text-3xl">👆</span>
                                </div>
                                <h3 className="text-xl font-bold text-white">Tap to Like</h3>
                                <p className="text-sm text-gray-400">Tap anywhere on the screen to send hearts and climb the leaderboard.</p>
                            </div>

                            <div className="space-y-2">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-cyan-500/50">
                                    <span className="text-3xl">🔥</span>
                                </div>
                                <h3 className="text-xl font-bold text-white">Build Combos</h3>
                                <p className="text-sm text-gray-400">Tap fast to trigger fireworks and multiply your score.</p>
                            </div>
                        </div>

                        <button
                            className="mt-12 px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-transform pointer-events-auto"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowTutorial(false);
                            }}
                        >
                            Got it!
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            <GetMoreReviewLeaderboardModal
                isOpen={showLeaderboardModal}
                leaderboard={leaderboard}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClose={() => setShowLeaderboardModal(false)}
            />

            {/* 1. Base Screenshot Container */}
            <div className="relative w-full max-w-md h-auto">
                {uploadedImage ? (
                    <img
                        src={uploadedImage}
                        alt="TikTok Profile"
                        className="w-full h-auto object-contain pointer-events-none"
                    />
                ) : (
                    <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
                        <p className="text-white">No Image Loaded</p>
                    </div>
                )}

                {/* 2. Interactive Overlays */}

                {/* Follower Count Mask */}
                {/* Dynamically positioned? For MVP we stick to the provided approximate coordinates */}
                <div
                    className="absolute z-10 bg-white flex items-center justify-center font-bold text-gray-900 leading-none pointer-events-none"
                    style={{
                        top: '28.1%',
                        left: '42%',
                        width: '35px',
                        height: '20px',
                        fontSize: '17px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                    }}
                >
                    {followers}
                </div>

                {/* Follow Button Trigger */}
                <motion.div
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFollow}
                    className="absolute z-20 cursor-pointer"
                    style={{
                        top: '41%',
                        left: '5%',
                        width: '43%',
                        height: '5.5%',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                    }}
                >
                    {isFollowed && (
                        <div className="w-full h-full bg-gray-100 border border-gray-300 rounded-[2px] flex items-center justify-center">
                            <span className="font-semibold text-gray-900 text-sm">Message</span>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* 3. Live Leaderboard Overlay (Mini) */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-40">
                <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[40vh]">
                    <div
                        className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => setShowLeaderboardModal(true)}
                    >
                        <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            <span className="text-sm font-bold text-white uppercase tracking-wider">Live Top 10</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-[10px] font-bold rounded-full border border-pink-500/30 animate-pulse">
                                LIVE
                            </div>
                            <ChevronUp className="w-4 h-4 text-white/50" />
                        </div>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar p-2">
                        <AnimatePresence>
                            {leaderboard.slice(0, 10).map((player, index) => (
                                <motion.div
                                    key={player.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`
                                        flex items-center justify-between p-2 rounded-lg mb-1
                                        ${player.isCurrentUser ? 'bg-indigo-500/30 border border-indigo-500/50' : 'hover:bg-white/5'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 text-center font-bold text-xs text-white/50">
                                            {index === 0 ? <Crown className="w-3.5 h-3.5 text-yellow-400 mx-auto" /> :
                                                index === 1 ? <Medal className="w-3.5 h-3.5 text-gray-300 mx-auto" /> :
                                                    index === 2 ? <Medal className="w-3.5 h-3.5 text-amber-700 mx-auto" /> :
                                                        <span>#{index + 1}</span>}
                                        </div>
                                        <span className={`text-sm truncate max-w-[120px] ${player.isCurrentUser ? 'font-bold text-white' : 'font-medium text-white/90'}`}>
                                            {player.name} {player.isCurrentUser && '(You)'}
                                        </span>
                                    </div>
                                    <div className="text-xs font-mono font-bold text-pink-400">
                                        {player.score}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <div
                            onClick={() => setShowLeaderboardModal(true)}
                            className="text-center py-2 text-xs text-white/40 hover:text-white cursor-pointer transition-colors border-t border-white/5 mt-1"
                        >
                            Tap to see full rankings
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Global Heart Particles */}
            <AnimatePresence>
                {hearts.map(heart => (
                    <motion.div
                        key={heart.id}
                        initial={{ opacity: 1, scale: 0, y: 0, x: 0 }}
                        animate={{
                            opacity: 0,
                            scale: 1,
                            y: -200,
                            x: (Math.random() - 0.5) * 50
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="fixed pointer-events-none z-50 text-4xl drop-shadow-lg"
                        style={{ left: heart.x, top: heart.y, rotate: heart.rotation }}
                    >
                        ❤️
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default GetMoreReview01;
