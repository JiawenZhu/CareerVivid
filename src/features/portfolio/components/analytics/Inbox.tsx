import React, { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    writeBatch,
    doc,
    Timestamp
} from 'firebase/firestore';
import { db } from '../../../../firebase';
import {
    Mail,
    MessageSquare,
    Trash2,
    CheckCircle,
    Circle,
    Loader2,
    CheckSquare,
    Square,
    RefreshCw
} from 'lucide-react';
import { PortfolioMessage } from '../../services/messageService';

interface InboxProps {
    portfolioId: string;
    ownerId: string;
}

interface InboxMessage extends PortfolioMessage {
    id: string;
}

export const Inbox: React.FC<InboxProps> = ({ portfolioId, ownerId }) => {
    const [messages, setMessages] = useState<InboxMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<'all' | 'unread' | 'done'>('all');

    // Fetch Messages with Data Isolation
    useEffect(() => {
        if (!portfolioId || !ownerId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const messagesRef = collection(db, 'users', ownerId, 'messages');

        // Strict Scoping: Filter by portfolioId
        const q = query(
            messagesRef,
            where('portfolioId', '==', portfolioId),
            where('isDeleted', '==', false),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as InboxMessage[];

            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error("Inbox data fetch error (check indices):", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [portfolioId, ownerId]);

    // Derived state for filtering
    const displayedMessages = messages.filter(msg => {
        if (filter === 'unread') return !msg.isRead && !msg.isDone;
        if (filter === 'done') return msg.isDone;
        return !msg.isDone; // Default view usually hides 'done' or maybe shows all? 
        // Let's say 'all' shows active (not done) by default context, 
        // but 'Inbox' usually implies 'not done'. 
        // Let's Stick to: All = Not Done (Inbox), Done = Archive.
    });

    // Correction: User said "Mark as Done... visually gray out ... without removing". 
    // So 'All' should probably show them but grayed out? 
    // Or maybe tabs? Let's keep it simple: Show all in 'All', visual distinction.
    const finalMessages = messages.filter(msg => {
        // Should we hide deleted? Yes (handled by query).
        // Just return all for now and handle visual states.
        return true;
    });

    // Selection Logic
    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === finalMessages.length) {
            setSelectedIds(new Set());
        } else {
            const allIds = new Set(finalMessages.map(m => m.id));
            setSelectedIds(allIds);
        }
    };

    // Actions
    const handleBulkAction = async (action: 'markRead' | 'markDone' | 'delete') => {
        if (selectedIds.size === 0) return;

        const batch = writeBatch(db);
        selectedIds.forEach(id => {
            const ref = doc(db, 'users', ownerId, 'messages', id);
            if (action === 'markRead') batch.update(ref, { isRead: true });
            if (action === 'markDone') batch.update(ref, { isDone: true });
            if (action === 'delete') batch.update(ref, { isDeleted: true });
        });

        try {
            await batch.commit();
            setSelectedIds(new Set());
        } catch (error) {
            console.error("Bulk action failed:", error);
        }
    };

    const toggleReadStatus = async (msg: InboxMessage) => {
        const ref = doc(db, 'users', ownerId, 'messages', msg.id);
        await import('firebase/firestore').then(({ updateDoc }) =>
            updateDoc(ref, { isRead: !msg.isRead })
        );
    };

    if (loading) {
        return <div className="p-12 text-center text-gray-500"><Loader2 className="animate-spin mx-auto mb-2" />Loading messages...</div>;
    }

    return (
        <div className="bg-white dark:bg-[#1a1d24] rounded-xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col h-[600px]">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleSelectAll}
                            className="text-gray-500 hover:text-indigo-600 transition-colors"
                        >
                            {selectedIds.size > 0 && selectedIds.size === finalMessages.length ? (
                                <CheckSquare size={18} className="text-indigo-600" />
                            ) : (
                                <Square size={18} />
                            )}
                        </button>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Inbox'}
                        </span>
                    </div>

                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2 ml-4 animate-in fade-in slide-in-from-left-2 duration-200">
                            <button
                                onClick={() => handleBulkAction('markDone')}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-md hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
                            >
                                <CheckCircle size={14} className="text-green-500" />
                                Mark Done
                            </button>
                            <button
                                onClick={() => handleBulkAction('delete')}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>

                <div className="text-xs text-gray-500">
                    {finalMessages.length} total
                </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
                {finalMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Mail size={48} className="mb-4 opacity-20" />
                        <p>No messages found</p>
                    </div>
                ) : (
                    finalMessages.map((msg) => {
                        const isSelected = selectedIds.has(msg.id);
                        return (
                            <div
                                key={msg.id}
                                className={`group flex items-start gap-4 p-4 transition-colors cursor-pointer
                                    ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}
                                    ${!msg.isRead ? 'bg-gray-50 dark:bg-white/[0.02]' : ''}
                                    ${msg.isDone ? 'opacity-60 grayscale-[0.5]' : ''}
                                `}
                            >
                                {/* Checkbox */}
                                <div className="pt-1" onClick={(e) => { e.stopPropagation(); toggleSelection(msg.id); }}>
                                    {isSelected ? (
                                        <CheckSquare size={18} className="text-indigo-600" />
                                    ) : (
                                        <Square size={18} className="text-gray-300 group-hover:text-gray-400" />
                                    )}
                                </div>

                                {/* Content Click Area */}
                                <div
                                    className="flex-1 min-w-0"
                                    onClick={() => toggleReadStatus(msg)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            {/* Unread Indicator */}
                                            {!msg.isRead && !msg.isDone && (
                                                <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                                            )}
                                            <span className={`text-sm font-semibold truncate ${!msg.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {msg.senderName}
                                            </span>
                                            {msg.senderEmail && (
                                                <span className="text-xs text-gray-400 truncate hidden sm:inline">&lt;{msg.senderEmail}&gt;</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                            {msg.createdAt && typeof msg.createdAt === 'object' && 'seconds' in msg.createdAt
                                                ? new Date((msg.createdAt as any).seconds * 1000).toLocaleDateString()
                                                : 'Just now'}
                                        </span>
                                    </div>

                                    <h4 className={`text-sm mb-1 ${!msg.isRead ? 'font-medium text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-500'}`}>
                                        {msg.subject}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-500 line-clamp-2">
                                        {msg.text}
                                    </p>
                                </div>

                                {/* Per-item Actions (visible on hover) */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 self-center">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleReadStatus(msg); }}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-gray-100 dark:hover:bg-white/10"
                                        title={msg.isRead ? "Mark as unread" : "Mark as read"}
                                    >
                                        <Mail size={16} />
                                    </button>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            const ref = doc(db, 'users', ownerId, 'messages', msg.id);
                                            await import('firebase/firestore').then(({ updateDoc }) =>
                                                updateDoc(ref, { isDone: !msg.isDone })
                                            );
                                        }}
                                        className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 ${msg.isDone ? 'text-green-500' : 'text-gray-400 hover:text-green-600'}`}
                                        title={msg.isDone ? "Mark as undone" : "Mark as done"}
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
