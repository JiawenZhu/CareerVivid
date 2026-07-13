/**
 * Backfill interviewer-facing sample questions in data/interview-guides/*.json.
 *
 * The guides' `sampleQuestions.other` bucket holds candidate FAQs (excluded
 * from interviewer pools by getGuideQuestionPool). Most guides have almost no
 * real interviewer questions, so this script derives them from each guide's
 * own topic data:
 *   - behavioral: extracts embedded quoted questions from behavioralTopics,
 *     else maps topic keywords to curated STAR questions
 *   - systemDesign: uses the guide's "Design ..." systemDesignTopics verbatim
 *     (they are already company-specific challenges)
 *   - coding: converts imperative codingTopics into problem prompts, else
 *     maps topic keywords to classic problems
 *
 * Deterministic and idempotent: only fills buckets with fewer than MIN
 * questions, tops up to CAP, never touches `values` (a non-empty values
 * bucket would add a values round to the quest line) and never edits `other`.
 *
 * Run: node scripts/backfillGuideQuestions.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const GUIDES_DIR = join(dirname(fileURLToPath(import.meta.url)), '../data/interview-guides');
const MIN = 3;
const CAP = 5;
const DRY_RUN = process.argv.includes('--dry-run');

// --- Candidate-question guard (mirror of isCandidateDirectedQuestion) -------
const CANDIDATE_PATTERNS = [
  /^(do|can|will|should|would|am|are|is) i\b/i,
  /\bdo i (need|have to|get)\b/i,
  /\bhow (hard|difficult|tough|intense) (is|are)\b/i,
  /\bhow does .+ compare (to|with|against)\b/i,
  /\b(is|are) (it|they|the \w+) (worth|really|actually|still)\b/i,
  /\bworth (joining|it|the equity)\b/i,
  /\bwhat('s| is) it like\b/i,
  /\bwhat('s| is) (the )?(engineering|company|team) (culture|bar)\b/i,
  /\bremote.friendly\b|\bwork.life balance\b|\bwlb\b/i,
  /\b(ipo|acquisition|merger|layoffs?|funding|valuation|stock price|equity)\b.*\b(outlook|worth|valuable|changed|affect|impact|going|happening|recovery)\b/i,
  /\bhow (has|did) .+ (acquisition|merger|deal|ipo) (change|affect|impact)/i,
  /\bwhat('s| is) happening\b/i,
  /\bstill (hiring|worth|growing)\b/i,
  /\b(the|their) (interviews?|coding rounds?|onsite|process|loop)\b.*\breally\b/i,
  /\bhow long (does|is) (the )?(process|loop|interview)\b/i,
  /\b(lowball|down.?level|negotiat)/i,
  /\b(comp|compensation|salary|pay|equity|rsu)s?\b.*\b(good|competitive|fair|top|real)\b/i,
];
const isCandidateDirected = (q) => CANDIDATE_PATTERNS.some((p) => p.test(q));

// --- Topic noise filter ------------------------------------------------------
// Some topic arrays contain process notes, not topics.
const NOISE = /\b(round|rounds|hiring committee|onsite|recruiter|offer stage|debrief)\b/i;
const isNoiseTopic = (t) => !t || t.trim().length < 8 || NOISE.test(t);

// --- Helpers -----------------------------------------------------------------
const sentenceCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const ensureEnd = (s) => (/[.?!]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
const firstSentence = (s) => s.split(/(?<=[.?!])\s+/)[0];
const stripQuotes = (s) => {
  const trimmed = s.replace(/^["'“‘]+|["'”’]+$/g, '').trim();
  // Drop unbalanced leftover quotes (e.g. topic was `"implement a tool" prompts: ...`).
  const straight = (trimmed.match(/"/g) || []).length;
  return straight % 2 === 1 ? trimmed.replace(/["“”]/g, '').trim() : trimmed;
};

// --- Behavioral --------------------------------------------------------------
const BEHAVIORAL_BANK = [
  [/ownership|owned|accountab/i, 'Describe a production incident or project you owned end-to-end. What did you do, and what was the outcome?'],
  [/conflict|disagree/i, 'Tell me about a time you disagreed with a teammate or manager. How was it resolved?'],
  [/collaborat|cross[- ]team|across teams|partner/i, 'Tell me about a time you worked across teams to deliver something. How did you handle competing priorities?'],
  [/customer|user focus|client/i, 'Tell me about a time you engaged deeply with a customer or user problem. How did it change what you built?'],
  [/pace|fast|speed|deadline|urgen/i, 'Describe a time you had to deliver under a tight deadline. What trade-offs did you make?'],
  [/ambigu|scope|unclear|open[- ]ended/i, 'Tell me about a time you were handed an ambiguous problem. How did you scope it and drive it forward?'],
  [/fail|mistake|short|setback/i, 'Describe a project that failed or fell short. What did you learn and change afterward?'],
  [/regulat|compliance|risk/i, 'Have you worked under compliance or regulatory constraints? How did they shape your engineering decisions?'],
  [/research/i, 'How do you balance research exploration with engineering delivery? Give a concrete example.'],
  [/hiring|bar|mentor|grow/i, 'How have you helped raise the technical bar on a team — through mentoring, reviews, or hiring? Give an example.'],
  [/depth|hard technical|complex/i, 'Describe the hardest technical problem you have solved. What made it hard, and what was your specific contribution?'],
  [/small[- ]team|broad scope|startup/i, 'How do you operate when you own a broad scope on a small team? Walk me through a concrete week.'],
  [/impact|result|metric/i, 'Tell me about the piece of work you are most proud of. What was the measurable impact?'],
];
const BEHAVIORAL_GENERIC = [
  'Tell me about a time you disagreed with a teammate or manager. How did it resolve?',
  'Describe a project that failed or fell short. What did you learn and change afterward?',
  'Give me an example of when you took ownership of something outside your job description.',
];

const behavioralFromTopic = (topic) => {
  const quoted = topic.match(/["“]([^"”]{15,})["”]/);
  if (quoted) return ensureEnd(sentenceCase(stripQuotes(quoted[1])));
  const hit = BEHAVIORAL_BANK.find(([re]) => re.test(topic));
  return hit ? hit[1] : null;
};

// --- System design -----------------------------------------------------------
const designFromTopic = (topic) => {
  const cleaned = stripQuotes(topic.trim());
  // "Design ..." prompts are used verbatim — they are the company's real prompts.
  if (/^design\b/i.test(cleaned)) {
    const text = ensureEnd(sentenceCase(cleaned));
    return text.length > 90
      ? text
      : `${text.replace(/\.$/, '')}. Cover the API, data model, and how it scales.`;
  }
  // Domain-round prompts ("Walk through...", "Explain...", "How would you...")
  // are also legitimate interviewer questions for the technical pool.
  if (/^(walk (me )?through|explain|how would you|compare|what trade-?offs)\b/i.test(cleaned)) {
    return ensureEnd(sentenceCase(cleaned));
  }
  return null;
};

// --- Coding --------------------------------------------------------------
const CODING_BANK = [
  // Domain-specific entries first — they should win over generic patterns
  // when a topic mentions both (e.g. "practical engineering, fintech flavor").
  [/fintech|financial|payment|ledger|bank|trading|loan/i, 'Implement a double-entry ledger that processes a stream of transactions and detects imbalances. How do you guarantee idempotency when a transaction is delivered twice?'],
  [/embedded|real.?time|sensor|robotic/i, 'Implement a fixed-size ring buffer for sensor readings with O(1) reads and writes and no dynamic allocation. Walk through the concurrency considerations.'],
  [/\bml\b|machine learning|model|feature/i, 'Implement a streaming feature aggregator: given a stream of events, maintain rolling counts and averages per key with bounded memory. Discuss complexity and eviction.'],
  [/graph/i, 'You are given a directed graph as an adjacency list. Detect whether it contains a cycle, and explain how your approach would change for an undirected graph.'],
  [/\btree|trie\b/i, 'Serialize and deserialize a binary tree. Walk through your encoding choices, complexity, and edge cases.'],
  [/dynamic programming|\bdp\b|memoiz/i, 'Given a set of coin denominations, compute the minimum number of coins needed to reach a target amount. Compare the recursive and bottom-up approaches.'],
  [/interval/i, 'Given a list of meeting intervals, determine the minimum number of rooms required. Walk through your approach and complexity.'],
  [/linked list/i, 'Reverse a linked list in groups of k nodes. Discuss the iterative versus recursive trade-offs.'],
  [/hash|dictionar|\bmap\b/i, 'Design a data structure supporting insert, delete, and get-random in O(1). Explain your reasoning.'],
  [/array|string/i, 'Given an array of integers, find the longest contiguous subarray whose sum equals a target. Discuss complexity and edge cases.'],
  [/concurren|thread|parallel/i, 'Implement a thread-safe bounded queue. How do you prevent race conditions and deadlocks?'],
  [/sql|query|data set|dataset/i, 'You need to deduplicate a very large dataset that does not fit in memory. Walk me through your approach and how you would verify correctness.'],
  [/complexity|big[- ]?o/i, 'Take a solution you have written recently and analyze its time and space complexity. How would you optimize it?'],
  [/debug|production|practical/i, 'A function intermittently fails in production. Walk me through how you would reproduce, isolate, and fix the bug.'],
  [/heap|priority/i, 'Find the k most frequent elements in a stream. Which data structure do you use and why?'],
  [/systems|memory|cache|performance/i, 'Implement an LRU cache with O(1) get and put. Then explain how you would make it thread-safe without serializing all access.'],
];

/**
 * Derive topics from onsite-round stage lines when topic arrays are empty
 * (old-format guides): "Coding (1–2 rounds) — practical engineering, fintech
 * flavor" → the text after the dash describes the round's real focus.
 */
const topicsFromStages = (stages, kind) => {
  const re = kind === 'coding'
    ? /^coding\b.*?\s[—–-]\s(.{10,})$/i
    : /^system design\b.*?\s[—–-]\s(.{10,})$/i;
  return (stages ?? [])
    .map((s) => s.match(re))
    .filter(Boolean)
    .map((m) => m[1].trim());
};

/** "fintech systems (loan servicing, payments, idempotency)" → design prompt. */
const designFromStageDescriptor = (descriptor, company) => {
  const m = descriptor.match(/^([^(]{4,60})\(([^)]{10,})\)/);
  if (m) {
    const domain = m[1].trim().replace(/\.$/, '');
    return `Design one of ${company}'s core ${domain} — address ${m[2].trim()}. Walk through the architecture, trade-offs, and failure modes.`;
  }
  // Comma-list descriptors: "autonomy systems, distributed sensors, real-time
  // architectures" → lead with the first item, cover the rest.
  const parts = descriptor.trim().replace(/\.$/, '').split(/,\s*/);
  if (parts.length > 1) {
    return `Design ${company}'s ${parts[0]} platform — cover ${parts.slice(1).join(', ')}. Walk through the architecture, trade-offs, and failure modes.`;
  }
  return `Design ${company}'s ${parts[0]} at production scale. Walk through the architecture, trade-offs, and failure modes.`;
};
const CODING_GENERIC = [
  'Given an array of integers, find the two numbers that add up to a target value. Talk through your approach, complexity, and edge cases.',
  'Given a string, find the length of the longest substring without repeating characters. Walk through your solution.',
  'Design a data structure that supports insert, delete, and get-random in constant time. Explain your reasoning.',
];
const IMPERATIVE = /^(implement|build|write|create|parse|given|handle|stream|track|traverse|merge|compute|detect|find|reverse|serialize|select|simulate|calculate|design|process)\b/i;
const SUFFIX = ' Talk through your approach, complexity, and edge cases.';

/**
 * Extract a question from a coding topic, favoring the company-specific
 * problem shapes scraped from techinterview.org over generic classics:
 *   1. "Label: given a sell order..." → use the description as the prompt
 *   2. "Head (concrete example task)"  → implement the example task
 *   3. "Implement/Given ..."           → use directly
 *   4. keyword → curated classic       → last resort before generics
 */
const codingFromTopic = (topic) => {
  const cleaned = stripQuotes(topic.trim());

  // 1. "Tax-lot matching: given a sell order and a set of lots, select lots..."
  const labeled = cleaned.match(/^([^:]{3,60}):\s*(.+)$/);
  if (labeled && IMPERATIVE.test(labeled[2].trim())) {
    return `${ensureEnd(sentenceCase(labeled[2].trim()))}${SUFFIX}`;
  }

  // 2. "Simulation problems (Monte Carlo simulation of portfolio outcomes...)"
  //    "Time-series processing (rolling returns, drawdown, Sharpe ratio...)"
  // Only when the parenthetical is a concrete task (long enough to be more
  // than a topic list like "DP, graph algorithms").
  const paren = cleaned.match(/^([^(]{3,60})\(([^)]{15,})\)/);
  if (paren && paren[2].trim().split(/\s+/).length >= 5) {
    // Keep original casing — proper nouns (Monte Carlo) and acronyms (DP,
    // SQL) are indistinguishable from ordinary words here.
    return `Implement ${paren[2].trim()}.${SUFFIX}`;
  }

  // 3. "Implement a text-buffer primitive with efficient edit operations"
  if (IMPERATIVE.test(cleaned)) {
    return `${ensureEnd(sentenceCase(firstSentence(cleaned)))}${SUFFIX}`;
  }

  // 4. Topic keyword → curated classic
  const hit = CODING_BANK.find(([re]) => re.test(topic));
  return hit ? hit[1] : null;
};

// --- Main ----------------------------------------------------------------
const files = readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.json'));
let touched = 0;
const counts = { coding: 0, systemDesign: 0, behavioral: 0 };

for (const file of files) {
  const path = join(GUIDES_DIR, file);
  const guide = JSON.parse(readFileSync(path, 'utf8'));
  const sq = guide.sampleQuestions ?? {};
  guide.sampleQuestions = sq;
  let changed = false;

  const DESIGN_GENERICS = [
    `Design a service at ${guide.company} scale that shortens URLs. Cover the API, storage, and hot-key handling.`,
    'Design a rate limiter for a public API. Discuss algorithms, distributed coordination, and failure modes.',
  ];

  // Strip questions added by previous runs of this script so improved topic
  // extraction can replace generic classics with company-specific problems.
  // Scraped/pre-existing questions never match these shapes and are preserved.
  const isPreviouslyGenerated = (q) =>
    CODING_GENERIC.includes(q)
    || CODING_BANK.some(([, bankQ]) => bankQ === q)
    || DESIGN_GENERICS.includes(q)
    || q.endsWith(SUFFIX.trim())
    || q.endsWith('Walk through the architecture, trade-offs, and failure modes.');

  for (const bucket of ['coding', 'systemDesign']) {
    const existing = sq[bucket] ?? [];
    const kept = existing.filter((q) => !isPreviouslyGenerated(q));
    if (kept.length !== existing.length) {
      sq[bucket] = kept;
      changed = true;
    }
  }

  const fill = (bucket, generated, generics, { topUp = false } = {}) => {
    const existing = sq[bucket] ?? [];
    if (!topUp && existing.length >= MIN) return;
    const pool = [...generated, ...generics].filter(
      (q) => q && !isCandidateDirected(q) && !existing.some((e) => e.toLowerCase() === q.toLowerCase()),
    );
    const unique = Array.from(new Set(pool));
    const additions = unique.slice(0, Math.max(0, CAP - existing.length));
    if (additions.length && existing.length + additions.length >= MIN) {
      sq[bucket] = [...existing, ...additions];
      counts[bucket] += additions.length;
      changed = true;
    }
  };

  // Old-format guides have empty topic arrays but carry the round focus in
  // their stage lines — derive from those before falling back to generics.
  const codingTopics = (guide.codingTopics ?? []).length
    ? guide.codingTopics
    : topicsFromStages(guide.interviewStages, 'coding');
  const designStageTopics = topicsFromStages(guide.interviewStages, 'systemDesign');

  fill(
    'coding',
    codingTopics.filter((t) => !isNoiseTopic(t)).map(codingFromTopic),
    CODING_GENERIC,
    { topUp: true },
  );

  // Only backfill systemDesign for companies that actually run design rounds.
  if ((guide.systemDesignTopics ?? []).length > 0 || designStageTopics.length > 0) {
    fill(
      'systemDesign',
      [
        ...(guide.systemDesignTopics ?? []).map(designFromTopic),
        ...designStageTopics.map((d) => designFromStageDescriptor(d, guide.company)),
      ],
      DESIGN_GENERICS,
      { topUp: true },
    );
  }

  fill(
    'behavioral',
    (guide.behavioralTopics ?? []).filter((t) => !isNoiseTopic(t)).map(behavioralFromTopic),
    BEHAVIORAL_GENERIC,
  );

  if (changed) {
    touched += 1;
    if (!DRY_RUN) writeFileSync(path, `${JSON.stringify(guide, null, 2)}\n`);
  }
}

console.log(`${DRY_RUN ? '[dry-run] ' : ''}Updated ${touched}/${files.length} guides`);
console.log(`Questions added — coding: ${counts.coding}, systemDesign: ${counts.systemDesign}, behavioral: ${counts.behavioral}`);
