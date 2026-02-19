import React, { useEffect, useState } from 'react';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { navigate } from '../../utils/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface PortalGuardProps {
    children: React.ReactNode;
}

const PortalGuard: React.FC<PortalGuardProps> = ({ children }) => {
    const { currentUser, isAdmin, loading: authLoading } = useAuth();
    const [checkingRole, setCheckingRole] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        if (!currentUser) {
            // Not logged in -> Redirect to Login
            navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
            return;
        }

        const verifyAccess = async () => {
            // 1. Super Admin / Admin Context Bypass
            // Check global isAdmin OR specific email override
            const SUPER_ADMINS = ['evan@careervivid.app'];
            if (isAdmin || (currentUser.email && SUPER_ADMINS.includes(currentUser.email))) {
                console.log("[PortalGuard] Admin Access Granted:", currentUser.email);
                setAuthorized(true);
                setCheckingRole(false);
                return;
            }

            // 2. Check User Role in Firestore (for Business Clients)
            try {
                const db = getFirestore();
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const role = userData.role;

                    console.log("[PortalGuard] User:", currentUser.email, "Role:", role);

                    if (role === 'business_client' || role === 'admin') {
                        setAuthorized(true);
                    } else {
                        // Job Seeker or other role -> Redirect
                        console.warn("[PortalGuard] Access Denied. Role:", role);
                        navigate('/dashboard');
                    }
                } else {
                    // Profile missing
                    navigate('/login');
                }
            } catch (err) {
                console.error("[PortalGuard] Error verifying role:", err);
                navigate('/dashboard');
            } finally {
                setCheckingRole(false);
            }
        };

        verifyAccess();

    }, [currentUser, isAdmin, authLoading]);

    if (authLoading || checkingRole) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-emerald-600" size={48} />
                    <p className="text-gray-500 font-medium">Verifying Access...</p>
                </div>
            </div>
        );
    }

    return authorized ? <>{children}</> : null;
};

export default PortalGuard;
