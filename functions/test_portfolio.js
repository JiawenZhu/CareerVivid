const admin = require("firebase-admin");
admin.initializeApp({
  projectId: "jastalk-firebase"
});
const db = admin.firestore();

async function run() {
  const doc = await db.doc("portfolio/JiawenEvanZhu/edit/hcvcJXT92g70vQ5Ipbez").get();
  console.log("EXISTS:", doc.exists);
  if (doc.exists) {
    const data = doc.data();
    console.log("KEYS:", Object.keys(data));
    console.log("userId:", data.userId);
    console.log("_createdBy:", data._createdBy);
  }
}
run().catch(console.error);
