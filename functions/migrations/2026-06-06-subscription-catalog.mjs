import admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const commit = process.env.COMMIT === "true";

const catalogVersion = "2026-06-06";
const catalog = {
  version: catalogVersion,
  currency: "usd",
  plans: {
    pro: {
      monthlyPriceCents: 1200,
      annualPriceCents: 12000,
      annualMonthlyEquivalentCents: 1000,
      creditsPerBillingCycle: 1000,
      stripePriceEnv: {
        monthly: "STRIPE_PRICE_PRO_MONTHLY",
        annual: "STRIPE_PRICE_PRO_ANNUAL",
      },
    },
    max: {
      monthlyPriceCents: 3500,
      annualPriceCents: 37200,
      annualMonthlyEquivalentCents: 3100,
      creditsPerBillingCycle: 4500,
      stripePriceEnv: {
        monthly: "STRIPE_PRICE_MAX_MONTHLY",
        annual: "STRIPE_PRICE_MAX_ANNUAL",
      },
    },
    enterprise: {
      seatMonthlyPriceCents: 1200,
      creditsPerSeatPerBillingCycle: 1500,
      pricingModel: "contract_or_seat_based",
      stripePriceEnv: {
        monthly: "STRIPE_PRICE_ENTERPRISE_MONTHLY",
      },
    },
  },
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

function limitForUser(data) {
  const plan = data.plan || "free";
  if (plan === "enterprise") return Math.max(1, Number(data.seats || 1)) * 1500;
  if (plan === "max" || plan === "pro_max") return 4500;
  if (plan === "pro" || plan === "premium" || plan === "pro_monthly") return 1000;
  if (plan === "pro_sprint") return 300;
  return 100;
}

async function setIfCommit(ref, data, options) {
  if (commit) {
    await ref.set(data, options);
  }
}

async function run() {
  console.log(`${commit ? "COMMIT" : "DRY RUN"} subscription catalog migration ${catalogVersion}`);

  await setIfCommit(db.collection("subscriptionCatalog").doc(catalogVersion), catalog, { merge: true });
  await setIfCommit(db.collection("systemSettings").doc("subscriptionCatalog"), catalog, { merge: true });

  const paidPlans = ["pro", "premium", "pro_monthly", "max", "pro_max", "enterprise"];
  let scanned = 0;
  let updated = 0;
  let batch = db.batch();
  let batchSize = 0;

  for (const plan of paidPlans) {
    const snapshot = await db.collection("users").where("plan", "==", plan).get();
    for (const doc of snapshot.docs) {
      scanned += 1;
      const data = doc.data();
      const monthlyLimit = limitForUser(data);
      const nextData = {
        "aiUsage.monthlyLimit": monthlyLimit,
        subscriptionCatalogVersion: catalogVersion,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (plan !== "enterprise" && !data.billingInterval) {
        nextData.billingInterval = "month";
      }

      if (commit) {
        batch.set(doc.ref, nextData, { merge: true });
        batchSize += 1;
        if (batchSize >= 450) {
          await batch.commit();
          batch = db.batch();
          batchSize = 0;
        }
      }
      updated += 1;
    }
  }

  if (commit && batchSize > 0) {
    await batch.commit();
  }

  console.log(`Catalog documents: ${commit ? "written" : "would write"}`);
  console.log(`Users scanned: ${scanned}`);
  console.log(`Users normalized: ${updated}`);
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
