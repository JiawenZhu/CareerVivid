import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { MapPin, Briefcase, Clock, FileText, ArrowLeft, ExternalLink } from 'lucide-react';
import { CompanyProfile, JobPosting } from '../types';

const PublicJobBoardPage: React.FC = () => {
    const [company, setCompany] = useState<CompanyProfile | null>(null);
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Extract slug from URL manually if router doesn't pass it automatically
    // The App.tsx route will be: /jobs/some-slug
    const pathParts = window.location.pathname.split('/');
    const slug = pathParts[pathParts.length - 1] === '' ? pathParts[pathParts.length - 2] : pathParts[pathParts.length - 1];

    useEffect(() => {
        const fetchCompanyAndJobs = async () => {
            if (!slug) {
                setError('Company not specified.');
                setLoading(false);
                return;
            }

            try {
                // 1. Fetch Company Profile using slug
                const q = query(
                    collection(db, 'companyProfiles'),
                    where('slug', '==', slug),
                    limit(1)
                );
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    setError('Company profile not found.');
                    setLoading(false);
                    return;
                }

                const companyData = querySnapshot.docs[0].data() as CompanyProfile;
                setCompany(companyData);

                // 2. Fetch Jobs using the Cloud Function we just deployed
                // Note: We use the Cloud Function to align with the embed widget's CORS approach and logic
                const response = await fetch(
                    `https://us-west1-jastalk-firebase.cloudfunctions.net/getCompanyJobs?company=${slug}`
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to load jobs');
                }

                const jobsData = await response.json();
                setJobs(jobsData);
            } catch (err) {
                console.error("Error fetching job board data:", err);
                setError(err instanceof Error ? err.message : 'An error occurred loading the job board.');
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyAndJobs();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading opportunities...</p>
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Found</h1>
                    <p className="text-gray-600 mb-6">{error || 'This job board does not exist or has been removed.'}</p>
                    <a href="/" className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700">
                        <ArrowLeft size={16} />
                        Return Home
                    </a>
                </div>
            </div>
        );
    }

    // Apply branding from company profile
    const themeStyle = company.theme || 'minimalist';
    const primaryColor = company.primaryColor || '#4f46e5';
    const fontClass = company.fontFamily === 'inter' ? 'font-sans' :
        company.fontFamily === 'roboto' ? 'font-serif' :
            company.fontFamily === 'outfit' ? 'font-mono' : 'font-sans';

    // Theme adaptations
    const isExecutive = themeStyle === 'executive';
    const bgClass = isExecutive ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900';
    const cardClass = isExecutive ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
    const headingClass = isExecutive ? 'text-white' : 'text-gray-900';
    const textDescClass = isExecutive ? 'text-slate-300' : 'text-gray-600';
    const textMetaClass = isExecutive ? 'text-slate-400' : 'text-gray-500';

    return (
        <div className={`min-h-screen pb-20 ${bgClass} ${fontClass}`}>
            <Helmet>
                <title>{company.companyName} Careers - Open Positions</title>
                <meta name="description" content={`View and apply to open positions at ${company.companyName}. ${company.tagline || ''}`} />
            </Helmet>

            {/* Header / Hero Section */}
            <div
                className={`w-full py-16 px-4 sm:px-6 lg:px-8 border-b ${isExecutive ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}
                style={{
                    borderTop: `4px solid ${primaryColor}`
                }}
            >
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-6">
                    {company.logo ? (
                        <img
                            src={company.logo}
                            alt={`${company.companyName} logo`}
                            className={`w-24 h-24 lg:w-32 lg:h-32 object-contain rounded-xl p-2 ${isExecutive ? 'bg-white' : 'bg-white border shadow-sm'}`}
                        />
                    ) : (
                        <div
                            className="w-24 h-24 lg:w-32 lg:h-32 rounded-xl flex items-center justify-center text-3xl font-bold shadow-sm"
                            style={{ backgroundColor: primaryColor, color: '#ffffff' }}
                        >
                            {company.companyName.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <div className="text-center md:text-left flex-1">
                        <h1 className={`text-3xl lg:text-5xl font-extrabold tracking-tight ${headingClass}`}>
                            {company.companyName}
                        </h1>
                        {company.tagline && (
                            <p className={`mt-3 text-lg lg:text-xl max-w-2xl ${textDescClass}`}>
                                {company.tagline}
                            </p>
                        )}
                        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                            <Briefcase size={16} />
                            {jobs.length} Open Position{jobs.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            </div>

            {/* Job Listings Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                {jobs.length === 0 ? (
                    <div className={`text-center py-16 px-6 rounded-2xl border border-dashed ${isExecutive ? 'border-slate-700 bg-slate-800/50' : 'border-gray-300 bg-white/50'}`}>
                        <Briefcase className={`w-12 h-12 mx-auto mb-4 ${textMetaClass} opacity-50`} />
                        <h3 className={`text-xl font-semibold mb-2 ${headingClass}`}>No Openings Right Now</h3>
                        <p className={textDescClass}>Check back later or visit their main website for updates.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className={`text-2xl font-bold tracking-tight ${headingClass}`}>
                                Current Openings
                            </h2>
                        </div>

                        <div className="grid gap-6">
                            {jobs.map((job) => (
                                <div
                                    key={job.id}
                                    className={`group overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-lg ${cardClass}`}
                                >
                                    <div className="p-6 sm:p-8">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className={`text-xl font-bold ${headingClass} mb-2 group-hover:underline decoration-2 underline-offset-4`} style={{ textDecorationColor: primaryColor }}>
                                                    {job.jobTitle}
                                                </h3>

                                                <div className={`flex flex-wrap items-center gap-y-2 gap-x-4 text-sm font-medium mb-4 ${textMetaClass}`}>
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin size={16} />
                                                        {job.location}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={16} />
                                                        {job.employmentType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </div>
                                                    {(company.showSalary !== false) && (job.salaryMin || job.salaryMax) && (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-green-600 dark:text-green-400">
                                                                {job.salaryMin ? `${job.salaryMin.toLocaleString()}` : ''}
                                                                {job.salaryMin && job.salaryMax ? ' - ' : ''}
                                                                {job.salaryMax ? `${job.salaryMax.toLocaleString()}` : ''}
                                                                {` ${job.salaryCurrency || 'USD'}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <p className={`line-clamp-3 text-base leading-relaxed ${textDescClass} mb-6`}>
                                                    {job.description || "No description provided."}
                                                </p>
                                            </div>

                                            <div className="sm:pl-6 sm:border-l border-gray-100 dark:border-slate-700 flex flex-col justify-center min-w-[140px]">
                                                {/* Button links to external apply URL or internal job details depending on setup */}
                                                <a
                                                    href={job.applyUrl || job.externalUrl || `/jobmarket`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-95 shadow-md"
                                                    style={{ backgroundColor: primaryColor }}
                                                >
                                                    Apply Now
                                                    <ExternalLink size={16} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Badge */}
            <div className="mt-20 text-center pb-8">
                <a href="https://careervivid.app" className={`inline-flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity ${textMetaClass}`}>
                    Powered by
                    <span className="font-bold tracking-tight text-gray-900 dark:text-white">CareerVivid</span>
                </a>
            </div>
        </div>
    );
};

export default PublicJobBoardPage;
