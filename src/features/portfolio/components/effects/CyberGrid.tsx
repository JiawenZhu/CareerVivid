import React from 'react';

const CyberGrid: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 perspective-[500px]">
            <div className="absolute bottom-[-50%] left-[-50%] w-[200%] h-[100%] bg-grid-cyber animate-grid-move transform rotate-x-[60deg]"
                style={{
                    backgroundImage: `linear-gradient(transparent 95%, rgba(168, 85, 247, 0.5) 95%), 
                                    linear-gradient(90deg, transparent 95%, rgba(168, 85, 247, 0.5) 95%)`,
                    backgroundSize: '40px 40px',
                    maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)'
                }}
            />

            <style>
                {`
                @keyframes grid-move {
                    0% { transform: rotateX(60deg) translateY(0); }
                    100% { transform: rotateX(60deg) translateY(40px); }
                }
                .animate-grid-move {
                    animation: grid-move 1s linear infinite;
                }
                `}
            </style>
        </div>
    );
};

export default CyberGrid;
