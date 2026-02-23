import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { Check, X, Trash2, ExternalLink, Loader2, Building2, GraduationCap, Users, Mail } from 'lucide-react';

interface PartnerApplication {
    id: string;
    type: 'academic' | 'business' | 'student';
    name: string;
    email: string;
    organization: string;
    website?: string;
    message: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any;
    accountCreated?: boolean;
    accountCreatedAt?: any;
    createdUserId?: string;
    accountCreationMessage?: string;
}

const PartnerApplicationManagement: React.FC = () => {
    const [applications, setApplications] = useState<PartnerApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'partner_applications'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const apps = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as PartnerApplication));
            setApplications(apps);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
        try {
            // Update application status
            // The backend trigger 'onPartnerApplicationUpdated' will handle role assignment and account creation
            await updateDoc(doc(db, 'partner_applications', id), {
                status: newStatus
            });

            // Update local state
            setApplications(apps => apps.map(a => a.id === id ? { ...a, status: newStatus } : a));
            setUpdatingStatusId(null);

            if (newStatus === 'approved') {
                // Status message will update via listener when backend trigger completes
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this application?")) return;
        try {
            await deleteDoc(doc(db, 'partner_applications', id));
        } catch (error) {
            console.error("Error deleting application:", error);
            alert("Failed to delete application");
        }
    };

    const getSuggestedTemplateId = (type: string, message: string) => {
        // Simple heuristic for template suggestion
        if (type === 'academic') return 'welcome_partner';
        if (type === 'business') {
            const lowerMsg = message.toLowerCase();
            if (lowerMsg.includes('hir') || lowerMsg.includes('recruit') || lowerMsg.includes('talent')) return 'welcome_business_hiring';
            if (lowerMsg.includes('brand') || lowerMsg.includes('hackathon') || lowerMsg.includes('event')) return 'welcome_business_branding';
            return 'welcome_business_general';
        }
        if (type === 'student') {
            const lowerMsg = message.toLowerCase();
            if (lowerMsg.includes('club') || lowerMsg.includes('organization') || lowerMsg.includes('society')) return 'welcome_student_club';
            return 'welcome_student_ambassador';
        }
        return 'generic_notification';
    };

    const handleSendEmail = (app: PartnerApplication) => {
        const templateId = getSuggestedTemplateId(app.type, app.message);
        // Switch to tools tab and pass params. Since AdminPage controls tabs via state, we might need to 
        // 1. Update URL search params to switch tabs if the AdminPage supports it (usually /admin?tab=tools)
        // 2. OR force a reload with new params if simplest.

        // Assuming AdminPage reads 'tab' from URL or we can set it via window.location for simplicity
        window.location.href = `/admin?tab=tools&to=${encodeURIComponent(app.email)}&templateId=${templateId}`;
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'business': return <Building2 size={16} className="text-purple-500" />;
            case 'student': return <Users size={16} className="text-pink-500" />;
            default: return <GraduationCap size={16} className="text-blue-500" />;
        }
    };

    if (loading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary-500" /></div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Partner Applications</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Review and manage incoming partnership requests.</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">Applicant</th>
                            <th className="px-6 py-4">Organization</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {applications.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                    No applications found.
                                </td>
                            </tr>
                        ) : (
                            applications.map(app => (
                                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 dark:text-white">{app.name}</div>
                                        <div className="text-sm text-gray-500">{app.email}</div>
                                        <div className="text-xs text-gray-400 mt-1 max-w-xs truncate" title={app.message}>
                                            "{app.message}"
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 dark:text-gray-200">{app.organization}</div>
                                        {app.website && (
                                            <a href={app.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                                                Visit Website <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 capitalize text-sm">
                                            {getTypeIcon(app.type)}
                                            {app.type}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            {updatingStatusId === app.id ? (
                                                <select
                                                    value={app.status}
                                                    onChange={(e) => handleStatusUpdate(app.id, e.target.value as 'approved' | 'rejected' | 'pending')}
                                                    onBlur={() => setUpdatingStatusId(null)}
                                                    className="text-xs p-1 px-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                                                    autoFocus
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="approved">Approved</option>
                                                    <option value="rejected">Rejected</option>
                                                </select>
                                            ) : (
                                                <div onClick={() => setUpdatingStatusId(app.id)} className="cursor-pointer hover:opacity-80">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                        ${app.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                            app.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                        {app.status}
                                                    </span>
                                                </div>
                                            )}
                                            {app.status === 'approved' && app.accountCreationMessage && (
                                                <div className="mt-1 text-xs">
                                                    {app.accountCreated ? (
                                                        <span className="text-green-600 dark:text-green-400">{app.accountCreationMessage}</span>
                                                    ) : (
                                                        <span className="text-red-600 dark:text-red-400" title={app.accountCreationMessage}>
                                                            {app.accountCreationMessage}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleSendEmail(app)}
                                                className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                                title="Send Welcome Email"
                                            >
                                                <Mail size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(app.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-md transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PartnerApplicationManagement;
