import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { CommunityPost } from './useCommunity';

export interface PublicProfileData {
    uid: string;
    displayName: string;
    avatar: string;
    bio: string;
    role: string;
    socialLinks: {
        github?: string;
        linkedin?: string;
        website?: string;
        twitter?: string;
    };
    publicResumes: any[];
    publicPortfolios: any[];
    recentPosts: CommunityPost[];
}

export const usePublicProfile = (profileId: string | null) => {
    const [profileData, setProfileData] = useState<PublicProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!profileId) return;

        let isMounted = true;
        setLoading(true);
        setError(null);

        const fetchProfileData = async () => {
            try {
                // 1. Fetch User Data (Non-sensitive fields only)
                const userDocRef = doc(db, 'users', profileId);
                const userDocSnap = await getDoc(userDocRef);

                if (!userDocSnap.exists()) {
                    if (isMounted) {
                        setError("User not found.");
                        setLoading(false);
                    }
                    return;
                }

                const userDataRaw = userDocSnap.data();

                // Explicitly pick only safe, public fields to prevent data leaks
                const safeUserData = {
                    uid: profileId,
                    displayName: userDataRaw.displayName || userDataRaw.firstName || 'Anonymous User',
                    avatar: userDataRaw.photoURL || userDataRaw.avatarUrl || '',
                    bio: userDataRaw.bio || '',
                    role: userDataRaw.headline || userDataRaw.professionalRole || '',
                    socialLinks: userDataRaw.socialLinks || {}
                };

                // 2. Fetch Public Resumes
                const resumesQuery = query(
                    collection(db, 'public_resumes'),
                    where('userId', '==', profileId)
                );

                // 3. Fetch Public Portfolios
                const portfoliosQuery = query(
                    collection(db, 'public_portfolios'),
                    where('userId', '==', profileId)
                );

                // 4. Fetch Recent Community Posts
                const postsQuery = query(
                    collection(db, 'community_posts'),
                    where('authorId', '==', profileId),
                    orderBy('createdAt', 'desc'),
                    limit(5)
                );

                // Execute all queries in parallel for performance
                const [resumesSnap, portfoliosSnap, postsSnap] = await Promise.all([
                    getDocs(resumesQuery),
                    getDocs(portfoliosQuery),
                    getDocs(postsQuery)
                ]);

                if (isMounted) {
                    setProfileData({
                        ...safeUserData,
                        publicResumes: resumesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                        publicPortfolios: portfoliosSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                        recentPosts: postsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as CommunityPost[]
                    });
                    setLoading(false);
                }

            } catch (err: any) {
                console.error("Error fetching public profile:", err);
                if (isMounted) {
                    setError("Unable to load profile. It may be private or deleted.");
                    setLoading(false);
                }
            }
        };

        fetchProfileData();

        return () => {
            isMounted = false;
        };
    }, [profileId]);

    return { profileData, loading, error, refetch: () => setProfileData(null) }; // Force re-trigger by nulling
};
