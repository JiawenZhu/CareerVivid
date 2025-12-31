import React from 'react';
import { Trash2, Image as ImageIcon, Upload, Brush } from 'lucide-react';
import { PortfolioData } from '../../../../types/portfolio';

interface SidebarProjectsEditorProps {
    portfolioData: PortfolioData;
    onUpdate: (data: Partial<PortfolioData>) => void;
    onImageUploadTrigger: (field: string) => void;
    onAIImageEdit: (field: string, currentSrc: string, type: 'avatar' | 'project') => void;
    themeClasses: any;
    editorTheme: 'light' | 'dark';
}

const SidebarProjectsEditor: React.FC<SidebarProjectsEditorProps> = ({
    portfolioData,
    onUpdate,
    onImageUploadTrigger,
    onAIImageEdit,
    themeClasses,
    editorTheme
}) => {
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

    return (
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
    );
};

export default SidebarProjectsEditor;
