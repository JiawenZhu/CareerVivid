import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Expecting the key in the parent directory (careervivid root)
const serviceAccountPath = join(__dirname, '../jastalk-firebase-firebase-adminsdk-fbsvc-b94c73f5ba.json');

console.log(`Looking for service account key at: ${serviceAccountPath}`);

try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (error) {
    console.error('Error: Could not load service-account-key.json.');
    console.error('Please download your service account key from Firebase Console -> Project Settings -> Service accounts.');
    console.error('Save it as "service-account-key.json" in the "careervivid" directory.');
    process.exit(1);
}

const email = 'evan@jastalk.com';

async function setAdmin() {
    try {
        console.log(`Fetching user: ${email}...`);
        const user = await admin.auth().getUserByEmail(email);
        console.log(`Found user ${user.uid}. Setting custom claims...`);

        await admin.auth().setCustomUserClaims(user.uid, { admin: true });

        console.log('Updating Firestore document...');
        await admin.firestore().collection('users').doc(user.uid).set({ isAdmin: true }, { merge: true });

        console.log('Success');
        process.exit(0);
    } catch (error) {
        console.error('Error setting admin:', error);
        process.exit(1);
    }
}

setAdmin();
