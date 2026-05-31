import { useEffect } from 'react';
import { useSidebarStore } from '../store/useSidebarStore';
import { useResumes } from '../hooks/useResumes';
import { usePortfolios } from '../hooks/usePortfolios';
import { useWhiteboards } from '../hooks/useWhiteboards';
import { useMyCommunityPosts } from '../hooks/useMyCommunityPosts';
import { usePracticeHistory } from '../hooks/useJobHistory';
import { SidebarNode, SidebarNodeType } from '../types';

export const useWorkspaceSync = () => {
    const { nodes, setNodes, isInitialized } = useSidebarStore();
    const { resumes, isLoading: isLoadingResumes } = useResumes();
    const { portfolios, isLoading: isLoadingPortfolios } = usePortfolios();
    const { whiteboards, isLoading: isLoadingWhiteboards } = useWhiteboards();
    const { posts: myCommunityPosts, isLoading: isLoadingCommunityPosts } = useMyCommunityPosts();
    const { practiceHistory, isLoading: isLoadingPracticeHistory } = usePracticeHistory();

    useEffect(() => {
        // Block sync until the sidebar store has been initialized with the user's saved Firestore tree
        if (!isInitialized) {
            return;
        }

        // Create a map of existing items to preserve their state and metadata
        const existingNodeMap = new Map(nodes.map(n => [n.id.toString(), n]));

        // Sync individual collections ONLY if they are not loading. If they are loading, retain their existing nodes.
        // Sync individual collections ONLY if they are not loading. If they are loading, retain their existing nodes.
        const syncedResumes = isLoadingResumes
            ? nodes.filter(n => n.data?.type === 'resume')
            : resumes.map(r => {
                const id = `resume-${r.id}`;
                const existing = existingNodeMap.get(id);
                const timestamp = r.updatedAt ? (new Date(r.updatedAt).getTime() || Date.now()) : Date.now();
                return {
                    id,
                    parent: existing?.parent ?? 0,
                    text: r.title,
                    droppable: existing?.droppable ?? false,
                    data: {
                        isSystemNode: false,
                        type: 'resume' as SidebarNodeType,
                        isHidden: existing?.data?.isHidden ?? false,
                        icon: existing?.data?.icon,
                        timestamp,
                        createdAt: timestamp,
                        updatedAt: timestamp
                    }
                };
            });

        const syncedPortfolios = isLoadingPortfolios
            ? nodes.filter(n => n.data?.type === 'portfolio')
            : portfolios.map(p => {
                const id = `portfolio-${p.id}`;
                const existing = existingNodeMap.get(id);
                const createdAt = p.createdAt || p.updatedAt || Date.now();
                const updatedAt = p.updatedAt || p.createdAt || Date.now();
                return {
                    id,
                    parent: existing?.parent ?? 0,
                    text: p.title || 'Untitled Portfolio',
                    droppable: existing?.droppable ?? false,
                    data: {
                        isSystemNode: false,
                        type: 'portfolio' as SidebarNodeType,
                        isHidden: existing?.data?.isHidden ?? false,
                        icon: existing?.data?.icon,
                        timestamp: createdAt,
                        createdAt,
                        updatedAt
                    }
                };
            });

        const syncedWhiteboards = isLoadingWhiteboards
            ? nodes.filter(n => n.data?.type === 'whiteboard')
            : whiteboards.map(w => {
                const id = `whiteboard-${w.id}`;
                const existing = existingNodeMap.get(id);
                const createdAt = w.createdAt || w.updatedAt || Date.now();
                const updatedAt = w.updatedAt || w.createdAt || Date.now();
                return {
                    id,
                    parent: existing?.parent ?? 0,
                    text: w.title || 'Untitled Whiteboard',
                    droppable: existing?.droppable ?? false,
                    data: {
                        isSystemNode: false,
                        type: 'whiteboard' as SidebarNodeType,
                        isHidden: existing?.data?.isHidden ?? false,
                        icon: existing?.data?.icon,
                        timestamp: createdAt,
                        createdAt,
                        updatedAt
                    }
                };
            });

        const syncedPosts = isLoadingCommunityPosts
            ? nodes.filter(n => n.data?.type === 'post')
            : myCommunityPosts.map(p => {
                const id = `post-${p.id}`;
                const existing = existingNodeMap.get(id);
                const getPostMillis = (val: any) => {
                    if (!val) return Date.now();
                    if (typeof val.toMillis === 'function') return val.toMillis();
                    return new Date(val).getTime() || Date.now();
                };
                const createdAt = getPostMillis(p.createdAt || p.updatedAt);
                const updatedAt = getPostMillis(p.updatedAt || p.createdAt);
                return {
                    id,
                    parent: existing?.parent ?? 0,
                    text: p.title || 'Untitled Post',
                    droppable: existing?.droppable ?? false,
                    data: {
                        isSystemNode: false,
                        type: 'post' as SidebarNodeType,
                        isHidden: existing?.data?.isHidden ?? false,
                        icon: existing?.data?.icon,
                        timestamp: createdAt,
                        createdAt,
                        updatedAt
                    }
                };
            });

        const syncedInterviews = isLoadingPracticeHistory
            ? nodes.filter(n => n.data?.type === 'interview')
            : practiceHistory.map(entry => {
                const id = `interview-${entry.id}`;
                const existing = existingNodeMap.get(id);
                const timestamp = entry.timestamp || Date.now();
                return {
                    id,
                    parent: existing?.parent ?? 0,
                    text: entry.job.title || 'Untitled Interview',
                    droppable: existing?.droppable ?? false,
                    data: {
                        isSystemNode: false,
                        type: 'interview' as SidebarNodeType,
                        isHidden: existing?.data?.isHidden ?? false,
                        icon: existing?.data?.icon,
                        timestamp,
                        createdAt: timestamp,
                        updatedAt: timestamp
                    }
                };
            });

        // Filter nodes to remove any lingering mock projects, scanned projects, and all dynamic types
        // This isolates static system nodes or custom folders so they are not overwritten.
        const customNodes = nodes.filter(n => {
            const lowText = n.text.toLowerCase();
            const isProjectOrMock = n.id.toString().startsWith('project-') || 
                                   n.data?.type === 'project' ||
                                   n.id === 'project-claude-code' || 
                                   n.id === 'project-antigravity' || 
                                   n.id === 'project-codex' || 
                                   ['claude-code', 'antigravity', 'codex', 'claude-code-source-code'].includes(lowText);
            const isDynamicType = ['resume', 'portfolio', 'whiteboard', 'post', 'interview'].includes(n.data?.type || '');
            return !isProjectOrMock && !isDynamicType;
        });

        // Combine and sort dynamic nodes chronologically (oldest first, so smaller timestamp comes first)
        const dynamicNodes = [
            ...syncedResumes,
            ...syncedPortfolios,
            ...syncedWhiteboards,
            ...syncedPosts,
            ...syncedInterviews
        ].sort((a, b) => {
            const aTime = a.data?.timestamp ?? 0;
            const bTime = b.data?.timestamp ?? 0;
            return aTime - bTime;
        });

        // Assemble the consolidated node list: static custom nodes first, then sorted dynamic nodes
        const newNodes = [
            ...customNodes,
            ...dynamicNodes
        ];

        // Check if there are structural/content updates compared to the current store
        const nodesChanged = JSON.stringify(newNodes) !== JSON.stringify(nodes);

        if (nodesChanged) {
            setNodes(newNodes);
        }
    }, [
        resumes,
        portfolios,
        whiteboards,
        myCommunityPosts,
        practiceHistory,
        isLoadingResumes,
        isLoadingPortfolios,
        isLoadingWhiteboards,
        isLoadingCommunityPosts,
        isLoadingPracticeHistory,
        nodes,
        setNodes,
        isInitialized
    ]);
};
