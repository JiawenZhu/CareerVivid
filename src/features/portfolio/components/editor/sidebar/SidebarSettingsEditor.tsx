import React from 'react';
import { FileText, Award, Store, Sparkles } from 'lucide-react';
import { PortfolioData } from '../../../types/portfolio';
import SidebarIntroEditor from './SidebarIntroEditor';

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
    const handleToggleStore = (enabled: boolean) => {
        onUpdate({
            linkInBio: {
                ...(portfolioData.linkInBio as any),
                enableStore: enabled
            }
        });
    };

    const handleEffectToggle = (effectKey: string, enabled: boolean) => {
        const currentEffects = portfolioData.linkInBio?.customStyle?.effects || {};
        onUpdate({
            linkInBio: {
                ...(portfolioData.linkInBio as any),
                customStyle: {
                    ...(portfolioData.linkInBio?.customStyle || {}),
                    effects: {
                        ...currentEffects,
                        [effectKey]: enabled
                    }
                }
            }
        });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Intro Page Settings */}
            <SidebarIntroEditor
                portfolioData={portfolioData}
                onUpdate={onUpdate}
                themeClasses={themeClasses}
            />

            {/* Commerce Hub Settings */}
            <div className={`p-4 rounded-lg border ${themeClasses.cardBg}`}>
                <div className="flex items-center gap-2 mb-3">
                    <Store className="text-blue-500" size={20} />
                    <h3 className={`font-semibold ${themeClasses.textMain}`}>Commerce Hub</h3>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Enable Storefront</label>
                        <p className="text-xs text-gray-500">Sell products directly from your bio link.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={portfolioData.linkInBio?.enableStore || false}
                            onChange={(e) => handleToggleStore(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <p className={`text-xs mt-3 ${themeClasses.textMuted}`}>
                    Manage your products in the <a href="/commerce" target="_blank" className="text-blue-500 hover:underline">Commerce Dashboard</a>.
                </p>
            </div>

            {/* Animation Hub */}
            <div className={`p-4 rounded-lg border ${themeClasses.cardBg}`}>
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="text-purple-500" size={20} />
                    <h3 className={`font-semibold ${themeClasses.textMain}`}>Animation Hub</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">Enhance your page with interactive and ambient effects.</p>

                <div className="space-y-3">
                    {/* Confetti */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Celebration Confetti</label>
                            <p className="text-[10px] text-gray-400">Bursts of confetti when links are clicked</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={portfolioData.linkInBio?.customStyle?.effects?.confetti || false}
                                onChange={(e) => handleEffectToggle('confetti', e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    {/* Snow / Particles */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Snow & Particles</label>
                            <p className="text-[10px] text-gray-400">Gentle falling particles overlay</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={portfolioData.linkInBio?.customStyle?.effects?.particles || false}
                                onChange={(e) => handleEffectToggle('particles', e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    {/* Matrix Rain */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Matrix Rain</label>
                            <p className="text-[10px] text-gray-400">Falling digital code effect</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={portfolioData.linkInBio?.customStyle?.effects?.matrix || false}
                                onChange={(e) => handleEffectToggle('matrix', e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    {/* Gradient Blobs */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Ambient Blobs</label>
                            <p className="text-[10px] text-gray-400">Floating colorful background orbs</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={portfolioData.linkInBio?.customStyle?.effects?.blobs || false}
                                onChange={(e) => handleEffectToggle('blobs', e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    {/* Scanlines */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Retro Scanlines</label>
                            <p className="text-[10px] text-gray-400">CRT monitor style overlay</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={portfolioData.linkInBio?.customStyle?.effects?.scanlines || false}
                                onChange={(e) => handleEffectToggle('scanlines', e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    {/* Noise */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Film Noise</label>
                            <p className="text-[10px] text-gray-400">Textured grain overlay</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={portfolioData.linkInBio?.customStyle?.effects?.noise || false}
                                onChange={(e) => handleEffectToggle('noise', e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    {/* Cyber Grid */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Cyber Grid</label>
                            <p className="text-[10px] text-gray-400">Retro 80s moving perspective grid</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={portfolioData.linkInBio?.customStyle?.effects?.grid || false}
                                onChange={(e) => handleEffectToggle('grid', e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    {/* Fireflies */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Fireflies</label>
                            <p className="text-[10px] text-gray-400">Gentle floating glowing orbs</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={portfolioData.linkInBio?.customStyle?.effects?.fireflies || false}
                                onChange={(e) => handleEffectToggle('fireflies', e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    {/* Starfield */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Starfield</label>
                            <p className="text-[10px] text-gray-400">Deep space twinkling stars</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={portfolioData.linkInBio?.customStyle?.effects?.stars || false}
                                onChange={(e) => handleEffectToggle('stars', e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    {/* Liquid Waves */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Liquid Waves</label>
                            <p className="text-[10px] text-gray-400">Abstract flowing fluid waves</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={portfolioData.linkInBio?.customStyle?.effects?.waves || false}
                                onChange={(e) => handleEffectToggle('waves', e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                </div>
            </div>


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
