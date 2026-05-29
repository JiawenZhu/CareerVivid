import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getAllPublishedJobs, incrementJobViewCount, searchGoogleJobs } from '../../services/jobService';
import { useJobTracker } from '../../hooks/useJobTracker';
import { useResumes } from '../../hooks/useResumes';
import { usePracticeHistory } from '../../hooks/useJobHistory';
import { useAICreditCheck } from '../../hooks/useAICreditCheck';
import { submitApplication, getApplicationsForUser } from '../../services/applicationService';
import { JobPosting, WorkModel } from '../../types';
import { navigate } from '../../utils/navigation';
import { Loader2, Briefcase, X, FileText, Send, HelpCircle, LayoutDashboard, Search, MapPin, Building2, DollarSign, Clock, ExternalLink, PlusCircle, RefreshCw } from 'lucide-react';
import { SmartDescription } from './components/SmartDescription';
import { HighlightLegend } from './components/HighlightLegend';
import { JobCard } from './components/JobCard';
import { getUserJobHistory, deleteUserJob } from '../../services/jobHistoryService';
import Toast from '../../components/Toast';
import { getTalentAutocomplete } from '../../services/talentSearchService';

type SearchCriteria = {
    term: string;
    location: string;
};

type SearchMetadata = {
    cached?: boolean;
    creditDeducted?: number;
    requestedCount?: number;
    isLimited?: boolean;
};

type JobSearchState =
    | { phase: 'idle' }
    | { phase: 'loading'; criteria: SearchCriteria }
    | { phase: 'results'; criteria: SearchCriteria; jobs: JobPosting[]; metadata: SearchMetadata | null; pageToken?: string }
    | { phase: 'empty'; criteria: SearchCriteria; metadata: SearchMetadata | null }
    | { phase: 'error'; criteria: SearchCriteria; message: string };

const normalizeText = (value: string | undefined): string =>
    (value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const QUERY_EXPANSIONS: Record<string, string[]> = {
    it: ['information technology', 'systems', 'network', 'helpdesk', 'support', 'tech', 'technology', 'sysadmin', 'administrator', 'security', 'analyst', 'computer', 'infrastructure'],
    software: ['developer', 'engineer', 'programmer', 'coder', 'web', 'frontend', 'backend', 'fullstack', 'full stack', 'architect', 'qa', 'test', 'devops', 'sre', 'application'],
    engineer: ['developer', 'programmer', 'coder', 'architect', 'sre', 'devops', 'systems', 'qa', 'test', 'engineering'],
    developer: ['engineer', 'programmer', 'coder', 'architect', 'web', 'software', 'development', 'application'],
    nurse: ['rn', 'lpn', 'nursing', 'np', 'healthcare', 'medical', 'hospital', 'clinic', 'care'],
    doctor: ['md', 'physician', 'healthcare', 'medical', 'hospital', 'clinic', 'pediatrician', 'surgeon'],
    teacher: ['educator', 'instructor', 'tutor', 'professor', 'school', 'education', 'learning', 'faculty'],
    marketing: ['seo', 'sem', 'growth', 'advertising', 'brand', 'content', 'social media', 'pr', 'communications', 'digital'],
    sales: ['account executive', 'ae', 'sdr', 'bdr', 'business development', 'representative', 'account manager', 'inside sales'],
    design: ['designer', 'ux', 'ui', 'product designer', 'graphic', 'creative', 'art director', 'illustrator'],
};

const searchTerms = (term: string): string[] => {
    const stopWords = new Set(['in', 'and', 'a', 'of', 'for', 'to', 'with', 'the', 'an', 'at', 'jobs', 'job', 'hiring', 'near', 'me']);
    return normalizeText(term).split(' ').filter(value => value.length > 0 && !stopWords.has(value));
};

const textMatchesTerm = (text: string, term: string): boolean => {
    const normalizedTerm = normalizeText(term);
    if (!normalizedTerm) return false;
    if (normalizedTerm.includes(' ')) return text.includes(normalizedTerm);
    return new RegExp(`\\b${normalizedTerm}\\b`, 'i').test(text);
};

const matchesSearchIntent = (job: JobPosting, criteria: SearchCriteria): boolean => {
    const terms = searchTerms(criteria.term);
    if (terms.length === 0) return true;

    const title = normalizeText(job.jobTitle);
    const company = normalizeText(job.companyName);
    const matchesCompany = terms.every(term => textMatchesTerm(company, term));
    if (matchesCompany) return true;

    if (terms.length === 1) {
        const expandedTerms = new Set([terms[0], ...(QUERY_EXPANSIONS[terms[0]] || [])]);
        return Array.from(expandedTerms).some(term => textMatchesTerm(title, term));
    }

    return terms.every(term => {
        const termGroup = new Set([term, ...(QUERY_EXPANSIONS[term] || [])]);
        return Array.from(termGroup).some(groupTerm => textMatchesTerm(title, groupTerm));
    });
};

const matchesSearchLocation = (job: JobPosting, location: string): boolean => {
    const requestedLocation = normalizeText(location);
    if (!requestedLocation) return true;

    const jobLocation = normalizeText(job.location);
    if (jobLocation.includes('remote')) return true;
    if (['remote', 'anywhere', 'nationwide', 'us', 'usa', 'united states'].includes(requestedLocation)) {
        return jobLocation.includes('remote') ||
            jobLocation.includes('united states') ||
            jobLocation.includes('nationwide') ||
            jobLocation.includes('usa');
    }
    if (jobLocation.includes(requestedLocation)) return true;

    const requestedTerms = requestedLocation.split(' ').filter(Boolean);
    const longTerms = requestedTerms.filter(term => term.length > 2);
    if (longTerms.length > 1) return longTerms.every(term => jobLocation.includes(term));
    if (longTerms.length === 1) return jobLocation.includes(longTerms[0]);

    return requestedTerms.some(term => new RegExp(`\\b${term}\\b`, 'i').test(jobLocation));
};

const filterSearchResults = (jobs: JobPosting[], criteria: SearchCriteria): JobPosting[] => {
    return jobs.filter(job => {
        return matchesSearchIntent(job, criteria) && matchesSearchLocation(job, criteria.location);
    });
};


const JobMarketPage: React.FC = () => {
    const { currentUser, aiUsage, refreshAIUsage } = useAuth();
    const { t } = useTranslation();
    const { addJobApplication, jobApplications } = useJobTracker();
    const { resumes } = useResumes();
    const { addJob } = usePracticeHistory();
    const { checkCredit, CreditLimitModal } = useAICreditCheck();

    // Data States
    const [partnerJobs, setPartnerJobs] = useState<JobPosting[]>([]);
    const [savedJobs, setSavedJobs] = useState<JobPosting[]>([]); // User's saved job history
    const [jobCount, setJobCount] = useState<number>(10); // Number of jobs to search (5-20)
    const [searchState, setSearchState] = useState<JobSearchState>({ phase: 'idle' });

    // Status States
    const [isLoading, setIsLoading] = useState(true); // Initial load
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const isSearching = searchState.phase === 'loading';

    // Search field focus/animation state
    const [activeField, setActiveField] = useState<'term' | 'location' | null>(null);
    const termInputRef = useRef<HTMLInputElement>(null);
    const locationInputRef = useRef<HTMLInputElement>(null);

    // Search States
    const [searchQuery, setSearchQuery] = useState({ term: '', location: '' });
    // Autocomplete States
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
    const autocompleteRef = useRef<HTMLDivElement>(null);

    // Fetch Autocomplete Suggestions (200ms Debounce)
    useEffect(() => {
        const term = searchQuery.term.trim();
        if (term.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsFetchingSuggestions(true);
            try {
                const results = await getTalentAutocomplete(term);
                setSuggestions(results);
                if (document.activeElement === termInputRef.current) {
                    setShowSuggestions(results.length > 0);
                }
            } catch (err) {
                console.error("Autocomplete fetch error:", err);
            } finally {
                setIsFetchingSuggestions(false);
            }
        }, 200);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery.term]);

    // Handle clicking outside autocomplete suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectSuggestion = (suggestion: string) => {
        setSearchQuery(prev => ({ ...prev, term: suggestion }));
        setShowSuggestions(false);
        runSearch(suggestion, searchQuery.location, false);
    };

    // Tracker States
    const [addingToTracker, setAddingToTracker] = useState<string | null>(null);
    const [addedJobs, setAddedJobs] = useState<Set<string>>(new Set());
    const [userApplications, setUserApplications] = useState<Set<string>>(new Set());

    // UI States
    const [showLegend, setShowLegend] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Modal States
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
    const [applyingJob, setApplyingJob] = useState<JobPosting | null>(null);
    const [selectedResumeId, setSelectedResumeId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Load of Partner Jobs
    useEffect(() => {
        const fetchInitialJobs = async () => {
            try {
                const fetchedJobs = await getAllPublishedJobs();
                setPartnerJobs(fetchedJobs);
            } catch (error) {
                console.error("Error fetching jobs:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialJobs();
    }, []);

    // Sync Added Jobs
    useEffect(() => {
        if (jobApplications.length > 0) {
            const trackerJobIds = new Set<string>();
            jobApplications.forEach(app => {
                if (app.jobPostURL && app.jobPostURL.includes('id=')) {
                    const id = app.jobPostURL.split('id=')[1];
                    if (id) trackerJobIds.add(id);
                } else if (app.jobPostingId) {
                    trackerJobIds.add(app.jobPostingId);
                }
            });
            setAddedJobs(prev => {
                const newSet = new Set(prev);
                trackerJobIds.forEach(id => newSet.add(id));
                return newSet;
            });
        }
    }, [jobApplications]);

    // Sync User Applications
    useEffect(() => {
        const fetchUserApps = async () => {
            if (currentUser) {
                try {
                    const apps = await getApplicationsForUser(currentUser.uid);
                    const appliedJobIds = new Set(apps.map(app => app.jobPostingId));
                    setUserApplications(appliedJobIds);
                } catch (error) {
                    console.error("Error fetching user applications:", error);
                }
            }
        };
        fetchUserApps();
    }, [currentUser]);

    // Load user's saved job history
    useEffect(() => {
        const loadJobHistory = async () => {
            if (currentUser) {
                try {
                    const history = await getUserJobHistory(currentUser.uid);
                    setSavedJobs(history);
                    console.log(`Loaded ${history.length} saved jobs for user`);
                } catch (error) {
                    console.error("Error loading job history:", error);
                }
            }
        };
        loadJobHistory();
    }, [currentUser]);

    // --- Search Logic ---

    const handleDeleteJob = async (jobId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;

        try {
            const success = await deleteUserJob(currentUser.uid, jobId);
            if (success) {
                // Update local state
                setSavedJobs(prev => prev.filter(j => j.id !== jobId));
                console.log(`Job ${jobId} deleted successfully`);
            }
        } catch (error) {
            console.error("Failed to delete job", error);
        }
    };

    const getRemainingCreditsText = () => {
        if (!aiUsage) return '';
        const remaining = Math.max(0, aiUsage.limit - aiUsage.count);
        const formatted = Number.isInteger(remaining) ? remaining.toString() : remaining.toFixed(1);
        return `${formatted} / ${aiUsage.limit}`;
    };

    const runSearch = async (term: string, loc: string, bypassCache: boolean = false) => {
        // Check AI Credits
        if (!checkCredit()) {
            console.warn("Insufficient AI credits for search");
            return;
        }

        const criteria = { term, location: loc };
        setSearchState({ phase: 'loading', criteria });

        if (bypassCache) {
            setToastMessage("🚀 Bypassing cache. Forcing a fresh live search...");
        } else {
            setToastMessage("🔍 Searching the web for relevant matches...");
        }

        try {
            const result = await searchGoogleJobs(term, loc, jobCount, undefined, bypassCache);
            const metadata = {
                cached: result.cached,
                creditDeducted: result.creditDeducted,
                requestedCount: result.requestedCount || jobCount,
                isLimited: result.isLimited
            };
            const filteredJobs = filterSearchResults(result.jobs || [], criteria);

            setSearchState(filteredJobs.length > 0
                ? {
                    phase: 'results',
                    criteria,
                    jobs: filteredJobs,
                    metadata,
                    pageToken: result.nextPageToken
                }
                : {
                    phase: 'empty',
                    criteria,
                    metadata
                }
            );

            if (result.cached) {
                setToastMessage("ℹ️ Loaded relevant matches from search cache.");
            } else {
                setToastMessage("✨ Fresh jobs fetched and cached successfully!");
            }

            // Dynamic refresh of AI usage context
            refreshAIUsage().catch(err => console.warn("Failed to refresh AI credits:", err));
        } catch (error: any) {
            console.error("Google Job Search Failed", error);
            const errorMessage = error?.message || 'Failed to search jobs. Please try again.';
            setSearchState({
                phase: 'error',
                criteria,
                message: errorMessage
            });
            setToastMessage(`❌ Search Error: ${errorMessage}`);
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const term = searchQuery.term.trim();
        const loc = searchQuery.location.trim();
        await runSearch(term, loc, false);
    };

    const handleLoadMore = async () => {
        if (searchState.phase !== 'results' || !searchState.pageToken || isLoadingMore || !checkCredit()) return;

        setIsLoadingMore(true);
        try {
            const result = await searchGoogleJobs(
                searchState.criteria.term,
                searchState.criteria.location,
                jobCount,
                searchState.pageToken
            );
            const incomingJobs = filterSearchResults(result.jobs || [], searchState.criteria);
            const mergedJobs = [...searchState.jobs, ...incomingJobs].filter((job, index, allJobs) =>
                allJobs.findIndex(candidate => candidate.id === job.id) === index
            );
            const metadata = {
                cached: result.cached,
                creditDeducted: result.creditDeducted,
                requestedCount: result.requestedCount || jobCount,
                isLimited: result.isLimited
            };

            setSearchState(mergedJobs.length > 0
                ? {
                    phase: 'results',
                    criteria: searchState.criteria,
                    jobs: mergedJobs,
                    metadata,
                    pageToken: result.nextPageToken
                }
                : {
                    phase: 'empty',
                    criteria: searchState.criteria,
                    metadata
                }
            );
            refreshAIUsage().catch(err => console.warn(err));
        } catch (error) {
            console.error("Load More Failed", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleRefresh = async () => {
        if (isSearching || !checkCredit()) return;
        const term = searchQuery.term.trim();
        const loc = searchQuery.location.trim();
        await runSearch(term, loc, true);
    };

    const handleSuggestedSearch = async (term: string, location: string) => {
        setSearchQuery({ term, location });
        await runSearch(term, location, false);
    };

    // --- Actions ---

    const handleAddToTracker = async (job: JobPosting, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!currentUser) {
            navigate('/signin');
            return;
        }

        setAddingToTracker(job.id);

        try {
            let salaryString = '';
            if (job.salaryMin && job.salaryMax) {
                salaryString = `${job.salaryCurrency || '$'}${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`;
            } else if (job.salaryMin) {
                salaryString = `${job.salaryCurrency || '$'}${job.salaryMin.toLocaleString()}+`;
            }

            let workModel: WorkModel = 'On-site';
            if (job.locationType === 'remote') workModel = 'Remote';
            else if (job.locationType === 'hybrid') workModel = 'Hybrid';

            // Build job data, excluding undefined fields
            const jobDataToAdd: any = {
                jobTitle: job.jobTitle,
                companyName: job.companyName,
                location: job.location,
                jobPostURL: job.source === 'google' ? (job.applyUrl || '') : `${window.location.origin}/job-market?id=${job.id}`,
                jobDescription: job.description,
                applicationStatus: 'To Apply',
                workModel: workModel,
                salaryRange: salaryString,
                prep_RoleOverview: `Generated from job posting: ${job.jobTitle} at ${job.companyName}`,
            };

            // Only include jobPostingId for internal jobs
            if (job.source !== 'google') {
                jobDataToAdd.jobPostingId = job.id;
            }

            await addJobApplication(jobDataToAdd);

            if (job.source !== 'google') {
                incrementJobViewCount(job.id);
            }
            setAddedJobs(prev => new Set(prev).add(job.id));
        } catch (error) {
            console.error("Error adding to tracker:", error);
            alert("Failed to add to tracker.");
        } finally {
            setAddingToTracker(null);
        }
    };

    const handleApplyClick = (job: JobPosting, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (job.source === 'google' && job.applyUrl) {
            window.open(job.applyUrl, '_blank');
            return;
        }

        if (!currentUser) {
            navigate('/signin');
            return;
        }
        setApplyingJob(job);
        if (resumes.length > 0) {
            setSelectedResumeId(resumes[0].id);
        }
    };

    const handleSubmitApplication = async () => {
        if (!currentUser || !applyingJob || !selectedResumeId) return;

        setIsSubmitting(true);
        try {
            await submitApplication(applyingJob.id, currentUser.uid, selectedResumeId);
            alert("Application submitted successfully!");
            setApplyingJob(null);
            setSelectedJob(null);
            if (applyingJob) {
                setUserApplications(prev => new Set(prev).add(applyingJob.id));
            }
        } catch (error) {
            console.error("Error submitting application:", error);
            alert("Failed to submit application. Please try again.");
        }
    };

    // Handler for Mock Interview button
    const handleMockInterview = async (job: JobPosting, e?: React.MouseEvent) => {
        e?.stopPropagation();

        if (!currentUser) {
            navigate('/signin');
            return;
        }

        // Check AI credits before starting mock interview
        if (!checkCredit()) return;

        try {
            // Prepare summarized job data for interview
            const interviewJobData = {
                title: job.jobTitle,
                company: job.companyName,
                location: job.location,
                description: job.description?.substring(0, 500) || job.jobTitle, // Limit description length
                url: job.applyUrl || ''
            };

            // Add to practice history and get job ID
            const newJobId = await addJob(interviewJobData, []);

            navigate(`/interview-studio/${newJobId}`);
        } catch (error) {
            console.error("Error starting mock interview:", error);
            alert("Failed to start mock interview. Please try again.");
        }
    };

    const formatSalary = (min?: number, max?: number, currency?: string) => {
        if (!min && !max) return 'Competitive';
        const curr = currency || '$';
        if (min && max) return `${curr}${min.toLocaleString()} - ${max.toLocaleString()}`;
        if (min) return `${curr}${min.toLocaleString()}+`;
        return 'Competitive';
    };

    const getTimeAgo = (date: any) => {
        if (!date) return '';
        const now = new Date();
        const posted = date instanceof Date ? date : new Date(date);

        // Validation needed for invalid dates
        if (isNaN(posted.getTime())) return '';

        const diffInSeconds = Math.floor((now.getTime() - posted.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return posted.toLocaleDateString();
    };

    const renderSuggestions = () => {
        const term = searchQuery.term.trim() || 'Software Engineer';
        const loc = searchQuery.location.trim();

        return (
            <div className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-6">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center justify-center gap-1.5">
                    💡 Click a suggestion to search again:
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    {loc && (
                        <button
                            type="button"
                            onClick={() => handleSuggestedSearch(term, 'Remote')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold border border-indigo-100 dark:border-indigo-900/50 transition-all active:scale-95 cursor-pointer"
                        >
                            <span>🌐 Search Remote / US Nationwide</span>
                        </button>
                    )}
                    {loc && (
                        <button
                            type="button"
                            onClick={() => handleSuggestedSearch(term, '')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold border border-indigo-100 dark:border-indigo-900/50 transition-all active:scale-95 cursor-pointer"
                        >
                            <span>📍 Remove location constraint</span>
                        </button>
                    )}
                    {term !== 'Software Engineer' && (
                        <button
                            type="button"
                            onClick={() => handleSuggestedSearch('Software Engineer', loc)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold border border-indigo-100 dark:border-indigo-900/50 transition-all active:scale-95 cursor-pointer"
                        >
                            <span>🔍 Try broader title: "Software Engineer"</span>
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-300">
            <div className="bg-white/80 dark:bg-gray-900/85 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/40 shadow-sm sticky top-0 z-40 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight hidden md:block">
                                    Job Market
                                </h1>
                                {aiUsage && (
                                    <div className="mt-1 hidden md:block">
                                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-800/25 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-1.5 shadow-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                            AI Credits remaining: <span className="font-extrabold text-emerald-800 dark:text-emerald-300">{getRemainingCreditsText()}</span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* ✨ Premium Animated Search Bar */}
                            <form
                                onSubmit={handleSearch}
                                className="flex-1 w-full md:max-w-4xl"
                            >
                                {/* Search Capsule */}
                                <div className={`
                                    flex flex-col md:flex-row items-stretch
                                    bg-white dark:bg-gray-800
                                    border-2 transition-all duration-300 ease-out
                                    rounded-2xl md:rounded-full
                                    overflow-hidden
                                    shadow-lg
                                    ${activeField
                                        ? 'border-indigo-500 shadow-indigo-500/20 shadow-xl'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }
                                `}>
                                    {/* WHAT Field */}
                                    <div
                                        ref={autocompleteRef}
                                        className={`
                                            relative flex items-center flex-1 min-w-0
                                            transition-all duration-300 ease-out cursor-text
                                            ${activeField === 'term'
                                                ? 'bg-indigo-50 dark:bg-indigo-950/30'
                                                : activeField === 'location'
                                                    ? 'opacity-70'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                                            }
                                        `}
                                        onClick={() => termInputRef.current?.focus()}
                                    >
                                        <div className="flex items-center gap-3 w-full px-5 py-3.5">
                                            <Search
                                                size={17}
                                                className={`flex-shrink-0 transition-colors duration-200 ${
                                                    activeField === 'term'
                                                        ? 'text-indigo-500'
                                                        : 'text-gray-400'
                                                }`}
                                            />
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 ${
                                                    activeField === 'term'
                                                        ? 'text-indigo-500'
                                                        : 'text-gray-400 dark:text-gray-500'
                                                }`}>
                                                    What
                                                </span>
                                                <input
                                                    ref={termInputRef}
                                                    type="text"
                                                    autoComplete="off"
                                                    spellCheck={false}
                                                    placeholder="Job title, keywords, or company"
                                                    className="w-full bg-transparent border-0 outline-none ring-0 p-0 m-0 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-0"
                                                    style={{ boxShadow: 'none' }}
                                                    value={searchQuery.term}
                                                    onChange={e => setSearchQuery(prev => ({ ...prev, term: e.target.value }))}
                                                    onFocus={() => {
                                                        setActiveField('term');
                                                        if (suggestions.length > 0) {
                                                            setShowSuggestions(true);
                                                        }
                                                    }}
                                                    onBlur={() => setActiveField(null)}
                                                />
                                            </div>
                                        </div>
                                        {/* Active indicator line - bottom on mobile, right on desktop */}
                                        <div className={`
                                            absolute bottom-0 left-0 right-0 h-0.5 md:hidden
                                            bg-indigo-500 transition-all duration-300
                                            ${activeField === 'term' ? 'opacity-100' : 'opacity-0'}
                                        `} />

                                        {/* Autocomplete Suggestions Dropdown */}
                                        {showSuggestions && suggestions.length > 0 && (
                                            <div 
                                                className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden animate-fade-in-up"
                                                role="listbox"
                                            >
                                                <div className="py-1">
                                                    {suggestions.map((suggestion, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            className="flex items-center gap-3 w-full px-5 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-150 border-b last:border-b-0 border-gray-100 dark:border-gray-700"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSelectSuggestion(suggestion);
                                                            }}
                                                        >
                                                            <Search size={14} className="text-gray-400 dark:text-gray-500" />
                                                            <span>{suggestion}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className={`hidden md:block w-px self-stretch my-3 transition-colors duration-300 ${
                                        activeField ? 'bg-indigo-200 dark:bg-indigo-800' : 'bg-gray-200 dark:bg-gray-700'
                                    }`} />
                                    <div className="md:hidden h-px mx-4 transition-colors duration-300 bg-gray-100 dark:bg-gray-700" />

                                    {/* WHERE Field */}
                                    <div
                                        className={`
                                            relative flex items-center flex-1 min-w-0
                                            transition-all duration-300 ease-out cursor-text
                                            ${activeField === 'location'
                                                ? 'bg-violet-50 dark:bg-violet-950/30'
                                                : activeField === 'term'
                                                    ? 'opacity-70'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                                            }
                                        `}
                                        onClick={() => locationInputRef.current?.focus()}
                                    >
                                        <div className="flex items-center gap-3 w-full px-5 py-3.5">
                                            <MapPin
                                                size={17}
                                                className={`flex-shrink-0 transition-colors duration-200 ${
                                                    activeField === 'location'
                                                        ? 'text-violet-500'
                                                        : 'text-gray-400'
                                                }`}
                                            />
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 ${
                                                    activeField === 'location'
                                                        ? 'text-violet-500'
                                                        : 'text-gray-400 dark:text-gray-500'
                                                }`}>
                                                    Where
                                                </span>
                                                <input
                                                    ref={locationInputRef}
                                                    type="text"
                                                    autoComplete="off"
                                                    spellCheck={false}
                                                    placeholder="City, state, or zip code"
                                                    className="w-full bg-transparent border-0 outline-none ring-0 p-0 m-0 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-0"
                                                    style={{ boxShadow: 'none' }}
                                                    value={searchQuery.location}
                                                    onChange={e => setSearchQuery(prev => ({ ...prev, location: e.target.value }))}
                                                    onFocus={() => setActiveField('location')}
                                                    onBlur={() => setActiveField(null)}
                                                />
                                            </div>
                                        </div>
                                        <div className={`
                                            absolute bottom-0 left-0 right-0 h-0.5 md:hidden
                                            bg-violet-500 transition-all duration-300
                                            ${activeField === 'location' ? 'opacity-100' : 'opacity-0'}
                                        `} />
                                    </div>

                                    {/* Divider */}
                                    <div className={`hidden md:block w-px self-stretch my-3 transition-colors duration-300 ${
                                        activeField ? 'bg-indigo-200 dark:bg-indigo-800' : 'bg-gray-200 dark:bg-gray-700'
                                    }`} />
                                    <div className="md:hidden h-px mx-4 transition-colors duration-300 bg-gray-100 dark:bg-gray-700" />

                                    {/* RESULTS Dropdown */}
                                    <div className={`
                                        flex items-center px-5 py-3.5 transition-all duration-300
                                        ${activeField ? 'opacity-70' : ''}
                                    `}>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">
                                                Results
                                            </span>
                                            <select
                                                value={jobCount}
                                                onChange={e => setJobCount(Number(e.target.value))}
                                                className="bg-transparent border-0 outline-none ring-0 p-0 m-0 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-0 cursor-pointer appearance-auto"
                                                style={{ boxShadow: 'none' }}
                                            >
                                                <option value={5}>5 jobs</option>
                                                <option value={10}>10 jobs</option>
                                                <option value={15}>15 jobs</option>
                                                <option value={20}>20 jobs</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Search Button */}
                                    <div className="p-1.5">
                                        <button
                                            type="submit"
                                            disabled={isSearching}
                                            className="
                                                h-full w-full md:w-auto
                                                flex items-center justify-center gap-2
                                                bg-gradient-to-r from-indigo-600 to-violet-600
                                                hover:from-indigo-500 hover:to-violet-500
                                                disabled:opacity-50 disabled:cursor-not-allowed
                                                text-white font-bold text-sm
                                                px-7 py-3 rounded-xl md:rounded-full
                                                shadow-md hover:shadow-indigo-500/30 hover:shadow-lg
                                                active:scale-95 transition-all duration-200
                                                whitespace-nowrap
                                            "
                                        >
                                            {isSearching ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <Search size={16} />
                                                    <span>Find Jobs</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Credits hint row */}
                                {aiUsage && (
                                    <div className="mt-2 flex justify-between items-center px-2 text-xs">
                                        <div className="md:hidden">
                                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Credits: {getRemainingCreditsText()}
                                            </span>
                                        </div>
                                        <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500">
                                            Cached searches are <span className="text-emerald-600 dark:text-emerald-400 font-bold">free</span> (1 credit for live)
                                        </span>
                                    </div>
                                )}
                            </form>

                            {/* Circular Spatial Action Buttons */}
                            <div className="hidden md:flex gap-2.5 items-center">
                                <button
                                    onClick={handleRefresh}
                                    disabled={isSearching}
                                    className="p-3 text-gray-600 dark:text-gray-300 bg-gray-100/50 dark:bg-white/5 hover:bg-gray-200/80 dark:hover:bg-white/10 border border-gray-200/40 dark:border-white/5 rounded-full transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:scale-105 active:scale-95"
                                    title="Refresh Search"
                                >
                                    <RefreshCw className={`w-5 h-5 ${isSearching ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="p-3 text-gray-600 dark:text-gray-300 bg-gray-100/50 dark:bg-white/5 hover:bg-gray-200/80 dark:hover:bg-white/10 border border-gray-200/40 dark:border-white/5 rounded-full transition-all duration-300 shadow-sm hover:scale-105 active:scale-95"
                                    title="Dashboard"
                                >
                                    <LayoutDashboard className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-10">
                        {searchState.phase === 'loading' ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                <p className="text-gray-500">Searching across the web...</p>
                            </div>
                        ) : searchState.phase === 'results' ? (
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Search size={20} className="text-indigo-600" /> New Search Results
                                    </h2>
                                    {searchState.metadata && (searchState.metadata.cached || (searchState.metadata.creditDeducted ?? 1) < 1) && (
                                        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-full text-xs font-medium border border-indigo-100 dark:border-indigo-900/50">
                                            <Clock size={14} className="animate-pulse" />
                                            <span>
                                                {searchState.metadata.cached
                                                    ? "🕐 Cached (up to 6h ago) · " 
                                                    : `🕐 Hybrid Search (${Math.round((1 - (searchState.metadata.creditDeducted ?? 0)) * 100)}% from cache) · `}
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={handleRefresh}
                                                disabled={isSearching}
                                                className="underline hover:text-indigo-900 dark:hover:text-indigo-100 font-semibold cursor-pointer focus:outline-none flex items-center gap-0.5"
                                            >
                                                Refresh for live results
                                                <RefreshCw size={10} className={isSearching ? "animate-spin" : ""} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {searchState.metadata?.isLimited && (
                                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex gap-3 text-amber-800 dark:text-amber-300 text-sm">
                                        <span className="text-lg">⚠️</span>
                                        <div>
                                            <p className="font-semibold">Limited results found</p>
                                            <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                                                We only found {searchState.jobs.length} jobs in this city matching your search terms (fewer than the {searchState.metadata.requestedCount} requested). Try broadening your search terms or checking adjacent cities.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="grid gap-4">
                                    {searchState.jobs.map((job, idx) => (
                                        <JobCard
                                            key={`google-${job.id}-${idx}`}
                                            job={job}
                                            onSelect={setSelectedJob}
                                            onAddToTracker={handleAddToTracker}
                                            onApply={handleApplyClick}
                                            onMockInterview={handleMockInterview}
                                            onDelete={handleDeleteJob}
                                            isAdding={addingToTracker === job.id}
                                            isAdded={addedJobs.has(job.id)}
                                            isApplied={false}
                                            formatSalary={formatSalary}
                                            getTimeAgo={getTimeAgo}
                                        />
                                    ))}
                                </div>
                                {searchState.pageToken && (
                                    <div className="flex justify-center pt-8">
                                        <button
                                            onClick={handleLoadMore}
                                            disabled={isLoadingMore}
                                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isLoadingMore ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Loading...
                                                </>
                                            ) : (
                                                'Load More'
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : searchState.phase === 'empty' ? (
                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No jobs found</h3>
                                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                    We couldn't find any job matches for <span className="font-semibold">"{searchState.criteria.term}"</span> {searchState.criteria.location && <span>in <span className="font-semibold">"{searchState.criteria.location}"</span></span>}.
                                </p>
                                {renderSuggestions()}
                            </div>
                        ) : searchState.phase === 'error' ? (
                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-200 dark:border-red-900/50">
                                <div className="bg-red-50 dark:bg-red-950/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <X className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Search failed</h3>
                                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto">{searchState.message}</p>
                            </div>
                        ) : null}

                        {searchState.phase === 'idle' && savedJobs.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Clock size={20} className="text-indigo-600" /> Your Saved Search History
                                </h2>
                                <div className="grid gap-4">
                                    {savedJobs.map((job) => (
                                        <JobCard
                                            key={`saved-${job.id}`}
                                            job={job}
                                            onSelect={setSelectedJob}
                                            onAddToTracker={handleAddToTracker}
                                            onApply={handleApplyClick}
                                            onMockInterview={handleMockInterview}
                                            onDelete={handleDeleteJob}
                                            isAdding={addingToTracker === job.id}
                                            isAdded={addedJobs.has(job.id)}
                                            isApplied={userApplications.has(job.id)}
                                            formatSalary={formatSalary}
                                            getTimeAgo={getTimeAgo}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {searchState.phase === 'idle' && partnerJobs.length > 0 && (
                            <div className="space-y-4">
                                <h2 className={`text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 ${
                                    savedJobs.length > 0 ? 'border-t border-gray-200 dark:border-gray-700 pt-8' : ''
                                }`}>
                                    <Briefcase size={20} className="text-indigo-600" /> Featured Opportunities
                                </h2>
                                <div className="grid gap-4">
                                    {partnerJobs.map((job) => (
                                        <JobCard
                                            key={job.id}
                                            job={job}
                                            onSelect={setSelectedJob}
                                            onAddToTracker={handleAddToTracker}
                                            onApply={handleApplyClick}
                                            onMockInterview={handleMockInterview}
                                            isAdding={addingToTracker === job.id}
                                            isAdded={addedJobs.has(job.id)}
                                            isApplied={userApplications.has(job.id)}
                                            formatSalary={formatSalary}
                                            getTimeAgo={getTimeAgo}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Job Details Modal - Reuse existing logic */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedJob.jobTitle}</h2>
                                <div className="flex items-center gap-2 mt-1 text-gray-600 dark:text-gray-300">
                                    <Building2 className="w-5 h-5" />
                                    <span className="font-medium">{selectedJob.companyName}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full font-medium">
                                    <MapPin className="w-5 h-5 text-gray-500" />
                                    {selectedJob.location} ({selectedJob.locationType})
                                </div>
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full font-medium">
                                    <DollarSign className="w-5 h-5 text-gray-500" />
                                    {formatSalary(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.salaryCurrency)}
                                </div>
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full capitalize font-medium">
                                    <Briefcase className="w-5 h-5 text-gray-500" />
                                    {selectedJob.employmentType}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">About the Role</h3>
                                    <button
                                        onClick={() => setShowLegend(true)}
                                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        <HelpCircle size={14} />
                                        Highlight Guide
                                    </button>
                                </div>
                                <SmartDescription text={selectedJob.description} />
                            </div>

                            {/* Show External Link if from Google */}
                            {selectedJob.source === 'google' && selectedJob.applyUrl && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg flex items-start gap-3">
                                    <ExternalLink className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-indigo-900 dark:text-indigo-200">External Application</h4>
                                        <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                                            This job is hosted on an external site. Click "Apply Externally" to proceed.
                                        </p>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                                            AI search can make mistakes, so double-check it.{' '}
                                            <a
                                                href="https://careervivid.app/policy#privacy"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline hover:text-indigo-800 dark:hover:text-indigo-200"
                                            >
                                                Your privacy & careervivid
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {
                                selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Responsibilities</h3>
                                        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                                            {selectedJob.responsibilities.map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )
                            }
                        </div >

                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
                            {addedJobs.has(selectedJob.id) ? (
                                <>
                                    <button
                                        onClick={(e) => handleAddToTracker(selectedJob, e)}
                                        className="px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 font-medium transition-colors flex items-center gap-2"
                                    >
                                        <PlusCircle size={16} />
                                        Add Again
                                    </button>
                                    <button
                                        onClick={() => navigate('/job-tracker')}
                                        className="px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 font-medium transition-colors flex items-center gap-2"
                                    >
                                        <LayoutDashboard size={16} />
                                        Go to Tracker
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={(e) => handleAddToTracker(selectedJob, e)}
                                    className="px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 font-medium transition-colors flex items-center gap-2"
                                >
                                    <PlusCircle size={16} />
                                    Add to Tracker
                                </button>
                            )}

                            {(() => {
                                const isPartner = selectedJob.isPartnerJob === true;
                                const externalLink = selectedJob.externalUrl ?? selectedJob.applyUrl;

                                if (isPartner) {
                                    return (
                                        <button
                                            onClick={(e) => handleApplyClick(selectedJob, e)}
                                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors flex items-center gap-2"
                                        >
                                            {userApplications.has(selectedJob.id) ? 'Reapply' : 'Apply Now'}
                                        </button>
                                    );
                                }

                                if (externalLink) {
                                    return (
                                        <a
                                            href={externalLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-colors flex items-center gap-2"
                                        >
                                            Apply Externally <ExternalLink size={16} />
                                        </a>
                                    );
                                }

                                return null;
                            })()}
                        </div>
                    </div >
                </div >
            )}

            {/* Apply Modal */}
            {
                applyingJob && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Apply to {applyingJob.companyName}</h2>
                                <button onClick={() => setApplyingJob(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Applying for</h3>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{applyingJob.jobTitle}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Resume</h3>
                                    {resumes.length === 0 ? (
                                        <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                            <p className="text-gray-500 dark:text-gray-400 mb-3">No resumes found.</p>
                                            <button
                                                onClick={() => navigate('/newresume')}
                                                className="text-indigo-600 font-medium hover:underline text-sm"
                                            >
                                                Create a resume first
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                            {resumes.map(resume => (
                                                <label
                                                    key={resume.id}
                                                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedResumeId === resume.id
                                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-600'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="resume"
                                                        value={resume.id}
                                                        checked={selectedResumeId === resume.id}
                                                        onChange={(e) => setSelectedResumeId(e.target.value)}
                                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900 dark:text-white">{resume.title}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            Last updated: {new Date(resume.updatedAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <FileText className={`w-5 h-5 ${selectedResumeId === resume.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                                <button
                                    onClick={() => setApplyingJob(null)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitApplication}
                                    disabled={isSubmitting || !selectedResumeId || resumes.length === 0}
                                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Submit Application
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Highlight Guide Legend Modal */}
            <HighlightLegend isOpen={showLegend} onClose={() => setShowLegend(false)} />

            {/* AI Credit Limit Modal */}
            <CreditLimitModal />

            {/* Toast Notification */}
            {toastMessage && (
                <Toast
                    message={toastMessage}
                    onClose={() => setToastMessage(null)}
                />
            )}
        </div >
    );
};
export default JobMarketPage;
