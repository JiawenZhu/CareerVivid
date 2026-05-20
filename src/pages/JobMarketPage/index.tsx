import React, { useEffect, useState } from 'react';
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
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Loader2, Briefcase, ArrowRight, X, FileText, Send, HelpCircle, LayoutDashboard, Search, Filter, MapPin, Building2, DollarSign, Clock, ExternalLink, PlusCircle, CheckCircle2, Mic, RefreshCw, Trash2 } from 'lucide-react';
import { SmartDescription } from './components/SmartDescription';
import { HighlightLegend } from './components/HighlightLegend';
import { JobCard } from './components/JobCard';
import { formatSalary, getTimeAgo } from './utils/jobFormatters';
import { getUserJobHistory, deleteUserJob } from '../../services/jobHistoryService';


const JobMarketPage: React.FC = () => {
    const { currentUser, aiUsage, refreshAIUsage } = useAuth();
    const { t } = useTranslation();
    const { addJobApplication, jobApplications } = useJobTracker();
    const { resumes } = useResumes();
    const { addJob } = usePracticeHistory();
    const { checkCredit, CreditLimitModal } = useAICreditCheck();

    // Data States
    const [originalPartnerJobs, setOriginalPartnerJobs] = useState<JobPosting[]>([]); // Source of truth
    const [jobs, setJobs] = useState<JobPosting[]>([]); // Displayed partner jobs (filtered)
    const [googleJobs, setGoogleJobs] = useState<JobPosting[]>([]);
    const [savedJobs, setSavedJobs] = useState<JobPosting[]>([]); // User's saved job history
    const [jobCount, setJobCount] = useState<number>(10); // Number of jobs to search (5-20)
    const [searchMetadata, setSearchMetadata] = useState<{
        cached?: boolean;
        creditDeducted?: number;
        requestedCount?: number;
        isLimited?: boolean;
    } | null>(null);

    // Status States
    const [isLoading, setIsLoading] = useState(true); // Initial load
    const [isSearching, setIsSearching] = useState(false); // Calling API
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Search States
    const [searchQuery, setSearchQuery] = useState({ term: '', location: '' });
    const [pageToken, setPageToken] = useState<string | undefined>(undefined);
    const [hasPerformedSearch, setHasPerformedSearch] = useState(false);

    // Tracker States
    const [addingToTracker, setAddingToTracker] = useState<string | null>(null);
    const [addedJobs, setAddedJobs] = useState<Set<string>>(new Set());
    const [userApplications, setUserApplications] = useState<Set<string>>(new Set());

    // UI States
    const [showLegend, setShowLegend] = useState(false);

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
                setOriginalPartnerJobs(fetchedJobs);
                setJobs(fetchedJobs);
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

        // 1. Filter Local Partner Jobs
        if (!term && !loc) {
            setJobs(originalPartnerJobs);
        } else {
            const lowerTerm = term.toLowerCase();
            const lowerLoc = loc.toLowerCase();

            const filtered = originalPartnerJobs.filter(job => {
                const matchTerm = !term ||
                    job.jobTitle.toLowerCase().includes(lowerTerm) ||
                    job.companyName.toLowerCase().includes(lowerTerm) ||
                    job.description.toLowerCase().includes(lowerTerm);
                const matchLoc = !loc ||
                    job.location.toLowerCase().includes(lowerLoc);
                return matchTerm && matchLoc;
            });
            setJobs(filtered);
        }

        // 2. Fetch Google Jobs
        setIsSearching(true);
        setGoogleJobs([]);
        setPageToken(undefined);
        setHasPerformedSearch(true);

        try {
            const result = await searchGoogleJobs(term, loc, jobCount, undefined, bypassCache);
            if (result.jobs) {
                setGoogleJobs(result.jobs);
                setPageToken(result.nextPageToken);
                setSearchMetadata({
                    cached: result.cached,
                    creditDeducted: result.creditDeducted,
                    requestedCount: result.requestedCount || jobCount,
                    isLimited: result.isLimited
                });
                // Dynamic refresh of AI usage context
                refreshAIUsage().catch(err => console.warn("Failed to refresh AI credits:", err));
            }
        } catch (error: any) {
            console.error("Google Job Search Failed", error);
            const errorMessage = error?.message || 'Failed to search jobs. Please try again.';
            alert(`Search Error: ${errorMessage}`);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const term = searchQuery.term.trim();
        const loc = searchQuery.location.trim();
        await runSearch(term, loc, false);
    };

    const handleLoadMore = async () => {
        if (!pageToken || isLoadingMore || !checkCredit()) return;

        setIsLoadingMore(true);
        try {
            const result = await searchGoogleJobs(searchQuery.term, searchQuery.location, jobCount, pageToken);
            if (result.jobs) {
                setGoogleJobs(prev => [...prev, ...result.jobs]);
                setPageToken(result.nextPageToken);
                refreshAIUsage().catch(err => console.warn(err));
            }
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

            /*
            // Get auth token from Cloud Function
            const functions = getFunctions(undefined, 'us-west1');
            const getToken = httpsCallable(functions, 'getInterviewAuthToken');
            const result = await getToken();
            const { token } = result.data as { token: string };

            // Construct redirect URL to external Interview Microservice
            const baseUrl = 'https://careervivid-371634100960.us-west1.run.app';
            const targetUrl = `${baseUrl}/#/interview-studio/${newJobId}?token=${token}`;

            // Open in new tab
            window.open(targetUrl, '_blank');
            */

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

                            {/* Apple Glasses Glassmorphic Search Capsule */}
                            <form onSubmit={handleSearch} className="flex-1 w-full md:max-w-4xl">
                                <div className="flex flex-col md:flex-row bg-gray-100/60 dark:bg-gray-900/35 backdrop-blur-xl border border-gray-200/55 dark:border-gray-800/45 p-1.5 rounded-2xl md:rounded-full gap-2 md:gap-0 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] focus-within:ring-2 focus-within:ring-indigo-500/20 dark:focus-within:ring-indigo-500/10 focus-within:border-indigo-500/40 dark:focus-within:border-indigo-550/30 transition-all duration-350">
                                                             {/* WHAT Section */}
                                    <label 
                                        htmlFor="job-market-term-input"
                                        onClick={() => document.getElementById('job-market-term-input')?.focus()}
                                        className="flex-1 flex items-center gap-3 px-4 py-2 hover:bg-gray-200/40 dark:hover:bg-white/5 rounded-xl md:rounded-full transition-all duration-300 group focus-within:bg-gray-200/60 dark:focus-within:bg-white/10 cursor-text"
                                    >
                                        <div className="text-gray-400 group-hover:text-indigo-500 group-focus-within:text-indigo-500 transition-colors duration-250 pointer-events-none">
                                            <Search size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-550 group-hover:text-indigo-500/85 group-focus-within:text-indigo-500/85 transition-colors duration-250 pointer-events-none">What</div>
                                            <input
                                                id="job-market-term-input"
                                                type="text"
                                                placeholder="Job title, keywords, or company"
                                                className="w-full bg-transparent border-none outline-none p-0 text-sm font-medium text-gray-800 dark:text-gray-150 placeholder-gray-400/85 focus:ring-0 focus:outline-none cursor-text min-h-[22px]"
                                                value={searchQuery.term}
                                                onChange={e => setSearchQuery({ ...searchQuery, term: e.target.value })}
                                            />
                                        </div>
                                    </label>

                                    {/* Vertical Divider */}
                                    <div className="hidden md:block w-[1px] my-2 bg-gray-200/80 dark:bg-gray-800/80" />

                                    {/* WHERE Section */}
                                    <label 
                                        htmlFor="job-market-location-input"
                                        onClick={() => document.getElementById('job-market-location-input')?.focus()}
                                        className="flex-1 flex items-center gap-3 px-4 py-2 hover:bg-gray-200/40 dark:hover:bg-white/5 rounded-xl md:rounded-full transition-all duration-300 group focus-within:bg-gray-200/60 dark:focus-within:bg-white/10 cursor-text"
                                    >
                                        <div className="text-gray-400 group-hover:text-violet-500 group-focus-within:text-violet-500 transition-colors duration-250 pointer-events-none">
                                            <MapPin size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-550 group-hover:text-violet-500/85 group-focus-within:text-violet-500/85 transition-colors duration-250 pointer-events-none">Where</div>
                                            <input
                                                id="job-market-location-input"
                                                type="text"
                                                placeholder="City, state, or zip code"
                                                className="w-full bg-transparent border-none outline-none p-0 text-sm font-medium text-gray-800 dark:text-gray-150 placeholder-gray-400/85 focus:ring-0 focus:outline-none cursor-text min-h-[22px]"
                                                value={searchQuery.location}
                                                onChange={e => setSearchQuery({ ...searchQuery, location: e.target.value })}
                                            />
                                        </div>
                                    </label>

                                    {/* Vertical Divider */}
                                    <div className="hidden md:block w-[1px] my-2 bg-gray-200/80 dark:bg-gray-800/80" />

                                    {/* RESULTS Dropdown */}
                                    <label className="flex items-center justify-between md:justify-start gap-3 px-4 py-2 hover:bg-gray-200/40 dark:hover:bg-white/5 rounded-xl md:rounded-full transition-all duration-300 group cursor-pointer">
                                        <div className="flex flex-col">
                                            <div className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-550 group-hover:text-indigo-400 transition-colors duration-250">Results</div>
                                            <select
                                                value={jobCount}
                                                onChange={(e) => setJobCount(Number(e.target.value))}
                                                className="bg-transparent border-none outline-none p-0 text-sm font-bold text-gray-800 dark:text-gray-200 focus:ring-0 cursor-pointer pr-6"
                                            >
                                                <option value={5} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">5 jobs</option>
                                                <option value={10} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">10 jobs</option>
                                                <option value={15} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">15 jobs</option>
                                                <option value={20} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">20 jobs</option>
                                            </select>
                                        </div>
                                    </label>

                                    {/* High-Gloss Search Button */}
                                    <button
                                        type="submit"
                                        disabled={isSearching}
                                        className="bg-gradient-to-r from-indigo-600 via-indigo-650 to-violet-650 hover:from-indigo-500 hover:via-indigo-600 hover:to-violet-550 disabled:from-indigo-400 disabled:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm py-3 px-7 rounded-xl md:rounded-full shadow-[0_4px_16px_rgba(99,102,241,0.2)] hover:shadow-[0_4px_22px_rgba(99,102,241,0.35)] active:scale-97 transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap self-stretch md:my-0.5 md:mr-0.5"
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

                                {aiUsage && (
                                    <div className="mt-2.5 flex justify-between items-center px-1 text-xs text-gray-500 dark:text-gray-400">
                                        <div className="md:hidden">
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-50/65 dark:bg-emerald-950/20 border border-emerald-250/50 dark:border-emerald-800/30 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-1.2 shadow-sm">
                                                <span className="w-1.2 h-1.2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                Credits: <span className="font-extrabold">{getRemainingCreditsText()}</span>
                                            </span>
                                        </div>
                                        <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500">
                                            Cached searches are <span className="text-emerald-600 dark:text-emerald-400 font-bold">free</span> (1 credit for live)
                                        </span>
                                    </div>
                                )}
                            </form>

                            {/* Glassmorphic Circle Spatial Action Buttons */}
                            <div className="flex gap-2.5 hidden md:flex items-center">
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
                        {/* Section 1: Partner Jobs (Featured Opportunities) - Moved to top */}
                        {jobs.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Briefcase size={20} className="text-indigo-600" /> Featured Opportunities
                                </h2>
                                <div className="grid gap-4">
                                    {jobs.map((job) => (
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

                        {/* Section 2: New Search Results (Google Jobs) */}
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                <p className="text-gray-500">Searching across the web...</p>
                            </div>
                        ) : googleJobs.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-700 pt-8">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Search size={20} className="text-indigo-600" /> New Search Results
                                    </h2>
                                    {searchMetadata && (searchMetadata.cached || (searchMetadata.creditDeducted ?? 1) < 1) && (
                                        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-full text-xs font-medium border border-indigo-100 dark:border-indigo-900/50">
                                            <Clock size={14} className="animate-pulse" />
                                            <span>
                                                {searchMetadata.cached 
                                                    ? "🕐 Cached (up to 6h ago) · " 
                                                    : `🕐 Hybrid Search (${Math.round((1 - (searchMetadata.creditDeducted ?? 0)) * 100)}% from cache) · `}
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
                                {searchMetadata?.isLimited && (
                                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex gap-3 text-amber-800 dark:text-amber-300 text-sm">
                                        <span className="text-lg">⚠️</span>
                                        <div>
                                            <p className="font-semibold">Limited results found</p>
                                            <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                                                We only found {googleJobs.length} jobs in this city matching your search terms (fewer than the {searchMetadata.requestedCount} requested). Try broadening your search terms or checking adjacent cities.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="grid gap-4">
                                    {googleJobs.map((job, idx) => (
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
                                {pageToken && (
                                    <div className="flex justify-center pt-8">
                                        <button
                                            onClick={handleLoadMore}
                                            disabled={isSearching}
                                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isSearching ? (
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
                        ) : null}

                        {/* Section 3: Saved Job History */}
                        {savedJobs.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 pt-8">
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
                        {hasPerformedSearch && jobs.length === 0 && googleJobs.length === 0 && (
                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No jobs found</h3>
                                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                    We couldn't find any job matches for <span className="font-semibold">"{searchQuery.term}"</span> {searchQuery.location && <span>in <span className="font-semibold">"{searchQuery.location}"</span></span>}.
                                </p>
                                {renderSuggestions()}
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
        </div >
    );
};
export default JobMarketPage;
