
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface MonthYearPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ label, value, onChange, id, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  
  // Parse initial value or default to current date
  const parseDate = (dateStr: string) => {
    if (!dateStr || dateStr.toLowerCase() === 'present') {
        const now = new Date();
        return { month: now.getMonth(), year: now.getFullYear(), isPresent: dateStr.toLowerCase() === 'present' };
    }
    const parts = dateStr.split(' ');
    if (parts.length === 2) {
        const mIdx = MONTHS.indexOf(parts[0]);
        const y = parseInt(parts[1]);
        if (mIdx >= 0 && !isNaN(y)) {
            return { month: mIdx, year: y, isPresent: false };
        }
    }
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear(), isPresent: false };
  };

  const [selection, setSelection] = useState(parseDate(value));
  const [viewYear, setViewYear] = useState(selection.year);

  useEffect(() => {
      setSelection(parseDate(value));
      setViewYear(parseDate(value).year);
  }, [value]);

  // Update position when opening
  useEffect(() => {
    if (isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Calculate position relative to viewport
        setPosition({
            top: rect.bottom + window.scrollY + 5, // 5px gap, account for scroll
            left: rect.left + window.scrollX,
            width: rect.width
        });
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is inside the input container OR the dropdown (which is in a portal)
      const target = event.target as Node;
      const isInsideContainer = containerRef.current && containerRef.current.contains(target);
      const isInsideDropdown = dropdownRef.current && dropdownRef.current.contains(target);

      if (!isInsideContainer && !isInsideDropdown) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        // Also close on window resize to prevent floating detached popup
        window.addEventListener('resize', () => setIsOpen(false));
    }
    
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('resize', () => setIsOpen(false));
    };
  }, [isOpen]);

  const handleMonthSelect = (monthIndex: number) => {
    const newValue = `${MONTHS[monthIndex]} ${viewYear}`;
    onChange(newValue);
    setIsOpen(false);
  };

  const togglePresent = () => {
      if (selection.isPresent) {
          // Revert to date
          const now = new Date();
          onChange(`${MONTHS[now.getMonth()]} ${now.getFullYear()}`);
      } else {
          onChange('Present');
      }
      setIsOpen(false);
  };

  const dropdownContent = (
    <div 
        ref={dropdownRef}
        style={{ top: position.top, left: position.left, minWidth: '280px', maxWidth: '90vw' }} 
        className="absolute z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 animate-in fade-in zoom-in-95 duration-100"
    >
        <div className="flex justify-between items-center mb-4">
            <button onClick={() => setViewYear(viewYear - 1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
            <span className="font-bold text-lg text-gray-800 dark:text-gray-100">{viewYear}</span>
            <button onClick={() => setViewYear(viewYear + 1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-4">
            {MONTHS.map((m, idx) => {
                const isSelected = !selection.isPresent && selection.month === idx && selection.year === viewYear;
                return (
                    <button
                        key={m}
                        onClick={() => handleMonthSelect(idx)}
                        className={`py-2 text-sm rounded-md transition-colors ${isSelected ? 'bg-primary-600 text-white font-semibold shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                        {m}
                    </button>
                );
            })}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <button 
                onClick={togglePresent}
                className={`w-full py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${selection.isPresent ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
                {selection.isPresent && <Check size={16} />}
                Currently Work Here
            </button>
        </div>
    </div>
  );

  return (
    <div className="mb-4" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div className="relative group">
        <input
            id={id}
            type="text"
            readOnly
            value={value}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onFocus={() => !disabled && setIsOpen(true)}
            className={`w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 dark:text-white cursor-pointer truncate ${disabled ? 'opacity-50 cursor-not-allowed' : 'group-hover:border-gray-400 dark:group-hover:border-gray-500'}`}
            placeholder="Select Date"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none p-1 bg-white dark:bg-gray-700 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
            <Calendar size={16} />
        </div>
      </div>

      {isOpen && createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default MonthYearPicker;
