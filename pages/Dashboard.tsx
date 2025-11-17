import React, { useState, useEffect, useRef } from 'react';
import { useResumes } from '../hooks/useResumes';
import { ResumeData, PracticeHistoryEntry, JobApplicationData } from '../types';
import { Edit3, Copy, Trash2, PlusCircle, MoreVertical, FileText, Mic, ExternalLink, Sparkles, BarChart, X, User as UserIcon, Edit, ChevronDown, FolderPlus, Briefcase, GripVertical, LayoutDashboard, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePracticeHistory } from '../hooks/useJobHistory';
import InterviewReportModal from '../components/InterviewReportModal';
import JobDetailModal from '../components/JobTracker/JobDetailModal';
import { useJobTracker } from '../hooks/useJobTracker';
import { navigate } from '../App';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import ThemeToggle from '../components/ThemeToggle';
import StatusOverview from '../components/JobTracker/StatusOverview';
import KanbanBoard from '../components/JobTracker/KanbanBoard';
import ConfirmationModal from '../components/ConfirmationModal';
import { trackDemoConversion } from '../services/trackingService';
import ResumePreview from '../components/ResumePreview';

interface Folder {
  id: string;
  title: string;
  order: number;
}

const ResumeCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 animate-pulse"></div>
            <div className="h-5 w-3/4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="p-2 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <div className="flex gap-1">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse"></div>
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse"></div>
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse"></div>
            </div>
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse"></div>
        </div>
    </div>
);

const InterviewHistoryCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-4 animate-pulse">
        <div className="flex justify-between items-start mb-2">
            <div>
                <div className="h-5 w-40 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-5 w-20 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        </div>
        <div className="h-3 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
        <div className="mt-auto flex justify-between items-center">
            <div className="w-9 h-9 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            <div className="flex gap-2">
                <div className="h-9 w-32 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
                <div className="h-9 w-24 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
            </div>
        </div>
    </div>
);


const ResumeCard: React.FC<{ resume: ResumeData; onUpdate: (id: string, data: Partial<ResumeData>) => void; onDuplicate: (id: string) => void; onDelete: (id: string) => void; onDragStart: (e: React.DragEvent<HTMLDivElement>) => void; }> = ({ resume, onUpdate, onDuplicate, onDelete, onDragStart }) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(resume.title);
    
    const navigateToEdit = () => {
      navigate(`/edit/${resume.id}`);
    };

    const handleTitleSave = () => {
        if (title.trim() === '') {
          setTitle(resume.title); // reset if empty
        } else {
          onUpdate(resume.id, { title });
        }
        setIsEditingTitle(false);
    };

    return (
      <div draggable onDragStart={onDragStart} className="bg-white dark:bg-gray-800 rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 flex flex-col cursor-grab active:cursor-grabbing transform hover:-translate-y-1">
        <div onClick={!isEditingTitle ? navigateToEdit : undefined} className="block p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40 flex-grow cursor-pointer rounded-t-xl">
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex justify-center overflow-hidden pointer-events-none">
             <div className="w-full transform origin-top scale-[0.45]">
                <ResumePreview resume={resume} template={resume.templateId} />
             </div>
          </div>
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') {
                    setTitle(resume.title);
                    setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate w-full border rounded-md px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          ) : (
            <h3 onDoubleClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }} className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate" title="Double-click to rename">{resume.title}</h3>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">Updated {new Date(resume.updatedAt).toLocaleString()}</p>
        </div>
        <div className="p-2 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <div className="flex gap-1">
                <button onClick={navigateToEdit} title="Edit Resume" className="p-2 block rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"><Edit3 size={16} /></button>
                <button onClick={() => onDuplicate(resume.id)} title="Duplicate Resume" className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"><Copy size={16} /></button>
                <button onClick={() => onDelete(resume.id)} title="Delete Resume" className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"><Trash2 size={16} /></button>
            </div>
            <button title="More Options" className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"><MoreVertical size={16} /></button>
        </div>
      </div>
    );
  };

const InterviewHistoryCard: React.FC<{ entry: PracticeHistoryEntry; onShowReport: (entry: PracticeHistoryEntry) => void; onDelete: (id: string) => void; onDragStart: (e: React.DragEvent<HTMLDivElement>) => void; }> = ({ entry, onShowReport, onDelete, onDragStart }) => {
    const handlePracticeAgain = () => {
        sessionStorage.setItem('practiceJob', JSON.stringify(entry));
        navigate('/interview-studio');
    };
    
    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    return (
        <div draggable onDragStart={onDragStart} className="bg-white dark:bg-gray-800 rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 flex flex-col p-4 relative group cursor-grab active:cursor-grabbing transform hover:-translate-y-1">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center">
                        {entry.job.title}
                        {entry.job.url && <a href={entry.job.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-gray-400 hover:text-primary-500"><ExternalLink size={16}/></a>}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{entry.job.company}</p>
                </div>
                {entry.interviewHistory?.length > 0 && (
                    <div className="bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {entry.interviewHistory.length} practice{entry.interviewHistory.length > 1 ? 's' : ''}
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Last activity: {formatDate(entry.timestamp)}</p>

            <div className="mt-auto flex justify-between items-center">
                <button
                    onClick={() => onDelete(entry.id)}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete this history entry"
                >
                    <Trash2 size={18} />
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={handlePracticeAgain}
                        className="flex items-center gap-2 text-sm font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors"
                    >
                        <Sparkles size={16} /> Practice Again
                    </button>
                    <button
                        onClick={() => onShowReport(entry)}
                        disabled={!entry.interviewHistory || entry.interviewHistory.length === 0}
                        className="flex items-center gap-2 text-sm font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/80 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <BarChart size={16} /> Report
                    </button>
                </div>
            </div>
        </div>
    )
}

const JobApplicationCard: React.FC<{ job: JobApplicationData; onClick: () => void; onDelete: (id: string) => void; onDragStart: (e: React.DragEvent<HTMLDivElement>) => void; }> = ({ job, onClick, onDelete, onDragStart }) => (
    <div draggable onDragStart={onDragStart} onClick={onClick} className="bg-white dark:bg-gray-800 rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 flex flex-col p-4 relative group cursor-pointer transform hover:-translate-y-1">
        <div className="flex justify-between items-start mb-2">
            <div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{job.jobTitle}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{job.companyName}</p>
            </div>
            <div className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                {job.applicationStatus}
            </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Updated: {job.updatedAt?.toDate().toLocaleDateString()}</p>
        <div className="mt-auto flex justify-end">
             <button
                onClick={(e) => { e.stopPropagation(); onDelete(job.id); }}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-opacity opacity-0 group-hover:opacity-100"
                title="Delete this job application"
            >
                <Trash2 size={18} />
            </button>
        </div>
    </div>
);

const EditableHeader: React.FC<{ title: string; onSave: (newTitle: string) => void; isEditable: boolean }> = ({ title: initialTitle, onSave, isEditable }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(initialTitle);

    useEffect(() => {
        setTitle(initialTitle);
    }, [initialTitle]);

    const handleSave = () => {
        if (title.trim() && title.trim() !== initialTitle) {
            onSave(title.trim());
        } else {
            setTitle(initialTitle);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setTitle(initialTitle);
            setIsEditing(false);
        }
    };

    if (isEditing && isEditable) {
        return (
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                autoFocus
                className="text-2xl font-bold text-gray-800 dark:text-gray-100 bg-transparent border-b-2 border-primary-500 focus:outline-none"
            />
        );
    }
    
    return (
        <h2 
            onDoubleClick={() => isEditable && setIsEditing(true)} 
            className={`text-2xl font-bold text-gray-800 dark:text-gray-100 ${isEditable ? 'cursor-text' : ''}`}
            title={isEditable ? "Double-click to rename" : ""}
        >
            {title}
        </h2>
    );
};


const Dashboard: React.FC = () => {
  const { resumes, isLoading: isLoadingResumes, deleteResume, duplicateResume, updateResume, addBlankResume, saveAIGeneratedResume } = useResumes();
  const { practiceHistory, isLoading: isLoadingHistory, deletePracticeHistory, updatePracticeHistory, addCompletedPractice } = usePracticeHistory();
  const { jobApplications, isLoading: isLoadingJobs, updateJobApplication, deleteJobApplication, deleteAllJobApplications } = useJobTracker();
  const { currentUser, logOut, isAdmin } = useAuth();
  
  const [selectedJobForReport, setSelectedJobForReport] = useState<PracticeHistoryEntry | null>(null);
  const [selectedJobApplication, setSelectedJobApplication] = useState<JobApplicationData | null>(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm' });
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const newMenuRef = useRef<HTMLDivElement>(null);
  
  const [folders, setFolders] = useState<Folder[]>([]);
  const [jobTrackerShowPreview, setJobTrackerShowPreview] = useState(true);
  const [dragOverSection, setDragOverSection] = useState<{ id: string, position: 'top' | 'bottom' | 'middle' } | null>(null);
  
  useEffect(() => {
    // On initial load for a user with no resumes, redirect them to the creation hub.
    // This also handles the case where a user deletes all their resumes.
    if (!isLoadingResumes && resumes.length === 0) {
      navigate('/new');
    }
  }, [resumes, isLoadingResumes]);

  // Effect to import guest data on first login
  useEffect(() => {
    if (!currentUser) return;

    const importGuestData = async () => {
        // Import Resume
        const guestResumeJSON = localStorage.getItem('guestResume');
        if (guestResumeJSON) {
            try {
                const guestResume = JSON.parse(guestResumeJSON) as ResumeData;
                await saveAIGeneratedResume(guestResume);
                localStorage.removeItem('guestResume');
                console.log("Successfully imported guest resume.");
                trackDemoConversion('convertedResumeUsers'); 
            } catch (e) {
                console.error("Failed to import guest resume:", e);
                localStorage.removeItem('guestResume');
            }
        }

        // Import Interview
        const guestInterviewJSON = localStorage.getItem('guestInterview');
        if (guestInterviewJSON) {
            try {
                const guestInterview = JSON.parse(guestInterviewJSON) as PracticeHistoryEntry;
                await addCompletedPractice(guestInterview);
                localStorage.removeItem('guestInterview');
                 console.log("Successfully imported guest interview.");
                 trackDemoConversion('convertedInterviewUsers');
            } catch (e) {
                console.error("Failed to import guest interview:", e);
                localStorage.removeItem('guestInterview');
            }
        }
    };

    // Run once after user context is available
    const timer = setTimeout(importGuestData, 500);
    return () => clearTimeout(timer);
  }, [currentUser, saveAIGeneratedResume, addCompletedPractice]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
        setIsNewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    if (!currentUser) return;
    const settingsRef = doc(db, 'users', currentUser.uid, 'settings', 'dashboard');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
        const defaultFolders = [
            { id: 'resumes', title: 'My Resumes', order: 0 },
            { id: 'interviews', title: 'Interview Studio Sessions', order: 1 },
        ];
        if (docSnap.exists()) {
            const data = docSnap.data();
            setJobTrackerShowPreview(data.jobTrackerShowPreview !== false);
            let currentFolders: Folder[] = data.folders || [];
            
            defaultFolders.forEach(df => {
                if (!currentFolders.some(f => f.id === df.id)) {
                    currentFolders.push({ ...df, order: currentFolders.length });
                }
            });

            if (data.folders) {
                 setFolders([...currentFolders].sort((a, b) => a.order - b.order));
            } else {
                setFolders(defaultFolders);
                setDoc(settingsRef, { folders: defaultFolders }, { merge: true }).catch(console.error);
            }
        } else {
            const defaultSettings = { folders: defaultFolders, jobTrackerShowPreview: true };
            setFolders(defaultFolders);
            setJobTrackerShowPreview(true);
            setDoc(settingsRef, defaultSettings).catch(console.error);
        }
    });
    return unsubscribe;
  }, [currentUser]);

  // Re-add Job Tracker folder if it's been deleted but jobs exist
  useEffect(() => {
    if (jobApplications.length > 0 && !folders.some(f => f.id === 'jobTracker')) {
      const jobTrackerFolder = { id: 'jobTracker', title: 'Job Application Tracker', order: folders.length };
      saveFolders([...folders, jobTrackerFolder]);
    } else if (jobApplications.length === 0 && folders.some(f => f.id === 'jobTracker')) {
       // Optional: remove tracker if it becomes empty and wasn't a custom folder
       // For now, we'll leave it, as the user might want to drag items into it.
    }
  }, [jobApplications.length, folders]);

  const updateDashboardSettings = async (settings: object) => {
    if (!currentUser) return;
    const settingsRef = doc(db, 'users', currentUser.uid, 'settings', 'dashboard');
    await updateDoc(settingsRef, settings);
  };

  const saveFolders = async (newFolders: Folder[]) => {
    const orderedFolders = newFolders.map((f, i) => ({ ...f, order: i }));
    setFolders(orderedFolders); // Optimistic update
    await updateDashboardSettings({ folders: orderedFolders });
  };

  const handleToggleTrackerPreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setJobTrackerShowPreview(newValue);
    updateDashboardSettings({ jobTrackerShowPreview: newValue });
  };

  const handleTitleUpdate = (folderId: string, newTitle: string) => {
    const updatedFolders = folders.map(f => f.id === folderId ? { ...f, title: newTitle } : f);
    saveFolders(updatedFolders);
  };

  const handleAddFolder = () => {
    const newFolder = { id: `folder_${Date.now()}`, title: 'New Folder', order: folders.length };
    saveFolders([...folders, newFolder]);
  };
  
  const closeConfirmModal = () => setConfirmModal({ ...confirmModal, isOpen: false });
  
  const confirmItemDelete = (id: string, type: 'resume' | 'practice' | 'job') => {
    setConfirmModal({
        isOpen: true,
        title: `Confirm ${type} Deletion`,
        message: `Are you sure you want to delete this ${type}? This action cannot be undone.`,
        onConfirm: () => {
            if (type === 'resume') deleteResume(id);
            if (type === 'practice') deletePracticeHistory(id);
            if (type === 'job') deleteJobApplication(id);
            closeConfirmModal();
        },
        confirmText: 'Delete'
    });
  };

  const confirmFolderDelete = async (folderId: string) => {
    setConfirmModal({
        isOpen: true,
        title: 'Confirm Folder Deletion',
        message: 'Items in this folder will be moved to their default folders. Are you sure?',
        onConfirm: async () => {
            if (!currentUser) return;
            const batch = writeBatch(db);
            resumes.forEach(r => {
                if ((r.section || 'resumes') === folderId) {
                    batch.update(doc(db, 'users', currentUser.uid, 'resumes', r.id), { section: 'resumes' });
                }
            });
            practiceHistory.forEach(p => {
                if ((p.section || 'interviews') === folderId) {
                    batch.update(doc(db, 'users', currentUser.uid, 'practiceHistory', p.id), { section: 'interviews' });
                }
            });
            jobApplications.forEach(j => {
                if (j.section === folderId) {
                    batch.update(doc(db, 'users', currentUser.uid, 'jobTracker', j.id), { section: 'jobTracker' });
                }
            });
            try {
                await batch.commit();
                const updatedFolders = folders.filter(f => f.id !== folderId);
                await saveFolders(updatedFolders);
            } catch (error) {
                console.error("Error moving items and deleting folder:", error);
            }
            closeConfirmModal();
        },
        confirmText: 'Delete'
    });
  };

  const confirmDeleteTracker = async () => {
    setConfirmModal({
        isOpen: true,
        title: 'Delete All Tracked Jobs?',
        message: 'This will permanently delete all of your job applications. This action cannot be undone. Are you sure?',
        onConfirm: async () => {
            try {
                await deleteAllJobApplications();
            } catch (error) {
                console.error("Error deleting all job applications:", error);
            }
            closeConfirmModal();
        },
        confirmText: 'Yes, delete everything'
    });
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetFolderId: string) => {
    e.preventDefault();
    setDragOverSection(null);
    try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.type === 'folder') {
             const draggedFolderId = data.id;
             if (draggedFolderId === targetFolderId) return;

             const newFolders = [...folders];
             const draggedIndex = newFolders.findIndex(f => f.id === draggedFolderId);
             const targetIndex = newFolders.findIndex(f => f.id === targetFolderId);
             
             if (draggedIndex === -1 || targetIndex === -1) return;

             const [draggedItem] = newFolders.splice(draggedIndex, 1);
             newFolders.splice(targetIndex, 0, draggedItem);
             
             saveFolders(newFolders);

        } else {
            const { id, type } = data;
            if (targetFolderId === 'jobTracker' && type !== 'jobApplication') return;
            if (targetFolderId !== 'jobTracker' && type === 'jobApplication') {
                if (!folders.some(f => f.id === targetFolderId)) return;
            }

            if (type === 'resume') updateResume(id, { section: targetFolderId });
            if (type === 'interview') updatePracticeHistory(id, { section: targetFolderId });
            if (type === 'jobApplication') updateJobApplication(id, { section: targetFolderId });
        }
    } catch (error) { console.error("Failed to handle drop:", error); }
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string, type: 'resume' | 'interview' | 'jobApplication' | 'folder') => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id, type }));
    if (type !== 'folder') {
      e.stopPropagation();
    }
  };
  
    // If resumes are loading, or if there are no resumes (which will cause a redirect), show a loading screen.
    // This prevents the empty dashboard from flashing on screen for new users.
    if (isLoadingResumes || (!isLoadingResumes && resumes.length === 0)) {
        return (
         <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-950">
           <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
           <p className="dark:text-white mt-4">Loading Dashboard...</p>
         </div>
       );
    }
    
    const isLoading = isLoadingHistory || isLoadingJobs;

  return (
    <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
                <div className="flex items-center gap-4">
                    <a href="#/" className="flex items-center gap-2">
                        <img src="https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/logo.png?alt=media&token=3d2f7db5-96db-4dce-ba00-43d8976da3a1" alt="CareerVivid Logo" className="h-8 w-8" />
                        <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">CareerVivid</span>
                    </a>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden lg:block">{currentUser?.email}</span>
                    <ThemeToggle />
                    <button onClick={() => navigate('/interview-studio')} className="flex items-center gap-2 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 font-semibold py-2 px-3 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/80 transition-colors">
                        <Mic size={20} /> <span className="hidden md:inline">Interview Studio</span>
                    </button>
                    <div className="relative" ref={newMenuRef}>
                        <button onClick={() => setIsNewMenuOpen(!isNewMenuOpen)} className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-3 rounded-lg shadow-soft hover:bg-primary-700 transition-colors">
                            <PlusCircle size={20} /> <span className="hidden md:inline">Create New</span> <ChevronDown size={20} />
                        </button>
                        {isNewMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border dark:border-gray-700">
                                <div className="py-1">
                                    <button onClick={() => { navigate('/new'); setIsNewMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <FileText size={16} /> New Resume
                                    </button>
                                    <button onClick={() => { navigate('/interview-studio'); setIsNewMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <Mic size={16} /> Interview Practice
                                    </button>
                                    <button onClick={() => { navigate('/tracker'); setIsNewMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <Briefcase size={16} /> Track New Job
                                    </button>
                                    <div className="border-t my-1 border-gray-200 dark:border-gray-600"></div>
                                    <button onClick={() => { handleAddFolder(); setIsNewMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <FolderPlus size={16} /> New Folder
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="relative" ref={userMenuRef}>
                        <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                           {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="User" className="w-full h-full rounded-full object-cover" /> : <UserIcon size={20} />}
                        </button>
                        {isUserMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border dark:border-gray-700">
                                <div className="py-1">
                                    <a href="#/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Profile</a>
                                    {isAdmin && <a href="#/admin" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Admin</a>}
                                    <button onClick={logOut} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Sign Out</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </header>
      <main className="py-10">
        {folders.map((folder) => {
            const resumesInSection = resumes.filter(r => (r.section || 'resumes') === folder.id);
            const interviewsInSection = practiceHistory.filter(j => (j.section || 'interviews') === folder.id);
            const jobsInSection = jobApplications.filter(j => (j.section || 'jobTracker') === folder.id);
            
            const isTrackerFolder = folder.id === 'jobTracker';
            const isEmpty = !isLoadingResumes && !isLoadingHistory && resumesInSection.length === 0 && interviewsInSection.length === 0 && jobsInSection.length === 0 && !isTrackerFolder;
            const totalJobsTracked = jobApplications.length;
            
            if (folder.id === 'interviews' && practiceHistory.length === 0 && !isLoadingHistory) return null;
            if (isTrackerFolder && totalJobsTracked === 0 && !isLoadingJobs) return null;

            return (
                <div 
                    key={folder.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, folder.id, 'folder')}
                    onDragOver={(e) => {e.preventDefault(); setDragOverSection({id: folder.id, position: 'middle'});}}
                    onDragLeave={() => setDragOverSection(null)}
                    onDrop={(e) => handleDrop(e, folder.id)}
                    className={`max-w-screen-2xl mx-auto sm:px-6 lg:px-8 p-4 rounded-xl transition-colors duration-300 mt-12 ${dragOverSection?.id === folder.id ? 'bg-primary-100/50 dark:bg-primary-900/20' : ''}`}
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <GripVertical className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"/>
                            <EditableHeader title={folder.title} onSave={(newTitle) => handleTitleUpdate(folder.id, newTitle)} isEditable={!['resumes', 'interviews', 'jobTracker'].includes(folder.id)} />
                        </div>
                        {!['resumes', 'interviews'].includes(folder.id) && (
                            <button 
                                onClick={() => {
                                    if (folder.id === 'jobTracker') {
                                        confirmDeleteTracker();
                                    } else {
                                        confirmFolderDelete(folder.id);
                                    }
                                }} 
                                className="text-gray-400 hover:text-red-500 p-1 rounded-full"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                    
                    {isTrackerFolder ? (
                        <>
                            <div onClick={() => navigate('/tracker')} className="bg-white dark:bg-gray-800 rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 flex items-center justify-between p-6 cursor-pointer border-2 border-transparent hover:border-primary-500 transform hover:-translate-y-1">
                                <div className="flex items-center gap-4">
                                    <LayoutDashboard className="w-10 h-10 text-primary-500"/>
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100">Job Application Tracker</h3>
                                        <p className="text-gray-500 dark:text-gray-400">View your Kanban board</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div 
                                        className="flex items-center gap-2"
                                        onClick={(e) => e.stopPropagation()}
                                        title={jobTrackerShowPreview ? "Hide preview on dashboard" : "Show preview on dashboard"}
                                    >
                                        <label htmlFor="show-overview-toggle" className="text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer">Show Preview</label>
                                        <label htmlFor="show-overview-toggle" className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                id="show-overview-toggle"
                                                className="sr-only peer"
                                                checked={jobTrackerShowPreview}
                                                onChange={handleToggleTrackerPreview}
                                            />
                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                        </label>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{totalJobsTracked}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Jobs Tracked</p>
                                    </div>
                                </div>
                            </div>
                             {jobTrackerShowPreview && totalJobsTracked > 0 && (
                                <div className="mt-8 space-y-8">
                                    <StatusOverview applications={jobApplications} />
                                    <KanbanBoard 
                                        applications={jobApplications} 
                                        onCardClick={(job) => setSelectedJobApplication(job)}
                                        onUpdateApplication={updateJobApplication}
                                    />
                                </div>
                            )}
                        </>
                    ) : isEmpty ? (
                         <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                            <p className="text-gray-500 dark:text-gray-400">Drag items here to organize them.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {isLoadingResumes && folder.id === 'resumes'
                                ? Array.from({ length: 4 }).map((_, i) => <ResumeCardSkeleton key={`resume_skel_${i}`} />)
                                : resumesInSection.map(resume => <ResumeCard key={resume.id} resume={resume} onUpdate={updateResume} onDuplicate={duplicateResume} onDelete={(id) => confirmItemDelete(id, 'resume')} onDragStart={(e) => handleDragStart(e, resume.id, 'resume')}/>)
                            }

                            {isLoadingHistory && folder.id === 'interviews'
                                ? Array.from({ length: 3 }).map((_, i) => <InterviewHistoryCardSkeleton key={`interview_skel_${i}`} />)
                                : interviewsInSection.map(entry => <InterviewHistoryCard key={entry.id} entry={entry} onShowReport={setSelectedJobForReport} onDelete={(id) => confirmItemDelete(id, 'practice')} onDragStart={(e) => handleDragStart(e, entry.id, 'interview')}/>)
                            }
                            
                            {jobsInSection.map(job => <JobApplicationCard key={job.id} job={job} onClick={() => setSelectedJobApplication(job)} onDelete={(id) => confirmItemDelete(id, 'job')} onDragStart={(e) => handleDragStart(e, job.id, 'jobApplication')} />)}
                            
                            {folder.id === 'resumes' && <div onClick={addBlankResume} className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center p-4 text-gray-500 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 cursor-pointer min-h-[340px] transform hover:-translate-y-1 hover:shadow-lg"><PlusCircle size={48} /><span className="mt-2 font-semibold">Create a New Resume</span></div>}
                        </div>
                    )}
                </div>
            );
        })}
        <div className="max-w-screen-2xl mx-auto sm:px-6 lg:px-8 mt-8">
            <button onClick={handleAddFolder} className="w-full text-center py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-semibold flex items-center justify-center gap-2">
                <FolderPlus size={20} /> Add New Folder
            </button>
        </div>
      </main>

      {selectedJobForReport && <InterviewReportModal jobHistoryEntry={selectedJobForReport} onClose={() => setSelectedJobForReport(null)} />}
      {selectedJobApplication && <JobDetailModal job={selectedJobApplication} onClose={() => setSelectedJobApplication(null)} onUpdate={updateJobApplication} onDelete={(id) => {confirmItemDelete(id, 'job'); setSelectedJobApplication(null);}}/>}
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        confirmText={confirmModal.confirmText}
      />
    </div>
  );
};

export default Dashboard;