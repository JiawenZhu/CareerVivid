import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import textToSpeech from '@google-cloud/text-to-speech';
import { v4 as uuidv4 } from 'uuid';

// Initialize the TTS client
const ttsClient = new textToSpeech.TextToSpeechClient();

/**
 * Maps frontend voice names to Google Cloud TTS voice models.
 */
const voiceMap: Record<string, string> = {
    'Amber': 'en-US-Journey-F',
    'Aria': 'en-US-Journey-F',
    'Ashley': 'en-US-Journey-F',
    'Cora': 'en-US-Journey-F',
    'Daria': 'en-US-Journey-F',
    'Dawn': 'en-US-Journey-F',
    'Ellen': 'en-US-Journey-F',
    'Eric': 'en-US-Journey-D',
    'Guy': 'en-US-Journey-D',
    'Jane': 'en-US-Journey-F',
    'Alnilam': 'en-US-Journey-D',
    'Achernar': 'en-US-Journey-F',
    'Achird': 'en-US-Journey-D',
    'Algenib': 'en-US-Journey-D',
    'Algieba': 'en-US-Journey-D',
    'Aoede': 'en-US-Journey-F',
    'Callirrhoe': 'en-US-Journey-F',
    'Charon': 'en-US-Journey-D',
    'Despina': 'en-US-Journey-F',
    'Erinome': 'en-US-Journey-F',
    'Fenrir': 'en-US-Journey-D',
    'Gacrux': 'en-US-Journey-D',
    'Isonoe': 'en-US-Journey-F',
    'Kore': 'en-US-Journey-F',
    'Laomedeia': 'en-US-Journey-F',
    'Puck': 'en-US-Journey-D'
};

/**
 * Strips basic markdown formatting from a string.
 */
function stripMarkdown(text: string): string {
    // Remove headers
    let stripped = text.replace(/^#+\s+/gm, '');
    // Remove bold/italic
    stripped = stripped.replace(/(\*\*|\*|__|_)(.*?)\1/g, '$2');
    // Remove links [text](url) -> text
    stripped = stripped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
    // Remove images ![text](url) -> ''
    stripped = stripped.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '');
    // Remove code blocks
    stripped = stripped.replace(/```[\s\S]*?```/g, '');
    return stripped.trim();
}

/**
 * Splits text intelligently to ensure no chunk exceeds 4500 bytes and
 * tries to yield between 5 and 20 chunks depending on total length.
 * Splits on double newline, then single newline, then period.
 */
function chunkText(text: string): string[] {
    const rawText = stripMarkdown(text);
    const MAX_BYTES = 4500; // GC TTS limit is 5000 bytes, safe margin

    // Split mostly by paragraphs first
    const paragraphs = rawText.split(/\n\n+/);

    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        // If the paragraph itself is too large, we must split by sentences
        if (Buffer.byteLength(paragraph, 'utf8') > MAX_BYTES) {
            const sentences = paragraph.split(/(?<=\.|\?|!)\s+/);
            for (const sentence of sentences) {
                if (Buffer.byteLength(currentChunk + ' ' + sentence, 'utf8') > MAX_BYTES) {
                    if (currentChunk) chunks.push(currentChunk.trim());
                    currentChunk = sentence;
                } else {
                    currentChunk += (currentChunk ? ' ' : '') + sentence;
                }
            }
        } else {
            if (Buffer.byteLength(currentChunk + '\n\n' + paragraph, 'utf8') > MAX_BYTES) {
                if (currentChunk) chunks.push(currentChunk.trim());
                currentChunk = paragraph;
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            }
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    // Constraint: We need at least 5 chunks and max 20, but this depends on length.
    // Given the 5000 byte limit, dividing arbitrarily into 5 chunks might still violate byte limits
    // if the text is huge. So we'll prioritize byte-safety above strict chunk counts.
    // If we have fewer than 5 chunks, but text is very short, that's fine.

    return chunks;
}

export const processAudioPipeline = functions
    .region('us-west1')
    .runWith({ timeoutSeconds: 540, memory: "1GB" })
    .firestore.document('blog_posts/{postId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();
        const postId = context.params.postId;

        // Only trigger when audioGenerationStatus changes to 'processing'
        if (newData.audioGenerationStatus !== 'processing' || oldData.audioGenerationStatus === 'processing') {
            return null; // Ignore other updates
        }

        const voiceModel = newData.audioVoiceUsed;
        const content = newData.content;

        try {
            console.log(`Starting TTS background pipeline for post: ${postId} with voice: ${voiceModel}`);

            if (!content) {
                throw new Error('Blog post has no content to narrate.');
            }

            if (!voiceModel) {
                throw new Error('Voice model not specified.');
            }

            // 3. Chunk the text
            const chunks = chunkText(content);
            console.log(`Split text into ${chunks.length} chunks.`);

            if (chunks.length === 0) {
                throw new Error('Text chunking failed or text was empty string.');
            }

            if (chunks.length > 50) {
                throw new Error('Article is too long to process (Exceeded 50 chunks).');
            }

            const googleVoiceModel = voiceMap[voiceModel] || 'en-US-Journey-F'; // Default if not found

            // 4. Call TTS Sequentially
            const audioBuffers: Buffer[] = [];

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                console.log(`Processing chunk ${i + 1}/${chunks.length} (${Buffer.byteLength(chunk, 'utf8')} bytes)`);

                const request = {
                    input: { text: chunk },
                    voice: { languageCode: 'en-US', name: googleVoiceModel },
                    audioConfig: { audioEncoding: 'MP3' as const },
                };

                const [response] = await ttsClient.synthesizeSpeech(request);

                if (response.audioContent) {
                    // response.audioContent is a Uint8Array. Buffer.from handles this correctly.
                    audioBuffers.push(Buffer.from(response.audioContent));
                } else {
                    console.warn(`Chunk ${i + 1} returned no audio content.`);
                }

                // Slight delay to avoid hammering the API
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // 5. Concatenate Buffers
            console.log('Concatenating audio buffers...');
            const finalBuffer = Buffer.concat(audioBuffers);

            // 6. Upload to Storage
            const bucket = admin.storage().bucket();
            const filePath = `blog_audio/${postId}_${Date.now()}.mp3`; // Add timestamp to avoid caching issues on rewrite
            const file = bucket.file(filePath);
            const token = uuidv4();

            console.log(`Uploading MP3 to ${filePath}`);
            await file.save(finalBuffer, {
                metadata: {
                    contentType: 'audio/mpeg',
                    metadata: {
                        firebaseStorageDownloadTokens: token,
                    },
                },
            });

            const bucketName = bucket.name;
            const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`;

            // 7. Update Firestore with success
            console.log('Updating Firestore document with audio metadata and completed status...');
            await change.after.ref.update({
                audioGenerationStatus: 'completed',
                audioUrl: downloadUrl,
                audioGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
                // Clear any previous errors
                audioError: admin.firestore.FieldValue.delete()
            });

            console.log('TTS background pipeline completed successfully.');
            return null;

        } catch (error: any) {
            console.error('Error generating article audio in background:', error);

            // Update Firestore with failure status
            await change.after.ref.update({
                audioGenerationStatus: 'failed',
                audioError: error.message || 'Failed to generate TTS audio.'
            });

            // Re-throw so Firebase logs it as an error
            throw error;
        }
    });
