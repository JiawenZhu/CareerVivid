/**
 * useCommunityMeta — Phase 2: Dynamic sidebar data
 * Provides popular tags (aggregated from recent posts) and hiring companies.
 */
import { useState, useEffect } from 'react';
import {
    collection, query, where, limit, getDocs, orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

// ── Popular Tags ──────────────────────────────────────────────────────────────

export interface TagEntry {
    tag: string;
    count: number;
}

export const usePopularTags = (postLimit = 50): { tags: TagEntry[]; loading: boolean } => {
    const [tags, setTags] = useState<TagEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                // Aggregate tags from the most recent posts
                const q = query(
                    collection(db, 'community_posts'),
                    orderBy('createdAt', 'desc'),
                    limit(postLimit)
                );
                const snap = await getDocs(q);
                const counts: Record<string, number> = {};

                snap.docs.forEach(doc => {
                    const data = doc.data();
                    (data.tags as string[] || []).forEach(tag => {
                        counts[tag] = (counts[tag] || 0) + 1;
                    });
                });

                const sorted = Object.entries(counts)
                    .map(([tag, count]) => ({ tag, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8);

                // Fallback to curated tags if the collection is empty
                if (sorted.length === 0) {
                    setTags([
                        { tag: 'career-advice', count: 0 },
                        { tag: 'react', count: 0 },
                        { tag: 'system-design', count: 0 },
                        { tag: 'interview-prep', count: 0 },
                        { tag: 'hiring', count: 0 },
                        { tag: 'open-source', count: 0 },
                    ]);
                } else {
                    setTags(sorted);
                }
            } catch {
                // Silently use fallback
                setTags([
                    { tag: 'career-advice', count: 0 },
                    { tag: 'react', count: 0 },
                    { tag: 'system-design', count: 0 },
                    { tag: 'interview-prep', count: 0 },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, [postLimit]);

    return { tags, loading };
};

// ── Hiring Companies ──────────────────────────────────────────────────────────

export interface HiringCompany {
    id: string;
    name: string;
    hiringFor?: string;
    logoUrl?: string;
}

export const useHiringCompanies = (): { companies: HiringCompany[]; loading: boolean } => {
    const [companies, setCompanies] = useState<HiringCompany[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                // Query active partner job postings instead of just users
                const q = query(
                    collection(db, 'jobPostings'),
                    where('isPartnerJob', '==', true),
                    where('status', '==', 'published'),
                    // We can't easily do a 'distinct' or 'group by' in Firestore,
                    // so we fetch a small batch and deduplicate client-side.
                    limit(10)
                );

                const snap = await getDocs(q);

                if (!snap.empty) {
                    const uniqueCompanies = new Map<string, HiringCompany>();

                    snap.docs.forEach(doc => {
                        const data = doc.data();
                        const companyName = data.companyName || 'Company';

                        // Keep the first job title we find for this company
                        if (!uniqueCompanies.has(companyName)) {
                            uniqueCompanies.set(companyName, {
                                id: doc.id,
                                name: companyName,
                                hiringFor: data.jobTitle || 'Various Roles',
                                logoUrl: data.companyLogo || '',
                            });
                        }
                    });

                    // Take the first 3 unique companies
                    const companyList = Array.from(uniqueCompanies.values()).slice(0, 3);

                    if (companyList.length > 0) {
                        setCompanies(companyList);
                    } else {
                        // Fallback if somehow the list is empty after deduping
                        setCompanies([
                            { id: '1', name: 'TechNova Inc.', hiringFor: 'Senior Frontend React' },
                            { id: '2', name: 'Acme Startup', hiringFor: 'Full-Stack Engineer' },
                            { id: '3', name: 'Global Finance', hiringFor: 'UX/UI Designer' },
                        ]);
                    }
                } else {
                    // Graceful fallback for empty state
                    setCompanies([
                        { id: '1', name: 'TechNova Inc.', hiringFor: 'Senior Frontend React' },
                        { id: '2', name: 'Acme Startup', hiringFor: 'Full-Stack Engineer' },
                        { id: '3', name: 'Global Finance', hiringFor: 'UX/UI Designer' },
                    ]);
                }
            } catch (error) {
                console.error("Error fetching hiring companies:", error);
                setCompanies([
                    { id: '1', name: 'TechNova Inc.', hiringFor: 'Senior Frontend React' },
                    { id: '2', name: 'Acme Startup', hiringFor: 'Full-Stack Engineer' },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, []);

    return { companies, loading };
};
