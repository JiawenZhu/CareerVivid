import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageBreakGuidesProps {
    contentHeight: number;
    pageHeightPx?: number; // default 1123 (A4 @ 96 DPI)
    scale?: number;
}

const PageBreakGuides: React.FC<PageBreakGuidesProps> = ({ contentHeight, pageHeightPx = 1123, scale = 1 }) => {
    // Calculate page breaks positions
    const breaks = useMemo(() => {
        if (!contentHeight) return [];
        // Only show breaks if content exceeds one page
        const count = Math.floor(contentHeight / pageHeightPx);
        // If exact multiple, don't show a break at the very bottom
        const isExact = contentHeight % pageHeightPx === 0;
        const totalBreaks = isExact ? count - 1 : count;

        const lines = [];
        for (let i = 1; i <= totalBreaks; i++) {
            lines.push(i * pageHeightPx);
        }
        return lines;
    }, [contentHeight, pageHeightPx]);

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
            <AnimatePresence>
                {breaks.map((yPos, index) => (
                    <motion.div
                        key={`break-${index}`}
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: '100%' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute left-0 w-full flex items-center group pointer-events-auto"
                        style={{ top: yPos }}
                    >
                        {/* Prominent Red Dashed Line for Page Overflow */}
                        <div className="w-full border-b-2 border-dashed border-red-400 group-hover:border-red-500 transition-colors duration-300" />

                        {/* Warning Label - Centered on Line */}
                        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
                            <motion.div
                                className="bg-red-100 border border-red-300 text-red-700 text-xs font-semibold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap select-none flex items-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Page {index + 2} Overflow
                            </motion.div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default PageBreakGuides;
