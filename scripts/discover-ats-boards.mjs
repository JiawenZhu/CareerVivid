/**
 * Discovers which of the interview-guide companies host jobs on a public ATS
 * (Greenhouse / Lever / Ashby) by probing each provider's official public
 * job-board API with slug candidates derived from the company name.
 *
 * These are documented public endpoints (no auth, no scraping of HTML), the
 * same ones each company's own careers page calls:
 *   - Greenhouse: https://boards-api.greenhouse.io/v1/boards/{token}/jobs
 *   - Lever:      https://api.lever.co/v0/postings/{token}?mode=json
 *   - Ashby:      https://api.ashbyhq.com/posting-api/job-board/{token}
 *
 * Outputs:
 *   1. data/jobs/ats-boards.json                — full discovery report
 *   2. functions/src/atsBoards.generated.ts     — sources array consumed by
 *      scrapedJobs.ts (merged into the recommended-jobs cron)
 *
 * Usage: node scripts/discover-ats-boards.mjs [--limit N] [--company "Name"]
 * Runtime: ~2-4 min for ~300 companies (concurrency 6, polite 150ms spacing).
 * Re-run any time — results are deterministic and idempotent.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'data', 'interview-guides', '_index.json');
const REPORT_PATH = path.join(ROOT, 'data', 'jobs', 'ats-boards.json');
const GENERATED_TS_PATH = path.join(ROOT, 'functions', 'src', 'atsBoards.generated.ts');

const args = process.argv.slice(2);
const limitArg = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;
const onlyCompany = args.includes('--company') ? args[args.indexOf('--company') + 1] : null;

const CONCURRENCY = 6;
const REQUEST_TIMEOUT_MS = 10_000;
const SPACING_MS = 150;

/* ------------------------------------------------------------------ */
/* Slug candidates                                                     */
/* ------------------------------------------------------------------ */

const slugCandidates = (company, guideSlug) => {
  const base = company
    .toLowerCase()
    .replace(/[®™']/g, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .trim();
  const compact = base.replace(/[^a-z0-9]/g, '');
  const hyphen = base.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const firstWord = base.split(/[^a-z0-9]+/)[0] ?? '';
  const noSuffix = compact.replace(/(inc|corp|labs|technologies|technology|systems|software|ai|hq)$/g, '');
  const fromGuide = guideSlug.replace(/-interview-guide$/, '').replace(/[^a-z0-9-]/g, '');
  const fromGuideCompact = fromGuide.replace(/-/g, '');

  return [...new Set([compact, hyphen, fromGuideCompact, fromGuide, noSuffix, firstWord].filter((s) => s.length >= 2))];
};

/* ------------------------------------------------------------------ */
/* Provider probes — each returns { ok, jobCount } or null             */
/* ------------------------------------------------------------------ */

const fetchJson = async (url, init = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, headers: { accept: 'application/json', ...init.headers } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const PROBES = {
  greenhouse: async (token) => {
    const data = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=false`);
    if (!data || !Array.isArray(data.jobs)) return null;
    return { jobCount: data.jobs.length };
  },
  lever: async (token) => {
    const data = await fetchJson(`https://api.lever.co/v0/postings/${token}?mode=json&limit=100`);
    if (!Array.isArray(data)) return null;
    return { jobCount: data.length };
  },
  ashby: async (token) => {
    const data = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(token)}?includeCompensation=false`);
    if (!data || !Array.isArray(data.jobs)) return null;
    return { jobCount: data.jobs.length };
  },
};

/* ------------------------------------------------------------------ */
/* Discovery loop                                                      */
/* ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const discoverCompany = async ({ company, guideSlug }) => {
  const candidates = slugCandidates(company, guideSlug);
  for (const provider of ['greenhouse', 'lever', 'ashby']) {
    for (const token of candidates) {
      const hit = await PROBES[provider](token);
      await sleep(SPACING_MS);
      // Boards with zero live jobs are real but useless for the feed today;
      // record them so re-runs can pick them up when they post roles.
      if (hit) {
        return {
          company,
          guideSlug,
          provider,
          boardToken: token,
          jobCount: hit.jobCount,
          discoveredAt: new Date().toISOString(),
        };
      }
    }
  }
  return { company, guideSlug, provider: null };
};

const main = async () => {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
  let companies = Object.values(index)
    // The index also carries non-company entries (e.g. "sampleQuestions") — keep only real guides.
    .filter((entry) => entry && typeof entry === 'object' && typeof entry.company === 'string' && typeof entry.slug === 'string')
    .map((entry) => ({ company: entry.company, guideSlug: entry.slug }));
  if (onlyCompany) companies = companies.filter((c) => c.company.toLowerCase() === onlyCompany.toLowerCase());
  companies = companies.slice(0, limitArg);

  console.log(`Probing ${companies.length} companies against Greenhouse / Lever / Ashby…`);

  const results = [];
  let done = 0;
  const queue = [...companies];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      const result = await discoverCompany(item);
      results.push(result);
      done += 1;
      const tag = result.provider ? `✓ ${result.provider}/${result.boardToken} (${result.jobCount} jobs)` : '—';
      console.log(`[${done}/${companies.length}] ${item.company}: ${tag}`);
    }
  });
  await Promise.all(workers);

  const found = results.filter((r) => r.provider).sort((a, b) => a.company.localeCompare(b.company));
  const missed = results.filter((r) => !r.provider).map((r) => r.company).sort();

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    probed: results.length,
    foundCount: found.length,
    found,
    missed,
  }, null, 2) + '\n');

  // Generate the TS module consumed by functions/src/scrapedJobs.ts.
  const activeBoards = found.filter((r) => r.jobCount > 0);
  const lines = activeBoards.map((r) =>
    `    { provider: "${r.provider}", company: ${JSON.stringify(r.company)}, boardToken: ${JSON.stringify(r.boardToken)}, companyUrl: "" },`,
  );
  fs.writeFileSync(GENERATED_TS_PATH, [
    '// AUTO-GENERATED by scripts/discover-ats-boards.mjs — do not edit by hand.',
    `// Generated ${new Date().toISOString()} · ${activeBoards.length} boards with live jobs (${found.length} total found, ${missed.length} companies without a public ATS board).`,
    '',
    'export interface GeneratedAtsSource {',
    '    provider: "greenhouse" | "lever" | "ashby";',
    '    company: string;',
    '    boardToken: string;',
    '    companyUrl: string;',
    '}',
    '',
    'export const GENERATED_ATS_SOURCES: GeneratedAtsSource[] = [',
    ...lines,
    '];',
    '',
  ].join('\n'));

  console.log(`\nDone. ${found.length}/${results.length} companies have a public ATS board (${activeBoards.length} with live jobs).`);
  console.log(`Report: data/jobs/ats-boards.json`);
  console.log(`Generated: functions/src/atsBoards.generated.ts`);
  console.log(`\nNext: deploy functions (the 6-hour cron picks the new list up), or trigger scrapeRecommendedJobs once from the app.`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
