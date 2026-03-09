import { create } from 'zustand';
import { SidebarNode } from '../types';

interface SidebarState {
    nodes: SidebarNode[];
    isInitialized: boolean;
    activeNodeId: string | null;
    setNodes: (nodes: SidebarNode[]) => void;
    setIsInitialized: (val: boolean) => void;
    setActiveNode: (id: string | null) => void;
    updateNodeTitle: (id: string, newTitle: string) => void;
    toggleNodeVisibility: (id: string) => void;
    getNodeTitle: (id: string) => string | undefined;
    deleteNode: (id: string) => void;
    addNode: (node: SidebarNode) => void;
    moveNode: (id: string, newParentId: string | 0) => void;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
    nodes: [],
    isInitialized: false,
    activeNodeId: null,
    setNodes: (nodes) => set({ nodes }),
    setIsInitialized: (val) => set({ isInitialized: val }),
    setActiveNode: (id) => set({ activeNodeId: id }),

    updateNodeTitle: (id, newTitle) => set((state) => ({
        nodes: state.nodes.map(node =>
            node.id === id ? { ...node, text: newTitle } : node
        )
    })),

    toggleNodeVisibility: (id) => set((state) => ({
        nodes: state.nodes.map(node =>
            node.id === id ? { ...node, data: { ...node.data, isHidden: !node.data.isHidden } } : node
        )
    })),

    getNodeTitle: (id) => {
        return get().nodes.find(n => n.id === id)?.text;
    },
    deleteNode: (id) => set((state) => {
        const getAllChildIds = (parentId: string, currentNodes: SidebarNode[]): string[] => {
            const children = currentNodes.filter(n => n.parent === parentId);
            let ids = children.map(c => c.id);
            children.forEach(c => {
                ids = [...ids, ...getAllChildIds(c.id, currentNodes)];
            });
            return ids;
        };
        const idsToDelete = [id, ...getAllChildIds(id, state.nodes)];
        return {
            nodes: state.nodes.filter(node => !idsToDelete.includes(node.id))
        };
    }),
    addNode: (node) => set((state) => ({
        nodes: [...state.nodes, node]
    })),
    moveNode: (id, newParentId) => set((state) => ({
        nodes: state.nodes.map(node =>
            node.id === id ? { ...node, parent: newParentId } : node
        )
    }))
}));
