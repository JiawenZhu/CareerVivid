import React from 'react';
import { GraduationCap, Trash2 } from 'lucide-react';
import { PortfolioData } from '../../../types/portfolio';

interface SidebarEducationEditorProps {
    portfolioData: PortfolioData;
    onUpdate: (data: Partial<PortfolioData>) => void;
    themeClasses: any;
    editorTheme: 'light' | 'dark';
}

const SidebarEducationEditor: React.FC<SidebarEducationEditorProps> = ({
    portfolioData,
    onUpdate,
    themeClasses,
    editorTheme
}) => {
    const education = portfolioData.education || [];

    const handleAddEducation = () => {
        onUpdate({
            education: [
                ...education,
                {
                    id: Date.now().toString(),
                    school: 'School Name',
                    degree: 'Degree or Certification',
                    city: '',
                    startDate: '',
                    endDate: '',
                    description: ''
                }
            ]
        });
    };

    const updateEducation = (index: number, updates: Partial<PortfolioData['education'][number]>) => {
        const nextEducation = [...education];
        nextEducation[index] = { ...nextEducation[index], ...updates };
        onUpdate({ education: nextEducation });
    };

    return (
        <div id="education" className="space-y-4">
            {education.map((edu, idx) => (
                <div key={edu.id} className={`relative rounded-lg border p-4 ${themeClasses.cardBg}`}>
                    <button
                        type="button"
                        onClick={() => onUpdate({ education: education.filter((_, i) => i !== idx) })}
                        className="absolute right-3 top-3 rounded-md p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-500"
                        title="Remove education"
                    >
                        <Trash2 size={14} />
                    </button>

                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                        <GraduationCap size={14} />
                        Education {idx + 1}
                    </div>

                    <div className="space-y-3">
                        <input
                            id={`education.${idx}.school`}
                            className={`h-10 w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg}`}
                            value={edu.school || ''}
                            onChange={(e) => updateEducation(idx, { school: e.target.value })}
                            placeholder="School"
                        />
                        <input
                            id={`education.${idx}.degree`}
                            className={`h-10 w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg}`}
                            value={edu.degree || ''}
                            onChange={(e) => updateEducation(idx, { degree: e.target.value })}
                            placeholder="Degree or certification"
                        />
                        <input
                            id={`education.${idx}.city`}
                            className={`h-10 w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg}`}
                            value={edu.city || ''}
                            onChange={(e) => updateEducation(idx, { city: e.target.value })}
                            placeholder="City"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                id={`education.${idx}.startDate`}
                                className={`h-10 w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg}`}
                                value={edu.startDate || ''}
                                onChange={(e) => updateEducation(idx, { startDate: e.target.value })}
                                placeholder="Start"
                            />
                            <input
                                id={`education.${idx}.endDate`}
                                className={`h-10 w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg}`}
                                value={edu.endDate || ''}
                                onChange={(e) => updateEducation(idx, { endDate: e.target.value })}
                                placeholder="End"
                            />
                        </div>
                        <textarea
                            id={`education.${idx}.description`}
                            rows={4}
                            className={`w-full resize-none rounded-lg px-3 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg}`}
                            value={edu.description || ''}
                            onChange={(e) => updateEducation(idx, { description: e.target.value })}
                            placeholder="Notes, honors, or credentials"
                        />
                    </div>
                </div>
            ))}

            {education.length === 0 && (
                <div className={`rounded-lg border border-dashed p-4 text-center text-xs leading-5 ${editorTheme === 'dark' ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                    No education entries yet.
                </div>
            )}

            <button
                id="education.add"
                type="button"
                onClick={handleAddEducation}
                className="w-full rounded-lg bg-indigo-500/10 py-2 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
            >
                + Add Education
            </button>
        </div>
    );
};

export default SidebarEducationEditor;
