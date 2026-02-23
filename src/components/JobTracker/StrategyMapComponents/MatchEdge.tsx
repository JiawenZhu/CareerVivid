import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from 'reactflow';
import { Scissors } from 'lucide-react';

const MatchEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected,
}: EdgeProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [path] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const isAnalyzing = data?.status === 'analyzing';
    const score = data?.score;

    // determine pill color based on score
    let pillColor = 'bg-gray-200 text-gray-600';
    let borderColor = '#94a3b8'; // default gray

    if (!isAnalyzing && score !== undefined) {
        if (score >= 70) {
            pillColor = 'bg-green-500 text-white';
            borderColor = '#22c55e';
        } else if (score >= 40) {
            pillColor = 'bg-yellow-500 text-white';
            borderColor = '#eab308';
        } else {
            pillColor = 'bg-red-500 text-white';
            borderColor = '#ef4444';
        }
    }

    const onScissorsClick = (evt: React.MouseEvent) => {
        evt.stopPropagation(); // prevent selecting the edge
        if (data?.onDelete) {
            data.onDelete(id);
        }
    };

    return (
        <g
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="react-flow__edge-match-group"
        >
            <BaseEdge
                path={path}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeWidth: isHovered || selected ? 3 : 2,
                    stroke: isAnalyzing ? '#94a3b8' : borderColor,
                    opacity: isAnalyzing ? 0.5 : 1,
                    transition: 'all 0.3s ease',
                }}
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${sourceX + (targetX - sourceX) / 2}px,${sourceY + (targetY - sourceY) / 2}px)`,
                        pointerEvents: 'all',
                    }}
                    className="flex flex-col items-center gap-1 group"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Score Pill / Loading State */}
                    <div
                        className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm transition-all duration-300 ${pillColor} ${isAnalyzing ? 'animate-pulse' : ''
                            }`}
                    >
                        {isAnalyzing ? 'Analyzing...' : `${score}%`}
                    </div>

                    {/* Scissors Button (Reveal strictly on hover) */}
                    <button
                        className={`
                            w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md
                            transition-all duration-200 transform hover:scale-110 hover:bg-red-700
                            ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
                        `}
                        onClick={onScissorsClick}
                        title="Hide connection (data preserved)"
                    >
                        <Scissors size={12} />
                    </button>
                </div>
            </EdgeLabelRenderer>
        </g>
    );
};

export default React.memo(MatchEdge);
