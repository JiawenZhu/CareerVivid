import React, { useState } from 'react';
import { 
  ChevronsRight, 
  Repeat, 
  Award, 
  CheckSquare, 
  Sparkles, 
  ChevronDown,
  ChevronUp,
  Target
} from 'lucide-react';
import { ResumeData } from '../../../types';
import ResumeScoreTab from './ResumeScoreTab';

// Reuse parts of OptimizationPanel inside RightSidePanel
import { 
  CheckCircle, 
  XCircle, 
  Wand2, 
  Briefcase, 
  Key, 
  UserCheck, 
  Check 
} from 'lucide-react';

interface OptimizationJob {
  title: string;
  description: string;
  analysis?: any;
}

interface RightSidePanelProps {
  resume: ResumeData;
  currentUserUid: string;
  onUpdate: (updates: Partial<ResumeData>) => void;
  optimizationJob: OptimizationJob | null;
  isOpen: boolean;
  onClose: () => void;
}

const RightSidePanel: React.FC<RightSidePanelProps> = ({
  resume,
  currentUserUid,
  onUpdate,
  optimizationJob,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'match' | 'score'>('score');

  // Auto-switch to match tab when a new optimization job is loaded
  React.useEffect(() => {
    if (optimizationJob) {
      setActiveTab('match');
    }
  }, [optimizationJob]);

  // Collapsible Accordions in Job Match
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({
    qualifications: false,
    responsibilities: false,
    keywords: false,
    jobTitle: false
  });
  const [isKeywordsExpanded, setIsKeywordsExpanded] = useState(false);

  if (!isOpen) return null;

  const toggleAccordion = (key: string) => {
    setExpandedAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRunTailor = () => {
    const event = new CustomEvent('open-ai-tailor', {
      detail: { jobDescription: optimizationJob?.description }
    });
    window.dispatchEvent(event);
  };

  // Job Match scoring and tiers
  const analysis = optimizationJob?.analysis;
  const matchPercentage = analysis ? Math.round(analysis.matchPercentage) : 0;

  const getVerdictCategory = (score: number) => {
    if (score >= 80) return { label: 'Great', color: 'text-emerald-700 bg-emerald-50 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800' };
    if (score >= 60) return { label: 'Excellent', color: 'text-sky-700 bg-sky-50 border-sky-250 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-800' };
    if (score >= 40) return { label: 'Good', color: 'text-amber-700 bg-amber-50 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800' };
    if (score >= 20) return { label: 'Fair', color: 'text-orange-700 bg-orange-50 border-orange-250 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-850' };
    return { label: 'Poor', color: 'text-rose-700 bg-rose-50 border-rose-250 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-800' };
  };

  const segments = [
    { label: 'Poor', min: 0, max: 20, activeBg: 'bg-rose-500', defaultBg: 'bg-rose-100 dark:bg-rose-950/20' },
    { label: 'Fair', min: 21, max: 40, activeBg: 'bg-orange-500', defaultBg: 'bg-orange-100 dark:bg-orange-950/20' },
    { label: 'Good', min: 41, max: 60, activeBg: 'bg-amber-500', defaultBg: 'bg-amber-100 dark:bg-amber-950/20' },
    { label: 'Excellent', min: 61, max: 80, activeBg: 'bg-sky-500', defaultBg: 'bg-sky-100 dark:bg-sky-950/20' },
    { label: 'Great', min: 81, max: 100, activeBg: 'bg-emerald-500', defaultBg: 'bg-emerald-100 dark:bg-emerald-950/20' },
  ];

  const verdictInfo = getVerdictCategory(matchPercentage);

  const getCategoryDetails = (key: string) => {
    const customDetails = analysis?.[key];
    if (customDetails) return customDetails;

    // Legacy or missing keyword analysis fallback
    if (key === 'qualifications') {
      return {
        score: Math.round(matchPercentage * 0.95),
        rating: matchPercentage >= 80 ? 'Great' : 'Fair',
        impact: 'High Impact',
        details: [
          'Highlight top-level certifications and academic credentials.',
          'Inject core competencies as required by job specifications.'
        ]
      };
    } else if (key === 'responsibilities') {
      return {
        score: Math.round(matchPercentage * 0.9),
        rating: matchPercentage >= 70 ? 'Good' : 'Fair',
        impact: 'High Impact',
        details: [
          'Use professional action verbs to denote program scope.',
          'Structure bullet descriptions directly addressing expected outcomes.'
        ]
      };
    } else if (key === 'keywords') {
      const total = analysis?.totalKeywords || 12;
      const matched = analysis?.matchedKeywords?.length || 0;
      const score = total > 0 ? Math.round((matched / total) * 100) : matchPercentage;
      return {
        score,
        rating: score >= 85 ? 'Great' : 'Fair',
        impact: 'Medium Impact',
        details: [
          `Matched ${matched} of ${total} keywords from posting.`,
          `Missing critical terms: ${analysis?.missingKeywords?.slice(0, 3).join(', ') || 'role criteria'}`
        ]
      };
    } else {
      return {
        score: Math.round(matchPercentage * 0.85),
        rating: matchPercentage >= 80 ? 'Great' : 'Fair',
        impact: 'Low Impact',
        details: [
          `Seniority level align matches for: "${optimizationJob?.title}".`,
          'Ensure job title prefixes are clear and descriptive.'
        ]
      };
    }
  };

  const getRatingStyle = (rating: string) => {
    const clean = (rating || '').toLowerCase();
    if (clean.includes('great') || clean.includes('excellent')) {
      return 'text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
    }
    return 'text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
  };

  const accordionsConfig = [
    { key: 'qualifications', label: 'Qualifications Match', icon: Award },
    { key: 'responsibilities', label: 'Responsibilities Match', icon: Briefcase },
    { key: 'keywords', label: 'Keyword Match', icon: Key },
    { key: 'jobTitle', label: 'Job Title Match', icon: UserCheck }
  ];

  return (
    <div 
      className="relative z-20 flex h-full flex-shrink-0 animate-slide-in-right flex-col overflow-hidden border-l border-[#e5dccf] bg-[#fbf8f3] dark:border-gray-800 dark:bg-gray-950"
      style={{ width: '380px', minWidth: '380px' }}
    >
      {/* Top unified tabs selector */}
      <div className="flex shrink-0 select-none items-center justify-between gap-1 border-b border-[#e8dfd3] bg-white/85 p-2 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        
        {/* Collapse button chevrons */}
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 transition-colors hover:bg-[#f3eee6] hover:text-slate-700 dark:hover:bg-gray-800"
          title="Collapse Panel"
        >
          <ChevronsRight size={16} />
        </button>

        {/* Tab triggers */}
        <div className="flex flex-grow gap-1">
          <button 
            onClick={() => setActiveTab('match')} 
            className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === 'match' 
                ? 'bg-[#22143f] text-white shadow-sm' 
                : 'text-slate-500 hover:bg-[#f3eee6] hover:text-slate-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Repeat size={12} /> Job Match
          </button>
          <button 
            onClick={() => setActiveTab('score')} 
            className={`flex-grow rounded-lg py-1.5 text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === 'score' 
                ? 'bg-[#22143f] text-white shadow-sm' 
                : 'text-slate-500 hover:bg-[#f3eee6] hover:text-slate-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <CheckSquare size={12} /> Score
          </button>
        </div>
      </div>

      {/* Tab Panels Contents */}
      <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
        
        {/* TAB 1: SCORE */}
        {activeTab === 'score' && (
          <div className="animate-fade-in">
            <ResumeScoreTab 
              resume={resume} 
              currentUserUid={currentUserUid}
              onUpdate={onUpdate}
            />
          </div>
        )}

        {/* TAB 2: JOB MATCH */}
        {activeTab === 'match' && (
          <div className="animate-fade-in space-y-4 pb-6">
            {!optimizationJob ? (
              <div className="text-center py-10 px-4 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 flex items-center justify-center text-gray-400 mx-auto">
                  <Target size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">No Job Loaded</h4>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 max-w-xs mx-auto leading-relaxed">
                    Upload a job posting inside the dashboard or scan via extension to evaluate target ATS score matching.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Score & breakdown from OptimizationPanel */}
                <div className="bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        {matchPercentage}
                      </span>
                      <span className="text-xs font-bold text-gray-400">%</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${verdictInfo.color}`}>
                      {verdictInfo.label} Match
                    </span>
                  </div>

                  {/* Segmented color bar */}
                  <div className="grid grid-cols-5 gap-1.5 my-3">
                    {segments.map((seg) => {
                      const isActive = matchPercentage >= seg.min;
                      const isCurrent = matchPercentage >= seg.min && matchPercentage <= seg.max;
                      return (
                        <div key={seg.label} className="flex flex-col items-center">
                          <div 
                            className={`w-full h-1.5 rounded-full transition-all duration-500 ${
                              isActive ? seg.activeBg : seg.defaultBg
                            }`} 
                          />
                          <span className={`text-[8px] mt-1 font-bold tracking-wider uppercase transition-colors duration-200 ${
                            isCurrent 
                              ? 'text-gray-950 dark:text-gray-100 font-extrabold' 
                              : 'text-gray-400 dark:text-gray-600'
                          }`}>
                            {seg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Verdict */}
                {analysis && (
                  <div className="bg-gradient-to-br from-indigo-500/[0.04] to-purple-500/[0.04] dark:from-indigo-500/[0.08] dark:to-purple-500/[0.08] p-4 rounded-xl border border-indigo-500/[0.08] dark:border-indigo-500/[0.15]">
                    <div className="flex items-center gap-1.5 mb-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      <Sparkles size={14} className="animate-pulse" />
                      <span>AI RECRUITER VERDICT</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      {analysis.verdict || analysis.summary}
                    </p>
                  </div>
                )}

                {/* Accordions */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase select-none">Match Breakdown</h4>
                  {accordionsConfig.map(acc => {
                    const details = getCategoryDetails(acc.key);
                    const isExpanded = expandedAccordions[acc.key];
                    const ratingStyle = getRatingStyle(details.rating);
                    const Icon = acc.icon;

                    return (
                      <div 
                        key={acc.key} 
                        className="border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 transition-all duration-200"
                      >
                        <button
                          onClick={() => toggleAccordion(acc.key)}
                          className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-850/30 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg">
                              <Icon size={14} />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-gray-900 dark:text-white leading-none mb-1">
                                {acc.label}
                              </h5>
                              <span className="text-[9px] text-gray-400 font-medium">
                                {details.impact}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ratingStyle}`}>
                              {details.rating} {details.score}
                            </span>
                            {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 bg-gray-50/30 dark:bg-gray-900/20 border-t border-gray-50 dark:border-gray-800/50 animate-in fade-in duration-200">
                            <ul className="space-y-2 pt-2">
                              {details.details?.map((pt: string, idx: number) => (
                                <li key={idx} className="flex gap-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                  <Check size={12} className="text-emerald-500 flex-shrink-0 mt-1" />
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Keywords Toggle */}
                {analysis && (
                  <div className="border-t border-gray-150 dark:border-gray-800 pt-3">
                    <button
                      onClick={() => setIsKeywordsExpanded(!isKeywordsExpanded)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:opacity-80 flex items-center gap-1.5 select-none"
                    >
                      {isKeywordsExpanded ? 'Hide Keywords' : 'Show Keyword details'}
                      {isKeywordsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isKeywordsExpanded && (
                      <div className="mt-3 space-y-3 animate-in fade-in duration-200">
                        <div>
                          <h5 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                            <CheckCircle size={12} /> MATCHED ({analysis.matchedKeywords?.length || 0})
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {analysis.matchedKeywords?.length > 0 ? (
                              analysis.matchedKeywords.map((k: string) => (
                                <span key={k} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-[10px] rounded-lg border border-emerald-100 dark:border-emerald-900/30 font-medium">
                                  {k}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-gray-400">None</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <h5 className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-1">
                            <XCircle size={12} /> MISSING ({analysis.missingKeywords?.length || 0})
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {analysis.missingKeywords?.length > 0 ? (
                              analysis.missingKeywords.map((k: string) => (
                                <span key={k} className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-[10px] rounded-lg border border-rose-100 dark:border-rose-900/30 font-medium">
                                  {k}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-gray-400">None</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Job Posting Description details */}
                <div className="border-t border-gray-150 dark:border-gray-800 pt-4">
                  <h4 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2 select-none">Job Posting</h4>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-xs">{optimizationJob.title}</h3>
                  <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto custom-scrollbar border border-gray-100 dark:border-gray-800 p-2.5 rounded-lg bg-gray-50/30 dark:bg-gray-900/20">
                    {optimizationJob.description}
                  </div>
                </div>

                {/* Run AI Tailoring */}
                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/30 flex flex-col gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-purple-500 text-white rounded-lg flex-shrink-0 mt-0.5 shadow-sm">
                      <Wand2 size={14} />
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      Tailor your resume directly for this job using our fully automated <strong className="text-purple-600 dark:text-purple-400">AI Tailor</strong>.
                    </p>
                  </div>
                  <button
                    onClick={handleRunTailor}
                    className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 text-xs tracking-wide uppercase flex items-center justify-center gap-1.5"
                  >
                    ✨ Run AI Tailor
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default RightSidePanel;
