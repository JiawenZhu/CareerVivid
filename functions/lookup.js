// temp_lookup.js
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
    // Requires application default credentials
    admin.initializeApp({
        projectId: "jastalk-firebase"
    });
}

const db = admin.firestore();
const apiKey = "cv_live_748476f9c003f9c4877c54df20470116b69b0e37ee1308873bd261ad99d9a061";

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
