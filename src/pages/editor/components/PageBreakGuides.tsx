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
        <div className="absolute inset-0 pointer-events-none z-50">
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
                        {/* Dashed Line */}
                        <div className="w-full border-b border-dashed border-slate-300 group-hover:border-primary-500 group-hover:border-solid transition-colors duration-300" />

                        {/* Label Pill - Floating on Right */}
                        {/* We use translate-x to push it outside. Assuming overflow is visible. */}
                        <div className="absolute right-0 translate-x-full pl-4 flex items-center">
                            <motion.div
                                className="bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap select-none flex items-center gap-1.5 hover:text-primary-600 hover:border-primary-200"
                                whileHover={{ scale: 1.05, x: 5 }}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary-500 transition-colors" />
                                End of Page {index + 1}
                            </motion.div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default PageBreakGuides;
