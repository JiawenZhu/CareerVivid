import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageBreakGuidesProps {
    contentHeight: number;
    pageHeightPx?: number; // default 1123 (A4 @ 96 DPI)
}

const PageBreakGuides: React.FC<PageBreakGuidesProps> = ({ contentHeight, pageHeightPx = 1123 }) => {
    const { breaks, pageCount } = useMemo(() => {
        const measuredHeight = Math.max(contentHeight || pageHeightPx, pageHeightPx);
        const nextPageCount = Math.max(1, Math.ceil(measuredHeight / pageHeightPx));
        const nextBreaks = Array.from({ length: nextPageCount - 1 }, (_, index) => (index + 1) * pageHeightPx);
        return { breaks: nextBreaks, pageCount: nextPageCount };
    }, [contentHeight, pageHeightPx]);

    const pages = useMemo(() => Array.from({ length: pageCount }, (_, index) => index + 1), [pageCount]);

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
            {pages.map((pageNumber) => (
                <div
                    key={`page-label-${pageNumber}`}
                    className="absolute right-4 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 shadow-sm backdrop-blur-sm"
                    style={{ top: (pageNumber - 1) * pageHeightPx + 18 }}
                >
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    Page {pageNumber}
                </div>
            ))}
            <AnimatePresence>
                {breaks.map((yPos, index) => (
                    <motion.div
                        key={`break-${index}`}
                        initial={{ opacity: 0, scaleX: 0.98 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute -left-6 -right-6"
                        style={{ top: yPos - 18 }}
                    >
                        <div className="h-9 w-full bg-slate-100/95 shadow-[inset_0_1px_0_rgba(15,23,42,0.16),inset_0_-1px_0_rgba(15,23,42,0.16)]" />
                        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 border-t border-dashed border-slate-400/70" />

                        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
                            <motion.div
                                className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm whitespace-nowrap select-none flex items-center gap-2"
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <svg className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 17h16M7 4v16M17 4v16" />
                                </svg>
                                Page {index + 1} ends / Page {index + 2} starts
                            </motion.div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default PageBreakGuides;
