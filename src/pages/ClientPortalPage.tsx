import React, { useState, useEffect } from 'react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import ClientDashboard from '../components/portal/ClientDashboard';
import AdminDashboard from '../components/portal/AdminDashboard';
import { navigate } from '../utils/navigation';
import { User, Shield, Loader2 } from 'lucide-react';

// Import PortalGuard
import PortalGuard from '../components/portal/PortalGuard';
import { useProjectData } from '../hooks/useProjectData';
import { updateDoc, doc, getFirestore } from 'firebase/firestore';

const ClientPortalPage: React.FC = () => {
    const { projectData, loading, error, isAdmin } = useProjectData();
    const db = getFirestore();

    const handleAdminUpdate = async (updates: any) => {
        if (!projectData?.id) return;
        try {
            const docRef = doc(db, 'client_projects', projectData.id);
            await updateDoc(docRef, updates);
        } catch (err) {
            console.error("Update failed:", err);
            alert("Failed to update project settings");
        }
    };

    return (
        <PortalGuard>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans transition-colors duration-300">
                <PublicHeader variant="default" />

                <main className="flex-grow pt-24 pb-20">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="animate-spin text-emerald-600" size={32} />
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 py-20">
                            <h3>Error Loading Project</h3>
                            <p>{error}</p>
                        </div>
                    ) : !projectData ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Active Projects</h3>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    {isAdmin
                                        ? "There are no client projects in the database yet. Initialize one to start managing tasks."
                                        : "No project has been assigned to your account yet. Please contact support."
                                    }
                                </p>
                            </div>

                            {isAdmin && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
                                            const { getAuth } = await import('firebase/auth');
                                            const auth = getAuth();

                                            if (!auth.currentUser) return;

                                            await addDoc(collection(db, 'client_projects'), {
                                                businessName: "Demo Client Inc.",
                                                contactName: "John Doe",
                                                ownerId: auth.currentUser.uid, // Set Admin as owner for testing
                                                currentStage: 0,
                                                stages: ["Onboarding", "Design", "Development", "Review", "Launch"],
                                                nextDeadline: "Mar 01, 2026",
                                                financials: { total: 5000, paid: 2500 },
                                                services: [
                                                    { name: "Web Development", status: "In Progress" },
                                                    { name: "SEO Audit", status: "Pending" }
                                                ],
                                                lastUpdated: serverTimestamp()
                                            });
                                            alert("Demo Project Created!");
                                            // The hook will auto-refresh
                                        } catch (e) {
                                            console.error(e);
                                            alert("Failed to create project");
                                        }
                                    }}
                                    className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-lg flex items-center gap-2"
                                >
                                    <Shield size={18} />
                                    Initialize Demo Project
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {isAdmin ? (
                                <AdminDashboard
                                    data={projectData}
                                    onUpdate={handleAdminUpdate}
                                />
                            ) : (
                                <ClientDashboard data={projectData} />
                            )}
                        </>
                    )}
                </main>

                <Footer />
            </div>
        </PortalGuard>
    );
};

export default ClientPortalPage;
