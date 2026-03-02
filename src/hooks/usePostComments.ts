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
    deleteDoc,
    updateDoc
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

    // Update existing comment
    const updateComment = useCallback(async (commentId: string, newContent: string) => {
        if (!currentUser || !commentId || !newContent.trim()) return;
        setSubmitting(true);
        try {
            const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
            await updateDoc(commentRef, {
                content: newContent.trim(),
                updatedAt: serverTimestamp(),
            });
        } catch (err) {
            console.error('Error updating comment:', err);
            throw err;
        } finally {
            setSubmitting(false);
        }
    }, [currentUser]);

    // Atomic deleteComment and counter decrement
    const deleteComment = useCallback(async (commentId: string) => {
        if (!currentUser || !postId || !commentId) return;
        setSubmitting(true);
        try {
            await runTransaction(db, async (transaction) => {
                const postRef = doc(db, POSTS_COLLECTION, postId);
                const postSnap = await transaction.get(postRef);
                const commentRef = doc(db, COMMENTS_COLLECTION, commentId);

                if (!postSnap.exists()) {
                    // If the post is gone, just delete the comment orchestrator-wise
                    transaction.delete(commentRef);
                    return;
                }

                const currentComments = postSnap.data()?.metrics?.comments ?? 0;
                transaction.delete(commentRef);
                transaction.update(postRef, {
                    'metrics.comments': Math.max(0, currentComments - 1),
                });
            });
        } catch (err) {
            console.error('Error deleting comment:', err);
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
        updateComment,
        deleteComment,
    };
};
