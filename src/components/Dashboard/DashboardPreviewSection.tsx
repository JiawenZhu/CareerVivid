import React from 'react';
import { ChevronRight } from 'lucide-react';

interface DashboardPreviewSectionProps<T> {
    title: string;
    icon?: React.ReactNode;
    items: T[];
    renderItem: (item: T) => React.ReactNode;
    emptyMessage?: string;
    onViewAll?: () => void;
}

function DashboardPreviewSection<T>({
    title,
    icon,
    items,
    renderItem,
    emptyMessage = "No items yet.",
    onViewAll
}: DashboardPreviewSectionProps<T>) {

    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    {icon && <span className="text-gray-400">{icon}</span>}
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white font-sans">
                        {title}
                    </h2>
                </div>
                {items.length > 0 && onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition-colors"
                    >
                        View All <ChevronRight size={16} />
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x pr-4 -mx-4 px-4 scrollbar-hide">
                    {items.map((item, index) => (
                        <div key={index} className="snap-start shrink-0 w-[300px] md:w-[350px]">
                            {renderItem(item)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DashboardPreviewSection;
