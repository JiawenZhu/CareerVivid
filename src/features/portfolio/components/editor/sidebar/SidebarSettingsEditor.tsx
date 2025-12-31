import React from 'react';
import { FileText, Award } from 'lucide-react';
import { PortfolioData } from '../../../../types/portfolio';

interface SidebarSettingsEditorProps {
    portfolioData: PortfolioData;
    onUpdate: (data: Partial<PortfolioData>) => void;
    resumes: any[];
    themeClasses: any;
}

const SidebarSettingsEditor: React.FC<SidebarSettingsEditorProps> = ({
    portfolioData,
    onUpdate,
    resumes,
    themeClasses
}) => {
    return (
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

            {/* Branding Settings (Premium) */}
            <div className={`p-4 rounded-lg border ${themeClasses.cardBg}`}>
                <div className="flex items-center gap-2 mb-3">
                    <Award className="text-amber-400" size={20} />
                    <h3 className={`font-semibold ${themeClasses.textMain}`}>Premium Branding</h3>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Remove Branding</label>
                        <p className="text-xs text-gray-500">Hide "Created with CareerVivid"</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={portfolioData.linkInBio?.settings?.removeBranding || false}
                            onChange={(e) => {
                                onUpdate({
                                    linkInBio: {
                                        ...portfolioData.linkInBio!,
                                        settings: {
                                            ...portfolioData.linkInBio?.settings,
                                            removeBranding: e.target.checked
                                        }
                                    }
                                });
                            }}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default SidebarSettingsEditor;
