import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Plus, Copy, Loader2, Check, FileText, Wand2, Briefcase, Building2, Calendar, ChevronLeft, Trash2, Sparkles } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { functions, db } from '@/firebase';
import { ResumeData, CoverLetter } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface CoverLetterManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    resume: ResumeData;
    theme?: string;
}

type ViewMode = 'list' | 'create' | 'detail';

const CoverLetterManagerModal: React.FC<CoverLetterManagerModalProps> = ({ isOpen, onClose, resume, theme }) => {
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
        navigator.clipboard.writeText(selectedLetter.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                value={selectedLetter?.content || ''}
                readOnly
            />

            <div className="flex justify-end pt-2">
                <button
                    onClick={handleCopy}
                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
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
