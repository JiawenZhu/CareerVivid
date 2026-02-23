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
    const { currentUser } = useAuth();
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

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();

        // Check AI Credits
        if (!checkCredit()) {
            console.warn("Insufficient AI credits for search");
            return;
        }

        const term = searchQuery.term.trim();
        const loc = searchQuery.location.trim();

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
            const result = await searchGoogleJobs(term, loc, jobCount);
            if (result.jobs) {
                setGoogleJobs(result.jobs);
                setPageToken(result.nextPageToken);
            }
        } catch (error: any) {
            console.error("Google Job Search Failed", error);
            // Show error to user
            const errorMessage = error?.message || 'Failed to search jobs. Please try again.';
            alert(`Search Error: ${errorMessage}`);
        } finally {
            setIsSearching(false);
        }
    };

    const handleLoadMore = async () => {
        if (!pageToken || isLoadingMore || !checkCredit()) return;

        setIsLoadingMore(true);
        try {
            const result = await searchGoogleJobs(searchQuery.term, searchQuery.location, jobCount, pageToken);
            if (result.jobs) {
                setGoogleJobs(prev => [...prev, ...result.jobs]);
                setPageToken(result.nextPageToken);
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

        // Filter local partner jobs
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

        // Force a fresh search by clearing google jobs and re-fetching
        setIsSearching(true);
        setGoogleJobs([]);
        setPageToken(undefined);

        try {
            // Force a fresh search by bypassing cache
            const result = await searchGoogleJobs(term, loc, jobCount, undefined, true);
            if (result.jobs) {
                setGoogleJobs(result.jobs);
                setPageToken(result.nextPageToken);
            }
        } catch (error) {
            console.error("Refresh Search Failed", error);
        } finally {
            setIsSearching(false);
        }
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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight hidden md:block">
                                Job Market
                            </h1>

                            {/* Search Bar - Replicates Design: What | Where | Find Jobs */}
                            <form onSubmit={handleSearch} className="flex-1 w-full md:max-w-4xl">
                                <div className="flex flex-col md:flex-row gap-3">
                                    <div className="flex-1 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden flex items-center shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                                        <div className="pl-4 text-gray-500">
                                            <Search size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-400 px-3 pt-1.5">What</div>
                                            <input
                                                type="text"
                                                placeholder="Job title, keywords, or company"
                                                className="w-full px-3 pb-1.5 text-sm bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
                                                value={searchQuery.term}
                                                onChange={e => setSearchQuery({ ...searchQuery, term: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden flex items-center shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                                        <div className="pl-4 text-gray-500">
                                            <MapPin size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-400 px-3 pt-1.5">Where</div>
                                            <input
                                                type="text"
                                                placeholder="City, state, or zip code"
                                                className="w-full px-3 pb-1.5 text-sm bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
                                                value={searchQuery.location}
                                                onChange={e => setSearchQuery({ ...searchQuery, location: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden items-center shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow px-3">
                                        <div className="text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-400 mr-2">Results</div>
                                        <select
                                            value={jobCount}
                                            onChange={(e) => setJobCount(Number(e.target.value))}
                                            className="bg-transparent border-none text-sm font-medium text-gray-900 dark:text-white focus:ring-0 py-2"
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={15}>15</option>
                                            <option value={20}>20</option>
                                        </select>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSearching}
                                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all active:scale-95 whitespace-nowrap flex items-center gap-2"
                                    >
                                        {isSearching ? <Loader2 size={18} className="animate-spin" /> : 'Find Jobs'}
                                    </button>
                                </div>
                            </form>

                            <div className="flex gap-2 hidden md:flex">
                                <button
                                    onClick={handleRefresh}
                                    disabled={isSearching}
                                    className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Refresh Search"
                                >
                                    <RefreshCw className={`w-6 h-6 ${isSearching ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Dashboard"
                                >
                                    <LayoutDashboard className="w-6 h-6" />
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
                        {/* Section 1: New Search Results (Google Jobs) - Show First */}
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                <p className="text-gray-500">Searching across the web...</p>
                            </div>
                        ) : googleJobs.length > 0 ? (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Search size={20} className="text-indigo-600" /> New Search Results
                                </h2>
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

                        {/* Section 2: Saved Job History */}
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

                        {/* Section 3: Partner Jobs */}
                        {jobs.length > 0 && (
                            <div className="space-y-4">
                                {(googleJobs.length > 0 || hasPerformedSearch || savedJobs.length > 0) && (
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 pt-8">
                                        <Briefcase size={20} className="text-indigo-600" /> Featured Opportunities
                                    </h2>
                                )}
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
                        {hasPerformedSearch && jobs.length === 0 && googleJobs.length === 0 && (
                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No jobs found</h3>
                                <p className="mt-2 text-gray-500 dark:text-gray-400">
                                    Try adjusting your search criteria.
                                </p>
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

                            {selectedJob.source === 'google' && selectedJob.applyUrl ? (
                                <a
                                    href={selectedJob.applyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors flex items-center gap-2"
                                >
                                    Apply Externally <ExternalLink size={16} />
                                </a>
                            ) : (
                                <button
                                    onClick={(e) => handleApplyClick(selectedJob, e)}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors flex items-center gap-2"
                                >
                                    {userApplications.has(selectedJob.id) ? 'Reapply' : 'Apply Now'}
                                </button>
                            )}
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
