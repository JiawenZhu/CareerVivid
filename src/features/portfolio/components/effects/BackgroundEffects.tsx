import React from 'react';
import { LinkTreeTheme } from '../../styles/themes/types';
import MatrixRain from './MatrixRain';
import SnowParticles from './SnowParticles';
import CyberGrid from './CyberGrid';
import Fireflies from './Fireflies';
import Starfield from './Starfield';
import LiquidWaves from './LiquidWaves';

interface BackgroundEffectsProps {
    theme: LinkTreeTheme;
    customEffects?: any; // From portfolioData overrides
}

const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ theme, customEffects }) => {
    // Merge theme defaults with custom overrides
    const effects = {
        ...theme.effects,
        ...customEffects
    };

    return (
        <>
            {/* Matrix Rain */}
            {effects?.matrix && <MatrixRain />}

            {/* Snow / Particles */}
            {(effects?.particles) && <SnowParticles />}

            {/* Ambient Blobs */}
            {effects?.blobs && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] rounded-full bg-purple-500/30 blur-[80px] animate-blob" />
                    <div className="absolute bottom-[20%] left-[10%] w-[250px] h-[250px] rounded-full bg-blue-500/30 blur-[80px] animate-blob animation-delay-2000" />
                </div>
            )}

            {/* Retro Scanlines */}
            {effects?.scanlines && (
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] pointer-events-none z-10 opacity-30" />
            )}

            {/* Film Noise */}
            {effects?.noise && (
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-10" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
            )}

            {/* New Effects */}
            {effects?.grid && <CyberGrid />}
            {effects?.fireflies && <Fireflies />}
            {effects?.stars && <Starfield />}
            {effects?.waves && <LiquidWaves />}
        </>
    );
};

export default BackgroundEffects;
