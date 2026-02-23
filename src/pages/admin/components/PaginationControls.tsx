import React from 'react';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Always show 1
            pages.push(1);
            if (currentPage > 3) pages.push('...');

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) pages.push(i);

            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex justify-center items-center gap-2 mt-6">
            {getPageNumbers().map((page, index) => (
                typeof page === 'number' ? (
                    <button
                        key={index}
                        onClick={() => onPageChange(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${currentPage === page
                                ? 'bg-[#6d4c85] text-white shadow-md'
                                : 'border border-gray-600/30 text-gray-400 hover:text-white hover:border-gray-400'
                            }`}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={index} className="text-gray-500 w-8 text-center">...</span>
                )
            ))}
            <button
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="px-6 py-1.5 rounded-full border border-gray-600/30 text-sm font-medium text-gray-300 hover:text-white hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed ml-4 transition-colors"
            >
                Next &gt;
            </button>
        </div>
    );
};

export default PaginationControls;
