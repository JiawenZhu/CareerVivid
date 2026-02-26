/**
 * useCreatePost — Phase 1: Full Firebase write hook
 * Handles cover image upload to Storage + Firestore document creation.
 */
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export interface CreatePostInput {
    title: string;
    content: string;
    tags: string[];
    coverImageFile?: File | null;
    coverImageUrl?: string | null;
}

const calculateReadTime = (text: string): number =>
    Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200));

export const useCreatePost = () => {
    const { currentUser, userProfile } = useAuth();
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const publishPost = async (input: CreatePostInput): Promise<string | null> => {
        if (!currentUser) {
            setError('Must be logged in to publish.');
            return null;
        }

        setIsPublishing(true);
        setError(null);

        try {
            let finalCoverImageUrl: string | undefined = input.coverImageUrl || undefined;

            // Upload cover image to Firebase Storage if provided as a File
            if (input.coverImageFile) {
                const storageRef = ref(
                    storage,
                    `community/covers/${currentUser.uid}/${Date.now()}_${input.coverImageFile.name}`
                );
                const snap = await uploadBytes(storageRef, input.coverImageFile);
                finalCoverImageUrl = await getDownloadURL(snap.ref);
            }

            // Build a clean payload — no explicit undefined values
            const payload: Record<string, any> = {
                authorId: currentUser.uid,
                authorName: currentUser.displayName || (userProfile as any)?.name || 'Anonymous',
                authorAvatar: currentUser.photoURL || '',
                authorRole: (userProfile as any)?.role || '',
                type: 'article', // Default type for standard articles
                title: input.title.trim(),
                content: input.content.trim(),
                tags: input.tags,
                readTime: calculateReadTime(input.content),
                metrics: { likes: 0, comments: 0, views: 0 },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            if (finalCoverImageUrl) payload.coverImage = finalCoverImageUrl;

            const docRef = await addDoc(collection(db, 'community_posts'), payload);
            return docRef.id;
        } catch (err: any) {
            console.error('[useCreatePost] Error:', err);
            setError(err.message || 'Failed to publish post.');
            return null;
        } finally {
            setIsPublishing(false);
        }
    };

    return { publishPost, isPublishing, error };
};
