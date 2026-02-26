import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface SystemTemplate {
    id: string;
    description: string;
    templateString: string;
}

/**
 * Fetches a raw template string.
 * It first tries to fetch from the 'system_templates' collection in Firestore.
 * If that fails (e.g., a fresh clone without a seeded DB), it falls back to 
 * importing the local JSON template from the codebase.
 */
export const getSystemTemplate = async (templateId: string): Promise<string> => {
    try {
        const templateRef = doc(db, 'system_templates', templateId);
        const docSnap = await getDoc(templateRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as SystemTemplate;
            if (data.templateString) {
                return data.templateString;
            }
        }
    } catch (dbError) {
        console.warn(`[getSystemTemplate] Failed to fetch from Firestore. Falling back to local file. Error:`, dbError);
    }

    // Fallback: If DB fetch fails or doc doesn't exist, load the local JSON file.
    // This ensures the open-source repo works out-of-the-box without seeding.
    try {
        console.log(`[getSystemTemplate] Loading local fallback for: ${templateId}`);
        const localModule = await import(`../data/templates/${templateId}.json`);
        return JSON.stringify(localModule.default);
    } catch (localError) {
        throw new Error(`Template '${templateId}' could not be loaded from DB or local files. Error: ${localError}`);
    }
};

/**
 * Utility to seed the database with initial templates.
 * Call this once from an admin component or initialization block.
 */
export const seedSystemTemplates = async () => {
    const defaultResumeTemplate = {
        personalDetails: {
            jobTitle: "Software Engineer",
            firstName: "{{personalDetails.firstName}}",
            lastName: "{{personalDetails.lastName}}",
            email: "{{USER_EMAIL}}",
            phone: "{{personalDetails.phone}}",
            address: "",
            city: "",
            postalCode: "",
            country: ""
        },
        professionalSummary: "{{USER_SUMMARY}}",
        employmentHistory: [],
        education: [],
        skills: [],
        languages: [],
        websites: []
    };

    const templatesToSeed: SystemTemplate[] = [
        {
            id: 'template_software_engineer',
            description: 'Default Software Engineer Resume Template',
            templateString: JSON.stringify(defaultResumeTemplate)
        },
        // Add more seeded templates here in the future
    ];

    console.log("Seeding system_templates...");
    for (const template of templatesToSeed) {
        await setDoc(doc(db, 'system_templates', template.id), template, { merge: true });
    }
    console.log("Seeding complete.");
};
