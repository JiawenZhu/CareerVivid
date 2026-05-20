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
    Gift,
    FileText,
    LayoutDashboard,
    MoreVertical,
    Trash2,
    SlidersHorizontal,
    Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import NotificationInbox from '../NotificationInbox';
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
import { getPathForNodeId } from '../../utils/workspaceNavigation';

const generateDefaultNodes = (t: any): SidebarNode[] => {
    return [];
};

const Sidebar: React.FC = () => {
    const { t } = useTranslation();
    const { toggleNavPosition, sidebarWidth, setSidebarWidth } = useNavigation();
    const { currentUser, userProfile, updateUserProfile, logOut, aiUsage, isPremium } = useAuth();
    const { theme, setTheme } = useTheme();
    const currentPath = window.location.pathname;

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
    const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt'>('createdAt');
    const [filterType, setFilterType] = useState<string>('all');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef<HTMLDivElement>(null);

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

    const saveRename = (id: string) => {
        if (editValue.trim() !== '') {
            updateNodeTitle(id, editValue.trim());
        }
        setEditingNodeId(null);
    };

    const confirmDelete = () => {
        if (deleteNodeId) {
            deleteNode(deleteNodeId);
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

    const getDocIcon = (type: string) => {
        switch (type) {
            case 'resume':
                return <FileText size={15} className="text-sky-500" />;
            case 'portfolio':
                return <Globe size={15} className="text-emerald-500" />;
            case 'whiteboard':
                return <PenTool size={15} className="text-amber-500" />;
            case 'post':
                return <FileText size={15} className="text-violet-500" />;
            case 'interview':
                return <Mic size={15} className="text-rose-500" />;
            default:
                return <FileText size={15} className="text-gray-400" />;
        }
    };

    const themeOptions = [
        { value: 'light', icon: <Sun size={14} />, label: 'Light' },
        { value: 'dark', icon: <Moon size={14} />, label: 'Dark' },
        { value: 'system', icon: <Monitor size={14} />, label: 'System' },
    ] as const;

    if (!currentUser) return null;

    return (
        <aside 
            style={{ width: `${sidebarWidth}px` }}
            className="fixed inset-y-0 left-0 bg-white/60 dark:bg-gray-900/40 backdrop-blur-2xl border-r border-white/20 dark:border-gray-800/40 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] hidden md:flex flex-col z-30 transition-transform duration-300"
        >
            {/* Header / Logo */}
            <div className="flex items-center justify-between h-16 sm:h-20 px-6 border-b border-white/20 dark:border-gray-800/40 shrink-0 relative">
                <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} className="flex items-center">
                    <Logo className="h-8 w-auto" />
                </a>
                <button
                    onClick={toggleNavPosition}
                    className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-855 transition-colors"
                    title="Toggle Sidebar"
                >
                    <PanelLeftClose size={20} />
                </button>
            </div>

            {/* Navigation main section */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4 select-none">
                
                {/* NAVIGATION SECTION */}
                <div>
                    <div className="flex items-center justify-between px-2 group mb-2 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 relative">
                        <span>Navigation</span>
                        <div className="relative" ref={filterDropdownRef}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsFilterDropdownOpen(!isFilterDropdownOpen);
                                }}
                                className={`p-1.5 rounded-lg transition-all flex items-center gap-1 hover:bg-white/40 dark:hover:bg-gray-800/20 hover:text-gray-900 dark:hover:text-gray-100 border border-transparent hover:border-gray-250/20 dark:hover:border-gray-800/40 cursor-pointer ${isFilterDropdownOpen || filterType !== 'all' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-200/30' : 'text-gray-400 dark:text-gray-500'}`}
                                title="Filter & Sort"
                            >
                                <SlidersHorizontal size={12} />
                                {filterType !== 'all' && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                                )}
                            </button>

                            {isFilterDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/20 dark:border-gray-800/40 shadow-xl rounded-xl py-2 z-50 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                                    <div className="px-3.5 py-1.5 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 mb-1">
                                        Filter By Type
                                    </div>
                                    {[
                                        { value: 'all', label: 'All Files' },
                                        { value: 'resume', label: 'Resumes' },
                                        { value: 'portfolio', label: 'Portfolios' },
                                        { value: 'whiteboard', label: 'Whiteboards' },
                                        { value: 'interview', label: 'Interviews' }
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFilterType(opt.value);
                                            }}
                                            className={`w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left ${filterType === opt.value ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/20 dark:bg-indigo-500/5' : ''}`}
                                        >
                                            <span>{opt.label}</span>
                                            {filterType === opt.value && <Check size={12} className="text-indigo-500 shrink-0" />}
                                        </button>
                                    ))}

                                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>

                                    <div className="px-3.5 py-1.5 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                                        Sort By
                                    </div>
                                    {[
                                        { value: 'createdAt', label: 'Sequence of Events' },
                                        { value: 'updatedAt', label: 'Recently Modified' }
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSortBy(opt.value as any);
                                            }}
                                            className={`w-full flex items-center justify-between px-3.5 py-1.5 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left ${sortBy === opt.value ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/20 dark:bg-indigo-500/5' : ''}`}
                                        >
                                            <span>{opt.label}</span>
                                            {sortBy === opt.value && <Check size={12} className="text-indigo-500 shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1">
                        {activeDocuments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 px-4 border border-dashed border-gray-200 dark:border-gray-800/80 rounded-xl text-center">
                                <span className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                                    No Files Found
                                </span>
                                <span className="text-[9px] font-medium text-gray-400 dark:text-gray-500 leading-normal">
                                    {filterType === 'all' 
                                        ? 'Try creating a new document!' 
                                        : `No items match the "${filterType}" filter.`}
                                </span>
                            </div>
                        ) : (
                            activeDocuments.map(doc => (
                                <div 
                                    key={doc.id}
                                    onClick={() => {
                                        setActiveNode(doc.id.toString());
                                        navigate(getPathForNodeId(doc.id, doc.data?.type));
                                    }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setContextMenu({
                                            x: e.clientX,
                                            y: e.clientY,
                                            nodeId: doc.id,
                                            text: doc.text,
                                            type: doc.data?.type || 'file'
                                        });
                                    }}
                                    className={`group/doc flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/45 dark:hover:bg-gray-800/25 border border-transparent hover:border-gray-200/30 dark:hover:border-gray-800/30 cursor-pointer text-xs transition-all ${activeNodeId === doc.id.toString() ? 'bg-indigo-50/60 dark:bg-indigo-500/10 font-bold border-l-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                        {getDocIcon(doc.data?.type || '')}
                                    </div>

                                    {editingNodeId === doc.id ? (
                                        <input
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={() => saveRename(doc.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveRename(doc.id);
                                                if (e.key === 'Escape') setEditingNodeId(null);
                                            }}
                                            className="flex-1 bg-white dark:bg-gray-800 border border-indigo-500 rounded px-1.5 py-0.5 outline-none text-xs font-semibold text-gray-900 dark:text-gray-100"
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="flex-1 truncate">{doc.text}</span>
                                    )}

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setContextMenu({
                                                x: rect.left,
                                                y: rect.bottom,
                                                nodeId: doc.id,
                                                text: doc.text,
                                                type: doc.data?.type || 'file'
                                            });
                                        }}
                                        className="opacity-0 group-hover/doc:opacity-100 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-855 rounded text-gray-400 transition-opacity"
                                    >
                                        <MoreVertical size={12} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </nav>

            {/* Utility Section */}
            <div className="mt-auto flex flex-col gap-1 px-4 pt-4 pb-2 border-t border-transparent relative before:absolute before:inset-x-4 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent shrink-0">
                
                {/* Premium 2x2 Navigation Grid */}
                <div className="grid grid-cols-2 gap-1 mb-2.5">
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${currentPath === '/dashboard' ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm shadow-indigo-500/10' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/40 border-transparent'}`}
                    >
                        <LayoutDashboard size={13} /><span>Dashboard</span>
                    </button>
                    <button 
                        onClick={() => navigate('/community')} 
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${currentPath === '/community' ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm shadow-indigo-500/10' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/40 border-transparent'}`}
                    >
                        <Users size={13} /><span>Community</span>
                    </button>
                    <button 
                        onClick={() => navigate('/interview-studio')} 
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${currentPath === '/interview-studio' ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm shadow-indigo-500/10' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/40 border-transparent'}`}
                    >
                        <Mic size={13} /><span>Interview</span>
                    </button>
                    <button 
                        onClick={() => navigate('/job-tracker')} 
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${currentPath === '/job-tracker' ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm shadow-indigo-500/10' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/40 border-transparent'}`}
                    >
                        <Briefcase size={13} /><span>Job Tracker</span>
                    </button>
                </div>

                {aiUsage && (
                    <div className="mb-2 px-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/subscription')}>
                        <AIUsageProgressBar used={aiUsage.count || 0} limit={aiUsage.limit || 10} isPremium={isPremium} variant="minimal" />
                    </div>
                )}
                
                <button onClick={() => navigate('/subscription')} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-xs w-full text-left">
                    <CreditCard size={14} /><span>Subscription & Billing</span>
                </button>
                <button onClick={() => navigate('/developer')} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-xs w-full text-left">
                    <Monitor size={14} /><span>Developer Settings</span>
                </button>
                <button onClick={() => navigate('/referrals')} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-xs w-full text-left">
                    <Gift size={14} /><span>Referrals</span>
                </button>
                
                <NotificationInbox />

                {/* Theme Toggle */}
                <div className="flex items-center justify-between px-2.5 py-1 text-xs mb-1">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Appearance</span>
                    <div className="flex items-center gap-0.5 bg-gray-100/60 dark:bg-gray-800/40 rounded-lg p-0.5 border border-gray-250/20 dark:border-gray-800/30">
                        {themeOptions.map(opt => (
                            <button key={opt.value} onClick={() => setTheme(opt.value)} title={opt.label}
                                className={`p-1 rounded transition-all ${theme === opt.value ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/30 dark:border-gray-800/30' : 'text-gray-400 hover:text-gray-750 dark:hover:text-gray-200'}`}>
                                {opt.icon}
                            </button>
                        ))}
                    </div>
                </div>

                {currentUser ? (
                    <button onClick={logOut} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-semibold text-gray-500 hover:bg-red-50/50 dark:hover:bg-red-950/10 hover:text-red-600 transition-colors text-xs">
                        <LogOut size={14} /><span>Sign out</span>
                    </button>
                ) : (
                    <button onClick={() => navigate('/signin')} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg font-bold text-indigo-655 hover:bg-indigo-50/50 transition-colors text-xs">
                        <LogIn size={14} /><span>Sign in / Sign up</span>
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
