const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

async function check() {
  const apiKey = process.env.CAREERVIVID_API_KEY || "YOUR_API_KEY_HERE";
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
