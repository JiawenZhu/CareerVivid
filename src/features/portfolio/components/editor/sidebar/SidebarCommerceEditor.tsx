import React from 'react';
import { PortfolioData } from '../../types/portfolio';
import { ShoppingBag, Store } from 'lucide-react';

interface SidebarCommerceEditorProps {
    portfolioData: PortfolioData;
    onUpdate: (data: Partial<PortfolioData>) => void;
    themeClasses: any;
    editorTheme: 'light' | 'dark';
}

const SidebarCommerceEditor: React.FC<SidebarCommerceEditorProps> = ({
    portfolioData,
    onUpdate,
    themeClasses,
    editorTheme
}) => {
    const linkInBio = portfolioData.linkInBio || {
        links: [],
        showSocial: true,
        showEmail: true,
        displayName: '',
        bio: '',
        enableStore: false
    };

    const handleToggleStore = (enabled: boolean) => {
        onUpdate({
            linkInBio: {
                ...linkInBio,
                enableStore: enabled
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className={`p-5 rounded-xl border ${themeClasses.cardBg} space-y-4`}>
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Store size={24} />
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${themeClasses.textMain}`}>Commerce Hub</h3>
                        <p className={`text-sm ${themeClasses.textMuted}`}>
                            Sell digital and physical products directly from your bio link.
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className={`font-medium ${themeClasses.textMain} group-hover:text-blue-600 transition-colors`}>
                            Enable Storefront
                        </span>
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={linkInBio.enableStore || false}
                                onChange={(e) => handleToggleStore(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </div>
                    </label>
                    <p className={`text-xs mt-2 ${themeClasses.textMuted}`}>
                        Accept payments via Stripe. Manage your products in the <a href="/commerce" target="_blank" className="text-blue-500 hover:underline">Commerce Dashboard</a>.
                    </p>
                </div>
            </div>

            {/* TODO: Future Features - Featured Product Selection, Product Grid Layout, etc. */}
            {linkInBio.enableStore && (
                <div className={`p-4 rounded-xl border border-dashed ${editorTheme === 'dark' ? 'border-white/10' : 'border-gray-300'} text-center opacity-60`}>
                    <ShoppingBag className="mx-auto mb-2" size={20} />
                    <p className="text-sm">More customization options coming soon.</p>
                </div>
            )}
        </div>
    );
};

export default SidebarCommerceEditor;
