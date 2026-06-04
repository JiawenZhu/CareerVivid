import React from 'react';
import { Search, X, Tag, Award, Clock, Filter, ChevronDown } from 'lucide-react';
import { AgencyPrepSessionStatus } from '../types';
import { agencyPrepStatusLabels } from '../../../utils/agencyPartnerUtils';

export interface CandidateFilters {
  searchQuery: string;
  statusFilter: 'all' | AgencyPrepSessionStatus;
  scoreFilter: 'all' | 'under_70' | '70_84' | '85_plus';
  staleOnly: boolean;
  tagFilter: 'all' | string;
}

interface CandidateSearchFilterProps {
  filters: CandidateFilters;
  onFiltersChange: (filters: CandidateFilters) => void;
  availableTags: string[];
}

const statusOptions: Array<{ value: 'all' | AgencyPrepSessionStatus; label: string }> = [
  { value: 'all', label: 'All Stages' },
  { value: 'started', label: 'Started' },
  { value: 'resume_imported', label: 'Imported' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'ready', label: 'Ready' },
  { value: 'shared', label: 'Shared' },
];

const scoreOptions = [
  { value: 'all', label: 'Any Score' },
  { value: 'under_70', label: 'Below 70' },
  { value: '70_84', label: '70 – 84' },
  { value: '85_plus', label: '85+ (Ready)' },
];

export const initialFilters: CandidateFilters = {
  searchQuery: '',
  statusFilter: 'all',
  scoreFilter: 'all',
  staleOnly: false,
  tagFilter: 'all',
};

const CandidateSearchFilter: React.FC<CandidateSearchFilterProps> = ({
  filters,
  onFiltersChange,
  availableTags,
}) => {
  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.statusFilter !== 'all' ||
    filters.scoreFilter !== 'all' ||
    filters.staleOnly ||
    filters.tagFilter !== 'all';

  const updateFilter = <K extends keyof CandidateFilters>(key: K, value: CandidateFilters[K]) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleClearAll = () => {
    onFiltersChange(initialFilters);
  };

  return (
    <div className="rounded-2xl border border-[#e4d3bc] bg-[#fffaf1] p-4 shadow-sm dark:border-[#302e2a] dark:bg-[#1f1f1d]">
      <style>{`
        .custom-clean-select {
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
        }
        .custom-clean-select:focus,
        .custom-clean-select:active,
        .custom-clean-select:hover {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }
        .custom-clean-select::-ms-expand {
          display: none !important;
        }
      `}</style>
      <div className="flex flex-col gap-4">
        {/* Search Input and Basic Controls */}
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#8b5a16] dark:text-[#caa26c]">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search candidate by name or email..."
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              className="w-full rounded-xl border border-[#e4d3bc] bg-white py-2 pl-9 pr-8 text-sm text-[#211b16] placeholder-[#6b6358]/60 shadow-sm transition-all focus:border-[#8b5a16] focus:outline-none focus:ring-2 focus:ring-[#8b5a16]/20 dark:border-[#302e2a] dark:bg-[#262522] dark:text-[#f4f1e9] dark:placeholder-[#aaa39a]/60 dark:focus:border-[#caa26c]"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => updateFilter('searchQuery', '')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#6b6358] hover:text-[#211b16] dark:text-[#aaa39a] dark:hover:text-[#f4f1e9]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Score Filter */}
            <div className="relative flex items-center gap-1.5 rounded-xl border border-[#e4d3bc] bg-white pl-3 pr-7 py-2 text-xs font-bold text-[#211b16] shadow-sm transition hover:bg-[#fdf5e8] dark:border-[#302e2a] dark:bg-[#262522] dark:text-[#f4f1e9] dark:hover:bg-[#1f1f1d]">
              <Award size={14} className="text-[#8b5a16] dark:text-[#caa26c] shrink-0" />
              <select
                value={filters.scoreFilter}
                onChange={(e) => updateFilter('scoreFilter', e.target.value as any)}
                className="custom-clean-select bg-transparent border-0 outline-none focus:outline-none text-xs font-bold cursor-pointer pr-1 w-full"
              >
                {scoreOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white text-[#211b16] dark:bg-[#262522] dark:text-[#f4f1e9]">
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b5a16] dark:text-[#caa26c]">
                <ChevronDown size={12} />
              </span>
            </div>

            {/* Tag Filter */}
            <div className="relative flex items-center gap-1.5 rounded-xl border border-[#e4d3bc] bg-white pl-3 pr-7 py-2 text-xs font-bold text-[#211b16] shadow-sm transition hover:bg-[#fdf5e8] dark:border-[#302e2a] dark:bg-[#262522] dark:text-[#f4f1e9] dark:hover:bg-[#1f1f1d]">
              <Tag size={14} className="text-[#8b5a16] dark:text-[#caa26c] shrink-0" />
              <select
                value={filters.tagFilter}
                onChange={(e) => updateFilter('tagFilter', e.target.value)}
                className="custom-clean-select bg-transparent border-0 outline-none focus:outline-none text-xs font-bold cursor-pointer pr-1 w-full"
              >
                <option value="all" className="bg-white text-[#211b16] dark:bg-[#262522] dark:text-[#f4f1e9]">All Positions</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag} className="bg-white text-[#211b16] dark:bg-[#262522] dark:text-[#f4f1e9]">
                    {tag}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b5a16] dark:text-[#caa26c]">
                <ChevronDown size={12} />
              </span>
            </div>

            {/* Stale Toggle */}
            <button
              type="button"
              onClick={() => updateFilter('staleOnly', !filters.staleOnly)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold shadow-sm transition ${
                filters.staleOnly
                  ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
                  : 'border-[#e4d3bc] bg-white text-[#211b16] hover:bg-[#fdf5e8] dark:border-[#302e2a] dark:bg-[#262522] dark:text-[#caa26c] dark:hover:bg-[#1f1f1d]'
              }`}
            >
              <Clock size={14} className={filters.staleOnly ? 'text-amber-600' : 'text-[#8b5a16] dark:text-[#caa26c]'} />
              Inactive (3d+)
            </button>

            {/* Clear All */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 rounded-xl border border-[#e4d3bc] bg-[#e4d3bc]/30 px-3 py-2 text-xs font-bold text-[#665a4a] shadow-sm transition hover:bg-[#e4d3bc]/60 dark:border-[#302e2a] dark:bg-[#302e2a]/50 dark:text-[#caa26c] dark:hover:bg-[#262522]"
              >
                <X size={14} className="text-[#8b5a16] dark:text-[#caa26c] shrink-0" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Status Chip Filters */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-[#e4d3bc]/60 pt-3 dark:border-[#302e2a]/60">
          <span className="mr-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#665a4a] dark:text-[#aaa39a]">
            <Filter size={12} />
            Filter Status:
          </span>
          {statusOptions.map((opt) => {
            const isActive = filters.statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateFilter('statusFilter', opt.value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  isActive
                    ? 'bg-[#211b16] text-[#fffaf1] dark:bg-[#caa26c] dark:text-[#1f1f1d]'
                    : 'bg-white text-[#6b6358] border border-[#e4d3bc] hover:bg-[#fdf5e8] dark:bg-[#262522] dark:text-[#aaa39a] dark:border-[#302e2a] dark:hover:bg-[#1f1f1d]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CandidateSearchFilter;
