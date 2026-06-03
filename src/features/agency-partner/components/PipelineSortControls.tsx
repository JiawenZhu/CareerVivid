import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export type SortOption = 'recently_active' | 'highest_score' | 'biggest_lift' | 'name_a_z';

interface PipelineSortControlsProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'recently_active', label: 'Recently Active' },
  { value: 'highest_score', label: 'Highest Score' },
  { value: 'biggest_lift', label: 'Biggest Lift' },
  { value: 'name_a_z', label: 'Name A–Z' },
];

const PipelineSortControls: React.FC<PipelineSortControlsProps> = ({
  currentSort,
  onSortChange,
}) => {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-semibold text-[#665a4a] dark:text-[#aaa39a] uppercase tracking-wider flex items-center gap-1">
        <ArrowUpDown size={12} className="text-[#8b5a16] dark:text-[#caa26c]" />
        Sort:
      </span>
      <select
        value={currentSort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="rounded-xl border border-[#e4d3bc] bg-white px-2.5 py-1.5 text-xs font-bold text-[#211b16] shadow-sm transition hover:bg-[#fdf5e8] focus:outline-none dark:border-[#302e2a] dark:bg-[#262522] dark:text-[#f4f1e9] dark:hover:bg-[#1f1f1d]"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-[#211b16] dark:bg-[#262522] dark:text-[#f4f1e9]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PipelineSortControls;
