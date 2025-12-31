import React, { useRef, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Circle } from 'lucide-react';

interface MobileGameControlsProps {
    onInput: (key: string) => void;
    layout?: 'dpad' | 'horizontal' | 'vertical'; // Basic layout variations if needed
    showAction?: boolean; // Show generic action button (Space)
    className?: string;
}

const MobileGameControls: React.FC<MobileGameControlsProps> = ({ onInput, showAction = true, className = '' }) => {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [activeKey, setActiveKey] = useState<string | null>(null);

    const handleStart = (key: string) => {
        // Trigger immediately
        onInput(key);
        setActiveKey(key);

        // Clear existing interval just in case
        if (intervalRef.current) clearInterval(intervalRef.current);

        // Repeat
        intervalRef.current = setInterval(() => {
            onInput(key);
        }, 100); // 10Hz repeat rate
    };

    const handleEnd = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setActiveKey(null);
    };

    // Prevent default context menu on long press
    const preventContext = (e: React.TouchEvent | React.MouseEvent) => {
        // e.preventDefault(); // Don't prevent default globally, might block scrolling if missed button
        // But strictly for buttons we might want to.
    };

    const Button = ({ keyName, icon: Icon, styles }: { keyName: string, icon: any, styles: string }) => (
        <button
            className={`flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg transition-all active:scale-95 touch-none select-none ${activeKey === keyName ? 'bg-white/40' : 'bg-black/30'} ${styles}`}
            onMouseDown={(e) => { e.preventDefault(); handleStart(keyName); }}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => { e.preventDefault(); handleStart(keyName); }}
            onTouchEnd={handleEnd}
            onContextMenu={(e) => e.preventDefault()}
        >
            <Icon size={24} className="text-white opacity-90" />
        </button>
    );

    return (
        <div className={`absolute inset-x-0 bottom-8 px-8 z-50 flex items-end justify-between pointer-events-none ${className}`}>
            {/* D-Pad Area */}
            <div className="relative w-40 h-40 pointer-events-auto">
                {/* Up */}
                <Button keyName="ArrowUp" icon={ChevronUp} styles="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-t-xl rounded-b-md" />
                {/* Down */}
                <Button keyName="ArrowDown" icon={ChevronDown} styles="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-b-xl rounded-t-md" />
                {/* Left */}
                <Button keyName="ArrowLeft" icon={ChevronLeft} styles="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-12 rounded-l-xl rounded-r-md" />
                {/* Right */}
                <Button keyName="ArrowRight" icon={ChevronRight} styles="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-12 rounded-r-xl rounded-l-md" />
            </div>

            {/* Action Button Area */}
            {showAction && (
                <div className="pointer-events-auto pb-4 pr-4">
                    <button
                        className={`w-20 h-20 rounded-full backdrop-blur-md border-2 border-white/20 shadow-xl flex items-center justify-center transition-all active:scale-95 touch-none ${activeKey === ' ' ? 'bg-indigo-500/60' : 'bg-indigo-500/30'}`}
                        onMouseDown={(e) => { e.preventDefault(); handleStart(' '); }}
                        onMouseUp={handleEnd}
                        onMouseLeave={handleEnd}
                        onTouchStart={(e) => { e.preventDefault(); handleStart(' '); }}
                        onTouchEnd={handleEnd}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <div className="w-16 h-16 rounded-full border border-white/30 flex items-center justify-center">
                            <span className="text-white font-bold text-xl tracking-wider">A</span>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
};

export default MobileGameControls;
