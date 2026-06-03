import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Plus, Copy, Loader2, Check, FileText, Wand2, Briefcase, Building2, Calendar, ChevronLeft, Trash2, Sparkles, Download, FileType, ExternalLink } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { functions, db, auth } from '@/firebase';
import { ResumeData, CoverLetter } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getGoogleDriveAccessToken } from '@/utils/googleDriveAuth';
import { trackUsage } from '@/services/trackingService';

interface CoverLetterManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    resume: ResumeData;
    theme?: string;
    initialJob?: {
        jobTitle?: string;
        companyName?: string;
        jobDescription?: string;
    } | null;
}

type ViewMode = 'list' | 'create' | 'detail';

const CoverLetterManagerModal: React.FC<CoverLetterManagerModalProps> = ({ isOpen, onClose, resume, theme, initialJob }) => {
    const { currentUser } = useAuth();
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
    const [selectedLetter, setSelectedLetter] = useState<CoverLetter | null>(null);
    const [isLoadingList, setIsLoadingList] = useState(true);

    // Create Form State
    const [jobTitle, setJobTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Detail View State
    const [copied, setCopied] = useState(false);
    const [isExportingDocument, setIsExportingDocument] = useState(false);
    const [exportNotice, setExportNotice] = useState<string | null>(null);
    const [exportError, setExportError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !initialJob) return;

        setJobTitle(initialJob.jobTitle || '');
        setCompanyName(initialJob.companyName || '');
        setJobDescription(initialJob.jobDescription || '');
        setSelectedLetter(null);
        setViewMode('create');
    }, [initialJob, isOpen]);

    // Fetch Cover Letters
    useEffect(() => {
        if (!currentUser || !isOpen) return;

        setIsLoadingList(true);
        const q = query(
            collection(db, 'users', currentUser.uid, 'coverLetters'),
            where('resumeId', '==', resume.id)
            // orderBy('createdAt', 'desc') // Removed to avoid composite index requirement
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const letters = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CoverLetter[];

            // Sort client-side
            letters.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                return dateB - dateA;
            });

            setCoverLetters(letters);
            setIsLoadingList(false);
        }, (err) => {
            console.error("Error fetching cover letters:", err);
            setIsLoadingList(false);
        });

        return () => unsubscribe();
    }, [currentUser, isOpen, resume.id]);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!jobDescription.trim() || !jobTitle.trim() || !companyName.trim()) return;

        setIsGenerating(true);
        setError(null);

        try {
            const generateFn = httpsCallable(functions, 'generateCoverLetter');
            const result = await generateFn({
                resumeId: resume.id,
                jobTitle,
                companyName,
                jobDescription
            });

            const data = result.data as any;
            if (data.success && data.coverLetter) {
                // Success! The database listener will update the list.
                // We can switch to detail view to show the result.
                const newLetter = data.coverLetter;
                setSelectedLetter(newLetter);
                setViewMode('detail');
                // Reset form
                setJobTitle('');
                setCompanyName('');
                setJobDescription('');
            } else {
                throw new Error('Failed to generate cover letter');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;
        if (window.confirm('Are you sure you want to delete this cover letter?')) {
            try {
                await deleteDoc(doc(db, 'users', currentUser.uid, 'coverLetters', id));
                if (selectedLetter?.id === id) {
                    setSelectedLetter(null);
                    setViewMode('list');
                }
            } catch (err) {
                console.error("Error deleting:", err);
            }
        }
    };

    const handleCopy = () => {
        if (!selectedLetter) return;
        navigator.clipboard.writeText(getResolvedCoverLetterContent(selectedLetter));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getSafeFileName = (value: string) => (
        value
            .replace(/[^a-zA-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 80) || 'cover_letter'
    );

    const getCoverLetterTitle = (letter: CoverLetter) => (
        `Cover Letter - ${letter.jobTitle || 'Job Application'}`
    );

    const getCoverLetterSubtitle = (letter: CoverLetter) => (
        [letter.companyName, resume.personalDetails?.firstName && resume.personalDetails?.lastName
            ? `${resume.personalDetails.firstName} ${resume.personalDetails.lastName}`
            : 'CareerVivid'
        ].filter(Boolean).join(' | ')
    );

    const getCurrentCoverLetterDate = () => (
        new Intl.DateTimeFormat('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
        }).format(new Date())
    );

    const getResumeLinkedInUrl = () => {
        const linkedIn = resume.websites?.find((link) => (
            link.label?.toLowerCase().includes('linkedin') ||
            link.platform?.toLowerCase().includes('linkedin') ||
            link.url?.toLowerCase().includes('linkedin')
        ));
        const url = linkedIn?.url?.trim();
        if (!url) return '';
        return /^https?:\/\//i.test(url) ? url : `https://${url}`;
    };

    const getResolvedCoverLetterContent = (letter: CoverLetter) => {
        let content = letter.content || '';
        const linkedInUrl = getResumeLinkedInUrl();

        content = content.replace(/\[Current Date\]/gi, getCurrentCoverLetterDate());

        if (linkedInUrl) {
            content = content.replace(/\[Your LinkedIn Profile URL\]/gi, linkedInUrl);
        } else {
            content = content
                .split('\n')
                .filter((line) => !/\[Your LinkedIn Profile URL\]/i.test(line))
                .join('\n');
        }

        return content.replace(/\n{3,}/g, '\n\n').trim();
    };

    const getGoogleDocExportUrl = (docUrl: string) => {
        const docId = docUrl.match(/\/document\/d\/([^/?#]+)/)?.[1];
        return docId ? `https://docs.google.com/document/d/${docId}/export?format=docx` : '';
    };

    const triggerDownloadUrl = (url: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getCachedGoogleAccessToken = async () => {
        if (!currentUser?.uid) throw new Error('Please sign in before exporting your cover letter.');

        const cacheKey = `cover_letter_gdoc_access_token_${currentUser.uid}`;
        try {
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                const { token, expiresAt } = JSON.parse(cached);
                if (token && expiresAt > Date.now() + 60000) return token;
            }
        } catch (error) {
            console.warn('Failed to read cached Google Drive token:', error);
        }

        const token = await getGoogleDriveAccessToken(currentUser, auth, 'cover-letter-export');
        try {
            sessionStorage.setItem(cacheKey, JSON.stringify({
                token,
                expiresAt: Date.now() + 3500 * 1000,
            }));
        } catch (error) {
            console.warn('Failed to cache Google Drive token:', error);
        }

        return token;
    };

    const handleDownloadPdf = async () => {
        if (!selectedLetter) return;

        setIsExportingDocument(true);
        setExportError(null);
        setExportNotice(null);

        try {
            const { jsPDF } = await import('jspdf');
            const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
            const margin = 54;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const textWidth = pageWidth - margin * 2;
            let y = margin;

            const addPageIfNeeded = (lineHeight: number) => {
                if (y + lineHeight > pageHeight - margin) {
                    pdf.addPage();
                    y = margin;
                }
            };

            pdf.setFont('times', 'bold');
            pdf.setFontSize(15);
            const titleLines = pdf.splitTextToSize(getCoverLetterTitle(selectedLetter), textWidth);
            for (const line of titleLines) {
                addPageIfNeeded(18);
                pdf.text(line, margin, y);
                y += 18;
            }

            pdf.setFont('times', 'normal');
            pdf.setFontSize(10);
            const subtitle = getCoverLetterSubtitle(selectedLetter);
            if (subtitle) {
                const subtitleLines = pdf.splitTextToSize(subtitle, textWidth);
                for (const line of subtitleLines) {
                    addPageIfNeeded(14);
                    pdf.text(line, margin, y);
                    y += 14;
                }
            }

            y += 18;
            pdf.setFontSize(12);
            const paragraphs = getResolvedCoverLetterContent(selectedLetter).split(/\n{2,}/).map(paragraph => paragraph.trim()).filter(Boolean);
            for (const paragraph of paragraphs) {
                const lines = pdf.splitTextToSize(paragraph.replace(/\n/g, ' '), textWidth);
                for (const line of lines) {
                    addPageIfNeeded(15);
                    pdf.text(line, margin, y);
                    y += 15;
                }
                y += 10;
            }

            const fileName = `${getSafeFileName(getCoverLetterTitle(selectedLetter))}.pdf`;
            pdf.save(fileName);
            setExportNotice('Cover letter PDF download started.');
            if (currentUser?.uid) {
                void trackUsage(currentUser.uid, 'cover_letter_export', { format: 'pdf' });
            }
        } catch (error: any) {
            console.error('Cover letter PDF export failed:', error);
            setExportError(error.message || 'Could not export this cover letter as PDF.');
        } finally {
            setIsExportingDocument(false);
        }
    };

    const handleGoogleDocsExport = async (format: 'google-docs' | 'docx') => {
        if (!selectedLetter) return;

        setIsExportingDocument(true);
        setExportError(null);
        setExportNotice(null);

        try {
            const accessToken = await getCachedGoogleAccessToken();
            const exportFn = httpsCallable(functions, 'exportToGoogleDocs');
            const response = await exportFn({
                accessToken,
                documentData: {
                    kind: 'cover-letter',
                    title: getCoverLetterTitle(selectedLetter),
                    subtitle: getCoverLetterSubtitle(selectedLetter),
                    body: getResolvedCoverLetterContent(selectedLetter),
                    folderName: 'CareerVivid Cover Letters',
                    fileName: getCoverLetterTitle(selectedLetter),
                },
            });

            const { docUrl } = response.data as any;
            if (!docUrl) throw new Error('Google Docs export finished without a document link.');

            if (format === 'docx') {
                const docxUrl = getGoogleDocExportUrl(docUrl);
                if (!docxUrl) throw new Error('Could not create the Word document download link.');
                triggerDownloadUrl(docxUrl, `${getSafeFileName(getCoverLetterTitle(selectedLetter))}.docx`);
                setExportNotice('Word document download started.');
            } else {
                window.open(docUrl, '_blank', 'noopener,noreferrer');
                setExportNotice('Cover letter exported to Google Docs.');
            }

            if (currentUser?.uid) {
                void trackUsage(currentUser.uid, 'cover_letter_export', { format });
            }
        } catch (error: any) {
            console.error('Cover letter document export failed:', error);
            if (error?.code === 'auth/popup-closed-by-user') {
                setExportNotice('Export cancelled.');
            } else {
                setExportError(error.message || 'Could not export this cover letter.');
            }
        } finally {
            setIsExportingDocument(false);
        }
    };

    const renderList = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Manage your tailored cover letters for different job applications.
                </p>
                <button
                    onClick={() => setViewMode('create')}
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    New Letter
                </button>
            </div>

            {isLoadingList ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-primary-500" size={32} />
                </div>
            ) : coverLetters.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                    <Wand2 className="mx-auto text-gray-400 mb-3" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No cover letters yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 mb-4">Create your first AI-generated cover letter tailored to a specific job.</p>
                    <button
                        onClick={() => setViewMode('create')}
                        className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                    >
                        Get Started
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {coverLetters.map((letter) => (
                        <div
                            key={letter.id}
                            onClick={() => {
                                setSelectedLetter(letter);
                                setViewMode('detail');
                            }}
                            className="group relative bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-5 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-500 transition-all cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-900 dark:text-white truncate pr-6">{letter.jobTitle || 'Untitled Position'}</h3>
                                <button
                                    onClick={(e) => handleDelete(letter.id, e)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 -mr-2 -mt-2 opacity-0 group-hover:opacity-100"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-1">
                                <Building2 size={14} />
                                <span className="truncate">{letter.companyName || 'Unknown Company'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
                                <Calendar size={12} />
                                <span>{letter.createdAt?.toDate ? letter.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderCreate = () => (
        <div className="space-y-4">
            <button
                onClick={() => setViewMode('list')}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 mb-2 transition-colors"
            >
                <ChevronLeft size={16} />
                Back to List
            </button>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g. Senior Frontend Engineer"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g. Google"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Description</label>
                <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                        className="w-full pl-10 pr-4 py-3 h-48 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white resize-none"
                        placeholder="Paste the full job description here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        required
                    />
                </div>
            </div>

            {error && (
                <p className="text-sm text-red-500 mt-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    {error}
                </p>
            )}

            <div className="flex justify-end pt-2">
                <button
                    onClick={handleGenerate}
                    disabled={!jobDescription.trim() || !jobTitle.trim() || !companyName.trim() || isGenerating}
                    className="bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:bg-primary-300 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Generating Magic...
                        </>
                    ) : (
                        <>
                            <Wand2 size={20} />
                            Generate Cover Letter
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    const renderDetail = () => (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <button
                    onClick={() => {
                        setSelectedLetter(null);
                        setViewMode('list');
                    }}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                    <ChevronLeft size={16} />
                    Back
                </button>
                <div className="flex flex-col items-end">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{selectedLetter?.jobTitle}</h3>
                    <p className="text-xs text-gray-500">{selectedLetter?.companyName}</p>
                </div>
            </div>

            <textarea
                className="flex-1 w-full min-h-[300px] p-6 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 leading-relaxed focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-serif shadow-inner"
                value={selectedLetter ? getResolvedCoverLetterContent(selectedLetter) : ''}
                readOnly
            />

            <div className="space-y-3 pt-2">
                {(exportNotice || exportError) && (
                    <p className={`rounded-lg border px-3 py-2 text-sm ${exportError
                        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200'
                        }`}>
                        {exportError || exportNotice}
                    </p>
                )}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isExportingDocument}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        {isExportingDocument ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
                        PDF
                    </button>
                    <button
                        onClick={() => handleGoogleDocsExport('google-docs')}
                        disabled={isExportingDocument}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        {isExportingDocument ? <Loader2 size={17} className="animate-spin" /> : <ExternalLink size={17} />}
                        Google Docs
                    </button>
                    <button
                        onClick={() => handleGoogleDocsExport('docx')}
                        disabled={isExportingDocument}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        {isExportingDocument ? <Loader2 size={17} className="animate-spin" /> : <FileType size={17} />}
                        Word
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={isExportingDocument}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] ${theme === 'dark' ? 'dark' : ''}`}>

                {/* Header */}
                <header className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 rounded-t-lg">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="text-primary-500" size={24} />
                        {viewMode === 'list' && 'My Cover Letters'}
                        {viewMode === 'create' && 'New Cover Letter'}
                        {viewMode === 'detail' && 'Cover Letter Preview'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-800/50">
                    {viewMode === 'list' && renderList()}
                    {viewMode === 'create' && renderCreate()}
                    {viewMode === 'detail' && renderDetail()}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CoverLetterManagerModal;
