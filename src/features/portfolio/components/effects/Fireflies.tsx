import React from 'react';

const Fireflies: React.FC = () => {
    // Generate static positions for hydration consistency, but animate them
    const fireflies = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4,
        size: 3 + Math.random() * 4
    }));

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {fireflies.map((ff) => (
                <div
                    key={ff.id}
                    className="absolute rounded-full bg-yellow-300 blur-[1px] animate-firefly"
                    style={{
                        left: `${ff.left}%`,
                        top: `${ff.top}%`,
                        width: `${ff.size}px`,
                        height: `${ff.size}px`,
                        animationDelay: `${ff.delay}s`,
                        animationDuration: `${ff.duration}s`,
                        boxShadow: '0 0 10px 2px rgba(253, 224, 71, 0.6)'
                    }}
                />
            ))}
            <style>
                {`
                @keyframes firefly {
                    0%, 100% { opacity: 0; transform: translate(0, 0) scale(0.5); }
                    25% { opacity: 1; transform: translate(20px, -20px) scale(1.2); }
                    50% { opacity: 0.5; transform: translate(-10px, 10px) scale(0.8); }
                    75% { opacity: 0.8; transform: translate(-20px, -10px) scale(1); }
                }
                .animate-firefly {
                    animation-name: firefly;
                    animation-iteration-count: infinite;
                    animation-timing-function: ease-in-out;
                }
                `}
            </style>
        </div>
    );
};

export default Fireflies;
