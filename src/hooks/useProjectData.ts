import { useState, useEffect } from 'react';
import {
    getFirestore, collection, query, where,
    onSnapshot, doc, getDoc, orderBy
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

export interface ProjectTask {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high';
    date: string;
    comments: any[];
}

export interface ProjectData {
    id: string;
    businessName: string;
    contactName: string;
    currentStage: number;
    stages: string[];
    nextDeadline: string;
    financials: { total: number; paid: number };
    services: { name: string; status: string }[];
    tasks: ProjectTask[];
}

export const useProjectData = () => {
    const [projectData, setProjectData] = useState<ProjectData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Use Auth Context for Admin Status
    const { currentUser, isAdmin: isContextAdmin } = useAuth();
    // Also keep local isAdmin state to return it, defaulting to context check
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const db = getFirestore();

        if (!currentUser) {
            setLoading(false);
            return;
        }

        const fetchProject = async () => {
            try {
                // Determine Admin Status reliably
                // Combined check: Context Admin OR Hardcoded Email Bypass
                const isUserAdmin = isContextAdmin || currentUser.email === 'evan@careervivid.app';
                setIsAdmin(isUserAdmin);

                let q;
                if (isUserAdmin) {
                    // Admin: Fetch ALL projects
                    // Order by lastUpdated to show active ones first
                    q = query(collection(db, 'client_projects'), orderBy('lastUpdated', 'desc'));
                } else {
                    // Client: Fetch THEIR project
                    q = query(collection(db, 'client_projects'), where('ownerId', '==', currentUser.uid));
                }

                const unsubscribeProject = onSnapshot(q, (snapshot) => {
                    if (snapshot.empty) {
                        setProjectData(null);
                        setLoading(false);
                        return; // No projects found
                    }

                    // Get the primary project document (First available)
                    const projectDoc = snapshot.docs[0];
                    const baseData = projectDoc.data();

                    const currentData: ProjectData = {
                        id: projectDoc.id,
                        businessName: baseData.businessName,
                        contactName: baseData.contactName,
                        currentStage: baseData.currentStage,
                        stages: baseData.stages || ["Onboarding", "Design", "Development", "Review", "Launch"],
                        nextDeadline: baseData.nextDeadline,
                        financials: baseData.financials || { total: 0, paid: 0 },
                        services: baseData.services || [],
                        tasks: []
                    };

                    // 2. Subscribe to Sub-collection 'tasks'
                    const tasksRef = collection(db, 'client_projects', projectDoc.id, 'tasks');

                    // Inner subscription for tasks
                    onSnapshot(tasksRef, (taskSnapshot) => {
                        const tasks: ProjectTask[] = taskSnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        } as ProjectTask));

                        // Sort tasks in memory if needed (e.g. by createdAt)
                        // tasks.sort((a,b) => ...)

                        // Update state with tasks
                        setProjectData(prev => ({
                            ...currentData,
                            tasks: tasks
                        }));
                        setLoading(false);
                    }, (taskErr) => {
                        console.error("Task Fetch Error:", taskErr);
                        setError("Failed to load tasks");
                        setLoading(false);
                    });

                }, (err) => {
                    console.error("Project Fetch Error:", err);
                    setError("Failed to load project request");
                    setLoading(false);
                });

                return () => unsubscribeProject();

            } catch (err) {
                console.error("Error setting up listeners:", err);
                setError(err instanceof Error ? err.message : "Unknown error");
                setLoading(false);
            }
        };

        fetchProject();

    }, [currentUser, isContextAdmin]); // Re-run if auth state changes

    return { projectData, loading, error, isAdmin };
};
