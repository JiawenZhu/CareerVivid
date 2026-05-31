import React from 'react';
import { Briefcase, Minus, Plus, Volume2, X } from 'lucide-react';

interface AddJobEditHeaderProps {
    jobTitle: string;
    companyName: string;
    onClose: () => void;
}

const AddJobEditHeader: React.FC<AddJobEditHeaderProps> = ({ jobTitle, companyName, onClose }) => {
    return (
        <header className="p-6 border-b border-gray-100 dark:border-[#2e2b38] flex justify-between items-center bg-gray-50/50 dark:bg-[#201e27]/50">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm">
                    <Briefcase size={26} />
                </div>
                <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white truncate">
                        {jobTitle || 'Untitled Job'}
                    </h2>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {companyName || 'Unknown Company'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <button type="button" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2c2937] rounded-full transition-colors">
                    <Volume2 size={16} />
                </button>
                <button type="button" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2c2937] rounded-full transition-colors">
                    <Minus size={16} />
                </button>
                <button type="button" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2c2937] rounded-full transition-colors">
                    <Plus size={16} />
                </button>
                <span className="w-px h-6 bg-gray-200 dark:bg-[#2e2b38] mx-1 sm:mx-1.5"></span>
                <button onClick={onClose} type="button" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>
        </header>
    );
};

export default AddJobEditHeader;
