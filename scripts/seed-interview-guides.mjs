/**
 * Seeds / syncs interview guide data from data/interview-guides/ into Firestore.
 * Questions are maintained privately in Firebase (not the public repo), so the
 * twice-weekly research task uses this to push refined questions.
 *
 * Firestore schema:
 *   interviewGuides/{slug}                       — company guide document
 *   interviewGuides/{slug}/questions/{auto-id}   — individual questions subcollection
 *   questCategoryBanks/{category}                — shared screening/values/final banks
 *
 * Usage:
 *   node scripts/seed-interview-guides.mjs [--company slug] [--replace] [--banks] [--dry-run]
 *
 * Flags:
 *   --company <slug>  Sync only one guide (default: all).
 *   --replace         Delete a guide's existing questions subcollection before
 *                     writing, so re-runs are idempotent (no duplicate questions).
 *                     Recommended for the recurring updater.
 *   --banks           Also upsert the category question banks from
 *                     data/quest-category-banks.json into questCategoryBanks/{category}.
 *   --dry-run         Print what would happen; write nothing.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMobileQuestionBuckets } from './mobile-interview-question-catalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data', 'interview-guides');
const BANKS_PATH = path.join(__dirname, '..', 'data', 'quest-category-banks.json');
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'firebase-service-account.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const REPLACE = args.includes('--replace');
const SYNC_BANKS = args.includes('--banks');
const SKIP_GUIDES = args.includes('--skip-guides'); // sync only category banks
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

// Category banks, loaded once — used to materialize the tailored
// screening / values / final questions into each company's questions so a
// company is self-contained across all six rounds in Firestore.
let _banks = null;
function loadBanks() {
  if (_banks) return _banks;
  _banks = fs.existsSync(BANKS_PATH)
    ? JSON.parse(fs.readFileSync(BANKS_PATH, 'utf-8'))
    : { companyCategory: {}, questionBanks: {} };
  return _banks;
}

/**
 * Category-bank questions for a stage across all difficulty tiers, with
 * {company} substituted. Returns [{ text, tier }].
 */
function categoryStageTiers(guide, stage) {
  const b = loadBanks();
  const cat = b.companyCategory?.[guide.slug];
  if (!cat) return [];
  const tiers = b.questionBanks?.[cat]?.[stage] ?? {};
  const out = [];
  for (const tier of ['easy', 'medium', 'hard']) {
    for (const q of tiers[tier] ?? []) {
      out.push({ text: String(q).replace(/\{company\}/g, guide.company), tier });
    }
  }
  return out;
}

/**
 * Maps a guide into Firestore question docs. Includes the guide's own
 * per-company questions (coding / system_design / behavioral / values / other)
 * PLUS the category-tailored screening / values / final questions, so every
 * company has a complete set for all six quest rounds.
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
  const seen = new Set();
  const push = (text, type, origin, tier = null) => {
    const t = String(text ?? '').trim();
    if (!t) return;
    const key = `${type}::${t}`;
    if (seen.has(key)) return;
    seen.add(key);
    questions.push({
      text: t,
      type,
      origin, // 'guide' (company-specific) or 'category' (tailored bank)
      tier, // 'easy' | 'medium' | 'hard' | null (screening/values/final only)
      company: guide.company,
      slug: guide.slug,
      companyDifficulty: guide.difficulty ?? null, // 1-10 company rating
      difficulty: guide.difficulty ?? null,
      source: guide.url,
      createdAt: DRY_RUN ? new Date().toISOString() : FieldValue.serverTimestamp(),
    });
  };

  // Per-company scraped/curated questions from the guide.
  for (const [type, qs] of Object.entries(guide.sampleQuestions ?? {})) {
    for (const text of qs ?? []) push(text, typeMap[type] ?? 'other', 'guide');
  }

  // Category-tailored, difficulty-tiered rounds layered on per company.
  for (const { text, tier } of categoryStageTiers(guide, 'screening')) push(text, 'screening', 'category', tier);
  for (const { text, tier } of categoryStageTiers(guide, 'behavioral')) push(text, 'behavioral', 'category', tier);
  for (const { text, tier } of categoryStageTiers(guide, 'values')) push(text, 'values', 'category', tier);
  for (const { text, tier } of categoryStageTiers(guide, 'final')) push(text, 'final', 'category', tier);

  return questions;
}

function mobileQuestionBuckets(guide) {
  return getMobileQuestionBuckets(guide, loadBanks());
}

/** Delete every doc in a guide's questions subcollection (idempotent re-sync). */
async function clearQuestions(guideRef) {
  const snap = await guideRef.collection('questions').get();
  if (snap.empty) return 0;
  const docs = snap.docs;
  const BATCH_SIZE = 400;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const d of docs.slice(i, i + BATCH_SIZE)) batch.delete(d.ref);
    await batch.commit();
  }
  return docs.length;
}

async function seedGuide(guide) {
  const guideDoc = {
    ...toGuideDoc(guide),
    // This ordered copy is used by the authenticated native question API.
    // It is updated in the same sync that publishes the web guide data.
    mobileQuestionBuckets: mobileQuestionBuckets(guide),
  };
  const questionDocs = toQuestionDocs(guide);

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would write interviewGuides/${guide.slug}`);
    console.log(`    stages: ${guideDoc.interviewStages.length}`);
    console.log(`    questions: ${questionDocs.length}${REPLACE ? ' (would replace existing first)' : ''}`);
    console.log(`    sample:`, questionDocs[0] ?? '(none)');
    return;
  }

  // Upsert the guide document
  const guideRef = db.collection('interviewGuides').doc(guide.slug);
  await guideRef.set(guideDoc, { merge: true });

  // In --replace mode, clear old questions first so refined content overwrites
  // cleanly instead of accumulating duplicates across runs.
  let removed = 0;
  if (REPLACE) removed = await clearQuestions(guideRef);

  // Write questions as a subcollection in batches
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

  console.log(`  ✓  Seeded ${guide.company}: ${questionDocs.length} questions${REPLACE ? ` (removed ${removed})` : ''}`);
}

/** Upsert the shared category question banks into questCategoryBanks/{category}. */
async function seedCategoryBanks() {
  if (!fs.existsSync(BANKS_PATH)) {
    console.log('  (no quest-category-banks.json — skipping banks)');
    return;
  }
  const banks = JSON.parse(fs.readFileSync(BANKS_PATH, 'utf-8'));
  const questionBanks = banks.questionBanks ?? {};
  const systemDesignOrder = banks.systemDesignOrder ?? {};
  const companyCategory = banks.companyCategory ?? {};

  // group companies by category for a convenient members list
  const members = {};
  for (const [slug, cat] of Object.entries(companyCategory)) {
    (members[cat] ??= []).push(slug);
  }

  const tierCount = (stage) => ['easy', 'medium', 'hard']
    .reduce((n, t) => n + ((stage?.[t] ?? []).length), 0);

  const categories = Object.keys(questionBanks);
  console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}Syncing ${categories.length} category banks → questCategoryBanks\n`);
  for (const cat of categories) {
    const bank = questionBanks[cat] ?? {};
    // Stored tiered: { screening: {easy,medium,hard}, values: {...}, final: {...} }
    const doc = {
      category: cat,
      screening: bank.screening ?? {},
      behavioral: bank.behavioral ?? {},
      values: bank.values ?? {},
      final: bank.final ?? {},
      systemDesignOrder: systemDesignOrder[cat] ?? [],
      companySlugs: (members[cat] ?? []).sort(),
      updatedAt: DRY_RUN ? new Date().toISOString() : FieldValue.serverTimestamp(),
    };
    if (DRY_RUN) {
      console.log(`  [DRY RUN] questCategoryBanks/${cat}: screening ${tierCount(bank.screening)}, behavioral ${tierCount(bank.behavioral)}, values ${tierCount(bank.values)}, final ${tierCount(bank.final)}, companies ${doc.companySlugs.length}`);
      continue;
    }
    await db.collection('questCategoryBanks').doc(cat).set(doc, { merge: true });
    console.log(`  ✓  ${cat}: ${doc.companySlugs.length} companies`);
  }
}

async function main() {
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'));

  const toSeed = singleSlug
    ? files.filter(f => f === `${singleSlug}.json`)
    : files;

  if (!SKIP_GUIDES) {
    console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}Seeding ${toSeed.length} guides → Firestore${REPLACE ? ' (replace mode)' : ''}\n`);
    for (const file of toSeed) {
      const guide = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
      await seedGuide(guide);
    }
  }

  if (SYNC_BANKS || SKIP_GUIDES) await seedCategoryBanks();

  console.log('\n✅ Sync complete');
}

main().catch((e) => { console.error(e); process.exit(1); });
