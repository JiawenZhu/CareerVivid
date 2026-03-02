import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { callGeminiProxy, ProxyPayload, generateImage } from './geminiService';
import { uploadImage, dataURLtoBlob } from './storageService';

const ADMIN_BOT_AUTHOR_ID = 'bot-admin-research'; // Placeholder distinct author ID
const ADMIN_BOT_AUTHOR_NAME = 'CareerVivid Staff'; // Admin bot name
const ADMIN_BOT_AUTHOR_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=CareerVividAdmin';

// Note: Ensure VITE_TAVILY_API_KEY is defined in your environment/hosting variables.
const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY || '';

export interface TopicSuggestion {
    title: string;
}

export const suggestBotTopics = async (category: string, frequency: string): Promise<TopicSuggestion[]> => {
    const prompt = `You are an expert tech blog editor. Generate 5 highly actionable, trending, and viral-style article titles about "${category}". 
The content will be published to a professional community feed. 
Schedule context: ${frequency}.
Return ONLY a valid JSON array of objects with a single "title" key. DO NOT wrap JSON in markdown block ticks (\`\`\`). Example: [{"title": "Title 1"}]`;

    const payload: ProxyPayload = {
        modelName: 'gemini-3-flash-preview',
        contents: prompt
    };

    try {
        const { text } = await callGeminiProxy(payload);
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed as TopicSuggestion[];
        return [];
    } catch (error) {
        console.error('Failed to suggest topics:', error);
        throw new Error('Failed to generate topic suggestions.');
    }
};

const performWebResearch = async (topic: string): Promise<string> => {
    if (!TAVILY_API_KEY) {
        console.warn('Tavily API key is missing. Skipping web research.');
        return 'No external research available.';
    }

    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: TAVILY_API_KEY,
                query: topic,
                search_depth: 'advanced',
                limit: 3,
                include_raw_content: false
            })
        });

        if (!response.ok) {
            throw new Error(`Tavily API responded with status ${response.status}`);
        }

        const data = await response.json();

        // Compile research summary
        const results = data.results || [];
        if (results.length === 0) return 'No external research results found.';

        let researchContext = 'Here is the latest factual information found from the web to incorporate into your article:\n\n';
        results.forEach((item: any, index: number) => {
            researchContext += `Source ${index + 1}: ${item.title}\nURL: ${item.url}\nSummary: ${item.content}\n\n`;
        });

        return researchContext;
    } catch (error) {
        console.error('Tavily Web Research Failed:', error);
        return 'External research failed. Generate content using only internal baseline knowledge.';
    }
};

/**
 * Summarizes a full article into an engaging LinkedIn text post.
 */
export const generateLinkedInPost = async (articleTitle: string, articleContent: string): Promise<string> => {
    const prompt = `You are a top-tier LinkedIn ghostwriter and B2B tech influencer. I just wrote a long-form article titled "${articleTitle}". 

Write a highly engaging, viral-style LinkedIn post summarizing the core value of the article to drive clicks.

Requirements:
1. Start with a strong, curiosity-inducing hook (1-2 sentences). Do not use the word "Unlock" or "Discover".
2. Include 3-4 punchy bullet points highlighting the key takeaways.
3. Use a very professional and authoritative, yet accessible tone. 
4. Use modern, clean spacing (empty lines between sentences).
5. Add 2-3 relevant emojis maximum.
6. End with an explicit call-to-action to read the full article at the link in the comments (or just "Read the full guide below").
7. Add 3-5 relevant, broad tech hashtags at the very bottom.

Here is the article to summarize:
${articleContent.substring(0, 3000)} // Truncate if too long to save context

Provide ONLY the exact text of the LinkedIn post. Do NOT wrap it in quotation marks or markdown blocks.`;

    const payload: ProxyPayload = {
        modelName: 'gemini-2.5-flash',
        contents: prompt
    };

    try {
        const { text } = await callGeminiProxy(payload);
        return text.trim();
    } catch (error) {
        console.error('Failed to generate LinkedIn post:', error);
        return `I just published a new article: "${articleTitle}". Check it out below!`;
    }
};

/**
 * Calculates the target year for the AI generation prompt.
 * If the current date is strictly less than 1 month away from the new year
 * (i.e., it is December), we shift the target year to the upcoming year
 * to ensure content remains relevant. Otherwise, use current year.
 */
export const calculateTargetYear = (): number => {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-indexed (11 is December)
    const currentYear = today.getFullYear();

    if (currentMonth === 11) {
        return currentYear + 1;
    }
    return currentYear;
};

export const generateAndPublishArticle = async (adminUserId: string, topic: string, category: string, onProgress?: (step: string) => void): Promise<{ id: string, title: string, content: string }> => {
    try {
        // Step 1: Research
        if (onProgress) onProgress('Researching Web...');
        const researchContext = await performWebResearch(topic);

        // Step 2: Drafting
        if (onProgress) onProgress('Drafting Content...');
        let instructions = `You are a Principal Software Engineer and expert Technical Writer. Write an article for our professional community about "${topic}".\n\n`;

        if (category.toLowerCase().includes('career') || category.toLowerCase().includes('job')) {
            instructions += `FORMAT: Write a concise, punchy 300-500 word post. Focus on actionable career advice, direct insights, and easy-to-read layout. Avoid being excessively verbose.\n`;
        } else {
            instructions += `FORMAT: Write a comprehensive 1000+ word technical tutorial/guide. Include deep-dive technical explanations, code blocks with proper syntax highlighting, and Markdown formatting for headers. Format as a highly readably Technical Blog.\n`;
        }

        instructions += `\nCONTEXT FROM WEB RESEARCH:\n${researchContext}\n\n`;
        instructions += `FORMATTING RULE: You must use STRICT Markdown formatting. You MUST leave a completely blank line (double newline \\n\\n) between every paragraph, heading, and code block to ensure proper rendering. Do not create walls of text. Keep paragraphs short (3-4 sentences maximum).\n\n`;

        // Time Context Injection
        const targetYear = calculateTargetYear();
        instructions += `Crucial Context: The target year for this article is ${targetYear}.\n`;
        instructions += `Never use past years (like 2023 or 2024) in the title or content. For example, rewrite 'The 2024 Performance Audit' to 'The ${targetYear} Performance Audit'.\n`;
        instructions += `If the target year is the upcoming year, you may include the specific month and date to build anticipation.\n\n`;

        instructions += `IMPORTANT: Output MUST be a valid JSON object matching this structure EXACTLY. DO NOT wrap the output in markdown code blocks:
{
    "title": "A highly engaging version of the topic",
    "content": "The full markdown body of the post. Include emojis and well structured paragraphs",
    "imagePrompt": "A highly detailed prompt for generating a beautiful 16:9 cover image or architecture diagram representing this specific post. Keep it visual and descriptive. STRICTLY ENFORCE THIS STYLE: Minimalist flat vector illustration, corporate tech style, clean geometric lines, muted pastel and brand colors, modern UI/UX graphic, Dribbble style, white background. NO neon, NO glowing lights, NO cyberpunk elements, NO text.",
    "tags": ["tag1", "tag2", "tag3"]
}`;

        const proxyPayload: ProxyPayload = {
            modelName: 'gemini-3-flash-preview',
            contents: instructions
        };

        const { text } = await callGeminiProxy(proxyPayload);

        // Clean up markdown wrapping if present
        let cleanedText = text;
        if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.replace(/^```json\n/, '');
        } else if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/^```\n?/, '');
        }
        if (cleanedText.endsWith('```')) {
            cleanedText = cleanedText.replace(/\n?```$/, '');
        }
        cleanedText = cleanedText.trim();

        let draftData;
        try {
            draftData = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('Failed to parse drafting JSON:', cleanedText);
            throw new Error('LLM did not return valid JSON for the drafting content.');
        }

        // Step 3: Generating Images
        if (onProgress) onProgress('Generating Images...');
        let coverImageUrl = '';
        if (draftData.imagePrompt) {
            try {
                // Try generating an image using existing Imagen usage. Model type 'standard' matches existing types.
                const base64DataUrl = await generateImage(adminUserId, draftData.imagePrompt, 'standard');

                if (base64DataUrl && base64DataUrl.startsWith('data:image')) {
                    if (onProgress) onProgress('Uploading Image...');
                    const blob = dataURLtoBlob(base64DataUrl);
                    if (blob) {
                        const path = `public/community_assets/${adminUserId}/${Date.now()}_cover.png`;
                        coverImageUrl = await uploadImage(blob, path);
                    }
                }
            } catch (imageErr) {
                console.error('Failed to generate cover image for post:', imageErr);
                // Graceful degradation, post simply won't have cover image
            }
        }

        // Step 4: Published
        if (onProgress) onProgress('Publishing...');

        const now = serverTimestamp();
        let readTimeMinutes = Math.max(1, Math.ceil((draftData.content?.split(' ').length || 200) / 200));

        const postDoc = {
            type: 'article',
            title: draftData.title || topic,
            content: draftData.content || '*Content generation failed.*',
            coverImage: coverImageUrl || null,
            tags: draftData.tags || ['tech', 'community'],
            authorId: adminUserId,
            authorName: ADMIN_BOT_AUTHOR_NAME,
            authorAvatar: ADMIN_BOT_AUTHOR_AVATAR,
            authorRole: 'Community Expert',
            readTime: readTimeMinutes,
            metrics: {
                likes: 0,
                comments: 0,
                views: 0
            },
            createdAt: now,
            updatedAt: now
        };

        const docRef = await addDoc(collection(db, 'community_posts'), postDoc);

        if (onProgress) onProgress('Published!');
        return {
            id: docRef.id,
            title: postDoc.title,
            content: postDoc.content
        };

    } catch (error: any) {
        console.error('generateAndPublishArticle error:', error);
        throw new Error(error.message || 'Failed to complete article generation process.');
    }
};

/**
 * BOILERPLATE: Automated Scheduling Integration
 * This function demonstrates how to wire up a background worker, Vercel Cron, or Node-Cron
 * to trigger the article generation based on the saved scheduling configuration.
 */
export const cronTriggerArticleGeneration = async () => {
    /*
    // Example Cron Handler Flow:
    
    // 1. Fetch active schedules from the database
    // const schedulesSnap = await getDocs(collection(db, 'bot_schedules'));
    // const activeConfigs = schedulesSnap.docs.map(d => d.data());
    
    for (const config of activeConfigs) {
        // 2. Check if the current time matches the configured schedule (e.g., config.time === '09:00' and config.frequency === 'Weekly')
        // const shouldRunNow = checkScheduleMatch(config); 
        
        if (shouldRunNow) {
            try {
                // 3. Auto-suggest a topic based on the configured category
                const topics = await suggestBotTopics(config.category, config.frequency);
                const selectedTopic = topics[0]?.title;
                
                if (selectedTopic) {
                    // 4. Trigger generation (Using a system admin ID)
                    await generateAndPublishArticle(
                        'SYSTEM_CRON_WORKER', 
                        selectedTopic, 
                        config.category
                    );
                }
            } catch (err) {
                console.error(`Scheduled task failed for config ID: ${config.id}`, err);
            }
        }
    }
    */
};
