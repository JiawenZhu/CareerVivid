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
    QueryDocumentSnapshot,
    DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export type CommunityPostType = 'article' | 'resume' | 'portfolio' | 'whiteboard';

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
    assetId?: string;   // ID of the resume / portfolio / whiteboard
    assetUrl?: string;  // Public link to the asset (e.g. /shared/uid/id)
    caption?: string;   // Short message the user adds when sharing
}

const PAGE_SIZE = 10;
const COLLECTION = 'community_posts';

export const useCommunity = (typeFilter?: CommunityPostType) => {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const { currentUser } = useAuth();

    // Initial fetch — realtime for first page
    useEffect(() => {
        const constraints: any[] = [];
        if (typeFilter) constraints.push(where('type', '==', typeFilter));
        constraints.push(orderBy('createdAt', 'desc'), limit(PAGE_SIZE));

        const q = query(
            collection(db, COLLECTION),
            ...constraints
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
    }, [typeFilter]);

    // Cursor-based next page fetch
    const fetchMorePosts = useCallback(async () => {
        if (!lastVisible || isFetchingNextPage || !hasMore) return;

        setIsFetchingNextPage(true);

        try {
            const constraints: any[] = [];
            if (typeFilter) constraints.push(where('type', '==', typeFilter));
            constraints.push(orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(PAGE_SIZE));

            const q = query(
                collection(db, COLLECTION),
                ...constraints
            );

            const snapshot = await getDocs(q);
            const newPosts = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as CommunityPost[];

            setPosts(prev => {
                // Deduplicate by id in case realtime sub fires around same time
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
    }, [lastVisible, isFetchingNextPage, hasMore]);

    // Create a new post
    const createPost = async (postData: Partial<CommunityPost>) => {
        if (!currentUser) throw new Error('Must be logged in to post.');

        try {
            const payload: Record<string, any> = {
                ...postData,
                authorId: currentUser.uid,
                authorName: currentUser.displayName || 'Anonymous',
                authorAvatar: currentUser.photoURL || '',
                metrics: { likes: 0, comments: 0, views: 0 },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // Firestore rejects explicit `undefined` values — strip them all
            Object.keys(payload).forEach(key => {
                if (payload[key] === undefined) delete payload[key];
            });

            const docRef = await addDoc(collection(db, 'posts'), payload);
            return docRef.id;
        } catch (err: any) {
            console.error('Error creating post:', err);
            throw err;
        }
    };

    // Optimistic like/unlike
    const toggleLike = async (postId: string) => {
        if (!currentUser) throw new Error('Must be logged in to like.');

        const likeId = `${postId}_${currentUser.uid}`;
        const likeRef = doc(db, 'post_likes', likeId);
        const postRef = doc(db, COLLECTION, postId);

        try {
            const likeSnap = await getDoc(likeRef);
            if (likeSnap.exists()) {
                await deleteDoc(likeRef);
                await updateDoc(postRef, { 'metrics.likes': increment(-1) });
                return false;
            } else {
                await setDoc(likeRef, {
                    postId,
                    userId: currentUser.uid,
                    createdAt: serverTimestamp()
                });
                await updateDoc(postRef, { 'metrics.likes': increment(1) });
                return true;
            }
        } catch (err) {
            console.error('Error toggling like:', err);
            throw err;
        }
    };

    return {
        posts,
        loading,
        isFetchingNextPage,
        hasMore,
        error,
        fetchMorePosts,
        createPost,
        toggleLike,
    };
};
