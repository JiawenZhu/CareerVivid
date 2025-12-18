import * as functions from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";

const db = admin.firestore();
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Helper to create job ID - matches frontend logic
const createJobId = (title: string, company: string): string => {
    const sanitizedTitle = title.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '');
    const sanitizedCompany = company.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '');
    return `${sanitizedTitle}-${sanitizedCompany}`.replace(/[\s/]/g, '-').slice(0, 100);
}

function getFrequencyDays(freq: string): number {
    switch (freq) {
        case 'daily': return 1;
        case 'every_3_days': return 3;
        case 'every_5_days': return 5;
        case 'every_week': return 7;
        case 'every_10_days': return 10;
        case 'every_14_days': return 14;
        default: return 7;
    }
}

async function generateSmartTopic(baseRole: string, apiKey: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    try {
        const result = await model.generateContent(`Generate a specific, engaging interview topic or scenario for a ${baseRole}. Return ONLY the topic title, nothing else. Example: "System Design for High Scale", "Crisis Management Scenario". Keep it short.`);
        return result.response.text().trim().replace(/^"|"$/g, '') || baseRole;
    } catch (e) {
        console.error("Gemini Topic Gen Error", e);
        return baseRole;
    }
}

async function generateQuestions(topic: string, apiKey: string): Promise<string[]> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    try {
        const prompt = `Generate 5 challenging interview questions for: "${topic}". Return ONLY the questions as a JSON array of strings. Do not use markdown code blocks.`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        // Clean markdown code blocks if any
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Gemini Question Gen Error", e);
        return [
            "Tell me about yourself.",
            "Why are you interested in this topic?",
            "Describe a challenge you faced related to this.",
            "What comes to mind when you think of this?",
            "How would you explain this to a beginner?"
        ];
    }
}

export const sendPracticeEmails = onSchedule({
    schedule: "every 24 hours",
    timeZone: "America/Los_Angeles",
    secrets: [geminiApiKey],
    timeoutSeconds: 540,
    memory: "512MiB",
    region: "us-west1"
}, async (event) => {
    const now = admin.firestore.Timestamp.now();

    try {
        const usersSnapshot = await db.collection('users').where('emailPreferences.enabled', '==', true).get();

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const prefs = userData.emailPreferences;

            if (!prefs || !prefs.enabled) continue;

            // Check Frequency
            const lastSent = prefs.lastSentAt?.toDate() || new Date(0);
            const frequencyDays = getFrequencyDays(prefs.frequency);
            const nextDate = new Date(lastSent);
            nextDate.setDate(nextDate.getDate() + frequencyDays);

            // If strictly greater than now (future), skip. 
            // If now >= nextDate, it's due.
            if (now.toDate() < nextDate) continue;

            console.log(`Processing scheduled interview for user ${userDoc.id}`);

            try {
                // Generate Topic
                let topic = "General Interview";
                if (prefs.topicSource === 'manual' && prefs.manualTopic) {
                    topic = prefs.manualTopic;
                } else {
                    const jobTitle = userData.personalDetails?.jobTitle || "Software Engineer";
                    topic = await generateSmartTopic(jobTitle, geminiApiKey.value());
                }

                // Generate Questions
                const questions = await generateQuestions(topic, geminiApiKey.value());

                // Save to Practice History
                const jobData = {
                    title: topic,
                    company: "Scheduled Practice",
                    location: "Remote",
                    description: `Scheduled practice session for ${topic}`,
                    url: ""
                };

                // Use random suffix to ensure uniqueness even if topic repeats
                const randomIds = Math.random().toString(36).substring(7);
                const jobId = createJobId(jobData.title, jobData.company) + '-' + randomIds;

                await db.collection('users').doc(userDoc.id).collection('practiceHistory').doc(jobId).set({
                    id: jobId,
                    job: { ...jobData, id: jobId },
                    questions: questions,
                    timestamp: now,
                    section: 'interviews'
                });

                // Send Email
                const emailLink = `https://careervivid.web.app/#/interview-studio/${jobId}`;

                await db.collection('mail').add({
                    to: userData.email,
                    message: {
                        subject: `Practice Time: ${topic}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                                <h2 style="color: #4F46E5;">Hi ${userData.personalDetails?.firstName || 'there'},</h2>
                                <p>It's time for your scheduled practice session!</p>
                                <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <h3 style="margin: 0; color: #1F2937;">${topic}</h3>
                                    <p style="margin: 5px 0 0; color: #6B7280;">${questions.length} Questions • AI Interviewer Ready</p>
                                </div>
                                <p style="text-align: center; margin: 30px 0;">
                                    <a href="${emailLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Start Interview Now</a>
                                </p>
                                <p style="font-size: 12px; color: #9CA3AF; text-align: center;">
                                    Or copy this link: <a href="${emailLink}">${emailLink}</a>
                                </p>
                            </div>
                        `
                    }
                });

                // Update Last Sent
                await userDoc.ref.update({
                    'emailPreferences.lastSentAt': now
                });

            } catch (error) {
                console.error(`Error processing individual user ${userDoc.id}:`, error);
            }
        }
    } catch (error) {
        console.error("Error in sendPracticeEmails job:", error);
    }
});

// Scheduled cleanup for job search cache
// Runs daily and deletes cache entries not accessed in 14 days
export const cleanupJobSearchCache = onSchedule({
    schedule: "every 24 hours",
    timeZone: "America/Los_Angeles",
    timeoutSeconds: 300,
    memory: "256MiB",
    region: "us-west1"
}, async (event) => {
    console.log("[cleanupJobSearchCache] Starting cache cleanup...");

    try {
        const twoWeeksAgo = admin.firestore.Timestamp.fromDate(
            new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        );

        // Query for stale entries
        const staleEntriesSnapshot = await db.collection('jobSearchCache')
            .where('lastAccessedAt', '<', twoWeeksAgo)
            .get();

        if (staleEntriesSnapshot.empty) {
            console.log("[cleanupJobSearchCache] No stale cache entries found.");
            return;
        }

        // Batch delete (Firestore batches are limited to 500 operations)
        const batchSize = 500;
        let deletedCount = 0;

        for (let i = 0; i < staleEntriesSnapshot.docs.length; i += batchSize) {
            const batch = db.batch();
            const chunk = staleEntriesSnapshot.docs.slice(i, i + batchSize);

            chunk.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            deletedCount += chunk.length;
        }

        console.log(`[cleanupJobSearchCache] Deleted ${deletedCount} stale cache entries.`);
    } catch (error) {
        console.error("[cleanupJobSearchCache] Error during cleanup:", error);
    }
});

// Scheduled cleanup for usage logs (login, activity, error logs)
// Runs daily and deletes logs older than 14 days
export const cleanupUsageLogs = onSchedule({
    schedule: "every 24 hours",
    timeZone: "America/Los_Angeles",
    timeoutSeconds: 300,
    memory: "256MiB",
    region: "us-west1"
}, async (event) => {
    console.log("[cleanupUsageLogs] Starting usage logs cleanup...");

    try {
        const twoWeeksAgo = admin.firestore.Timestamp.fromDate(
            new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        );

        // Query for old logs
        const oldLogsSnapshot = await db.collection('usage_logs')
            .where('timestamp', '<', twoWeeksAgo)
            .get();

        if (oldLogsSnapshot.empty) {
            console.log("[cleanupUsageLogs] No old logs found.");
            return;
        }

        // Batch delete (Firestore batches are limited to 500 operations)
        const batchSize = 500;
        let deletedCount = 0;

        for (let i = 0; i < oldLogsSnapshot.docs.length; i += batchSize) {
            const batch = db.batch();
            const chunk = oldLogsSnapshot.docs.slice(i, i + batchSize);

            chunk.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            deletedCount += chunk.length;
        }

        console.log(`[cleanupUsageLogs] Deleted ${deletedCount} old usage logs.`);
    } catch (error) {
        console.error("[cleanupUsageLogs] Error during cleanup:", error);
    }
});

