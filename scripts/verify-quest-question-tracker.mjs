/**
 * Read-only integrity check for the tracker backup.
 *
 * Verifies that its CSV mirror contains exactly the guide and category-bank
 * questions from which both the Web quest and mobile catalog are derived.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildMobileInterviewQuestionCatalog,
  WEB_QUEST_STAGE_QUESTION_LIMIT,
} from './mobile-interview-question-catalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const guideDirectory = path.join(root, 'data', 'interview-guides');
const banks = JSON.parse(fs.readFileSync(path.join(root, 'data', 'quest-category-banks.json'), 'utf8'));
const csvPath = path.join(root, 'data', 'quest-tracker', 'company-questions.csv');

function parseCsv(input) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const guides = fs.readdirSync(guideDirectory)
  .filter((filename) => filename.endsWith('.json') && !filename.startsWith('_'))
  .map((filename) => JSON.parse(fs.readFileSync(path.join(guideDirectory, filename), 'utf8')))
  .filter((guide) => guide.company && guide.slug)
  .sort((left, right) => left.company.localeCompare(right.company));

const tiers = ['easy', 'medium', 'hard'];
const questionRows = [];
for (const guide of guides) {
  const category = banks.companyCategory?.[guide.slug];
  if (!category) throw new Error(`Tracker source is missing a category for ${guide.slug}.`);
  const samples = guide.sampleQuestions ?? {};
  const add = (round, source, entries) => entries.forEach(([question, difficulty], index) => {
    if (!String(question ?? '').trim()) return;
    questionRows.push([
      guide.company,
      guide.slug,
      category,
      round,
      source,
      difficulty ?? '',
      String(index + 1),
      String(question),
    ]);
  });
  const bankRows = (stage) => tiers.flatMap((tier) =>
    (banks.questionBanks?.[category]?.[stage]?.[tier] ?? [])
      .map((question) => [String(question).replace(/\{company\}/g, guide.company), tier]));

  add('Screening', 'category', bankRows('screening'));
  add('Coding', 'guide', (samples.coding ?? []).map((question) => [question, '']));
  add('System Design', 'guide', (samples.systemDesign ?? []).map((question) => [question, '']));
  const behavioralGuide = samples.behavioral ?? [];
  add('Behavioral', 'guide', behavioralGuide.map((question) => [question, '']));
  add('Behavioral', 'category', bankRows('behavioral').filter(([question]) => !behavioralGuide.includes(question)));
  const valuesGuide = samples.values ?? [];
  add('Values', 'guide', valuesGuide.map((question) => [question, '']));
  add('Values', 'category', bankRows('values').filter(([question]) => !valuesGuide.includes(question)));
  add('Final', 'category', bankRows('final'));
}

const parsed = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const header = parsed.shift();
const expectedHeader = ['Company', 'Slug', 'Category', 'Round', 'Source', 'Difficulty', '#', 'Question'];
if (JSON.stringify(header) !== JSON.stringify(expectedHeader)) {
  throw new Error(`Unexpected tracker header: ${JSON.stringify(header)}`);
}
const signature = (row) => JSON.stringify(row);
const countRows = (rows) => {
  const counts = new Map();
  for (const row of rows) {
    const key = signature(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};
const expected = countRows(questionRows);
const actual = countRows(parsed);
const missing = [];
const unexpected = [];
for (const [row, count] of expected) {
  const difference = count - (actual.get(row) ?? 0);
  if (difference > 0) missing.push({ row, count: difference });
}
for (const [row, count] of actual) {
  const difference = count - (expected.get(row) ?? 0);
  if (difference > 0) unexpected.push({ row, count: difference });
}
if (missing.length || unexpected.length) {
  throw new Error(`Tracker is stale: ${missing.length} missing row signature(s), ${unexpected.length} unexpected row signature(s).`);
}

const mobileCatalog = buildMobileInterviewQuestionCatalog(guides, banks);
const emptyStages = Object.entries(mobileCatalog).flatMap(([slug, guide]) =>
  Object.entries(guide.stageQuestions)
    .filter(([, questions]) => questions.length === 0)
    .map(([stage]) => `${slug}:${stage}`));
const oversizedStages = Object.entries(mobileCatalog).flatMap(([slug, guide]) =>
  Object.entries(guide.stageQuestions)
    .filter(([, questions]) => questions.length > WEB_QUEST_STAGE_QUESTION_LIMIT)
    .map(([stage, questions]) => `${slug}:${stage}:${questions.length}`));

if (oversizedStages.length) {
  throw new Error(`Mobile catalog diverges from Web's ${WEB_QUEST_STAGE_QUESTION_LIMIT}-question stage limit: ${oversizedStages.slice(0, 10).join(', ')}`);
}

console.log(`Tracker verified: ${guides.length} companies and ${questionRows.length} exact question rows.`);
console.log(`Mobile catalog verified: ${Object.keys(mobileCatalog).length} companies; every stage matches Web's first ${WEB_QUEST_STAGE_QUESTION_LIMIT} questions; ${emptyStages.length} intentionally sparse stage pool(s).`);
