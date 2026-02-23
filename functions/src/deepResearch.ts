import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { defineSecret } from 'firebase-functions/params';

const geminiApiKey = defineSecret('GEMINI_API_KEY');

// Initialize Firestore if not already done in index.ts
if (!admin.apps.length) {
    admin.initializeApp();
}

/**
 * Helper to get a configured Gemini model
 */
const getGeminiModel = (apiKey: string, modelName = 'gemini-2.5-flash') => {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Core Deep Research Logic Flow
 * 1. Generate SEO Title & Slug
 * 2. Generate Content (Markdown)
 * 3. Generate Excerpt
 */
async function performDeepResearch(topic: string, apiKey: string) {
    const model = getGeminiModel(apiKey);

    console.log(`Starting Deep Research on topic: ${topic}`);

    // Phase 1: Outline & Content
    const contentPrompt = `You are an expert SEO Content Writer and Industry Analyst. Write a comprehensive, highly-engaging, and informative blog post about: "${topic}".
    Format the output entirely in standard Markdown.
    Include an H1 header at the top.
    Use H2s, H3s, bullet points, and bold text to make it readable.
    The tone should be professional, insightful, and forward-looking.
    Aim for at least 800 words.`;

    console.log(`Requesting content generation...`);
    const contentResponse = await model.generateContent(contentPrompt);
    const content = contentResponse.response.text();

    // Phase 2: Metadata (Title, Excerpt, Keywords)
    const metaPrompt = `Based on the following article content, generate JSON metadata for SEO purposes.
    The JSON should have these exact keys: "title" (a catchy, SEO-friendly H1 title), "excerpt" (a compelling 2-sentence summary), "slug" (a url-friendly string like 'future-of-ai'), and "keywords" (an array of 5 relevant strings).
    Return ONLY valid JSON, nothing else, no markdown codeblocks.

    Article Content:
    ${content.substring(0, 1500)}...`; // truncate to save context limit if needed

    console.log(`Requesting metadata generation...`);
    const metaResponse = await model.generateContent(metaPrompt);
    let metaText = metaResponse.response.text().trim();

    // Strip markdown codeblocks if Gemini still added them
    if (metaText.startsWith('```json')) {
        metaText = metaText.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    let metadata;
    try {
        metadata = JSON.parse(metaText);
    } catch (e) {
        console.error("Failed to parse Gemini JSON metadata:", metaText);
        // Fallback
        metadata = {
            title: `Deep Dive: ${topic}`,
            excerpt: `An insightful look into ${topic} and what it means for the future.`,
            slug: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
            keywords: [topic, 'Trends', 'Analysis', 'Insights', '2026']
        };
    }

    return {
        title: metadata.title,
        content: content,
        excerpt: metadata.excerpt,
        slug: metadata.slug,
        category: 'Industry Insights',
        publishedAt: admin.firestore.FieldValue.serverTimestamp(),
        author: 'Deep Research AI',
        coverImage: '',
        status: 'Draft',
        viewCount: 0,
        audioGenerationStatus: 'not_started'
    };
}

/**
 * HTTPS Callable: generateManualBlogDraft
 * Triggered by the Admin UI "Generate Draft Now" button
 */
export const generateManualBlogDraft = functions
    .runWith({ secrets: [geminiApiKey], timeoutSeconds: 540, memory: '1GB' })
    .region('us-west1')
    .https.onCall(async (data, context) => {
        // Must be authenticated
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to trigger deep research.');
        }

        const { topic } = data;
        if (!topic) {
            throw new functions.https.HttpsError('invalid-argument', 'Topic is required.');
        }

        try {
            const apiKey = geminiApiKey.value();
            const draftData = await performDeepResearch(topic, apiKey);

            // Save to Firestore
            const docRef = await admin.firestore().collection('blog_posts').add(draftData);
            console.log(`Successfully created draft document: ${docRef.id}`);

            return { success: true, postId: docRef.id, slug: draftData.slug };
        } catch (error: any) {
            console.error("Manual Deep Research Failed:", error);
            throw new functions.https.HttpsError('internal', error.message || 'AI Generation failed.');
        }
    });

/**
 * HTTPS Callable: getTrendingChips
 * Fetches real-time dynamic tags (or a smart hardcoded list for now)
 */
export const getTrendingChips = functions
    .region('us-west1')
    .https.onCall(async (data, context) => {
        // Eventually we might make this dynamic via Gemini or News APIs.
        // For now, mimicking production's returned structure.
        return {
            trends: [
                'AI Agents 2026',
                'Career Engineering',
                'Future of Cloud',
                'Remote Work Realities',
                'Soft Skills in Tech',
                'Cybersecurity Threats',
                'Prompt Engineering'
            ]
        };
    });

/**
 * Exposed function for the scheduled cron job to call
 */
export async function runPassiveDeepResearchTask(topic: string, apiKey: string) {
    console.log(`Executing Passive Cron Task for topic: ${topic}`);
    const draftData = await performDeepResearch(topic, apiKey);
    const docRef = await admin.firestore().collection('blog_posts').add(draftData);
    console.log(`Passive Cron completed. Draft created: ${docRef.id}`);
}
