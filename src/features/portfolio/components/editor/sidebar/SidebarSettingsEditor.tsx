import React from 'react';
import { FileText, Award, Store, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
    const tSidebar = (key: string) => t(`portfolio_editor.sidebar.${key}`);

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
                    <h3 className={`font-semibold ${themeClasses.textMain}`}>{tSidebar('commerce.title')}</h3>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{tSidebar('commerce.enable_storefront')}</label>
                        <p className="text-xs text-gray-500">{tSidebar('commerce.description')}</p>
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
                    {tSidebar('commerce.manage_prefix')} <a href="/commerce" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{tSidebar('commerce.dashboard_link')}</a>.
                </p>
            </div>

            {/* Animation Hub */}
            <div className={`p-4 rounded-lg border ${themeClasses.cardBg}`}>
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="text-purple-500" size={20} />
                    <h3 className={`font-semibold ${themeClasses.textMain}`}>{tSidebar('animation.title')}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">{tSidebar('animation.description')}</p>

                <div className="space-y-3">
                    {/* Confetti */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{tSidebar('animation.effects.confetti.title')}</label>
                            <p className="text-[10px] text-gray-400">{tSidebar('animation.effects.confetti.description')}</p>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{tSidebar('animation.effects.particles.title')}</label>
                            <p className="text-[10px] text-gray-400">{tSidebar('animation.effects.particles.description')}</p>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{tSidebar('animation.effects.matrix.title')}</label>
                            <p className="text-[10px] text-gray-400">{tSidebar('animation.effects.matrix.description')}</p>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{tSidebar('animation.effects.blobs.title')}</label>
                            <p className="text-[10px] text-gray-400">{tSidebar('animation.effects.blobs.description')}</p>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{tSidebar('animation.effects.scanlines.title')}</label>
                            <p className="text-[10px] text-gray-400">{tSidebar('animation.effects.scanlines.description')}</p>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{tSidebar('animation.effects.noise.title')}</label>
                            <p className="text-[10px] text-gray-400">{tSidebar('animation.effects.noise.description')}</p>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{tSidebar('animation.effects.grid.title')}</label>
                            <p className="text-[10px] text-gray-400">{tSidebar('animation.effects.grid.description')}</p>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{tSidebar('animation.effects.fireflies.title')}</label>
                            <p className="text-[10px] text-gray-400">{tSidebar('animation.effects.fireflies.description')}</p>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{tSidebar('animation.effects.stars.title')}</label>
                            <p className="text-[10px] text-gray-400">{tSidebar('animation.effects.stars.description')}</p>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{tSidebar('animation.effects.waves.title')}</label>
                            <p className="text-[10px] text-gray-400">{tSidebar('animation.effects.waves.description')}</p>
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
                    <h3 className={`font-semibold ${themeClasses.textMain}`}>{tSidebar('attachments.title')}</h3>
                </div>

                <div id="resume.selector">
                    <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">{tSidebar('attachments.attach_resume')}</label>
                    <p className="text-xs text-gray-400 mb-2">{tSidebar('attachments.description')}</p>
                    <select
                        value={portfolioData.attachedResumeId || ''}
                        onChange={(e) => onUpdate({ attachedResumeId: e.target.value })}
                        className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors ${themeClasses.inputBg}`}
                    >
                        <option value="">{tSidebar('attachments.no_resume')}</option>
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
                    <h3 className={`font-semibold ${themeClasses.textMain}`}>{tSidebar('branding.title')}</h3>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{tSidebar('branding.remove')}</label>
                        <p className="text-xs text-gray-500">{tSidebar('branding.description')}</p>
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
