
import React from 'react';
import { AVAILABLE_ICONS } from '../constants';
import IconDisplay from './IconDisplay';

interface IconPickerProps {
    selectedIcon: string;
    onSelect: (iconId: string) => void;
    label: string;
}

const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelect, label }) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
            <div className="grid grid-cols-5 gap-2">
                {AVAILABLE_ICONS.map((icon) => (
                    <button
                        key={icon.id}
                        onClick={() => onSelect(icon.id)}
                        title={icon.label}
                        className={`p-2 rounded-md border flex items-center justify-center transition-all ${
                            selectedIcon === icon.id 
                            ? 'bg-primary-100 border-primary-500 text-primary-600 ring-2 ring-primary-200 dark:bg-primary-900/30 dark:text-primary-400' 
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                    >
                        <IconDisplay iconName={icon.id} size={18} />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default IconPicker;
