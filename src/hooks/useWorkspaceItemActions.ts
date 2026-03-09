import { useState } from 'react';
import { useSidebarStore } from '../store/useSidebarStore';

export const useWorkspaceItemActions = (id: string, text: string) => {
    const { updateNodeTitle, deleteNode, moveNode, nodes } = useSidebarStore();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const handleRename = (newValue: string) => {
        if (newValue.trim() && newValue !== text) {
            updateNodeTitle(id, newValue.trim());
        }
        setIsEditing(false);
    };

    const handleDelete = () => {
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        deleteNode(id);
        setIsDeleteModalOpen(false);
    };

    const onMove = () => {
        setIsMoveModalOpen(true);
    };

    const confirmMove = (targetId: string | 0) => {
        moveNode(id, targetId);
        setIsMoveModalOpen(false);
    };

    return {
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        isMoveModalOpen,
        setIsMoveModalOpen,
        isEditing,
        setIsEditing,
        handleRename,
        handleDelete,
        confirmDelete,
        onMove,
        confirmMove,
        nodes
    };
};
