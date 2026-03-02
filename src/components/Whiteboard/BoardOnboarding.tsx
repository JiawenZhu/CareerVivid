import React, { useState, useEffect } from 'react';
import { MousePointer2, Move, ZoomIn, X } from 'lucide-react';

const BoardOnboarding: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeen = localStorage.getItem('careervivid_hasSeenBoardTutorial');
        if (!hasSeen) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('careervivid_hasSeenBoardTutorial', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <style>
                {`
                @keyframes twoFingerPan {
                    0%, 100% { transform: translate(0px, 0px); }
                    50% { transform: translate(-30px, -30px); }
                }
                @keyframes pinchZoomTopLeft {
                    0%, 100% { transform: translate(0px, 0px); }
                    50% { transform: translate(-15px, -15px); }
                }
                @keyframes pinchZoomBottomRight {
                    0%, 100% { transform: translate(0px, 0px); }
                    50% { transform: translate(15px, 15px); }
                }
                
                .animate-pan {
                    animation: twoFingerPan 2s ease-in-out infinite;
                }
                .animate-pinch-tl {
                    animation: pinchZoomTopLeft 2s ease-in-out infinite;
                }
                .animate-pinch-br {
                    animation: pinchZoomBottomRight 2s ease-in-out infinite;
                }
                
                @keyframes fadeInUpModal {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fade-in-up {
                    animation: fadeInUpModal 0.4s ease-out forwards;
                }
                `}
            </style>

            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-fade-in-up max-h-[95vh]">
                {/* Close Button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-full transition-colors z-10 cursor-pointer"
                >
                    <X size={20} />
                </button>

                <div className="p-6 sm:p-8 text-center overflow-y-auto">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <MousePointer2 className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome to the Whiteboard
                    </h2>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-sm mx-auto">
                        Master the canvas with these simple gestures to navigate and zoom like a pro.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                        {/* Two-Finger Pan Demo */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <div className="w-full h-32 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden shadow-inner mb-4 border border-gray-100 dark:border-gray-700">
                                {/* Pan dots */}
                                <div className="absolute inset-0 flex items-center justify-center translate-x-4 translate-y-4">
                                    <div className="absolute w-6 h-6 bg-blue-500/50 rounded-full animate-pan shadow-[0_0_15px_rgba(59,130,246,0.5)] border-2 border-blue-400/80 -mt-2 -ml-2"></div>
                                    <div className="absolute w-6 h-6 bg-blue-500/50 rounded-full animate-pan shadow-[0_0_15px_rgba(59,130,246,0.5)] border-2 border-blue-400/80 mt-2 ml-2"></div>
                                </div>
                                <div className="absolute text-gray-300 dark:text-gray-600 pointer-events-none">
                                    <Move size={48} className="opacity-20" />
                                </div>
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Two-Finger Pan</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                Drag with two fingers (or spacebar + click) to pan the canvas.
                            </p>
                        </div>

                        {/* Pinch to Zoom Demo */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <div className="w-full h-32 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden shadow-inner mb-4 border border-gray-100 dark:border-gray-700">
                                {/* Pinch dots */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="absolute w-6 h-6 bg-blue-500/50 rounded-full animate-pinch-tl -mt-4 -ml-4 shadow-[0_0_15px_rgba(59,130,246,0.5)] border-2 border-blue-400/80"></div>
                                    <div className="absolute w-6 h-6 bg-blue-500/50 rounded-full animate-pinch-br mt-4 ml-4 shadow-[0_0_15px_rgba(59,130,246,0.5)] border-2 border-blue-400/80"></div>
                                    <div className="absolute text-gray-300 dark:text-gray-600 pointer-events-none">
                                        <ZoomIn size={48} className="opacity-20" />
                                    </div>
                                </div>
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Pinch to Zoom</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                Pinch in/out (or ctrl + scroll) to zoom.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary-500/20 active:scale-[0.98] cursor-pointer"
                    >
                        Got it, let's go!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BoardOnboarding;
