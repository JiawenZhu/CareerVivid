import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    updateDoc,
    increment,
    getDocs,
    startAfter,
    where,
    runTransaction,
    QueryDocumentSnapshot,
    DocumentData,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ResumeData, WhiteboardData, FAQEntry } from '../types';
import { PortfolioData } from '../features/portfolio/types/portfolio';

export type CommunityPostType = 'article' | 'resume' | 'portfolio' | 'whiteboard';
export type CommunitySortMode = 'newest' | 'trending';

export interface CommunityPost {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    authorRole?: string;
    title: string;
    content: string;
    coverImage?: string;
    tags: string[];
    readTime: number;
    metrics: {
        likes: number;
        comments: number;
        views: number;
    };
    createdAt: any;
    updatedAt: any;
    // Polymorphic asset fields
    type: CommunityPostType;
    dataFormat?: 'markdown' | 'mermaid' | 'blocknote_json'; // format of the content field
    source?: 'api' | 'spa';  // how the post was published
    assetId?: string;   // ID of the resume / portfolio / whiteboard
    assetUrl?: string;  // Public link to the asset (e.g. /shared/uid/id)
    assetThumbnail?: string; // Snapshot URL or SVG string
    caption?: string;   // Short message the user adds when sharing
    resumeData?: ResumeData; // Full snapshot of resume for live rendering
    portfolioData?: PortfolioData; // Full snapshot of portfolio for live rendering
    whiteboardData?: WhiteboardData; // Full snapshot of whiteboard for live rendering
    faqs?: FAQEntry[];
}

const PAGE_SIZE = 10;
const COLLECTION = 'community_posts';

export interface UseCommunityOptions {
    typeFilter?: CommunityPostType;
}

export const useCommunity = () => {
    const { currentUser, userProfile, isAdmin } = useAuth();

    // Create a new post
    const createPost = async (postData: Partial<CommunityPost>) => {
        if (!currentUser) throw new Error('Must be logged in to post.');

        try {
            let authorName = 'Community Member'; // Default fallback

            if (userProfile?.displayName && userProfile.displayName !== 'Anonymous Developer' && userProfile.displayName !== 'Community Member') {
                authorName = userProfile.displayName;
            } else if (currentUser.displayName) {
                authorName = currentUser.displayName;
            } else if ((userProfile as any)?.name) {
                authorName = (userProfile as any)?.name;
            }

            const payload: Record<string, any> = {
                ...postData,
                authorId: currentUser.uid,
                authorName: authorName,
                authorAvatar: currentUser.photoURL || '',
                metrics: { likes: 0, comments: 0, views: 0 },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // Firestore rejects explicit `undefined` values — strip them all
            Object.keys(payload).forEach(key => {
                if (payload[key] === undefined) delete payload[key];
            });

            const docRef = await addDoc(collection(db, COLLECTION), payload);
            return docRef.id;
        } catch (err: any) {
            console.error('Error creating post:', err);
            throw err;
        }
    };

    // Atomic like/unlike using Firestore transaction
    const toggleLike = useCallback(async (postId: string) => {
        if (!currentUser) throw new Error('Must be logged in to like.');

        const likeId = `${postId}_${currentUser.uid}`;
        const likeRef = doc(db, 'community_post_likes', likeId);
        const postRef = doc(db, COLLECTION, postId);

        try {
            const result = await runTransaction(db, async (transaction) => {
                const likeSnap = await transaction.get(likeRef);
                const postSnap = await transaction.get(postRef);

                if (!postSnap.exists()) throw new Error('Post not found.');

                const currentLikes = postSnap.data()?.metrics?.likes ?? 0;

                if (likeSnap.exists()) {
                    transaction.delete(likeRef);
                    transaction.update(postRef, {
                        'metrics.likes': Math.max(0, currentLikes - 1),
                    });
                    return false;
                } else {
                    transaction.set(likeRef, {
                        postId,
                        userId: currentUser.uid,
                        createdAt: serverTimestamp(),
                    });
                    transaction.update(postRef, {
                        'metrics.likes': currentLikes + 1,
                    });
                    return true;
                }
            });

            return result;
        } catch (err) {
            console.error('Error toggling like:', err);
            throw err;
        }
    }, [currentUser]);

    const addComment = useCallback(async (postId: string, content: string) => {
        if (!currentUser) throw new Error('Must be logged in to comment.');

        const commentRef = doc(collection(db, 'community_post_comments'));
        const postRef = doc(db, COLLECTION, postId);

        try {
            await runTransaction(db, async (transaction) => {
                const postSnap = await transaction.get(postRef);
                if (!postSnap.exists()) throw new Error('Post not found.');

                const currentComments = postSnap.data()?.metrics?.comments ?? 0;

                let authorName = 'Community Member';
                if (userProfile?.displayName && userProfile.displayName !== 'Anonymous Developer') {
                    authorName = userProfile.displayName;
                } else if (currentUser.displayName) {
                    authorName = currentUser.displayName;
                }

                transaction.set(commentRef, {
                    postId,
                    content,
                    authorId: currentUser.uid,
                    authorName,
                    authorAvatar: currentUser.photoURL || '',
                    createdAt: serverTimestamp(),
                });

                transaction.update(postRef, {
                    'metrics.comments': currentComments + 1,
                });
            });
        } catch (err) {
            console.error('Error adding comment:', err);
            throw err;
        }
    }, [currentUser, userProfile]);

    const deleteComment = useCallback(async (postId: string, commentId: string) => {
        if (!currentUser) throw new Error('Must be logged in to delete.');

        const commentRef = doc(db, 'community_post_comments', commentId);
        const postRef = doc(db, COLLECTION, postId);

        try {
            await runTransaction(db, async (transaction) => {
                const commentSnap = await transaction.get(commentRef);
                const postSnap = await transaction.get(postRef);

                if (!commentSnap.exists()) throw new Error('Comment not found.');
                if (!postSnap.exists()) throw new Error('Post not found.');

                if (commentSnap.data().authorId !== currentUser.uid && !isAdmin) {
                    throw new Error('Permission denied.');
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
        }
    }, [currentUser, isAdmin]);

    const updateComment = useCallback(async (commentId: string, newContent: string) => {
        if (!currentUser || !commentId || !newContent.trim()) return;
        try {
            const commentRef = doc(db, 'community_post_comments', commentId);
            await updateDoc(commentRef, {
                content: newContent.trim(),
                updatedAt: serverTimestamp(),
            });
        } catch (err) {
            console.error('Error updating comment:', err);
            throw err;
        }
    }, [currentUser]);

    return {
        createPost,
        toggleLike,
        addComment,
        updateComment,
        deleteComment,
        userProfile,
    };
};

export const useCommunityFeed = (options: UseCommunityOptions = {}) => {
    const { typeFilter } = options;

    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

    // Build shared constraints — deterministic, used in both initial fetch & pagination
    const buildConstraints = useCallback((afterDoc?: QueryDocumentSnapshot<DocumentData> | null) => {
        const constraints: any[] = [];

        if (typeFilter) {
            constraints.push(where('type', '==', typeFilter));
        }

        constraints.push(orderBy('createdAt', 'desc'));

        if (afterDoc) {
            constraints.push(startAfter(afterDoc));
        }

        constraints.push(limit(PAGE_SIZE));
        return constraints;
    }, [typeFilter]);

    // Initial fetch — realtime for first page
    useEffect(() => {
        setLoading(true);
        setPosts([]);
        setLastVisible(null);
        setHasMore(true);

        const q = query(
            collection(db, COLLECTION),
            ...buildConstraints()
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as CommunityPost[];

            setPosts(postsData);
            setLoading(false);

            const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
            setLastVisible(lastDoc);
            setHasMore(snapshot.docs.length === PAGE_SIZE);
        }, (err) => {
            console.error('Error fetching community posts:', err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [buildConstraints]);

    // Cursor-based next page fetch
    const fetchMorePosts = useCallback(async () => {
        if (!lastVisible || isFetchingNextPage || !hasMore) return;

        setIsFetchingNextPage(true);

        try {
            const q = query(
                collection(db, COLLECTION),
                ...buildConstraints(lastVisible)
            );

            const snapshot = await getDocs(q);
            const newPosts = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as CommunityPost[];

            setPosts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const fresh = newPosts.filter(p => !existingIds.has(p.id));
                return [...prev, ...fresh];
            });

            const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
            setLastVisible(lastDoc);
            setHasMore(snapshot.docs.length === PAGE_SIZE);
        } catch (err: any) {
            console.error('Error fetching more posts:', err);
            setError(err.message);
        } finally {
            setIsFetchingNextPage(false);
        }
    }, [lastVisible, isFetchingNextPage, hasMore, buildConstraints]);

    return {
        posts,
        loading,
        isFetchingNextPage,
        hasMore,
        error,
        fetchMorePosts,
    };
};

export interface CommunityComment {
    id: string;
    postId: string;
    content: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    createdAt: any;
}

export const useComments = (postId: string) => {
    const [comments, setComments] = useState<CommunityComment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!postId) return;

        const q = query(
            collection(db, 'community_post_comments'),
            where('postId', '==', postId),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as CommunityComment[];
            setComments(commentsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [postId]);

    return { comments, loading };
};
