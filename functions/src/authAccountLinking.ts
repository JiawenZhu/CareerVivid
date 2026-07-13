import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const REGION = "us-west1";

const USER_SUBCOLLECTIONS_TO_MERGE = [
  "resumes",
  "practiceHistory",
  "portfolios",
  "jobTracker",
  "coverLetters",
  "integrations",
  "temporaryScrapes",
];

const ROOT_OWNER_COLLECTIONS_TO_TRANSFER = [
  { collection: "whiteboards", ownerField: "userId" },
  { collection: "community_posts", ownerField: "authorId" },
  { collection: "public_resumes", ownerField: "userId" },
  { collection: "public_portfolios", ownerField: "userId" },
  { collection: "user_themes", ownerField: "userId" },
];

const PAID_PLAN_ALIASES = new Set([
  "pro",
  "premium",
  "pro_monthly",
  "pro_sprint",
  "max",
  "pro_max",
  "enterprise",
]);

type UserDocCandidate = {
  uid: string;
  data: FirebaseFirestore.DocumentData;
  authUser: admin.auth.UserRecord | null;
};

const normalizeEmail = (email?: string | null) => email?.trim().toLowerCase() || "";

const getAuthUserOrNull = async (uid: string) => {
  try {
    return await admin.auth().getUser(uid);
  } catch (error: any) {
    if (error?.code === "auth/user-not-found") return null;
    throw error;
  }
};

const hasProvider = (user: admin.auth.UserRecord | null, providerId: string) => {
  return user?.providerData.some((provider) => provider.providerId === providerId) === true;
};

const isPaidPlan = (plan: unknown): plan is string => {
  return typeof plan === "string" && PAID_PLAN_ALIASES.has(plan);
};

const timestampToMillis = (value: unknown): number => {
  if (!value) return Number.MAX_SAFE_INTEGER;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  const maybeTimestamp = value as { toMillis?: () => number };
  return typeof maybeTimestamp.toMillis === "function" ? maybeTimestamp.toMillis() : Number.MAX_SAFE_INTEGER;
};

const getCanonicalGoogleTarget = (currentUid: string, candidates: UserDocCandidate[]) => {
  const passwordCandidates = candidates
    .filter((candidate) => candidate.uid !== currentUid)
    .filter((candidate) => candidate.authUser && !candidate.authUser.disabled)
    .filter((candidate) => hasProvider(candidate.authUser, "password") || candidate.data.authProvider === "password")
    .sort((a, b) => timestampToMillis(a.data.createdAt) - timestampToMillis(b.data.createdAt));

  return passwordCandidates[0]?.uid || currentUid;
};

const buildDestinationProfileUpdate = (
  destinationUid: string,
  email: string,
  currentAuthUser: admin.auth.UserRecord,
  destinationData: FirebaseFirestore.DocumentData,
  sourceCandidates: UserDocCandidate[]
) => {
  const update: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
    uid: destinationUid,
    email,
    emailVerified: true,
    status: destinationData.status || "active",
    workspaceMergedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const linkedAccountUids = sourceCandidates.map((candidate) => candidate.uid);
  if (linkedAccountUids.length > 0) {
    update.linkedAccountUids = admin.firestore.FieldValue.arrayUnion(...linkedAccountUids);
  }

  const signInProviders = Array.from(new Set([
    ...currentAuthUser.providerData.map((provider) => provider.providerId),
    ...sourceCandidates.flatMap((candidate) =>
      candidate.authUser?.providerData.map((provider) => provider.providerId) || []
    ),
  ])).filter(Boolean);
  if (signInProviders.length > 0) {
    update.signInProviders = admin.firestore.FieldValue.arrayUnion(...signInProviders);
  }

  if (!destinationData.displayName && currentAuthUser.displayName) {
    update.displayName = currentAuthUser.displayName;
  }

  if (!destinationData.photoURL && currentAuthUser.photoURL) {
    update.photoURL = currentAuthUser.photoURL;
  }

  const destinationHasPaidPlan = isPaidPlan(destinationData.plan);
  const paidSource = sourceCandidates.find((candidate) => isPaidPlan(candidate.data.plan));
  if (!destinationHasPaidPlan && paidSource) {
    [
      "plan",
      "resumeLimit",
      "expiresAt",
      "stripeCustomerId",
      "stripeSubscriptionId",
      "stripeSubscriptionStatus",
      "subscriptionStatus",
      "billingStatus",
      "cancelAtPeriodEnd",
      "currentPeriodStart",
      "currentPeriodEnd",
      "priceId",
      "role",
      "roles",
      "seats",
    ].forEach((field) => {
      if (paidSource.data[field] !== undefined) {
        update[field] = paidSource.data[field];
      }
    });
  }

  const downloadCreditsToMove = sourceCandidates.reduce((sum, candidate) => {
    const value = candidate.data.downloadCredits;
    return sum + (typeof value === "number" && value > 0 ? value : 0);
  }, 0);
  if (downloadCreditsToMove > 0) {
    update.downloadCredits = admin.firestore.FieldValue.increment(downloadCreditsToMove);
  }

  return update;
};

const copyUserSubcollections = async (sourceUid: string, destinationUid: string) => {
  let copied = 0;

  for (const collectionName of USER_SUBCOLLECTIONS_TO_MERGE) {
    const sourceCollection = db.collection("users").doc(sourceUid).collection(collectionName);
    const snapshot = await sourceCollection.get();
    if (snapshot.empty) continue;

    let batch = db.batch();
    let operationCount = 0;

    for (const sourceDoc of snapshot.docs) {
      const destinationDoc = db.collection("users").doc(destinationUid).collection(collectionName).doc(sourceDoc.id);
      const destinationSnap = await destinationDoc.get();
      const data: FirebaseFirestore.DocumentData = {
        ...sourceDoc.data(),
        migratedFromUid: sourceUid,
        migratedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (data.userId === sourceUid) data.userId = destinationUid;
      if (data.ownerId === sourceUid) data.ownerId = destinationUid;
      if (data.authorId === sourceUid) data.authorId = destinationUid;

      if (destinationSnap.exists) {
        const duplicateDoc = db.collection("users").doc(destinationUid).collection(collectionName).doc();
        batch.set(duplicateDoc, {
          ...data,
          originalId: sourceDoc.id,
        });
      } else {
        batch.set(destinationDoc, data, { merge: true });
      }

      copied += 1;
      operationCount += 1;

      if (operationCount >= 400) {
        await batch.commit();
        batch = db.batch();
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }
  }

  return copied;
};

const transferRootOwnerDocuments = async (sourceUid: string, destinationUid: string) => {
  let transferred = 0;

  for (const rootCollection of ROOT_OWNER_COLLECTIONS_TO_TRANSFER) {
    const snapshot = await db
      .collection(rootCollection.collection)
      .where(rootCollection.ownerField, "==", sourceUid)
      .get();

    if (snapshot.empty) continue;

    let batch = db.batch();
    let operationCount = 0;

    for (const sourceDoc of snapshot.docs) {
      batch.set(sourceDoc.ref, {
        [rootCollection.ownerField]: destinationUid,
        migratedFromUid: sourceUid,
        migratedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      transferred += 1;
      operationCount += 1;

      if (operationCount >= 400) {
        await batch.commit();
        batch = db.batch();
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }
  }

  return transferred;
};

const markSourceUserDocMerged = async (sourceUid: string, destinationUid: string) => {
  await db.collection("users").doc(sourceUid).set({
    status: "merged",
    mergedInto: destinationUid,
    mergedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
};

export const resolveSignedInWorkspace = functions
  .region(REGION)
  .https
  .onCall(async (_data, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in before resolving your workspace.");
    }

    const currentAuthUser = await admin.auth().getUser(context.auth.uid);
    const email = normalizeEmail(currentAuthUser.email);
    if (!email) {
      throw new functions.https.HttpsError("failed-precondition", "Current account is missing an email address.");
    }

    const isVerifiedGoogleAccount = currentAuthUser.providerData.some(
      (provider) => provider.providerId === "google.com"
    ) && currentAuthUser.emailVerified;
    if (!currentAuthUser.emailVerified && !isVerifiedGoogleAccount) {
      return {
        canonicalUid: context.auth.uid,
        switched: false,
        mergedSourceUids: [],
        copiedSubcollectionDocs: 0,
        transferredRootDocs: 0,
        skipped: "email_not_verified",
      };
    }

    const usersSnapshot = await db.collection("users").where("email", "==", email).get();
    const candidates = await Promise.all(usersSnapshot.docs.map(async (docSnap) => {
      const authUser = await getAuthUserOrNull(docSnap.id);
      return {
        uid: docSnap.id,
        data: docSnap.data(),
        authUser,
      } satisfies UserDocCandidate;
    }));

    let canonicalUid = context.auth.uid;
    if (isVerifiedGoogleAccount) {
      canonicalUid = getCanonicalGoogleTarget(context.auth.uid, candidates);
    }

    const destinationAuthUser = await getAuthUserOrNull(canonicalUid);
    if (!destinationAuthUser || destinationAuthUser.disabled) {
      canonicalUid = context.auth.uid;
    }

    const destinationRef = db.collection("users").doc(canonicalUid);
    const destinationSnap = await destinationRef.get();
    const destinationData = destinationSnap.exists ? destinationSnap.data() || {} : {};

    const sourceCandidates = candidates.filter((candidate) => (
      candidate.uid !== canonicalUid &&
      candidate.data.mergedInto !== canonicalUid
    ));

    if (sourceCandidates.length > 0 || !destinationSnap.exists) {
      await destinationRef.set(
        buildDestinationProfileUpdate(canonicalUid, email, currentAuthUser, destinationData, sourceCandidates),
        { merge: true }
      );
    }

    if (canonicalUid !== context.auth.uid && currentAuthUser.emailVerified) {
      const canonicalAuthUser = await admin.auth().getUser(canonicalUid);
      if (normalizeEmail(canonicalAuthUser.email) === email && !canonicalAuthUser.emailVerified) {
        await admin.auth().updateUser(canonicalUid, { emailVerified: true });
      }
    }

    let copiedSubcollectionDocs = 0;
    let transferredRootDocs = 0;

    for (const sourceCandidate of sourceCandidates) {
      copiedSubcollectionDocs += await copyUserSubcollections(sourceCandidate.uid, canonicalUid);
      transferredRootDocs += await transferRootOwnerDocuments(sourceCandidate.uid, canonicalUid);
      await markSourceUserDocMerged(sourceCandidate.uid, canonicalUid);
    }

    const customToken = canonicalUid !== context.auth.uid
      ? await admin.auth().createCustomToken(canonicalUid, {
        resolvedFromUid: context.auth.uid,
        resolvedProvider: "google.com",
      })
      : undefined;

    functions.logger.info("Resolved signed-in workspace.", {
      uid: context.auth.uid,
      canonicalUid,
      switched: canonicalUid !== context.auth.uid,
      mergedSourceUids: sourceCandidates.map((candidate) => candidate.uid),
      copiedSubcollectionDocs,
      transferredRootDocs,
    });

    return {
      canonicalUid,
      switched: canonicalUid !== context.auth.uid,
      customToken,
      mergedSourceUids: sourceCandidates.map((candidate) => candidate.uid),
      copiedSubcollectionDocs,
      transferredRootDocs,
    };
  });
