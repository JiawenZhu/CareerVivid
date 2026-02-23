import React from 'react';

const SnowParticles: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {Array.from({ length: 50 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute top-0 text-white animate-fall"
                    style={{
                        left: `${Math.random() * 100}%`,
                        animationDuration: `${Math.random() * 5 + 5}s`,
                        animationDelay: `-${Math.random() * 5}s`,
                        fontSize: `${Math.random() * 10 + 10}px`,
                        opacity: Math.random() * 0.5 + 0.3
                    }}
                >
                    ❄
                </div>
            ))}
            <style>
                {`
                @keyframes fall {
                    0% { transform: translateY(-10vh) translateX(0); }
                    100% { transform: translateY(110vh) translateX(20px); }
                }
                .animate-fall {
                    animation-name: fall;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
                `}
            </style>
        </div>
    );
};

export default SnowParticles;
