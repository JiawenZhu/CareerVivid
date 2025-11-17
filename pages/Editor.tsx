import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useResumes } from '../hooks/useResumes';
import { ResumeData, TemplateId, TemplateInfo } from '../types';
import ResumeForm from '../components/ResumeForm';
import ResumePreview from '../components/ResumePreview';
import GoogleTranslateWidget from '../components/GoogleTranslateWidget';
import ThemeToggle from '../components/ThemeToggle';
import { TEMPLATES } from '../templates';
import { FONTS, UI_LANGUAGES, EXPORT_OPTIONS } from '../constants';
// FIX: Renamed Type to TypeIcon to avoid conflict with @google/genai's Type enum.
import { ArrowLeft, Download, Eye, Code, Palette, Type as TypeIcon, Check, PlusCircle, LogOut, Loader2, ChevronDown, FileText, Image as ImageIcon, Edit as EditIcon, MoreVertical, Sun, Moon, Sparkles, ChevronLeft, ChevronRight, X as XIcon, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../App';
import { trackUsage } from '../services/trackingService';
import { jsPDF } from 'jspdf';
import { useTheme } from '../contexts/ThemeContext';
import AlertModal from '../components/AlertModal';
import ConfirmationModal from '../components/ConfirmationModal';
import FeedbackModal from '../components/FeedbackModal';

// Debounce utility to delay function execution
function debounce<F extends (...args: any[]) => any>(func: F, wait: number): F & { cancel: () => void; } {
  let timeoutId: number | null = null;
  
  const debounced = function(this: any, ...args: any[]) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => {
      func.apply(this, args);
    }, wait);
  } as F & { cancel: () => void; };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  };

  return debounced;
}


const Editor: React.FC<{ resumeId: string; }> = ({ resumeId }) => {
  const { getResumeById, updateResume, isLoading } = useResumes();
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<TemplateInfo>(TEMPLATES[0]);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const previewRef = useRef<HTMLDivElement>(null);
  const [designTab, setDesignTab] = useState<'template' | 'design'>('template');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '' });
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isSignupPromptOpen, setIsSignupPromptOpen] = useState(false);
  
  // State for export functionality
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [isDesktopDownloadMenuOpen, setIsDesktopDownloadMenuOpen] = useState(false);
  const [isMobileMoreMenuOpen, setIsMobileMoreMenuOpen] = useState(false);
  const desktopDownloadMenuRef = useRef<HTMLDivElement>(null);
  const mobileMoreMenuRef = useRef<HTMLDivElement>(null);

  // State for the new optimization side panel
  const [optimizationJob, setOptimizationJob] = useState<{title: string, description: string} | null>(null);


  useEffect(() => {
    if (sessionStorage.getItem('isFirstResume') === 'true') {
        setShowCelebration(true);
        sessionStorage.removeItem('isFirstResume');
        setTimeout(() => {
            setShowCelebration(false);
        }, 4000); // Celebration lasts 4 seconds
    }
     const jobDescription = sessionStorage.getItem('jobDescriptionForOptimization');
    const jobTitle = sessionStorage.getItem('jobTitleForOptimization');
    if (jobDescription && jobTitle) {
        setOptimizationJob({ title: jobTitle, description: jobDescription });
    }
  }, []);

  useEffect(() => {
    if (resumeId === 'guest') {
        setIsGuestMode(true);
        const guestResumeJson = localStorage.getItem('guestResume');
        if (guestResumeJson) {
            const guestResume = JSON.parse(guestResumeJson);
            setResume(guestResume);
            const initialTemplate = TEMPLATES.find(t => t.id === guestResume.templateId) || TEMPLATES[0];
            setActiveTemplate(initialTemplate);
            setViewMode('preview'); // Default guests to preview mode
        } else {
            // If guest data is lost, send them back to the demo page
            navigate('/demo');
        }
        return; // Skip Firestore logic for guests
    }

    setIsGuestMode(false);
    if (!isLoading) {
      const loadedResume = getResumeById(resumeId);
      if (loadedResume) {
        setResume(loadedResume);
        const initialTemplate = TEMPLATES.find(t => t.id === loadedResume.templateId) || TEMPLATES[0];
        setActiveTemplate(initialTemplate);
      } else {
        navigate('/');
      }
    }
  }, [resumeId, getResumeById, isLoading]);

  useEffect(() => {
    // When switching to preview mode, always ensure both panels are visible for desktop.
    if (viewMode === 'preview') {
        setIsPreviewCollapsed(false);
        setIsEditorCollapsed(false);
    }
  }, [viewMode]);

  useEffect(() => {
    setTempPhoto(null);
  }, [resumeId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopDownloadMenuRef.current && !desktopDownloadMenuRef.current.contains(event.target as Node)) {
        setIsDesktopDownloadMenuOpen(false);
      }
      if (mobileMoreMenuRef.current && !mobileMoreMenuRef.current.contains(event.target as Node)) {
        setIsMobileMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleGuestAction = (actionType: 'download') => {
    if (isGuestMode) {
        setIsSignupPromptOpen(true);
        return true;
    }
    return false;
  };

  const handleResumeChange = useCallback((updatedData: Partial<ResumeData>) => {
    if (resume) {
      if (updatedData.personalDetails?.photo && updatedData.personalDetails.photo !== resume.personalDetails.photo) {
        setTempPhoto(null);
      }
      
      const newResumeState = { ...resume, ...updatedData };
      setResume(newResumeState);
      if (!isGuestMode) {
        updateResume(resume.id, updatedData);
      } else {
        // Also update local storage for guest mode
        localStorage.setItem('guestResume', JSON.stringify(newResumeState));
      }
    }
  }, [resume, updateResume, isGuestMode]);
  
  const handleDesignChange = (updatedData: Partial<ResumeData>) => {
    handleResumeChange(updatedData);
  };
  
  const handleTemplateSelect = (template: TemplateInfo) => {
    if (activeTemplate.id === template.id) return;
    setIsTemplateLoading(true);

    setActiveTemplate(template);
    const updates: Partial<ResumeData> = { templateId: template.id };
    if (!template.availableColors.includes(resume?.themeColor || '')) {
        updates.themeColor = template.availableColors[0];
    }
    handleResumeChange(updates);

    setTimeout(() => {
      setIsTemplateLoading(false);
    }, 400);
  };

  const handleConfirmNew = () => {
    setIsConfirmModalOpen(false);
    navigate('/new');
  };

    const handleExport = async (optionId: string) => {
    if (handleGuestAction('download')) return;
    if (!currentUser || !resume) return;
    setIsDesktopDownloadMenuOpen(false);
    setIsMobileMoreMenuOpen(false);
    setIsExporting(true);

    const formatName = EXPORT_OPTIONS.find(opt => opt.id === optionId)?.name || optionId;
    setExportProgress(`Generating ${formatName}...`);

    try {
        if (optionId === 'pdf') {
            const element = previewRef.current;
            if (!element) throw new Error("Preview element not found.");

            // Use html2canvas to capture the preview as an image
            const canvas = await (await import('html2canvas')).default(element, {
                scale: 4, // Higher scale for better PDF quality
                useCORS: true,
                backgroundColor: '#ffffff',
            });
            const imgData = canvas.toDataURL('image/png');

            // Create a PDF using jsPDF
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${resume.title.replace(/\s/g, '_')}.pdf`);
        } else {
            const element = previewRef.current;
            if (!element) throw new Error("Preview element not found.");

            const canvas = await (await import('html2canvas')).default(element, { scale: 3, useCORS: true });
            const aspectRatio = optionId === 'png' ? undefined : optionId;

            if (aspectRatio) {
                const [w, h] = aspectRatio.split(':').map(Number);
                const originalWidth = canvas.width;
                const originalHeight = canvas.height;
                let newWidth, newHeight, x, y;

                if (originalWidth / originalHeight > w / h) {
                    newHeight = originalHeight;
                    newWidth = newHeight * w / h;
                    x = (originalWidth - newWidth) / 2;
                    y = 0;
                } else {
                    newWidth = originalWidth;
                    newHeight = newWidth * h / w;
                    x = 0;
                    y = 0;
                }

                const croppedCanvas = document.createElement('canvas');
                croppedCanvas.width = newWidth;
                croppedCanvas.height = newHeight;
                const ctx = croppedCanvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(canvas, x, y, newWidth, newHeight, 0, 0, newWidth, newHeight);
                    const dataUrl = croppedCanvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.download = `${resume.title.replace(/\s/g, '_')}_${aspectRatio}.png`;
                    link.href = dataUrl;
                    link.click();
                }
            } else {
                const dataUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `${resume.title.replace(/\s/g, '_')}.png`;
                link.href = dataUrl;
                link.click();
            }
        }
        
        if (currentUser) {
            trackUsage(currentUser.uid, 'resume_download', { format: formatName });
        }
        
        // Open feedback modal on successful export
        if (!isGuestMode) {
            setIsFeedbackModalOpen(true);
        }

    } catch (error) {
        console.error("Export failed:", error);
        setAlertState({ isOpen: true, title: 'Export Failed', message: 'Sorry, something went wrong during the export process. Please try again.' });
    } finally {
        setIsExporting(false);
        setExportProgress('');
    }
  };
  
  const CelebrationAnimation = () => (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-celebration-fade-in-out">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl text-center">
            <Sparkles className="w-16 h-16 text-yellow-400 mx-auto animate-celebration-sparkle" />
            <h2 className="text-3xl font-bold mt-4 text-gray-900 dark:text-white">Congratulations!</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Your new resume is ready. Let's start editing!</p>
        </div>
    </div>
  );
  
   const OptimizationPanel = () => {
        if (!optimizationJob) return null;

        const handleClear = () => {
            setOptimizationJob(null);
            sessionStorage.removeItem('jobDescriptionForOptimization');
            sessionStorage.removeItem('jobTitleForOptimization');
        };

        return (
            <div className="fixed top-1/2 right-4 -translate-y-1/2 z-30 bg-white dark:bg-gray-800 shadow-xl rounded-lg border dark:border-gray-700 w-full max-w-sm flex flex-col h-[70vh]">
                <div className="p-3 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Info size={18} className="text-primary-500" />
                        <h3 className="font-bold text-md">Job Context</h3>
                    </div>
                    <button onClick={handleClear} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <XIcon size={18} />
                    </button>
                </div>
                <div className="p-4 flex-grow overflow-y-auto">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">{optimizationJob.title}</h4>
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                       {optimizationJob.description}
                    </div>
                </div>
            </div>
        );
    };

  if ((isLoading && !isGuestMode) || !resume) {
    return <div className="flex justify-center items-center h-screen dark:text-white">Loading Resume...</div>;
  }
  
  const resumeForPreview = tempPhoto ? {
    ...resume,
    personalDetails: { ...resume.personalDetails, photo: tempPhoto }
  } : resume;

  const editorToggleTitle = viewMode === 'edit'
    ? (isEditorCollapsed ? 'Show Form' : 'Hide Form')
    : (isEditorCollapsed ? 'Show Design Controls' : 'Hide Design Controls');

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {showCelebration && <CelebrationAnimation />}
      <ConfirmationModal 
        isOpen={isConfirmModalOpen}
        title="Create a New Resume?"
        message="Are you sure? Any unsaved changes to the current resume will be lost when you leave this page."
        onConfirm={handleConfirmNew}
        onCancel={() => setIsConfirmModalOpen(false)}
        confirmText="Create New"
      />
      <ConfirmationModal
        isOpen={isSignupPromptOpen}
        title="Sign Up to Save & Download"
        message="Create a free account to save your resume and download it in multiple professional formats."
        onConfirm={() => navigate('/auth')}
        onCancel={() => setIsSignupPromptOpen(false)}
        confirmText="Sign Up Now"
      />
      <AlertModal 
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        onClose={() => setAlertState({ isOpen: false, title: '', message: '' })}
      />
       <FeedbackModal 
            isOpen={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
            onCancel={() => setIsFeedbackModalOpen(false)}
            onSubmitted={() => setIsFeedbackModalOpen(false)}
            source="resume_export"
            context={{
                resumeId: resume.id,
                templateId: resume.templateId,
            }}
       />
       <OptimizationPanel />

      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-20 w-full flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-1 flex justify-start items-center gap-2 sm:gap-4 min-w-0">
              <a href={isGuestMode ? "#/demo" : "#/"} title={isGuestMode ? "Back to Demo" : "Back to Dashboard"} className="flex-shrink-0 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <ArrowLeft size={24} />
              </a>
              <div className="relative inline-grid items-center -ml-2">
                <span className="font-bold text-lg sm:text-xl invisible whitespace-pre px-2 col-start-1 row-start-1">
                  {resume.title || ' '}
                </span>
                <input 
                  type="text" 
                  value={resume.title}
                  onChange={(e) => handleResumeChange({ title: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-100 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md px-2 py-1 w-full col-start-1 row-start-1"
                  disabled={isGuestMode}
                  style={{ background: 'transparent' }}
                />
              </div>
            </div>
            
            {/* --- DESKTOP CENTER CONTROLS --- */}
            <div className="hidden md:flex flex-shrink-0 justify-center mx-4">
              <div className="flex items-center gap-1 p-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                <button onClick={() => setViewMode('edit')} className={`flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${viewMode === 'edit' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'} disabled:cursor-not-allowed disabled:opacity-50`} disabled={isGuestMode}><EditIcon size={14}/><span className="hidden sm:inline">Edit</span></button>
                <button onClick={() => setViewMode('preview')} className={`flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${viewMode === 'preview' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}><Eye size={14}/><span className="hidden sm:inline">Preview</span></button>
              </div>
            </div>
            
            <div className="flex-shrink-0 flex justify-end items-center gap-2 sm:gap-4">
                {/* --- DESKTOP RIGHT CONTROLS --- */}
                <div className="hidden md:flex items-center gap-2 sm:gap-4">
                  {isGuestMode ? (
                      <a href="#/auth" className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-soft hover:bg-primary-700">
                          Sign Up to Save & Download
                      </a>
                  ) : (
                    <div className="relative" ref={desktopDownloadMenuRef}>
                      <button
                        onClick={() => setIsDesktopDownloadMenuOpen(!isDesktopDownloadMenuOpen)}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-soft hover:bg-primary-700 transition-colors disabled:bg-primary-300"
                      >
                        {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                        <span>{isExporting ? exportProgress : 'Download'}</span>
                        {!isExporting && <ChevronDown size={20} className={`transition-transform ${isDesktopDownloadMenuOpen ? 'rotate-180' : ''}`} />}
                      </button>
                      {isDesktopDownloadMenuOpen && (
                        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border dark:border-gray-700">
                          <div className="py-1">
                            {EXPORT_OPTIONS.map(opt => (
                              <button key={opt.id} onClick={() => handleExport(opt.id)} className="flex items-start text-left w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <div className="p-2 bg-gray-200 dark:bg-gray-600 rounded-md mr-3">{opt.id === 'pdf' ? <FileText size={20} /> : <ImageIcon size={20} />}</div>
                                <div>
                                  <p className="font-semibold">{opt.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{opt.recommendation}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <ThemeToggle />
                </div>

                {/* --- MOBILE RIGHT CONTROLS --- */}
                <div className="flex md:hidden items-center">
                    <div className="relative" ref={mobileMoreMenuRef}>
                        <button onClick={() => setIsMobileMoreMenuOpen(!isMobileMoreMenuOpen)} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <MoreVertical size={24} />
                        </button>
                        {isMobileMoreMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border dark:border-gray-700">
                                <div className="py-2">
                                  {isGuestMode ? (
                                    <a href="#/auth" className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <LogOut size={16} /> Sign Up to Save
                                    </a>
                                  ) : (
                                    <>
                                       <p className="px-4 pt-1 pb-2 text-xs text-gray-500 dark:text-gray-400">Download</p>
                                        {EXPORT_OPTIONS.map(opt => (
                                          <button key={opt.id} onClick={() => handleExport(opt.id)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50" disabled={isExporting}>
                                            {isExporting && opt.id === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : (opt.id === 'pdf' ? <FileText size={16} /> : <ImageIcon size={16} />)}
                                            {opt.name}
                                          </button>
                                        ))}
                                    </>
                                  )}
                                    <div className="border-t my-2 border-gray-200 dark:border-gray-600"></div>
                                    <button onClick={() => { setIsConfirmModalOpen(true); setIsMobileMoreMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50" disabled={isGuestMode}>
                                        <PlusCircle size={16} /> New Resume
                                    </button>
                                    <button onClick={toggleTheme} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                                        Toggle Theme
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </header>
        
        <div className="md:flex-grow md:overflow-hidden md:flex md:flex-row md:min-h-0 md:relative">
            {/* Desktop Layout */}
            <div className="hidden md:flex flex-grow overflow-hidden relative">
                <aside className={`
                    flex-shrink-0 md:overflow-y-auto transition-all duration-500 ease-in-out
                    ${(viewMode === 'preview') ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
                    ${isEditorCollapsed ? 'w-0 p-0 overflow-hidden' : (isPreviewCollapsed ? 'w-full' : 'md:w-2/5 lg:w-1/3')}
                `}>
                    {viewMode === 'preview' && (
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center gap-1 p-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-6">
                                <button onClick={() => setDesignTab('template')} className={`flex-grow justify-center flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${designTab === 'template' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><Palette size={16}/> Template</button>
                                {/* FIX: Renamed Type to TypeIcon to avoid name collision */}
                                <button onClick={() => setDesignTab('design')} className={`flex-grow justify-center flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${designTab === 'design' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><TypeIcon size={16}/> Design</button>
                            </div>
                            {designTab === 'template' && (
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    {TEMPLATES.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => handleTemplateSelect(template)}
                                            className={`group flex flex-col border-2 rounded-lg overflow-hidden transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800 ${
                                                activeTemplate.id === template.id ? 'border-primary-500 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                                            }`}
                                        >
                                            <div className="font-semibold text-gray-700 dark:text-gray-200 text-sm p-2 px-3 text-left border-b border-gray-200 dark:border-gray-700">
                                                {template.name}
                                            </div>
                                            <div className="w-full aspect-[3/4] bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-80 p-2 flex-grow shadow-inner">
                                                <span className="text-xl font-bold text-white/60 tracking-wider break-all text-center">
                                                    {template.name}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {designTab === 'design' && ( /* Design Controls */ <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Theme Color</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {activeTemplate.availableColors.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => handleDesignChange({ themeColor: color })}
                                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform transform hover:scale-110 focus:outline-none ${resume.themeColor === color ? 'ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-gray-800' : ''}`}
                                                style={{ backgroundColor: color }}
                                                aria-label={`Set theme color to ${color}`}
                                            >
                                                {resume.themeColor === color && <Check size={16} className="text-white mix-blend-difference" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Typography</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title Font</label>
                                            <select value={resume.titleFont} onChange={e => handleDesignChange({ titleFont: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700">
                                                {FONTS.map(font => <option key={font} value={font}>{font}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body Font</label>
                                            <select value={resume.bodyFont} onChange={e => handleDesignChange({ bodyFont: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700">
                                                {FONTS.map(font => <option key={font} value={font}>{font}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Resume Language</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">This helps our AI provide suggestions in the correct language.</p>
                                    <div>
                                        <select value={resume.language} onChange={e => handleDesignChange({ language: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700">
                                            {UI_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>)}
                        </div>
                    )}
                    {viewMode === 'edit' && !isGuestMode && (
                        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                           <ResumeForm resume={resume} onChange={handleResumeChange} tempPhoto={tempPhoto} setTempPhoto={setTempPhoto} isReadOnly={isGuestMode} />
                        </div>
                    )}
                </aside>
                <div className={`
                    p-4 sm:p-8 flex items-start justify-center md:overflow-auto bg-gray-200 dark:bg-gray-950
                    transition-all duration-500 ease-in-out
                    ${isPreviewCollapsed ? 'w-0 p-0 overflow-hidden' : (isEditorCollapsed ? 'w-full' : 'flex-grow')}
                `}>
                    {isTemplateLoading ? (
                        <div className="text-center"><Loader2 className="w-12 h-12 text-primary-500 animate-spin" /><p className="dark:text-white mt-2">Applying template...</p></div>
                    ) : (
                        <div className="w-full max-w-[824px] shadow-2xl transition-opacity duration-300"><ResumePreview resume={resumeForPreview} template={activeTemplate.id} previewRef={previewRef} /></div>
                    )}
                </div>
                {/* Collapse/Expand Buttons */}
                <div className={`
                    hidden md:flex flex-col gap-2 absolute top-1/2 -translate-y-1/2 z-20
                    transition-all duration-500 ease-in-out
                    ${isEditorCollapsed ? 'left-0' : (isPreviewCollapsed ? 'right-0' : 'left-1/3')}
                    ${isEditorCollapsed ? '' : (isPreviewCollapsed ? '' : 'md:left-2/5 lg:left-1/3')}
                `}>
                    <button onClick={() => setIsEditorCollapsed(!isEditorCollapsed)} disabled={isPreviewCollapsed} title={editorToggleTitle} className="h-12 w-6 bg-white dark:bg-gray-700 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                        {isEditorCollapsed ? <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" /> : <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />}
                    </button>
                    {viewMode === 'edit' && (
                        <button onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)} disabled={isEditorCollapsed} title={isPreviewCollapsed ? 'Show Preview' : 'Hide Preview'} className="h-12 w-6 bg-white dark:bg-gray-700 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                            {isPreviewCollapsed ? <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" /> : <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="flex-grow flex flex-col md:hidden overflow-y-auto">
                <div className="p-2 bg-gray-200 dark:bg-gray-800/50 flex justify-center border-b border-gray-300 dark:border-gray-700 sticky top-16 z-10">
                    <div className="flex items-center gap-1 p-1 bg-gray-300 dark:bg-gray-700 rounded-full">
                        <button onClick={() => setViewMode('edit')} className={`px-4 py-1 text-sm font-semibold rounded-full ${viewMode === 'edit' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'} disabled:cursor-not-allowed disabled:opacity-50`} disabled={isGuestMode}>Edit</button>
                        <button onClick={() => setViewMode('preview')} className={`px-4 py-1 text-sm font-semibold rounded-full ${viewMode === 'preview' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Preview</button>
                    </div>
                </div>
                {viewMode === 'preview' && (
                    <div className="p-4 bg-white dark:bg-gray-800 flex-shrink-0">
                        <div className="flex items-center gap-1 p-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
                            <button onClick={() => setDesignTab('template')} className={`flex-grow justify-center flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-full ${designTab === 'template' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><Palette size={16}/> Template</button>
                            {/* FIX: Renamed Type to TypeIcon to avoid name collision */}
                            <button onClick={() => setDesignTab('design')} className={`flex-grow justify-center flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-full ${designTab === 'design' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><TypeIcon size={16}/> Design</button>
                        </div>
                        {designTab === 'template' && (
                            <div className="flex gap-3 overflow-x-auto pb-3 -mb-3">
                                {TEMPLATES.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleTemplateSelect(template)}
                                        className={`group flex flex-col flex-shrink-0 w-1/3 sm:w-1/4 border-2 rounded-lg overflow-hidden bg-white dark:bg-gray-800 ${
                                            activeTemplate.id === template.id ? 'border-primary-500' : 'border-gray-200 dark:border-gray-600'
                                        }`}
                                    >
                                        <div className="font-semibold text-gray-700 dark:text-gray-200 text-xs p-1 px-2 text-left border-b border-gray-200 dark:border-gray-700 truncate">
                                            {template.name}
                                        </div>
                                        <div className="w-full aspect-[3/4] bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-80 p-1 flex-grow shadow-inner">
                                            <span className="text-sm font-bold text-white/60 tracking-wide break-all text-center">
                                                {template.name}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {designTab === 'design' && ( /* Mobile Design Controls */ <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Theme Color</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {activeTemplate.availableColors.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => handleDesignChange({ themeColor: color })}
                                                className={`w-9 h-9 rounded-full flex items-center justify-center ${resume.themeColor === color ? 'ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-gray-800' : ''}`}
                                                style={{ backgroundColor: color }}
                                            >
                                                {resume.themeColor === color && <Check size={16} className="text-white mix-blend-difference" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Other design controls can go here */}
                            </div>)}
                    </div>
                )}
                {viewMode === 'edit' && !isGuestMode ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900"><ResumeForm resume={resume} onChange={handleResumeChange} tempPhoto={tempPhoto} setTempPhoto={setTempPhoto} isReadOnly={isGuestMode} /></div>
                ) : (
                    <div className="p-4 bg-gray-200 dark:bg-gray-950 flex-grow">
                        {isTemplateLoading ? (
                            <div className="text-center py-20"><Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" /><p className="dark:text-white mt-2">Applying template...</p></div>
                        ) : (
                            <div className="shadow-2xl"><ResumePreview resume={resumeForPreview} template={activeTemplate.id} previewRef={previewRef} /></div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Editor;