import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// Define the secret
const geminiApiKey = defineSecret("GEMINI_API_KEY");
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
    secrets: [geminiApiKey],
    timeoutSeconds: 60,
    memory: "512MB"
}).https.onCall(async (data, context) => {
    const apiKey = geminiApiKey.value();
    if (!apiKey) {
        throw new functions.https.HttpsError('failed-precondition', "Missing API Key.");
    }

    const query = data.query || 'Software Engineer';
    const location = data.location || '';
    const fullQuery = location ? `${query} in ${location}` : query;

    console.log(`[searchJobsCallable] Searching for: "${fullQuery}"`);

    // Generate cache key from normalized query
    const queryHash = normalizeQuery(query, location);
    const cacheRef = db.collection('jobSearchCache').doc(queryHash);

    // Check cache first
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

    // Cache miss - call Gemini API
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';

    try {
        console.log(`[searchJobsCallable] Calling Gemini (${model}) with Search Tool...`);

        const response = await ai.models.generateContent({
            model,
            contents: `Search for currently active job openings for: "${fullQuery}". 
CRITICAL: Only include jobs that are currently accepting applications. Do not include expired listings.
For each job, extract the most direct URL for the application (prioritize official company career portals).

Format the output EXACTLY as follows for each job, using "---" as a separator:

Title: [Exact Job Title]
Company: [Official Company Name]
Location: [City, State]
Description: [Provide a comprehensive job description including: key responsibilities, required qualifications, skills needed, benefits offered, salary range if available, and any other relevant details. Make this as detailed as possible - aim for at least 4-6 sentences.]
URL: [The direct application link or specific job posting page]
---`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        // Access response.text directly like reference project
        const textResponse = response.text || '';
        console.log(`[searchJobsCallable] Raw Text Response (first 500 chars): ${textResponse.substring(0, 500)}`);

        // Get grounding sources from candidates
        const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter((c: any) => c.web) as GroundingSource[] || [];
        const defaultFallbackUrl = sources[0]?.web?.uri || `https://www.google.com/search?q=${encodeURIComponent(fullQuery + ' application')}`;

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

                // If URL is generic, placeholder, or broken, use grounding source
                if (!jobUrl || jobUrl.includes('[') || jobUrl.length < 10) {
                    const relevantSource = sources.find(s =>
                        s.web?.title?.toLowerCase().includes(company.toLowerCase()) ||
                        s.web?.uri?.toLowerCase().includes(company.toLowerCase().replace(/\s/g, ''))
                    );
                    jobUrl = relevantSource?.web?.uri || defaultFallbackUrl;
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

        return { jobs: validatedJobs, cached: false };

    } catch (error: any) {
        console.error("Gemini Search Exception:", error);
        throw new functions.https.HttpsError('internal', `Gemini Error: ${error.message}`);
    }
});

// Also expose as onRequest for direct HTTP calls (testing)
export const searchJobs = functions.region('us-west1').runWith({
    secrets: [geminiApiKey],
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

            const ai = new GoogleGenAI({ apiKey });
            const model = 'gemini-2.5-flash';

            const response = await ai.models.generateContent({
                model,
                contents: `Search for currently active job openings for: "${fullQuery}". 
CRITICAL: Only include jobs that are currently accepting applications. Do not include expired listings.
For each job, extract the most direct URL for the application (prioritize official company career portals).

Format the output EXACTLY as follows for each job, using "---" as a separator:

Title: [Exact Job Title]
Company: [Official Company Name]
Location: [City, State]
Description: [Provide a comprehensive job description including: key responsibilities, required qualifications, skills needed, benefits offered, salary range if available, and any other relevant details. Make this as detailed as possible - aim for at least 4-6 sentences.]
URL: [The direct application link or specific job posting page]
---`,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });

            const textResponse = response.text || '';
            const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter((c: any) => c.web) as GroundingSource[] || [];
            const defaultFallbackUrl = sources[0]?.web?.uri || `https://www.google.com/search?q=${encodeURIComponent(fullQuery + ' application')}`;

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

                    if (!jobUrl || jobUrl.includes('[') || jobUrl.length < 10) {
                        const relevantSource = sources.find(s =>
                            s.web?.title?.toLowerCase().includes(company.toLowerCase()) ||
                            s.web?.uri?.toLowerCase().includes(company.toLowerCase().replace(/\s/g, ''))
                        );
                        jobUrl = relevantSource?.web?.uri || defaultFallbackUrl;
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
