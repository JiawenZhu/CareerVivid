import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Loader2 } from 'lucide-react';
import PaginationControls from './PaginationControls';

const ErrorManagement: React.FC = () => {
    const [errors, setErrors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedError, setSelectedError] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        const errorsCol = collection(db, 'error_reports');
        const q = query(errorsCol, orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, snapshot => {
            const errorsFromDb = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setErrors(errorsFromDb);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching errors:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const filteredErrors = useMemo(() => {
        return errors.filter(err => {
            const searchLower = searchTerm.toLowerCase();
            const matchesUser = (err.userEmail || '').toLowerCase().includes(searchLower);
            const matchesMessage = (err.message || '').toLowerCase().includes(searchLower);
            return matchesUser || matchesMessage;
        });
    }, [errors, searchTerm]);

    const paginatedErrors = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredErrors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredErrors, currentPage]);

    const totalPages = Math.ceil(filteredErrors.length / ITEMS_PER_PAGE);

    const handleStatusChange = async (id: string, newStatus: string) => {
        const errorRef = doc(db, 'error_reports', id);
        await updateDoc(errorRef, { status: newStatus });
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div>;

    const statusColors: { [key: string]: string } = {
        'New': 'bg-red-100 text-red-800',
        'Acknowledged': 'bg-yellow-100 text-yellow-800',
        'Resolved': 'bg-green-100 text-green-800',
    };

    return (
        <div>
            {selectedError && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl shadow-xl">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Error Details</h3>
                        <div className="text-sm space-y-2 mb-4">
                            <p><strong>Message:</strong> {selectedError.message}</p>
                            <p><strong>User:</strong> {selectedError.userEmail}</p>
                            <p><strong>URL:</strong> {selectedError.url}</p>
                        </div>
                        <h4 className="font-semibold mb-2">Stack Trace:</h4>
                        <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md text-xs overflow-auto max-h-60">
                            <code>{selectedError.stack || 'No stack trace available.'}</code>
                        </pre>
                        <div className="flex justify-end mt-6">
                            <button onClick={() => setSelectedError(null)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold text-sm">Close</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by user or error message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedErrors.map(err => (
                            <tr key={err.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{err.userEmail || 'N/A'}</td>
                                <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400 max-w-md truncate">
                                    <button onClick={() => setSelectedError(err)} className="hover:underline">{err.message}</button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{err.url}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{err.timestamp?.toDate().toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={err.status}
                                        onChange={(e) => handleStatusChange(err.id, e.target.value)}
                                        className={`p-1 rounded text-xs border-transparent focus:ring-2 focus:ring-primary-500 ${statusColors[err.status] || 'bg-gray-100'}`}
                                    >
                                        <option value="New">New</option>
                                        <option value="Acknowledged">Acknowledged</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
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
        </div>
    );
};

export default ErrorManagement;
