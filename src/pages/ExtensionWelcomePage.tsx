import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import {
    ArrowRight,
    Briefcase,
    Building2,
    Check,
    ClipboardCheck,
    ExternalLink,
    FileText,
    LayoutDashboard,
    Loader2,
    MapPin,
    PanelRightOpen,
    PenLine,
    Pin,
    Sparkles,
    Settings,
    Plus,
    Chrome,
    MessageSquare,
    ChevronRight,
    User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useResumes } from '../hooks/useResumes';
import { useJobTracker } from '../hooks/useJobTracker';
import { getUserJobHistory } from '../services/jobHistoryService';
import { JobApplicationData, JobPosting } from '../types';
import { navigate } from '../utils/navigation';

type WelcomeJob = {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    sourceUrl: string;
    sourceLabel: 'tracker' | 'saved';
};

type WelcomeFallbacks = {
    savedRole: string;
    companyNotSpecified: string;
    locationNotSpecified: string;
};

const confettiPieces = [
    ['7%', '4%', '#ff5a3d', 'square', '0s', '5.8s'],
    ['16%', '11%', '#7c5cff', 'circle', '.3s', '6.2s'],
    ['28%', '2%', '#33c7a6', 'outline', '.8s', '5.5s'],
    ['40%', '9%', '#2f80ed', 'circle', '.1s', '6.8s'],
    ['55%', '3%', '#ffb020', 'triangle', '.5s', '6.1s'],
    ['67%', '12%', '#ff7ab6', 'dash', '.2s', '5.9s'],
    ['76%', '5%', '#33c7a6', 'square', '.7s', '6.6s'],
    ['88%', '14%', '#7c5cff', 'dash', '.4s', '5.6s'],
    ['12%', '25%', '#33c7a6', 'triangle', '.6s', '6.4s'],
    ['31%', '30%', '#2f80ed', 'outline', '.9s', '5.7s'],
    ['48%', '22%', '#ff5a3d', 'circle', '.2s', '6.3s'],
    ['70%', '27%', '#ffb020', 'triangle', '.5s', '5.8s'],
] as const;

const cleanText = (value: string | undefined, fallback: string) => {
    const trimmed = value?.trim();
    return trimmed || fallback;
};

const CHROME_WEB_STORE_URL = 'https://chromewebstore.google.com/detail/careervivid-auto-apply-ai/dmigeakdfokehlhigkhadglgoabceoag';

const normalizeTrackerJob = (job: JobApplicationData, fallbacks: WelcomeFallbacks): WelcomeJob => ({
    id: job.id,
    title: cleanText(job.jobTitle, fallbacks.savedRole),
    company: cleanText(job.companyName, fallbacks.companyNotSpecified),
    location: cleanText(job.location, fallbacks.locationNotSpecified),
    description: cleanText(job.jobDescription || job.prep_RoleOverview, ''),
    sourceUrl: cleanText(job.jobPostURL || job.applicationURL, ''),
    sourceLabel: 'tracker',
});

const normalizeSavedJob = (job: JobPosting, fallbacks: WelcomeFallbacks): WelcomeJob => ({
    id: job.id,
    title: cleanText(job.jobTitle, fallbacks.savedRole),
    company: cleanText(job.companyName, fallbacks.companyNotSpecified),
    location: cleanText(job.location, fallbacks.locationNotSpecified),
    description: cleanText(job.description, ''),
    sourceUrl: cleanText(job.externalUrl || job.applyUrl || (job as JobPosting & { url?: string }).url, ''),
    sourceLabel: 'saved',
});

const PacketActionCard = ({
    icon,
    title,
    description,
    label,
    onClick,
    disabled = false,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="group w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:border-slate-200 disabled:hover:shadow-sm"
    >
        <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-extrabold text-slate-950 dark:text-slate-50">{title}</h3>
                    <ArrowRight size={16} className="shrink-0 text-slate-300 transition group-hover:text-indigo-600" />
                </div>
                <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">{description}</p>
                <div className="mt-4 truncate rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                    {label}
                </div>
            </div>
        </div>
    </button>
);

const WelcomeAnimation = ({ firstName, welcomeLabel }: { firstName: string; welcomeLabel: string }) => (
    <div className="relative min-h-[360px] overflow-hidden px-6 py-12">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {confettiPieces.map(([left, top, color, shape, delay, duration], index) => (
                <span
                    key={`${left}-${top}-${index}`}
                    className={`cv-welcome-confetti-piece cv-welcome-confetti-${shape}`}
                    style={{
                        left,
                        top,
                        backgroundColor: shape === 'outline' || shape === 'triangle' ? 'transparent' : color,
                        borderColor: shape === 'triangle' ? undefined : color,
                        color,
                        animationDelay: delay,
                        animationDuration: duration,
                    }}
                />
            ))}
        </div>
        <div className="relative z-10 pt-10 sm:pt-14 select-none">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none drop-shadow-sm">
                {welcomeLabel}
            </span>
            <h1 className="mt-2 text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-none tracking-tighter text-[#8a5a12] dark:text-[#c5a059] transition-colors duration-200">
                {firstName}!
            </h1>
        </div>
    </div>
);

const ExtensionWelcomePage: React.FC = () => {
    const { t } = useTranslation();
    const { currentUser, userProfile } = useAuth();
    const { resumes, isLoading: isLoadingResumes } = useResumes();
    const { jobApplications, isLoading: isLoadingTracker } = useJobTracker();
    const [savedJobs, setSavedJobs] = useState<JobPosting[]>([]);
    const [isLoadingSavedJobs, setIsLoadingSavedJobs] = useState(false);
    const [showPinGuide, setShowPinGuide] = useState(false);

    const firstName = userProfile?.displayName?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || t('extension_welcome.fallback_first_name');
    const primaryResume = resumes[0];
    const hasResume = !isLoadingResumes && resumes.length > 0;
    const jobFallbacks = useMemo<WelcomeFallbacks>(() => ({
        savedRole: t('extension_welcome.fallbacks.saved_role'),
        companyNotSpecified: t('extension_welcome.fallbacks.company_not_specified'),
        locationNotSpecified: t('extension_welcome.fallbacks.location_not_specified'),
    }), [t]);

    useEffect(() => {
        // Trigger a gorgeous welcome confetti explosion on page load
        const duration = 2.5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 28, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        };

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 40 * (timeLeft / duration);

            // Left cannon rain
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#ff5a3d', '#7c5cff', '#33c7a6', '#ffb020', '#ff7ab6']
            });
            // Right cannon rain
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#ff5a3d', '#7c5cff', '#33c7a6', '#ffb020', '#ff7ab6']
            });
        }, 250);

        // Instant powerful initial burst from lower-left and lower-right corners
        confetti({
            particleCount: 75,
            angle: 60,
            spread: 70,
            origin: { x: 0, y: 0.8 },
            colors: ['#ff5a3d', '#7c5cff', '#33c7a6', '#ffb020', '#ff7ab6']
        });
        confetti({
            particleCount: 75,
            angle: 120,
            spread: 70,
            origin: { x: 1, y: 0.8 },
            colors: ['#ff5a3d', '#7c5cff', '#33c7a6', '#ffb020', '#ff7ab6']
        });

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Dynamically load Google Font "Outfit" matching personal website styling
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadSavedJobs = async () => {
            if (!currentUser?.uid) {
                setSavedJobs([]);
                return;
            }

            setIsLoadingSavedJobs(true);
            try {
                const history = await getUserJobHistory(currentUser.uid);
                if (isMounted) setSavedJobs(history);
            } catch (error) {
                if (import.meta.env.DEV) {
                    console.debug('Error loading welcome job history:', error);
                }
                if (isMounted) setSavedJobs([]);
            } finally {
                if (isMounted) setIsLoadingSavedJobs(false);
            }
        };

        loadSavedJobs();
        return () => {
            isMounted = false;
        };
    }, [currentUser?.uid]);

    const featuredJob = useMemo(() => {
        const trackerJob = jobApplications[0];
        if (trackerJob) return normalizeTrackerJob(trackerJob, jobFallbacks);

        const savedJob = savedJobs[0];
        if (savedJob) return normalizeSavedJob(savedJob, jobFallbacks);

        return null;
    }, [jobApplications, jobFallbacks, savedJobs]);

    const isLoadingJobs = isLoadingTracker || isLoadingSavedJobs;
    const packetLabel = featuredJob ? `${featuredJob.company} - ${featuredJob.title}` : t('extension_welcome.packet.save_job_label');

    const storeTailorTransit = () => {
        if (!featuredJob) return;
        sessionStorage.setItem('transit_resume_tailor', JSON.stringify({ scrapeId: '', fallbackDescription: '' }));
        sessionStorage.setItem('transit_resume_tailor_data', JSON.stringify({ description: featuredJob.description }));
        sessionStorage.setItem('jobTitleForOptimization', featuredJob.title);
        sessionStorage.setItem('jobCompanyForOptimization', featuredJob.company);
    };

    const openTailoredResume = () => {
        if (!featuredJob || !primaryResume) {
            navigate('/newresume?scrollTo=create-section');
            return;
        }

        storeTailorTransit();
        navigate(`/edit/${primaryResume.id}?source=extension_tailor`);
    };

    const openCoverLetter = () => {
        if (!featuredJob || !primaryResume) {
            navigate('/newresume?scrollTo=create-section');
            return;
        }

        sessionStorage.setItem('cv_cover_letter_seed', JSON.stringify({
            jobTitle: featuredJob.title,
            companyName: featuredJob.company,
            jobDescription: featuredJob.description,
        }));
        navigate(`/edit/${primaryResume.id}?coverLetter=1`);
    };

    const openSourceJob = () => {
        if (featuredJob?.sourceUrl) {
            window.open(featuredJob.sourceUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const profileName = userProfile?.displayName || currentUser?.displayName || currentUser?.email || t('extension_welcome.profile.fallback_user');
    const profileInitials = profileName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const setupStatusItems = [
        { label: t('extension_welcome.setup_status.base_resume_connected'), done: hasResume, pending: isLoadingResumes },
        { label: t('extension_welcome.setup_status.saved_job_attached'), done: !!featuredJob, pending: isLoadingJobs },
        { label: t('extension_welcome.setup_status.application_packet_ready'), done: !!featuredJob && hasResume, pending: isLoadingJobs || isLoadingResumes },
    ];

    const pinGuideSteps = [
        {
            step: 1,
            icon: <Chrome size={18} />,
            title: t('extension_welcome.pin_guide.step_extensions_title'),
            desc: t('extension_welcome.pin_guide.step_extensions_desc'),
        },
        {
            step: 2,
            icon: <Pin size={18} />,
            title: t('extension_welcome.pin_guide.step_pin_title'),
            desc: t('extension_welcome.pin_guide.step_pin_desc'),
        },
        {
            step: 3,
            icon: <PanelRightOpen size={18} />,
            title: t('extension_welcome.pin_guide.step_ready_title'),
            desc: t('extension_welcome.pin_guide.step_ready_desc'),
        },
    ];

    const renderSetupStatusIcon = (item: { pending: boolean; done: boolean }) => {
        if (item.pending) return <Loader2 size={10} className="animate-spin" />;
        if (item.done) return <Check size={10} />;
        return <span aria-hidden="true">{t('extension_welcome.setup_status.pending_marker')}</span>;
    };

    return (
        <>
        <Helmet titleTemplate="%s">
            <title>{t('extension_welcome.meta.title')}</title>
            <meta name="description" content={t('extension_welcome.meta.description')} />
            <link rel="canonical" href="https://careervivid.app/extension-welcome" />
            <meta property="og:title" content={t('extension_welcome.meta.title')} />
            <meta property="og:description" content={t('extension_welcome.meta.og_description')} />
            <meta property="og:url" content="https://careervivid.app/extension-welcome" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
        <div className="min-h-screen bg-[#fbfbfe] dark:bg-slate-950 text-slate-950 dark:text-slate-50 transition-colors duration-200" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <div className="grid min-h-screen lg:grid-cols-[280px_1fr] dark:bg-slate-950">
                <aside className="flex flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-6 lg:h-screen lg:sticky lg:top-0 overflow-y-auto transition-colors duration-200">
                    {/* Top Content */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <Logo className="h-9 w-9" />
	                            <div>
	                                <p className="text-sm font-black text-slate-950 dark:text-slate-50">CareerVivid</p>
	                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('extension_welcome.sidebar.subtitle')}</p>
	                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="mt-8 space-y-6">
                            {/* Main options */}
                            <div className="space-y-1 text-sm font-bold text-slate-600 dark:text-slate-400">
	                                <button type="button" className="flex w-full items-center gap-3 rounded-md border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-2.5 text-left text-indigo-800 dark:text-indigo-300 transition">
	                                    <Sparkles size={17} />
	                                    {t('extension_welcome.nav.welcome')}
	                                </button>
	                                <button type="button" onClick={() => navigate('/onboarding')} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition">
	                                    <ClipboardCheck size={17} />
	                                    {t('extension_welcome.nav.quick_start')}
	                                </button>
	                                <button type="button" onClick={() => navigate('/job-market')} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition">
	                                    <Briefcase size={17} />
	                                    {t('extension_welcome.nav.application_hub')}
	                                </button>
	                                <button type="button" onClick={() => navigate('/newresume')} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition">
	                                    <FileText size={17} />
	                                    {t('extension_welcome.nav.resume_builder')}
	                                </button>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-100 dark:border-slate-800" />

                            {/* My Job Trackers */}
                            <div>
	                                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
	                                    <span>{t('extension_welcome.sidebar.my_job_trackers')}</span>
	                                    <button type="button" onClick={() => navigate('/job-tracker')} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition p-0.5 rounded" title={t('extension_welcome.sidebar.manage_trackers')}>
	                                        <Plus size={14} />
	                                    </button>
                                </div>
                                <div className="mt-2 space-y-0.5">
	                                    <button type="button" onClick={() => navigate('/job-tracker')} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition">
	                                        <Briefcase size={16} className="text-slate-400 dark:text-slate-500" />
	                                        <span className="truncate">{t('extension_welcome.sidebar.job_search_2026')}</span>
	                                    </button>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-100 dark:border-slate-800" />

                            {/* Resources & Community */}
	                            <div>
	                                <div className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
	                                    <span>{t('extension_welcome.sidebar.resources_tools')}</span>
	                                </div>
                                <div className="mt-2 space-y-0.5">
	                                    <button type="button" onClick={() => window.open(CHROME_WEB_STORE_URL, '_blank', 'noopener,noreferrer')} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition">
	                                        <Chrome size={16} className="text-slate-400 dark:text-slate-500" />
	                                        <span className="flex-1">{t('extension_welcome.sidebar.chrome_extension')}</span>
	                                        <ExternalLink size={13} className="text-slate-300 dark:text-slate-600" />
	                                    </button>
	                                    <button type="button" disabled className="flex w-full cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-bold text-slate-400 dark:text-slate-500">
	                                        <MessageSquare size={16} className="text-slate-400 dark:text-slate-500" />
	                                        <span className="flex-1">{t('extension_welcome.sidebar.reddit_community')}</span>
	                                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
	                                            {t('extension_welcome.sidebar.soon')}
	                                        </span>
	                                    </button>
	                                    <button type="button" disabled className="flex w-full cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-bold text-slate-400 dark:text-slate-500">
	                                        <MessageSquare size={16} className="text-slate-400 dark:text-slate-500" />
	                                        <span className="flex-1">{t('extension_welcome.sidebar.slack_community')}</span>
	                                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
	                                            {t('extension_welcome.sidebar.soon')}
	                                        </span>
                                    </button>
                                </div>
                            </div>

	                            {/* Setup Status */}
	                            <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
	                                <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">{t('extension_welcome.setup_status.title')}</p>
	                                <div className="mt-3 space-y-2.5">
	                                    {setupStatusItems.map((item) => (
	                                        <div key={item.label} className="flex items-center gap-2.5 px-1">
                                            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                                item.done ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/30' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30'
                                            }`}>
	                                                {renderSetupStatusIcon(item)}
                                            </div>
                                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </nav>
                    </div>

                    {/* Bottom Content */}
                    <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                        {/* Pro Upgrade Box */}
                        <div className="rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/10 p-4 transition duration-200 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-800">
	                            <div className="flex items-center gap-1.5 text-indigo-950 dark:text-indigo-200">
	                                <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400 animate-pulse animate-duration-1000" />
		                                <span className="text-sm font-black tracking-tight">{t('extension_welcome.pro.title')}</span>
	                            </div>
	                            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 leading-normal">
	                                {t('extension_welcome.pro.description')}
	                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/subscription')}
                                className="mt-3 w-full rounded-lg bg-[#fcc83b] hover:bg-[#eab308] text-slate-950 font-extrabold text-xs py-2 shadow-sm transition hover:shadow duration-200 cursor-pointer text-center active:scale-[0.98]"
	                            >
	                                {t('extension_welcome.pro.upgrade_now')}
	                            </button>
                        </div>

                        {/* Profile Row */}
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center min-w-0">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-xs font-black text-white shadow-sm border border-indigo-200 dark:border-indigo-900/50">
                                    {profileInitials}
                                </div>
                                <div className="min-w-0 ml-3">
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 truncate capitalize leading-tight">
                                        {profileName.split('@')[0]}
                                    </p>
	                                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5">
	                                        {userProfile?.plan === 'pro' || userProfile?.plan === 'premium' ? t('extension_welcome.profile.pro_member') : t('extension_welcome.profile.free_plan')}
	                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
	                                onClick={() => navigate('/profile')}
	                                className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition duration-150 p-2 rounded-full cursor-pointer"
	                                title={t('extension_welcome.profile.settings')}
	                            >
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>
                </aside>

                <main className="px-5 py-5 sm:px-8 lg:px-10 dark:bg-slate-950 transition-colors duration-200">
	                    <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
	                        <span>{t('extension_welcome.breadcrumb.home')}</span>
	                        <span className="text-slate-300 dark:text-slate-700">/</span>
	                        <span className="text-indigo-700 dark:text-indigo-400">{t('extension_welcome.nav.welcome')}</span>
	                    </div>

	                    <div className="grid min-h-[calc(100vh-76px)] items-center gap-8 xl:grid-cols-[minmax(320px,0.9fr)_minmax(520px,1.1fr)]">
	                        <section className="self-center">
	                            <WelcomeAnimation firstName={firstName} welcomeLabel={t('extension_welcome.hero.welcome_label')} />
	                            <div className="max-w-md px-6 pb-8 text-slate-600 dark:text-slate-400">
	                                <p className="text-sm leading-6">
	                                    {t('extension_welcome.hero.description')}
	                                </p>
	                                <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
	                                    <li><span className="font-extrabold text-slate-900 dark:text-slate-100">{t('extension_welcome.hero.base_resume_label')}</span> {t('extension_welcome.hero.base_resume_desc')}</li>
	                                    <li><span className="font-extrabold text-slate-900 dark:text-slate-100">{t('extension_welcome.hero.resume_match_label')}</span> {t('extension_welcome.hero.resume_match_desc')}</li>
	                                    <li><span className="font-extrabold text-slate-900 dark:text-slate-100">{t('extension_welcome.hero.job_tracker_label')}</span> {t('extension_welcome.hero.job_tracker_desc')}</li>
	                                    <li><span className="font-extrabold text-slate-900 dark:text-slate-100">{t('extension_welcome.hero.cover_letter_label')}</span> {t('extension_welcome.hero.cover_letter_desc')}</li>
	                                </ul>
	                            </div>
                        </section>

                        <section className="w-full max-w-2xl">
                            {showPinGuide ? (
                                <>
	                                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 shadow-sm">
	                                        <Check size={14} />
	                                        {t('extension_welcome.pin_guide.extension_connected')}
	                                    </div>

	                                    <p className="mt-8 text-base font-bold text-indigo-700 dark:text-indigo-400">{t('extension_welcome.pin_guide.kicker')}</p>
	                                    <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl">
	                                        {t('extension_welcome.pin_guide.title')}
	                                    </h2>
	                                    <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
	                                        {t('extension_welcome.pin_guide.description')}
	                                    </p>

	                                    <div className="mt-7 space-y-4">
	                                        {pinGuideSteps.map(({ step, icon, title, desc }) => (
                                            <div key={step} className="flex items-start gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-black">
                                                    {step}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-indigo-500 dark:text-indigo-400">{icon}</span>
                                                        <h3 className="text-sm font-extrabold text-slate-950 dark:text-slate-50">{title}</h3>
                                                    </div>
                                                    <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">{desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

	                                    <div className="mt-5 rounded-lg border border-indigo-200 dark:border-indigo-900/30 bg-indigo-50 dark:bg-indigo-950/20 px-4 py-3 text-sm text-indigo-900 dark:text-indigo-200">
	                                        <span className="font-black">{t('extension_welcome.common.pro_tip')}</span>
	                                        <span className="ml-2">{t('extension_welcome.pin_guide.pro_tip')}</span>
	                                    </div>

                                    <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowPinGuide(false)}
                                            className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
	                                        >
	                                            {t('extension_welcome.actions.back')}
	                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/dashboard')}
                                            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
	                                        >
	                                            {t('extension_welcome.actions.go_to_dashboard')}
	                                            <ArrowRight size={16} />
	                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
	                                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 dark:border-indigo-900/30 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300 shadow-sm">
	                                        <PanelRightOpen size={14} />
	                                        {t('extension_welcome.packet.chrome_extension_connected')}
	                                    </div>

                                    {isLoadingJobs ? (
	                                        <div className="mt-8 flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-sm font-bold text-slate-600 dark:text-slate-400 shadow-sm">
	                                            <Loader2 size={18} className="animate-spin text-indigo-600 dark:text-indigo-400" />
	                                            {t('extension_welcome.packet.loading_saved_packet')}
	                                        </div>
                                    ) : (
                                        <>
	                                            <p className="mt-8 text-base font-bold text-indigo-700 dark:text-indigo-400">{t('extension_welcome.packet.kicker')}</p>
	                                            <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl">
	                                                {featuredJob ? t('extension_welcome.packet.job_heading', { title: featuredJob.title, company: featuredJob.company }) : t('extension_welcome.packet.next_saved_job')}
	                                            </h2>
	                                            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
	                                                {featuredJob
	                                                    ? t('extension_welcome.packet.with_job_description')
	                                                    : t('extension_welcome.packet.empty_description')}
	                                            </p>

                                            {featuredJob && (
                                                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-slate-700 dark:text-slate-300">
                                                        <Building2 size={13} />
                                                        {featuredJob.company}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-slate-700 dark:text-slate-300">
                                                        <MapPin size={13} />
                                                        {featuredJob.location}
                                                    </span>
	                                                    <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-indigo-700 dark:text-indigo-300">
	                                                        {featuredJob.sourceLabel === 'tracker' ? t('extension_welcome.packet.from_job_tracker') : t('extension_welcome.packet.from_saved_jobs')}
	                                                    </span>
                                                </div>
                                            )}

                                            <div className="mt-7 space-y-4">
	                                                <PacketActionCard
	                                                    icon={<FileText size={18} />}
	                                                    title={t('extension_welcome.packet.tailored_resume_title')}
	                                                    description={hasResume ? t('extension_welcome.packet.tailored_resume_desc_ready') : t('extension_welcome.packet.tailored_resume_desc_missing')}
	                                                    label={hasResume ? packetLabel : t('extension_welcome.packet.base_resume_required')}
	                                                    onClick={openTailoredResume}
	                                                />
	                                                <PacketActionCard
	                                                    icon={<PenLine size={18} />}
	                                                    title={t('extension_welcome.packet.cover_letter_title')}
	                                                    description={hasResume ? t('extension_welcome.packet.cover_letter_desc_ready') : t('extension_welcome.packet.cover_letter_desc_missing')}
	                                                    label={hasResume ? t('extension_welcome.packet.cover_letter_label', { packetLabel }) : t('extension_welcome.packet.base_resume_required')}
	                                                    onClick={openCoverLetter}
	                                                />
                                            </div>

	                                            <div className="mt-5 rounded-lg border border-amber-300 dark:border-amber-900/20 bg-amber-50 dark:bg-amber-950/15 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
	                                                <span className="font-black">{t('extension_welcome.common.pro_tip')}</span>
	                                                <span className="ml-2">{t('extension_welcome.packet.pro_tip')}</span>
	                                            </div>

                                            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/dashboard')}
                                                    className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
	                                                >
	                                                    {t('extension_welcome.actions.back')}
	                                                </button>
                                                <div className="flex flex-wrap gap-3">
                                                    {featuredJob?.sourceUrl && (
                                                        <button
                                                            type="button"
                                                            onClick={openSourceJob}
                                                            className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
	                                                        >
	                                                            {t('extension_welcome.actions.source_job')}
	                                                            <ExternalLink size={15} />
	                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPinGuide(true)}
                                                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
	                                                    >
	                                                        {t('extension_welcome.actions.pin_guide')}
	                                                        <Pin size={15} />
	                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate('/onboarding')}
                                                        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
	                                                    >
	                                                        {t('extension_welcome.actions.start_quick_setup')}
	                                                        <ArrowRight size={16} />
	                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </section>
                    </div>
                </main>
            </div>
        </div>
        </>
    );
};

export default ExtensionWelcomePage;
