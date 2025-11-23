
import React, { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { useResumes } from '../hooks/useResumes';
import { ResumeData, TemplateId, TemplateInfo, WebsiteLink } from '../types';
import ResumeForm from '../components/ResumeForm';
import ResumePreview from '../components/ResumePreview';
import GoogleTranslateWidget from '../components/GoogleTranslateWidget';
import ThemeToggle from '../components/ThemeToggle';
import { TEMPLATES } from '../templates';
import { createNewResume, FONTS, EXPORT_OPTIONS, SUPPORTED_LANGUAGES } from '../constants';
import { ArrowLeft, Download, Eye, Code, Palette, Type as TypeIcon, Loader2, ChevronDown, FileText, Image as ImageIcon, Edit as EditIcon, MoreVertical, Sun, Moon, Sparkles, ChevronLeft, ChevronRight, X as XIcon, Info, FileInput, Check, Share2, Languages, PenTool } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../App';
import { trackUsage } from '../services/trackingService';
import { useTheme } from '../contexts/ThemeContext';
import AlertModal from '../components/AlertModal';
import ConfirmationModal from '../components/ConfirmationModal';
import FeedbackModal from '../components/FeedbackModal';
import { translateResumeContent } from '../services/translationService';
import { useTranslation } from 'react-i18next';
import IconPicker from '../components/IconPicker';

const TemplateThumbnail: React.FC<{ resume: ResumeData; template: TemplateInfo; }> = React.memo(({ resume, template }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.2);

    useLayoutEffect(() => {
        const calculateScale = () => {
            if (containerRef.current) {
                const parentWidth = containerRef.current.offsetWidth;
                const originalWidth = 824; 
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

interface EditorProps {
    resumeId?: string;
    initialData?: ResumeData;
    isShared?: boolean;
    onSharedUpdate?: (data: Partial<ResumeData>) => void;
}

const Editor: React.FC<EditorProps> = ({ resumeId, initialData, isShared = false, onSharedUpdate }) => {
  const { getResumeById, updateResume, addTranslatedResume, isLoading: isResumeLoading } = useResumes();
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<TemplateInfo>(TEMPLATES[0]);
  
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [activeTab, setActiveTab] = useState<'content' | 'template' | 'design'>('content');
  
  const [sidebarMode, setSidebarMode] = useState<'closed' | 'standard' | 'expanded'>('standard');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const previewRef = useRef<HTMLDivElement>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '' });
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isSignupPromptOpen, setIsSignupPromptOpen] = useState(false);
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [isDesktopDownloadMenuOpen, setIsDesktopDownloadMenuOpen] = useState(false);
  const [isMobileMoreMenuOpen, setIsMobileMoreMenuOpen] = useState(false);
  const desktopDownloadMenuRef = useRef<HTMLDivElement>(null);
  const mobileMoreMenuRef = useRef<HTMLDivElement>(null);

  const [optimizationJob, setOptimizationJob] = useState<{title: string, description: string} | null>(null);
  const [isTranslateMenuOpen, setIsTranslateMenuOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // State for translation confirmation
  const [translateModal, setTranslateModal] = useState<{ isOpen: boolean; langCode: string; langName: string }>({
    isOpen: false,
    langCode: '',
    langName: '',
  });

  const sampleResumeForPreview = useMemo(() => createNewResume(), []); 

  useEffect(() => {
    const handleResize = () => {
        setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
      if (activeTab !== 'content' && sidebarMode === 'expanded') {
          setSidebarMode('standard');
      }
  }, [activeTab, sidebarMode]);

  const handleSidebarResize = (direction: 'left' | 'right') => {
      if (direction === 'left') {
          if (sidebarMode === 'expanded') setSidebarMode('standard');
          else if (sidebarMode === 'standard') setSidebarMode('closed');
      } else {
          if (sidebarMode === 'closed') setSidebarMode('standard');
          else if (sidebarMode === 'standard' && activeTab === 'content') setSidebarMode('expanded');
      }
  };

  const sidebarWidth = useMemo(() => {
      if (!isDesktop) return '100%';
      switch (sidebarMode) {
          case 'closed': return '0px';
          case 'expanded': return 'calc(100% - 2rem)';
          default: return '450px';
      }
  }, [isDesktop, sidebarMode]);

  useEffect(() => {
    if (!isShared && sessionStorage.getItem('isFirstResume') === 'true') {
        setShowCelebration(true);
        sessionStorage.removeItem('isFirstResume');
        setTimeout(() => {
            setShowCelebration(false);
        }, 4000); 
    }
     const jobDescription = sessionStorage.getItem('jobDescriptionForOptimization');
    const jobTitle = sessionStorage.getItem('jobTitleForOptimization');
    if (jobDescription && jobTitle) {
        setOptimizationJob({ title: jobTitle, description: jobDescription });
    }
  }, [isShared]);

  useEffect(() => {
    // Logic for Shared/Public Mode
    if (isShared && initialData) {
        setResume(initialData);
        const initialTemplate = TEMPLATES.find(t => t.id === initialData.templateId) || TEMPLATES[0];
        setActiveTemplate(initialTemplate);
        setIsGuestMode(false); 
        return;
    }

    // Logic for Guest Mode
    if (resumeId === 'guest') {
        setIsGuestMode(true);
        const guestResumeJson = localStorage.getItem('guestResume');
        if (guestResumeJson) {
            const guestResume = JSON.parse(guestResumeJson);
            setResume(guestResume);
            const initialTemplate = TEMPLATES.find(t => t.id === guestResume.templateId) || TEMPLATES[0];
            setActiveTemplate(initialTemplate);
            setViewMode('preview'); 
        } else {
            navigate('/demo');
        }
        return;
    }

    // Logic for Authenticated User Mode
    setIsGuestMode(false);
    if (!isResumeLoading && resumeId) {
      const loadedResume = getResumeById(resumeId);
      if (loadedResume) {
        setResume(loadedResume);
        const initialTemplate = TEMPLATES.find(t => t.id === loadedResume.templateId) || TEMPLATES[0];
        setActiveTemplate(initialTemplate);
      }
    }
  }, [resumeId, getResumeById, isResumeLoading, isShared, initialData]);

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
    if (isGuestMode && !isShared) { 
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

      if (isShared && onSharedUpdate) {
          onSharedUpdate(updatedData);
      } else if (isGuestMode) {
        localStorage.setItem('guestResume', JSON.stringify(newResumeState));
      } else {
        updateResume(resume.id, updatedData);
      }
    }
  }, [resume, updateResume, isGuestMode, isShared, onSharedUpdate]);
  
  const handleDesignChange = (updatedData: Partial<ResumeData>) => {
    handleResumeChange(updatedData);
  };
  
  const handleCustomIconChange = (key: 'email' | 'phone' | 'location', iconId: string) => {
      if (!resume) return;
      handleResumeChange({
          customIcons: {
              ...resume.customIcons,
              [key]: iconId
          }
      });
  };

  const handleSocialIconChange = (index: number, iconId: string) => {
      if (!resume) return;
      const newWebsites = [...resume.websites];
      newWebsites[index] = { ...newWebsites[index], icon: iconId };
      handleResumeChange({ websites: newWebsites });
  };
  
  const handleFocusField = useCallback((fieldId: string) => {
      setActiveTab('content');
      if (isDesktop && sidebarMode === 'closed') {
          setSidebarMode('standard');
      }
      if (!isDesktop && viewMode === 'preview') {
          setViewMode('edit');
      }
      setTimeout(() => {
          const element = document.getElementById(fieldId);
          if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.focus();
              element.classList.add('ring-2', 'ring-primary-500', 'ring-offset-2', 'bg-primary-50', 'dark:bg-primary-900/20');
              setTimeout(() => {
                  element.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2', 'bg-primary-50', 'dark:bg-primary-900/20');
              }, 2000);
          }
      }, 300);
  }, [isDesktop, sidebarMode, viewMode]);

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

  // --- Translation Logic ---
  const openTranslateConfirmation = (langCode: string) => {
      if (!resume || isGuestMode || isShared) {
          if(isGuestMode) setIsSignupPromptOpen(true);
          return;
      }
      const langName = SUPPORTED_LANGUAGES.find(l => l.code === langCode)?.nativeName || langCode;
      setTranslateModal({ isOpen: true, langCode, langName });
      setIsTranslateMenuOpen(false);
  };

  const handleConfirmTranslate = async () => {
      const { langCode, langName } = translateModal;
      setTranslateModal({ ...translateModal, isOpen: false });
      
      if (!resume) return;

      setIsTranslating(true);
      try {
          const translatedData = await translateResumeContent(resume, langCode);
          
          // Create a new resume document with the translated content using dedicated function
          await addTranslatedResume(translatedData, `${resume.title} (${langName})`);
          
          // Switch UI language
          i18n.changeLanguage(langCode);
          
      } catch (error: any) {
          console.error(error);
          setAlertState({ isOpen: true, title: 'Translation Failed', message: 'Could not translate resume. Please try again later.' });
      } finally {
          setIsTranslating(false);
      }
  };

  const handleExport = async (optionId: string) => {
    if (handleGuestAction('download')) return;
    if (!resume) return;

    setIsDesktopDownloadMenuOpen(false);
    setIsMobileMoreMenuOpen(false);
    setIsExporting(true);

    const formatName = EXPORT_OPTIONS.find(opt => opt.id === optionId)?.name || optionId;
    setExportProgress(`Generating ${formatName}...`);

    try {
        const canUseBackend = currentUser && !isShared; 

        if (optionId === 'pdf' && canUseBackend) {
            setExportProgress('Generating high-quality PDF...');
            
            const token = await currentUser.getIdToken();
            const projectId = 'jastalk-firebase'; 
            const functionUrl = `https://us-west1-${projectId}.cloudfunctions.net/generateResumePdfHttp`;
            
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    resumeData: resume, 
                    templateId: resume.templateId 
                })
            });

            if (!response.ok) {
                throw new Error(`Backend generation failed.`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const sanitizedTitle = resume.title.replace(/[^a-zA-Z0-9]/g, '_');
            link.download = `${sanitizedTitle}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            if (!isGuestMode && !isShared) {
                setIsFeedbackModalOpen(true);
            }

        } else {
            const elementToCapture = previewRef.current;
            if (!elementToCapture) throw new Error("Preview element not found");
            
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(elementToCapture, { scale: 3, useCORS: true });

            if (optionId === 'pdf') {
                 const { jsPDF } = await import('jspdf');
                 const imgData = canvas.toDataURL('image/png');
                 const pdf = new jsPDF('p', 'mm', 'a4');
                 const pdfWidth = pdf.internal.pageSize.getWidth();
                 const pdfHeight = pdf.internal.pageSize.getHeight();
                 const imgProps = pdf.getImageProperties(imgData);
                 const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
                 
                 pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
                 const sanitizedTitle = resume.title.replace(/[^a-zA-Z0-9]/g, '_');
                 pdf.save(`${sanitizedTitle}.pdf`);
            } else {
                // Image export logic
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
        setAlertState({ 
            isOpen: true, 
            title: 'Export Failed', 
            message: "Sorry, something went wrong during the export process. Please try again." 
        });
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

  // Loading state check
  if (!resume && (!isShared && !isGuestMode)) {
    return <div className="flex justify-center items-center h-screen dark:text-white">Loading Resume...</div>;
  }
  if (!resume) return null;
  
  const resumeForPreview = tempPhoto ? {
    ...resume,
    personalDetails: { ...resume.personalDetails, photo: tempPhoto }
  } : resume;

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
            message="Please sign up or log in to save, download, and translate your resume."
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
       <ConfirmationModal
          isOpen={translateModal.isOpen}
          title="Translate Resume"
          message={`We will create a new copy of your resume in ${translateModal.langName}. Your original version will be saved.`}
          onConfirm={handleConfirmTranslate}
          onCancel={() => setTranslateModal({ ...translateModal, isOpen: false })}
          confirmText="Translate & Copy"
      />
        {(isExporting || isTranslating) && (
             <div className="fixed inset-0 bg-black/60 z-[101] flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
                    <p className="mt-4 font-semibold">
                        {isTranslating ? 'Translating Resume Content...' : exportProgress}
                    </p>
                </div>
            </div>
        )}

      <header className="relative flex-shrink-0 bg-white dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-40">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            {!isShared && (
                <a href="#/" title="Back to Dashboard" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <ArrowLeft size={20} />
                </a>
            )}
            {isShared ? (
                <div className="flex items-center gap-2">
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <Share2 size={12} /> Shared Editor
                    </div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">{resume.title}</h1>
                </div>
            ) : (
                <input type="text" value={resume.title} onChange={e => handleResumeChange({ title: e.target.value })} className="text-lg font-bold bg-transparent focus:outline-none focus:ring-1 focus:ring-primary-500 rounded-md px-2 py-1 -ml-2" />
            )}
          </div>
          <div className="flex items-center gap-2">
             {/* Translate Menu */}
             {!isShared && (
                 <div className="relative">
                    <button 
                        onClick={() => setIsTranslateMenuOpen(!isTranslateMenuOpen)}
                        className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-2 px-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                    >
                        <Languages size={16} /> Translate
                    </button>
                    {isTranslateMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border dark:border-gray-700 max-h-96 overflow-y-auto">
                            <div className="p-2 border-b dark:border-gray-700">
                                <p className="text-xs font-bold text-gray-500 uppercase px-2">Translate Content To:</p>
                            </div>
                            {SUPPORTED_LANGUAGES.filter(l => l.code !== 'en').map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => openTranslateConfirmation(lang.code)}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                                >
                                    {lang.nativeName}
                                </button>
                            ))}
                        </div>
                    )}
                 </div>
             )}

             <div className="hidden md:block relative" ref={desktopDownloadMenuRef}>
                 <button 
                    onClick={() => setIsDesktopDownloadMenuOpen(!isDesktopDownloadMenuOpen)} 
                    className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-soft hover:bg-primary-700 transition-colors"
                >
                    <Download size={18} />
                    <span>{t('common.download')}</span>
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
                <ThemeToggle />
             </div>
             {/* ... Mobile Menu code can be here if needed ... */}
          </div>
        </div>
      </header>

      <div className="flex-grow flex overflow-hidden relative h-[calc(100vh-64px)]">
        <div 
            className={`
                flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
                h-full z-20 
                absolute md:relative
                transition-all duration-300 ease-in-out
                ${viewMode === 'edit' ? 'translate-x-0 w-full' : '-translate-x-full w-full'} 
                md:translate-x-0
                overflow-hidden
            `}
            style={{ width: sidebarWidth, minWidth: isDesktop && sidebarMode !== 'closed' ? '450px' : '0' }}
        >
          <div className="w-full h-full flex flex-col" style={{ minWidth: '450px' }}>
             
             <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                 <button onClick={() => setActiveTab('content')} className={`flex-1 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-colors ${activeTab === 'content' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                     <FileInput size={16} /> {t('editor.content')}
                 </button>
                 <button onClick={() => setActiveTab('template')} className={`flex-1 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-colors ${activeTab === 'template' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                     <Code size={16} /> {t('editor.template')}
                 </button>
                 <button onClick={() => setActiveTab('design')} className={`flex-1 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-colors ${activeTab === 'design' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                     <Palette size={16} /> {t('editor.design')}
                 </button>
             </div>

             <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'content' && (
                    <div className="animate-fade-in">
                        <ResumeForm resume={resume} onChange={handleResumeChange} tempPhoto={tempPhoto} setTempPhoto={setTempPhoto} isReadOnly={isGuestMode && !isShared}/>
                    </div>
                )}

                {activeTab === 'template' && (
                     <div className="grid grid-cols-2 gap-4 animate-fade-in">
                        {TEMPLATES.map(template => (
                            <div key={template.id} onClick={() => handleTemplateSelect(template)} className={`rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${activeTemplate.id === template.id ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'}`}>
                                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-600">
                                    <h3 className="text-sm font-semibold text-center">{template.name}</h3>
                                </div>
                                <div className="relative group">
                                    <TemplateThumbnail resume={sampleResumeForPreview} template={template} />
                                    {activeTemplate.id === template.id && (
                                        <div className="absolute inset-0 bg-primary-500/10 flex items-center justify-center">
                                            <div className="bg-primary-600 text-white rounded-full p-1 shadow-lg">
                                                <Check size={20} />
                                            </div>
                                        </div>
                                    )}
                                    {isTemplateLoading && activeTemplate.id === template.id && <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
                                </div>
                            </div>
                        ))}
                     </div>
                )}

                {activeTab === 'design' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700">
                            <label className="text-sm font-bold flex items-center gap-2 mb-4"><Palette size={16} className="text-primary-500"/> Theme Color</label>
                            <div className="flex flex-wrap gap-3">
                                {activeTemplate.availableColors.map(color => (
                                    <button 
                                        key={color} 
                                        onClick={() => handleDesignChange({ themeColor: color })} 
                                        className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${resume.themeColor === color ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent shadow-sm'}`} 
                                        style={{ backgroundColor: color }} 
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                         <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700">
                            <label className="text-sm font-bold flex items-center gap-2 mb-4"><TypeIcon size={16} className="text-primary-500"/> Typography</label>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Headings</span>
                                    <select value={resume.titleFont} onChange={e => handleDesignChange({ titleFont: e.target.value })} className="w-full p-2.5 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-2 focus:ring-primary-500">
                                        {FONTS.map(font => <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Body Text</span>
                                    <select value={resume.bodyFont} onChange={e => handleDesignChange({ bodyFont: e.target.value })} className="w-full p-2.5 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-2 focus:ring-primary-500">
                                        {FONTS.map(font => <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700">
                            <label className="text-sm font-bold flex items-center gap-2 mb-4"><PenTool size={16} className="text-primary-500"/> Iconography</label>
                            <div className="space-y-4">
                                <IconPicker 
                                    label="Email Icon" 
                                    selectedIcon={resume.customIcons?.email || 'mail'} 
                                    onSelect={(iconId) => handleCustomIconChange('email', iconId)}
                                />
                                <IconPicker 
                                    label="Phone Icon" 
                                    selectedIcon={resume.customIcons?.phone || 'phone'} 
                                    onSelect={(iconId) => handleCustomIconChange('phone', iconId)}
                                />
                                <IconPicker 
                                    label="Location Icon" 
                                    selectedIcon={resume.customIcons?.location || 'map-pin'} 
                                    onSelect={(iconId) => handleCustomIconChange('location', iconId)}
                                />
                                {resume.websites.length > 0 && (
                                    <div className="border-t dark:border-gray-600 pt-4">
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 block">Social Links Icons</span>
                                        {resume.websites.map((site, index) => (
                                            <div key={site.id} className="mb-4 pb-2 border-b border-dashed dark:border-gray-600 last:border-0">
                                                <IconPicker
                                                    label={site.label || 'Link Icon'}
                                                    selectedIcon={site.icon || 'link'}
                                                    onSelect={(iconId) => handleSocialIconChange(index, iconId)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
             </div>
          </div>
        </div>

        <div 
            className={`
                hidden md:flex flex-col absolute top-1/2 -translate-y-1/2 z-30
                shadow-md rounded-r-xl overflow-hidden border border-l-0 border-gray-200 dark:border-gray-700
                transition-all duration-300 ease-in-out
            `}
            style={{ left: sidebarWidth }}
        >
            <button 
                onClick={() => handleSidebarResize('right')}
                disabled={sidebarMode === 'expanded' || (sidebarMode === 'standard' && activeTab !== 'content')}
                className={`
                   w-8 h-10 flex items-center justify-center
                   bg-white dark:bg-gray-800 
                   text-gray-500 dark:text-gray-400
                   hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500
                   border-b border-gray-200 dark:border-gray-700
                   transition-colors
                `}
                title="Expand Content"
            >
                <ChevronRight size={20} />
            </button>
            <button 
                onClick={() => handleSidebarResize('left')}
                disabled={sidebarMode === 'closed'}
                className={`
                   w-8 h-10 flex items-center justify-center
                   bg-white dark:bg-gray-800 
                   text-gray-500 dark:text-gray-400
                   hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500
                   transition-colors
                `}
                title="Collapse Sidebar"
            >
                <ChevronLeft size={20} />
            </button>
        </div>

        <div className={`
            flex-1 h-full bg-gray-100 dark:bg-gray-900/50 relative
            ${viewMode === 'preview' ? 'block' : 'hidden md:block'}
            overflow-y-auto custom-scrollbar
        `}>
           <div className="min-h-full w-full flex justify-center items-start p-8 md:p-12">
                 <div className="w-full max-w-[210mm] shadow-2xl origin-top transition-all duration-300 bg-white">
                   <ResumePreview resume={resumeForPreview} template={resume.templateId} previewRef={previewRef} onUpdate={handleResumeChange} onFocus={handleFocusField} />
                </div>
            </div>
        </div>
        {optimizationJob && <OptimizationPanel />}
      </div>
    </div>
  );
};

export default Editor;
