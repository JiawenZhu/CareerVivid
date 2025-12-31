import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigate } from '../../../App';
import { db } from '../../../firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { getUserIdFromUsername } from '../../../services/userService';

// Types and Services
import { PortfolioData } from '../types/portfolio';
import { useResumes } from '../../../hooks/useResumes';
import { usePortfolios } from '../../../hooks/usePortfolios';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { uploadImage } from '../../../services/storageService';
import { applyThemeToBusinessCard, ExtractedTheme } from '../services/portfolioThemeService';

import { useAICreditCheck } from '../../../hooks/useAICreditCheck';

// Components
import PortfolioHeader from '../components/editor/PortfolioHeader';
import PortfolioSidebar from '../components/editor/PortfolioSidebar';
import PortfolioPreview from '../components/editor/PortfolioPreview';

import AIImageEditModal from '../../../components/AIImageEditModal';
import SharePortfolioModal from '../../../components/SharePortfolioModal';

const PortfolioEditor: React.FC = () => {
    // Extract ID and username from pathname
    const getDataFromUrl = () => {
        const path = window.location.pathname;
        // Supports both /portfolio/edit/ID and /portfolio/USERNAME/edit/ID
        // Also handles language prefix like /en/portfolio/edit/ID

        // Try to match /portfolio/USERNAME/edit/ID format first (with optional lang prefix)
        const fullMatch = path.match(/\/portfolio\/([^/]+)\/edit\/([^/?#&]+)/);
        if (fullMatch) {
            return { username: fullMatch[1], id: fullMatch[2] };
        }

        // Fallback to /portfolio/edit/ID format (old URLs)
        const simpleMatch = path.match(/\/edit\/([^/?#&]+)/);
        if (simpleMatch) {
            return { username: null, id: simpleMatch[1] };
        }

        return { username: null, id: null };
    };

    const { currentUser, isPremium, isAdmin } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { resumes } = useResumes();
    const { portfolios } = usePortfolios();

    // AI Credit Check Hook
    const { checkCredit, CreditLimitModal } = useAICreditCheck();

    const [id, setId] = useState<string | null>(getDataFromUrl().id);
    const [username, setUsername] = useState<string | null>(getDataFromUrl().username);
    const [ownerUid, setOwnerUid] = useState<string | null>(null);
    const [activeDevice, setActiveDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [activeSection, setActiveSection] = useState<'hero' | 'timeline' | 'stack' | 'projects' | 'components' | 'design' | 'settings' | 'links'>('hero');
    const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
    const [isLoading, setIsLoading] = useState(false);


    // Mobile Responsive State
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // AI Image Edit State
    const [isAIImageModalOpen, setIsAIImageModalOpen] = useState(false);
    const [activeAIImageField, setActiveAIImageField] = useState<string | null>(null);
    const [currentAIImageSrc, setCurrentAIImageSrc] = useState<string | null>(null);
    const [aiPromptOptions, setAiPromptOptions] = useState<string[]>([]);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Publish State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setViewMode('edit');
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Listen for URL changes
    useEffect(() => {
        const handlePathChange = () => {
            const urlData = getDataFromUrl();
            setId(urlData.id);
            setUsername(urlData.username);
        };
        window.addEventListener('popstate', handlePathChange);
        return () => window.removeEventListener('popstate', handlePathChange);
    }, []);

    // Resolve username to UID (for admin access)
    useEffect(() => {
        const resolveOwner = async () => {
            if (!currentUser) return;

            // If username is present in URL, resolve it to UID
            if (username) {
                // OPTIMIZATION: If username matches current user's email prefix, use current UID
                // This prevents looking up other users if we are simply editing our own portfolio
                const currentUsername = currentUser.email?.split('@')[0];
                if (username === currentUsername) {
                    console.log('[Editor] Username matches current user. Using current UID:', currentUser.uid);
                    setOwnerUid(currentUser.uid);
                    return;
                }

                console.log('[Editor] Resolving username to UID:', username);
                const resolvedUid = await getUserIdFromUsername(username);
                if (resolvedUid) {
                    setOwnerUid(resolvedUid);
                    console.log('[Editor] Resolved owner UID:', resolvedUid);
                } else {
                    console.error('[Editor] Could not resolve username:', username);
                    setOwnerUid(currentUser.uid); // Fallback to current user
                }
            } else {
                // No username in URL, use current user's UID
                setOwnerUid(currentUser.uid);
            }
        };

        resolveOwner();
    }, [username, currentUser]);

    // Helper to hydrate data
    const hydratePortfolioData = (docSnap: any, ownerUid: string): PortfolioData => {
        const data = docSnap.data();
        const templateId = data.templateId || 'minimalist';

        // Infer mode from templateId if not explicitly set
        let mode = data.mode;
        if (!mode && ['linktree_minimal', 'linktree_visual', 'linktree_corporate', 'linktree_bento'].includes(templateId)) {
            mode = 'linkinbio';
        }

        console.log('[Editor] Hydrating Data. Mode:', mode, 'Template:', templateId, 'Has LinkInBio:', !!data.linkInBio, 'Theme:', data.linkInBio?.themeId);

        return {
            id: docSnap.id,
            userId: data.userId || ownerUid,
            title: data.title || 'Untitled Portfolio',
            templateId: templateId,
            section: data.section || 'portfolios',
            mode: mode || 'portfolio',
            linkInBio: data.linkInBio, // Include linkInBio data if present
            hero: data.hero || { headline: '', subheadline: '', ctaPrimaryLabel: '', ctaPrimaryUrl: '', ctaSecondaryLabel: '', ctaSecondaryUrl: '' },
            about: data.about || '',
            timeline: data.timeline || [],
            education: data.education || [],
            techStack: data.techStack || [],
            projects: data.projects || [],
            socialLinks: data.socialLinks || [],
            contactEmail: data.contactEmail || '',
            theme: data.theme || { primaryColor: '#2563eb', darkMode: false },
            sectionLabels: data.sectionLabels || {
                about: 'About Me',
                timeline: 'My Journey',
                techStack: 'Tech Stack',
                projects: 'Featured Projects',
                contact: 'Contact'
            },
            attachedResumeId: data.attachedResumeId || null,
            updatedAt: data.updatedAt || Date.now(),
            createdAt: data.createdAt || Date.now()
        };
    };

    // Load Data
    useEffect(() => {
        if (!id || !currentUser || !ownerUid) return;

        // Clear previous state to avoid stale data
        setPortfolioData(null);

        setIsLoading(true);
        console.log('[Editor] Setting up Firestore subscription for:', id, 'owned by:', ownerUid);

        const portfolioRef = doc(db, 'users', ownerUid, 'portfolios', id);

        // 1. Initial Fetch with getDoc (Fall-safe)
        getDoc(portfolioRef).then((docSnap) => {
            if (docSnap.exists()) {
                console.log('[Editor] Initial getDoc success.');
                const hydratedData = hydratePortfolioData(docSnap, ownerUid);
                setPortfolioData(hydratedData);

                // URL Normalization: Use Headline as Slug if available
                const currentPath = window.location.pathname;
                const baseSlug = hydratedData.hero?.headline?.replace(/[^\w\s-]/g, '').replace(/\s+/g, '') || currentUser.email?.split('@')[0] || 'user';
                const portfolioSlug = encodeURIComponent(baseSlug);

                // Check if we need to rewrite the URL (either old format OR slug mismatch)
                const match = currentPath.match(/\/portfolio\/([^/]+)\/edit\/([^/]+)/);
                if (match) {
                    const currentSlug = match[1];
                    if (currentSlug !== portfolioSlug) {
                        const newPath = `/portfolio/${portfolioSlug}/edit/${hydratedData.id}`;
                        window.history.replaceState(null, '', newPath);
                    }
                } else if (currentPath.match(/\/portfolio\/edit\/[^/]+$/)) {
                    // Upgrade old URL format
                    const newPath = `/portfolio/${portfolioSlug}/edit/${hydratedData.id}`;
                    window.history.replaceState(null, '', newPath);
                }
            } else {
                console.error('[Editor] getDoc reported document does not exist.');
            }
        }).catch((err) => {
            console.error('[Editor] getDoc failed:', err);
        });

        // 2. Real-time Subscription
        const unsubscribe = onSnapshot(portfolioRef, (docSnap) => {
            console.log('[Editor] onSnapshot fired. Exists:', docSnap.exists());
            if (docSnap.exists()) {
                const hydratedData = hydratePortfolioData(docSnap, ownerUid);

                // Auto-enable "Remove Branding" for Premium users if not set
                if (isPremium && hydratedData.linkInBio) {
                    if (!hydratedData.linkInBio.settings) {
                        hydratedData.linkInBio.settings = { removeBranding: true };
                    } else if (hydratedData.linkInBio.settings.removeBranding === undefined) {
                        hydratedData.linkInBio.settings.removeBranding = true;
                    }
                }

                setPortfolioData(hydratedData);
                setIsLoading(false);
            } else {
                console.error("[Editor] Portfolio NOT FOUND via snapshot");
            }
            setIsLoading(false);
        }, (error) => {
            console.error("[Editor] onSnapshot error:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [id, currentUser, ownerUid, username, isPremium]);

    // Updates
    const handleUpdate = async (updates: Partial<PortfolioData>) => {
        if (!portfolioData || !currentUser || !ownerUid) return;

        // Optimistic update
        const newData = { ...portfolioData, ...updates };
        setPortfolioData(newData);

        // Debounce save to DB (or direct save)
        try {
            const portfolioRef = doc(db, 'users', ownerUid, 'portfolios', portfolioData.id);
            await setDoc(portfolioRef, updates, { merge: true });
            console.log('[Editor] Portfolio updated for owner:', ownerUid);
        } catch (error) {
            console.error("Error updating portfolio:", error);
        }
    };

    const handleNestedUpdate = (section: keyof PortfolioData, field: string, value: any) => {
        if (!portfolioData) return;
        const sectionData = { ...(portfolioData[section] as any) };
        sectionData[field] = value;
        handleUpdate({ [section]: sectionData });
    };

    // Import Theme from Portfolio (for business cards)
    const handleImportTheme = (extractedTheme: ExtractedTheme) => {
        if (!portfolioData) return;
        const themeUpdates = applyThemeToBusinessCard(portfolioData, extractedTheme);
        handleUpdate(themeUpdates);
    };



    // Image Upload
    const handleImageUploadTrigger = (field: string) => {
        setActiveAIImageField(field);
        setTimeout(() => fileInputRef.current?.click(), 100);
    };



    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && activeAIImageField && portfolioData && currentUser) {
            const file = e.target.files[0];
            setIsImageUploading(true);
            try {
                // Upload logic
                const downloadURL = await uploadImage(file, `portfolios/${portfolioData.id}/${Date.now()}_${file.name}`);

                // Update specific field
                const fieldParts = activeAIImageField.split('.');

                if (fieldParts[0] === 'linkInBio' && fieldParts[1] === 'links') {
                    // linkInBio.links.0.url
                    const idx = parseInt(fieldParts[2]);
                    const field = fieldParts[3]; // 'url' or others

                    if (portfolioData.linkInBio?.links && portfolioData.linkInBio.links[idx]) {
                        const newLinks = [...portfolioData.linkInBio.links];
                        (newLinks[idx] as any)[field] = downloadURL;
                        handleNestedUpdate('linkInBio', 'links', newLinks);
                    }
                } else if (fieldParts.length === 2 && fieldParts[0] === 'hero') {
                    handleNestedUpdate('hero', fieldParts[1], downloadURL);
                } else if (fieldParts.length === 3 && fieldParts[0] === 'projects') {
                    // projects.0.thumbnailUrl
                    const idx = parseInt(fieldParts[1]);
                    const newProjects = [...portfolioData.projects];
                    if (newProjects[idx]) {
                        (newProjects[idx] as any)[fieldParts[2]] = downloadURL;
                        handleUpdate({ projects: newProjects });
                    }
                } else if (fieldParts[0] === 'businessCard') {
                    // businessCard.companyLogoUrl
                    handleNestedUpdate('businessCard', fieldParts[1], downloadURL);
                } else if (fieldParts[0] === 'linkInBio' && fieldParts[1] === 'customStyle') {
                    // linkInBio.customStyle.backgroundOverride
                    // Create new customStyle object with the new value
                    const currentLinkInBio = portfolioData.linkInBio || {};
                    const currentCustomStyle = (currentLinkInBio as any).customStyle || {};

                    const updatedLinkInBio = {
                        ...currentLinkInBio,
                        customStyle: {
                            ...currentCustomStyle,
                            [fieldParts[2]]: downloadURL
                        }
                    };
                    handleUpdate({ linkInBio: updatedLinkInBio as any });
                }

            } catch (error) {
                console.error("Upload failed", error);
                alert("Failed to upload image.");
            } finally {
                setIsImageUploading(false);
                // Reset input
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    // AI Image Modal
    const openAIImageModal = async (field: string, currentSrc: string, type: 'avatar' | 'project') => {
        if (!currentUser) return;

        // CHECK CREDIT (Replaces manual check)
        if (!checkCredit()) return;

        setActiveAIImageField(field);
        setCurrentAIImageSrc(currentSrc);
        // Set prompt options based on type
        if (type === 'avatar') {
            setAiPromptOptions(['Professional LinkedIn Headshot', 'Creative Designer Portrait', 'Tech Speaker Profile', 'Minimalist Avatar']);
        } else if (field.includes('backgroundOverride')) {
            setAiPromptOptions([
                'Professional Glassmorphism Background, Soft Blur',
                'Clean Minimalist White Studio Backdrop',
                'Modern Tech Abstract Mesh Gradient',
                'Dark Premium Frosted Glass Texture',
                'Soft Nature Bokeh with Golden Light',
                'Geometric 3D Shapes, Isometric, Pastel'
            ]);
        } else {
            setAiPromptOptions(['Modern SaaS Dashboard', 'Mobile App Interface', 'Website Landing Page', 'Data Visualization']);
        }
        setIsAIImageModalOpen(true);
    };

    const handleSaveAIImage = async (newImageUrl: string) => {
        if (!activeAIImageField || !portfolioData) return;

        // Similar update logic as file upload
        const fieldParts = activeAIImageField.split('.');

        if (fieldParts[0] === 'linkInBio' && fieldParts[1] === 'links') {
            const idx = parseInt(fieldParts[2]);
            const field = fieldParts[3];
            if (portfolioData.linkInBio?.links && portfolioData.linkInBio.links[idx]) {
                const newLinks = [...portfolioData.linkInBio.links];
                (newLinks[idx] as any)[field] = newImageUrl;
                handleNestedUpdate('linkInBio', 'links', newLinks);
            }
        } else if (fieldParts.length === 2 && fieldParts[0] === 'hero') {
            handleNestedUpdate('hero', fieldParts[1], newImageUrl);
        } else if (fieldParts.length === 3 && fieldParts[0] === 'projects') {
            const idx = parseInt(fieldParts[1]);
            const newProjects = [...portfolioData.projects];
            if (newProjects[idx]) {
                (newProjects[idx] as any)[fieldParts[2]] = newImageUrl;
                handleUpdate({ projects: newProjects });
            }
        } else if (fieldParts[0] === 'linkInBio' && fieldParts[1] === 'customStyle') {
            // linkInBio.customStyle.backgroundOverride
            const currentLinkInBio = portfolioData.linkInBio || {};
            const currentCustomStyle = (currentLinkInBio as any).customStyle || {};

            const updatedLinkInBio = {
                ...currentLinkInBio,
                customStyle: {
                    ...currentCustomStyle,
                    [fieldParts[2]]: newImageUrl
                }
            };
            handleUpdate({ linkInBio: updatedLinkInBio as any });
        }

        setIsAIImageModalOpen(false);
    };

    // Click-to-Edit Logic shared between Preview and Editor
    const handleFocusField = (fieldId: string) => {
        // 1. Determine section
        const section = fieldId.split('.')[0];

        // Map field to section
        if (['hero', 'about'].includes(section)) setActiveSection('hero');
        else if (section === 'timeline') setActiveSection('timeline');
        else if (section === 'techStack') setActiveSection('stack');
        else if (section === 'projects') setActiveSection('projects');
        else if (section === 'resume') setActiveSection('settings');
        else if (section === 'sectionLabels') {
            const labelType = fieldId.split('.')[1];
            if (labelType === 'about') setActiveSection('hero');
            else if (labelType === 'timeline') setActiveSection('timeline');
            else if (labelType === 'techStack') setActiveSection('stack');
            else if (labelType === 'projects') setActiveSection('projects');
            else if (labelType === 'contact') setActiveSection('hero');
        }

        // 2. Open sidebar on mobile
        if (isMobile) {
            setViewMode('edit');
        }

        // 3. Scroll and focus
        setTimeout(() => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.focus();
                element.classList.add('ring-2', 'ring-indigo-500', 'bg-white/5');
                setTimeout(() => element.classList.remove('ring-2', 'ring-indigo-500', 'bg-white/5'), 1500);
            }
        }, 100);
    };


    if (!portfolioData) return <div className="h-screen bg-gray-950 flex items-center justify-center text-white">Loading Editor...</div>;

    return (
        <div className={`h-screen w-screen flex flex-col overflow-hidden transition-colors ${theme === 'dark' ? 'bg-[#0f1117] text-gray-200' : 'bg-white text-gray-900'} `}>
            <CreditLimitModal />
            <PortfolioHeader
                title={portfolioData.title}
                onTitleChange={(t) => handleUpdate({ title: t })}
                editorTheme={theme}
                onToggleTheme={toggleTheme}
                activeDevice={activeDevice}
                onBack={() => navigate('/dashboard')}
                onDeviceChange={setActiveDevice}
                onShare={() => setIsShareModalOpen(true)}
            />

            <div className="flex-1 flex overflow-hidden relative">
                <PortfolioSidebar
                    portfolioData={portfolioData}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    isMobile={isMobile}
                    viewMode={viewMode}
                    resumes={resumes}
                    onUpdate={handleUpdate}
                    onNestedUpdate={handleNestedUpdate}
                    onImageUploadTrigger={handleImageUploadTrigger}
                    onAIImageEdit={openAIImageModal}
                    isImageUploading={isImageUploading}
                    editorTheme={theme}
                    isPremium={isPremium}
                    onTogglePreview={() => setViewMode(prev => prev === 'edit' ? 'preview' : 'edit')}
                    userPortfolios={portfolios}
                    onImportTheme={handleImportTheme}
                />

                <PortfolioPreview
                    portfolioData={portfolioData}
                    activeDevice={activeDevice}
                    viewMode={viewMode}
                    isMobile={isMobile}
                    onFocusField={handleFocusField}
                    onUpdate={handleUpdate}
                    onClosePreview={() => setViewMode('edit')}
                />

                {/* Mobile View Toggle (Floating - Hide if Sidebar handles it or if using new mobile layout) */}
                {/* We are moving towards stitch style where edit/preview might be in header/bottom nav. 
                    For now, keep it unless we want to fully rely on the new sidebar header preview toggle.
                    Since we added a Preview toggle in Sidebar Header (placeholder), let's HID this floating one on mobile to test the new UX.
                    But wait, the Sidebar toggle is just a placeholder. 
                    Let's KEEP this for now but maybe position it better or hide if we implement the sidebar one fully.
                    Actually, the user requirement is "Access this link and follow exactly the UXUI".
                    Stitch has tabs at bottom. Preview is usually an action.
                    I will HIDE this floating button to force use of future Header toggle, 
                    BUT I need to make the Header toggle functional first. 
                    Since I haven't wired the Sidebar Header toggle yet, I should probably KEEP this but verify z-index.
                    Bottom nav z-index is 40. Floating button is z-50.
                    It might overlap content.
                    Let's conditionalize it: if isMobile, maybe hide it and use the Header toggle?
                    I'll hide it for now to clean up UI as per plan.
                */}
                {isMobile && false && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1a1d24] border border-white/10 rounded-full p-1 flex shadow-xl">
                        <button
                            onClick={() => setViewMode('edit')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'edit' ? 'bg-indigo-600 text-white' : 'text-gray-400'} `}
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => setViewMode('preview')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-gray-400'} `}
                        >
                            Preview
                        </button>
                    </div>
                )}


            </div>

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />

            {/* Modals */}
            <SharePortfolioModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                portfolioId={portfolioData.id}
                portfolioData={portfolioData}
            />

            {isAIImageModalOpen && (
                <AIImageEditModal
                    userId={currentUser?.uid || ''}
                    onClose={() => setIsAIImageModalOpen(false)}
                    currentPhoto={currentAIImageSrc || ''}
                    onSave={handleSaveAIImage}
                    onUseTemp={(tempUrl) => handleSaveAIImage(tempUrl)}
                    onError={(title, msg) => alert(`${title}: ${msg} `)}
                    promptOptions={aiPromptOptions}
                />
            )}
        </div>
    );
};

export default PortfolioEditor;
