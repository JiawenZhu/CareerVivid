import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Mic,
    Globe,
    Briefcase,
    PenTool,
    PanelLeftClose,
    LogOut,
    LogIn,
    Sun,
    Moon,
    Monitor,
    Users,
    CreditCard,
    Plus,
    Settings2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from '../Logo';
import { useNavigation } from '../../contexts/NavigationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { navigate } from '../../utils/navigation';
import AIUsageProgressBar from '../AIUsageProgressBar';
import { CustomSidebarNode } from './CustomSidebarNode';
import { Tree, NodeModel } from '@minoru/react-dnd-treeview';
import { useSidebarStore } from '../../store/useSidebarStore';
import { SidebarNode } from '../../types';

const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
];

const generateDefaultNodes = (t: any): SidebarNode[] => {
    return [
        { id: '/dashboard', parent: 0, text: 'Dashboard', droppable: false, data: { isSystemNode: true, type: 'system', isHidden: false } },
        { id: '/my-posts', parent: 0, text: t('nav.my_posts', 'My Posts'), droppable: false, data: { isSystemNode: true, type: 'system', isHidden: false } },
        { id: 'create-hub', parent: 0, text: t('nav.create_build_hub', 'Create & Build Hub'), droppable: true, data: { isSystemNode: false, type: 'custom-folder', isHidden: false, isCreationLink: true } },
        { id: '/newresume', parent: 'create-hub', text: t('nav.resumes', 'Resumes'), droppable: false, data: { isSystemNode: true, type: 'system', isHidden: false, isCreationLink: true } },
        { id: '/portfolio', parent: 'create-hub', text: t('nav.portfolios', 'Portfolios'), droppable: false, data: { isSystemNode: true, type: 'system', isHidden: false, isCreationLink: true } },
        { id: '/whiteboard', parent: 'create-hub', text: t('nav.whiteboards', 'Whiteboards'), droppable: false, data: { isSystemNode: true, type: 'system', isHidden: false, isCreationLink: true } },
        { id: '/interview-studio', parent: 'create-hub', text: t('nav.interview_studio', 'Interview Studio'), droppable: false, data: { isSystemNode: true, type: 'system', isHidden: false, isCreationLink: true } },
        { id: '/job-tracker', parent: 'create-hub', text: t('dashboard.job_tracker', 'Job Tracker'), droppable: false, data: { isSystemNode: true, type: 'system', isHidden: false, isCreationLink: true } },
    ];
};

const Sidebar: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { toggleNavPosition } = useNavigation();
    const { currentUser, userProfile, updateUserProfile, logOut, aiUsage, isPremium } = useAuth();
    const { theme, setTheme } = useTheme();
    const currentPath = window.location.pathname;

    const [isEditMode, setIsEditMode] = useState(false);
    const { nodes, setNodes, isInitialized, setIsInitialized } = useSidebarStore();
    const [treeData, setTreeData] = useState<SidebarNode[]>([]);
    const lastSavedNodesRef = useRef<string>('');

    useEffect(() => {
        // Initialize from profile or defaults
        if (userProfile && !isInitialized) {
            let initialNodes: SidebarNode[] = [];

            if (userProfile.sidebarNodes && userProfile.sidebarNodes.length > 0) {
                initialNodes = userProfile.sidebarNodes;

                // Self-healing: Ensure system nodes are never lost
                const defaultNodes = generateDefaultNodes(t);
                const systemNodes = defaultNodes.filter(n => n.data?.isSystemNode);
                const missingSystemNodes = systemNodes.filter(sysNode => !initialNodes.some(n => n.id === sysNode.id));

                if (missingSystemNodes.length > 0) {
                    initialNodes = [...missingSystemNodes, ...initialNodes];
                }
            } else {
                initialNodes = generateDefaultNodes(t);
            }

            lastSavedNodesRef.current = JSON.stringify(initialNodes);
            setNodes(initialNodes);
            setTreeData(initialNodes);
            setIsInitialized(true);
        } else if (isInitialized && nodes.length > 0) {
            setTreeData(nodes); // sync local treeData with zustand store
        }
    }, [userProfile, nodes, setNodes, t, isInitialized, setIsInitialized]);

    // Handle dropping an item
    const handleDrop = async (newTree: NodeModel<SidebarNode['data']>[]) => {
        const typedTree = newTree as SidebarNode[];

        // Optimistically update both state and store
        setTreeData(typedTree);
        setNodes(typedTree);

        if (!userProfile) return;

        try {
            console.log("Saving sidebar changes to profile...", typedTree);
            lastSavedNodesRef.current = JSON.stringify(typedTree);
            await updateUserProfile({
                sidebarNodes: typedTree
            });
            console.log("Sidebar changes saved successfully.");
        } catch (err) {
            console.error("Failed to save sidebar data", err);
        }
    };

    // Global save when store changes externally (like renaming or visibility toggle)
    const handleGlobalSave = useCallback(async () => {
        if (!userProfile) return;
        try {
            const currentNodesStr = JSON.stringify(nodes);
            if (currentNodesStr !== lastSavedNodesRef.current) {
                lastSavedNodesRef.current = currentNodesStr;
                await updateUserProfile({ sidebarNodes: nodes });
            }
        } catch (e) {
            console.error(e);
        }
    }, [nodes, updateUserProfile, userProfile]);

    // Debounce or tie save to end of edit mode for renaming/toggles to avoid spamming Firestore
    useEffect(() => {
        if (isInitialized && !isEditMode && nodes.length > 0 && userProfile) {
            handleGlobalSave();
        }
    }, [isInitialized, isEditMode, handleGlobalSave, nodes, userProfile]);

    const handleAddFolder = () => {
        const newFolderId = `folder-${Date.now()}`;
        const newFolder: SidebarNode = {
            id: newFolderId,
            parent: 0,
            text: 'New Folder',
            droppable: true,
            data: {
                isSystemNode: false,
                type: 'custom-folder',
                isHidden: false
            }
        };
        const newNodes = [...nodes, newFolder];
        setNodes(newNodes);
        setTreeData(newNodes);

        if (userProfile) {
            lastSavedNodesRef.current = JSON.stringify(newNodes);
            updateUserProfile({ sidebarNodes: newNodes }).catch(err => {
                console.error("Failed to save new folder to profile", err);
            });
        }
    };

    const themeOptions = [
        { value: 'light', icon: <Sun size={14} />, label: 'Light' },
        { value: 'dark', icon: <Moon size={14} />, label: 'Dark' },
        { value: 'system', icon: <Monitor size={14} />, label: 'System' },
    ] as const;

    if (!currentUser) return null;

    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-white/60 dark:bg-gray-900/40 backdrop-blur-2xl border-r border-white/20 dark:border-gray-800/40 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] hidden md:flex flex-col z-30 transition-transform duration-300">
            {/* Header / Logo */}
            <div className="flex items-center justify-between h-16 sm:h-20 px-6 border-b border-white/20 dark:border-gray-800/40 shrink-0 relative before:absolute before:inset-x-6 before:bottom-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
                <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} className="flex items-center">
                    <Logo className="h-8 w-auto" />
                </a>
                <button
                    onClick={toggleNavPosition}
                    className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Toggle Sidebar"
                >
                    <PanelLeftClose size={20} />
                </button>
            </div>

            {/* Main Navigation Tree */}
            <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-1 relative">
                <div className="flex items-center justify-between px-2 group mb-2">
                    <span className="text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase">
                        Navigation
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleAddFolder}
                            className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            title="New Folder"
                        >
                            <Plus size={14} />
                        </button>
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`p-1 rounded-md transition-colors ${isEditMode
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 opacity-100'
                                : 'opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            title={isEditMode ? "Done Editing" : "Edit Navigation"}
                        >
                            <Settings2 size={14} />
                        </button>
                    </div>
                </div>

                <div className="relative min-h-[300px]">
                    {treeData.length > 0 ? (
                        <Tree
                            tree={treeData}
                            rootId={0}
                            onDrop={(newTree) => {
                                handleDrop(newTree);
                            }}
                            canDrop={(tree, { dragSource, dropTargetId, dropTarget }) => {
                                if (!isEditMode) return false;
                                return true;
                            }}
                            classes={{
                                root: "min-h-[300px] mb-20",
                                draggingSource: "opacity-30",
                                dropTarget: "bg-indigo-50/50 dark:bg-indigo-500/5 ring-2 ring-indigo-500/50 rounded-lg",
                            }}
                            render={(node, { depth, isOpen, onToggle }) => (
                                <div className="mb-0.5 relative">
                                    <CustomSidebarNode
                                        node={node}
                                        depth={depth}
                                        isOpen={isOpen}
                                        onToggle={onToggle}
                                        isEditMode={isEditMode}
                                    />
                                    {/* Removed legacy active indicators in favor of node-local styling */}
                                </div>
                            )}
                        />
                    ) : (
                        !isEditMode && <div className="p-4 text-sm text-center text-gray-400">Loading navigation...</div>
                    )}

                    {isEditMode && (
                        <div className="mt-2 px-2">
                            <button
                                onClick={handleAddFolder}
                                className="w-full flex items-center gap-2 py-2 px-3 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-dashed border-gray-300 dark:border-gray-700"
                            >
                                <Plus size={16} />
                                <span>Add New Folder</span>
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* Utility Section */}
            <div className="mt-auto flex flex-col gap-1 px-4 pt-4 pb-2 border-t border-transparent relative before:absolute before:inset-x-4 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
                {aiUsage && (
                    <div className="mb-2 px-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/subscription')}>
                        <AIUsageProgressBar used={aiUsage.count || 0} limit={aiUsage.limit || 10} isPremium={isPremium} variant="minimal" />
                    </div>
                )}
                <button onClick={() => navigate('/subscription')} className="flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm w-full text-left">
                    <CreditCard size={18} /><span>Subscription & Billing</span>
                </button>
                <button onClick={() => navigate('/developer')} className="flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm w-full text-left">
                    <Monitor size={18} /><span>Developer Settings</span>
                </button>
                <button onClick={() => navigate('/community')} className="flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm w-full text-left">
                    <Users size={18} /><span>Community</span>
                </button>

                {/* Theme Toggle */}
                <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Theme</span>
                    <div className="flex items-center gap-0.5 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl p-1 border border-gray-200/50 dark:border-gray-700/50 shadow-inner">
                        {themeOptions.map(opt => (
                            <button key={opt.value} onClick={() => setTheme(opt.value)} title={opt.label}
                                className={`p-1.5 rounded-md transition-all ${theme === opt.value ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                                {opt.icon}
                            </button>
                        ))}
                    </div>
                </div>

                {currentUser ? (
                    <button onClick={logOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors text-sm">
                        <LogOut size={18} /><span>Sign out</span>
                    </button>
                ) : (
                    <button onClick={() => navigate('/signin')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors text-sm">
                        <LogIn size={18} /><span>Sign in / Sign up</span>
                    </button>
                )}
            </div>

            {/* User Profile Card */}
            <div className="p-4 border-t border-transparent relative before:absolute before:inset-x-4 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent shrink-0">
                <div onClick={() => navigate('/profile')} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/80 dark:hover:bg-gray-800/60 shadow-sm border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50 transition-all duration-300 group">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                        {currentUser.photoURL ? (
                            <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-indigo-700 font-bold text-sm">{currentUser.email?.[0].toUpperCase() || 'U'}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {currentUser.displayName || 'My Profile'}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
