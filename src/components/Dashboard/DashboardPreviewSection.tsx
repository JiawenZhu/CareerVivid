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
        <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4 px-0 sm:px-1">
            <div className="flex min-w-0 items-start gap-2 relative">
                {/* Immediate trigger for reorder modal */}
                {onLongPress ? (
                    <div
                        className="relative flex cursor-pointer touch-none select-none items-center justify-center rounded p-1 text-[var(--cv-text-muted)] transition-colors hover:bg-[var(--cv-surface-warm-muted)]"
                        onClick={onLongPress}
                    >
                        {viewMode === 'row' ? <GripHorizontal size={20} /> : <GripVertical size={20} />}
                    </div>
                ) : icon ? (
                    <span className="text-[var(--cv-text-muted)]">{icon}</span>
                ) : null}

                <EditableHeader
                    title={title}
                    isEditable={!!onTitleChange}
                    onSave={(newTitle) => onTitleChange?.(newTitle)}
                    onClick={onViewAll}
                />
            </div>
            {hasItems && onViewAll && (
                <button
                    onClick={onViewAll}
                    className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-[var(--cv-action-primary)] transition-colors hover:bg-[var(--cv-action-soft-bg)] hover:text-[var(--cv-action-primary-hover)] sm:px-3"
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
    mobileRenderItem?: (item: T) => React.ReactNode;
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
    mobileRenderItem,
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
        <div className="mb-8 sm:mb-12" ref={ref}>
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
                <div className={`w-full ${viewMode === 'row' ? 'h-[280px]' : 'h-[400px]'} animate-pulse rounded-2xl border border-[var(--cv-border-subtle)] bg-[var(--cv-surface-warm-muted)]`} />
            ) : items.length === 0 ? (
                <div 
                    onClick={onViewAll}
                    className={`cv-design-card flex flex-col items-center justify-center border-dashed p-6 text-center transition-all duration-300 group/empty sm:p-10
                        ${onViewAll ? 'cursor-pointer hover:border-[var(--cv-action-border)] hover:bg-[var(--cv-surface-warm-card-strong)]' : ''}
                    `}
                >
                    <div className="cv-design-icon-well mb-3 flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 group-hover/empty:scale-110 sm:mb-4 sm:h-12 sm:w-12">
                        <Plus className="h-5 w-5 text-[var(--cv-text-muted)] transition-colors group-hover/empty:text-[var(--cv-action-primary)] sm:h-6 sm:w-6" />
                    </div>
                    <p className="text-[14px] font-medium text-[var(--cv-text-body)] transition-colors group-hover/empty:text-[var(--cv-action-primary)]">{emptyMessage}</p>
                </div>
            ) : (
                <>
                    {mobileRenderItem && (
                        <div className="grid grid-cols-1 gap-3 pb-2 pt-1 md:hidden">
                            {items.map((item, index) => (
                                <div key={(item as any).id || index} className="w-full min-w-0 transform-gpu">
                                    {mobileRenderItem(item)}
                                </div>
                            ))}
                        </div>
                    )}

                    {viewMode === 'row' ? (
                        <div className={`${mobileRenderItem ? 'hidden md:flex' : 'flex'} gap-5 overflow-x-auto pb-6 snap-x pt-2 pr-6 -mx-6 px-6 scrollbar-hide`}>
                            {items.map((item, index) => (
                                <div key={(item as any).id || index} className="snap-start shrink-0 w-[300px] md:w-[360px] transform-gpu">
                                    {renderItem(item)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`${mobileRenderItem ? 'hidden md:grid' : 'grid'} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6 pt-2`}>
                            {items.map((item, index) => (
                                <div key={(item as any).id || index} className="w-full transform-gpu">
                                    {renderItem(item)}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default DashboardPreviewSection;
