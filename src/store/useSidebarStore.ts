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
        /**
         * Retrieves all descendant IDs of a given parent node using Iterative Depth-First Search (DFS).
         * 
         * Why DFS? 
         * We need to visit every node in the subtree to ensure complete deletion or relocation. 
         * DFS is ideal here as it allows us to exhaust one branch of the folder tree before 
         * moving to the next.
         * 
         * Why Iterative?
         * Recursive DFS can lead to "RangeError: Maximum call stack size exceeded" if the 
         * folder nesting is extremely deep. By using a manual stack on the heap, we 
         * ensure O(N) time complexity while protecting app stability.
         */
        const getAllChildIds = (parentId: string, currentNodes: SidebarNode[]): string[] => {
            // Optimization: Create a lookup map for children to avoid O(N^2) complexity
            const childrenMap = new Map<string | number, string[]>();
            currentNodes.forEach(node => {
                const list = childrenMap.get(node.parent) || [];
                list.push(node.id);
                childrenMap.set(node.parent, list);
            });

            const ids: string[] = [];
            // DFS Stack (Last-In, First-Out)
            const stack = [parentId];
            
            while (stack.length > 0) {
                const currentId = stack.pop()!;
                const children = childrenMap.get(currentId) || [];
                
                // Explores the current branch by pushing all children onto the stack
                children.forEach(childId => {
                    ids.push(childId);
                    stack.push(childId);
                });
            }
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
