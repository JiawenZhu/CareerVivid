import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Loader2, X } from 'lucide-react';
import { ContactMessage } from '../../../types';
import PaginationControls from './PaginationControls';

const MessagesManagement: React.FC = () => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const paginatedMessages = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return messages.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [messages, currentPage]);

    const totalPages = Math.ceil(messages.length / ITEMS_PER_PAGE);

    useEffect(() => {
        const messagesCol = collection(db, 'contact_messages');
        const q = query(messagesCol, orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
            setMessages(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const toggleStatus = async (msg: ContactMessage) => {
        const newStatus = msg.status === 'read' ? 'unread' : 'read';
        await updateDoc(doc(db, 'contact_messages', msg.id), { status: newStatus });
    };

    if (loading) return <Loader2 className="animate-spin mx-auto" />;

    return (
        <div>
            {selectedMessage && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-xl shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedMessage.subject}</h3>
                            <button onClick={() => setSelectedMessage(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="text-sm text-gray-500 mb-4 flex justify-between">
                            <span>From: {selectedMessage.name} ({selectedMessage.email})</span>
                            <span>{selectedMessage.timestamp?.toDate().toLocaleString()}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-6">
                            {selectedMessage.message}
                        </div>
                        <div className="flex justify-end">
                            <button onClick={() => { toggleStatus(selectedMessage); setSelectedMessage(null); }} className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium text-sm">
                                Mark as {selectedMessage.status === 'read' ? 'Unread' : 'Read'} & Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedMessages.map(msg => (
                            <tr key={msg.id} className={msg.status === 'unread' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${msg.status === 'unread' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {msg.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {msg.name}
                                    <br />
                                    <span className="text-gray-500 font-normal">{msg.email}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                    {msg.subject}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {msg.timestamp?.toDate().toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => setSelectedMessage(msg)} className="text-primary-600 hover:text-primary-900 mr-4">View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div >
    );
};

export default MessagesManagement;
