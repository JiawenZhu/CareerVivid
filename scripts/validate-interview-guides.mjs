/**
 * Validates scraped interview guide data against the live website.
 *
 * For each company tested, fetches the live page and checks that key
 * data points in our JSON actually appear in the raw site content.
 *
 * Usage: node scripts/validate-interview-guides.mjs [--sample N]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data', 'interview-guides');
const BASE_URL = 'https://www.techinterview.org/companies';
const DELAY_MS = 1000;

const args = process.argv.slice(2);
const sampleSize = parseInt(args.find((a, i) => args[i-1] === '--sample') ?? '20');
const specificSlug = args.find((a, i) => args[i-1] === '--company');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const HTML_ENTITIES = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  mdash: '–',
  nbsp: ' ',
  ndash: '–',
  quot: '"',
};

const htmlToPlainText = (value) => {
  let text = value;
  for (let pass = 0; pass < 2 && /&(lt|gt|amp|quot|apos|nbsp|#\d+);/i.test(text); pass += 1) {
    text = text.replace(/&(?:(#x[0-9a-f]+)|(#\d+)|([a-z]+));/gi, (entity, hex, decimal, named) => {
      if (hex) return String.fromCodePoint(Number.parseInt(hex.slice(2), 16));
      if (decimal) return String.fromCodePoint(Number.parseInt(decimal.slice(1), 10));
      return HTML_ENTITIES[named?.toLowerCase()] ?? entity;
    });
  }

  return text
    .replace(/<script\b[^>]*>[\s\S]*?<\/\s*script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/\s*style\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[<>]/g, ' ');
};

async function fetchRawText(slug) {
  const r = await fetch(`${BASE_URL}/${slug}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  });
  if (!r.ok) return null;
  const html = await r.text();
  const m = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  return htmlToPlainText(m ? m[0] : html)
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Normalize text for comparison: lowercase, decode HTML entities,
 * collapse whitespace, strip punctuation except hyphens.
 */
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/&ndash;/g, '-').replace(/&mdash;/g, '-').replace(/&#8211;/g, '-')
    .replace(/&amp;/g, 'and').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/[""'']/g, "'")  // smart quotes → plain
    .replace(/[^a-z0-9' -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check that a piece of stored text appears (loosely) in the live page content.
 * Strategy: tries a 3-word sliding window; falls back to key-words check.
 */
function appearsInLive(stored, liveText) {
  const normStored = normalize(stored);
  const normLive = normalize(liveText);

  // Direct substring check first (most reliable)
  if (normLive.includes(normStored)) return true;

  // 3-word sliding window (keeps short words like numbers)
  const words = normStored.split(/\s+/).filter(w => w.length > 1);
  if (words.length >= 3) {
    for (let i = 0; i <= words.length - 3; i++) {
      const phrase = words.slice(i, i + 3).join(' ');
      if (normLive.includes(phrase)) return true;
    }
  }

  // 2-word check for short items (e.g. "OSI model", "Phone Screen")
  if (words.length >= 2) {
    const phrase2 = words.slice(0, 2).join(' ');
    if (normLive.includes(phrase2)) return true;
  }

  // Last resort: check first 8 significant chars
  const keyChars = normStored.replace(/\s/g, '').slice(0, 12);
  return normLive.replace(/\s/g, '').includes(keyChars);
}

async function validateCompany(guide) {
  const liveText = await fetchRawText(guide.slug);
  if (!liveText) return { slug: guide.slug, company: guide.company, error: 'HTTP error fetching live page' };

  const results = {
    slug: guide.slug,
    company: guide.company,
    checks: [],
    passed: 0,
    failed: 0,
  };

  const check = (label, value, present = true) => {
    if (!value) return;
    const found = appearsInLive(value, liveText);
    const pass = present ? found : !found;
    results.checks.push({ label, value: value.slice(0, 80), pass });
    if (pass) results.passed++;
    else results.failed++;
  };

  // Validate interview stages (first 3)
  guide.interviewStages.slice(0, 3).forEach((s, i) => check(`stage[${i}]`, s));

  // Validate coding topics (first 3)
  guide.codingTopics.slice(0, 3).forEach((t, i) => check(`codingTopic[${i}]`, t));

  // Validate system design topics (first 2)
  guide.systemDesignTopics.slice(0, 2).forEach((t, i) => check(`sysDesign[${i}]`, t));

  // Validate tips (first 3)
  guide.tips.slice(0, 3).forEach((t, i) => check(`tip[${i}]`, t));

  // Validate sample questions
  const allQs = Object.values(guide.sampleQuestions).flat();
  allQs.slice(0, 3).forEach((q, i) => check(`question[${i}]`, q));

  // Validate difficulty appears in page if set
  if (guide.difficulty) {
    const diffStr = `${guide.difficulty}/10`;
    const found = liveText.includes(diffStr.toLowerCase());
    results.checks.push({ label: 'difficulty', value: diffStr, pass: found });
    found ? results.passed++ : results.failed++;
  }

  return results;
}

async function main() {
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .map(f => f.replace('.json', ''));

  let toValidate = specificSlug ? [specificSlug] : files;

  // Sample randomly if not validating all
  if (!specificSlug && toValidate.length > sampleSize) {
    toValidate = toValidate
      .sort(() => Math.random() - 0.5)
      .slice(0, sampleSize);
  }

  console.log(`\nValidating ${toValidate.length} companies against live site...\n`);

  let totalPassed = 0;
  let totalFailed = 0;
  let totalErrors = 0;
  const failures = [];

  for (const slug of toValidate) {
    const filePath = path.join(DATA_DIR, `${slug}.json`);
    if (!fs.existsSync(filePath)) { console.log(`  ⚠ No file for ${slug}`); continue; }

    const guide = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const totalChecks = guide.interviewStages.length + guide.codingTopics.length +
      guide.tips.length + Object.values(guide.sampleQuestions).flat().length;

    if (totalChecks === 0) {
      console.log(`  ⏭  ${guide.company} — no data to validate (empty guide)`);
      continue;
    }

    process.stdout.write(`  Checking ${guide.company}...`);
    const result = await validateCompany(guide);
    await sleep(DELAY_MS);

    if (result.error) {
      console.log(` ✗ ERROR: ${result.error}`);
      totalErrors++;
      continue;
    }

    const pct = result.checks.length ? Math.round(result.passed / result.checks.length * 100) : 0;
    const icon = pct === 100 ? '✅' : pct >= 75 ? '⚠️ ' : '❌';
    console.log(` ${icon} ${result.passed}/${result.checks.length} (${pct}%)`);

    totalPassed += result.passed;
    totalFailed += result.failed;

    if (result.failed > 0) {
      failures.push({ company: guide.company, slug, checks: result.checks.filter(c => !c.pass) });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`RESULTS: ${totalPassed} checks passed, ${totalFailed} failed, ${totalErrors} errors`);
  const overallPct = totalPassed + totalFailed > 0
    ? Math.round(totalPassed / (totalPassed + totalFailed) * 100)
    : 0;
  console.log(`Accuracy: ${overallPct}%`);

  if (failures.length > 0) {
    console.log(`\nFailed checks:`);
    for (const f of failures) {
      console.log(`  ${f.company}:`);
      for (const c of f.checks) {
        console.log(`    ✗ ${c.label}: "${c.value}"`);
      }
    }
  }
}

main().catch(console.error);
