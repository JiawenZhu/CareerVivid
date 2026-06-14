import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Mic,
    Briefcase,
    PanelLeftClose,
    LogOut,
    LogIn,
    Sun,
    Moon,
    Monitor,
    Users,
    CreditCard,
    Gift,
    LayoutDashboard,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import Logo from '../Logo';
import { useNavigation } from '../../contexts/NavigationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { navigate } from '../../utils/navigation';
import AIUsageProgressBar from '../AIUsageProgressBar';
import { useSidebarStore } from '../../store/useSidebarStore';
import { SidebarNode } from '../../types';
import { SidebarContextMenu } from './SidebarContextMenu';
import ConfirmationModal from '../ConfirmationModal';
import { useResumes } from '../../hooks/useResumes';
import { usePortfolios } from '../../hooks/usePortfolios';
import { useWhiteboards } from '../../hooks/useWhiteboards';
import { usePracticeHistory } from '../../hooks/useJobHistory';
import { useMyCommunityPosts } from '../../hooks/useMyCommunityPosts';
import SidebarDocumentList from './SidebarDocumentList';
import { getPreferredUserAvatar } from '../../utils/avatarFallback';

const generateDefaultNodes = (t: any): SidebarNode[] => {
    return [];
};

const Sidebar: React.FC = () => {
    const { t } = useTranslation();
    const { toggleNavPosition, sidebarWidth, setSidebarWidth } = useNavigation();
    const { currentUser, userProfile, updateUserProfile, logOut, aiUsage, isPremium } = useAuth();
    const { theme, setTheme } = useTheme();
    const currentPath = window.location.pathname;

    const { updateResume, deleteResume } = useResumes();
    const { updatePortfolio, deletePortfolio } = usePortfolios();
    const { updateWhiteboard, deleteWhiteboard } = useWhiteboards();
    const { deletePracticeHistory } = usePracticeHistory();
    const { deletePost: deleteCommunityPost } = useMyCommunityPosts();
    const currentUserAvatar = currentUser ? getPreferredUserAvatar({
        photoURL: (userProfile as any)?.photoURL || currentUser.photoURL,
        avatarUrl: (userProfile as any)?.avatarUrl,
        displayName: userProfile?.displayName || currentUser.displayName,
        firstName: (userProfile as any)?.firstName,
        email: userProfile?.email || currentUser.email,
        seed: userProfile?.uid || currentUser.uid,
    }) : '';

    const isResizingRef = useRef(false);

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const stopResizing = useCallback(() => {
        if (isResizingRef.current) {
            isResizingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (!isResizingRef.current) return;
        setSidebarWidth(e.clientX);
    }, [setSidebarWidth]);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    const { nodes, setNodes, isInitialized, setIsInitialized, updateNodeTitle, deleteNode, activeNodeId, setActiveNode } = useSidebarStore();
    
    // UI Local States
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    
    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string, text: string, type: string } | null>(null);
    
    // Modal States
    const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Filter/Sort States
    const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt'>(() => {
        try {
            const current = localStorage.getItem('cv_sidebar_preferences');
            if (current) {
                const preferences = JSON.parse(current);
                if (preferences.sortBy === 'createdAt' || preferences.sortBy === 'updatedAt') {
                    return preferences.sortBy;
                }
            }
        } catch (err) {
            console.error('Error reading sort preference', err);
        }
        return 'createdAt';
    });
    const [filterType, setFilterType] = useState<string>(() => {
        try {
            const current = localStorage.getItem('cv_sidebar_preferences');
            if (current) {
                const preferences = JSON.parse(current);
                if (preferences.filterType) {
                    return preferences.filterType;
                }
            }
        } catch (err) {
            console.error('Error reading filter preference', err);
        }
        return 'all';
    });
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef<HTMLDivElement>(null);

    const savePreference = (key: 'filterType' | 'sortBy', value: string) => {
        try {
            const current = localStorage.getItem('cv_sidebar_preferences');
            const preferences = current ? JSON.parse(current) : {};
            preferences[key] = value;
            localStorage.setItem('cv_sidebar_preferences', JSON.stringify(preferences));
        } catch (err) {
            console.error('Error saving preference to localStorage', err);
        }
    };

    const lastSavedNodesRef = useRef<string>('');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
                setIsFilterDropdownOpen(false);
            }
        };

        if (isFilterDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isFilterDropdownOpen]);

    useEffect(() => {
        if (userProfile && !isInitialized) {
            let initialNodes: SidebarNode[] = [];

            if (userProfile.sidebarNodes && userProfile.sidebarNodes.length > 0) {
                initialNodes = userProfile.sidebarNodes;
            } else {
                initialNodes = generateDefaultNodes(t);
            }

            // Clean up: Filter out any leftover project nodes (claude-code, etc.)
            initialNodes = initialNodes.filter(n => {
                const isProj = n.id.toString().startsWith('project-') || 
                               n.data?.type === 'project' ||
                               n.id === 'project-claude-code' || 
                               n.id === 'project-antigravity' || 
                               n.id === 'project-codex' || 
                               n.id === 'project-claude-code-source-code' ||
                               ['claude-code', 'antigravity', 'codex', 'claude-code-source-code'].includes(n.text.toLowerCase());
                return !isProj;
            });

            // Re-parent any remaining children to root (0)
            initialNodes = initialNodes.map(n => {
                if (n.parent.toString().startsWith('project-')) {
                    return { ...n, parent: 0 };
                }
                return n;
            });

            lastSavedNodesRef.current = JSON.stringify(initialNodes);
            setNodes(initialNodes);
            setIsInitialized(true);
        }
    }, [userProfile, isInitialized, setNodes, setIsInitialized, t]);

    // Save changes when store updates externally
    const handleGlobalSave = useCallback(async () => {
        if (!userProfile || nodes.length === 0) return;
        try {
            const currentNodesStr = JSON.stringify(nodes);
            if (currentNodesStr !== lastSavedNodesRef.current) {
                lastSavedNodesRef.current = currentNodesStr;
                await updateUserProfile({ sidebarNodes: nodes });
            }
        } catch (e) {
            console.error(e);
        }
    }, [nodes, userProfile, updateUserProfile]);

    useEffect(() => {
        if (isInitialized && nodes.length > 0 && userProfile) {
            handleGlobalSave();
        }
    }, [isInitialized, handleGlobalSave, nodes, userProfile]);

    const startEditing = (id: string, text: string) => {
        setEditingNodeId(id);
        setEditValue(text);
    };

    const saveRename = async (id: string) => {
        if (editValue.trim() !== '') {
            const trimmedValue = editValue.trim();
            updateNodeTitle(id, trimmedValue);
            
            try {
                if (id.startsWith('resume-')) {
                    const rawId = id.replace('resume-', '');
                    await updateResume(rawId, { title: trimmedValue });
                } else if (id.startsWith('portfolio-')) {
                    const rawId = id.replace('portfolio-', '');
                    await updatePortfolio(rawId, { title: trimmedValue });
                } else if (id.startsWith('whiteboard-')) {
                    const rawId = id.replace('whiteboard-', '');
                    await updateWhiteboard(rawId, { title: trimmedValue });
                }
            } catch (err) {
                console.error('Error syncing rename with Firestore:', err);
            }
        }
        setEditingNodeId(null);
    };

    const confirmDelete = async () => {
        if (deleteNodeId) {
            const id = deleteNodeId;
            deleteNode(id);
            
            try {
                if (id.startsWith('resume-')) {
                    const rawId = id.replace('resume-', '');
                    await deleteResume(rawId);
                } else if (id.startsWith('portfolio-')) {
                    const rawId = id.replace('portfolio-', '');
                    await deletePortfolio(rawId);
                } else if (id.startsWith('whiteboard-')) {
                    const rawId = id.replace('whiteboard-', '');
                    await deleteWhiteboard(rawId);
                } else if (id.startsWith('interview-')) {
                    const rawId = id.replace('interview-', '');
                    await deletePracticeHistory(rawId);
                } else if (id.startsWith('post-')) {
                    const rawId = id.replace('post-', '');
                    await deleteCommunityPost(rawId);
                }
            } catch (err) {
                console.error('Error syncing delete with Firestore:', err);
            }
            
            setIsDeleteModalOpen(false);
            setDeleteNodeId(null);
        }
    };

    // Filter dynamic database assets (resumes, portfolios, whiteboards, posts, interviews) and sort chronologically/recently modified
    const activeDocuments = React.useMemo(() => {
        const docs = nodes.filter(n =>
            n.data?.type === 'resume' ||
            n.data?.type === 'portfolio' ||
            n.data?.type === 'whiteboard' ||
            n.data?.type === 'post' ||
            n.data?.type === 'interview'
        );

        const filtered = filterType === 'all'
            ? docs
            : docs.filter(n => n.data?.type === filterType);

        return [...filtered].sort((a, b) => {
            if (sortBy === 'createdAt') {
                const aTime = a.data?.createdAt ?? a.data?.timestamp ?? 0;
                const bTime = b.data?.createdAt ?? b.data?.timestamp ?? 0;
                return aTime - bTime;
            } else {
                const aTime = a.data?.updatedAt ?? a.data?.timestamp ?? 0;
                const bTime = b.data?.updatedAt ?? b.data?.timestamp ?? 0;
                return bTime - aTime; // Descending (newest first) for Recently Modified
            }
        });
    }, [nodes, sortBy, filterType]);

    const themeOptions = [
        { value: 'light', icon: <Sun size={14} />, label: 'Light' },
        { value: 'dark', icon: <Moon size={14} />, label: 'Dark' },
        { value: 'system', icon: <Monitor size={14} />, label: 'System' },
    ] as const;

    const quickLinks = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Jobs', path: '/jobs/recommend', icon: Briefcase },
        { label: 'Community', path: '/community', icon: Users },
        { label: 'Interview', path: '/interview-studio', icon: Mic },
        { label: 'Job Tracker', path: '/job-tracker', icon: Briefcase },
    ];

    const accountLinks = [
        { label: 'Subscription', path: '/subscription', icon: CreditCard },
        { label: 'Developer', path: '/developer', icon: Monitor },
        { label: 'Referrals', path: '/referrals', icon: Gift },
    ];

    const isActivePath = (path: string) => (
        path === '/dashboard'
            ? currentPath === path
            : currentPath === path || currentPath.startsWith(`${path}/`)
    );

    if (!currentUser) return null;

    return (
        <aside 
            style={{ width: `${sidebarWidth}px` }}
            className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-stone-200/70 bg-[#fbfaf7]/90 shadow-[4px_0_24px_rgba(15,23,42,0.04)] backdrop-blur-2xl transition-transform duration-300 dark:border-slate-800/70 dark:bg-slate-950/70 dark:shadow-[4px_0_24px_rgba(0,0,0,0.22)] md:flex"
        >
            {/* Header / Logo */}
            <div className="relative flex h-16 shrink-0 items-center justify-between border-b border-stone-200/70 px-4 dark:border-slate-800/70 sm:h-20">
                <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} className="flex min-w-0 items-center gap-2.5">
                    <Logo className="h-8 w-auto" />
                    <span className="truncate text-sm font-extrabold tracking-tight text-slate-950 dark:text-white">CareerVivid</span>
                </a>
                <button
                    onClick={toggleNavPosition}
                    className="rounded-xl border border-stone-200 bg-white p-1.5 text-slate-500 shadow-sm transition-colors hover:border-stone-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-100"
                    title="Toggle Sidebar"
                >
                    <PanelLeftClose size={18} />
                </button>
            </div>

            {/* Navigation main section */}
            <nav className="min-h-0 flex-1 px-3 py-3 select-none">
                <SidebarDocumentList
                    activeDocuments={activeDocuments}
                    activeNodeId={activeNodeId}
                    editingNodeId={editingNodeId}
                    editValue={editValue}
                    filterType={filterType}
                    sortBy={sortBy}
                    isFilterDropdownOpen={isFilterDropdownOpen}
                    filterDropdownRef={filterDropdownRef}
                    setActiveNode={setActiveNode}
                    setEditValue={setEditValue}
                    setEditingNodeId={setEditingNodeId}
                    setContextMenu={setContextMenu}
                    setFilterType={setFilterType}
                    setSortBy={setSortBy}
                    setIsFilterDropdownOpen={setIsFilterDropdownOpen}
                    savePreference={savePreference}
                    saveRename={saveRename}
                />
            </nav>

            {/* Utility Section */}
            <div className="relative mt-auto shrink-0 border-t border-stone-200/70 px-3 py-2.5 dark:border-slate-800/70">
                <div className="mb-2">
                    <div className="mb-1.5 flex items-center justify-between px-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-500 dark:text-slate-400">Quick Access</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        {quickLinks.map(({ label, path, icon: Icon }) => {
                            const isActive = isActivePath(path);
                            return (
                                <button
                                    key={path}
                                    onClick={() => navigate(path)}
                                    className={`flex min-h-[34px] items-center gap-2 rounded-xl border px-2 py-1.5 text-left text-[10px] font-bold transition-all ${isActive ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200' : 'border-transparent text-slate-500 hover:border-stone-200 hover:bg-white/75 hover:text-slate-950 dark:text-slate-400 dark:hover:border-slate-800 dark:hover:bg-slate-900/80 dark:hover:text-slate-100'}`}
                                >
                                    <Icon size={14} />
                                    <span className="min-w-0 truncate">{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {aiUsage && (
                    <div className="mb-2 cursor-pointer rounded-2xl border border-stone-200/80 bg-white/65 px-3 py-2 shadow-sm transition hover:border-stone-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700" onClick={() => navigate('/subscription')}>
                        <AIUsageProgressBar used={aiUsage.count || 0} limit={aiUsage.limit || 10} isPremium={isPremium} variant="minimal" />
                    </div>
                )}

                <div className="mb-2 rounded-2xl border border-stone-200/70 bg-white/45 p-1 dark:border-slate-800/80 dark:bg-slate-950/30">
                    {accountLinks.map(({ label, path, icon: Icon }) => {
                        const isActive = isActivePath(path);
                        return (
                            <button
                                key={path}
                                onClick={() => navigate(path)}
                                className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-[11px] font-semibold transition-colors ${isActive ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:bg-white/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900/80 dark:hover:text-slate-100'}`}
                            >
                                <Icon size={14} />
                                <span className="truncate">{label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Theme Toggle */}
                <div className="mb-1.5 flex items-center justify-between rounded-2xl border border-stone-200/70 bg-white/45 px-2.5 py-1.5 text-xs dark:border-slate-800/80 dark:bg-slate-950/30">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-500 dark:text-slate-400">Theme</span>
                    <div className="flex items-center gap-0.5 rounded-xl border border-stone-200 bg-stone-50 p-0.5 dark:border-slate-800 dark:bg-slate-900">
                        {themeOptions.map(opt => (
                            <button key={opt.value} onClick={() => setTheme(opt.value)} title={opt.label}
                                className={`rounded-lg p-1 transition-all ${theme === opt.value ? 'border border-stone-200 bg-white text-indigo-600 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-indigo-300' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                                {opt.icon}
                            </button>
                        ))}
                    </div>
                </div>

                {currentUser ? (
                    <button onClick={logOut} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-red-50/70 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/20 dark:hover:text-red-300">
                        <LogOut size={14} /><span>Sign out</span>
                    </button>
                ) : (
                    <button onClick={() => navigate('/signin')} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 transition-colors hover:bg-indigo-50/70 dark:text-indigo-300 dark:hover:bg-indigo-950/30">
                        <LogIn size={14} /><span>Sign in / Sign up</span>
                    </button>
                )}
            </div>

            {/* User Profile Card */}
            <div className="relative shrink-0 border-t border-stone-200/70 p-2.5 dark:border-slate-800/70">
                <div onClick={() => navigate('/profile')} className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-stone-200/70 bg-white/70 px-3 py-2 shadow-sm transition-all duration-300 hover:border-stone-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100">
                        <img src={currentUserAvatar} alt="User avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {currentUser.displayName || 'My Profile'}
                        </p>
                        <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {currentUser.email}
                        </p>
                    </div>
                </div>
            </div>

            {/* Context Menu Portal */}
            {contextMenu && createPortal(
                <SidebarContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    nodeTitle={contextMenu.text}
                    isFolder={false}
                    onClose={() => setContextMenu(null)}
                    onRename={() => {
                        startEditing(contextMenu.nodeId, contextMenu.text);
                    }}
                    onDelete={() => {
                        setDeleteNodeId(contextMenu.nodeId);
                        setIsDeleteModalOpen(true);
                    }}
                />,
                document.body
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Delete Item"
                message={`Are you sure you want to delete "${deleteNodeId ? (nodes.find(n => n.id === deleteNodeId)?.text || '') : ''}"?`}
                confirmText="Delete"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
            />

            {/* Drag handle for resizing */}
            <div
                onMouseDown={startResizing}
                className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/20 active:bg-indigo-500/40 transition-colors z-50 group"
            >
                <div className="absolute top-1/2 -translate-y-1/2 right-0 w-0.5 h-10 bg-gray-200 dark:bg-gray-800 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-400 rounded-full transition-colors opacity-0 group-hover:opacity-100 group-active:opacity-100" />
            </div>

        </aside>
    );
};

export default Sidebar;
