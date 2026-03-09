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

        // Collect all items that SHOULD be nodes
        const workspaceItems: SidebarNode[] = [
            ...resumes.map(r => {
                const id = `resume-${r.id}`;
                return {
                    id,
                    parent: existingNodeParentMap.get(id) ?? '/newresume', // Use existing parent if moved
                    text: r.title,
                    droppable: false,
                    data: { isSystemNode: false, type: 'resume' as SidebarNodeType, isHidden: false }
                };
            }),
            ...portfolios.map(p => {
                const id = `portfolio-${p.id}`;
                return {
                    id,
                    parent: existingNodeParentMap.get(id) ?? '/portfolio',
                    text: p.title || 'Untitled Portfolio',
                    droppable: false,
                    data: { isSystemNode: false, type: 'portfolio' as SidebarNodeType, isHidden: false }
                };
            }),
            ...whiteboards.map(w => {
                const id = `whiteboard-${w.id}`;
                return {
                    id,
                    parent: existingNodeParentMap.get(id) ?? '/whiteboard',
                    text: w.title || 'Untitled Whiteboard',
                    droppable: false,
                    data: { isSystemNode: false, type: 'whiteboard' as SidebarNodeType, isHidden: false }
                };
            }),
            ...myCommunityPosts.map(p => {
                const id = `post-${p.id}`;
                return {
                    id,
                    parent: existingNodeParentMap.get(id) ?? '/my-posts',
                    text: p.title || 'Untitled Post',
                    droppable: false,
                    data: { isSystemNode: false, type: 'post' as SidebarNodeType, isHidden: false }
                };
            })
        ];

        // Identify only truly missing items or items that need update (text changes)
        const existingNodeIds = new Set(nodes.map(n => n.id.toString()));
        const newItemsToAdd = workspaceItems.filter(item => !existingNodeIds.has(item.id.toString()));

        let hasChanges = newItemsToAdd.length > 0;

        // Also check for title updates in existing items
        const updatedNodes = nodes.map(node => {
            const workspaceItem = workspaceItems.find(item => item.id === node.id);
            if (workspaceItem && workspaceItem.text !== node.text) {
                hasChanges = true;
                return { ...node, text: workspaceItem.text };
            }
            return node;
        });

        if (hasChanges) {
            setNodes([...updatedNodes, ...newItemsToAdd]);
        }
    }, [resumes, portfolios, whiteboards, myCommunityPosts, isLoadingResumes, isLoadingPortfolios, isLoadingWhiteboards, isLoadingCommunityPosts, nodes, setNodes]);
};
