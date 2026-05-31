import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';
import {
    Activity,
    ArrowUpRight,
    BarChart3,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Code2,
    Copy,
    Edit2,
    Eye,
    FileText,
    Link2,
    ListChecks,
    Loader2,
    Mail,
    Plus,
    Search,
    ShieldCheck,
    Target,
    Trash2,
    Users,
    Wand2,
    X,
    XCircle,
} from 'lucide-react';
import { JobPosting, JobApplication, ResumeData, JobApplicationStatus, DEFAULT_PIPELINE_STAGES, CompanyProfile } from '../types';
import { getJobPostingsByHR, deleteJobPosting, publishJobPosting } from '../services/jobService';
import { getApplicationsForJob, updateApplicationStatus, saveMatchAnalysis } from '../services/applicationService';
import { analyzeResumeMatch } from '../services/geminiService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Logo from '../components/Logo';

// Lazy load ResumePreview to avoid bloat
const ResumePreview = React.lazy(() => import('../components/ResumePreview'));
const CandidatePipeline = React.lazy(() => import('../components/hr/CandidatePipeline'));
const EmbedWidgetGenerator = React.lazy(() => import('../components/hr/EmbedWidgetGenerator'));

type DashboardTab = 'pipeline' | 'jobs' | 'applicants' | 'embed';

const BusinessPartnerDashboard: React.FC = () => {
    const { currentUser, userProfile, logOut } = useAuth();
    const referralLink = `https://careervivid.app/signup?ref=${userProfile?.referralCode || 'ERROR_NO_CODE'}`;
    const [activeTab, setActiveTab] = useState<DashboardTab>('pipeline');
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [applicantNames, setApplicantNames] = useState<Record<string, string>>({});
    const [applicantEmails, setApplicantEmails] = useState<Record<string, string>>({});
    const [resumeSearchQuery, setResumeSearchQuery] = useState('');
    const [copiedResumeId, setCopiedResumeId] = useState<string | null>(null);

    // Modals
    const [selectedResume, setSelectedResume] = useState<ResumeData | null>(null);
    const [viewingApp, setViewingApp] = useState<JobApplication | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);

    // Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser) {
            navigate('/signin');
            return;
        }

        const hasBusinessRole = userProfile?.roles?.includes('business_partner') || userProfile?.role === 'business_partner';
        if (!hasBusinessRole) {
            navigate('/');
            return;
        }

        loadData();
    }, [currentUser, userProfile]);

    const loadData = async () => {
        if (!currentUser) return;
        setLoading(true);
        setError(null);
        try {
            const fetchedJobs = await getJobPostingsByHR(currentUser.uid);
            setJobs(fetchedJobs);

            // Load all applications for all jobs
            const allApps: JobApplication[] = [];
            for (const job of fetchedJobs) {
                const jobApps = await getApplicationsForJob(job.id);
                allApps.push(...jobApps);
            }
            // Sort by date desc
            allApps.sort((a, b) => b.appliedAt.toMillis() - a.appliedAt.toMillis());
            setApplications(allApps);

            // Fetch Applicant Names and Emails
            const names: Record<string, string> = {};
            const emails: Record<string, string> = {};
            const uniqueUserIds = Array.from(new Set(allApps.map(app => app.applicantUserId)));

            await Promise.all(uniqueUserIds.map(async (uid) => {
                try {
                    const userDoc = await getDoc(doc(db, 'users', uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        names[uid] = data.displayName || data.email || 'Unknown User';
                        emails[uid] = data.email || '';
                    } else {
                        names[uid] = 'Unknown User';
                        emails[uid] = '';
                    }
                } catch (e) {
                    console.error("Error fetching user", uid, e);
                    names[uid] = 'Error loading user';
                    emails[uid] = '';
                }
            }));
            setApplicantNames(names);
            setApplicantEmails(emails);

            // Load Company Profile
            try {
                const profileSnap = await getDoc(doc(db, 'companyProfiles', currentUser.uid));
                if (profileSnap.exists()) {
                    setCompanyProfile({ id: profileSnap.id, ...profileSnap.data() } as CompanyProfile);
                }
            } catch (e) {
                console.error('Error loading company profile:', e);
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setError(error instanceof Error ? error.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteJob = async (jobId: string) => {
        if (!confirm('Are you sure you want to delete this job posting?')) return;

        try {
            await deleteJobPosting(jobId);
            setJobs(jobs.filter(j => j.id !== jobId));
        } catch (error) {
            console.error('Error deleting job:', error);
            alert('Failed to delete job posting');
        }
    };

    const handlePublishJob = async (jobId: string) => {
        try {
            await publishJobPosting(jobId);
            setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'published' as const } : j));
        } catch (error) {
            console.error('Error publishing job:', error);
            alert('Failed to publish job');
        }
    };

    const handleViewResume = async (app: JobApplication) => {
        if (!app.resumeId) {
            alert("No resume attached to this application.");
            return;
        }

        try {
            const resumeRef = doc(db, 'users', app.applicantUserId, 'resumes', app.resumeId);
            const resumeSnap = await getDoc(resumeRef);

            if (resumeSnap.exists()) {
                setSelectedResume({ id: resumeSnap.id, ...resumeSnap.data() } as ResumeData);
                setViewingApp(app);
            } else {
                alert("Resume not found (it might have been deleted by the user).");
            }
        } catch (error) {
            console.error("Error fetching resume:", error);
            alert("Failed to load resume. Ensure you have permissions.");
        }
    };

    const handleUpdateStatus = async (appId: string, newStatus: JobApplicationStatus) => {
        try {
            await updateApplicationStatus(appId, newStatus, `Status updated to ${newStatus}`);
            setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: newStatus } : a));
            if (viewingApp && viewingApp.id === appId) {
                setViewingApp(prev => prev ? { ...prev, status: newStatus } : null);
            }
            setUpdatingStatusId(null);
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status.");
        }
    };

    const formatResumeForAnalysis = (resume: ResumeData): string => {
        let text = `Title: ${resume.personalDetails.jobTitle}\n\n`;
        text += `Summary: ${resume.professionalSummary}\n\n`;
        text += `Skills: ${resume.skills.map(s => s.name).join(', ')}\n\n`;
        text += 'Experience:\n';
        resume.employmentHistory.forEach(job => {
            text += `- ${job.jobTitle} at ${job.employer}\n${job.description}\n`;
        });
        text += '\nEducation:\n';
        resume.education.forEach(edu => {
            text += `- ${edu.degree} from ${edu.school}\n`;
        });
        return text;
    };

    const handleAnalyzeMatch = async () => {
        if (!currentUser || !selectedResume || !viewingApp) return;

        const job = jobs.find(j => j.id === viewingApp.jobPostingId);
        if (!job || !job.description) {
            setAnalysisError("Job description not found.");
            return;
        }

        setIsAnalyzing(true);
        setAnalysisError(null);

        try {
            const resumeText = formatResumeForAnalysis(selectedResume);
            const result = await analyzeResumeMatch(currentUser.uid, resumeText, job.description);

            // Persist
            // Persist using service
            await saveMatchAnalysis(viewingApp.id, result);

            // Update Local State
            const updatedApp = { ...viewingApp, matchAnalysis: result };
            setViewingApp(updatedApp);
            setApplications(apps => apps.map(a => a.id === updatedApp.id ? updatedApp : a));

        } catch (error) {
            console.error("Analysis Failed:", error);
            setAnalysisError(error instanceof Error ? error.message : "Failed to analyze match.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    // --- Action Handlers for Modal ---
    const handleSendEmail = (app: JobApplication) => {
        const candidateName = applicantNames[app.applicantUserId] || 'Candidate';
        const candidateEmail = applicantEmails[app.applicantUserId];

        if (!candidateEmail) {
            alert('No email found for this candidate');
            return;
        }

        const subject = encodeURIComponent('Interview Invitation');
        const body = encodeURIComponent(
            `Dear ${candidateName},\n\n` +
            `We are pleased to invite you for an interview for the position you applied for.\n\n` +
            `We look forward to speaking with you.\n\n` +
            `Best regards`
        );

        // Standard Gmail web interface
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(candidateEmail)}&su=${subject}&body=${body}`;
        window.open(gmailUrl, '_blank');
    };

    const handleSchedule = (app: JobApplication) => {
        const candidateName = applicantNames[app.applicantUserId] || 'Candidate';
        const candidateEmail = applicantEmails[app.applicantUserId];

        const title = encodeURIComponent(`Interview with ${candidateName}`);
        const details = encodeURIComponent(`Interview for position. Candidate: ${candidateName}`);
        const attendee = candidateEmail ? `&add=${encodeURIComponent(candidateEmail)}` : '';

        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}${attendee}`;
        window.open(calendarUrl, '_blank');
    };

    // Keyboard Navigation for Resume Modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedResume || !viewingApp) return;

            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const currentIndex = applications.findIndex(app => app.id === viewingApp.id);
                if (currentIndex === -1) return;

                let nextIndex = currentIndex;
                if (e.key === 'ArrowLeft') {
                    // Previous
                    nextIndex = Math.max(0, currentIndex - 1);
                } else if (e.key === 'ArrowRight') {
                    // Next
                    nextIndex = Math.min(applications.length - 1, currentIndex + 1);
                }

                if (nextIndex !== currentIndex) {
                    handleViewResume(applications[nextIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedResume, viewingApp, applications]);


    const getStatusBadge = (status: string) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
            published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
            closed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            screening: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
            reviewing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
            shortlisted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
            phone_screen: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
            interview: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
            interviewing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
            final_round: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
            offer: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
            hired: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            withdrawn: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
            accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            'to apply': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        };

        const key = status.toLowerCase() as keyof typeof colors;
        const label = status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[key] || colors.draft}`}>
                {label}
            </span>
        );
    };

    const jobById = useMemo(() => new Map(jobs.map(job => [job.id, job])), [jobs]);

    const stageCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        DEFAULT_PIPELINE_STAGES.forEach(stage => {
            counts[stage.id] = 0;
        });
        applications.forEach(app => {
            const mappedStatus = app.status === 'submitted' ? 'new' : app.status;
            counts[mappedStatus] = (counts[mappedStatus] || 0) + 1;
        });
        return counts;
    }, [applications]);

    const applicationCountByJob = useMemo(() => (
        applications.reduce<Record<string, number>>((counts, app) => {
            counts[app.jobPostingId] = (counts[app.jobPostingId] || 0) + 1;
            return counts;
        }, {})
    ), [applications]);

    const activeJobs = useMemo(() => jobs.filter(job => job.status === 'published'), [jobs]);
    const reviewQueue = useMemo(
        () => applications.filter(app => ['new', 'submitted', 'screening'].includes(app.status)),
        [applications]
    );
    const resumesIndexed = useMemo(
        () => applications.filter(app => Boolean(app.resumeId)).length,
        [applications]
    );
    const averageApplicationsPerJob = jobs.length > 0 ? Math.round(applications.length / jobs.length) : 0;
    const averageMatchScore = useMemo(() => {
        const scored = applications
            .map(app => app.matchAnalysis?.matchPercentage)
            .filter((score): score is number => typeof score === 'number');
        if (scored.length === 0) return null;
        return Math.round(scored.reduce((sum, score) => sum + score, 0) / scored.length);
    }, [applications]);

    const resumeLookupResults = useMemo(() => {
        const query = resumeSearchQuery.trim().toLowerCase();
        if (!query) return applications.slice(0, 3);

        return applications.filter(app => {
            const job = jobById.get(app.jobPostingId);
            const candidateName = applicantNames[app.applicantUserId] || '';
            const candidateEmail = applicantEmails[app.applicantUserId] || '';
            return [
                app.resumeId,
                app.applicantUserId,
                candidateName,
                candidateEmail,
                job?.jobTitle,
                job?.companyName,
            ].some(value => value?.toLowerCase().includes(query));
        });
    }, [applications, applicantEmails, applicantNames, jobById, resumeSearchQuery]);

    const exactResumeMatch = useMemo(() => {
        const query = resumeSearchQuery.trim().toLowerCase();
        if (!query) return null;
        return applications.find(app => app.resumeId?.toLowerCase() === query) || null;
    }, [applications, resumeSearchQuery]);

    const visibleApplicants = resumeSearchQuery.trim() ? resumeLookupResults : applications;

    const handleCopyResumeId = async (resumeId: string) => {
        try {
            await navigator.clipboard.writeText(resumeId);
            setCopiedResumeId(resumeId);
            window.setTimeout(() => setCopiedResumeId(null), 1600);
        } catch (error) {
            console.error('Failed to copy resume ID:', error);
        }
    };

    const tabs: Array<{ id: DashboardTab; label: string; icon: React.ElementType; helper: string }> = [
        { id: 'pipeline', label: 'Pipeline', icon: Activity, helper: 'Move candidates by stage' },
        { id: 'applicants', label: 'Applicants', icon: Users, helper: 'Review every submission' },
        { id: 'jobs', label: 'Jobs', icon: Briefcase, helper: 'Create and publish roles' },
        { id: 'embed', label: 'Embed', icon: Code2, helper: 'Add jobs to your site' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f6f7fb] dark:bg-[#101214] flex items-center justify-center">
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    Loading partner pipeline...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f7fb] text-gray-950 dark:bg-[#101214] dark:text-gray-50">
            <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-[#121417]/90">
                <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="flex shrink-0 items-center gap-2">
                            <Logo className="h-8 w-8" />
                            <span className="text-lg font-black tracking-tight text-gray-950 dark:text-white">CareerVivid</span>
                        </a>
                        <span className="hidden h-5 w-px bg-gray-300 dark:bg-gray-700 sm:block" />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">Business Partner Pipeline</p>
                            <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">Jobs, applicants, and resume API lookup</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/')}
                            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white sm:inline-flex"
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => navigate('/business-partner/jobs/new')}
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">New Job</span>
                        </button>
                        <button
                            onClick={logOut}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
                <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.85fr)]">
                    <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500" />
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-2xl">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-300">
                                    <Activity size={14} />
                                    Live hiring operations
                                </div>
                                <h1 className="text-3xl font-black tracking-tight text-gray-950 dark:text-white sm:text-4xl">
                                    Partner pipeline command center
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                                    Manage roles, move candidates through the pipeline, and find any submitted resume by resume ID from one dashboard.
                                </p>
                            </div>
                            <div className="grid min-w-[260px] grid-cols-2 gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950/40">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Review queue</p>
                                    <p className="mt-1 text-2xl font-black text-gray-950 dark:text-white">{reviewQueue.length}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Avg match</p>
                                    <p className="mt-1 text-2xl font-black text-gray-950 dark:text-white">{averageMatchScore ?? '--'}{averageMatchScore !== null ? '%' : ''}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {DEFAULT_PIPELINE_STAGES.slice(0, 4).map(stage => (
                                <button
                                    key={stage.id}
                                    onClick={() => setActiveTab('pipeline')}
                                    className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-950/50 dark:hover:border-gray-700"
                                >
                                    <span>
                                        <span className="block text-sm font-bold text-gray-900 dark:text-gray-100">{stage.name}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Pipeline stage</span>
                                    </span>
                                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-black text-gray-900 dark:bg-gray-800 dark:text-white">
                                        {stageCounts[stage.id] || 0}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <aside className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    <Search size={20} />
                                </div>
                                <h2 className="text-lg font-black text-gray-950 dark:text-white">Resume API Lookup</h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Search by resume ID, candidate, email, or role.</p>
                            </div>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
                                {resumesIndexed} indexed
                            </span>
                        </div>

                        <div className="mt-5 flex gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-950/50">
                            <Search className="mt-2.5 h-4 w-4 shrink-0 text-gray-400" />
                            <input
                                value={resumeSearchQuery}
                                onChange={(event) => setResumeSearchQuery(event.target.value)}
                                placeholder="Paste a resume ID..."
                                className="min-w-0 flex-1 bg-transparent py-2 text-sm font-medium text-gray-950 outline-none placeholder:text-gray-400 dark:text-white"
                            />
                            <button
                                onClick={() => exactResumeMatch && handleViewResume(exactResumeMatch)}
                                disabled={!exactResumeMatch}
                                className="rounded-xl bg-gray-950 px-3 py-2 text-xs font-bold text-white transition enabled:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-gray-950 dark:enabled:hover:bg-gray-200"
                            >
                                Open
                            </button>
                        </div>

                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
                                <span>{resumeSearchQuery.trim() ? 'Lookup results' : 'Recent resume IDs'}</span>
                                {exactResumeMatch && <span className="text-emerald-600 dark:text-emerald-300">Exact match</span>}
                            </div>
                            {resumeLookupResults.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                    No matching resume found for this partner account.
                                </div>
                            ) : (
                                resumeLookupResults.map(app => {
                                    const job = jobById.get(app.jobPostingId);
                                    const candidateName = applicantNames[app.applicantUserId] || 'Unknown Candidate';
                                    return (
                                        <div key={app.id} className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950/40">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-gray-950 dark:text-white">{candidateName}</p>
                                                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{job?.jobTitle || 'Unknown role'}</p>
                                                </div>
                                                {getStatusBadge(app.status)}
                                            </div>
                                            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-900">
                                                <code className="min-w-0 truncate text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                    {app.resumeId || 'No resume ID'}
                                                </code>
                                                <div className="flex shrink-0 items-center gap-1">
                                                    {app.resumeId && (
                                                        <button
                                                            onClick={() => handleCopyResumeId(app.resumeId)}
                                                            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-white hover:text-gray-950 dark:hover:bg-gray-800 dark:hover:text-white"
                                                            title="Copy resume ID"
                                                        >
                                                            {copiedResumeId === app.resumeId ? <CheckCircle size={14} /> : <Copy size={14} />}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleViewResume(app)}
                                                        className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40"
                                                        title="Open resume"
                                                    >
                                                        <ArrowUpRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </aside>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    {[
                        { label: 'Total jobs', value: jobs.length, detail: `${activeJobs.length} published`, icon: Briefcase, tone: 'bg-[#f2efe9] text-[#725f45] ring-1 ring-[#e5dccf] dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700' },
                        { label: 'Applications', value: applications.length, detail: `${reviewQueue.length} need review`, icon: Users, tone: 'bg-[#edf4ef] text-[#526b59] ring-1 ring-[#d8e7dd] dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700' },
                        { label: 'Resume IDs', value: resumesIndexed, detail: 'Ready for lookup', icon: ShieldCheck, tone: 'bg-[#f1eef6] text-[#61556f] ring-1 ring-[#e0dced] dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700' },
                        { label: 'Avg apps/job', value: averageApplicationsPerJob, detail: 'Across all roles', icon: BarChart3, tone: 'bg-[#f5eee6] text-[#745b3c] ring-1 ring-[#eadfce] dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700' },
                        { label: 'API route', value: 'Plan', detail: '/api/resumes/{id} next', icon: Link2, tone: 'bg-[#f7eeee] text-[#765858] ring-1 ring-[#eadada] dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700' },
                    ].map(stat => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">{stat.label}</p>
                                        <p className="mt-2 text-3xl font-black text-gray-950 dark:text-white">{stat.value}</p>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stat.detail}</p>
                                    </div>
                                    <span className={`rounded-2xl p-3 ${stat.tone}`}>
                                        <Icon size={20} />
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </section>

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/70 dark:bg-red-950/30">
                        <div className="text-sm font-bold text-red-800 dark:text-red-200">Error loading data</div>
                        <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                        {error.includes('index') && (
                            <p className="mt-2 text-sm font-semibold text-red-700 dark:text-red-300">
                                Developer Action Required: Check the browser console for the index creation link.
                            </p>
                        )}
                    </div>
                )}

                <section className="rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="border-b border-gray-200 p-3 dark:border-gray-800">
                        <nav className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${isActive
                                            ? 'border-gray-950 bg-gray-950 text-white shadow-sm dark:border-white dark:bg-white dark:text-gray-950'
                                            : 'border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-300 dark:hover:border-gray-800 dark:hover:bg-gray-950 dark:hover:text-white'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        <span className="min-w-0">
                                            <span className="block text-sm font-black">{tab.label}</span>
                                            <span className={`hidden truncate text-xs lg:block ${isActive ? 'text-white/70 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {tab.helper}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className={activeTab === 'pipeline' ? 'p-4' : 'p-5 sm:p-6'}>
                        {activeTab === 'pipeline' ? (
                            <div>
                                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h2 className="text-xl font-black text-gray-950 dark:text-white">Candidate Pipeline</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Drag candidates, open resumes, and move stages from the command board.</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/business-partner/jobs/new')}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-900 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-800"
                                    >
                                        <Plus size={16} />
                                        Add role
                                    </button>
                                </div>
                                {applications.length === 0 ? (
                                    <div className="grid gap-4 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-950/40 md:grid-cols-[1fr_1.2fr]">
                                        <div>
                                            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                                <ListChecks size={24} />
                                            </div>
                                            <h3 className="text-lg font-black text-gray-950 dark:text-white">No candidates in the pipeline yet</h3>
                                            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                                                Publish a partner job or embed your board so applications can flow into stages automatically.
                                            </p>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            {['Create job', 'Publish listing', 'Review resume IDs'].map((step, index) => (
                                                <div key={step} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                                                    <p className="text-xs font-black uppercase tracking-[0.12em] text-gray-400">Step {index + 1}</p>
                                                    <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
                                        <CandidatePipeline
                                            applications={applications}
                                            candidateNames={applicantNames}
                                            candidateEmails={applicantEmails}
                                            onViewResume={handleViewResume}
                                            onUpdateStatus={handleUpdateStatus}
                                            userId={currentUser?.uid || ''}
                                        />
                                    </Suspense>
                                )}
                            </div>
                        ) : activeTab === 'applicants' ? (
                            <div>
                                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h2 className="text-xl font-black text-gray-950 dark:text-white">Applicant Registry</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Every applicant row includes the submitted resume ID for API lookup.</p>
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
                                        <Target size={14} />
                                        Showing {visibleApplicants.length} of {applications.length}
                                    </div>
                                </div>
                                {applications.length === 0 ? (
                                    <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-950/40 dark:text-gray-400">
                                        <Users className="mx-auto mb-4 h-14 w-14 opacity-50" />
                                        <p>No applications yet. Applications will appear here once candidates apply to your jobs.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
                                        <table className="w-full min-w-[900px]">
                                            <thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-[0.12em] text-gray-500 dark:bg-gray-950/60 dark:text-gray-400">
                                                <tr>
                                                    <th className="px-4 py-3">Applicant</th>
                                                    <th className="px-4 py-3">Resume ID</th>
                                                    <th className="px-4 py-3">Applied To</th>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Status</th>
                                                    <th className="px-4 py-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                                {visibleApplicants.map((app) => {
                                                    const job = jobById.get(app.jobPostingId);
                                                    return (
                                                        <tr key={app.id} className="text-sm">
                                                            <td className="px-4 py-4">
                                                                <div className="font-bold text-gray-950 dark:text-white">
                                                                    {applicantNames[app.applicantUserId] || 'Loading...'}
                                                                </div>
                                                                <div className="max-w-[220px] truncate text-xs text-gray-500 dark:text-gray-400" title={applicantEmails[app.applicantUserId] || app.applicantUserId}>
                                                                    {applicantEmails[app.applicantUserId] || app.applicantUserId}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex max-w-[220px] items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-950">
                                                                    <code className="truncate text-xs font-semibold text-gray-700 dark:text-gray-300">{app.resumeId || 'No resume ID'}</code>
                                                                    {app.resumeId && (
                                                                        <button onClick={() => handleCopyResumeId(app.resumeId)} className="shrink-0 text-gray-400 transition hover:text-gray-950 dark:hover:text-white" title="Copy resume ID">
                                                                            {copiedResumeId === app.resumeId ? <CheckCircle size={14} /> : <Copy size={14} />}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-gray-600 dark:text-gray-300">
                                                                {job?.jobTitle || 'Unknown Job'}
                                                            </td>
                                                            <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                                                                {formatDate(app.appliedAt)}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                {updatingStatusId === app.id ? (
                                                                    <select
                                                                        value={app.status}
                                                                        onChange={(e) => handleUpdateStatus(app.id, e.target.value as JobApplicationStatus)}
                                                                        onBlur={() => setUpdatingStatusId(null)}
                                                                        className="rounded-lg border border-gray-200 bg-white p-2 text-xs dark:border-gray-700 dark:bg-gray-900"
                                                                        autoFocus
                                                                    >
                                                                        {DEFAULT_PIPELINE_STAGES.map(stage => (
                                                                            <option key={stage.id} value={stage.id}>{stage.name}</option>
                                                                        ))}
                                                                    </select>
                                                                ) : (
                                                                    <button onClick={() => setUpdatingStatusId(app.id)} className="transition hover:opacity-80">
                                                                        {getStatusBadge(app.status)}
                                                                    </button>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => handleViewResume(app)}
                                                                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950"
                                                                    >
                                                                        <FileText size={14} />
                                                                        Resume
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setUpdatingStatusId(app.id)}
                                                                        className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                                    >
                                                                        Status
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'jobs' ? (
                            <div>
                                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h2 className="text-xl font-black text-gray-950 dark:text-white">Job Management</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Create roles that feed the partner candidate pipeline.</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/business-partner/jobs/new')}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
                                    >
                                        <Plus size={18} />
                                        Create New Job Posting
                                    </button>
                                </div>
                                {jobs.length === 0 ? (
                                    <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-950/40 dark:text-gray-400">
                                        <Briefcase className="mx-auto mb-4 h-14 w-14 opacity-50" />
                                        <p>No job postings yet. Create your first partner role to start collecting applications.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {jobs.map((job) => (
                                            <article key={job.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-950/40">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-base font-black text-gray-950 dark:text-white">{job.jobTitle}</p>
                                                        <p className="mt-1 flex items-center gap-1 truncate text-sm text-gray-500 dark:text-gray-400">
                                                            <Building2 size={14} />
                                                            {job.companyName}
                                                        </p>
                                                    </div>
                                                    {getStatusBadge(job.status)}
                                                </div>
                                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                                    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
                                                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">Applicants</p>
                                                        <p className="mt-1 text-xl font-black text-gray-950 dark:text-white">{applicationCountByJob[job.id] ?? job.applicationCount ?? 0}</p>
                                                    </div>
                                                    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
                                                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">Created</p>
                                                        <p className="mt-1 text-sm font-bold text-gray-950 dark:text-white">{formatDate(job.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                                                    {job.status === 'draft' ? (
                                                        <button
                                                            onClick={() => handlePublishJob(job.id)}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                        >
                                                            <Eye size={14} />
                                                            Publish
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Live pipeline source</span>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => navigate(`/business-partner/jobs/${job.id}/edit`)}
                                                            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-950 dark:hover:bg-gray-800 dark:hover:text-white"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteJob(job.id)}
                                                            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
                                <EmbedWidgetGenerator
                                    companyProfile={companyProfile}
                                    onSaveProfile={async (updates) => {
                                        if (!currentUser) return;
                                        try {
                                            const profileRef = doc(db, 'companyProfiles', updates.slug || currentUser.uid);

                                            const profileData: any = {
                                                hrUserId: currentUser.uid,
                                                companyName: jobs[0]?.companyName || 'My Company',
                                                slug: updates.slug || jobs[0]?.companyName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'company',
                                            };

                                            if (updates.theme || updates.primaryColor || updates.fontFamily) {
                                                profileData.branding = {
                                                    theme: updates.theme || 'creative',
                                                    primaryColor: updates.primaryColor || '#7c3aed',
                                                    fontFamily: updates.fontFamily || 'system-ui',
                                                };
                                            }

                                            await setDoc(profileRef, profileData, { merge: true });
                                            await loadData();
                                        } catch (error) {
                                            console.error('Error saving profile:', error);
                                            alert('Failed to save company profile. Please try again.');
                                        }
                                    }}
                                />
                            </Suspense>
                        )}
                    </div>
                </section>
            </main>

            {/* Resume Viewer Modal */}
            {selectedResume && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 w-full h-full flex flex-col shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {applicantNames[viewingApp?.applicantUserId || '']}'s Resume
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Applied for: {jobs.find(j => j.id === viewingApp?.jobPostingId)?.jobTitle}
                                </p>
                            </div>
                            <button onClick={() => { setSelectedResume(null); setViewingApp(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Analysis Section (If available or requested) */}
                        <div className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                            {viewingApp?.matchAnalysis ? (
                                <div className="bg-blue-600/10 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-lg">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-grow">
                                            <div className="flex justify-between font-semibold">
                                                <span>{viewingApp.matchAnalysis.matchedKeywords.length} of {viewingApp.matchAnalysis.totalKeywords} keywords found</span>
                                                <span className="text-lg">{Math.round(viewingApp.matchAnalysis.matchPercentage)}% Match</span>
                                            </div>
                                            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5 mt-2">
                                                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${viewingApp.matchAnalysis.matchPercentage}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handleAnalyzeMatch}
                                                disabled={isAnalyzing}
                                                className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                                            >
                                                {isAnalyzing ? 'Refreshing...' : 'Refresh Analysis'}
                                            </button>
                                            <button
                                                onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                                                className="p-1.5 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full transition-colors text-blue-700 dark:text-blue-300"
                                                title={isAnalysisExpanded ? "Collapse analysis" : "Expand analysis"}
                                            >
                                                {isAnalysisExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                    {isAnalysisExpanded && (
                                        <div className="mt-4 text-sm animate-in slide-in-from-top-2 duration-200">
                                            <p className="font-semibold mb-2">{viewingApp.matchAnalysis.summary}</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="font-bold text-green-700 dark:text-green-400 flex items-center gap-1"><CheckCircle size={14} /> Matched Keywords</h4>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {viewingApp.matchAnalysis.matchedKeywords.map(k => <span key={k} className="bg-green-200/50 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs px-2 py-0.5 rounded-md">{k}</span>)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-1"><XCircle size={14} /> Missing Keywords</h4>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {viewingApp.matchAnalysis.missingKeywords.map(k => <span key={k} className="bg-yellow-200/50 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 text-xs px-2 py-0.5 rounded-md">{k}</span>)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex justify-center">
                                    <button
                                        onClick={handleAnalyzeMatch}
                                        disabled={isAnalyzing}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-70 transition-colors shadow-sm"
                                    >
                                        {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                        {isAnalyzing ? "Analyzing Resume..." : "Analyze Match with AI"}
                                    </button>
                                    {analysisError && <p className="text-red-500 text-sm ml-4 self-center">{analysisError}</p>}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-950 p-6 flex justify-center">
                            <div className="bg-white shadow-xl origin-top transform scale-90">
                                <Suspense fallback={<div className="p-10"><Loader2 className="animate-spin" /></div>}>
                                    <ResumePreview resume={selectedResume} template={selectedResume.templateId} />
                                </Suspense>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-end gap-3">
                            {viewingApp && (
                                <>
                                    <button
                                        onClick={() => { handleUpdateStatus(viewingApp.id, 'rejected'); setSelectedResume(null); }}
                                        className="px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50"
                                    >
                                        Reject
                                    </button>

                                    <button
                                        onClick={() => handleSendEmail(viewingApp)}
                                        className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30 transition-colors"
                                        title="Send Email via Gmail"
                                    >
                                        <Mail size={18} />
                                        Send Email
                                    </button>

                                    <button
                                        onClick={() => handleSchedule(viewingApp)}
                                        className="flex items-center gap-2 px-4 py-2 border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-900/30 transition-colors"
                                        title="Schedule Interview"
                                    >
                                        <Calendar size={18} />
                                        Schedule
                                    </button>
                                    {(() => {
                                        // Dynamic Stage Calculation
                                        const currentStatus = viewingApp.status === 'submitted' ? 'new' : viewingApp.status;
                                        const currentIndex = DEFAULT_PIPELINE_STAGES.findIndex(s => s.id === currentStatus);
                                        const nextStage = currentIndex !== -1 && currentIndex < DEFAULT_PIPELINE_STAGES.length - 1
                                            ? DEFAULT_PIPELINE_STAGES[currentIndex + 1]
                                            : null;

                                        // Only show button if there is a next stage that is not "Rejected" (since we have a reject button)
                                        if (nextStage && nextStage.id !== 'rejected') {
                                            return (
                                                <button
                                                    onClick={() => { handleUpdateStatus(viewingApp.id, nextStage.id as JobApplicationStatus); setSelectedResume(null); }}
                                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                                >
                                                    Move to {nextStage.name}
                                                </button>
                                            );
                                        }
                                        return null;
                                    })()}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessPartnerDashboard;
