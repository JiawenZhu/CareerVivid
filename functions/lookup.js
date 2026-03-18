// temp_lookup.js
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
    // Requires application default credentials
    admin.initializeApp({
        projectId: "jastalk-firebase"
    });
}

const db = admin.firestore();
const apiKey = process.env.CAREERVIVID_API_KEY || "YOUR_API_KEY_HERE";

async function run() {
    try {
        console.log("Looking up api key...");
        const snap = await db.collectionGroup("private").where("key", "==", apiKey).get();
        if (snap.empty) {
            console.log("NOT FOUND across all private collections.");
        } else {
            snap.forEach(doc => {
                console.log("FOUND:", doc.ref.path);
            });
        }
    } catch (err) {
        console.error("ERROR running query:", err.message);
    }
}

run();
