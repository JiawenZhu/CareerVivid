import React from 'react';
import { PortfolioData, IntroAsset } from '../../../types/portfolio';
import { Sparkles, Image as ImageIcon, Video, Gamepad2, Plus, X, Trash2, CheckCircle, GripVertical } from 'lucide-react';
import { uploadImage } from '../../../../../services/storageService';
import StockPhotoModal from '../../../../../components/StockPhotoModal';
import { nanoid } from 'nanoid';

interface SidebarIntroEditorProps {
    portfolioData: PortfolioData;
    onUpdate: (data: Partial<PortfolioData>) => void;
    themeClasses: any;
}

const SidebarIntroEditor: React.FC<SidebarIntroEditorProps> = ({ portfolioData, onUpdate, themeClasses }) => {
    const [isUploading, setIsUploading] = React.useState(false);
    const [isStockPhotoModalOpen, setIsStockPhotoModalOpen] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Initial Config (with auto-migration logic)
    const introConfig = portfolioData.linkInBio?.introPage || {
        enabled: false,
        buttonText: 'Enter Site',
        buttonStyle: 'outline',
        assets: [],
        activeAssetId: undefined
    };

    // --- Migrate Legacy Data on Mount/Render ---
    React.useEffect(() => {
        if (introConfig.enabled && (!introConfig.assets || introConfig.assets.length === 0) && introConfig.type) {
            // Need to migrate
            const legacyAsset: IntroAsset = {
                id: nanoid(),
                label: 'Default Intro',
                type: introConfig.type as any,
                contentUrl: introConfig.contentUrl,
                mobileContentUrl: introConfig.mobileContentUrl,
                objectFit: introConfig.objectFit,
                mobileObjectFit: introConfig.mobileObjectFit,
                gameType: introConfig.gameType,
                embedCode: introConfig.embedCode,
                pianoConfig: introConfig.pianoConfig
            };
            handleConfigUpdate({
                assets: [legacyAsset],
                activeAssetId: legacyAsset.id,
                // cleanup legacy to avoid confusion? kept for now
            });
        }
    }, []);

    // Helper to update the top-level intro config
    const handleConfigUpdate = (updates: Partial<NonNullable<typeof portfolioData.linkInBio>['introPage']>) => {
        const linkInBio = portfolioData.linkInBio || {
            links: [],
            showSocial: true,
            showEmail: true,
            displayName: '',
            bio: '',
        };
        onUpdate({
            linkInBio: {
                ...linkInBio,
                introPage: {
                    ...introConfig,
                    ...updates
                }
            }
        });
    };

    // Helper to get active asset
    const activeAsset = React.useMemo(() => {
        if (!introConfig.assets?.length) return null;
        return introConfig.assets.find(a => a.id === introConfig.activeAssetId) || introConfig.assets[0];
    }, [introConfig.assets, introConfig.activeAssetId]);

    // Update specific field of ACTIVE asset
    const handleAssetUpdate = (updates: Partial<IntroAsset>) => {
        if (!activeAsset) return;
        const newAssets = introConfig.assets?.map(a =>
            a.id === activeAsset.id ? { ...a, ...updates } : a
        ) || [];
        handleConfigUpdate({ assets: newAssets });
    };

    const handleCreateAsset = () => {
        const newAsset: IntroAsset = {
            id: nanoid(),
            label: `New Content ${((introConfig.assets?.length || 0) + 1)}`,
            type: 'image',
            objectFit: 'cover'
        };
        const newAssets = [...(introConfig.assets || []), newAsset];
        handleConfigUpdate({
            assets: newAssets,
            activeAssetId: newAsset.id
        });
    };

    const handleDeleteAsset = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newAssets = introConfig.assets?.filter(a => a.id !== id) || [];
        // If deleting active, switch active
        let newActiveId = introConfig.activeAssetId;
        if (id === introConfig.activeAssetId) {
            newActiveId = newAssets[0]?.id;
        }

        handleConfigUpdate({
            assets: newAssets,
            activeAssetId: newActiveId
        });
    };


    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, target: 'desktop' | 'mobile' = 'desktop') => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const downloadURL = await uploadImage(file, `portfolio/${portfolioData.id}/intro_content_${target}_${Date.now()}`);
            if (target === 'mobile') {
                handleAssetUpdate({ mobileContentUrl: downloadURL });
            } else {
                handleAssetUpdate({ contentUrl: downloadURL });
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className={`p-4 rounded-lg border ${themeClasses.cardBg}`}>
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="text-pink-500" size={20} />
                <h3 className={`font-semibold ${themeClasses.textMain}`}>Intro / Splash Page</h3>
            </div>

            <div className="flex items-center justify-between mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Enable Intro Page</label>
                    <p className="text-xs text-gray-500">Show a splash screen before your links.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={introConfig.enabled}
                        onChange={(e) => handleConfigUpdate({ enabled: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                </label>
            </div>

            {introConfig.enabled && (
                <div className="space-y-6 animate-fade-in-up border-t border-gray-100 dark:border-gray-800 pt-4">

                    {/* --- Asset Library --- */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className={`text-xs font-semibold uppercase tracking-wider ${themeClasses.textMuted}`}>
                                Your Content
                            </label>
                            <button
                                onClick={handleCreateAsset}
                                className="text-xs flex items-center gap-1 text-pink-600 font-bold hover:bg-pink-50 px-2 py-1 rounded transition-colors"
                            >
                                <Plus size={14} /> New
                            </button>
                        </div>

                        <div className="space-y-2">
                            {(introConfig.assets || []).map((asset) => (
                                <div
                                    key={asset.id}
                                    onClick={() => handleConfigUpdate({ activeAssetId: asset.id })}
                                    className={`
                                        group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all relative overflow-hidden
                                        ${asset.id === introConfig.activeAssetId
                                            ? 'bg-gradient-to-r from-pink-50 to-white dark:from-pink-900/20 dark:to-transparent border-pink-200 dark:border-pink-800 ring-1 ring-pink-100 dark:ring-pink-900'
                                            : `${themeClasses.inputBgDarker} border-transparent hover:border-gray-200 dark:hover:border-gray-700`
                                        }
                                    `}
                                >
                                    {/* Type Icon Thumbnail */}
                                    <div className={`
                                        w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                                        ${asset.type === 'game' ? 'bg-purple-100 text-purple-600' :
                                            asset.type === 'video' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}
                                    `}>
                                        {asset.type === 'game' ? <Gamepad2 size={20} /> :
                                            asset.type === 'video' ? <Video size={20} /> : <ImageIcon size={20} />}
                                    </div>

                                    {/* Label Input */}
                                    <div className="flex-1 min-w-0">
                                        <input
                                            type="text"
                                            value={asset.label}
                                            onChange={(e) => {
                                                const newAssets = introConfig.assets?.map(a => a.id === asset.id ? { ...a, label: e.target.value } : a);
                                                handleConfigUpdate({ assets: newAssets });
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="bg-transparent text-sm font-semibold w-full focus:outline-none focus:border-b border-pink-300"
                                        />
                                        <div className="text-[10px] text-gray-400 truncate">
                                            {asset.type === 'game' ? (asset.gameType || 'Custom') : (asset.contentUrl ? 'Has content' : 'Empty')}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        {asset.id === introConfig.activeAssetId && (
                                            <span className="text-[10px] font-bold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full mr-2">Active</span>
                                        )}
                                        <button
                                            onClick={(e) => handleDeleteAsset(asset.id, e)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* Active Indicator Bar */}
                                    {asset.id === introConfig.activeAssetId && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500"></div>
                                    )}
                                </div>
                            ))}
                            {(introConfig.assets?.length === 0) && (
                                <div className="text-center py-4 text-xs text-gray-400 italic border rounded-lg border-dashed">
                                    No content yet. Click "New" to start.
                                </div>
                            )}
                        </div>
                    </div>


                    {/* --- Active Asset Editor --- */}
                    {activeAsset && (
                        <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-800 animate-slide-in-right">
                            {/* Type Selector */}
                            <div className="space-y-3">
                                <label className={`text-xs font-semibold uppercase tracking-wider ${themeClasses.textMuted}`}>
                                    Editing: {activeAsset.label}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'image', icon: ImageIcon, label: 'Image' },
                                        { id: 'video', icon: Video, label: 'Video' },
                                        { id: 'game', icon: Gamepad2, label: 'Game' },
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => handleAssetUpdate({ type: type.id as any })}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${activeAsset.type === type.id
                                                ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-600'
                                                : `${themeClasses.inputBgDarker} border-transparent hover:border-gray-300 text-gray-500`
                                                }`}
                                        >
                                            <type.icon size={20} className="mb-1" />
                                            <span className="text-xs font-medium">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content Editors (Image/Video) */}
                            {(activeAsset.type === 'image' || activeAsset.type === 'video') && (
                                <div className="space-y-4">
                                    {/* Desktop Asset */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className={`text-xs font-semibold uppercase tracking-wider ${themeClasses.textMuted}`}>
                                                Desktop / Default
                                            </label>
                                            <select
                                                value={activeAsset.objectFit || 'cover'}
                                                onChange={(e) => handleAssetUpdate({ objectFit: e.target.value as any })}
                                                className={`text-xs px-2 py-1 rounded border ${themeClasses.inputBg}`}
                                            >
                                                <option value="cover">Fill Screen (Cover)</option>
                                                <option value="contain">Fit Image (Contain)</option>
                                            </select>
                                        </div>

                                        {activeAsset.contentUrl ? (
                                            <div className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 aspect-video bg-gray-100 dark:bg-gray-900">
                                                {activeAsset.type === 'image' ? (
                                                    <img
                                                        src={activeAsset.contentUrl}
                                                        alt="Desktop Intro"
                                                        className="w-full h-full"
                                                        style={{ objectFit: activeAsset.objectFit || 'cover' }}
                                                    />
                                                ) : (
                                                    <video
                                                        src={activeAsset.contentUrl}
                                                        className="w-full h-full"
                                                        style={{ objectFit: activeAsset.objectFit || 'cover' as any }}
                                                        muted
                                                        loop
                                                        playsInline
                                                    />
                                                )}
                                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleAssetUpdate({ contentUrl: undefined })}
                                                        className="p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploading}
                                                    className={`flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${themeClasses.inputBgDarker}`}
                                                >
                                                    <Plus size={24} className="text-gray-400 mb-2" />
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        {isUploading ? 'Uploading...' : 'Upload File'}
                                                    </span>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        className="hidden"
                                                        accept={activeAsset.type === 'image' ? "image/*" : "video/*"}
                                                        onChange={(e) => handleFileUpload(e, 'desktop')}
                                                    />
                                                </button>

                                                {activeAsset.type === 'image' && (
                                                    <button
                                                        onClick={() => setIsStockPhotoModalOpen(true)}
                                                        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${themeClasses.inputBgDarker}`}
                                                    >
                                                        <ImageIcon size={24} className="text-gray-400 mb-2" />
                                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                            Stock Library
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Mobile Asset */}
                                    <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center justify-between">
                                            <label className={`text-xs font-semibold uppercase tracking-wider ${themeClasses.textMuted}`}>
                                                Mobile (Optional)
                                            </label>
                                            <select
                                                value={activeAsset.mobileObjectFit || 'cover'}
                                                onChange={(e) => handleAssetUpdate({ mobileObjectFit: e.target.value as any })}
                                                className={`text-xs px-2 py-1 rounded border ${themeClasses.inputBg}`}
                                            >
                                                <option value="cover">Fill Screen (Cover)</option>
                                                <option value="contain">Fit Image (Contain)</option>
                                            </select>
                                        </div>

                                        {activeAsset.mobileContentUrl ? (
                                            <div className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 aspect-[9/16] w-1/3 mx-auto bg-gray-100 dark:bg-gray-900">
                                                {activeAsset.type === 'image' ? (
                                                    <img
                                                        src={activeAsset.mobileContentUrl}
                                                        alt="Mobile Intro"
                                                        className="w-full h-full"
                                                        style={{ objectFit: activeAsset.mobileObjectFit || 'cover' }}
                                                    />
                                                ) : (
                                                    <video
                                                        src={activeAsset.mobileContentUrl}
                                                        className="w-full h-full"
                                                        style={{ objectFit: activeAsset.mobileObjectFit || 'cover' as any }}
                                                        muted
                                                        loop
                                                        playsInline
                                                    />
                                                )}
                                                <button
                                                    onClick={() => handleAssetUpdate({ mobileContentUrl: undefined })}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = activeAsset.type === 'image' ? "image/*" : "video/*";
                                                    input.onchange = (e) => handleFileUpload(e as any, 'mobile');
                                                    input.click();
                                                }}
                                                disabled={isUploading}
                                                className={`w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${themeClasses.inputBgDarker}`}
                                            >
                                                <Plus size={18} className="text-gray-400 mr-2" />
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                    Upload Mobile Version (9:16)
                                                </span>
                                            </button>
                                        )}
                                        <p className="text-[10px] text-gray-400">
                                            If not provided, the desktop version will be used.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Game Editor */}
                            {activeAsset.type === 'game' && (
                                <div className="space-y-3">
                                    <label className={`text-xs font-semibold uppercase tracking-wider ${themeClasses.textMuted}`}>
                                        Select Game
                                    </label>
                                    <select
                                        value={activeAsset.gameType || 'bubble_pop'}
                                        onChange={(e) => handleAssetUpdate({ gameType: e.target.value as any })}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm ${themeClasses.inputBg}`}
                                    >
                                        <option value="bubble_pop">Bubble Pop</option>
                                        <option value="quiz">Daily Tech Quiz</option>
                                        <option value="piano_flow">Piano Flow</option>
                                        <option value="custom">Custom Embed</option>
                                    </select>

                                    {activeAsset.gameType === 'custom' && (
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Embed Code (Iframe)</label>
                                            <textarea
                                                value={activeAsset.embedCode || ''}
                                                onChange={(e) => handleAssetUpdate({ embedCode: e.target.value })}
                                                placeholder="<iframe src='...'></iframe>"
                                                className={`w-full px-3 py-2 border rounded-lg text-sm font-mono h-24 ${themeClasses.inputBg}`}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    )}

                    {/* Button Config (Shared/Global) */}
                    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <label className={`text-xs font-semibold uppercase tracking-wider ${themeClasses.textMuted}`}>
                            Enter Button
                        </label>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Button Text</label>
                            <input
                                type="text"
                                value={introConfig.buttonText}
                                onChange={(e) => handleConfigUpdate({ buttonText: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg text-sm ${themeClasses.inputBg}`}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Button Style</label>
                            <div className="flex gap-2">
                                {['outline', 'solid', 'glass'].map((style) => (
                                    <button
                                        key={style}
                                        onClick={() => handleConfigUpdate({ buttonStyle: style as any })}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${introConfig.buttonStyle === style
                                            ? 'bg-pink-50 border-pink-200 text-pink-600 dark:bg-pink-900/30 dark:border-pink-800 dark:text-pink-400'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                                            }`}
                                    >
                                        {style.charAt(0).toUpperCase() + style.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <StockPhotoModal
                isOpen={isStockPhotoModalOpen}
                onClose={() => setIsStockPhotoModalOpen(false)}
                onSelect={(url) => {
                    handleAssetUpdate({ contentUrl: url });
                    setIsStockPhotoModalOpen(false);
                }}
            />
        </div>
    );
};

export default SidebarIntroEditor;
