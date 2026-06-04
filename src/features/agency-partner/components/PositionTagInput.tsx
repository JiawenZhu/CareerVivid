import React, { useEffect, useState } from 'react';
import { Tag, Plus, X, Loader2 } from 'lucide-react';
import { updatePositionTags, getUsedTagsForBranch } from '../services/positionTagsService';

const POPULAR_STAFFING_TAGS = [
  'Warehouse', 'Forklift', 'CDL Driver', 'Assembly', 'General Labor', 
  'Machine Operator', 'Shipping & Receiving', 'Picker/Packer', 'Inventory', 
  'Material Handler', 'Quality Control', 'Maintenance Tech', 'Welder',
  'Receptionist', 'Data Entry', 'Admin Assistant', 'Office Manager',
  'Customer Service', 'Call Center', 'Bookkeeper', 'Office Clerk',
  'Executive Assistant', 'Sales Rep', 'IT Support', 'Accountant',
  'RN (Nurse)', 'LPN', 'CNA', 'Caregiver', 'Medical Assistant'
];

interface PositionTagInputProps {
  sessionId: string;
  branchId: string;
  initialTags?: string[];
  canEdit: boolean;
  onTagsChange?: (newTags: string[]) => void;
}

const PositionTagInput: React.FC<PositionTagInputProps> = ({
  sessionId,
  branchId,
  initialTags = [],
  canEdit,
  onTagsChange,
}) => {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const serializedInitialTags = JSON.stringify(initialTags);
  useEffect(() => {
    setTags(initialTags);
  }, [serializedInitialTags]);

  const serializedTags = JSON.stringify(tags);
  useEffect(() => {
    if (!branchId) return;
    getUsedTagsForBranch(branchId).then((allTags) => {
      // Exclude tags already present
      setSuggestedTags(allTags.filter((t) => !tags.includes(t)));
    });
  }, [branchId, serializedTags]);

  const handleAddTag = async (tagText: string) => {
    const trimmed = tagText.trim();
    if (!trimmed || tags.includes(trimmed)) {
      setInputValue('');
      return;
    }

    const updatedTags = [...tags, trimmed];
    setIsUpdating(true);
    try {
      await updatePositionTags(sessionId, updatedTags);
      setTags(updatedTags);
      setInputValue('');
      onTagsChange?.(updatedTags);
    } catch (error) {
      console.error('Failed to add position tag:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    setIsUpdating(true);
    try {
      await updatePositionTags(sessionId, updatedTags);
      setTags(updatedTags);
      onTagsChange?.(updatedTags);
    } catch (error) {
      console.error('Failed to remove position tag:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  return (
    <div className="rounded-2xl border border-[#e4d3bc] bg-[#fffaf1]/50 p-4 dark:border-[#302e2a] dark:bg-[#262522]/20">
      <div className="flex items-center gap-1.5 text-xs font-bold text-[#6b6358] uppercase tracking-wider mb-3 dark:text-[#aaa39a]">
        <Tag size={13} className="text-[#8b5a16] dark:text-[#caa26c]" />
        <span>Position / Role Tags</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {tags.length === 0 ? (
          <p className="text-xs italic text-[#6b6358]/60 dark:text-[#aaa39a]/60 py-1">
            No position tags added yet.
          </p>
        ) : (
          tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-[#fdf5e8] border border-[#e4d3bc] px-2.5 py-1 text-xs font-bold text-[#8b5a16] dark:bg-[#262522] dark:border-[#302e2a] dark:text-[#caa26c]"
            >
              {tag}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  disabled={isUpdating}
                  className="rounded-full p-0.5 hover:bg-[#8b5a16]/10 dark:hover:bg-[#caa26c]/10"
                >
                  <X size={10} />
                </button>
              )}
            </span>
          ))
        )}
      </div>

      {canEdit && (
        <div className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add position tag (e.g. Warehouse, CDL)..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={handleKeyDown}
              disabled={isUpdating}
              className="flex-1 rounded-xl border border-[#e4d3bc] bg-white px-3 py-1.5 text-xs text-[#211b16] placeholder-[#6b6358]/60 shadow-sm focus:border-[#8b5a16] focus:outline-none focus:ring-1 focus:ring-[#8b5a16] dark:border-[#302e2a] dark:bg-[#1f1f1d] dark:text-[#f4f1e9] dark:placeholder-[#aaa39a]/60 dark:focus:border-[#caa26c] dark:focus:ring-[#caa26c]"
            />
            <button
              type="button"
              onClick={() => handleAddTag(inputValue)}
              disabled={isUpdating || !inputValue.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-[#211b16] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#3a2f26] dark:bg-[#caa26c] dark:text-[#1f1f1d] dark:hover:bg-[#e4d3bc]"
            >
              {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            </button>
          </div>

          {/* Quick-Click Suggested Tags */}
          {POPULAR_STAFFING_TAGS.filter((t) => !tags.includes(t)).length > 0 && (
            <div className="mt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b5a16]/80 dark:text-[#caa26c]/80 block mb-1.5">
                Quick-add popular roles
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {POPULAR_STAFFING_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    disabled={isUpdating}
                    className="rounded-lg border border-[#e4d3bc] bg-white px-2 py-0.5 text-[10.5px] font-bold text-[#8b5a16] shadow-sm transition hover:bg-[#fdf5e8] dark:border-[#302e2a] dark:bg-[#262522] dark:text-[#caa26c] dark:hover:bg-[#1f1f1d] hover:scale-[1.02] active:scale-[0.98]"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestedTags.length > 0 && inputValue.trim() && (
            <div className="absolute z-30 mt-1 max-h-36 w-full overflow-y-auto rounded-xl border border-[#e4d3bc] bg-white p-1.5 shadow-lg dark:border-[#302e2a] dark:bg-[#262522]">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#6b6358] dark:text-[#aaa39a]">
                Suggested tags
              </p>
              {suggestedTags
                .filter((t) => t.toLowerCase().includes(inputValue.toLowerCase()))
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onMouseDown={() => handleAddTag(tag)}
                    className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-[#211b16] hover:bg-[#fdf5e8] dark:text-[#f4f1e9] dark:hover:bg-[#1f1f1d]"
                  >
                    {tag}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PositionTagInput;
