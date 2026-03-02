import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { CommunityPost } from './useCommunity';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PublicComment {
    id: string;
    postId: string;
    authorId: string;
    content: string;
    createdAt: any;
    parentPostTitle?: string; // enriched client-side
    parentPostId?: string;    // same as postId, kept for clarity
}

export type OverviewItemType = 'post' | 'comment';

export interface OverviewItem {
    type: OverviewItemType;
    id: string;
    createdAt: any; // Firestore Timestamp or null
    post?: CommunityPost;
    comment?: PublicComment;
}

export interface PublicProfileData {
    uid: string;
    displayName: string;
    avatar: string;
    bio: string;
    role: string;
    portfolioUrl: string | null; // bioLink / external portfolio
    socialLinks: {
        github?: string;
        linkedin?: string;
        website?: string;
        twitter?: string;
    };
    publicResumes: any[];
    publicPortfolios: any[];
    recentPosts: CommunityPost[];
    comments: PublicComment[];
    overviewFeed: OverviewItem[];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export const usePublicProfile = (profileId: string | null) => {
    const [profileData, setProfileData] = useState<PublicProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!profileId) return;

        let isMounted = true;
        setLoading(true);
        setError(null);
        setProfileData(null);

        const fetchProfileData = async () => {
            try {
                // Fault-tolerant parallel fetches — failures return empty results
                const safeGet = async (q: any) => {
                    try { return await getDocs(q); } catch { return { docs: [] }; }
                };

                // Run all queries in parallel (user doc + content queries)
                const resumesQuery = query(collection(db, 'public_resumes'), where('userId', '==', profileId));
                const portfoliosQuery = query(collection(db, 'public_portfolios'), where('userId', '==', profileId));
                const postsQuery = query(
                    collection(db, 'community_posts'),
                    where('authorId', '==', profileId)
                    // No orderBy — avoids composite index requirement; sorted client-side below
                );
                const commentsQuery = query(
                    collection(db, 'community_post_comments'),
                    where('authorId', '==', profileId)
                    // No orderBy — sorted client-side
                );


                const [userDocSnap, resumesSnap, portfoliosSnap, postsSnap, commentsSnap] = await Promise.all([
                    getDoc(doc(db, 'users', profileId)).catch(() => null),
                    safeGet(resumesQuery),
                    safeGet(portfoliosQuery),
                    safeGet(postsQuery),
                    safeGet(commentsQuery),
                ]);

                // Sort posts & comments client-side (avoids composite index requirement)
                const toMs = (ts: any) => {
                    if (!ts) return 0;
                    if (typeof ts.toMillis === 'function') return ts.toMillis();
                    if (ts.seconds !== undefined) return ts.seconds * 1000;
                    return 0;
                };

                const posts = (postsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as CommunityPost[])
                    .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));

                const rawComments = (commentsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as PublicComment[])
                    .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
                    .slice(0, 50); // cap at 50
                let safeUserData;
                if (userDocSnap && userDocSnap.exists()) {
                    const u = userDocSnap.data();
                    safeUserData = {
                        uid: profileId,
                        displayName: u.displayName || u.firstName || posts[0]?.authorName || 'Anonymous User',
                        avatar: u.photoURL || u.avatarUrl || posts[0]?.authorAvatar || '',
                        bio: u.bio || '',
                        role: u.headline || u.professionalRole || posts[0]?.authorRole || '',
                        portfolioUrl: u.portfolioUrl || u.bioLink || u.website || null,
                        socialLinks: u.socialLinks || {},
                    };
                } else if (posts.length > 0) {
                    // No users doc — build a minimal profile from post author info
                    safeUserData = {
                        uid: profileId,
                        displayName: posts[0].authorName || 'Community Member',
                        avatar: posts[0].authorAvatar || '',
                        bio: '',
                        role: posts[0].authorRole || '',
                        portfolioUrl: null,
                        socialLinks: {},
                    };
                } else {
                    // Truly no user doc and no posts — profile doesn't exist
                    if (isMounted) {
                        setError('User not found.');
                        setLoading(false);
                    }
                    return;
                }

                // 3. Enrich comments with parent post titles (batch fetch unique postIds)
                const uniquePostIds = [...new Set(rawComments.map(c => c.postId).filter(Boolean))];
                const postTitleMap: Record<string, string> = {};

                if (uniquePostIds.length > 0) {
                    // Firestore 'in' query supports up to 30 items
                    const chunks = [];
                    for (let i = 0; i < uniquePostIds.length; i += 30) {
                        chunks.push(uniquePostIds.slice(i, i + 30));
                    }
                    for (const chunk of chunks) {
                        const parentSnaps = await Promise.all(
                            chunk.map(pid => getDoc(doc(db, 'community_posts', pid)))
                        );
                        for (const snap of parentSnaps) {
                            if (snap.exists()) {
                                postTitleMap[snap.id] = snap.data().title || 'a post';
                            }
                        }
                    }
                }

                const enrichedComments: PublicComment[] = rawComments.map(c => ({
                    ...c,
                    parentPostTitle: postTitleMap[c.postId] || 'a post',
                    parentPostId: c.postId,
                }));

                // 4. Build unified Overview feed (posts + comments merged & sorted by createdAt desc)
                const postItems: OverviewItem[] = posts.map(p => ({
                    type: 'post' as const,
                    id: `post-${p.id}`,
                    createdAt: p.createdAt,
                    post: p,
                }));
                const commentItems: OverviewItem[] = enrichedComments.map(c => ({
                    type: 'comment' as const,
                    id: `comment-${c.id}`,
                    createdAt: c.createdAt,
                    comment: c,
                }));

                const overviewFeed: OverviewItem[] = [...postItems, ...commentItems].sort((a, b) => {
                    const toMs = (ts: any): number => {
                        if (!ts) return 0;
                        if (typeof ts.toMillis === 'function') return ts.toMillis();
                        if (ts.seconds !== undefined) return ts.seconds * 1000;
                        return 0;
                    };
                    return toMs(b.createdAt) - toMs(a.createdAt);
                });

                if (isMounted) {
                    setProfileData({
                        ...safeUserData,
                        publicResumes: resumesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                        publicPortfolios: portfoliosSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                        recentPosts: posts,
                        comments: enrichedComments,
                        overviewFeed,
                    });
                    setLoading(false);
                }

            } catch (err: any) {
                console.error('Error fetching public profile:', err);
                if (isMounted) {
                    setError('Unable to load profile. It may be private or deleted.');
                    setLoading(false);
                }
            }
        };

        fetchProfileData();

        return () => {
            isMounted = false;
        };
    }, [profileId]);

    return { profileData, loading, error };
};
