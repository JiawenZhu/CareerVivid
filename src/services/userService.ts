import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Cache for username -> UID mappings to avoid repeated queries
const usernameCache = new Map<string, string | null>();

/**
 * Resolves a username (email prefix) to a Firebase UID.
 * 
 * For example, "evan" would resolve to the UID of the user with email "evan@jastalk.com"
 * 
 * @param username - The email prefix (part before @)
 * @returns The user's UID if found, null otherwise
 */
export const getUserIdFromUsername = async (username: string): Promise<string | null> => {
    // Check cache first
    if (usernameCache.has(username)) {
        return usernameCache.get(username) ?? null;
    }

    try {
        console.log('[UserService] Resolving username to UID:', username);

        // Query the users collection for a user whose email starts with the username
        const usersRef = collection(db, 'users');

        // We can't do a "startsWith" query directly in Firestore, so we'll fetch all users
        // and filter in memory. For better performance in production, consider maintaining
        // a separate username -> UID mapping collection.
        const snapshot = await getDocs(usersRef);

        for (const doc of snapshot.docs) {
            const userData = doc.data();
            if (userData.email) {
                const emailPrefix = userData.email.split('@')[0];
                if (emailPrefix === username) {
                    const uid = doc.id;
                    console.log('[UserService] Found UID for username:', username, '->', uid);
                    usernameCache.set(username, uid);
                    return uid;
                }
            }
        }

        console.warn('[UserService] No user found for username:', username);
        usernameCache.set(username, null);
        return null;
    } catch (error) {
        console.error('[UserService] Error resolving username:', error);
        return null;
    }
};

/**
 * Clears the username cache. Useful for testing or when user data changes.
 */
export const clearUsernameCache = () => {
    usernameCache.clear();
};
