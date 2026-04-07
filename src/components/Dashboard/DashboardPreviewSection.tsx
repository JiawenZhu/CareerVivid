import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, GripHorizontal, GripVertical, Plus } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
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
    return (
        <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2 relative">
                {/* Immediate trigger for reorder modal */}
                {onLongPress ? (
                    <div
                        className="relative flex items-center justify-center p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-400 select-none touch-none"
                        onClick={onLongPress}
                    >
                        {viewMode === 'row' ? <GripHorizontal size={20} /> : <GripVertical size={20} />}
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
                    className="text-[13px] font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-500/10"
                >
                    View All <ChevronRight size={14} />
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

    // Lazy load logic
    const { ref, inView } = useInView({
        triggerOnce: true, // Only trigger once
        rootMargin: '200px 0px', // Start rendering slightly before scrolling into view
    });

    const [hasRendered, setHasRendered] = useState(false);

    useEffect(() => {
        if (inView) {
            setHasRendered(true);
        }
    }, [inView]);

    return (
        <div className="mb-12" ref={ref}>
            <DraggableSectionHeader
                title={title}
                icon={icon}
                viewMode={viewMode}
                onLongPress={onLongPress}
                onViewAll={onViewAll}
                hasItems={items.length > 0}
                onTitleChange={onTitleChange}
            />

            {!hasRendered ? (
                // Skeleton height placeholder based on ViewMode
                <div className={`w-full ${viewMode === 'row' ? 'h-[280px]' : 'h-[400px]'} bg-gray-50/50 dark:bg-gray-900/20 rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse`} />
            ) : items.length === 0 ? (
                <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-[24px] p-10 text-center border border-dashed border-gray-300/50 dark:border-gray-800/50 transition-all hover:border-gray-400 dark:hover:border-gray-700 flex flex-col justify-center items-center shadow-sm">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <Plus className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-[14px] text-gray-500 dark:text-gray-400 font-medium">{emptyMessage}</p>
                </div>
            ) : viewMode === 'row' ? (
                <div className="flex gap-5 overflow-x-auto pb-6 snap-x pt-2 pr-6 -mx-6 px-6 scrollbar-hide">
                    {items.map((item, index) => (
                        <div key={(item as any).id || index} className="snap-start shrink-0 w-[300px] md:w-[360px] transform-gpu">
                            {renderItem(item)}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6 pt-2">
                    {items.map((item, index) => (
                        <div key={index} className="w-full transform-gpu">
                            {renderItem(item)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DashboardPreviewSection;
