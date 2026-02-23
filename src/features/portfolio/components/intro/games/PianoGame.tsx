import React, { useState, useEffect, useRef } from 'react';
import { Music, Mic, Play, RotateCcw, CheckCircle2, ListMusic, User } from 'lucide-react';
import { savePianoRecording, fetchRecentRecordings } from '../../../services/pianoService';
import { PianoRecording } from '../../../types/portfolio';

interface Note {
    key: string; // Keyboard key (e.g. 'a')
    note: string; // Musical note (e.g. 'C4')
    label: string; // Display label
}

const NOTES: Note[] = [
    { key: 'a', note: 'C4', label: 'C' },
    { key: 's', note: 'D4', label: 'D' },
    { key: 'd', note: 'E4', label: 'E' },
    { key: 'f', note: 'F4', label: 'F' },
    { key: 'g', note: 'G4', label: 'G' },
    { key: 'h', note: 'A4', label: 'A' },
    { key: 'j', note: 'B4', label: 'B' },
    { key: 'k', note: 'C5', label: 'C5' },
];

const SONG_SUGGESTIONS = [
    "Moonlight Sonata", "Für Elise", "Clair de Lune", "Imagine", "Bohemian Rhapsody", "Let It Be", "Tiny Dancer", "Piano Man"
];

interface PianoGameProps {
    portfolioId?: string;
    isPreview?: boolean;
}

const PianoGame: React.FC<PianoGameProps> = ({ portfolioId, isPreview }) => {
    // Game State
    const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
    const [bubbles, setBubbles] = useState<{ id: number; key: string; left: string; size: number }[]>([]);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordedNotes, setRecordedNotes] = useState<{ note: string; time: number }[]>([]);
    const [isSaved, setIsSaved] = useState(false);
    const startTimeRef = useRef<number | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Social State
    const [showNameModal, setShowNameModal] = useState(false);
    const [trackName, setTrackName] = useState('');
    const [showCommunityBoard, setShowCommunityBoard] = useState(false);
    const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
    const [communityRecordings, setCommunityRecordings] = useState<PianoRecording[]>([]);
    const [isPlayingPlayback, setIsPlayingPlayback] = useState(false);

    // Audio Context Ref
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize Audio
    const initAudio = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
            ctx.resume().catch(err => console.error("Audio resume failed:", err));
        }
        return ctx;
    };

    // Unlock audio on first interaction (required for iOS)
    useEffect(() => {
        const unlockAudio = () => {
            const ctx = initAudio();

            // Play silent buffer to force-start audio on iOS
            try {
                const buffer = ctx.createBuffer(1, 1, 22050);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(0);
            } catch (e) {
                console.error("Silent unlock failed", e);
            }

            // Remove listeners after first successful unlock attempt
            ['click', 'touchstart', 'touchend', 'keydown'].forEach(evt =>
                window.removeEventListener(evt, unlockAudio)
            );
        };

        ['click', 'touchstart', 'touchend', 'keydown'].forEach(evt =>
            window.addEventListener(evt, unlockAudio)
        );

        return () => {
            ['click', 'touchstart', 'touchend', 'keydown'].forEach(evt =>
                window.removeEventListener(evt, unlockAudio)
            );
        };
    }, []);

    const getFrequency = (note: string) => {
        const notes: Record<string, number> = {
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
            'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25
        };
        return notes[note] || 440;
    };

    const playNote = (note: string) => {
        initAudio();
        if (!audioContextRef.current) return;

        const ctx = audioContextRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.value = getFrequency(note);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 1.5);
    };

    // --- Interaction Handlers ---

    const resetSilenceTimer = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        if (isRecording && !isSaved) {
            silenceTimerRef.current = setTimeout(() => {
                handleFinishRecording();
            }, 3000); // 3 seconds silence
        }
    };

    const handleKeyDown = (key: string) => {
        if (isSaved || showNameModal || showCommunityBoard || isPlayingPlayback) return;

        const noteObj = NOTES.find(n => n.key === key);
        if (noteObj && !activeKeys.has(key)) {
            setActiveKeys(prev => new Set(prev).add(key));
            playNote(noteObj.note);
            spawnBubble(key);

            // Start Recording
            if (!isRecording && recordingTime === 0 && !isSaved) {
                setIsRecording(true);
                startTimeRef.current = Date.now();
            }

            // Capture Note
            if (isRecording || (!isRecording && recordingTime === 0 && !isSaved)) {
                const start = startTimeRef.current || Date.now();
                const timeOffset = Date.now() - start;
                setRecordedNotes(prev => [...prev, { note: noteObj.note, time: timeOffset }]);
                resetSilenceTimer();
            }
        }
    };

    const handleKeyUp = (key: string) => {
        setActiveKeys(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
        });
    };

    const spawnBubble = (key: string) => {
        const noteIndex = NOTES.findIndex(n => n.key === key);
        // Calculate centered position relative to container
        // Center is 50%.
        // Each key slot is 3.5rem (3rem width + 0.5rem gap).
        // Center index is 3.5 (total 8 keys).
        // Formula: 50% + (index - 3.5) * 3.5rem
        const size = Math.random() * 20 + 40; // Random size 40-60px
        const left = `calc(50% + ${(noteIndex - 3.5) * 3.5}rem - ${size / 2}px)`;
        const id = Date.now() + Math.random();

        setBubbles(prev => [...prev, { id, key, left, size }]);
        setTimeout(() => setBubbles(prev => prev.filter(b => b.id !== id)), 3000);
    };

    // --- Effects ---

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => handleKeyDown(e.key.toLowerCase());
        const onKeyUp = (e: KeyboardEvent) => handleKeyUp(e.key.toLowerCase());
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [activeKeys, isRecording, isSaved, showNameModal, showCommunityBoard, isPlayingPlayback]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording && !isSaved) {
            interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording, isSaved]);

    // Cleanup silence timer
    useEffect(() => {
        return () => {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        };
    }, []);

    // --- Recording & Replay Logic ---

    const handleFinishRecording = () => {
        setIsRecording(false);
        setIsSaved(true);
        setShowNameModal(true); // Prompt for name
    };

    const saveTrack = async () => {
        if (!trackName.trim()) return;

        setShowNameModal(false);

        // Allow saving if portfolioId exists, even in preview (for testing)
        if (portfolioId) {
            try {
                await savePianoRecording({
                    portfolioId,
                    duration: recordingTime,
                    notes: recordedNotes,
                    visitorName: trackName
                });
            } catch (err) {
                console.error(err);
            }
        }

        // Slight delay to ensure Firestore propagation
        setTimeout(() => {
            openCommunityBoard();
        }, 500);
    };

    const openCommunityBoard = async () => {
        setShowCommunityBoard(true);
        setIsLoadingRecordings(true);
        try {
            const recs = await fetchRecentRecordings();
            setCommunityRecordings(recs);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingRecordings(false);
        }
    };

    const playRecording = (rec: PianoRecording) => {
        if (isPlayingPlayback) return;
        setIsPlayingPlayback(true);

        rec.notes.forEach((n) => {
            setTimeout(() => {
                playNote(n.note);
                // Visual feedback
                const noteDef = NOTES.find(x => x.note === n.note);
                if (noteDef) {
                    spawnBubble(noteDef.key);
                    setActiveKeys(prev => new Set(prev).add(noteDef.key));
                    setTimeout(() => setActiveKeys(prev => {
                        const next = new Set(prev);
                        next.delete(noteDef.key);
                        return next;
                    }), 200);
                }
            }, n.time);
        });

        const maxTime = Math.max(...rec.notes.map(n => n.time)) + 500;
        setTimeout(() => {
            setIsPlayingPlayback(false);
        }, maxTime);
    };

    const restartGame = () => {
        setIsSaved(false);
        setRecordingTime(0);
        setRecordedNotes([]);
        startTimeRef.current = null;
        setTrackName('');
        setShowNameModal(false);
        setShowCommunityBoard(false);
    };

    // --- Render ---

    return (
        <div className="w-full h-full relative flex flex-col items-center justify-end pb-20 overflow-hidden bg-neutral-100 select-none font-sans">
            {/* Bubbles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {bubbles.map(bubble => (
                    <div
                        key={bubble.id}
                        className="absolute bottom-40 border-2 border-black bg-cyan-300/40 rounded-full animate-floating-bubble shadow-[inset_-4px_-4px_10px_rgba(255,255,255,0.5),4px_4px_0px_rgba(0,0,0,1)]"
                        style={{
                            left: bubble.left,
                            width: bubble.size,
                            height: bubble.size
                        }}
                    />
                ))}
            </div>

            {/* HUD */}
            <div className="absolute top-4 left-4 md:top-8 md:left-8 flex flex-col gap-3 md:gap-4 z-20 max-w-[90vw]">
                <div className={`
                    flex items-center gap-2 md:gap-3 px-3 py-2 md:px-5 md:py-3 border-2 border-black font-bold bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg transition-colors text-sm md:text-base
                    ${isRecording ? 'text-red-500 border-red-500' : 'text-black'}
                    ${isSaved ? 'text-green-600 border-green-600' : ''}
                 `}>
                    {isSaved ? <CheckCircle2 size={16} className="md:w-5 md:h-5" /> : <Mic className={`w-4 h-4 md:w-5 md:h-5 ${isRecording ? 'animate-pulse' : ''}`} />}
                    <span>{isSaved ? 'Recorded' : (isRecording ? 'Recording...' : 'Play to Record')}</span>
                    <span className="font-mono bg-neutral-100 px-2 rounded border border-neutral-200">
                        {new Date((isRecording ? recordingTime : recordingTime) * 1000).toISOString().substr(14, 5)}
                    </span>
                </div>

                {!isRecording && !isSaved && (
                    <button
                        onClick={openCommunityBoard}
                        className="flex items-center gap-2 px-3 py-2 md:px-5 md:py-3 border-2 border-black bg-yellow-300 hover:bg-yellow-400 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg transition-transform active:translate-y-1 active:shadow-none text-sm md:text-base w-fit"
                    >
                        <ListMusic size={16} className="md:w-5 md:h-5" />
                        <span>Community Board</span>
                    </button>
                )}
            </div>

            {/* Piano Keys Container */}
            <div className={`relative z-10 w-full flex justify-center pb-8 px-2`}>
                <div className={`
                    flex gap-2 p-2 bg-white/80 backdrop-blur-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl transition-all duration-500 
                    overflow-x-auto max-w-full touch-pan-x
                    ${showNameModal || showCommunityBoard ? 'blur-sm scale-95 opacity-50' : ''}
                `}>
                    {NOTES.map((n) => {
                        const isActive = activeKeys.has(n.key);
                        return (
                            <button
                                key={n.key}
                                onMouseDown={() => handleKeyDown(n.key)}
                                onMouseUp={() => handleKeyUp(n.key)}
                                onMouseLeave={() => handleKeyUp(n.key)}
                                onTouchStart={(e) => {
                                    if (e.cancelable) e.preventDefault();
                                    handleKeyDown(n.key);
                                }}
                                onTouchEnd={(e) => {
                                    if (e.cancelable) e.preventDefault();
                                    handleKeyUp(n.key);
                                }}
                                className={`
                                w-12 h-56 md:h-64 border-2 border-black rounded-b-xl flex flex-col justify-end items-center pb-6 transition-all duration-100 shrink-0 touch-none select-none
                                ${isActive
                                        ? 'bg-black text-white translate-y-2 shadow-none'
                                        : 'bg-white hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                    }
                            `}
                            >
                                <span className="font-bold text-xl mb-1">{n.label}</span>
                                <span className="text-xs uppercase opacity-40 font-mono tracking-wider">{n.key}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="absolute bottom-2 text-[10px] md:text-xs font-mono opacity-50 z-10 text-center w-full px-4">
                Press keys A-K or tap to play • 3s silence saves
            </div>

            {/* Naming Modal */}
            {showNameModal && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in">
                    <div className="bg-white border-4 border-black p-8 rounded-2xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full m-4">
                        <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                            <Music className="text-purple-600" />
                            Melody Captured!
                        </h3>
                        <p className="text-gray-600 mb-6 font-medium">Name your masterpiece to share it with the world.</p>

                        <div className="mb-6">
                            <label className="block text-xs font-bold uppercase tracking-wide mb-2">Track Title</label>
                            <input
                                autoFocus
                                type="text"
                                value={trackName}
                                onChange={(e) => setTrackName(e.target.value)}
                                placeholder="e.g. Rainy Day Mood..."
                                className="w-full px-4 py-3 border-2 border-black rounded-lg text-lg font-bold focus:outline-none focus:ring-4 focus:ring-purple-200"
                            />
                        </div>

                        <div className="mb-8">
                            <div className="text-xs font-bold uppercase tracking-wide mb-2 opacity-50">Suggestions</div>
                            <div className="flex flex-wrap gap-2">
                                {SONG_SUGGESTIONS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setTrackName(s)}
                                        className="px-3 py-1 border border-black/20 rounded-full text-sm font-medium hover:bg-black hover:text-white transition-colors"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={restartGame}
                                className="flex-1 px-6 py-3 border-2 border-black font-bold rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={saveTrack}
                                disabled={!trackName.trim()}
                                className="flex-1 px-6 py-3 bg-black text-white border-2 border-black font-bold rounded-lg hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(120,120,120,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save & Share
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Community Board Modal */}
            {showCommunityBoard && (
                <div className="absolute inset-0 bg-white z-[200] flex flex-col overflow-hidden animate-slide-up">
                    <div className="p-6 border-b-4 border-black flex justify-between items-center bg-yellow-300">
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter">COMMUNITY_HITS</h2>
                            <p className="font-bold opacity-60">Recent jams from around the world</p>
                        </div>
                        <button
                            onClick={restartGame}
                            className="px-6 py-2 bg-black text-white font-bold rounded-full hover:scale-105 transition-transform"
                        >
                            Back to Piano
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-neutral-100">
                        <div className="max-w-3xl mx-auto space-y-4">
                            {isLoadingRecordings ? (
                                <div className="text-center py-20 opacity-50 font-bold text-xl animate-pulse">
                                    Loading beats...
                                </div>
                            ) : communityRecordings.length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="opacity-50 font-bold text-xl mb-4">No beats found yet.</p>
                                    <p className="opacity-40">Be the first to drop a track!</p>
                                </div>
                            ) : (
                                communityRecordings.map((rec, i) => (
                                    <div key={rec.id} className="bg-white border-2 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between hover:translate-x-1 hover:translate-y-[-2px] transition-transform">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold font-mono">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg">{rec.visitorName || 'Untitled Track'}</h4>
                                                <div className="flex items-center gap-2 text-sm opacity-60 font-mono">
                                                    <span>{rec.duration}s</span>
                                                    <span>•</span>
                                                    <span>{new Date((rec.timestamp as any)?.seconds * 1000 || Date.now()).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => playRecording(rec)}
                                            disabled={isPlayingPlayback}
                                            className="px-4 py-2 border-2 border-black rounded-lg hover:bg-black hover:text-white transition-colors flex items-center gap-2 font-bold disabled:opacity-50"
                                        >
                                            <Play size={16} fill="currentColor" />
                                            {isPlayingPlayback ? 'Playing...' : 'Replay'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PianoGame;
