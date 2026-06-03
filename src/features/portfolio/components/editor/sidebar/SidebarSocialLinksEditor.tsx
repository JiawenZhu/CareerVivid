import React from 'react';
import { Link as LinkIcon, Trash2 } from 'lucide-react';
import { PortfolioData } from '../../../types/portfolio';

interface SidebarSocialLinksEditorProps {
    portfolioData: PortfolioData;
    onUpdate: (data: Partial<PortfolioData>) => void;
    themeClasses: any;
}

const SidebarSocialLinksEditor: React.FC<SidebarSocialLinksEditorProps> = ({
    portfolioData,
    onUpdate,
    themeClasses
}) => {
    const links = portfolioData.socialLinks || [];

    const handleAddLink = () => {
        onUpdate({
            socialLinks: [
                ...links,
                {
                    id: Date.now().toString(),
                    label: 'Website',
                    url: 'https://',
                    platform: '',
                    showUrl: false
                }
            ]
        });
    };

    const updateLink = (index: number, updates: Partial<PortfolioData['socialLinks'][number]>) => {
        const nextLinks = [...links];
        nextLinks[index] = { ...nextLinks[index], ...updates };
        onUpdate({ socialLinks: nextLinks });
    };

    return (
        <div id="socialLinks" className="space-y-4">
            {links.map((link, idx) => (
                <div key={link.id} className={`relative rounded-lg border p-4 ${themeClasses.cardBg}`}>
                    <button
                        type="button"
                        onClick={() => onUpdate({ socialLinks: links.filter((_, i) => i !== idx) })}
                        className="absolute right-3 top-3 rounded-md p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-500"
                        title="Remove link"
                    >
                        <Trash2 size={14} />
                    </button>

                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                        <LinkIcon size={14} />
                        Link {idx + 1}
                    </div>

                    <div className="space-y-3">
                        <input
                            id={`socialLinks.${idx}.label`}
                            className={`h-10 w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg}`}
                            value={link.label || ''}
                            onChange={(e) => updateLink(idx, { label: e.target.value })}
                            placeholder="Label"
                        />
                        <input
                            id={`socialLinks.${idx}.url`}
                            className={`h-10 w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg}`}
                            value={link.url || ''}
                            onChange={(e) => updateLink(idx, { url: e.target.value })}
                            placeholder="https://example.com"
                        />
                    </div>
                </div>
            ))}

            {links.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-xs leading-5 text-gray-400 dark:border-white/10">
                    No links yet. Add websites, LinkedIn, GitHub, or other profile links used by templates.
                </div>
            )}

            <button
                id="socialLinks.add"
                type="button"
                onClick={handleAddLink}
                className="w-full rounded-lg bg-indigo-500/10 py-2 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
            >
                + Add Link
            </button>
        </div>
    );
};

export default SidebarSocialLinksEditor;
