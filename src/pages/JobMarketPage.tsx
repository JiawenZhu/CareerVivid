import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getAllPublishedJobs, incrementJobViewCount } from '../services/jobService';
import { useJobTracker } from '../hooks/useJobTracker';
import { useResumes } from '../hooks/useResumes';
import { submitApplication, getApplicationsForUser } from '../services/applicationService';
import { JobPosting, WorkModel } from '../types';
import { navigate } from '../App';
import { Loader2, Briefcase, MapPin, DollarSign, Clock, Building2, PlusCircle, ArrowRight, CheckCircle2, X, FileText, Send, ExternalLink, HelpCircle, LayoutDashboard } from 'lucide-react';

// --- Smart Highlighter Configuration ---
// Comprehensive library of patterns to highlight important job information across all industries
const HIGHLIGHT_PATTERNS = [
    // 1. Salary & Compensation (Green)
    { regex: /\$[\d,]+(k)?(\/yr|\/year|\/mo|\/month|\/hr|\/hour)?(\s?-\s?\$[\d,]+(k)?(\/yr|\/year|\/mo|\/month|\/hr|\/hour)?)?/gi, className: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-1 rounded font-medium" },
    { regex: /\b(\d{2,3}k\s?-\s?\d{2,3}k|competitive salary|negotiable|doe|depending on experience)\b/gi, className: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-1 rounded font-medium" },

    // 2. Benefits & Perks (Blue)
    { regex: /\b(401\(?k\)?|health insurance|medical insurance|life insurance|pto|paid time off|paid vacation|sick leave|parental leave|maternity leave|paternity leave|equity|stock options|rsu|espp|dental|vision|wellness|gym membership|commuter benefits|tuition reimbursement|professional development|learning budget|signing bonus|annual bonus|performance bonus|relocation assistance|retirement|pension|profit sharing|employee discount|free meals|catered lunches|childcare|continuing education)\b/gi, className: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-1 rounded font-medium" },

    // 3. Work Arrangement (Teal)
    { regex: /\b(remote|fully remote|remote-friendly|hybrid|on-site|onsite|in-office|work from anywhere|distributed team|flexible location|telecommute|virtual|field-based)\b/gi, className: "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 px-1 rounded font-medium" },

    // 4. Experience Requirements (Orange)
    { regex: /\b(\d+\+?\s?(years?|yrs?)\s?(of)?\s?(experience|exp)?|\d+\s?-\s?\d+\s?(years?|yrs?)|entry[- ]level|mid[- ]level|senior[- ]level|staff[- ]level|principal|lead|junior|senior|experienced|intern|internship|new grad|associate|manager|director|executive|vp|vice president|c-level|ceo|cfo|cto|coo)\b/gi, className: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-1 rounded font-medium" },

    // 5. Education & Certifications (Purple) - All Industries
    { regex: /\b(bachelor'?s?|master'?s?|phd|doctorate|mba|bs|ba|ms|ma|md|jd|dds|dmd|pharmd|dnp|msn|bsn|degree|diploma|certification|certified|license|licensed|board certified|cpa|cfa|cfp|pmp|shrm|aws certified|google certified|microsoft certified|scrum master|six sigma|osha|hipaa compliant|acls|bls|cpr certified|emt|paramedic|lpn|rn|np|pa-c|lcsw|lpc|lmft)\b/gi, className: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-1 rounded font-medium" },

    // 6. Technical Skills - Programming & Software (Rose)
    { regex: /\b(javascript|typescript|python|java|c\+\+|c#|ruby|go|golang|rust|swift|kotlin|scala|php|perl|sql|nosql|html|css|sass|excel|word|powerpoint|outlook|quickbooks|sap|oracle|epic|cerner|meditech|autocad|solidworks|revit|photoshop|illustrator|indesign|premiere|final cut|logic pro|pro tools|ableton)\b/gi, className: "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 px-1 rounded font-medium" },

    // 7. Technical Skills - Frameworks, Tools & Platforms & Tech Concepts (Cyan)
    { regex: /\b(react|angular|vue|node\.?js|express|django|flask|spring|\.net|rails|laravel|next\.?js|docker|kubernetes|aws|azure|gcp|terraform|jenkins|git|github|gitlab|jira|confluence|figma|tableau|power bi|salesforce|hubspot|mongodb|postgresql|mysql|redis|elasticsearch|graphql|rest api|microservices|ci\/cd|agile|scrum|kanban|lean|waterfall|seo|google analytics|mailchimp|hootsuite|buffer|slack|teams|zoom|asana|trello|monday\.com|notion|ai|artificial intelligence|ml|machine learning|deep learning|nlp|natural language processing|llm|large language model|generative ai|genai|computer vision|robotics|blockchain|iot|internet of things|cloud computing|big data|data science|saas|paas|iaas|algorithm|data structure|scalability|security|encryption|cybersecurity)\b/gi, className: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 px-1 rounded font-medium" },

    // 8. Soft Skills & Professional Qualities (Amber)
    { regex: /\b(communication skills|leadership|team player|problem[- ]solving|critical thinking|collaboration|cross[- ]functional|stakeholder management|project management|time management|self[- ]starter|detail[- ]oriented|analytical|creative|innovative|innovation|adaptable|fast[- ]paced|entrepreneurial|customer service|client facing|patient care|bedside manner|interpersonal|negotiation|presentation skills|public speaking|conflict resolution|emotional intelligence|multitasking|organizational skills|bilingual|multilingual|fluent in)\b/gi, className: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-1 rounded font-medium" },

    // 9. Urgency & Hiring Keywords (Red)
    { regex: /\b(hiring immediately|urgent|asap|start immediately|immediate start|now hiring|actively hiring|fast[- ]track|priority hire|multiple openings|growing team|expanding|new position)\b/gi, className: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-1 rounded font-medium" },

    // 10. Company Culture & Values (Indigo)
    { regex: /\b(diversity|inclusion|dei|equal opportunity|inclusive|work[- ]life balance|culture|values-driven|mission-driven|growth mindset|transparent|collaborative environment|supportive team|mentorship|career growth|promotion opportunities|family-owned|startup|fortune 500|non-profit|sustainability|green|eco-friendly)\b/gi, className: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-1 rounded font-medium" },

    // 11. Healthcare-Specific Keywords (Emerald)
    { regex: /\b(patient care|clinical|icu|er|emergency room|operating room|surgery|outpatient|inpatient|acute care|long-term care|hospice|home health|telemedicine|telehealth|ehr|emr|electronic health records|hipaa|jcaho|cms|medicaid|medicare|insurance verification|prior authorization|medical billing|medical coding|icd-10|cpt|phlebotomy|vitals|medication administration|wound care|iv therapy|dialysis|oncology|pediatrics|geriatrics|obstetrics|cardiology|neurology|orthopedics|radiology|laboratory)\b/gi, className: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-1 rounded font-medium" },

    // 12. Finance & Business Keywords (Lime)
    { regex: /\b(financial analysis|budgeting|forecasting|gaap|ifrs|audit|tax|compliance|risk management|portfolio management|asset management|investment|trading|underwriting|due diligence|m&a|mergers and acquisitions|ipo|venture capital|private equity|hedge fund|mutual fund|securities|derivatives|fixed income|equities|commodities|forex|bloomberg|reuters|finra|sec|regulatory|anti-money laundering|aml|kyc|know your customer|sox|sarbanes-oxley)\b/gi, className: "bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-300 px-1 rounded font-medium" },

    // 13. Creative & Marketing Keywords (Fuchsia)
    { regex: /\b(brand|branding|creative direction|art direction|copywriting|content creation|content marketing|social media marketing|digital marketing|email marketing|marketing automation|lead generation|conversion|roi|kpi|analytics|a\/b testing|ux|ui|user experience|user interface|wireframe|prototype|design system|typography|color theory|photography|videography|video editing|motion graphics|animation|storyboard|campaign|advertising|media buying|pr|public relations|influencer|brand ambassador)\b/gi, className: "bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-800 dark:text-fuchsia-300 px-1 rounded font-medium" },

    // 14. Education Keywords (Sky)
    { regex: /\b(curriculum|lesson plan|classroom management|student engagement|differentiated instruction|iep|individualized education|special education|sped|esl|english as a second language|k-12|higher education|online learning|e-learning|lms|learning management|blackboard|canvas|moodle|tutoring|teaching assistant|ta|research assistant|ra|tenure|tenure-track|adjunct|professor|lecturer|department chair|academic advisor|student affairs|admissions|registrar|accreditation)\b/gi, className: "bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 px-1 rounded font-medium" },

    // 15. Trades & Services Keywords (Stone)
    { regex: /\b(journeyman|apprentice|master|licensed electrician|licensed plumber|hvac|refrigeration|carpentry|woodworking|welding|machining|cnc|blueprint|schematic|electrical code|nec|building code|osha|safety|ppe|hand tools|power tools|installation|maintenance|repair|troubleshooting|preventive maintenance|commercial|residential|industrial|construction|renovation|remodel|blueprint reading|estimating|bid|permit|inspection|foreman|superintendent|site manager|crew lead)\b/gi, className: "bg-stone-200 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 px-1 rounded font-medium" },

    // 16. Emails (Clickable)
    { regex: /\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/gi, className: "text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer", type: 'email' },

    // 17. URLs (Clickable links)
    { regex: /(https?:\/\/[^\s]+)/gi, className: "text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5", type: 'link' }
];

// Legend Data for the modal
const HIGHLIGHT_LEGEND = [
    { color: 'bg-green-100 dark:bg-green-900/30', label: 'Salary & Compensation', examples: '$120k, $80k-100k/yr, Competitive Salary' },
    { color: 'bg-blue-100 dark:bg-blue-900/30', label: 'Benefits & Perks', examples: '401k, Health Insurance, Stock Options, PTO, Signing Bonus' },
    { color: 'bg-teal-100 dark:bg-teal-900/30', label: 'Work Arrangement', examples: 'Remote, Hybrid, On-site, Work from Anywhere' },
    { color: 'bg-orange-100 dark:bg-orange-900/30', label: 'Experience Level', examples: '5+ years, Senior, Entry-level, Manager, Director' },
    { color: 'bg-purple-100 dark:bg-purple-900/30', label: 'Education & Certifications', examples: "Bachelor's, MBA, PhD, CPA, PMP, RN, Licensed" },
    { color: 'bg-rose-100 dark:bg-rose-900/30', label: 'Programming & Software', examples: 'Python, JavaScript, Excel, AutoCAD, Photoshop' },
    { color: 'bg-cyan-100 dark:bg-cyan-900/30', label: 'Frameworks, Tools & AI', examples: 'React, AWS, AI, Machine Learning, Jira' },
    { color: 'bg-amber-100 dark:bg-amber-900/30', label: 'Soft Skills', examples: 'Leadership, Problem-solving, Communication, Bilingual' },
    { color: 'bg-red-100 dark:bg-red-900/30', label: 'Urgency Keywords', examples: 'Hiring Immediately, ASAP, Now Hiring' },
    { color: 'bg-indigo-100 dark:bg-indigo-900/30', label: 'Company Culture', examples: 'Diversity, Work-life Balance, Mentorship, Growth' },
    { color: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Healthcare Industry', examples: 'Patient Care, ICU, HIPAA, EHR, Nursing' },
    { color: 'bg-lime-100 dark:bg-lime-900/30', label: 'Finance Industry', examples: 'GAAP, Audit, Compliance, Risk, Investment' },
    { color: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', label: 'Creative & Marketing', examples: 'Branding, UX/UI, Content Marketing, SEO' },
    { color: 'bg-sky-100 dark:bg-sky-900/30', label: 'Education Industry', examples: 'Curriculum, IEP, K-12, Tenure, LMS' },
    { color: 'bg-stone-200 dark:bg-stone-800/50', label: 'Trades & Services', examples: 'Journeyman, HVAC, Electrician, OSHA, Blueprint' },
];

// Highlight Legend Modal Component
const HighlightLegendModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Smart Highlight Guide</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Important keywords are automatically highlighted to help you scan faster.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={20} className="text-gray-500" /></button>
                </div>
                <div className="p-6 space-y-4">
                    {HIGHLIGHT_LEGEND.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-4">
                            <div className={`w-6 h-6 rounded flex-shrink-0 mt-0.5 ${item.color}`}></div>
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white">{item.label}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{item.examples}</div>
                            </div>
                        </div>
                    ))}
                    <div className="flex items-start gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="w-6 h-6 flex-shrink-0 mt-0.5 flex items-center justify-center text-indigo-600"><ExternalLink size={16} /></div>
                        <div>
                            <div className="font-semibold text-gray-900 dark:text-white">Links & Emails</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Clickable URLs and email addresses</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SmartDescription: React.FC<{ text: string }> = ({ text }) => {
    // 1. First, split by newlines to handle paragraphs
    const paragraphs = text.split('\n');

    const renderSegment = (segment: string): React.ReactNode => {
        // This is a simplified single-pass highlighter. 
        // For production robustness with overlapping matches, a tokenizing parser is better,
        // but for this specific set of non-overlapping regexes, we can chain splits.

        let parts: { text: string, type?: string, className?: string, match?: string }[] = [{ text: segment }];

        HIGHLIGHT_PATTERNS.forEach(pattern => {
            const newParts: typeof parts = [];
            parts.forEach(part => {
                if (part.type) {
                    newParts.push(part); // Already processed
                    return;
                }

                const regex = new RegExp(pattern.regex);
                let lastIndex = 0;
                let match;
                const partText = part.text;

                // Reset regex state
                regex.lastIndex = 0;

                while ((match = regex.exec(partText)) !== null) {
                    // unexpected infinite loop protection
                    if (match.index === regex.lastIndex) regex.lastIndex++;

                    // Text before match
                    if (match.index > lastIndex) {
                        newParts.push({ text: partText.substring(lastIndex, match.index) });
                    }

                    // The match
                    newParts.push({
                        text: match[0],
                        type: pattern.type || 'highlight',
                        className: pattern.className,
                        match: match[0]
                    });

                    lastIndex = match.index + match[0].length;
                }

                // Remaining text
                if (lastIndex < partText.length) {
                    newParts.push({ text: partText.substring(lastIndex) });
                }
            });
            parts = newParts;
        });

        return parts.map((part, i) => {
            if (part.type === 'link') {
                return <a key={i} href={part.text} target="_blank" rel="noopener noreferrer" className={part.className} onClick={e => e.stopPropagation()}>{part.text} <ExternalLink size={10} /></a>;
            }
            if (part.type === 'email') {
                return <a key={i} href={`mailto:${part.text}`} className={part.className} onClick={e => e.stopPropagation()}>{part.text}</a>;
            }
            if (part.type === 'highlight') {
                return <span key={i} className={part.className}>{part.text}</span>;
            }
            return <span key={i}>{part.text}</span>;
        });
    };

    return (
        <div className="space-y-4">
            {paragraphs.map((para, idx) => {
                if (!para.trim()) return <div key={idx} className="h-2" />;
                return (
                    <p key={idx} className="leading-relaxed text-gray-600 dark:text-gray-300">
                        {renderSegment(para)}
                    </p>
                );
            })}
        </div>
    );
};

const JobMarketPage: React.FC = () => {
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const { addJobApplication, jobApplications } = useJobTracker();
    const { resumes } = useResumes();

    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [addingToTracker, setAddingToTracker] = useState<string | null>(null);
    const [addedJobs, setAddedJobs] = useState<Set<string>>(new Set());
    const [userApplications, setUserApplications] = useState<Set<string>>(new Set());
    const [showLegend, setShowLegend] = useState(false);

    // Modal States
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
    const [applyingJob, setApplyingJob] = useState<JobPosting | null>(null);
    const [selectedResumeId, setSelectedResumeId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const fetchedJobs = await getAllPublishedJobs();
                setJobs(fetchedJobs);
            } catch (error) {
                console.error("Error fetching jobs:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobs();
    }, []);

    useEffect(() => {
        if (jobApplications.length > 0) {
            const trackerJobIds = new Set<string>();
            jobApplications.forEach(app => {
                // Try to extract ID from jobPostURL
                if (app.jobPostURL && app.jobPostURL.includes('id=')) {
                    const id = app.jobPostURL.split('id=')[1];
                    if (id) trackerJobIds.add(id);
                }
            });
            setAddedJobs(prev => {
                const newSet = new Set(prev);
                trackerJobIds.forEach(id => newSet.add(id));
                return newSet;
            });
        }
    }, [jobApplications]);

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

    const handleAddToTracker = async (job: JobPosting, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!currentUser) {
            navigate('/auth');
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

            await addJobApplication({
                jobTitle: job.jobTitle,
                companyName: job.companyName,
                jobPostingId: job.id, // Link to sync updates
                location: job.location,
                jobPostURL: `${window.location.origin}/job-market?id=${job.id}`,
                jobDescription: job.description,
                applicationStatus: 'To Apply',
                workModel: workModel,
                salaryRange: salaryString,
                prep_RoleOverview: `Generated from job posting: ${job.jobTitle} at ${job.companyName}`,
            });

            incrementJobViewCount(job.id);
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
        if (!currentUser) {
            navigate('/auth');
            return;
        }
        setApplyingJob(job);
        // Pre-select first resume if available
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
            setSelectedJob(null); // Close details modal if open
            if (applyingJob) {
                setUserApplications(prev => new Set(prev).add(applyingJob.id));
            }
        } catch (error) {
            console.error("Error submitting application:", error);
            alert("Failed to submit application. Please try again.");
        } finally {
            setIsSubmitting(false);
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
        const posted = date.toDate ? date.toDate() : new Date(date);
        const diffInSeconds = Math.floor((now.getTime() - posted.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return posted.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                                Professional Job Market
                            </h1>
                            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                                Discover opportunities and track your applications in one click.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="group flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform hover:-translate-y-0.5"
                            >
                                <LayoutDashboard className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                Go to Dashboard
                            </button>
                            <button
                                onClick={() => navigate('/interview-studio')}
                                className="group flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-lg transition-all transform hover:-translate-y-0.5"
                            >
                                <Briefcase className="w-5 h-5" />
                                Go to Interview Studio
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No jobs posted yet</h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Check back soon for new opportunities!
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                onClick={() => setSelectedJob(job)}
                                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                    {job.jobTitle}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1 text-gray-600 dark:text-gray-300 font-medium">
                                                    <Building2 className="w-4 h-4" />
                                                    {job.companyName}
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                                                {job.employmentType || 'Full-time'}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-4 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4" />
                                                <span>{job.location} ({job.locationType})</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <DollarSign className="w-4 h-4" />
                                                <span>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                <span>Posted {getTimeAgo(job.publishedAt || job.createdAt)}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                                                {job.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex md:flex-col gap-3 justify-center min-w-[160px]">
                                        <button
                                            onClick={(e) => handleAddToTracker(job, e)}
                                            disabled={addingToTracker === job.id || addedJobs.has(job.id)}
                                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-medium transition-all ${addedJobs.has(job.id)
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 cursor-default'
                                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {addingToTracker === job.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : addedJobs.has(job.id) ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Added
                                                </>
                                            ) : (
                                                <>
                                                    <PlusCircle className="w-4 h-4" />
                                                    Add to Tracker
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={(e) => handleApplyClick(job, e)}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
                                        >
                                            {userApplications.has(job.id) ? 'Reapply' : 'Apply Now'}
                                        </button>
                                        {userApplications.has(job.id) && (
                                            <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-medium">
                                                <CheckCircle2 size={12} /> Applied
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Job Details Modal */}
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

                            {
                                selectedJob.requirements && selectedJob.requirements.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Requirements</h3>
                                        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                                            {selectedJob.requirements.map((item, idx) => (
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
                                        onClick={() => navigate('/tracker')}
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
                            <button
                                onClick={(e) => handleApplyClick(selectedJob, e)}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
                            >
                                {userApplications.has(selectedJob.id) ? 'Reapply' : 'Apply Now'}
                            </button>
                            {userApplications.has(selectedJob.id) && (
                                <span className="flex items-center gap-1 text-sm text-green-600 font-medium self-center">
                                    <CheckCircle2 size={16} /> Applied
                                </span>
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
                                                onClick={() => navigate('/new')}
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
            <HighlightLegendModal isOpen={showLegend} onClose={() => setShowLegend(false)} />
        </div >
    );
};

export default JobMarketPage;
