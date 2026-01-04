import React, { useState, useEffect } from 'react';
import {
    User, Briefcase, Code, FolderGit2, Layers, Palette, FileText, Link as LinkIcon, ShoppingBag
} from 'lucide-react';
import { PortfolioData } from '../../types/portfolio';
import AppearanceControls from './AppearanceControls';
import LinksEditor from './LinksEditor';
import { LINKTREE_THEMES, LinkTreeTheme } from '../../styles/linktreeThemes';
import { saveCustomTheme, getUserThemes, deleteCustomTheme } from '../../services/themeService';
import { ExtractedTheme } from '../../services/portfolioThemeService';
import PromptModal from '../../../../components/PromptModal';
import AlertModal from '../../../../components/AlertModal';
import ConfirmationModal from '../../../../components/ConfirmationModal';

// Import New Sidebar Components
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarThemeSelector from './sidebar/SidebarThemeSelector';
import SidebarSectionNav from './sidebar/SidebarSectionNav';
import SidebarMobileNav from './sidebar/SidebarMobileNav';
import SidebarProfileEditor from './sidebar/SidebarProfileEditor';
import SidebarTimelineEditor from './sidebar/SidebarTimelineEditor';
import SidebarTechStackEditor from './sidebar/SidebarTechStackEditor';
import SidebarProjectsEditor from './sidebar/SidebarProjectsEditor';
import SidebarComponentsEditor from './sidebar/SidebarComponentsEditor';
import SidebarDesignEditor from './sidebar/SidebarDesignEditor';
import SidebarSettingsEditor from './sidebar/SidebarSettingsEditor';

interface PortfolioSidebarProps {
    portfolioData: PortfolioData;
    activeSection: 'hero' | 'timeline' | 'stack' | 'projects' | 'components' | 'design' | 'settings' | 'links' | 'commerce';
    setActiveSection: (section: 'hero' | 'timeline' | 'stack' | 'projects' | 'components' | 'design' | 'settings' | 'links' | 'commerce') => void;
    isMobile: boolean;
    viewMode: 'edit' | 'preview';
    resumes: any[];
    onUpdate: (data: Partial<PortfolioData>) => void;
    onNestedUpdate: (section: keyof PortfolioData, field: string, value: any) => void;
    onImageUploadTrigger: (field: string) => void;
    onAIImageEdit: (field: string, currentSrc: string, type: 'avatar' | 'project') => void;
    isImageUploading: boolean;
    editorTheme: 'light' | 'dark';
    isPremium: boolean;
    onTogglePreview?: () => void;
    userPortfolios?: PortfolioData[];
    onImportTheme?: (theme: ExtractedTheme) => void;
    onStockPhotoTrigger?: (field: string) => void;
}

const PortfolioSidebar: React.FC<PortfolioSidebarProps> = ({
    portfolioData,
    activeSection,
    setActiveSection,
    isMobile,
    viewMode,
    resumes,
    onUpdate,
    onNestedUpdate,
    onImageUploadTrigger,
    onAIImageEdit,
    isImageUploading,
    editorTheme,
    isPremium,
    onTogglePreview,
    userPortfolios,
    onImportTheme,
    onStockPhotoTrigger
}) => {

    const isLinkInBio = portfolioData.mode === 'linkinbio';

    const getSidebarSections = () => {
        if (portfolioData.mode === 'linkinbio') {
            return [
                { id: 'hero', icon: <User size={18} />, label: 'Profile' },
                { id: 'links', icon: <LinkIcon size={18} />, label: 'Links' },
                { id: 'design', icon: <Palette size={18} />, label: 'Design' },
                { id: 'settings', icon: <FileText size={18} />, label: 'Settings' }
            ];
        }
        if (portfolioData.mode === 'business_card') {
            return [
                { id: 'hero', icon: <User size={18} />, label: 'Card Details' },
                { id: 'design', icon: <Palette size={18} />, label: 'Design' },
                { id: 'settings', icon: <FileText size={18} />, label: 'Settings' }
            ];
        }
        return [
            { id: 'hero', icon: <User size={18} />, label: 'Hero' },
            { id: 'timeline', icon: <Briefcase size={18} />, label: 'Timeline' },
            { id: 'stack', icon: <Code size={18} />, label: 'Tech Stack' },
            { id: 'projects', icon: <FolderGit2 size={18} />, label: 'Projects' },
            { id: 'components', icon: <Layers size={18} />, label: 'Components' },
            { id: 'design', icon: <Palette size={18} />, label: 'Design' },
            { id: 'settings', icon: <FileText size={18} />, label: 'Files' }
        ];
    };

    const sections = getSidebarSections();

    const themeClasses = {
        sidebarBg: editorTheme === 'dark' ? 'bg-[#0f1117] border-white/5' : 'bg-white border-gray-200',
        sectionBorder: editorTheme === 'dark' ? 'border-white/5' : 'border-gray-200',
        cardBg: editorTheme === 'dark' ? 'bg-[#1a1d24] border-white/5' : 'bg-gray-50 border-gray-200',
        inputBg: editorTheme === 'dark' ? 'bg-[#1a1d24] border-white/10 text-white focus:border-indigo-500' : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500',
        inputBgDarker: editorTheme === 'dark' ? 'bg-[#0f1117] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900',
        textMuted: editorTheme === 'dark' ? 'text-gray-500' : 'text-gray-500',
        textMain: editorTheme === 'dark' ? 'text-white' : 'text-gray-900',
        placeholder: 'placeholder-gray-400'
    };

    // Determine current selection value
    const currentSelection = portfolioData.templateId === 'linktree_visual'
        ? (portfolioData.linkInBio?.themeId || 'linktree_visual')
        : portfolioData.templateId;

    // Custom Themes Logic
    const [userThemes, setUserThemes] = useState<LinkTreeTheme[]>([]);

    useEffect(() => {
        if (portfolioData.userId) {
            loadUserThemes();
        }
    }, [portfolioData.userId]);

    const loadUserThemes = async () => {
        try {
            const themes = await getUserThemes(portfolioData.userId);
            setUserThemes(themes);
        } catch (error) {
            console.error('Failed to load user themes', error);
        }
    };

    // Modal States
    const [isSaveThemeModalOpen, setIsSaveThemeModalOpen] = useState(false);
    const [isDeleteThemeModalOpen, setIsDeleteThemeModalOpen] = useState(false);
    const [themeToDelete, setThemeToDelete] = useState<string | null>(null);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });

    const handleSaveCustomThemeClick = () => {
        setIsSaveThemeModalOpen(true);
    };

    const handleConfirmSaveTheme = async (themeName: string) => {
        setIsSaveThemeModalOpen(false);
        if (!themeName) return;

        const currentThemeId = portfolioData.linkInBio?.themeId || 'air';
        const baseTheme = userThemes.find(t => t.id === currentThemeId) || LINKTREE_THEMES[currentThemeId] || LINKTREE_THEMES['air'];
        const customStyle = portfolioData.linkInBio?.customStyle || {};

        const newTheme: any = {
            name: themeName,
            category: 'minimal',
            colors: {
                ...baseTheme.colors,
                background: customStyle.backgroundOverride || baseTheme.colors.background,
                text: customStyle.profileTextColor || baseTheme.colors.text,
            },
            buttons: { ...baseTheme.buttons },
            fonts: {
                ...baseTheme.fonts,
                heading: customStyle.profileFontFamily || baseTheme.fonts.heading,
                body: customStyle.fontFamily || baseTheme.fonts.body
            },
            backgroundConfig: baseTheme.backgroundConfig || null
        };

        const sanitizedTheme = JSON.parse(JSON.stringify(newTheme));

        try {
            const savedTheme = await saveCustomTheme(portfolioData.userId, sanitizedTheme);
            await loadUserThemes();
            onUpdate({
                linkInBio: {
                    ...(portfolioData.linkInBio || {
                        links: [],
                        showSocial: true,
                        showEmail: true,
                        displayName: 'Your Name',
                        bio: 'Your Bio',
                        profileImage: '',
                        buttonLayout: 'stack'
                    }),
                    customStyle: null as any,
                    themeId: savedTheme.id
                }
            });
            setAlertModal({
                isOpen: true,
                title: 'Success',
                message: 'Theme saved and selected successfully!'
            });
        } catch (error) {
            console.error(error);
            setAlertModal({
                isOpen: true,
                title: 'Error',
                message: 'Failed to save theme: ' + (error as any).message
            });
        }
    };

    const handleDeleteThemeClick = (themeId: string) => {
        setThemeToDelete(themeId);
        setIsDeleteThemeModalOpen(true);
    };

    const handleConfirmDeleteTheme = async () => {
        if (themeToDelete) {
            await deleteCustomTheme(themeToDelete);
            await loadUserThemes();
            setThemeToDelete(null);
            setIsDeleteThemeModalOpen(false);
        }
    };

    const handleEditBackground = (theme: LinkTreeTheme) => {
        onUpdate({
            linkInBio: {
                ...(portfolioData.linkInBio || {
                    links: [],
                    showSocial: true,
                    showEmail: true,
                    displayName: 'Your Name',
                    bio: 'Your Bio',
                    profileImage: '',
                    buttonLayout: 'stack'
                }),
                themeId: theme.id
            }
        });

        let currentBg = '';
        if (theme.backgroundConfig?.type === 'image') {
            currentBg = theme.backgroundConfig.value;
        } else if (theme.colors.background.startsWith('url')) {
            currentBg = theme.colors.background;
        }
        const cleanSrc = currentBg.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
        onAIImageEdit('linkInBio.customStyle.backgroundOverride', cleanSrc, 'project');
    };

    const handleThemeStockPhoto = (theme: LinkTreeTheme) => {
        onUpdate({
            linkInBio: {
                ...(portfolioData.linkInBio || {
                    links: [],
                    showSocial: true,
                    showEmail: true,
                    displayName: 'Your Name',
                    bio: 'Your Bio',
                    profileImage: '',
                    buttonLayout: 'stack'
                }),
                themeId: theme.id
            }
        });
        if (onStockPhotoTrigger) {
            onStockPhotoTrigger('linkInBio.customStyle.backgroundOverride');
        }
    };

    return (
        <div className={`
            border-r flex-col shrink-0 z-10 transition-all duration-300
            ${editorTheme === 'dark' ? 'bg-[#0f1117] border-white/5' : 'bg-white border-gray-200'}
            ${isMobile ? 'w-full absolute inset-0 z-20' : 'w-[400px] relative'}
            ${isMobile && viewMode === 'preview' ? 'hidden' : 'flex'}
        `}>
            {/* Mobile Header */}
            {isMobile && (
                <SidebarHeader
                    activeSectionLabel={sections.find(s => s.id === activeSection)?.label || 'Editor'}
                    onTogglePreview={onTogglePreview}
                    viewMode={viewMode}
                    editorTheme={editorTheme}
                    themeClasses={themeClasses}
                />
            )}

            {/* Desktop Theme Switcher */}
            {!isMobile && (
                <SidebarThemeSelector
                    portfolioData={portfolioData}
                    onUpdate={onUpdate}
                    currentSelection={currentSelection}
                    editorTheme={editorTheme}
                    themeClasses={themeClasses}
                />
            )}

            {/* Desktop Section Nav */}
            {!isMobile && (
                <SidebarSectionNav
                    sections={sections}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    editorTheme={editorTheme}
                    themeClasses={themeClasses}
                />
            )}

            {/* Content Area */}
            <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${isMobile ? 'pb-24' : ''}`}>

                {activeSection === 'links' && isLinkInBio && portfolioData.linkInBio && (
                    <div className="space-y-6">
                        <LinksEditor
                            linkInBio={portfolioData.linkInBio}
                            onUpdate={(links) => onUpdate({ linkInBio: links })}
                            theme={editorTheme}
                            onImageUploadTrigger={onImageUploadTrigger}
                        />
                        <AppearanceControls
                            portfolioData={portfolioData}
                            onUpdate={onUpdate}
                            themeClasses={themeClasses}
                            editorTheme={editorTheme}
                        />
                    </div>
                )}

                {activeSection === 'hero' && (
                    <SidebarProfileEditor
                        portfolioData={portfolioData}
                        onUpdate={onUpdate}
                        onNestedUpdate={onNestedUpdate}
                        onImageUploadTrigger={onImageUploadTrigger}
                        onAIImageEdit={onAIImageEdit}
                        isImageUploading={isImageUploading}
                        themeClasses={themeClasses}
                        editorTheme={editorTheme}
                        isLinkInBio={isLinkInBio}
                        onStockPhotoTrigger={onStockPhotoTrigger}
                    />
                )}

                {activeSection === 'timeline' && (
                    <SidebarTimelineEditor
                        portfolioData={portfolioData}
                        onUpdate={onUpdate}
                        themeClasses={themeClasses}
                        editorTheme={editorTheme}
                    />
                )}

                {activeSection === 'stack' && (
                    <SidebarTechStackEditor
                        portfolioData={portfolioData}
                        onUpdate={onUpdate}
                        themeClasses={themeClasses}
                    />
                )}

                {activeSection === 'projects' && (
                    <SidebarProjectsEditor
                        portfolioData={portfolioData}
                        onUpdate={onUpdate}
                        onImageUploadTrigger={onImageUploadTrigger}
                        onAIImageEdit={onAIImageEdit}
                        themeClasses={themeClasses}
                        editorTheme={editorTheme}
                    />
                )}

                {activeSection === 'components' && (
                    <SidebarComponentsEditor
                        portfolioData={portfolioData}
                        onNestedUpdate={onNestedUpdate}
                        editorTheme={editorTheme}
                        themeClasses={themeClasses}
                    />
                )}

                {activeSection === 'design' && (
                    <SidebarDesignEditor
                        portfolioData={portfolioData}
                        onUpdate={onUpdate}
                        isLinkInBio={isLinkInBio}
                        editorTheme={editorTheme}
                        themeClasses={themeClasses}
                        userThemes={userThemes}
                        handleDeleteThemeClick={handleDeleteThemeClick}
                        handleEditBackground={handleEditBackground}
                        handleThemeStockPhoto={handleThemeStockPhoto}
                        handleSaveCustomThemeClick={handleSaveCustomThemeClick}
                        onTogglePreview={onTogglePreview}
                        userPortfolios={userPortfolios}
                        onImportTheme={onImportTheme}
                    />
                )}

                {activeSection === 'settings' && (
                    <SidebarSettingsEditor
                        portfolioData={portfolioData}
                        onUpdate={onUpdate}
                        resumes={resumes}
                        themeClasses={themeClasses}
                    />
                )}
            </div>

            {/* Mobile Bottom Navigation */}
            {isMobile && (
                <SidebarMobileNav
                    sections={sections}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    editorTheme={editorTheme}
                />
            )}

            {/* Modals */}
            <PromptModal
                isOpen={isSaveThemeModalOpen}
                onConfirm={handleConfirmSaveTheme}
                onCancel={() => setIsSaveThemeModalOpen(false)}
                title="Save Custom Theme"
                message="Enter a name for your custom theme:"
                placeholder="My Awesome Theme"
                confirmText="Save Theme"
            />

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                title={alertModal.title}
                message={alertModal.message}
            />

            <ConfirmationModal
                isOpen={isDeleteThemeModalOpen}
                onConfirm={handleConfirmDeleteTheme}
                onCancel={() => setIsDeleteThemeModalOpen(false)}
                title="Delete Theme"
                message="Are you sure you want to delete this theme? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};

export default PortfolioSidebar;
