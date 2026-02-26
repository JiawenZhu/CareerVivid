import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import { performGoogleSearch } from "./utils/customSearch";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// Define the secrets
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const googleSearchApiKey = defineSecret("GOOGLE_SEARCH_API_KEY");
const googleSearchCx = defineSecret("GOOGLE_SEARCH_CX");
const corsHandler = cors({ origin: true });

// Type definitions matching what we want to return to the frontend
interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    salary?: string;
    posted?: string;
    source?: 'google_search' | 'partner';
}

interface GroundingSource {
    web?: {
        uri?: string;
        title?: string;
    }
}

interface CachedJobSearch {
    query: string;
    location: string;
    jobs: Job[];
    createdAt: admin.firestore.Timestamp;
    lastAccessedAt: admin.firestore.Timestamp;
    expiresAt: admin.firestore.Timestamp;
}

// Interface for indexed individual jobs (for smart search)
interface IndexedJob {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    salary?: string;
    posted?: string;
    // Indexed fields for searching
    company_lower: string;
    location_lower: string;
    title_keywords: string[];
    // Metadata
    sourceQuery: string;
    createdAt: admin.firestore.Timestamp;
    lastAccessedAt: admin.firestore.Timestamp;
}

// Helper to extract keywords from title for array-contains queries
const extractKeywords = (title: string): string[] => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .split(/\s+/)
        .filter(word => word.length >= 2); // Only words with 2+ chars
};

// Helper to generate stable job ID
const generateJobId = (job: Job): string => {
    const base = `${job.title}-${job.company}`.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return base.substring(0, 100); // Firestore doc ID limit
};

// Helper function to normalize search query into a consistent hash/key
const normalizeQuery = (query: string, location: string): string => {
    const normalized = `${query.toLowerCase().trim()}-${location.toLowerCase().trim()}`
        .replace(/[^a-z0-9-]/g, '')  // Remove special chars
        .replace(/-+/g, '-')          // Collapse multiple dashes
        .replace(/^-|-$/g, '');       // Remove leading/trailing dashes
    return normalized || 'default';   // Fallback if empty
};

// Helper to validate a single URL with HEAD request
const validateJobUrl = async (url: string): Promise<boolean> => {
    if (!url || url.length < 10 || url.includes('[')) return false;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

        const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CareerVivid/1.0; +https://careervivid.app)'
            }
        });

        clearTimeout(timeoutId);
        return response.ok; // 2xx status codes
    } catch (error) {
        return false;
    }
};

// Helper to generate fallback URL for a company
const generateFallbackUrl = (company: string, title: string): string => {
    const searchQuery = encodeURIComponent(`${company} careers ${title} apply`);
    return `https://www.google.com/search?q=${searchQuery}`;
};

// Helper to validate and fix job URLs in parallel
const validateAndFixJobUrls = async (jobs: Job[]): Promise<Job[]> => {
    console.log(`[validateAndFixJobUrls] Validating ${jobs.length} job URLs...`);

    const validationResults = await Promise.allSettled(
        jobs.map(async (job) => {
            const isValid = await validateJobUrl(job.url);
            return { job, isValid };
        })
    );

    let validCount = 0;
    let fixedCount = 0;

    const validatedJobs = validationResults.map((result, index) => {
        if (result.status === 'fulfilled') {
            if (result.value.isValid) {
                validCount++;
                return result.value.job;
            } else {
                fixedCount++;
                // Replace with fallback URL
                return {
                    ...result.value.job,
                    url: generateFallbackUrl(result.value.job.company, result.value.job.title)
                };
            }
        } else {
            fixedCount++;
            // Promise rejected, use fallback
            return {
                ...jobs[index],
                url: generateFallbackUrl(jobs[index].company, jobs[index].title)
            };
        }
    });

    console.log(`[validateAndFixJobUrls] Validation complete: ${validCount} valid, ${fixedCount} fixed with fallback`);
    return validatedJobs;
};

// onCall version for frontend httpsCallable consumption
export const searchJobsCallable = functions.region('us-west1').runWith({
    secrets: [geminiApiKey, googleSearchApiKey, googleSearchCx],
    timeoutSeconds: 60,
    memory: "512MB"
}).https.onCall(async (data, context) => {
    const apiKey = geminiApiKey.value();
    const searchApiKey = googleSearchApiKey.value();
    const searchCx = googleSearchCx.value();

    if (!apiKey) {
        throw new functions.https.HttpsError('failed-precondition', "Missing API Key.");
    }

    // Require authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const { query = 'Software Engineer', location = '', jobCount = 10, bypassCache = false } = data;

    // Validate jobCount
    const validatedJobCount = Math.min(Math.max(jobCount, 5), 20); // Clamp between 5-20

    const fullQuery = location ? `${query} in ${location}` : query;

    // Check and deduct AI credit BEFORE performing search
    const userDocRef = db.collection('users').doc(userId);
    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'User not found');
            }

            const userData = userDoc.data();
            const aiUsageData = userData?.aiUsage || {};
            const aiUsageCount = aiUsageData.count || 0;

            // Check if user is admin - admins have unlimited searches
            const userRole = userData?.role;
            const userRoles = userData?.roles || [];
            const isAdmin = userRole === 'admin' || userRoles.includes('admin');

            // Calculate limit based on user's plan (matching frontend logic)
            let aiUsageLimit = 10; // Default for free users
            const userPlan = userData?.plan;

            if (userPlan === 'pro_sprint') {
                aiUsageLimit = 100; // Sprint: 100 AI Credits/month
            } else if (userPlan === 'pro_monthly') {
                aiUsageLimit = 300; // Monthly: 300 AI Credits/month
            } else if (aiUsageData.monthlyLimit) {
                // Fall back to stored monthlyLimit if available
                aiUsageLimit = aiUsageData.monthlyLimit;
            }

            console.log(`[searchJobsCallable] User ${userId} | Role: ${userRole} | Admin: ${isAdmin} | Plan: ${userPlan} | AI Usage: ${aiUsageCount}/${aiUsageLimit}`);

            // Skip credit check for admins
            if (!isAdmin && aiUsageCount >= aiUsageLimit) {
                throw new functions.https.HttpsError(
                    'resource-exhausted',
                    'AI credit limit reached. Please upgrade your plan.'
                );
            }

            // Deduct 1 AI credit (even for admins, for tracking purposes)
            transaction.update(userDocRef, {
                'aiUsage.count': admin.firestore.FieldValue.increment(1)
            });

            console.log(`[searchJobsCallable] AI credit deducted for user ${userId}. New count: ${aiUsageCount + 1}/${isAdmin ? 'Unlimited' : aiUsageLimit}`);
        });
    } catch (error: any) {
        if (error.code === 'resource-exhausted' || error.code === 'not-found') {
            throw error;
        }
        console.error('[searchJobsCallable] Error checking/deducting AI credit:', error);
        throw new functions.https.HttpsError('internal', 'Failed to process AI credit');
    }

    console.log(`[searchJobsCallable] Searching for: "${fullQuery}"`);

    // Generate cache key from normalized query
    const queryHash = normalizeQuery(query, location);
    const cacheRef = db.collection('jobSearchCache').doc(queryHash);

    // Check cache first (unless bypassed)
    if (!bypassCache) {
        try {
            const cacheDoc = await cacheRef.get();
            if (cacheDoc.exists) {
                const cached = cacheDoc.data() as CachedJobSearch;
                console.log(`[searchJobsCallable] Cache HIT for "${queryHash}" - returning ${cached.jobs.length} cached jobs`);

                // Update lastAccessedAt for TTL tracking (async, don't await)
                cacheRef.update({
                    lastAccessedAt: admin.firestore.FieldValue.serverTimestamp()
                }).catch(err => console.warn('Failed to update lastAccessedAt:', err));

                return { jobs: cached.jobs, cached: true };
            }
            console.log(`[searchJobsCallable] Cache MISS for "${queryHash}" - calling Gemini API`);
        } catch (cacheError) {
            console.warn('[searchJobsCallable] Cache lookup error, proceeding with API call:', cacheError);
        }
    } else {
        console.log(`[searchJobsCallable] Cache BYPASSED for "${queryHash}" - forcing fresh search`);
    }

    // Cache miss or bypassed - Google Search API is REQUIRED (no Gemini grounding fallback)
    if (!searchApiKey || !searchCx) {
        console.error('[searchJobsCallable] Google Search API Key or CX missing - cannot proceed');
        throw new functions.https.HttpsError(
            'failed-precondition',
            'Google Search API is not configured. Please contact support.'
        );
    }

    // 1. Perform Google Search
    let searchResults;
    try {
        searchResults = await performGoogleSearch(fullQuery + " job openings", searchApiKey, searchCx);
        console.log(`[searchJobsCallable] Google Search returned ${searchResults.length} results.`);
    } catch (searchError) {
        console.error('[searchJobsCallable] Google Search failed:', searchError);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to fetch job search results. Please try again.'
        );
    }

    if (searchResults.length === 0) {
        console.log('[searchJobsCallable] No search results found');
        return { jobs: [], cached: false };
    }

    // 2. Format search context for Gemini
    const searchContext = searchResults.map(r => `Source: ${r.link}\nTitle: ${r.title}\nSnippet: ${r.snippet}`).join('\n\n');

    // 3. Call Gemini API ONLY for parsing (no search grounding)
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';

    try {
        console.log(`[searchJobsCallable] Calling Gemini (${model}) to parse search results...`);

        const prompt = `I have performed a Google Search for job openings: "${fullQuery}".
Here are the search results:
---
${searchContext}
---
TASK: Extract ONLY actual job postings from the search results.

IGNORE these types of results:
- Job board aggregators (Indeed, ZipRecruiter, LinkedIn job search pages)
- Career advice articles or general occupation information  
- Reddit discussions or forums about jobs

ONLY EXTRACT results that are:
- Direct job postings from company career pages
- Specific job listings with a company name and job title
- Currently accepting applications

If you cannot find ANY actual job postings (only meta-information), respond with: NO_JOBS_FOUND

Format the output EXACTLY as follows for each job, using "---" as a separator:

Title: [Exact Job Title]
Company: [Official Company Name]
Location: [City, State]
Description: [Provide a comprehensive job description based on the snippets. Aim for at least 4-6 sentences.]
URL: [The direct application link from the search results]
---`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });

        // Access response.text directly like reference project
        const textResponse = response.text || '';
        console.log(`[searchJobsCallable] Raw Text Response (first 500 chars): ${textResponse.substring(0, 500)}`);

        // No grounding sources needed - we're using Google Search results directly
        const defaultFallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(fullQuery + ' application')}`;

        const jobs: Job[] = [];
        const jobBlocks = textResponse.split('---').filter((block: string) => block.trim() !== '');

        console.log(`[searchJobsCallable] Found ${jobBlocks.length} job blocks.`);

        jobBlocks.forEach((block: string) => {
            const titleMatch = block.match(/Title:\s*(.*)/i);
            const companyMatch = block.match(/Company:\s*(.*)/i);
            const locationMatch = block.match(/Location:\s*(.*)/i);
            const descriptionMatch = block.match(/Description:\s*([\s\S]*?)(?=\nURL:|$)/i);
            const urlMatch = block.match(/URL:\s*(.*)/i);

            if (titleMatch?.[1] && companyMatch?.[1]) {
                const title = titleMatch[1].trim();
                const company = companyMatch[1].trim();
                const id = `${title.toLowerCase()}-${company.toLowerCase()}`.replace(/[^a-z0-9]+/g, '-');

                let jobUrl = urlMatch?.[1]?.trim() || '';

                // If URL is missing or invalid, use default fallback
                if (!jobUrl || jobUrl.includes('[') || jobUrl.length < 10) {
                    jobUrl = defaultFallbackUrl;
                }

                jobs.push({
                    id,
                    title,
                    company,
                    location: locationMatch?.[1]?.trim() || "Remote / Unspecified",
                    description: descriptionMatch?.[1]?.trim() || "No description provided.",
                    url: jobUrl,
                });
            }
        });

        console.log(`[searchJobsCallable] Parsed ${jobs.length} jobs, validating URLs...`);

        // Validate and fix job URLs before caching
        const validatedJobs = await validateAndFixJobUrls(jobs);
        console.log(`[searchJobsCallable] Returning ${validatedJobs.length} validated jobs.`);

        // Save to cache (async, don't block response)
        if (validatedJobs.length > 0) {
            const twoWeeksFromNow = admin.firestore.Timestamp.fromDate(
                new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            );

            // 1. Save to query-based cache
            cacheRef.set({
                query,
                location,
                jobs: validatedJobs,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                lastAccessedAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: twoWeeksFromNow,
            }).catch(err => console.warn('Failed to save to cache:', err));
            console.log(`[searchJobsCallable] Saved ${validatedJobs.length} jobs to cache for "${queryHash}"`);

            // 2. Index individual jobs for smart search
            const batch = db.batch();
            validatedJobs.forEach(job => {
                const jobId = generateJobId(job);
                const jobRef = db.collection('cachedJobs').doc(jobId);
                batch.set(jobRef, {
                    ...job,
                    company_lower: job.company.toLowerCase(),
                    location_lower: job.location.toLowerCase(),
                    title_keywords: extractKeywords(job.title),
                    sourceQuery: queryHash,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    lastAccessedAt: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
            });
            batch.commit().then(() => {
                console.log(`[searchJobsCallable] Indexed ${jobs.length} jobs for smart search`);
            }).catch(err => console.warn('Failed to index jobs:', err));
        }

        // 3. Save to user's job history (limit to requested job count)
        if (validatedJobs.length > 0) {
            const jobsToSave = validatedJobs.slice(0, validatedJobCount);
            const historyBatch = db.batch();

            jobsToSave.forEach(job => {
                const historyRef = db.collection('users').doc(userId)
                    .collection('jobSearchHistory').doc(job.id);
                historyBatch.set(historyRef, {
                    ...job,
                    source: 'google' as const, // Use 'google' to prevent Partner badge
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    searchQuery: fullQuery
                }, { merge: true });
            });

            historyBatch.commit().then(() => {
                console.log(`[searchJobsCallable] Saved ${jobsToSave.length} jobs to user ${userId} history`);
            }).catch(err => console.warn('Failed to save job history:', err));
        }

        return { jobs: validatedJobs.slice(0, validatedJobCount), cached: false };

    } catch (error: any) {
        console.error("Gemini Search Exception:", error);
        throw new functions.https.HttpsError('internal', `Gemini Error: ${error.message}`);
    }
});

// Also expose as onRequest for direct HTTP calls (testing)
export const searchJobs = functions.region('us-west1').runWith({
    secrets: [geminiApiKey, googleSearchApiKey, googleSearchCx],
    timeoutSeconds: 60,
    memory: "512MB"
}).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        try {
            const apiKey = geminiApiKey.value();
            if (!apiKey) {
                res.status(500).json({ error: "Missing API Key." });
                return;
            }

            const query = (req.query.q as string) || (req.body.data?.query as string) || (req.body.query as string) || 'Software Engineer';
            const location = (req.query.loc as string) || (req.body.data?.location as string) || (req.body.location as string) || '';
            const fullQuery = location ? `${query} in ${location}` : query;

            console.log(`[searchJobs] Searching for: "${fullQuery}"`);

            // Generate cache key from normalized query
            const queryHash = normalizeQuery(query, location);
            const cacheRef = db.collection('jobSearchCache').doc(queryHash);

            // Check cache first
            try {
                const cacheDoc = await cacheRef.get();
                if (cacheDoc.exists) {
                    const cached = cacheDoc.data() as CachedJobSearch;
                    console.log(`[searchJobs] Cache HIT for "${queryHash}"`);
                    cacheRef.update({ lastAccessedAt: admin.firestore.FieldValue.serverTimestamp() });
                    res.json({ result: { jobs: cached.jobs, cached: true } });
                    return;
                }
            } catch (cacheError) {
                console.warn('[searchJobs] Cache lookup error:', cacheError);
            }

            const searchApiKey = googleSearchApiKey.value();
            const searchCx = googleSearchCx.value();

            // Google Search API is REQUIRED (no Gemini grounding fallback)
            if (!searchApiKey || !searchCx) {
                console.error('[searchJobs] Google Search API Key or CX missing - cannot proceed');
                res.status(500).json({ error: 'Google Search API is not configured. Please contact support.' });
                return;
            }

            // 1. Perform Google Search
            let searchResults;
            try {
                searchResults = await performGoogleSearch(fullQuery + " job openings", searchApiKey, searchCx);
                console.log(`[searchJobs] Google Search returned ${searchResults.length} results.`);
            } catch (searchError) {
                console.error('[searchJobs] Google Search failed:', searchError);
                res.status(500).json({ error: 'Failed to fetch job search results. Please try again.' });
                return;
            }

            if (searchResults.length === 0) {
                console.log('[searchJobs] No search results found');
                res.json({ result: { jobs: [], cached: false } });
                return;
            }

            // 2. Format search context for Gemini
            const searchContext = searchResults.map(r => `Source: ${r.link}\nTitle: ${r.title}\nSnippet: ${r.snippet}`).join('\n\n');

            // 3. Call Gemini API ONLY for parsing (no search grounding)
            const ai = new GoogleGenAI({ apiKey });
            const model = 'gemini-2.5-flash';

            console.log(`[searchJobs] Calling Gemini (${model}) to parse search results...`);

            const prompt = `I have performed a Google Search for job openings: "${fullQuery}".
Here are the search results:
---
${searchContext}
---
Based ON ONLY the search results provided above, extract and format the active job openings. 
CRITICAL: Only include jobs that are currently accepting applications. Do not include expired listings.
For each job, extract the most direct URL for the application (prioritize official company career portals).

Format the output EXACTLY as follows for each job, using "---" as a separator:

Title: [Exact Job Title]
Company: [Official Company Name]
Location: [City, State]
Description: [Provide a comprehensive job description based on the snippets. Aim for at least 4-6 sentences.]
URL: [The direct application link from the search results]
---`;

            const response = await ai.models.generateContent({
                model,
                contents: prompt,
            });

            const textResponse = response.text || '';
            // No grounding sources needed - we're using Google Search results directly
            const defaultFallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(fullQuery + ' application')}`;

            const jobs: Job[] = [];
            const jobBlocks = textResponse.split('---').filter((block: string) => block.trim() !== '');

            jobBlocks.forEach((block: string) => {
                const titleMatch = block.match(/Title:\s*(.*)/i);
                const companyMatch = block.match(/Company:\s*(.*)/i);
                const locationMatch = block.match(/Location:\s*(.*)/i);
                const descriptionMatch = block.match(/Description:\s*([\s\S]*?)(?=\nURL:|$)/i);
                const urlMatch = block.match(/URL:\s*(.*)/i);

                if (titleMatch?.[1] && companyMatch?.[1]) {
                    const title = titleMatch[1].trim();
                    const company = companyMatch[1].trim();
                    const id = `${title.toLowerCase()}-${company.toLowerCase()}`.replace(/[^a-z0-9]+/g, '-');

                    let jobUrl = urlMatch?.[1]?.trim() || '';

                    // If URL is missing or invalid, use default fallback
                    if (!jobUrl || jobUrl.includes('[') || jobUrl.length < 10) {
                        jobUrl = defaultFallbackUrl;
                    }

                    jobs.push({
                        id,
                        title,
                        company,
                        location: locationMatch?.[1]?.trim() || "Remote / Unspecified",
                        description: descriptionMatch?.[1]?.trim() || "No description provided.",
                        url: jobUrl,
                    });
                }
            });

            // Validate and fix job URLs before caching
            console.log(`[searchJobs] Parsed ${jobs.length} jobs, validating URLs...`);
            const validatedJobs = await validateAndFixJobUrls(jobs);

            // Save to cache and index jobs
            if (validatedJobs.length > 0) {
                const twoWeeksFromNow = admin.firestore.Timestamp.fromDate(
                    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                );

                // 1. Save to query-based cache
                cacheRef.set({
                    query,
                    location,
                    jobs: validatedJobs,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    lastAccessedAt: admin.firestore.FieldValue.serverTimestamp(),
                    expiresAt: twoWeeksFromNow,
                });

                // 2. Index individual jobs for smart search
                const batch = db.batch();
                validatedJobs.forEach(job => {
                    const jobId = generateJobId(job);
                    const jobRef = db.collection('cachedJobs').doc(jobId);
                    batch.set(jobRef, {
                        ...job,
                        company_lower: job.company.toLowerCase(),
                        location_lower: job.location.toLowerCase(),
                        title_keywords: extractKeywords(job.title),
                        sourceQuery: queryHash,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        lastAccessedAt: admin.firestore.FieldValue.serverTimestamp(),
                    }, { merge: true });
                });
                batch.commit().catch(err => console.warn('Failed to index jobs:', err));
            }

            console.log(`[searchJobs] found ${validatedJobs.length} validated jobs.`);
            res.json({ result: { jobs: validatedJobs, cached: false } });

        } catch (error: any) {
            console.error("Gemini Job Search Error:", error);
            res.status(500).json({ error: error.message });
        }
    });
});

// Smart Search - searches across all indexed cached jobs
export const smartSearchJobs = functions.region('us-west1').runWith({
    timeoutSeconds: 30,
    memory: "256MB"
}).https.onCall(async (data, context) => {
    const searchTerm = (data.searchTerm || '').toLowerCase().trim();
    const locationFilter = (data.location || '').toLowerCase().trim();

    if (!searchTerm && !locationFilter) {
        console.log('[smartSearchJobs] No search term or location provided');
        return { jobs: [], source: 'smart_search' };
    }

    console.log(`[smartSearchJobs] Searching for term: "${searchTerm}", location: "${locationFilter}"`);

    const cachedJobsRef = db.collection('cachedJobs');
    const jobsMap = new Map<string, Job>();

    try {
        // Query 1: Search by company name (prefix match)
        if (searchTerm) {
            const companyQuery = cachedJobsRef
                .where('company_lower', '>=', searchTerm)
                .where('company_lower', '<=', searchTerm + '\uf8ff')
                .limit(30);

            const companyResults = await companyQuery.get();
            companyResults.docs.forEach(doc => {
                const data = doc.data() as IndexedJob;
                jobsMap.set(doc.id, {
                    id: data.id,
                    title: data.title,
                    company: data.company,
                    location: data.location,
                    description: data.description,
                    url: data.url,
                    salary: data.salary,
                    posted: data.posted
                });
            });
            console.log(`[smartSearchJobs] Company query found ${companyResults.size} jobs`);
        }

        // Query 2: Search by title keywords (array-contains)
        if (searchTerm) {
            const titleQuery = cachedJobsRef
                .where('title_keywords', 'array-contains', searchTerm)
                .limit(30);

            const titleResults = await titleQuery.get();
            titleResults.docs.forEach(doc => {
                if (!jobsMap.has(doc.id)) {
                    const data = doc.data() as IndexedJob;
                    jobsMap.set(doc.id, {
                        id: data.id,
                        title: data.title,
                        company: data.company,
                        location: data.location,
                        description: data.description,
                        url: data.url,
                        salary: data.salary,
                        posted: data.posted
                    });
                }
            });
            console.log(`[smartSearchJobs] Title query found ${titleResults.size} jobs`);
        }

        // Query 3: Search by location (prefix match)
        if (locationFilter) {
            const locationQuery = cachedJobsRef
                .where('location_lower', '>=', locationFilter)
                .where('location_lower', '<=', locationFilter + '\uf8ff')
                .limit(30);

            const locationResults = await locationQuery.get();
            locationResults.docs.forEach(doc => {
                // If we have a search term, only add if already in map (intersection)
                // If no search term, add all location matches
                if (!searchTerm || jobsMap.has(doc.id)) {
                    const data = doc.data() as IndexedJob;
                    jobsMap.set(doc.id, {
                        id: data.id,
                        title: data.title,
                        company: data.company,
                        location: data.location,
                        description: data.description,
                        url: data.url,
                        salary: data.salary,
                        posted: data.posted
                    });
                }
            });
            console.log(`[smartSearchJobs] Location query found ${locationResults.size} jobs`);
        }

        // Filter by location if both term and location provided
        let jobs = Array.from(jobsMap.values());
        if (searchTerm && locationFilter) {
            jobs = jobs.filter(job =>
                job.location.toLowerCase().includes(locationFilter)
            );
        }

        console.log(`[smartSearchJobs] Returning ${jobs.length} unique jobs`);
        return { jobs, source: 'smart_search' };

    } catch (error: any) {
        console.error('[smartSearchJobs] Error:', error);
        throw new functions.https.HttpsError('internal', `Smart search error: ${error.message}`);
    }
});

// Delete a job from user's job history
export const deleteUserJob = functions.region('us-west1').https.onCall(async (data, context) => {
    // Require authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const { jobId } = data;

    if (!jobId) {
        throw new functions.https.HttpsError('invalid-argument', 'jobId is required');
    }

    try {
        const jobRef = db.collection('users').doc(userId).collection('jobSearchHistory').doc(jobId);
        await jobRef.delete();

        console.log(`[deleteUserJob] Deleted job ${jobId} from user ${userId} history`);
        return { success: true, jobId };
    } catch (error: any) {
        console.error('[deleteUserJob] Error deleting job:', error);
        throw new functions.https.HttpsError('internal', `Failed to delete job: ${error.message}`);
    }
});

// HTTP Function to get jobs for a specific company by slug (Used by Embed Widget)
export const getCompanyJobs = functions.region('us-west1').runWith({
    timeoutSeconds: 30,
    memory: "256MB"
}).https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        // Handle preflight explicitly
        if (req.method === 'OPTIONS') {
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.set('Access-Control-Allow-Headers', 'Content-Type');
            res.status(204).send('');
            return;
        }

        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method Not Allowed' });
            return;
        }

        const companySlug = req.query.company as string;

        if (!companySlug) {
            res.status(400).json({ error: 'Missing company slug parameter' });
            return;
        }

        try {
            console.log(`[getCompanyJobs] Fetching jobs for company slug: ${companySlug}`);

            // 1. Find the company profile matching the slug
            const profilesSnap = await db.collection('companyProfiles')
                .where('slug', '==', companySlug)
                .limit(1)
                .get();

            if (profilesSnap.empty) {
                console.log(`[getCompanyJobs] Company not found for slug: ${companySlug}`);
                res.json([]);
                return; // Not an error, just no jobs
            }

            const companyDoc = profilesSnap.docs[0];
            const hrUserId = companyDoc.data().hrUserId;

            if (!hrUserId) {
                console.log(`[getCompanyJobs] No hrUserId found for company profile: ${companyDoc.id}`);
                res.json([]);
                return;
            }

            // 2. Query published jobs for this hrUserId
            const jobsSnap = await db.collection('jobPostings')
                .where('hrUserId', '==', hrUserId)
                .where('status', '==', 'published')
                .orderBy('createdAt', 'desc')
                .get();

            const jobs = jobsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log(`[getCompanyJobs] Returned ${jobs.length} jobs for ${companySlug}`);
            res.json(jobs);
        } catch (error: any) {
            console.error('[getCompanyJobs] Error:', error);
            res.status(500).json({ error: 'Internal server error while fetching jobs' });
        }
    });
});

