import React, { useEffect, useRef, useState } from 'react';
import { Briefcase, FileText, GraduationCap, Languages, Link2, ListChecks, Star, Tags, User } from 'lucide-react';
import { ResumeData } from '../types';
import { useResumeForm } from '../hooks/useResumeForm';
import AlertModal from './AlertModal';
import AIImageEditModal from './AIImageEditModal';
import ResumeImportSection from './Resume/ResumeImportSection';
import PersonalDetailsSection from './Resume/PersonalDetailsSection';
import ProfessionalSummarySection from './Resume/ProfessionalSummarySection';
import WebsitesSection from './Resume/WebsitesSection';
import SectionTitlesSection from './Resume/SectionTitlesSection';
import SkillsSection from './Resume/SkillsSection';
import LanguagesSection from './Resume/LanguagesSection';
import ExperienceSection from './Resume/ExperienceSection';
import EducationSection from './Resume/EducationSection';

interface ResumeFormProps {
    resume: ResumeData;
    onChange: (updatedData: Partial<ResumeData>) => void;
    tempPhoto: string | null;
    setTempPhoto: (photo: string | null) => void;
    isReadOnly?: boolean;
}

const ResumeForm: React.FC<ResumeFormProps> = ({ resume, onChange, tempPhoto, setTempPhoto, isReadOnly = false }) => {
    const formRootRef = useRef<HTMLDivElement>(null);
    const lastScrollTopRef = useRef(0);
    const [isSectionNavCollapsed, setIsSectionNavCollapsed] = useState(false);
    const {
        currentUser,
        isPremium,
        t,
        isParsing,
        activeImprovementId,
        isImageEditModalOpen,
        setIsImageEditModalOpen,
        isPhotoUploading,
        photoFileName,
        photoInputRef,
        alertState,
        setAlertState,
        isImportExpanded,
        setIsImportExpanded,
        importText,
        setImportText,
        importSuccess,
        CreditLimitModal,
        handleChange,
        handleImportText,
        handlePhotoChange,
        handleSaveTempPhoto,
        handleRemovePhoto,
        toggleImprovement,
        handleArrayChange,
        addArrayItem,
        removeArrayItem,
        handleDragStart,
        handleDragOver,
        handleDrop
    } = useResumeForm({ resume, onChange, tempPhoto, setTempPhoto });

    const displayPhoto = tempPhoto || resume.personalDetails.photo;
    const sectionLinks = [
        { id: 'personal', label: 'Profile', icon: User },
        { id: 'summary', label: 'Summary', icon: FileText },
        { id: 'websites', label: 'Links', icon: Link2 },
        { id: 'titles', label: 'Labels', icon: Tags },
        { id: 'skills', label: 'Skills', icon: Star },
        { id: 'languages', label: 'Languages', icon: Languages },
        { id: 'experience', label: 'Experience', icon: Briefcase },
        { id: 'education', label: 'Education', icon: GraduationCap },
    ];

    const scrollToSection = (id: string) => {
        document.getElementById(`resume-section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    useEffect(() => {
        const scrollContainer = formRootRef.current?.closest('[data-editor-sidebar-scroll]') as HTMLElement | null;
        const getScrollTop = () => scrollContainer?.scrollTop ?? window.scrollY;
        lastScrollTopRef.current = getScrollTop();
        let frameId = 0;
        let lastTouchY = 0;

        const setCollapsedFromIntent = (directionY: number) => {
            if (Math.abs(directionY) < 2) return;

            const currentScrollTop = getScrollTop();
            const shouldCollapse = currentScrollTop >= 24 && directionY > 0;
            setIsSectionNavCollapsed((current) => (current === shouldCollapse ? current : shouldCollapse));
        };

        const handleScroll = () => {
            if (frameId) return;

            frameId = window.requestAnimationFrame(() => {
                const currentScrollTop = getScrollTop();

                if (currentScrollTop < 24) {
                    setIsSectionNavCollapsed(false);
                }

                lastScrollTopRef.current = currentScrollTop;
                frameId = 0;
            });
        };

        const handleWheel = (event: WheelEvent) => {
            setCollapsedFromIntent(event.deltaY);
        };

        const handleTouchStart = (event: TouchEvent) => {
            lastTouchY = event.touches[0]?.clientY ?? lastTouchY;
        };

        const handleTouchMove = (event: TouchEvent) => {
            const currentTouchY = event.touches[0]?.clientY ?? lastTouchY;
            setCollapsedFromIntent(lastTouchY - currentTouchY);
            lastTouchY = currentTouchY;
        };

        const scrollTarget: HTMLElement | Window = scrollContainer ?? window;
        scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
        scrollTarget.addEventListener('wheel', handleWheel, { passive: true });
        scrollTarget.addEventListener('touchstart', handleTouchStart, { passive: true });
        scrollTarget.addEventListener('touchmove', handleTouchMove, { passive: true });

        return () => {
            scrollTarget.removeEventListener('scroll', handleScroll);
            scrollTarget.removeEventListener('wheel', handleWheel);
            scrollTarget.removeEventListener('touchstart', handleTouchStart);
            scrollTarget.removeEventListener('touchmove', handleTouchMove);
            if (frameId) window.cancelAnimationFrame(frameId);
        };
    }, []);

    return (
        <div ref={formRootRef} className="space-y-5">
            <CreditLimitModal />
            <AlertModal
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                onClose={() => setAlertState({ isOpen: false, title: '', message: '' })}
            />

            <ResumeImportSection
                t={t}
                isImportExpanded={isImportExpanded}
                setIsImportExpanded={setIsImportExpanded}
                importSuccess={importSuccess}
                importText={importText}
                setImportText={setImportText}
                handleImportText={handleImportText}
                isParsing={isParsing}
                isReadOnly={isReadOnly}
            />

            <div
                className={`
                    sticky top-0 z-20 overflow-hidden border border-[#e8dfd3] bg-[#fbf8f3]/95 shadow-sm backdrop-blur
                    transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                    motion-reduce:transition-none dark:border-gray-800 dark:bg-gray-950/95
                    ${isSectionNavCollapsed ? 'rounded-lg p-2 shadow-md ring-1 ring-[#efe5d8] dark:ring-gray-800' : 'rounded-xl p-3'}
                `}
            >
                <div className={`flex items-center justify-between gap-3 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSectionNavCollapsed ? 'mb-1' : 'mb-2'}`}>
                    <div className="min-w-0">
                        <p className={`font-black uppercase tracking-[0.18em] text-[#a07334] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:text-[#caa26c] ${isSectionNavCollapsed ? 'text-[9px]' : 'text-[10px]'}`}>
                            Resume sections
                        </p>
                        <p
                            className={`
                                truncate text-xs text-slate-500 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:text-gray-400
                                ${isSectionNavCollapsed ? 'max-h-0 -translate-y-1 opacity-0' : 'max-h-5 translate-y-0 opacity-100'}
                            `}
                        >
                            Jump directly to the part you want to edit.
                        </p>
                    </div>
                    <ListChecks
                        size={isSectionNavCollapsed ? 16 : 18}
                        className={`shrink-0 text-primary-500 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSectionNavCollapsed ? '-rotate-6 scale-95' : 'rotate-0 scale-100'}`}
                    />
                </div>
                <div
                    className={`
                        transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                        ${isSectionNavCollapsed
                            ? 'flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                            : 'grid grid-cols-2 gap-2'}
                    `}
                >
                    {sectionLinks.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => scrollToSection(id)}
                            className={`
                                flex items-center gap-2 rounded-lg border border-[#e4dbcf] bg-white text-left text-xs font-bold text-slate-600
                                transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                                hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700
                                motion-reduce:transition-colors dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300
                                dark:hover:border-primary-800 dark:hover:bg-primary-950/20
                                ${isSectionNavCollapsed ? 'h-8 min-w-[112px] px-2.5 shadow-sm' : 'h-9 px-3'}
                            `}
                        >
                            <Icon size={isSectionNavCollapsed ? 13 : 14} className="shrink-0 transition-all duration-500" />
                            <span className="truncate">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {isImageEditModalOpen && currentUser && (
                <AIImageEditModal
                    userId={currentUser.uid}
                    currentPhoto={displayPhoto || ''}
                    onClose={() => setIsImageEditModalOpen(false)}
                    onSave={(newPhotoUrl) => {
                        handleChange('photo', newPhotoUrl, 'personalDetails');
                    }}
                    onUseTemp={(newPhotoDataUrl) => {
                        setTempPhoto(newPhotoDataUrl);
                    }}
                    onError={(title, message) => setAlertState({ isOpen: true, title, message })}
                    savePath={`users/${currentUser.uid}/resume_photos/${Date.now()}_edited.png`}
                />
            )}

            <section id="resume-section-personal" className="scroll-mt-28">
                <PersonalDetailsSection
                    t={t}
                    resume={resume}
                    isReadOnly={isReadOnly}
                    isPremium={isPremium}
                    displayPhoto={displayPhoto}
                    isPhotoUploading={isPhotoUploading}
                    photoFileName={photoFileName}
                    photoInputRef={photoInputRef}
                    handlePhotoChange={handlePhotoChange}
                    setIsImageEditModalOpen={setIsImageEditModalOpen}
                    handleSaveTempPhoto={handleSaveTempPhoto}
                    handleRemovePhoto={handleRemovePhoto}
                    handleChange={handleChange}
                    tempPhoto={tempPhoto}
                />
            </section>

            <section id="resume-section-summary" className="scroll-mt-28">
                <ProfessionalSummarySection
                    t={t}
                    resume={resume}
                    isReadOnly={isReadOnly}
                    handleChange={handleChange}
                    activeImprovementId={activeImprovementId}
                    toggleImprovement={toggleImprovement}
                    currentUser={currentUser}
                    setAlertState={setAlertState}
                />
            </section>

            <section id="resume-section-websites" className="scroll-mt-28">
                <WebsitesSection
                    t={t}
                    resume={resume}
                    isReadOnly={isReadOnly}
                    handleArrayChange={handleArrayChange}
                    addArrayItem={addArrayItem}
                    removeArrayItem={removeArrayItem}
                />
            </section>

            <section id="resume-section-titles" className="scroll-mt-28">
                <SectionTitlesSection
                    t={t}
                    resume={resume}
                    isReadOnly={isReadOnly}
                    handleChange={handleChange}
                />
            </section>

            <section id="resume-section-skills" className="scroll-mt-28">
                <SkillsSection
                    t={t}
                    resume={resume}
                    isReadOnly={isReadOnly}
                    handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver}
                    handleDrop={handleDrop}
                    handleArrayChange={handleArrayChange}
                    addArrayItem={addArrayItem}
                    removeArrayItem={removeArrayItem}
                />
            </section>

            <section id="resume-section-languages" className="scroll-mt-28">
                <LanguagesSection
                    t={t}
                    resume={resume}
                    isReadOnly={isReadOnly}
                    handleArrayChange={handleArrayChange}
                    addArrayItem={addArrayItem}
                    removeArrayItem={removeArrayItem}
                />
            </section>

            <section id="resume-section-experience" className="scroll-mt-28">
                <ExperienceSection
                    t={t}
                    resume={resume}
                    isReadOnly={isReadOnly}
                    handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver}
                    handleDrop={handleDrop}
                    handleArrayChange={handleArrayChange}
                    addArrayItem={addArrayItem}
                    removeArrayItem={removeArrayItem}
                    activeImprovementId={activeImprovementId}
                    toggleImprovement={toggleImprovement}
                    currentUser={currentUser}
                    setAlertState={setAlertState}
                />
            </section>

            <section id="resume-section-education" className="scroll-mt-28">
                <EducationSection
                    t={t}
                    resume={resume}
                    isReadOnly={isReadOnly}
                    handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver}
                    handleDrop={handleDrop}
                    handleArrayChange={handleArrayChange}
                    addArrayItem={addArrayItem}
                    removeArrayItem={removeArrayItem}
                    activeImprovementId={activeImprovementId}
                    toggleImprovement={toggleImprovement}
                    currentUser={currentUser}
                    setAlertState={setAlertState}
                />
            </section>
        </div >
    );
};

export default ResumeForm;
