import React, { useRef } from 'react';
import {
    User, Briefcase, Code, FolderGit2, Layers, Palette, FileText,
    Upload, Loader2, Brush, Plus, Trash2, Link as LinkIcon, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { PortfolioData } from '../../types/portfolio';
// Adjust path to components
import MonthYearPicker from '../../../../components/MonthYearPicker'; // src/components/MonthYearPicker

interface PortfolioSidebarProps {
    portfolioData: PortfolioData;
    activeSection: 'hero' | 'timeline' | 'stack' | 'projects' | 'components' | 'design' | 'settings';
    setActiveSection: (section: 'hero' | 'timeline' | 'stack' | 'projects' | 'components' | 'design' | 'settings') => void;
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
    isPremium
}) => {

    const sections = [
        { id: 'hero', icon: <User size={18} />, label: 'Hero' },
        { id: 'timeline', icon: <Briefcase size={18} />, label: 'Timeline' },
        { id: 'stack', icon: <Code size={18} />, label: 'Tech Stack' },
        { id: 'projects', icon: <FolderGit2 size={18} />, label: 'Projects' },
        { id: 'components', icon: <Layers size={18} />, label: 'Components' },
        { id: 'design', icon: <Palette size={18} />, label: 'Design' },
        { id: 'settings', icon: <FileText size={18} />, label: 'Files' }
    ] as const;

    const themeClasses = {
        sidebarBg: editorTheme === 'dark' ? 'bg-[#0f1117] border-white/5' : 'bg-white border-gray-200',
        sectionBorder: editorTheme === 'dark' ? 'border-white/5' : 'border-gray-200',
        cardBg: editorTheme === 'dark' ? 'bg-[#1a1d24] border-white/5' : 'bg-gray-50 border-gray-200',
        inputBg: editorTheme === 'dark' ? 'bg-[#1a1d24] border-white/10 text-white focus:border-indigo-500' : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500',
        inputBgDarker: editorTheme === 'dark' ? 'bg-[#0f1117] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900', // For inputs inside cards
        textMuted: editorTheme === 'dark' ? 'text-gray-500' : 'text-gray-500',
        textMain: editorTheme === 'dark' ? 'text-white' : 'text-gray-900',
        placeholder: 'placeholder-gray-400'
    };

    const handleAddProject = () => {
        const newProject = {
            id: Date.now().toString(),
            title: 'New Project',
            description: 'Project description...',
            tags: [],
            repoUrl: '',
            demoUrl: '',
            thumbnailUrl: ''
        };
        onUpdate({ projects: [...(portfolioData.projects || []), newProject] });
    };

    const handleAddTimeline = () => {
        const newJob = {
            id: Date.now().toString(),
            jobTitle: 'Job Title',
            employer: 'Company Name',
            city: '',
            startDate: '2023-01',
            endDate: 'Present',
            description: 'Description of your role...',
            achievements: []
        };
        onUpdate({ timeline: [...(portfolioData.timeline || []), newJob] });
    };

    return (
        <div className={`
            border-r flex-col shrink-0 z-10 transition-all duration-300
            ${editorTheme === 'dark' ? 'bg-[#0f1117] border-white/5' : 'bg-white border-gray-200'}
            ${isMobile ? 'w-full absolute inset-0 z-20' : 'w-[400px] relative'}
            ${isMobile && viewMode === 'preview' ? 'hidden' : 'flex'}
        `}>

            {/* Theme Switcher in Sidebar */}
            <div className={`p-4 border-b ${themeClasses.sectionBorder}`}>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Visual Theme</label>
                <select
                    value={portfolioData.templateId}
                    onChange={(e) => onUpdate({ templateId: e.target.value as any })}
                    className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors border ${editorTheme === 'dark' ? 'bg-[#1a1d24] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                >
                    <optgroup label="Core">
                        <option value="minimalist">Minimalist (Tech)</option>
                        <option value="visual">Visual (Creative)</option>
                        <option value="corporate">Corporate (Pro)</option>
                    </optgroup>
                    <optgroup label="Technology">
                        <option value="dev_terminal">Dev Terminal</option>
                        <option value="saas_modern">SaaS / Linear Style</option>
                    </optgroup>
                    <optgroup label="Creative">
                        <option value="ux_folio">UX Folio</option>
                        <option value="creative_dark">Cinematic Dark</option>
                        <option value="bento_personal">Bento Grid (Personal)</option>
                    </optgroup>
                    <optgroup label="Professional">
                        <option value="legal_trust">Legal Trust</option>
                        <option value="executive_brief">Executive Brief</option>
                        <option value="writer_editorial">Editorial / Writer</option>
                        <option value="academic_research">Academic / Research</option>
                    </optgroup>
                    <optgroup label="Healthcare">
                        <option value="medical_care">Medical Care</option>
                    </optgroup>
                </select>
            </div>

            {/* Section Nav */}
            <div className={`flex p-2 border-b ${themeClasses.sectionBorder} gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
                {sections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id as any)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                            ${activeSection === s.id
                                ? (editorTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900')
                                : 'text-gray-500 hover:text-gray-400 hover:bg-black/5'}
                        `}
                    >
                        {s.icon} {s.label}
                    </button>
                ))}
            </div>

            {/* Inputs Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {activeSection === 'hero' && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Avatar Section */}
                        <div className={`p-4 rounded-lg border ${themeClasses.cardBg}`}>
                            <label className="block text-xs font-semibold text-gray-500 mb-3 uppercase">Profile Photo / Avatar</label>
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 ${editorTheme === 'dark' ? 'bg-white/10 border-white/10' : 'bg-gray-200 border-gray-200'}`}>
                                    {portfolioData.hero.avatarUrl ? (
                                        <img src={portfolioData.hero.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                                            <User size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onImageUploadTrigger('hero.avatarUrl')}
                                            disabled={isImageUploading}
                                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-md text-xs font-medium text-gray-300 flex items-center gap-1.5 transition-colors"
                                        >
                                            {isImageUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                            Upload
                                        </button>
                                        {portfolioData.hero.avatarUrl && (
                                            <>
                                                <button
                                                    onClick={() => onAIImageEdit('hero.avatarUrl', portfolioData.hero.avatarUrl!, 'avatar')}
                                                    className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
                                                >
                                                    <Brush size={12} />
                                                    Edit with AI
                                                </button>
                                                <button
                                                    onClick={() => onNestedUpdate('hero', 'avatarUrl', '')}
                                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
                                                    title="Remove Photo"
                                                >
                                                    <Trash2 size={12} />
                                                    Remove
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-500">Recommended: Square JPG/PNG, max 2MB</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Headline</label>
                            <input
                                id="hero.headline"
                                type="text"
                                className={`w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg}`}
                                value={portfolioData.hero.headline}
                                onChange={(e) => onNestedUpdate('hero', 'headline', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sub-headline</label>
                            <input
                                id="hero.subheadline"
                                type="text"
                                className={`w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg}`}
                                value={portfolioData.hero.subheadline}
                                onChange={(e) => onNestedUpdate('hero', 'subheadline', e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">CTA Text</label>
                                <input
                                    id="hero.ctaPrimaryLabel"
                                    type="text"
                                    className={`w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg}`}
                                    value={portfolioData.hero.ctaPrimaryLabel}
                                    onChange={(e) => onNestedUpdate('hero', 'ctaPrimaryLabel', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">CTA URL</label>
                                <input
                                    id="hero.ctaPrimaryUrl"
                                    type="text"
                                    className={`w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg}`}
                                    value={portfolioData.hero.ctaPrimaryUrl}
                                    onChange={(e) => onNestedUpdate('hero', 'ctaPrimaryUrl', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">About Me Label</label>
                            <input
                                id="sectionLabels.about"
                                type="text"
                                className={`w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors mb-2 ${themeClasses.inputBg}`}
                                value={portfolioData.sectionLabels?.about || 'About Me'}
                                onChange={(e) => onUpdate({
                                    sectionLabels: { ...portfolioData.sectionLabels, about: e.target.value }
                                })}
                            />
                            <textarea
                                id="about"
                                rows={6}
                                className={`w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors resize-none ${themeClasses.inputBg}`}
                                value={portfolioData.about}
                                onChange={(e) => onUpdate({ about: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {activeSection === 'timeline' && (
                    <div className="space-y-4">
                        {portfolioData.timeline.map((job, idx) => (
                            <div key={job.id} className={`p-4 rounded-lg border relative group/card ${themeClasses.cardBg}`}>
                                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            const newTimeline = portfolioData.timeline.filter((_, i) => i !== idx);
                                            onUpdate({ timeline: newTimeline });
                                        }}
                                        className="p-1.5 bg-black/50 text-gray-400 hover:text-red-400 hover:bg-black/80 rounded-md transition-all"
                                        title="Delete Entry"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="mb-2">
                                    <input
                                        id={`timeline.${idx}.jobTitle`}
                                        className={`bg-transparent font-bold w-full outline-none ${themeClasses.textMain}`}
                                        value={job.jobTitle}
                                        onChange={(e) => {
                                            const newTimeline = [...portfolioData.timeline];
                                            newTimeline[idx].jobTitle = e.target.value;
                                            onUpdate({ timeline: newTimeline });
                                        }}
                                        placeholder="Job Title"
                                    />
                                    <input
                                        id={`timeline.${idx}.employer`}
                                        className="bg-transparent text-sm text-indigo-400 w-full outline-none"
                                        value={job.employer}
                                        onChange={(e) => {
                                            const newTimeline = [...portfolioData.timeline];
                                            newTimeline[idx].employer = e.target.value;
                                            onUpdate({ timeline: newTimeline });
                                        }}
                                        placeholder="Company"
                                    />
                                </div>
                                <div className="mb-2">
                                    <input
                                        id={`timeline.${idx}.employer`}
                                        className="bg-transparent text-gray-400 text-sm w-full outline-none"
                                        value={job.employer}
                                        onChange={(e) => {
                                            const newTimeline = [...portfolioData.timeline];
                                            newTimeline[idx].employer = e.target.value;
                                            onUpdate({ timeline: newTimeline });
                                        }}
                                        placeholder="Employer"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-2 mb-2">
                                    <MonthYearPicker
                                        id={`timeline.${idx}.startDate`}
                                        label="Start Date"
                                        value={job.startDate}
                                        onChange={(val) => {
                                            const newTimeline = [...portfolioData.timeline];
                                            newTimeline[idx].startDate = val;
                                            onUpdate({ timeline: newTimeline });
                                        }}
                                    />
                                    <MonthYearPicker
                                        id={`timeline.${idx}.endDate`}
                                        label="End Date"
                                        value={job.endDate}
                                        onChange={(val) => {
                                            const newTimeline = [...portfolioData.timeline];
                                            newTimeline[idx].endDate = val;
                                            onUpdate({ timeline: newTimeline });
                                        }}
                                    />
                                </div>
                                <textarea
                                    id={`timeline.${idx}.description`}
                                    className={`bg-transparent text-sm w-full outline-none resize-none p-2 rounded ${editorTheme === 'dark' ? 'text-gray-500 bg-black/10' : 'text-gray-600 bg-gray-100'}`}
                                    rows={2}
                                    value={job.description}
                                    onChange={(e) => {
                                        const newTimeline = [...portfolioData.timeline];
                                        newTimeline[idx].description = e.target.value;
                                        onUpdate({ timeline: newTimeline });
                                    }}
                                />
                            </div>
                        ))}
                        <button
                            onClick={handleAddTimeline}
                            className="w-full py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-sm font-medium transition-colors"
                        >
                            + Add Timeline Entry
                        </button>
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Section Label</label>
                            <input
                                id="sectionLabels.timeline"
                                type="text"
                                className={`w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg}`}
                                value={portfolioData.sectionLabels?.timeline || 'My Journey'}
                                onChange={(e) => onUpdate({
                                    sectionLabels: { ...portfolioData.sectionLabels, timeline: e.target.value }
                                })}
                            />
                        </div>
                    </div>
                )}

                {activeSection === 'stack' && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {portfolioData.techStack.map((skill, idx) => (
                                <div key={skill.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${themeClasses.cardBg}`}>
                                    <input
                                        id={`techStack.${idx}.name`}
                                        className={`bg-transparent text-sm outline-none w-24 ${themeClasses.textMain}`}
                                        value={skill.name}
                                        onChange={(e) => {
                                            const newStack = [...portfolioData.techStack];
                                            newStack[idx].name = e.target.value;
                                            onUpdate({ techStack: newStack });
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const newStack = portfolioData.techStack.filter(s => s.id !== skill.id);
                                            onUpdate({ techStack: newStack });
                                        }}
                                        className="text-gray-500 hover:text-red-400"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                            <button
                                id="techStack"
                                onClick={() => {
                                    const newStack = [...portfolioData.techStack, { id: Date.now().toString(), name: 'New Skill', level: 'Intermediate' as const }];
                                    onUpdate({ techStack: newStack });
                                }}
                                className="px-3 py-2 rounded-lg border border-dashed border-gray-600 text-gray-500 text-sm hover:border-white/20 hover:text-white"
                            >
                                + Add Skill
                            </button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Section Label</label>
                            <input
                                id="sectionLabels.techStack"
                                type="text"
                                className={`w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg}`}
                                value={portfolioData.sectionLabels?.techStack || 'Tech Stack'}
                                onChange={(e) => onUpdate({
                                    sectionLabels: { ...portfolioData.sectionLabels, techStack: e.target.value }
                                })}
                            />
                        </div>
                    </div>
                )}

                {activeSection === 'projects' && (
                    <div className="space-y-4">
                        {portfolioData.projects.map((proj, idx) => (
                            <div key={proj.id} className={`p-4 rounded-lg border relative group/card ${themeClasses.cardBg}`}>
                                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            const newProjects = portfolioData.projects.filter((_, i) => i !== idx);
                                            onUpdate({ projects: newProjects });
                                        }}
                                        className="p-1.5 bg-black/50 text-gray-400 hover:text-red-400 hover:bg-black/80 rounded-md transition-all"
                                        title="Delete Project"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                {/* Project Thumbnail */}
                                <div className="mb-4 flex items-start gap-4 p-3 bg-black/20 rounded-lg border border-white/5">
                                    <div className="w-20 h-14 bg-gray-800 rounded overflow-hidden shrink-0 relative group">
                                        {proj.thumbnailUrl ? (
                                            <img src={proj.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                <ImageIcon size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Thumbnail</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onImageUploadTrigger(`projects.${idx}.thumbnailUrl`)}
                                                className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] font-medium text-gray-400 flex items-center gap-1 transition-colors"
                                            >
                                                <Upload size={10} /> Upload
                                            </button>
                                            {proj.thumbnailUrl && (
                                                <button
                                                    onClick={() => onAIImageEdit(`projects.${idx}.thumbnailUrl`, proj.thumbnailUrl!, 'project')}
                                                    className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded text-[10px] font-medium flex items-center gap-1 transition-colors"
                                                >
                                                    <Brush size={10} /> AI Magic
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <input
                                    id={`projects.${idx}.title`}
                                    className={`bg-transparent font-bold w-full outline-none mb-1 ${themeClasses.textMain}`}
                                    value={proj.title}
                                    onChange={(e) => {
                                        const newProjects = [...portfolioData.projects];
                                        newProjects[idx].title = e.target.value;
                                        onUpdate({ projects: newProjects });
                                    }}
                                    placeholder="Project Title"
                                />
                                <textarea
                                    id={`projects.${idx}.description`}
                                    rows={2}
                                    className={`bg-transparent text-sm w-full outline-none resize-none p-2 rounded mb-2 ${editorTheme === 'dark' ? 'text-gray-400 bg-black/10' : 'text-gray-600 bg-gray-100'}`}
                                    value={proj.description}
                                    onChange={(e) => {
                                        const newProjects = [...portfolioData.projects];
                                        newProjects[idx].description = e.target.value;
                                        onUpdate({ projects: newProjects });
                                    }}
                                    placeholder="Description"
                                />
                                <div className="flex gap-2">
                                    <input
                                        id={`projects.${idx}.repoUrl`}
                                        placeholder="GitHub URL"
                                        className={`text-xs w-full p-2 rounded border outline-none transition-colors ${themeClasses.inputBgDarker}`}
                                        value={proj.repoUrl || ''}
                                        onChange={(e) => {
                                            const newProjects = [...portfolioData.projects];
                                            newProjects[idx].repoUrl = e.target.value;
                                            onUpdate({ projects: newProjects });
                                        }}
                                    />
                                    <input
                                        id={`projects.${idx}.demoUrl`}
                                        placeholder="Demo URL"
                                        className={`text-xs w-full p-2 rounded border outline-none transition-colors ${themeClasses.inputBgDarker}`}
                                        value={proj.demoUrl || ''}
                                        onChange={(e) => {
                                            const newProjects = [...portfolioData.projects];
                                            newProjects[idx].demoUrl = e.target.value;
                                            onUpdate({ projects: newProjects });
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={handleAddProject}
                            className="w-full py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-sm font-medium transition-colors"
                        >
                            + Add Custom Project
                        </button>
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Section Label</label>
                            <input
                                id="sectionLabels.projects"
                                type="text"
                                className={`w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg}`}
                                value={portfolioData.sectionLabels?.projects || 'Featured Projects'}
                                onChange={(e) => onUpdate({
                                    sectionLabels: { ...portfolioData.sectionLabels, projects: e.target.value }
                                })}
                            />
                        </div>
                    </div>
                )}

                {activeSection === 'components' && (
                    <div className="space-y-6">
                        <div className="p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                            <h3 className="text-sm font-semibold text-indigo-400 mb-1 flex items-center gap-2">
                                <Sparkles size={14} />
                                Dynamic Components
                            </h3>
                            <p className="text-xs text-gray-400">
                                These components are often added by AI Prompts. You can fine-tune them here.
                            </p>
                        </div>

                        {/* Hero Buttons */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Hero Buttons</label>
                                <button
                                    onClick={() => {
                                        const newButtons = [
                                            ...(portfolioData.hero.buttons || []),
                                            { id: Date.now().toString(), label: 'New Button', variant: 'primary', url: '#' }
                                        ];
                                        onNestedUpdate('hero', 'buttons', newButtons as any);
                                    }}
                                    className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${editorTheme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                                >
                                    <Plus size={12} /> Add
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(!portfolioData.hero.buttons || portfolioData.hero.buttons.length === 0) && (
                                    <p className="text-sm text-gray-500 italic p-4 text-center border border-dashed border-white/5 rounded-lg">
                                        No custom buttons found.
                                    </p>
                                )}

                                {portfolioData.hero.buttons?.map((btn, idx) => (
                                    <div key={btn.id} className={`p-3 rounded-lg border group relative ${themeClasses.cardBg}`}>
                                        <button
                                            onClick={() => {
                                                const newButtons = portfolioData.hero.buttons?.filter((_, i) => i !== idx);
                                                onNestedUpdate('hero', 'buttons', newButtons as any);
                                            }}
                                            className="absolute top-2 right-2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Component"
                                        >
                                            <Trash2 size={12} />
                                        </button>

                                        <div className="grid gap-3">
                                            <div className="flex gap-2">
                                                <input
                                                    value={btn.label}
                                                    onChange={(e) => {
                                                        const newButtons = [...(portfolioData.hero.buttons || [])];
                                                        newButtons[idx].label = e.target.value;
                                                        onNestedUpdate('hero', 'buttons', newButtons as any);
                                                    }}
                                                    placeholder="Label"
                                                    className={`flex-1 border rounded px-2 py-1.5 text-sm font-medium focus:border-indigo-500 outline-none ${themeClasses.inputBgDarker}`}
                                                />
                                                <select
                                                    value={btn.variant}
                                                    onChange={(e) => {
                                                        const newButtons = [...(portfolioData.hero.buttons || [])];
                                                        newButtons[idx].variant = e.target.value as any;
                                                        onNestedUpdate('hero', 'buttons', newButtons as any);
                                                    }}
                                                    className={`border rounded px-2 py-1.5 text-xs text-gray-400 outline-none focus:border-indigo-500 ${themeClasses.inputBgDarker}`}
                                                >
                                                    <option value="primary">Primary</option>
                                                    <option value="secondary">Secondary</option>
                                                    <option value="outline">Outline</option>
                                                    <option value="ghost">Ghost</option>
                                                </select>
                                                <select
                                                    value={btn.type || 'link'}
                                                    onChange={(e) => {
                                                        const newButtons = [...(portfolioData.hero.buttons || [])];
                                                        newButtons[idx].type = e.target.value as any;
                                                        onNestedUpdate('hero', 'buttons', newButtons as any);
                                                    }}
                                                    className={`border rounded px-2 py-1.5 text-xs text-gray-400 outline-none focus:border-indigo-500 ${themeClasses.inputBgDarker}`}
                                                >
                                                    <option value="link">Link</option>
                                                    <option value="action">Action</option>
                                                </select>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {btn.type === 'action' ? (
                                                    <select
                                                        value={btn.action || 'theme_toggle'}
                                                        onChange={(e) => {
                                                            const newButtons = [...(portfolioData.hero.buttons || [])];
                                                            newButtons[idx].action = e.target.value as any;
                                                            onNestedUpdate('hero', 'buttons', newButtons as any);
                                                        }}
                                                        className={`flex-1 border rounded px-2 py-1.5 text-xs text-gray-400 outline-none focus:border-indigo-500 ${themeClasses.inputBgDarker}`}
                                                    >
                                                        <option value="theme_toggle">Theme Toggle (Dark/Light)</option>
                                                        <option value="scroll_to_contact">Scroll to Contact</option>
                                                    </select>
                                                ) : (
                                                    <>
                                                        <LinkIcon size={12} className="text-gray-500 shrink-0" />
                                                        <input
                                                            value={btn.url || ''}
                                                            onChange={(e) => {
                                                                const newButtons = [...(portfolioData.hero.buttons || [])];
                                                                newButtons[idx].url = e.target.value;
                                                                onNestedUpdate('hero', 'buttons', newButtons as any);
                                                            }}
                                                            placeholder="https://..."
                                                            className="flex-1 bg-transparent border-none text-xs text-blue-400 placeholder-gray-600 outline-none"
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'design' && (
                    <div className="space-y-6">
                        <div className="p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                            <h3 className="text-sm font-semibold text-indigo-400 mb-1 flex items-center gap-2">
                                <Palette size={14} />
                                Design & Theming
                            </h3>
                            <p className="text-xs text-gray-400">
                                Customize the look and feel of your portfolio.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Typography */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Typography</label>
                                <select
                                    value={portfolioData.theme.fontFamily || 'Inter'}
                                    onChange={(e) => onUpdate({ theme: { ...portfolioData.theme, fontFamily: e.target.value } })}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 ${themeClasses.inputBg}`}
                                >
                                    <option value="Inter">Inter (Sans-serif)</option>
                                    <option value="Roboto">Roboto</option>
                                    <option value="'Playfair Display', serif">Playfair Display (Serif)</option>
                                    <option value="'Space Mono', monospace">Space Mono (Code)</option>
                                </select>
                            </div>

                            {/* Colors */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Theme Colors</label>
                                <div className="space-y-3">
                                    <div className={`flex items-center justify-between p-3 rounded-lg border ${themeClasses.cardBg}`}>
                                        <span className={`text-sm ${themeClasses.textMain}`}>Primary Color</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-full border overflow-hidden ${editorTheme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                                                <input
                                                    type="color"
                                                    value={portfolioData.theme.primaryColor}
                                                    onChange={(e) => onUpdate({ theme: { ...portfolioData.theme, primaryColor: e.target.value } })}
                                                    className="w-[150%] h-[150%] -m-1 cursor-pointer"
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 font-mono">{portfolioData.theme.primaryColor}</span>
                                        </div>
                                    </div>

                                    <div className={`flex items-center justify-between p-3 rounded-lg border ${themeClasses.cardBg}`}>
                                        <span className={`text-sm ${themeClasses.textMain}`}>Text Color</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-full border overflow-hidden ${editorTheme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                                                <input
                                                    type="color"
                                                    value={portfolioData.theme.textColor || '#ffffff'}
                                                    onChange={(e) => onUpdate({ theme: { ...portfolioData.theme, textColor: e.target.value } })}
                                                    className="w-[150%] h-[150%] -m-1 cursor-pointer"
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 font-mono">{portfolioData.theme.textColor || 'Default'}</span>
                                        </div>
                                    </div>

                                    <div className={`flex items-center justify-between p-3 rounded-lg border ${themeClasses.cardBg}`}>
                                        <span className={`text-sm ${themeClasses.textMain}`}>Background Color</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-full border overflow-hidden ${editorTheme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                                                <input
                                                    type="color"
                                                    value={portfolioData.theme.backgroundColor || '#000000'}
                                                    onChange={(e) => onUpdate({ theme: { ...portfolioData.theme, backgroundColor: e.target.value } })}
                                                    className="w-[150%] h-[150%] -m-1 cursor-pointer"
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 font-mono">{portfolioData.theme.backgroundColor || 'Default'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'settings' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className={`p-4 rounded-lg border ${themeClasses.cardBg}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="text-indigo-400" size={20} />
                                <h3 className={`font-semibold ${themeClasses.textMain}`}>Attachments</h3>
                            </div>

                            <div id="resume.selector">
                                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Attach Resume</label>
                                <p className="text-xs text-gray-400 mb-2">Select a resume from your database to display as a download link on your portfolio.</p>
                                <select
                                    value={portfolioData.attachedResumeId || ''}
                                    onChange={(e) => onUpdate({ attachedResumeId: e.target.value })}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors ${themeClasses.inputBg}`}
                                >
                                    <option value="">-- No Resume Attached --</option>
                                    {resumes.map(resume => (
                                        <option key={resume.id} value={resume.id}>
                                            {resume.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortfolioSidebar;
