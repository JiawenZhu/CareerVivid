/**
 * Seeds course definitions from data/courses/*.json into Firestore.
 *
 * Firestore schema:
 *   courses/{courseId} — one document per course, exactly the CourseDefinition
 *   shape from src/types/course.ts (schemaVersion, order, status, chapters...).
 *
 * The app currently reads courses from the bundled JSON, so seeding is
 * optional — run it when/if courses should be served or edited via Firestore.
 *
 * Usage: node scripts/seed-courses.mjs [--course id] [--dry-run]
 * Auth:  firebase-service-account.json at repo root (same as other seed scripts).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data', 'courses');
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'firebase-service-account.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const singleCourse = args.find((a, i) => args[i - 1] === '--course');

let db;
if (!DRY_RUN) {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));
  initializeApp({ credential: cert(serviceAccount) });
  db = getFirestore();
}

const files = fs
  .readdirSync(DATA_DIR)
  .filter((f) => f.endsWith('.json'))
  .sort();

let seeded = 0;
for (const file of files) {
  const course = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
  if (singleCourse && course.id !== singleCourse) continue;

  if (!course.id || typeof course.order !== 'number' || !Array.isArray(course.chapters)) {
    console.error(`Skipping ${file}: missing id/order/chapters`);
    continue;
  }

  const exerciseCount = course.chapters.reduce((n, ch) => n + ch.exercises.length, 0);
  console.log(`${DRY_RUN ? '[dry-run] ' : ''}courses/${course.id} — "${course.title}" (${exerciseCount} exercises, ${course.status})`);

  if (!DRY_RUN) {
    await db.doc(`courses/${course.id}`).set(
      { ...course, seededAt: FieldValue.serverTimestamp() },
      { merge: false },
    );
  }
  seeded += 1;
}

console.log(`${DRY_RUN ? 'Would seed' : 'Seeded'} ${seeded} course(s).`);
