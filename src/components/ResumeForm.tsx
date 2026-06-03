import React from 'react';
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

    return (
        <div className="space-y-6">
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

            {isImageEditModalOpen && displayPhoto && currentUser && (
                <AIImageEditModal
                    userId={currentUser.uid}
                    currentPhoto={displayPhoto}
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

            <WebsitesSection
                t={t}
                resume={resume}
                isReadOnly={isReadOnly}
                handleArrayChange={handleArrayChange}
                addArrayItem={addArrayItem}
                removeArrayItem={removeArrayItem}
            />

            <SectionTitlesSection
                t={t}
                resume={resume}
                isReadOnly={isReadOnly}
                handleChange={handleChange}
            />

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

            <LanguagesSection
                t={t}
                resume={resume}
                isReadOnly={isReadOnly}
                handleArrayChange={handleArrayChange}
                addArrayItem={addArrayItem}
                removeArrayItem={removeArrayItem}
            />

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
        </div >
    );
};

export default ResumeForm;
