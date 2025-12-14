import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Copy, Check, Users, Shield, ExternalLink, Calendar, Search, ArrowLeft } from 'lucide-react';
import { UserProfile } from '../../types';

const AcademicPartnerDashboard: React.FC = () => {
    const { userProfile, loading } = useAuth();
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [copied, setCopied] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            if (!userProfile?.uid) return;

            try {
                // Determine if we should query by academicPartnerId (ideal) or fallback
                // Since this is a new feature, we query by academicPartnerId
                const q = query(
                    collection(db, 'users'),
                    where('academicPartnerId', '==', userProfile.uid)
                );

                const snap = await getDocs(q);
                const studentList = snap.docs.map(d => d.data() as UserProfile);
                setStudents(studentList);
            } catch (err) {
                console.error("Error fetching students:", err);
            } finally {
                setLoadingStudents(false);
            }
        };

        if (!loading && userProfile?.role === 'academic_partner') {
            fetchStudents();
        }
    }, [userProfile, loading]);

    const handleCopyLink = () => {
        if (!userProfile?.referralCode) return;
        const link = `https://careervivid.app/auth?ref=${userProfile.referralCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGrantAccess = async (studentId: string, currentEmail: string) => {
        if (!window.confirm(`Grant specific 1-month premium extension to ${currentEmail}?`)) return;

        try {
            const expiresAt = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
            await updateDoc(doc(db, 'users', studentId), {
                plan: 'pro_sprint',
                stripeSubscriptionStatus: null,
                expiresAt: expiresAt,
            });

            // Update local state
            setStudents(prev => prev.map(s =>
                s.uid === studentId
                    ? { ...s, plan: 'pro_sprint', expiresAt, stripeSubscriptionStatus: null } as UserProfile
                    : s
            ));

            alert("Access granted successfully.");
        } catch (err: any) {
            console.error("Error granting access:", err);
            alert("Failed to grant access. You might not have permission to modify this user.");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    if (userProfile?.role !== 'academic_partner') {
        return (
            <div className="p-10 text-center">
                <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
                <p>You do not have the Academic Partner role.</p>
            </div>
        );
    }

    const filteredStudents = students.filter(s =>
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.uid.includes(searchTerm)
    );

    const referralLink = `https://careervivid.app/auth?ref=${userProfile.referralCode || 'ERROR_NO_CODE'}`;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <a href="/dashboard" title="Back to Dashboard" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <ArrowLeft size={24} />
                    </a>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Academic Partner Portal</h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage your student licenses and track usage.</p>
                    </div>
                </div>

                {/* Referral Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <ExternalLink className="w-5 h-5" />
                        Student Onboarding Link
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Share this unique link with your students. Anyone who signs up using this link will automatically receive a <strong>1-Month Free Premium Trial</strong>.
                    </p>

                    <div className="flex gap-2">
                        <code className="flex-1 p-4 bg-gray-100 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 font-mono text-sm break-all">
                            {referralLink}
                        </code>
                        <button
                            onClick={handleCopyLink}
                            className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${copied ? 'bg-green-600 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* Student Management */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Manage Users ({students.length})
                        </h2>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    {loadingStudents ? (
                        <div className="text-center py-10 text-gray-500">Loading student data...</div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-lg dashed border-2 border-gray-200 dark:border-gray-800">
                            <p className="text-gray-500">No students found yet. Share your link to get started!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                                        <th className="py-3 px-4 font-medium">Student Name / Email</th>
                                        <th className="py-3 px-4 font-medium">Joined Date</th>
                                        <th className="py-3 px-4 font-medium">Plan Status</th>
                                        <th className="py-3 px-4 font-medium">Expires At</th>
                                        <th className="py-3 px-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredStudents.map(student => {
                                        // Check expiration first
                                        const expiresAtDate = student.expiresAt?.toDate ? student.expiresAt.toDate() : null;
                                        const isExpired = expiresAtDate ? expiresAtDate < new Date() : false;

                                        // Only consider premium if plan is valid AND not expired
                                        const hasPaidPlan = (student.plan === 'pro_monthly' || student.plan === 'pro_sprint') && !isExpired;
                                        const hasLegacyPremium = !expiresAtDate && student.promotions?.isPremium; // Legacy only if no expiry
                                        const isPremium = hasPaidPlan || hasLegacyPremium;

                                        return (
                                            <tr key={student.uid} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {student.email}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                                                        {student.uid.slice(0, 8)}...
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                                                    {student.createdAt?.toDate ? student.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isPremium && !isExpired
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                        }`}>
                                                        {isPremium && !isExpired ? 'Active Premium' : 'Free / Expired'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3 text-gray-400" />
                                                        {expiresAtDate ? expiresAtDate.toLocaleDateString() : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={() => handleGrantAccess(student.uid, student.email)}
                                                        className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                                                    >
                                                        Grant Access
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AcademicPartnerDashboard;
