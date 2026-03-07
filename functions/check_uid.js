const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

async function check() {
  const apiKey = "cv_live_cb6cc3bda448f5864554537218b5734e023df3c47da1b73c0e396caa1dfc0bf4";
  const snap = await db.collection("api_keys").where("key", "==", apiKey).get();
  if (snap.empty) {
    console.log("API Key not found!");
  } else {
    for (const doc of snap.docs) {
      console.log("API Key doc:", doc.id, "=>", doc.data());

      const uid = doc.data().userId;
      console.log("Looking up portfolios for UID:", uid);
      const portSnap = await db.collection("users").doc(uid).collection("portfolios").get();
      console.log("Found", portSnap.size, "portfolios.");
      portSnap.forEach(p => console.log(p.id, p.data().title));
    }
  }
}

check().catch(console.error).finally(() => process.exit(0));
