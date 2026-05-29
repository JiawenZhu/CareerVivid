import React, { useState } from 'react';
import { FileInput, Code, Palette, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { ResumeData, TemplateInfo, UserProfile } from '../../../types';
import ResumeForm from '../../../components/ResumeForm';
import CommentsPanel from '../../../components/CommentsPanel';
import TemplateSelector from './TemplateSelector';
import DesignControls from './DesignControls';
import ResumeScoreTab from './ResumeScoreTab';

interface EditorSidebarProps {
    resume: ResumeData;
    currentUser: any;
    activeTab: 'content' | 'template' | 'design' | 'comments' | 'score';
    activeTemplate: TemplateInfo;
    templates: TemplateInfo[];
    sidebarWidth: string;
    sidebarMode: 'standard' | 'expanded' | 'closed';
    isDesktop: boolean;
    isGuestMode: boolean;
    isShared: boolean;
    isTemplateLoading: boolean;
    tempPhoto: string | null;
    sampleResume: ResumeData; // For template previews
    viewMode: 'edit' | 'preview';

    setActiveTab: (tab: 'content' | 'template' | 'design' | 'comments' | 'score') => void;
    setTempPhoto: (photo: string | null) => void;

    onResumeChange: (updates: Partial<ResumeData>) => void;
    onTemplateSelect: (template: TemplateInfo) => void;
    onDesignChange: (updates: Partial<ResumeData>) => void;
    onResizeSidebar: (direction: 'left' | 'right') => void;
    onCloseComments: () => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
    resume, currentUser, activeTab, activeTemplate, templates,
    sidebarWidth, sidebarMode, isDesktop, isGuestMode, isShared, isTemplateLoading,
    tempPhoto, sampleResume, viewMode,
    setActiveTab, setTempPhoto,
    onResumeChange, onTemplateSelect, onDesignChange, onResizeSidebar, onCloseComments
}) => {

    return (
        <>
            <div
                className={`
                    flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
                    h-full z-20 
                    absolute md:relative
                    transition-all duration-300 ease-in-out
                    ${isDesktop ? '' : (viewMode === 'preview' ? 'hidden' : 'translate-x-0 w-full')} 
                    ${isDesktop && sidebarMode === 'closed' ? 'w-0 overflow-hidden' : ''}
                    md:translate-x-0
                    overflow-hidden
                `}
                style={{ width: isDesktop ? sidebarWidth : '100%' }}
            >
                <div className="w-full h-full flex flex-col" style={{ minWidth: isDesktop ? '520px' : '100%' }}>

                    <div className="flex items-center justify-between gap-1 border-b border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900">
                        <button onClick={() => setActiveTab('content')} className={`flex-1 rounded-md py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${activeTab === 'content' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                            <FileInput size={14} /> Content
                        </button>
                        <button onClick={() => setActiveTab('score')} className={`flex-1 rounded-md py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${activeTab === 'score' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                            <Award size={14} /> Score
                        </button>
                        <button onClick={() => setActiveTab('template')} className={`flex-1 rounded-md py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${activeTab === 'template' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                            <Code size={14} /> Template
                        </button>
                        <button onClick={() => setActiveTab('design')} className={`flex-1 rounded-md py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${activeTab === 'design' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                            <Palette size={14} /> Design
                        </button>
                    </div>

                    <div className="custom-scrollbar flex-grow overflow-y-auto p-4">
                        {activeTab === 'content' && (
                            <div className="animate-fade-in">
                                <ResumeForm
                                    resume={resume}
                                    onChange={onResumeChange}
                                    tempPhoto={tempPhoto}
                                    setTempPhoto={setTempPhoto}
                                    isReadOnly={isGuestMode && !isShared}
                                />
                            </div>
                        )}

                        {activeTab === 'score' && (
                            <ResumeScoreTab 
                                resume={resume} 
                                currentUserUid={currentUser?.uid || ''}
                                onUpdate={onResumeChange}
                            />
                        )}

                        {activeTab === 'template' && (
                            <TemplateSelector
                                templates={templates}
                                activeTemplate={activeTemplate}
                                sampleResume={sampleResume}
                                isLoading={isTemplateLoading}
                                activeColor={resume.themeColor}
                                onSelect={onTemplateSelect}
                                onColorSelect={(color) => onResumeChange({ themeColor: color })}
                            />
                        )}

                        {activeTab === 'design' && (
                            <DesignControls
                                resume={resume}
                                activeTemplate={activeTemplate}
                                onDesignChange={onDesignChange}
                            />
                        )}

                        {activeTab === 'comments' && (
                            <div className="h-full flex flex-col animate-slide-in-right">
                                <CommentsPanel
                                    isOpen={true}
                                    onClose={onCloseComments}
                                    resumeId={resume.id!}
                                    ownerId={currentUser.uid}
                                    currentUser={currentUser}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar Resize Handle (Desktop Only) */}
            <div
                className={`
                    hidden md:flex flex-col absolute top-1/2 -translate-y-1/2 z-30
                    shadow-md rounded-r-xl overflow-hidden border border-l-0 border-gray-200 dark:border-gray-700
                    transition-all duration-300 ease-in-out
                `}
                style={{ left: sidebarMode === 'closed' ? '0' : sidebarWidth }}
            >
                <button
                    onClick={() => onResizeSidebar('right')}
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
                    onClick={() => onResizeSidebar('left')}
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
        </>
    );
};

export default EditorSidebar;
