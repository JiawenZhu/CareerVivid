import React, { useState } from 'react';
import { 
  Sparkles, 
  Loader2, 
  Check, 
  Trash2, 
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { useAIReview, AISuggestion } from '../../../contexts/AIReviewContext';
import { ResumeData } from '../../../types';
import { buildResumeWithReviewSuggestions } from '../../../utils/aiReviewSuggestions';
import { calculateResumeScore } from '../../../utils/resumeScoreUtils';

interface AIReviewPanelProps {
  resume: ResumeData;
  currentUserUid: string;
  onUpdate: (updates: Partial<ResumeData>) => void;
}

export const AIReviewPanel: React.FC<AIReviewPanelProps> = ({ resume, currentUserUid, onUpdate }) => {
  const {
    suggestions,
    selectedSuggestionIds,
    hoveredSuggestionId,
    setHoveredSuggestionId,
    isScanning,
    hasScanned,
    scanResume,
    applySelected,
    ignoreSelected,
    toggleSuggestion,
    toggleAll,
    clearSuggestions
  } = useAIReview();

  const [groupBy, setGroupBy] = useState<'section' | 'priority'>('section');
  const [scanProgress, setScanProgress] = useState(0);

  // Fake scanning progress text to build excitement
  React.useEffect(() => {
    let interval: number;
    if (isScanning) {
      setScanProgress(0);
      interval = window.setInterval(() => {
        setScanProgress((p) => {
          if (p >= 92) return p;
          return p + Math.floor(Math.random() * 15) + 5;
        });
      }, 600);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const handleScan = async () => {
    await scanResume(resume, currentUserUid);
  };

  const getProgressLabel = (progress: number) => {
    if (progress < 25) return 'Assessing ATS keyword densities...';
    if (progress < 50) return 'Analyzing grammar and action verbs...';
    if (progress < 75) return 'Evaluating achievement impact metrics...';
    if (progress < 90) return 'Reviewing visual layout structure...';
    return 'Polishing recommended edits...';
  };

  // Grouping logic
  const getGroupedSuggestions = () => {
    const groups: Record<string, AISuggestion[]> = {};

    suggestions.forEach((s) => {
      let key = 'Other';
      if (groupBy === 'section') {
        if (s.category === 'skills') key = 'Skills';
        else if (s.category === 'experience') key = 'Work Experience';
        else if (s.category === 'summary') key = 'Professional Summary';
        else if (s.category === 'personalDetails') key = 'Personal Details';
      } else {
        if (s.priority === 'high') key = '🔴 High Impact';
        else if (s.priority === 'medium') key = '🟡 Medium Impact';
        else if (s.priority === 'low') key = '🟢 Low Impact';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    return groups;
  };

  const grouped = getGroupedSuggestions();
  const hasSuggestions = suggestions.length > 0;
  const allSelected = hasSuggestions && selectedSuggestionIds.size === suggestions.length;
  const someSelected = hasSuggestions && selectedSuggestionIds.size > 0 && selectedSuggestionIds.size < suggestions.length;
  const currentScore = calculateResumeScore(resume).overallScore;
  const projectedResume = hasSuggestions
    ? buildResumeWithReviewSuggestions(resume, suggestions, selectedSuggestionIds)
    : resume;
  const projectedScore = hasSuggestions
    ? calculateResumeScore(projectedResume).overallScore
    : currentScore;

  return (
    <div className="h-full flex flex-col relative text-gray-800 dark:text-gray-200">
      
      {/* 1. INITIAL READY TO SCAN STATE */}
      {!hasSuggestions && !isScanning && (
        <div className="flex-grow flex flex-col justify-center items-center p-6 text-center space-y-6 animate-fade-in">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl relative group ${
            hasScanned
              ? 'bg-emerald-600 shadow-emerald-500/20'
              : 'bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-indigo-500/20'
          }`}>
            {hasScanned ? (
              <Check className="w-8 h-8 text-white" />
            ) : (
              <>
                <BrainCircuit className="w-8 h-8 text-white animate-pulse" />
                <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-1.5 -right-1.5 animate-bounce" />
              </>
            )}
          </div>

          <div className="space-y-2 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {hasScanned ? 'No Actionable Edits Found' : 'Scan Resume with AI Review'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {hasScanned
                ? `Your current resume score is ${currentScore}. CareerVivid did not find any verified edits that would improve this version.`
                : 'Our advanced AI recruiter runs a deep-level assessment of spelling, ATS keyword densities, action verbs, and impact metrics.'}
            </p>
          </div>

          {!hasScanned && (
            <div className="w-full max-w-xs bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800 space-y-2.5 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Fix typos & grammar ("Illustraotr" → "Illustrator")</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Tailor skills & add core ATS keywords</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>Strengthen bullets & inject quantifiable metrics</span>
            </div>
            </div>
          )}

          <button
            onClick={handleScan}
            className="w-full max-w-xs flex items-center justify-center gap-2 bg-gradient-to-r from-[#2b164f] to-indigo-800 hover:from-indigo-850 hover:to-[#2b164f] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <Sparkles size={16} />
            <span>{hasScanned ? 'Scan Again' : 'Scan Resume'}</span>
          </button>
        </div>
      )}

      {/* 2. SCANNING LOADER STATE */}
      {isScanning && (
        <div className="flex-grow flex flex-col justify-center items-center p-6 text-center space-y-6 animate-fade-in">
          <div className="relative flex items-center justify-center w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-950/30" />
            <div 
              className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" 
              style={{ animationDuration: '0.8s' }}
            />
            <BrainCircuit className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          </div>

          <div className="space-y-1.5 max-w-xs">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider animate-pulse">
              AI Recruiter Assessment
            </h4>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold tracking-wide">
              {scanProgress}% — {getProgressLabel(scanProgress)}
            </p>
          </div>

          <div className="w-full max-w-xs bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full transition-all duration-300 ease-out" 
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 3. SUGGESTIONS LIST CHECKLIST STATE */}
      {hasSuggestions && !isScanning && (
        <>
          {/* Filter Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Group by:</span>
              <div className="flex bg-gray-200/60 dark:bg-gray-800 rounded-lg p-0.5 ml-1">
                <button
                  onClick={() => setGroupBy('section')}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${groupBy === 'section' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Section
                </button>
                <button
                  onClick={() => setGroupBy('priority')}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${groupBy === 'priority' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Priority
                </button>
              </div>
            </div>

            <button
              onClick={clearSuggestions}
              className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider"
            >
              Clear Review
            </button>
          </div>

          {/* Checklist Area */}
          <div className="flex-grow overflow-y-auto p-3 space-y-4 custom-scrollbar pb-24">
            {Object.entries(grouped).map(([groupTitle, list]) => (
              <div key={groupTitle} className="space-y-2 animate-fade-in">
                {/* Group Divider */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <h4 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    {groupTitle} ({list.length} Suggestions)
                  </h4>
                </div>

                {/* Suggestion Cards */}
                {list.map((s) => {
                  const isChecked = selectedSuggestionIds.has(s.id);
                  const isHovered = hoveredSuggestionId === s.id;

                  return (
                    <div
                      key={s.id}
                      onMouseEnter={() => setHoveredSuggestionId(s.id)}
                      onMouseLeave={() => setHoveredSuggestionId(null)}
                      onClick={() => toggleSuggestion(s.id)}
                      className={`
                        group border rounded-xl p-3.5 space-y-2 cursor-pointer transition-all duration-200 relative overflow-hidden
                        ${isChecked 
                          ? 'bg-white dark:bg-gray-800 border-indigo-200 dark:border-indigo-800/80 shadow-md ring-1 ring-indigo-100 dark:ring-indigo-900/10' 
                          : 'bg-gray-50/50 dark:bg-gray-900/10 border-gray-150 dark:border-gray-800 opacity-60 hover:opacity-100 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-200'
                        }
                        ${isHovered ? 'shadow-lg border-indigo-400 dark:border-indigo-600 scale-[1.01]' : ''}
                      `}
                    >
                      {/* Top Meta info */}
                      <div className="flex items-start justify-between gap-2 select-none">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            s.category === 'skills' 
                              ? 'bg-orange-400' 
                              : s.category === 'experience'
                                ? 'bg-indigo-500'
                                : 'bg-purple-500'
                          }`} />
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {s.title}
                          </span>
                        </div>

                        {/* Custom styled checkbox */}
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isChecked 
                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 group-hover:border-indigo-400'
                        }`}>
                          {isChecked && <Check size={10} className="stroke-[3]" />}
                        </div>
                      </div>

                      {/* Explanation */}
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                        {s.explanation}
                      </p>

                      {/* Visual Changes badge comparison */}
                      {isChecked && (
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-1 text-[10px] leading-relaxed">
                          {s.type === 'delete' && (
                            <div className="flex items-center flex-wrap gap-1 font-bold text-red-500">
                              <span>Remove:</span>
                              <span className="line-through decoration-red-500 decoration-2 text-red-600 dark:text-red-400">{s.originalText}</span>
                            </div>
                          )}
                          {s.type === 'add' && (
                            <div className="flex items-center flex-wrap gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                              <span>Add:</span>
                              <span className="border-b-2 border-emerald-500/90 pb-[1px]">{s.suggestedText}</span>
                            </div>
                          )}
                          {s.type === 'replace' && (
                            <div className="flex flex-col gap-1 w-full font-bold">
                              <div className="flex items-center flex-wrap gap-1 text-red-500">
                                <span className="opacity-60 text-[9px] uppercase tracking-wider w-8">Old:</span>
                                <span className="line-through decoration-red-500 decoration-2 text-red-600 dark:text-red-400 font-medium">{s.originalText}</span>
                              </div>
                              <div className="flex items-center flex-wrap gap-1 text-emerald-600 dark:text-emerald-400">
                                <span className="opacity-60 text-[9px] uppercase tracking-wider w-8">New:</span>
                                <span className="border-b-2 border-emerald-500/90 pb-[1px] font-medium">{s.suggestedText}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex items-center gap-1.5 pt-1 select-none">
                        {s.tags.map((tag) => (
                          <span 
                            key={tag} 
                            className={`
                              text-[9px] font-bold px-1.5 py-0.5 rounded border
                              ${tag === 'Stay Relevant' 
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/20' 
                                : tag === 'Tailor Resume'
                                  ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/20'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20'
                              }
                            `}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Floating Action Toolbar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-gray-800/95 border-t border-gray-150 dark:border-gray-800 backdrop-blur flex items-center justify-between shrink-0 shadow-lg select-none z-10">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => toggleAll(!allSelected)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  allSelected 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : someSelected 
                      ? 'bg-indigo-400 border-indigo-400 text-white'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'
                }`}
                title={allSelected ? "Deselect All" : "Select All"}
              >
                {allSelected && <Check size={10} className="stroke-[3]" />}
                {someSelected && <span className="w-1.5 h-0.5 bg-white rounded-full" />}
              </button>

            <div className="flex flex-col">
                <span className="text-[11px] font-bold text-gray-950 dark:text-white leading-none">
                  {selectedSuggestionIds.size} Selected
                </span>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
                  Score {currentScore} → {projectedScore}
                </span>
            </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={ignoreSelected}
                disabled={selectedSuggestionIds.size === 0}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-bold rounded-lg text-xs transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ignore
              </button>
              <button
                onClick={() => applySelected(resume, onUpdate)}
                disabled={selectedSuggestionIds.size === 0}
                className="flex items-center justify-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-md transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check size={12} className="stroke-[2.5]" />
                <span>Apply</span>
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
