import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure developers know how to run this
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error(`
❌ Missing Service Account Key!

To run this seed script:
1. Go to Firebase Console > Project Settings > Service Accounts.
2. Click "Generate new private key" and save the JSON file.
3. Run this script setting the env var to the path of that file:
   
   FIREBASE_SERVICE_ACCOUNT_KEY=./path/to/key.json npm run seed:templates
`);
    process.exit(1);
}

// Load the service account
let serviceAccount;
try {
    const keyPath = join(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    const keyFile = await readFile(keyPath, 'utf8');
    serviceAccount = JSON.parse(keyFile);
} catch (error) {
    console.error("❌ Failed to load service account key:", error.message);
    process.exit(1);
}

// Initialize Firebase Admin
initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();
const templatesDir = join(__dirname, '../src/data/templates');

async function seedTemplates() {
    try {
        console.log(`📂 Reading templates from: ${templatesDir}`);
        const files = await readdir(templatesDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        if (jsonFiles.length === 0) {
            console.log("⚠️ No JSON files found in the templates directory.");
            return;
        }

        const batch = db.batch();
        const collectionRef = db.collection('system_templates');

        console.log(`🚀 Found ${jsonFiles.length} templates. Seeding to Firestore...`);

        for (const file of jsonFiles) {
            const templateId = file.replace('.json', '');
            const filePath = join(templatesDir, file);
            const content = await readFile(filePath, 'utf8');

            // We validate it's proper JSON before uploading
            JSON.parse(content);

            const docRef = collectionRef.doc(templateId);
            batch.set(docRef, {
                id: templateId,
                description: `Seeded template: ${templateId}`,
                templateString: content
            }, { merge: true });

            console.log(`  → Prepared: ${templateId}`);
        }

        await batch.commit();
        console.log("✅ Successfully seeded all templates to Firestore 'system_templates' collection!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding templates:", error);
        process.exit(1);
    }
}

seedTemplates();
