import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    runTransaction,
    where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export interface PostComment {
    id: string;
    postId: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    createdAt: any;
}

const COMMENTS_COLLECTION = 'community_post_comments';
const POSTS_COLLECTION = 'community_posts';

export const usePostComments = (postId: string) => {
    const [comments, setComments] = useState<PostComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { currentUser } = useAuth();

    // Realtime subscription — filtered by postId (server-side)
    useEffect(() => {
        if (!postId) {
            setComments([]);
            setLoading(false);
            return;
        }

        const commentsQuery = query(
            collection(db, COMMENTS_COLLECTION),
            where('postId', '==', postId),
            orderBy('createdAt', 'asc'),
        );

        const unsub = onSnapshot(commentsQuery, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as PostComment));
            setComments(data);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching comments:', err);
            setLoading(false);
        });

        return () => unsub();
    }, [postId]);

    // Atomic addComment using Firestore transaction
    // Ensures the comment doc and the counter increment either both succeed or both fail
    const addComment = useCallback(async (content: string) => {
        if (!currentUser || !postId || !content.trim()) return;

        setSubmitting(true);
        try {
            await runTransaction(db, async (transaction) => {
                const postRef = doc(db, POSTS_COLLECTION, postId);
                const postSnap = await transaction.get(postRef);

                if (!postSnap.exists()) throw new Error('Post not found.');

                const currentComments = postSnap.data()?.metrics?.comments ?? 0;

                // Create comment doc (transaction.set with a new doc ref)
                const commentRef = doc(collection(db, COMMENTS_COLLECTION));
                transaction.set(commentRef, {
                    postId,
                    authorId: currentUser.uid,
                    authorName: currentUser.displayName || 'Anonymous',
                    authorAvatar: currentUser.photoURL || '',
                    content: content.trim(),
                    createdAt: serverTimestamp(),
                });

                // Increment counter atomically using the read value
                transaction.update(postRef, {
                    'metrics.comments': currentComments + 1,
                });
            });
        } catch (err) {
            console.error('Error adding comment:', err);
            throw err;
        } finally {
            setSubmitting(false);
        }
    }, [currentUser, postId]);

    return {
        comments,
        loading,
        hasMore,
        submitting,
        addComment,
    };
};
