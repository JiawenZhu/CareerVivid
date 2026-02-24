import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, GripHorizontal, GripVertical } from 'lucide-react';
import EditableHeader from './EditableHeader';

export interface DraggableSectionHeaderProps {
    title: string;
    icon?: React.ReactNode;
    viewMode?: 'row' | 'grid';
    onLongPress?: () => void;
    onViewAll?: () => void;
    hasItems?: boolean;
    onTitleChange?: (newTitle: string) => void;
}

export const DraggableSectionHeader: React.FC<DraggableSectionHeaderProps> = ({
    title,
    icon,
    viewMode = 'row',
    onLongPress,
    onViewAll,
    hasItems = true,
    onTitleChange
}) => {
    // ─── Long Press Logic ───
    const [countdown, setCountdown] = useState<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const clearTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setCountdown(null);
    };

    const startPress = () => {
        if (!onLongPress) return;
        let ticks = 2; // 2 seconds
        setCountdown(ticks);
        timerRef.current = setInterval(() => {
            ticks -= 1;
            if (ticks <= 0) {
                clearTimer();
                onLongPress();
            } else {
                setCountdown(ticks);
            }
        }, 1000);
    };

    // Cleanup on unmount
    useEffect(() => {
        return clearTimer;
    }, []);

    return (
        <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2 relative">
                {/* Render Grip Icon if onLongPress provided OR replace generic icon */}
                {onLongPress ? (
                    <div
                        className="relative flex items-center justify-center p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-grab active:cursor-grabbing text-gray-400 select-none touch-none"
                        onMouseDown={startPress}
                        onMouseUp={clearTimer}
                        onMouseLeave={clearTimer}
                        onTouchStart={startPress}
                        onTouchEnd={clearTimer}
                    >
                        {viewMode === 'row' ? <GripHorizontal size={20} /> : <GripVertical size={20} />}

                        {/* Countdown Badge Overlay */}
                        {countdown !== null && (
                            <div className="absolute -top-3 -right-3 w-5 h-5 bg-primary-500 text-white text-xs font-bold flex items-center justify-center rounded-full shadow-sm animate-pulse z-10">
                                {countdown}
                            </div>
                        )}
                    </div>
                ) : icon ? (
                    <span className="text-gray-400">{icon}</span>
                ) : null}

                <EditableHeader
                    title={title}
                    isEditable={!!onTitleChange}
                    onSave={(newTitle) => onTitleChange?.(newTitle)}
                />
            </div>
            {hasItems && onViewAll && (
                <button
                    onClick={onViewAll}
                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition-colors"
                >
                    View All <ChevronRight size={16} />
                </button>
            )}
        </div>
    );
};

interface DashboardPreviewSectionProps<T> {
    title: string;
    icon?: React.ReactNode;
    items: T[];
    renderItem: (item: T) => React.ReactNode;
    emptyMessage?: string;
    onViewAll?: () => void;
    viewMode?: 'row' | 'grid';
    onLongPress?: () => void;
    onTitleChange?: (newTitle: string) => void;
}

function DashboardPreviewSection<T>({
    title,
    icon,
    items,
    renderItem,
    emptyMessage = "No items yet.",
    onViewAll,
    viewMode = 'row',
    onLongPress,
    onTitleChange
}: DashboardPreviewSectionProps<T>) {

    return (
        <div className="mb-10">
            <DraggableSectionHeader
                title={title}
                icon={icon}
                viewMode={viewMode}
                onLongPress={onLongPress}
                onViewAll={onViewAll}
                hasItems={items.length > 0}
                onTitleChange={onTitleChange}
            />

            {items.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                </div>
            ) : viewMode === 'row' ? (
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x pr-4 -mx-4 px-4 scrollbar-hide">
                    {items.map((item, index) => (
                        <div key={index} className="snap-start shrink-0 w-[300px] md:w-[350px]">
                            {renderItem(item)}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4">
                    {items.map((item, index) => (
                        <div key={index} className="w-full">
                            {renderItem(item)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DashboardPreviewSection;
