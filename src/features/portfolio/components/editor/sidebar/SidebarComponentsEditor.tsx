import React from 'react';
import { Sparkles, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { PortfolioData } from '../../../../types/portfolio';

interface SidebarComponentsEditorProps {
    portfolioData: PortfolioData;
    onNestedUpdate: (section: keyof PortfolioData, field: string, value: any) => void;
    editorTheme: 'light' | 'dark';
    themeClasses: any;
}

const SidebarComponentsEditor: React.FC<SidebarComponentsEditorProps> = ({
    portfolioData,
    onNestedUpdate,
    editorTheme,
    themeClasses
}) => {
    return (
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
    );
};

export default SidebarComponentsEditor;
