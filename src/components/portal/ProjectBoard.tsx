import React, { useState, useEffect } from 'react';
import TaskCard, { Task, Comment } from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import { Plus, Layout, Loader2 } from 'lucide-react';
import {
    getFirestore, collection, addDoc, updateDoc, deleteDoc, doc,
    onSnapshot, query, orderBy, arrayUnion, serverTimestamp
} from 'firebase/firestore';

interface ProjectBoardProps {
    isAdmin: boolean;
    userName: string;
    projectId: string; // Needed for Firestore path
}

const ProjectBoard: React.FC<ProjectBoardProps> = ({ isAdmin, userName, projectId }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Removed local form state in favor of Modal

    const db = getFirestore();

    const columns: { id: Task['status']; label: string }[] = [
        { id: 'todo', label: 'Requests / To Do' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'review', label: 'Ready for Review' },
        { id: 'done', label: 'Completed' }
    ];

    // --- Firestore Listener ---
    useEffect(() => {
        if (!projectId) return;

        const tasksRef = collection(db, 'client_projects', projectId, 'tasks');
        // Optional: Add orderBy if 'createdAt' is reliably populated
        // const q = query(tasksRef, orderBy('createdAt', 'desc')); 

        const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
            const fetchedTasks: Task[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Task));
            setTasks(fetchedTasks);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [projectId]);

    // --- Actions ---

    const handleMoveTask = async (taskId: string, newStatus: Task['status']) => {
        try {
            const taskRef = doc(db, 'client_projects', projectId, 'tasks', taskId);
            await updateDoc(taskRef, { status: newStatus });
        } catch (err) {
            console.error("Error moving task:", err);
            alert("Failed to move task");
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            const taskRef = doc(db, 'client_projects', projectId, 'tasks', taskId);
            await deleteDoc(taskRef);
        } catch (err) {
            console.error("Error deleting task:", err);
            alert("Failed to delete task");
        }
    };

    // Updated Handler to accept data object from Modal
    const handleAddTask = async (taskData: {
        title: string;
        description: string;
        priority: 'low' | 'medium' | 'high';
        status: 'todo' | 'in_progress' | 'review' | 'done';
        dueDate: string;
    }) => {
        try {
            const tasksRef = collection(db, 'client_projects', projectId, 'tasks');
            const newTask = {
                ...taskData,
                date: taskData.dueDate, // Maps modal date to task display date
                createdAt: serverTimestamp(),
                comments: []
            };
            await addDoc(tasksRef, newTask);
            setIsAddModalOpen(false);
        } catch (err) {
            console.error("Error adding task:", err);
            alert("Failed to create task");
        }
    };

    const handleAddComment = async (taskId: string, text: string) => {
        try {
            const taskRef = doc(db, 'client_projects', projectId, 'tasks', taskId);
            const newComment: Comment = {
                id: Date.now().toString(),
                user: userName,
                role: isAdmin ? 'admin' : 'client',
                text: text,
                date: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            };

            await updateDoc(taskRef, {
                comments: arrayUnion(newComment)
            });
        } catch (err) {
            console.error("Error adding comment:", err);
            alert("Failed to create comment");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Layout size={20} className="text-emerald-500" />
                    Project Pipeline
                </h2>
                {isAdmin && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 transition-colors shadow-sm text-sm font-bold"
                    >
                        <Plus size={16} />
                        Add Process Card
                    </button>
                )}
            </div>

            {/* Kanban Columns Overflow Wrapper */}
            <div className="overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
                <div className="flex gap-6 min-w-[1000px]">
                    {columns.map(col => {
                        const colTasks = tasks.filter(t => t.status === col.id);
                        return (
                            <div key={col.id} className="flex-1 min-w-[280px]">
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <h3 className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest font-serif">
                                        {col.label}
                                    </h3>
                                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full text-xs font-bold">
                                        {colTasks.length}
                                    </span>
                                </div>

                                <div className="space-y-4 min-h-[200px] h-full rounded-2xl bg-gray-50/80 dark:bg-gray-900/50 p-4 border border-dashed border-gray-200 dark:border-gray-800">
                                    {colTasks.length === 0 ? (
                                        <div className="text-center py-12 opacity-40">
                                            <div className="w-12 h-12 border-2 border-gray-300 rounded-xl mx-auto mb-2 border-dashed"></div>
                                            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Empty</span>
                                        </div>
                                    ) : (
                                        colTasks.map(task => (
                                            <TaskCard
                                                key={task.id}
                                                task={task}
                                                isAdmin={isAdmin}
                                                onMove={handleMoveTask}
                                                onDelete={handleDeleteTask}
                                                onComment={handleAddComment}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add Task Modal */}
            <CreateTaskModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddTask}
            />
        </div>
    );
};

export default ProjectBoard;
