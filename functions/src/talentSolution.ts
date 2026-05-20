import { TenantServiceClient, CompanyServiceClient, JobServiceClient, CompletionClient } from "@google-cloud/talent";
import * as admin from "firebase-admin";

const db = admin.firestore();

// Type definitions matching the CareerVivid job type
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

interface CTSSetup {
    tenantPath: string;
    companyPath: string;
    projectId: string;
}

const generateJobId = (job: Job): string => {
    const base = `${job.title}-${job.company}`.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return base.substring(0, 100);
};

let ctsSetup: CTSSetup | null = null;
let isCtsActive = true;
let isInitializing = false;

const isDryRun = process.env.CTS_DRY_RUN === "true";

/**
 * Self-provisions or retrieves the default Tenant and Company for CTS v4.
 * Gracefully disables CTS if the API is unconfigured or credentials fail.
 */
export async function getCTSSetup(): Promise<CTSSetup | null> {
    if (isDryRun) {
        return {
            tenantPath: "projects/mock-project/tenants/mock-tenant",
            companyPath: "projects/mock-project/tenants/mock-tenant/companies/mock-company",
            projectId: "mock-project"
        };
    }

    if (ctsSetup) return ctsSetup;
    if (!isCtsActive) return null;
    if (isInitializing) {
        // Wait briefly if initialization is already running
        await new Promise(resolve => setTimeout(resolve, 500));
        if (ctsSetup) return ctsSetup;
    }

    isInitializing = true;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "jastalk-firebase";
    const parent = `projects/${projectId}`;

    console.log(`[CTS] Initializing Cloud Talent Solution for project: ${projectId}...`);

    try {
        const tenantClient = new TenantServiceClient({ fallback: true });
        const companyClient = new CompanyServiceClient({ fallback: true });

        // 1. List or Create Tenant
        let tenantPath = "";
        try {
            const [tenants] = await tenantClient.listTenants({ parent });
            if (tenants && tenants.length > 0) {
                tenantPath = tenants[0].name || "";
                console.log(`[CTS] Found existing Tenant: ${tenantPath}`);
            } else {
                console.log(`[CTS] No tenants found. Creating a default Tenant...`);
                const [tenant] = await tenantClient.createTenant({
                    parent,
                    tenant: {
                        externalId: "careervivid-default-tenant"
                    }
                });
                tenantPath = tenant.name || "";
                console.log(`[CTS] Successfully created default Tenant: ${tenantPath}`);
            }
        } catch (tenantErr: any) {
            console.warn(`[CTS] Tenant lookup/creation failed. Error code: ${tenantErr.code}. Message: ${tenantErr.message}`);
            // Check for common permission or setup errors to fail gracefully
            if (tenantErr.code === 7 || tenantErr.code === 5 || tenantErr.message?.includes("Service Account") || tenantErr.message?.includes("IAM")) {
                console.warn("[CTS] Permission or billing issues detected. Disabling Cloud Talent Solution and falling back to CSE Scraper.");
                isCtsActive = false;
                isInitializing = false;
                return null;
            }
            throw tenantErr;
        }

        // 2. List or Create Company
        let companyPath = "";
        const [companies] = await companyClient.listCompanies({ parent: tenantPath });
        if (companies && companies.length > 0) {
            companyPath = companies[0].name || "";
            console.log(`[CTS] Found existing Company: ${companyPath}`);
        } else {
            console.log(`[CTS] No companies found. Creating a default Company...`);
            const [company] = await companyClient.createCompany({
                parent: tenantPath,
                company: {
                    displayName: "CareerVivid Jobs",
                    externalId: "careervivid-default-company"
                }
            });
            companyPath = company.name || "";
            console.log(`[CTS] Successfully created default Company: ${companyPath}`);
        }

        ctsSetup = { tenantPath, companyPath, projectId };
        isInitializing = false;
        return ctsSetup;

    } catch (err: any) {
        console.error("[CTS] Fatal initialization error, turning off CTS:", err);
        isCtsActive = false;
        isInitializing = false;
        return null;
    }
}

/**
 * Maps a standard CareerVivid job to a Google Cloud Talent Solution Job schema.
 */
function mapJobToCTSJobSchema(job: Job, companyPath: string) {
    return {
        company: companyPath,
        requisitionId: job.id,
        title: job.title,
        description: job.description,
        applicationInfo: {
            uris: [job.url]
        },
        addresses: [job.location],
        customAttributes: {
            companyName: {
                stringValues: [job.company],
                filterable: true,
                keywordSearchable: true
            },
            createdAt: {
                stringValues: [new Date().toISOString()],
                filterable: true,
                keywordSearchable: false
            },
            salary: {
                stringValues: [job.salary || ""],
                filterable: false,
                keywordSearchable: false
            },
            posted: {
                stringValues: [job.posted || ""],
                filterable: false,
                keywordSearchable: false
            }
        }
    };
}

/**
 * Ingests/updates a batch of jobs inside Google Cloud Talent Solution in parallel.
 * Updates Firestore with `ctsJobName` for tracking and easy scheduled deletes.
 */
export async function createOrUpdateJobsBatch(jobs: Job[]): Promise<void> {
    const setup = await getCTSSetup();
    if (!setup) {
        console.log("[CTS] Skipping batch ingestion: CTS is inactive or disabled.");
        return;
    }

    console.log(`[CTS] Processing batch ingestion of ${jobs.length} jobs...`);

    if (isDryRun) {
        console.log("[CTS] [DRY RUN] Ingesting jobs:");
        jobs.forEach(job => {
            const ctsJob = mapJobToCTSJobSchema(job, setup.companyPath);
            console.log(`[CTS] [DRY RUN] Job: "${job.title}" by "${job.company}" -> `, JSON.stringify(ctsJob, null, 2));
        });
        return;
    }

    const jobClient = new JobServiceClient({ fallback: true });
    
    // Ingest each job in parallel using Promise.allSettled to prevent failures from blocking others
    await Promise.allSettled(jobs.map(async (job) => {
        const ctsJob = mapJobToCTSJobSchema(job, setup.companyPath);
        const jobId = generateJobId(job);

        // Check if we already have a record in cachedJobs to update instead of create
        const jobRef = db.collection('cachedJobs').doc(jobId);
        const doc = await jobRef.get();
        const existingData = doc.exists ? doc.data() : null;
        const ctsJobName = existingData?.ctsJobName;

        try {
            if (ctsJobName) {
                console.log(`[CTS] Updating existing job: ${ctsJobName}`);
                await jobClient.updateJob({
                    job: {
                        ...ctsJob,
                        name: ctsJobName
                    }
                });
            } else {
                console.log(`[CTS] Creating new job: "${job.title}" | ReqId: ${job.id}`);
                const [createdJob] = await jobClient.createJob({
                    parent: setup.tenantPath,
                    job: ctsJob
                });
                
                // Save the CTS resource name back to Firestore for TTL purging
                if (createdJob.name) {
                    await jobRef.set({ ctsJobName: createdJob.name }, { merge: true });
                }
            }
        } catch (err: any) {
            console.warn(`[CTS] Failed to ingest job "${job.title}" to CTS: ${err.message}`);
        }
    }));

    console.log(`[CTS] Batch ingestion complete.`);
}

/**
 * Searches the Google Cloud Talent Solution index.
 */
export async function searchJobsInCTS(query: string, location: string, limit: number = 10): Promise<Job[]> {
    const setup = await getCTSSetup();
    if (!setup) {
        console.log("[CTS] Skipping search: CTS is inactive or disabled.");
        return [];
    }

    if (isDryRun) {
        console.log(`[CTS] [DRY RUN] Searching for "${query}" in "${location}"`);
        // Return premium mock jobs matching the query
        return [
            {
                id: `mock-${query.toLowerCase().replace(/\s+/g, '-')}-1`,
                title: `${query} (Dry Run Mock)`,
                company: "Google Cloud Sandbox Inc.",
                location: location || "Remote / California",
                description: `This is a high-quality simulated job for the query "${query}". Google Cloud Talent Solution API was queried in DRY_RUN mode. Great job checking the logs!`,
                url: "https://cloud.google.com/talent-solution",
                posted: "Just now",
                salary: "$120,000 - $160,000"
            },
            {
                id: `mock-${query.toLowerCase().replace(/\s+/g, '-')}-2`,
                title: `Senior ${query} Manager`,
                company: "CareerVivid Systems",
                location: location || "Austin, TX / Remote",
                description: `Another premium dry-run job matching your search query. Google Cloud Talent Solution provides advanced search, radius filter, and term matching.`,
                url: "https://careervivid.app",
                posted: "1 day ago",
                salary: "$145,000 - $190,000"
            }
        ];
    }

    const jobClient = new JobServiceClient({ fallback: true });
    const cleanQuery = query.trim();

    try {
        console.log(`[CTS] Executing search for "${cleanQuery}" in "${location}"...`);
        const locationFilters = location ? [{
            address: location,
            distanceInMiles: 50
        }] : [];

        const [response] = (await jobClient.searchJobs({
            parent: setup.tenantPath,
            requestMetadata: {
                userId: "careervivid-search-user",
                sessionId: `session-${Date.now()}`,
                deviceInfo: {
                    deviceType: "WEB"
                }
            },
            jobQuery: {
                query: cleanQuery,
                locationFilters
            },
            maxPageSize: limit
        })) as any;

        const matchedJobs = response.matchingJobs || [];
        console.log(`[CTS] Found ${matchedJobs.length} jobs in CTS.`);

        return matchedJobs.map((mj: any) => {
            const j = mj.job;
            const companyName = j?.customAttributes?.companyName?.stringValues?.[0] || j?.company || "Unknown Company";
            const salary = j?.customAttributes?.salary?.stringValues?.[0] || "";
            const posted = j?.customAttributes?.posted?.stringValues?.[0] || "";

            return {
                id: j?.requisitionId || j?.name?.split('/').pop() || "",
                title: j?.title || "",
                company: companyName,
                location: j?.addresses?.[0] || "Remote",
                description: j?.description || "",
                url: j?.applicationInfo?.uris?.[0] || "",
                salary,
                posted,
                source: 'google_search' as const
            };
        });

    } catch (err: any) {
        console.error("[CTS] Search failed, falling back to CSE Scraper:", err);
        return [];
    }
}

/**
 * Fetches search autocomplete suggestions from CTS.
 */
export async function autocompleteCTS(query: string): Promise<string[]> {
    const setup = await getCTSSetup();
    if (!setup) return [];

    if (isDryRun) {
        const lower = query.toLowerCase();
        const matches = ["Software Engineer", "Software Developer", "Information Technology Specialist", "Data Scientist", "Product Manager"]
            .filter(term => term.toLowerCase().includes(lower));
        return matches;
    }

    const completionClient = new CompletionClient({ fallback: true });

    try {
        const [response] = await completionClient.completeQuery({
            tenant: setup.tenantPath,
            query: query.trim(),
            pageSize: 5
        });

        return (response.completionResults || [])
            .map(r => r.suggestion || "")
            .filter(s => s.length > 0);
            
    } catch (err) {
        console.warn("[CTS] Autocomplete failed:", err);
        return [];
    }
}

/**
 * Daily Cron Purge Worker.
 * Deletes jobs from Google CTS and Firestore that are older than 14 days.
 */
export async function purgeExpiredJobsCTS(): Promise<void> {
    const setup = await getCTSSetup();
    if (!setup) return;

    console.log("[CTS] Running daily expired jobs cleanup job...");

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    try {
        const jobClient = new JobServiceClient({ fallback: true });
        
        // Query our Firestore cachedJobs for expired listings (created >14 days ago)
        const snapshot = await db.collection("cachedJobs")
            .where("createdAt", "<", admin.firestore.Timestamp.fromDate(fourteenDaysAgo))
            .get();

        if (snapshot.empty) {
            console.log("[CTS] No expired jobs found in cache.");
            return;
        }

        console.log(`[CTS] Found ${snapshot.size} expired jobs to purge.`);

        let deletedCount = 0;
        const firestoreBatch = db.batch();

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const ctsJobName = data.ctsJobName;
            
            // Delete from Cloud Talent Solution
            if (ctsJobName && !isDryRun) {
                try {
                    console.log(`[CTS] Deleting expired CTS job: ${ctsJobName}`);
                    await jobClient.deleteJob({ name: ctsJobName });
                } catch (delErr: any) {
                    // Ignore already deleted errors (code 5 NOT_FOUND)
                    if (delErr.code !== 5) {
                        console.warn(`[CTS] Failed to delete expired job ${ctsJobName}: ${delErr.message}`);
                    }
                }
            }

            // Queue Firestore record deletion
            firestoreBatch.delete(doc.ref);
            deletedCount++;
        }

        // Commit Firestore deletions
        await firestoreBatch.commit();
        console.log(`[CTS] Cleanup complete: Purged ${deletedCount} jobs from CTS & cache database.`);

    } catch (err: any) {
        console.error("[CTS] Cleanup failed:", err);
    }
}
