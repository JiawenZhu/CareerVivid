import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../App';
import { Plus, Edit2, Trash2, Eye, BarChart3, Briefcase, Users, Calendar, DollarSign, MapPin, Clock, Star, X, Check, FileText, CheckCircle, XCircle, Wand2, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import { JobPosting, JobApplication, ResumeData, JobApplicationStatus, ResumeMatchAnalysis } from '../types';
import { getJobPostingsByHR, deleteJobPosting, publishJobPosting } from '../services/jobService';
import { getApplicationsForJob, updateApplicationStatus, saveMatchAnalysis } from '../services/applicationService';
import { analyzeResumeMatch } from '../services/geminiService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Logo from '../components/Logo';
import { Loader2 } from 'lucide-react';

// Lazy load ResumePreview to avoid bloat
const ResumePreview = React.lazy(() => import('../components/ResumePreview'));
const CandidatePipeline = React.lazy(() => import('../components/hr/CandidatePipeline'));

const BusinessPartnerDashboard: React.FC = () => {
    const { currentUser, userProfile, logOut } = useAuth();
    const referralLink = `https://careervivid.app/signup?ref=${userProfile?.referralCode || 'ERROR_NO_CODE'}`;
    const [activeTab, setActiveTab] = useState<'jobs' | 'pipeline' | 'applicants'>('jobs');
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [applicantNames, setApplicantNames] = useState<Record<string, string>>({});

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

            // Fetch Applicant Names
            const names: Record<string, string> = {};
            const uniqueUserIds = Array.from(new Set(allApps.map(app => app.applicantUserId)));

            await Promise.all(uniqueUserIds.map(async (uid) => {
                try {
                    const userDoc = await getDoc(doc(db, 'users', uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        names[uid] = data.displayName || data.email || 'Unknown User';
                    } else {
                        names[uid] = 'Unknown User';
                    }
                } catch (e) {
                    console.error("Error fetching user", uid, e);
                    names[uid] = 'Error loading user';
                }
            }));
            setApplicantNames(names);

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

    const getStatusBadge = (status: string) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
            published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            closed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            reviewing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            shortlisted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            'to apply': 'bg-gray-100', // fallback
            'interviewing': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
        };

        const key = status.toLowerCase() as keyof typeof colors;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[key] || colors.draft}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <a href="/" className="flex items-center gap-2">
                                <Logo className="h-8 w-8" />
                                <span className="text-xl font-bold text-gray-900 dark:text-white">CareerVivid</span>
                            </a>
                            <span className="text-gray-400">|</span>
                            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Business Partner</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={logOut}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{jobs.length}</p>
                            </div>
                            <Briefcase className="w-10 h-10 text-purple-600" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active Postings</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {jobs.filter(j => j.status === 'published').length}
                                </p>
                            </div>
                            <BarChart3 className="w-10 h-10 text-green-600" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Applications</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{applications.length}</p>
                            </div>
                            <Users className="w-10 h-10 text-blue-600" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Applications/Job</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {jobs.length > 0 ? Math.round(applications.length / jobs.length) : 0}
                                </p>
                            </div>
                            <BarChart3 className="w-10 h-10 text-orange-600" />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="text-red-700 dark:text-red-300 font-medium">Error loading data</div>
                        </div>
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
                        {error.includes('index') && (
                            <p className="text-red-600 dark:text-red-400 text-sm mt-2 font-semibold">
                                Developer Action Required: Check the browser console for the index creation link.
                            </p>
                        )}
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="border-b border-gray-200 dark:border-gray-800">
                        <nav className="flex gap-8 px-6">
                            <button
                                onClick={() => setActiveTab('jobs')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'jobs'
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                Job Management
                            </button>
                            <button
                                onClick={() => setActiveTab('pipeline')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'pipeline'
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                Candidate Pipeline
                            </button>
                            <button
                                onClick={() => setActiveTab('applicants')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'applicants'
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                Applicant List
                            </button>
                        </nav>
                    </div>

                    <div className={activeTab === 'pipeline' ? 'p-2' : 'p-6'}>
                        {activeTab === 'jobs' ? (
                            <div>
                                {/* Create New Job Button */}
                                <div className="mb-6">
                                    <button
                                        onClick={() => navigate('/business-partner/jobs/new')}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        <Plus size={20} />
                                        Create New Job Posting
                                    </button>
                                </div>

                                {/* Jobs Table */}
                                {jobs.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                        <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p>No job postings yet. Create your first job posting to get started!</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="border-b border-gray-200 dark:border-gray-800">
                                                <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                                                    <th className="pb-3 font-medium">Job Title</th>
                                                    <th className="pb-3 font-medium">Status</th>
                                                    <th className="pb-3 font-medium">Applications</th>
                                                    <th className="pb-3 font-medium">Posted Date</th>
                                                    <th className="pb-3 font-medium text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                                {jobs.map((job) => (
                                                    <tr key={job.id} className="text-sm">
                                                        <td className="py-4">
                                                            <div>
                                                                <p className="font-medium text-gray-900 dark:text-white">{job.jobTitle}</p>
                                                                <p className="text-gray-500 dark:text-gray-400 text-xs">{job.companyName}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-4">{getStatusBadge(job.status)}</td>
                                                        <td className="py-4 text-gray-900 dark:text-white">{job.applicationCount}</td>
                                                        <td className="py-4 text-gray-600 dark:text-gray-400">
                                                            {formatDate(job.createdAt)}
                                                        </td>
                                                        <td className="py-4">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {job.status === 'draft' && (
                                                                    <button
                                                                        onClick={() => handlePublishJob(job.id)}
                                                                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                                                        title="Publish"
                                                                    >
                                                                        <Eye size={16} />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => navigate(`/business-partner/jobs/${job.id}/edit`)}
                                                                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteJob(job.id)}
                                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'pipeline' ? (
                            // Candidate Pipeline Tab
                            <div>
                                {applications.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p>No applications yet. Applications will appear in your pipeline once candidates apply.</p>
                                    </div>
                                ) : (
                                    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
                                        <CandidatePipeline
                                            applications={applications}
                                            candidateNames={applicantNames}
                                            onViewResume={handleViewResume}
                                            onUpdateStatus={handleUpdateStatus}
                                            userId={currentUser?.uid || ''}
                                        />
                                    </Suspense>
                                )}
                            </div>
                        ) : (
                            // Applicant List Tab
                            <div>
                                {applications.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p>No applications yet. Applications will appear here once candidates apply to your jobs.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="border-b border-gray-200 dark:border-gray-800">
                                                <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                                                    <th className="pb-3 font-medium">Applicant</th>
                                                    <th className="pb-3 font-medium">Applied To</th>
                                                    <th className="pb-3 font-medium">Date Applied</th>
                                                    <th className="pb-3 font-medium">Status</th>
                                                    <th className="pb-3 font-medium text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                                {applications.map((app) => {
                                                    const job = jobs.find(j => j.id === app.jobPostingId);
                                                    return (
                                                        <tr key={app.id} className="text-sm">
                                                            <td className="py-4">
                                                                <div className="text-gray-900 dark:text-white font-medium">
                                                                    {applicantNames[app.applicantUserId] || 'Loading...'}
                                                                </div>
                                                                <div className="text-gray-500 text-xs truncate max-w-[150px]" title={app.applicantUserId}>
                                                                    {app.applicantUserId}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 text-gray-600 dark:text-gray-400">
                                                                {job?.jobTitle || 'Unknown Job'}
                                                            </td>
                                                            <td className="py-4 text-gray-600 dark:text-gray-400">
                                                                {formatDate(app.appliedAt)}
                                                            </td>
                                                            <td className="py-4">
                                                                {updatingStatusId === app.id ? (
                                                                    <select
                                                                        value={app.status}
                                                                        onChange={(e) => handleUpdateStatus(app.id, e.target.value as JobApplicationStatus)}
                                                                        onBlur={() => setUpdatingStatusId(null)}
                                                                        className="text-xs p-1 border rounded bg-white dark:bg-gray-800"
                                                                        autoFocus
                                                                    >
                                                                        {['submitted', 'reviewing', 'shortlisted', 'interviewing', 'rejected', 'accepted'].map(s => (
                                                                            <option key={s} value={s}>{s}</option>
                                                                        ))}
                                                                    </select>
                                                                ) : (
                                                                    <div onClick={() => setUpdatingStatusId(app.id)} className="cursor-pointer hover:opacity-80">
                                                                        {getStatusBadge(app.status)}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="py-4">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => handleViewResume(app)}
                                                                        className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                                                                    >
                                                                        <FileText size={14} />
                                                                        View Resume
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setUpdatingStatusId(app.id)}
                                                                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                                    >
                                                                        Update Status
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
                        )}
                    </div>
                </div>
            </main>

            {/* Resume Viewer Modal */}
            {selectedResume && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
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
                                        onClick={() => { handleUpdateStatus(viewingApp.id, 'interview'); setSelectedResume(null); }}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                    >
                                        Shortlist for Interview
                                    </button>
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
