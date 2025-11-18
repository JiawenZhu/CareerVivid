import React, { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { useResumes } from '../hooks/useResumes';
import { ResumeData, TemplateId, TemplateInfo } from '../types';
import ResumeForm from '../components/ResumeForm';
import ResumePreview from '../components/ResumePreview';
import GoogleTranslateWidget from '../components/GoogleTranslateWidget';
import ThemeToggle from '../components/ThemeToggle';
import { TEMPLATES } from '../templates';
import { createNewResume, FONTS, UI_LANGUAGES, EXPORT_OPTIONS } from '../constants';
// FIX: Renamed Type to TypeIcon to avoid conflict with @google/genai's Type enum.
import { ArrowLeft, Download, Eye, Code, Palette, Type as TypeIcon, Check, PlusCircle, LogOut, Loader2, ChevronDown, FileText, Image as ImageIcon, Edit as EditIcon, MoreVertical, Sun, Moon, Sparkles, ChevronLeft, ChevronRight, X as XIcon, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../App';
import { trackUsage } from '../services/trackingService';
import { useTheme } from '../contexts/ThemeContext';
import AlertModal from '../components/AlertModal';
import ConfirmationModal from '../components/ConfirmationModal';
import FeedbackModal from '../components/FeedbackModal';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

// New component for rendering template thumbnails with correct scaling
const TemplateThumbnail: React.FC<{ resume: ResumeData; template: TemplateInfo; }> = React.memo(({ resume, template }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.2); // A reasonable default

    useLayoutEffect(() => {
        const calculateScale = () => {
            if (containerRef.current) {
                const parentWidth = containerRef.current.offsetWidth;
                const originalWidth = 824; // The "natural" width of the ResumePreview for styling
                if (parentWidth > 0) {
                    setScale(parentWidth / originalWidth);
                }
            }
        };
        calculateScale();
        const resizeObserver = new ResizeObserver(calculateScale);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        return () => resizeObserver.disconnect();
    }, []);

    const resumeForThumbnail: ResumeData = {
        ...resume,
        templateId: template.id,
        themeColor: template.availableColors[0] || '#000000',
    };

    return (
        <div ref={containerRef} className="w-full aspect-[210/297] overflow-hidden bg-gray-200 dark:bg-gray-700 relative group-hover:opacity-90 transition-opacity pointer-events-none">
            <div style={{
                position: 'absolute',
                width: '824px',
                height: '1165px',
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
            }}>
                <ResumePreview resume={resumeForThumbnail} template={template.id} />
            </div>
        </div>
    );
});


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

  const sampleResumeForPreview = useMemo(() => createNewResume(), []); // For thumbnails


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
            setExportProgress('Generating high-quality PDF...');
            const generatePdf = httpsCallable(functions, 'generateResumePdf');
            const result: any = await generatePdf({ resumeData: resume, templateId: resume.templateId });
            window.open(result.data.url, '_blank');
            if (!isGuestMode) {
                setIsFeedbackModalOpen(true);
            }
        } else {
            // Fallback to client-side image generation for non-PDF formats
            const elementToCapture = previewRef.current;
            if (!elementToCapture) throw new Error("Preview element not found");
            
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(elementToCapture, { scale: 3, useCORS: true });

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
                    link.download = `${resume.title.replace(/\s/g, '_')}_${aspectRatio.replace(':', 'x')}.png`;
                    link.href = dataUrl;
                    link.click();
                }
            } else { // Full PNG
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
        
    } catch (error: any) {
        console.error("Export failed:", error);
        const errorMessage = error.message && error.message.includes("internal")
            ? "Sorry, something went wrong during the PDF generation. Please ensure backend functions are deployed and try again."
            : "Sorry, something went wrong during the export process. Please try again.";
        setAlertState({ isOpen: true, title: 'Export Failed', message: errorMessage });
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
        message="Are you sure? Any unsaved changes to the current resume will be lost."
        onConfirm={handleConfirmNew}
        onCancel={() => setIsConfirmModalOpen(false)}
        confirmText="Create New"
      />
       <ConfirmationModal
            isOpen={isSignupPromptOpen}
            title="Sign Up to Continue"
            message="Please sign up or log in to save and download your resume. Your current work will be automatically imported after you sign up!"
            onConfirm={() => navigate('/auth')}
            onCancel={() => setIsSignupPromptOpen(false)}
            confirmText="Sign Up"
        />
       <AlertModal 
            isOpen={alertState.isOpen}
            title={alertState.title}
            message={alertState.message}
            onClose={() => setAlertState({ isOpen: false, title: '', message: '' })}
        />
        {isExporting && (
             <div className="fixed inset-0 bg-black/60 z-[101] flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
                    <p className="mt-4 font-semibold">{exportProgress}</p>
                </div>
            </div>
        )}

      <header className="flex-shrink-0 bg-white dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-20">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <a href="#/" title="Back to Dashboard" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <ArrowLeft size={20} />
            </a>
            <input type="text" value={resume.title} onChange={e => handleResumeChange({ title: e.target.value })} className="text-lg font-bold bg-transparent focus:outline-none focus:ring-1 focus:ring-primary-500 rounded-md px-2 py-1 -ml-2" />
          </div>
          <div className="flex items-center gap-2">
             {/* Desktop Controls */}
            <div className="hidden md:flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-2">
                <button onClick={() => setViewMode('edit')} className={`px-3 py-1.5 text-sm font-semibold rounded-md flex items-center gap-2 ${viewMode === 'edit' ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><EditIcon size={16}/> Edit</button>
                <button onClick={() => setViewMode('preview')} className={`px-3 py-1.5 text-sm font-semibold rounded-md flex items-center gap-2 ${viewMode === 'preview' ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><Eye size={16}/> Preview</button>
            </div>
            <div className="hidden md:block relative" ref={desktopDownloadMenuRef}>
                 <button 
                    onClick={() => setIsDesktopDownloadMenuOpen(!isDesktopDownloadMenuOpen)} 
                    className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-soft hover:bg-primary-700 transition-colors"
                >
                    <Download size={18} />
                    <span>Download</span>
                    <ChevronDown size={18} />
                </button>
                {isDesktopDownloadMenuOpen && (
                     <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border dark:border-gray-700">
                         <div className="py-1">
                            {EXPORT_OPTIONS.map(opt => (
                                 <button key={opt.id} onClick={() => handleExport(opt.id)} className="w-full text-left flex items-start gap-3 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                     {opt.id === 'pdf' ? <FileText className="mt-1" /> : <ImageIcon className="mt-1" />}
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
             <div className="hidden md:flex items-center gap-1">
                <GoogleTranslateWidget />
                <ThemeToggle />
             </div>
             {/* Mobile Controls */}
             <div className="md:hidden relative" ref={mobileMoreMenuRef}>
                <button onClick={() => setIsMobileMoreMenuOpen(!isMobileMoreMenuOpen)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <MoreVertical size={20} />
                </button>
                {isMobileMoreMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border dark:border-gray-700">
                        <div className="py-1">
                            <p className="px-4 py-2 text-xs text-gray-400">View Mode</p>
                             <button onClick={() => { setViewMode('edit'); setIsMobileMoreMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><EditIcon size={16}/> Edit</button>
                             <button onClick={() => { setViewMode('preview'); setIsMobileMoreMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><Eye size={16}/> Preview</button>
                             <div className="border-t my-1 dark:border-gray-600"></div>
                             <p className="px-4 py-2 text-xs text-gray-400">Download</p>
                             {EXPORT_OPTIONS.slice(0, 2).map(opt => ( // Only show PDF and PNG for mobile simplicity
                                <button key={opt.id} onClick={() => handleExport(opt.id)} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    {opt.id === 'pdf' ? <FileText size={16} /> : <ImageIcon size={16} />} {opt.name}
                                </button>
                             ))}
                             <div className="border-t my-1 dark:border-gray-600"></div>
                             <button onClick={() => { toggleTheme(); setIsMobileMoreMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                {theme === 'light' ? <Moon size={16}/> : <Sun size={16}/>} Toggle Theme
                            </button>
                        </div>
                    </div>
                )}
             </div>
          </div>
        </div>
      </header>

      <div className="flex-grow flex overflow-hidden relative">
        {/* Editor/Design Panel */}
        <div className={`
          flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
          overflow-y-auto transition-all duration-300 ease-in-out
          absolute md:relative h-full z-10 
          ${isEditorCollapsed ? 'w-0 -translate-x-full md:w-12' : 'w-full md:w-1/2 lg:w-[450px]'}
          ${viewMode === 'preview' && !isEditorCollapsed && 'w-full md:w-[350px]'}
        `}>
          <div className="p-4 flex flex-col h-full">
            {/* Collapse Toggle */}
            <button 
                onClick={() => setIsEditorCollapsed(!isEditorCollapsed)}
                className="absolute top-1/2 -right-4 translate-y-[-50%] z-20 w-8 h-16 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-r-lg hidden md:flex items-center justify-center"
                title={editorToggleTitle}
            >
                {isEditorCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <div className={`transition-opacity duration-200 ${isEditorCollapsed ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : ''}`}>
                 {isEditorCollapsed ? (
                    <div className="flex flex-col items-center gap-6 mt-4">
                         <button onClick={() => setDesignTab('template')} className={`p-2 rounded-full ${designTab === 'template' ? 'bg-primary-100 text-primary-600' : ''}`}><Code size={20} /></button>
                         <button onClick={() => setDesignTab('design')} className={`p-2 rounded-full ${designTab === 'design' ? 'bg-primary-100 text-primary-600' : ''}`}><Palette size={20} /></button>
                    </div>
                 ) : (
                    <>
                        {viewMode === 'edit' ? (
                            <div className="flex-grow overflow-y-auto pr-2">
                                <ResumeForm resume={resume} onChange={handleResumeChange} tempPhoto={tempPhoto} setTempPhoto={setTempPhoto} isReadOnly={isGuestMode}/>
                            </div>
                        ) : (
                            <div className="flex-grow">
                                <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
                                    <button onClick={() => setDesignTab('template')} className={`w-1/2 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 ${designTab === 'template' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}><Code size={16}/> Template</button>
                                    <button onClick={() => setDesignTab('design')} className={`w-1/2 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 ${designTab === 'design' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}><Palette size={16}/> Design</button>
                                </div>
                                {designTab === 'template' ? (
                                     <div className="grid grid-cols-2 gap-4">
                                        {TEMPLATES.map(template => (
                                            <div key={template.id} onClick={() => handleTemplateSelect(template)} className={`rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${activeTemplate.id === template.id ? 'border-primary-500' : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'}`}>
                                                <div className="p-2 bg-gray-50 dark:bg-gray-700/50">
                                                    <h3 className="text-sm font-semibold text-center">{template.name}</h3>
                                                </div>
                                                <div className="relative group">
                                                    <TemplateThumbnail resume={sampleResumeForPreview} template={template} />
                                                    {isTemplateLoading && activeTemplate.id === template.id && <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
                                                </div>
                                            </div>
                                        ))}
                                     </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-sm font-semibold flex items-center gap-2"><Palette size={16}/> Theme Color</label>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {activeTemplate.availableColors.map(color => (
                                                    <button key={color} onClick={() => handleDesignChange({ themeColor: color })} className={`w-8 h-8 rounded-full border-2 ${resume.themeColor === color ? 'border-primary-500' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                                                ))}
                                            </div>
                                        </div>
                                         <div>
                                            <label className="text-sm font-semibold flex items-center gap-2"><TypeIcon size={16}/> Title Font</label>
                                            <select value={resume.titleFont} onChange={e => handleDesignChange({ titleFont: e.target.value })} className="w-full mt-2 p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600">
                                                {FONTS.map(font => <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>)}
                                            </select>
                                        </div>
                                         <div>
                                            <label className="text-sm font-semibold flex items-center gap-2"><TypeIcon size={16}/> Body Font</label>
                                            <select value={resume.bodyFont} onChange={e => handleDesignChange({ bodyFont: e.target.value })} className="w-full mt-2 p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600">
                                                {FONTS.map(font => <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                 )}
            </div>
          </div>
        </div>

        {/* Resume Preview */}
        <div className={`
          flex-grow transition-all duration-300 ease-in-out
          flex items-center justify-center p-4 sm:p-8
          ${isPreviewCollapsed ? 'w-full' : (isEditorCollapsed ? 'w-full' : 'w-full md:w-1/2 lg:w-auto')}
        `}>
           <button 
                onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
                className="absolute top-1/2 -left-4 translate-y-[-50%] z-20 w-8 h-16 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-lg hidden md:flex items-center justify-center"
                title={isPreviewCollapsed ? 'Show Preview' : 'Expand Preview'}
            >
                {isPreviewCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
             <div className={`transition-transform duration-300 w-full max-w-[824px] ${isPreviewCollapsed ? 'scale-50' : ''}`}>
               <ResumePreview resume={resumeForPreview} template={resume.templateId} previewRef={previewRef} />
            </div>
        </div>
        {optimizationJob && <OptimizationPanel />}
      </div>
    </div>
  );
};

export default Editor;