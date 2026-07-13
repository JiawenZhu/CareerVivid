/**
 * Seeds scraped interview guide data from data/interview-guides/ into Firestore.
 *
 * Firestore schema:
 *   interviewGuides/{slug}          — company guide document
 *   interviewGuides/{slug}/questions/{auto-id}  — individual questions subcollection
 *
 * Usage: node scripts/seed-interview-guides.mjs [--company slug] [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data', 'interview-guides');
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'firebase-service-account.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const singleSlug = args.find((a, i) => args[i - 1] === '--company');

// Initialize Firebase Admin
let db;
if (!DRY_RUN) {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));
  initializeApp({ credential: cert(serviceAccount) });
  db = getFirestore();
}

/**
 * Maps a scraped guide into the Firestore interviewGuides/{slug} document shape.
 */
function toGuideDoc(guide) {
  return {
    company: guide.company,
    slug: guide.slug,
    url: guide.url,
    scrapedAt: guide.scrapedAt,
    updatedAt: DRY_RUN ? new Date().toISOString() : FieldValue.serverTimestamp(),
    difficulty: guide.difficulty ?? null,
    interviewStages: guide.interviewStages ?? [],
    codingTopics: guide.codingTopics ?? [],
    systemDesignTopics: guide.systemDesignTopics ?? [],
    behavioralTopics: guide.behavioralTopics ?? [],
    tips: guide.tips ?? [],
    compensation: guide.compensation ?? null,
  };
}

/**
 * Maps individual questions to subcollection docs.
 * Each question gets: text, type, company, slug, source.
 */
function toQuestionDocs(guide) {
  const questions = [];
  const typeMap = {
    coding: 'coding',
    behavioral: 'behavioral',
    systemDesign: 'system_design',
    values: 'values',
    other: 'other',
  };

  for (const [type, qs] of Object.entries(guide.sampleQuestions ?? {})) {
    for (const text of qs) {
      if (!text?.trim()) continue;
      questions.push({
        text: text.trim(),
        type: typeMap[type] ?? 'other',
        company: guide.company,
        slug: guide.slug,
        difficulty: guide.difficulty ?? null,
        source: guide.url,
        createdAt: DRY_RUN ? new Date().toISOString() : FieldValue.serverTimestamp(),
      });
    }
  }

  return questions;
}

async function seedGuide(guide) {
  const guideDoc = toGuideDoc(guide);
  const questionDocs = toQuestionDocs(guide);

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would write interviewGuides/${guide.slug}`);
    console.log(`    stages: ${guideDoc.interviewStages.length}`);
    console.log(`    questions: ${questionDocs.length}`);
    console.log(`    sample:`, questionDocs[0] ?? '(none)');
    return;
  }

  // Upsert the guide document
  const guideRef = db.collection('interviewGuides').doc(guide.slug);
  await guideRef.set(guideDoc, { merge: true });

  // Write questions as a subcollection in batches of 500
  if (questionDocs.length > 0) {
    const BATCH_SIZE = 400;
    for (let i = 0; i < questionDocs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = questionDocs.slice(i, i + BATCH_SIZE);
      for (const q of chunk) {
        const qRef = guideRef.collection('questions').doc();
        batch.set(qRef, q);
      }
      await batch.commit();
    }
  }

  console.log(`  ✓  Seeded ${guide.company}: ${questionDocs.length} questions`);
}

async function main() {
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'));

  const toSeed = singleSlug
    ? files.filter(f => f === `${singleSlug}.json`)
    : files;

  console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}Seeding ${toSeed.length} guides → Firestore\n`);

  for (const file of toSeed) {
    const guide = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
    await seedGuide(guide);
  }

  console.log('\n✅ Seed complete');
}

main().catch(console.error);
