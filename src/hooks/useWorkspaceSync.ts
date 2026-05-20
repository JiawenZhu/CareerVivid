import { useEffect } from 'react';
import { useSidebarStore } from '../store/useSidebarStore';
import { useResumes } from '../hooks/useResumes';
import { usePortfolios } from '../hooks/usePortfolios';
import { useWhiteboards } from '../hooks/useWhiteboards';
import { useMyCommunityPosts } from '../hooks/useMyCommunityPosts';
import { SidebarNode, SidebarNodeType } from '../types';

export const useWorkspaceSync = () => {
    const { nodes, setNodes } = useSidebarStore();
    const { resumes, isLoading: isLoadingResumes } = useResumes();
    const { portfolios, isLoading: isLoadingPortfolios } = usePortfolios();
    const { whiteboards, isLoading: isLoadingWhiteboards } = useWhiteboards();
    const { posts: myCommunityPosts, isLoading: isLoadingCommunityPosts } = useMyCommunityPosts();

    useEffect(() => {
        if (isLoadingResumes || isLoadingPortfolios || isLoadingWhiteboards || isLoadingCommunityPosts) return;

        // Create a map of existing items to preserve their parent IDs
        const existingNodeParentMap = new Map(nodes.map(n => [n.id.toString(), n.parent]));

        // Filter nodes to remove any lingering mock projects or scanned projects
        const cleanExistingNodes = nodes.filter(n => {
            const lowText = n.text.toLowerCase();
            const isProjectOrMock = n.id.toString().startsWith('project-') || 
                                   n.data?.type === 'project' ||
                                   n.id === 'project-claude-code' || 
                                   n.id === 'project-antigravity' || 
                                   n.id === 'project-codex' || 
                                   ['claude-code', 'antigravity', 'codex', 'claude-code-source-code'].includes(lowText);
            return !isProjectOrMock;
        });

        // Collect all items that SHOULD be nodes
        const workspaceItems: SidebarNode[] = [
            ...resumes.map(r => {
                const id = `resume-${r.id}`;
                return {
                    id,
                    parent: existingNodeParentMap.get(id) ?? 0,
                    text: r.title,
                    droppable: false,
                    data: { isSystemNode: false, type: 'resume' as SidebarNodeType, isHidden: false }
                };
            }),
            ...portfolios.map(p => {
                const id = `portfolio-${p.id}`;
                return {
                    id,
                    parent: existingNodeParentMap.get(id) ?? 0,
                    text: p.title || 'Untitled Portfolio',
                    droppable: false,
                    data: { isSystemNode: false, type: 'portfolio' as SidebarNodeType, isHidden: false }
                };
            }),
            ...whiteboards.map(w => {
                const id = `whiteboard-${w.id}`;
                return {
                    id,
                    parent: existingNodeParentMap.get(id) ?? 0,
                    text: w.title || 'Untitled Whiteboard',
                    droppable: false,
                    data: { isSystemNode: false, type: 'whiteboard' as SidebarNodeType, isHidden: false }
                };
            }),
            ...myCommunityPosts.map(p => {
                const id = `post-${p.id}`;
                return {
                    id,
                    parent: existingNodeParentMap.get(id) ?? 0,
                    text: p.title || 'Untitled Post',
                    droppable: false,
                    data: { isSystemNode: false, type: 'post' as SidebarNodeType, isHidden: false }
                };
            })
        ];

        // Identify only truly missing items or items that need update (text or parent changes)
        const cleanExistingNodeIds = new Set(cleanExistingNodes.map(n => n.id.toString()));
        const newItemsToAdd = workspaceItems.filter(item => !cleanExistingNodeIds.has(item.id.toString()));

        let hasChanges = newItemsToAdd.length > 0 || cleanExistingNodes.length !== nodes.length;

        // Also check for title updates or icon/parent updates in existing items
        const workspaceItemMap = new Map(workspaceItems.map(item => [item.id, item]));
        const updatedNodes = cleanExistingNodes.map(node => {
            const workspaceItem = workspaceItemMap.get(node.id);
            if (workspaceItem) {
                const hasTextChange = workspaceItem.text !== node.text;
                const hasParentChange = workspaceItem.parent !== node.parent;
                const hasIconChange = workspaceItem.data?.icon !== node.data?.icon;
                if (hasTextChange || hasParentChange || hasIconChange) {
                    hasChanges = true;
                    return {
                        ...node,
                        text: workspaceItem.text,
                        parent: workspaceItem.parent,
                        data: {
                            ...node.data,
                            icon: workspaceItem.data?.icon ?? node.data?.icon
                        }
                    };
                }
            }
            return node;
        });

        if (hasChanges) {
            setNodes([...updatedNodes, ...newItemsToAdd]);
        }
    }, [resumes, portfolios, whiteboards, myCommunityPosts, isLoadingResumes, isLoadingPortfolios, isLoadingWhiteboards, isLoadingCommunityPosts, nodes, setNodes]);
};
