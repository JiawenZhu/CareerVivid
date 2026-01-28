import React from 'react';

interface PageBreakIndicatorProps {
    /** Position from top in mm (default: 297mm for A4) */
    positionMm?: number;
    /** Label to display */
    label?: string;
    /** Whether to show the indicator */
    show?: boolean;
}

/**
 * Visual indicator showing where the page break occurs in PDF export.
 * Positioned absolutely at the A4 page boundary (297mm from top).
 */
export const PageBreakIndicator: React.FC<PageBreakIndicatorProps> = ({
    positionMm = 297,
    label = "Page 2 starts here",
    show = true,
}) => {
    if (!show) return null;

    return (
        <div
            className="absolute left-0 right-0 z-50 pointer-events-none print:hidden"
            style={{ top: `${positionMm}mm` }}
        >
            {/* Dashed line */}
            <div className="w-full border-t-2 border-dashed border-red-400" />

            {/* Label */}
            <div className="flex justify-center -mt-3">
                <span className="bg-red-100 text-red-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                    {label}
                </span>
            </div>
        </div>
    );
};

export default PageBreakIndicator;
