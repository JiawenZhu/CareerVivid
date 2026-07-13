/**
 * Clones/updates the approved third-party learning repos referenced by
 * data/learning/sources.json into third_party/learning-sources/<id>/, and
 * copies each repo's LICENSE/NOTICE into third_party/learning-sources/LICENSES/.
 *
 * Only sources with `downloadable: true` are touched — everything flagged
 * `downloadable: false` (non-commercial or unlicensed repos, product docs,
 * social media) is intentionally skipped; see docs/learning/resource-inventory.md
 * for why each one is excluded.
 *
 * This script performs real `git clone`/`git pull` network operations.
 * It is NOT run automatically by anything in this repo — it only runs when
 * a human explicitly invokes it.
 *
 * Usage:
 *   node scripts/sync-learning-sources.mjs           # clone/update everything downloadable
 *   node scripts/sync-learning-sources.mjs --id <id> # only that one source
 *   node scripts/sync-learning-sources.mjs --dry-run # print what would happen, do nothing
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SOURCES_PATH = path.join(ROOT, 'data', 'learning', 'sources.json');
const TARGET_ROOT = path.join(ROOT, 'third_party', 'learning-sources');
const LICENSES_DIR = path.join(TARGET_ROOT, 'LICENSES');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const onlyId = args.find((a, i) => args[i - 1] === '--id');

const LICENSE_FILENAMES = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'NOTICE', 'NOTICE.md'];

function loadSources() {
  const { sources } = JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf8'));
  return sources.filter((s) => s.downloadable);
}

function run(cmd, args, cwd) {
  if (dryRun) {
    console.log(`[dry-run] ${cmd} ${args.join(' ')}${cwd ? ` (cwd=${cwd})` : ''}`);
    return;
  }
  execFileSync(cmd, args, { cwd, stdio: 'inherit' });
}

/** Clone a fresh copy, or `git pull` if it's already there. */
function syncRepo(source) {
  const dest = path.join(ROOT, source.localPath);
  const exists = fs.existsSync(path.join(dest, '.git'));

  if (exists) {
    console.log(`↻  Updating ${source.id} (${source.localPath})`);
    run('git', ['pull', '--ff-only'], dest);
  } else {
    console.log(`⬇  Cloning ${source.id} → ${source.localPath}`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    run('git', ['clone', '--depth', '1', source.repoUrl, dest]);
  }
}

/** Copy whichever LICENSE/NOTICE files exist in the cloned repo. */
function copyLicense(source) {
  const dest = path.join(ROOT, source.localPath);
  if (dryRun && !fs.existsSync(dest)) {
    console.log(`[dry-run] would copy LICENSE for ${source.id}`);
    return;
  }
  if (!fs.existsSync(LICENSES_DIR)) fs.mkdirSync(LICENSES_DIR, { recursive: true });

  const found = LICENSE_FILENAMES.find((name) => fs.existsSync(path.join(dest, name)));
  if (!found) {
    console.warn(`⚠  No LICENSE/NOTICE file found for ${source.id} — verify manually before redistributing.`);
    return;
  }
  const target = path.join(LICENSES_DIR, `${source.id}.LICENSE`);
  if (dryRun) {
    console.log(`[dry-run] would copy ${found} → ${target}`);
    return;
  }
  fs.copyFileSync(path.join(dest, found), target);
  console.log(`   copied ${found} → LICENSES/${source.id}.LICENSE`);
}

function main() {
  const sources = loadSources().filter((s) => !onlyId || s.id === onlyId);
  if (!sources.length) {
    console.error(onlyId ? `No downloadable source with id "${onlyId}"` : 'No downloadable sources found.');
    process.exit(1);
  }

  console.log(`${dryRun ? '[DRY RUN] ' : ''}Syncing ${sources.length} source(s) into ${path.relative(ROOT, TARGET_ROOT)}/\n`);

  for (const source of sources) {
    syncRepo(source);
    copyLicense(source);
  }

  console.log('\nDone. Remember: Apache-2.0 sources require attribution — the copied LICENSE covers that.');
}

main();
