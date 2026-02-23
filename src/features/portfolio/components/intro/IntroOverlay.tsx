import React, { useState, useEffect } from 'react';
import { IntroPageConfig } from '../../types/portfolio';
import { Play, Pause, Volume2, VolumeX, Gamepad2 } from 'lucide-react';
import PianoGame from './games/PianoGame';

interface IntroOverlayProps {
    config: IntroPageConfig;
    onEnter: () => void;
    position?: 'fixed' | 'absolute';
    portfolioId?: string; // For saving game data
    isPreview?: boolean;
}

const IntroOverlay: React.FC<IntroOverlayProps> = ({ config, onEnter, position = 'fixed', portfolioId, isPreview = false }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [muted, setMuted] = useState(true);
    // const [isPlaying, setIsPlaying] = useState(true); // Unused
    const [isMobile, setIsMobile] = useState(false);

    // Resolve Active Asset (Multi-asset support)
    // Priority: Explicit Active ID -> First Asset -> Legacy Config (fallback)
    const activeAsset = React.useMemo(() => {
        if (config.assets && config.assets.length > 0) {
            return config.assets.find(a => a.id === config.activeAssetId) || config.assets[0];
        }
        return config; // Fallback to legacy root props
    }, [config]);

    // Use activeAsset for content properties, but config for shared properties (like button style)
    const contentType = activeAsset.type || 'image';
    const contentUrl = activeAsset.contentUrl;
    const mobileContentUrl = activeAsset.mobileContentUrl;
    const objectFit = activeAsset.objectFit || 'cover';
    const mobileObjectFit = activeAsset.mobileObjectFit || 'cover';
    // Game Specific
    const gameType = activeAsset.gameType;
    const embedCode = activeAsset.embedCode;

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Auto-dismiss logic
    useEffect(() => {
        if (config.autoDismissTimer && config.autoDismissTimer > 0) {
            const timer = setTimeout(() => {
                handleEnter();
            }, config.autoDismissTimer * 1000);
            return () => clearTimeout(timer);
        }
    }, [config.autoDismissTimer]);

    const handleEnter = () => {
        setIsVisible(false);
        setTimeout(onEnter, 500); // Wait for exit animation
    };

    if (!isVisible) return null;

    // Button Style Classes
    const getButtonClasses = () => {
        const base = "px-8 py-3 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2 z-50";
        switch (config.buttonStyle) {
            case 'solid':
                return `${base} bg-white text-black hover:bg-gray-100 shadow-xl`;
            case 'outline':
                return `${base} border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm`;
            case 'glass':
                return `${base} bg-white/20 border border-white/30 text-white backdrop-blur-md shadow-lg hover:bg-white/30`;
            default:
                return `${base} border-2 border-white text-white`;
        }
    };

    return (
        <div className={`${position} inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>

            {/* Background / Content Layer */}
            <div className="absolute inset-0 overflow-hidden">
                {contentType === 'video' && (
                    <>
                        {/* Hidden Video for Preloading/Switching - simpler approach is one video element with JS source switching or two video elements toggled by CSS */}
                        <video
                            src={isMobile && mobileContentUrl ? mobileContentUrl : contentUrl}
                            className="w-full h-full"
                            style={{
                                objectFit: (isMobile && mobileObjectFit) ? mobileObjectFit : objectFit
                            } as any}
                            autoPlay
                            loop
                            muted={muted}
                            playsInline
                            key={isMobile ? 'mobile' : 'desktop'} // Force remount on view switch if needed, but CSS media query better for pure hiding
                        />
                        {/* Video Controls */}
                        <div className="absolute top-4 right-4 z-50 flex gap-2">
                            <button onClick={() => setMuted(!muted)} className="p-2 bg-black/30 rounded-full text-white hover:bg-black/50 backdrop-blur-md">
                                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                        </div>
                    </>
                )}

                {contentType === 'image' && (
                    <picture className="w-full h-full block">
                        {mobileContentUrl && (
                            <source media="(max-width: 767px)" srcSet={mobileContentUrl} />
                        )}
                        <img
                            src={contentUrl}
                            alt="Intro"
                            className="w-full h-full animate-pulse-slow"
                            style={{
                                objectFit: (isMobile && mobileObjectFit) ? mobileObjectFit : objectFit
                            } as any}
                        />
                    </picture>
                )}

                {contentType === 'game' && (
                    <div className="w-full h-full bg-indigo-900 flex items-center justify-center relative">
                        {gameType === 'piano_flow' ? (
                            <PianoGame
                                portfolioId={portfolioId}
                                isPreview={isPreview}
                            />
                        ) : gameType === 'custom' && embedCode ? (
                            <div
                                className="w-full h-full"
                                dangerouslySetInnerHTML={{ __html: embedCode }}
                            />
                        ) : (
                            <div className="text-center text-white p-8">
                                <Gamepad2 size={64} className="mx-auto mb-4 opacity-50" />
                                <h2 className="text-3xl font-bold mb-2">Game Zone</h2>
                                <p className="opacity-75">Interactive game placeholder: {gameType}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Overlay Gradient for Text readability (if needed) */}
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />

            {/* Center Call to Action */}
            <div className="relative z-50 flex flex-col items-center gap-6 animate-fade-in-up delay-300">
                <button
                    onClick={handleEnter}
                    className={getButtonClasses()}
                >
                    {config.buttonText || "Enter"}
                </button>
            </div>
        </div>
    );
};

export default IntroOverlay;
