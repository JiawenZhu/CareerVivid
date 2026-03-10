import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface UserProfile {
    uid: string;
    displayName: string;
    photoURL?: string;
    headline?: string;
    avatarUrl?: string; // fallback field names seen in codebase
}

interface UserCacheState {
    cache: Record<string, UserProfile | null>; // null means fetched but not found
    loading: Record<string, boolean>;
    fetchUser: (userId: string) => Promise<UserProfile | null>;
}

export const useUserCacheStore = create<UserCacheState>((set, get) => ({
    cache: {},
    loading: {},
    fetchUser: async (userId: string) => {
        // If already in cache (including null), return it
        const currentCache = get().cache;
        if (userId in currentCache) {
            return currentCache[userId];
        }

        // Check if already loading
        if (get().loading[userId]) {
            // Wait for it? Or just return null for now. 
            // In a real hook we'd subscribe to the store.
            return null;
        }

        set((state) => ({
            loading: { ...state.loading, [userId]: true }
        }));

        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            let userData: UserProfile | null = null;

            if (userDoc.exists()) {
                const data = userDoc.data();
                userData = {
                    uid: userId,
                    displayName: data.displayName || data.firstName || 'Anonymous User',
                    photoURL: data.photoURL || data.avatarUrl || '',
                    headline: data.headline || data.professionalRole || '',
                };
            }

            set((state) => ({
                cache: { ...state.cache, [userId]: userData },
                loading: { ...state.loading, [userId]: false }
            }));

            return userData;
        } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            set((state) => ({
                loading: { ...state.loading, [userId]: false }
            }));
            return null;
        }
    },
}));

/**
 * A hook-friendly wrapper around the user cache store.
 * Returns the cached user data and a loading state.
 */
export const useUserCache = (userId: string | null | undefined) => {
    const { cache, loading, fetchUser } = useUserCacheStore();

    const user = userId ? cache[userId] : null;
    const isLoading = userId ? loading[userId] : false;

    // Trigger fetch if not in cache and not loading
    if (userId && !(userId in cache) && !loading[userId]) {
        fetchUser(userId);
    }

    return { user, isLoading };
};
