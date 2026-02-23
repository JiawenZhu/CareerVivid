
import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { STOCK_PHOTOS } from '../constants/stockPhotos';

interface StockPhotoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
}

type Category = keyof typeof STOCK_PHOTOS;

const StockPhotoModal: React.FC<StockPhotoModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [activeCategory, setActiveCategory] = useState<Category>('professional');
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const categories = Object.keys(STOCK_PHOTOS) as Category[];

    // Filter images based on search (simulated by checking category names for now, 
    // real search would need alt text metadata which we simplified out)
    // For this simple version, we mainly rely on tabs, but if search is present we can try to filter categorization or just ignored for v1 
    // to keep it simple as per plan. Let's strictly use categories for organization.

    const currentImages = STOCK_PHOTOS[activeCategory];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1a1d24] rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200 dark:border-white/10">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Stock Library</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Select a free photo for your portfolio</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 p-4 pb-0 overflow-x-auto border-b border-gray-200 dark:border-white/10 hide-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeCategory === cat
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#0f1117]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {currentImages.map((url, index) => (
                            <button
                                key={index}
                                onClick={() => { onSelect(url); onClose(); }}
                                className="group relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 dark:border-white/5 hover:border-indigo-500 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <img
                                    src={url}
                                    alt="Stock"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockPhotoModal;
