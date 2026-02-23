import React from 'react';
import { PortfolioData } from '../../../../types/portfolio';

interface SidebarTechStackEditorProps {
    portfolioData: PortfolioData;
    onUpdate: (data: Partial<PortfolioData>) => void;
    themeClasses: any;
}

const SidebarTechStackEditor: React.FC<SidebarTechStackEditorProps> = ({
    portfolioData,
    onUpdate,
    themeClasses
}) => {
    return (
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
    );
};

export default SidebarTechStackEditor;
