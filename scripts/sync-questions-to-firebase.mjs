/**
 * Push ALL interview questions to Firebase (Firestore).
 *
 * This is the deploy-time sync: it is wired as a Firebase Hosting `predeploy`
 * hook (see firebase.json), so `firebase deploy --only hosting` updates every
 * company's questions in Firestore before the site is uploaded. The questions
 * are intentionally NOT bundled into the public site — the app reads them from
 * Firestore at runtime — so this step is what makes them available to website
 * users after a deploy.
 *
 * Behaviour:
 *   - Requires firebase-service-account.json in the repo root (gitignored).
 *     If it is absent, this SKIPS with a clear warning and exits 0, so a build
 *     or deploy never fails just because credentials aren't present on the
 *     machine (e.g. CI without secrets).
 *   - Otherwise runs a full, idempotent sync of all guides (--replace, so old
 *     questions are cleared first — no duplicates) plus the category banks.
 *
 * Usage:  node scripts/sync-questions-to-firebase.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SERVICE_ACCOUNT = path.join(ROOT, 'firebase-service-account.json');
const SEED = path.join(__dirname, 'seed-interview-guides.mjs');

const dryRun = process.argv.includes('--dry-run');

if (!fs.existsSync(SERVICE_ACCOUNT)) {
  console.warn(
    '\n⚠️  firebase-service-account.json not found — skipping question sync to Firestore.\n' +
    '    (Add the service account key to push questions. Deploy will continue.)\n'
  );
  process.exit(0);
}

const args = [SEED, '--replace', '--banks'];
if (dryRun) args.push('--dry-run');

console.log('\n🔄  Syncing all interview questions → Firestore (interviewGuides + questCategoryBanks)…\n');
const res = spawnSync('node', args, { stdio: 'inherit', cwd: ROOT });

if (res.status !== 0) {
  console.error('\n❌  Question sync failed. Aborting so questions and site do not drift out of sync.');
  process.exit(res.status ?? 1);
}
console.log('\n✅  Questions synced to Firestore.');
