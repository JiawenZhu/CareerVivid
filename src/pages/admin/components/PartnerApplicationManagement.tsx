import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Trash2, ExternalLink, Loader2, Building2, Briefcase, GraduationCap, Users, Mail, BarChart3, Copy } from 'lucide-react';
import type { AgencyBranchProfile, PartnerApplicationType } from '../../../types';
import { listenAgencyBranchesForAdmin } from '../../../services/agencyPartnerService';
import { navigate } from '../../../utils/navigation';

interface PartnerApplication {
    id: string;
    type: PartnerApplicationType;
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
    const [agencyBranches, setAgencyBranches] = useState<AgencyBranchProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingAgencyBranches, setLoadingAgencyBranches] = useState(true);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [copiedBranchId, setCopiedBranchId] = useState<string | null>(null);

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

    useEffect(() => {
        const unsubscribe = listenAgencyBranchesForAdmin((branches) => {
            setAgencyBranches(branches);
            setLoadingAgencyBranches(false);
        }, (error) => {
            console.error('Error loading agency branches:', error);
            setLoadingAgencyBranches(false);
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
        if (type === 'agency') return 'welcome_business_hiring';
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

    const handleOpenAgencyDashboard = (branchId: string) => {
        navigate(`/agency-partner/dashboard?branchId=${encodeURIComponent(branchId)}`);
    };

    const handleCopyInviteLink = async (branch: AgencyBranchProfile) => {
        const inviteLink = `${window.location.origin}/prepare/${branch.slug}`;
        await navigator.clipboard.writeText(inviteLink);
        setCopiedBranchId(branch.id);
        window.setTimeout(() => setCopiedBranchId(null), 1600);
    };

    const getBranchForApplication = (app: PartnerApplication) => {
        if (app.type !== 'agency') return null;
        return agencyBranches.find(branch =>
            branch.id === app.id ||
            branch.ownerUserId === app.createdUserId ||
            branch.contactEmail?.toLowerCase() === app.email.toLowerCase()
        ) || null;
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'business': return <Building2 size={16} className="text-purple-500" />;
            case 'agency': return <Briefcase size={16} className="text-emerald-600" />;
            case 'student': return <Users size={16} className="text-pink-500" />;
            default: return <GraduationCap size={16} className="text-blue-500" />;
        }
    };

    if (loading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <section className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="flex flex-col gap-3 p-6 border-b border-gray-200 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Agency Dashboards</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Jump into any agency pilot without loading every agency workspace first.</p>
                    </div>
                    <button
                        onClick={() => navigate('/partners/apply?type=agency')}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                        <Briefcase size={16} />
                        Agency application
                    </button>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {loadingAgencyBranches ? (
                        <div className="flex items-center gap-3 px-6 py-5 text-sm font-medium text-gray-500 dark:text-gray-400">
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                            Loading agency branches...
                        </div>
                    ) : agencyBranches.length === 0 ? (
                        <div className="px-6 py-6 text-sm text-gray-500 dark:text-gray-400">
                            No approved agency branches yet. Approved agency applications will appear here with direct dashboard and invite links.
                        </div>
                    ) : (
                        agencyBranches.map(branch => (
                            <div key={branch.id} className="grid gap-4 px-6 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(180px,0.6fr)_auto] md:items-center">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate font-bold text-gray-900 dark:text-white">{branch.branchName}</p>
                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold capitalize text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                            {branch.pilotStatus}
                                        </span>
                                    </div>
                                    <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{branch.organization} · {branch.contactEmail}</p>
                                    <p className="mt-1 truncate text-xs font-medium text-gray-400 dark:text-gray-500">/prepare/{branch.slug}</p>
                                </div>

                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    <p className="font-semibold">{branch.inviteLimit || 20} pilot invites</p>
                                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Branch ID: {branch.id}</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                                    <button
                                        onClick={() => handleOpenAgencyDashboard(branch.id)}
                                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                                        title="Open agency dashboard"
                                    >
                                        <BarChart3 size={15} />
                                        Dashboard
                                    </button>
                                    <button
                                        onClick={() => handleCopyInviteLink(branch)}
                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                                        title="Copy branch invite link"
                                    >
                                        <Copy size={15} />
                                        {copiedBranchId === branch.id ? 'Copied' : 'Invite'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
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
                            applications.map(app => {
                                const agencyBranch = getBranchForApplication(app);
                                return (
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
                                            {agencyBranch && (
                                                <button
                                                    onClick={() => handleOpenAgencyDashboard(agencyBranch.id)}
                                                    className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                                                    title="Open Agency Dashboard"
                                                >
                                                    <BarChart3 size={16} />
                                                </button>
                                            )}
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
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
        </div>
    );
};

export default PartnerApplicationManagement;
