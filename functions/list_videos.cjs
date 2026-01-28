const admin = require('firebase-admin');
const serviceAccount = require('../jastalk-firebase-firebase-adminsdk-fbsvc-b94c73f5ba.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'jastalk-firebase.firebasestorage.app'
});

const bucket = admin.storage().bucket();

async function listFiles() {
    try {
        const [files] = await bucket.getFiles({ prefix: 'public/ticktok_video_assets/' });
        console.log('Files in ticktok folder:', files.length);

        for (const file of files) {
            if (file.name.includes('638207DC')) {
                // Get signed URL
                const [url] = await file.getSignedUrl({
                    action: 'read',
                    expires: '03-01-2500'
                });

                console.log(`\nFile: ${file.name}`);
                console.log(`URL: ${url}`);
            }
        }
    }
    catch (error) {
        console.error('Error listing files:', error);
    }
}

listFiles();
