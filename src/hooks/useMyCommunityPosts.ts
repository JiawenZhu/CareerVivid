import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { CommunityPost } from './useCommunity';

export const useMyCommunityPosts = () => {
    const { currentUser } = useAuth();
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser) {
            setPosts([]);
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(db, 'community_posts'),
            where('authorId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CommunityPost[];
            setPosts(fetchedPosts);
            setIsLoading(false);
            setError(null);
        }, (err) => {
            console.error('Error fetching my posts:', err);
            setError('Failed to fetch your posts.');
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const deletePost = async (postId: string, coverImage?: string) => {
        if (!currentUser) return;
        try {
            await deleteDoc(doc(db, 'community_posts', postId));

            if (coverImage && coverImage.includes('firebase')) {
                // Try to delete the cover image from storage
                try {
                    // Extract path from download URL or just try to delete if it's a valid reference
                    // Depending on Firebase Storage rules this might fail, but we'll catch it
                    const imageRef = ref(storage, coverImage);
                    await deleteObject(imageRef);
                } catch (imgErr) {
                    console.warn('Failed to delete cover image, it might be orphaned or external:', imgErr);
                }
            }
        } catch (err: any) {
            console.error('Error deleting post:', err);
            throw err;
        }
    };

    return { posts, isLoading, error, deletePost };
};
