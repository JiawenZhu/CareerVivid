import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { TranslationServiceClient } from '@google-cloud/translate';

// --- Duplicate and Translate Resume Function ---
export const duplicateAndTranslateResume = functions.region('us-west1').https.onCall(async (data, context) => {
    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const { resumeId, targetLanguage } = data;

    // 2. Input Validation
    if (!resumeId || !targetLanguage) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'The function must be called with "resumeId" and "targetLanguage" arguments.'
        );
    }

    const userId = context.auth.uid;

    try {
        // 3. Check Translation Limits
        const userRef = admin.firestore().collection('users').doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        // 3a. Check if reset needed (30 days)
        const lastReset = userData?.lastTranslationReset?.toDate();
        const now = new Date();
        const daysSinceReset = lastReset ? (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24) : 999;

        if (daysSinceReset > 30) {
            // Reset counter
            await userRef.update({
                translationCount: 0,
                lastTranslationReset: admin.firestore.FieldValue.serverTimestamp()
            });
            if (userData) {
                userData.translationCount = 0;
            }
        }

        // 3b. Determine limit (admin override takes priority)
        let limit = 8; // Default for free
        if (userData?.customTranslationLimit !== undefined) {
            // Admin override
            limit = userData.customTranslationLimit;
        } else {
            // Check plan for premium
            const plan = userData?.plan || 'free';
            const isPremium = plan === 'pro_sprint' || plan === 'pro_monthly' || plan === 'coach';
            limit = isPremium ? 30 : 8;
        }

        // 3c. Enforce limit
        const currentCount = userData?.translationCount || 0;
        if (currentCount >= limit) {
            throw new functions.https.HttpsError(
                'resource-exhausted',
                `Translation limit reached (${limit}/month). Please upgrade or contact support for a limit increase.`
            );
        }

        // 4. Fetch Original Resume
        const resumeRef = admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('resumes')
            .doc(resumeId);

        const resumeDoc = await resumeRef.get();

        if (!resumeDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Resume not found.');
        }

        const originalResume = resumeDoc.data();
        if (!originalResume) {
            throw new functions.https.HttpsError('internal', 'Resume data is invalid.');
        }

        // 4. Deep Copy Resume
        const resumeCopy = JSON.parse(JSON.stringify(originalResume));

        // 5. Extract Translatable Fields into Flat Array
        const textsToTranslate: string[] = [];
        const fieldMap: Array<{ path: string; index: number }> = [];

        const addField = (text: string | undefined, path: string) => {
            if (text && text.trim().length > 0) {
                textsToTranslate.push(text);
                fieldMap.push({ path, index: textsToTranslate.length - 1 });
            }
        };

        // Personal Details
        addField(resumeCopy.personalDetails?.jobTitle, 'personalDetails.jobTitle');
        addField(resumeCopy.personalDetails?.city, 'personalDetails.city');
        addField(resumeCopy.personalDetails?.country, 'personalDetails.country');

        // Professional Summary
        addField(resumeCopy.professionalSummary, 'professionalSummary');

        // Employment History
        resumeCopy.employmentHistory?.forEach((job: any, i: number) => {
            addField(job.jobTitle, `employmentHistory.${i}.jobTitle`);
            addField(job.employer, `employmentHistory.${i}.employer`);
            addField(job.city, `employmentHistory.${i}.city`);
            addField(job.description, `employmentHistory.${i}.description`);
        });

        // Education
        resumeCopy.education?.forEach((edu: any, i: number) => {
            addField(edu.degree, `education.${i}.degree`);
            addField(edu.school, `education.${i}.school`);
            addField(edu.city, `education.${i}.city`);
            addField(edu.description, `education.${i}.description`);
        });

        // Skills
        resumeCopy.skills?.forEach((skill: any, i: number) => {
            addField(skill.name, `skills.${i}.name`);
        });

        // Section Titles
        if (resumeCopy.sectionTitles) {
            Object.keys(resumeCopy.sectionTitles).forEach((key) => {
                addField(resumeCopy.sectionTitles[key], `sectionTitles.${key}`);
            });
        }

        console.log(`Translating ${textsToTranslate.length} fields to ${targetLanguage}`);

        // 6. Batch Translate via internal translateText logic
        const translationClient = new TranslationServiceClient();
        const projectId = 'jastalk-firebase';
        const location = 'global';

        const request = {
            parent: `projects/${projectId}/locations/${location}`,
            contents: textsToTranslate,
            mimeType: 'text/html', // Preserve HTML formatting
            sourceLanguageCode: 'en-US',
            targetLanguageCode: targetLanguage,
        };

        const [response] = await translationClient.translateText(request);
        const translations = response.translations?.map(t => t.translatedText) || [];

        if (translations.length !== textsToTranslate.length) {
            throw new functions.https.HttpsError(
                'internal',
                'Translation mismatch: expected and received counts differ.'
            );
        }

        // 7. Rehydrate - Map translations back to resume copy
        fieldMap.forEach(({ path, index }) => {
            const translatedText = translations[index];
            const pathParts = path.split('.');

            let current: any = resumeCopy;
            for (let i = 0; i < pathParts.length - 1; i++) {
                current = current[pathParts[i]];
            }
            current[pathParts[pathParts.length - 1]] = translatedText;
        });

        // 8. Update Metadata
        const languageNames: { [key: string]: string } = {
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ar': 'Arabic',
            'ru': 'Russian',
            'pt': 'Portuguese',
            'it': 'Italian',
            'ko': 'Korean',
        };

        const languageName = languageNames[targetLanguage] || targetLanguage.toUpperCase();
        const newResumeId = `${userId}_${Date.now()}`;

        resumeCopy.id = newResumeId;
        resumeCopy.language = targetLanguage;
        resumeCopy.title = `${languageName} - ${originalResume.title}`;
        resumeCopy.createdAt = admin.firestore.FieldValue.serverTimestamp();
        resumeCopy.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        // 9. Save to Firestore
        await admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('resumes')
            .doc(newResumeId)
            .set(resumeCopy);

        console.log(`Successfully created translated resume: ${newResumeId}`);

        // 10. Increment translation count
        await userRef.update({
            translationCount: admin.firestore.FieldValue.increment(1)
        });

        // 11. Return new resume ID
        return { newResumeId };

    } catch (error: any) {
        console.error('duplicateAndTranslateResume Error:', error);

        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        throw new functions.https.HttpsError(
            'internal',
            'Failed to duplicate and translate resume.',
            error.message
        );
    }
});
