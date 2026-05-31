import React from 'react';
import { Check, ChevronDown, FileText, Globe, Mic, MoreVertical, PenTool, SlidersHorizontal } from 'lucide-react';
import { SidebarNode } from '../../types';
import { navigate } from '../../utils/navigation';
import { getPathForNodeId } from '../../utils/workspaceNavigation';

interface SidebarDocumentListProps {
    activeDocuments: SidebarNode[];
    activeNodeId: string | null;
    editingNodeId: string | null;
    editValue: string;
    filterType: string;
    sortBy: 'createdAt' | 'updatedAt';
    isFilterDropdownOpen: boolean;
    filterDropdownRef: React.RefObject<HTMLDivElement>;
    setActiveNode: (nodeId: string) => void;
    setEditValue: (value: string) => void;
    setEditingNodeId: (nodeId: string | null) => void;
    setContextMenu: (menu: { x: number; y: number; nodeId: string; text: string; type: string } | null) => void;
    setFilterType: (type: string) => void;
    setSortBy: (sortBy: 'createdAt' | 'updatedAt') => void;
    setIsFilterDropdownOpen: (isOpen: boolean) => void;
    savePreference: (key: 'filterType' | 'sortBy', value: string) => void;
    saveRename: (id: string) => void;
}

const getDocIcon = (type: string) => {
    switch (type) {
        case 'resume':
            return <FileText size={15} className="text-sky-500" />;
        case 'portfolio':
            return <Globe size={15} className="text-emerald-500" />;
        case 'whiteboard':
            return <PenTool size={15} className="text-amber-500" />;
        case 'post':
            return <FileText size={15} className="text-violet-500" />;
        case 'interview':
            return <Mic size={15} className="text-rose-500" />;
        default:
            return <FileText size={15} className="text-gray-400" />;
    }
};

const SidebarDocumentList: React.FC<SidebarDocumentListProps> = ({
    activeDocuments,
    activeNodeId,
    editingNodeId,
    editValue,
    filterType,
    sortBy,
    isFilterDropdownOpen,
    filterDropdownRef,
    setActiveNode,
    setEditValue,
    setEditingNodeId,
    setContextMenu,
    setFilterType,
    setSortBy,
    setIsFilterDropdownOpen,
    savePreference,
    saveRename,
}) => {
    const listRef = React.useRef<HTMLDivElement>(null);
    const [scrollState, setScrollState] = React.useState({
        canScroll: false,
        atBottom: true,
        remainingRows: 0,
    });
    const filterLabel = filterType === 'all'
        ? 'All'
        : `${filterType.charAt(0).toUpperCase()}${filterType.slice(1)}s`;
    const sortLabel = sortBy === 'updatedAt' ? 'Recent' : 'Created';

    const updateScrollState = React.useCallback(() => {
        const list = listRef.current;
        if (!list) return;

        const hiddenHeight = list.scrollHeight - list.clientHeight;
        const remainingHeight = hiddenHeight - list.scrollTop;
        const canScroll = hiddenHeight > 8;
        const atBottom = remainingHeight <= 12;

        const estimatedRemainingRows = canScroll && !atBottom
            ? Math.max(1, Math.ceil(remainingHeight / 42))
            : 0;
        const nextState = {
            canScroll,
            atBottom,
            remainingRows: Math.min(Math.max(activeDocuments.length - 1, 0), estimatedRemainingRows),
        };

        setScrollState((previousState) => {
            if (
                previousState.canScroll === nextState.canScroll &&
                previousState.atBottom === nextState.atBottom &&
                previousState.remainingRows === nextState.remainingRows
            ) {
                return previousState;
            }

            return nextState;
        });
    }, [activeDocuments.length]);

    React.useEffect(() => {
        const list = listRef.current;
        if (!list) return;

        const rafId = window.requestAnimationFrame(updateScrollState);
        list.addEventListener('scroll', updateScrollState, { passive: true });
        window.addEventListener('resize', updateScrollState);

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(updateScrollState)
            : null;
        resizeObserver?.observe(list);

        return () => {
            window.cancelAnimationFrame(rafId);
            list.removeEventListener('scroll', updateScrollState);
            window.removeEventListener('resize', updateScrollState);
            resizeObserver?.disconnect();
        };
    }, [filterType, sortBy, updateScrollState]);

    const scrollToMoreFiles = () => {
        listRef.current?.scrollBy({ top: 220, behavior: 'smooth' });
    };
    const moreFilesLabel = scrollState.remainingRows === 1
        ? '1 more file'
        : `${scrollState.remainingRows} more files`;

    return (
        <div className="flex h-full min-h-0 flex-col rounded-2xl border border-stone-200/70 bg-white/55 p-2 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/35">
            <div className="mb-2 flex shrink-0 items-start justify-between gap-3 px-1.5">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-500 dark:text-slate-400">Files</span>
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-500 dark:bg-slate-800 dark:text-slate-300">{activeDocuments.length}</span>
                    </div>
                    <p className="mt-1 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {filterLabel} / {sortLabel}
                    </p>
                </div>
                <div className="relative" ref={filterDropdownRef}>
                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            setIsFilterDropdownOpen(!isFilterDropdownOpen);
                        }}
                        className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition-all ${isFilterDropdownOpen || filterType !== 'all' ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200' : 'border-stone-200 bg-white text-slate-500 hover:border-stone-300 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-slate-700'}`}
                        title="Filter & Sort"
                    >
                        <SlidersHorizontal size={12} />
                        <span>Filter</span>
                        {filterType !== 'all' && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500"></span>}
                    </button>

                    {isFilterDropdownOpen && (
                        <div className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-stone-200 bg-white/95 py-2 text-[11px] font-semibold text-slate-600 shadow-xl backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-300">
                            <div className="mb-1 border-b border-stone-100 px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-stone-400 dark:border-slate-800 dark:text-slate-500">Filter By Type</div>
                            {[
                                { value: 'all', label: 'All Files' },
                                { value: 'resume', label: 'Resumes' },
                                { value: 'portfolio', label: 'Portfolios' },
                                { value: 'whiteboard', label: 'Whiteboards' },
                                { value: 'interview', label: 'Interviews' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setFilterType(option.value);
                                        savePreference('filterType', option.value);
                                    }}
                                    className={`flex w-full items-center justify-between px-3.5 py-1.5 text-left transition-all hover:bg-indigo-50/60 hover:text-indigo-700 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300 ${filterType === option.value ? 'bg-indigo-50/60 font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' : ''}`}
                                >
                                    <span>{option.label}</span>
                                    {filterType === option.value && <Check size={12} className="text-indigo-500 shrink-0" />}
                                </button>
                            ))}

                            <div className="my-1 h-px bg-stone-100 dark:bg-slate-800"></div>
                            <div className="mb-1 px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">Sort By</div>
                            {[
                                { value: 'createdAt', label: 'Sequence of Events' },
                                { value: 'updatedAt', label: 'Recently Modified' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setSortBy(option.value as 'createdAt' | 'updatedAt');
                                        savePreference('sortBy', option.value);
                                    }}
                                    className={`flex w-full items-center justify-between px-3.5 py-1.5 text-left transition-all hover:bg-indigo-50/60 hover:text-indigo-700 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300 ${sortBy === option.value ? 'bg-indigo-50/60 font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' : ''}`}
                                >
                                    <span>{option.label}</span>
                                    {sortBy === option.value && <Check size={12} className="text-indigo-500 shrink-0" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="relative min-h-0 flex-1">
                <div
                    ref={listRef}
                    className="h-full space-y-1 overflow-y-auto pb-10 pr-1 [scrollbar-width:thin]"
                >
                    {activeDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 px-4 py-6 text-center dark:border-slate-800/80">
                            <span className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-slate-500">No Files Found</span>
                            <span className="text-[9px] font-medium leading-normal text-stone-400 dark:text-slate-500">
                                {filterType === 'all' ? 'Try creating a new document!' : `No items match the "${filterType}" filter.`}
                            </span>
                        </div>
                    ) : (
                        activeDocuments.map((doc) => (
                            <div
                                key={doc.id}
                                onClick={() => {
                                    setActiveNode(doc.id.toString());
                                    navigate(getPathForNodeId(doc.id, doc.data?.type));
                                }}
                                onContextMenu={(event) => {
                                    event.preventDefault();
                                    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: doc.id, text: doc.text, type: doc.data?.type || 'file' });
                                }}
                                className={`group/doc flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-xs transition-all ${activeNodeId === doc.id.toString() ? 'border-indigo-200 bg-indigo-50/80 font-bold text-indigo-700 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/35 dark:text-indigo-200' : 'border-transparent font-semibold text-slate-600 hover:border-stone-200 hover:bg-white/80 hover:text-slate-950 dark:text-slate-400 dark:hover:border-slate-800 dark:hover:bg-slate-900/80 dark:hover:text-slate-100'}`}
                            >
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-stone-50 dark:bg-slate-900">{getDocIcon(doc.data?.type || '')}</div>

                                {editingNodeId === doc.id ? (
                                    <input
                                        value={editValue}
                                        onChange={(event) => setEditValue(event.target.value)}
                                        onBlur={() => saveRename(doc.id)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') saveRename(doc.id);
                                            if (event.key === 'Escape') setEditingNodeId(null);
                                        }}
                                        className="flex-1 rounded border border-indigo-500 bg-white px-1.5 py-0.5 text-xs font-semibold text-gray-900 outline-none dark:bg-slate-900 dark:text-gray-100"
                                        onClick={(event) => event.stopPropagation()}
                                        autoFocus
                                    />
                                ) : (
                                    <span className="flex-1 truncate">{doc.text}</span>
                                )}

                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        const rect = event.currentTarget.getBoundingClientRect();
                                        setContextMenu({ x: rect.left, y: rect.bottom, nodeId: doc.id, text: doc.text, type: doc.data?.type || 'file' });
                                    }}
                                    className="rounded p-0.5 text-slate-400 opacity-0 transition-opacity hover:bg-stone-100 group-hover/doc:opacity-100 dark:hover:bg-slate-800"
                                >
                                    <MoreVertical size={12} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {scrollState.canScroll && !scrollState.atBottom && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
                        <div className="h-12 bg-gradient-to-t from-white via-white/90 to-white/0 dark:from-slate-950 dark:via-slate-950/90 dark:to-slate-950/0" />
                        <button
                            type="button"
                            onClick={scrollToMoreFiles}
                            aria-label="Show more files"
                            className="pointer-events-auto absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-white/95 px-3 py-1 text-[10px] font-extrabold text-slate-600 shadow-sm backdrop-blur transition hover:border-stone-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white"
                        >
                            <ChevronDown size={13} />
                            {moreFilesLabel} below
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SidebarDocumentList;
