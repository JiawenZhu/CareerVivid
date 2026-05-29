import * as functions from "firebase-functions/v1";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { queueTransactionalEmail } from "./transactionalEmails";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const REGION = "us-west1";
const RETENTION_DAYS = 30;
const PURGE_BATCH_LIMIT = 50;

const TOP_LEVEL_USER_DATA_COLLECTIONS: Array<{ collection: string; field: string }> = [
  { collection: "jobApplications", field: "userId" },
  { collection: "usage_logs", field: "userId" },
  { collection: "email_preference_notification_queue", field: "userId" },
  { collection: "communityPosts", field: "userId" },
  { collection: "communityComments", field: "userId" },
  { collection: "contact_messages", field: "userId" },
  { collection: "feedback", field: "userId" },
];

const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};

async function deleteQueryInBatches(query: admin.firestore.Query, batchSize = 250): Promise<number> {
  let deleted = 0;

  while (true) {
    const snapshot = await query.limit(batchSize).get();
    if (snapshot.empty) return deleted;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;

    if (snapshot.size < batchSize) return deleted;
  }
}

async function deleteCollectionRecursive(collectionRef: admin.firestore.CollectionReference): Promise<number> {
  let deleted = 0;

  while (true) {
    const snapshot = await collectionRef.limit(250).get();
    if (snapshot.empty) return deleted;

    for (const doc of snapshot.docs) {
      const childCollections = await doc.ref.listCollections();
      for (const childCollection of childCollections) {
        deleted += await deleteCollectionRecursive(childCollection);
      }
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;

    if (snapshot.size < 250) return deleted;
  }
}

async function deleteUserWorkspaceData(userId: string): Promise<{ nestedDeleted: number; topLevelDeleted: number }> {
  const userRef = db.collection("users").doc(userId);
  const nestedCollections = await userRef.listCollections();
  let nestedDeleted = 0;
  let topLevelDeleted = 0;

  for (const collectionRef of nestedCollections) {
    nestedDeleted += await deleteCollectionRecursive(collectionRef);
  }

  for (const target of TOP_LEVEL_USER_DATA_COLLECTIONS) {
    topLevelDeleted += await deleteQueryInBatches(
      db.collection(target.collection).where(target.field, "==", userId)
    );
  }

  await userRef.delete();
  return { nestedDeleted, topLevelDeleted };
}

export const requestAccountDeletion = functions
  .region(REGION)
  .https
  .onCall(async (_data, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in before requesting account deletion.");
    }

    const userId = context.auth.uid;
    const user = await admin.auth().getUser(userId);
    const email = user.email;
    if (!email) {
      throw new functions.https.HttpsError("failed-precondition", "Current user is missing an email address.");
    }

    const requestedAt = new Date();
    const deletionTargetDate = addDays(requestedAt, RETENTION_DAYS);
    const deletionTimestamp = admin.firestore.Timestamp.fromDate(deletionTargetDate);
    const userRef = db.collection("users").doc(userId);

    await db.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) {
        throw new functions.https.HttpsError("not-found", "User profile does not exist.");
      }

      transaction.set(userRef, {
        status: "soft_deleted",
        deletionRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletionTargetDate: deletionTimestamp,
        deletionRetentionDays: RETENTION_DAYS,
        deletionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });

    await admin.auth().updateUser(userId, { disabled: true });

    await queueTransactionalEmail({
      type: "account_deletion_initialization",
      to: email,
      userName: user.displayName || email.split("@")[0] || "there",
      deletionTargetDate,
      metadata: { uid: userId },
    });

    return {
      status: "soft_deleted",
      deletionTargetDate: deletionTimestamp.toDate().toISOString(),
    };
  });

export const purgeSoftDeletedUsers = onSchedule({
  schedule: "every 24 hours",
  timeZone: "America/Chicago",
  timeoutSeconds: 540,
  memory: "1GiB",
  region: REGION,
}, async () => {
  const now = admin.firestore.Timestamp.now();
  const usersSnap = await db
    .collection("users")
    .where("status", "==", "soft_deleted")
    .limit(PURGE_BATCH_LIMIT)
    .get();

  let purged = 0;
  let skipped = 0;
  let errored = 0;

  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    const target = userData.deletionTargetDate as admin.firestore.Timestamp | undefined;

    if (!target || target.toMillis() > now.toMillis()) {
      skipped += 1;
      continue;
    }

    const claimed = await db.runTransaction(async (transaction) => {
      const fresh = await transaction.get(userDoc.ref);
      const freshData = fresh.data();
      const freshTarget = freshData?.deletionTargetDate as admin.firestore.Timestamp | undefined;

      if (!fresh.exists || freshData?.status !== "soft_deleted") return false;
      if (!freshTarget || freshTarget.toMillis() > Date.now()) return false;

      transaction.set(userDoc.ref, {
        status: "purging",
        deletionPurgeStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      return true;
    });

    if (!claimed) {
      skipped += 1;
      continue;
    }

    try {
      const deletionStats = await deleteUserWorkspaceData(userDoc.id);

      try {
        await admin.auth().deleteUser(userDoc.id);
      } catch (error: any) {
        if (error?.code !== "auth/user-not-found") throw error;
      }

      purged += 1;
      console.log(`[AccountDeletion] Purged ${userDoc.id}.`, deletionStats);
    } catch (error: any) {
      errored += 1;
      await userDoc.ref.set({
        status: "soft_delete_error",
        deletionError: error?.message || "Unknown purge failure",
        deletionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      console.error(`[AccountDeletion] Failed to purge ${userDoc.id}:`, error);
    }
  }

  console.log(`[AccountDeletion] purged=${purged}, skipped=${skipped}, errored=${errored}.`);
});
