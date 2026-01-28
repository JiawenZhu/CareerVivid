import React from 'react';

const LiquidWaves: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-end justify-center">
            <div className="absolute bottom-0 w-[200%] h-[30vh] opacity-30 animate-wave-slow bg-blue-500 rounded-[40%] blur-[2px]" />
            <div className="absolute bottom-[-2vh] w-[200%] h-[30vh] opacity-30 animate-wave-med bg-cyan-400 rounded-[45%] blur-[2px]" />
            <div className="absolute bottom-[-5vh] w-[200%] h-[35vh] opacity-20 animate-wave-fast bg-teal-300 rounded-[40%] blur-[2px]" />

            <style>
                {`
                @keyframes wave {
                    0% { transform: translateX(-50%) rotate(0deg); }
                    50% { transform: translateX(0%) rotate(5deg); }
                    100% { transform: translateX(-50%) rotate(0deg); }
                }
                .animate-wave-slow {
                    animation: wave 12s infinite linear;
                    left: -50%;
                }
                .animate-wave-med {
                    animation: wave 8s infinite linear reverse;
                    left: -50%;
                }
                .animate-wave-fast {
                    animation: wave 6s infinite linear;
                    left: -50%;
                }
                `}
            </style>
        </div>
    );
};

export default LiquidWaves;
