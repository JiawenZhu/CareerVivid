#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const firebaseJsonPath = path.join(repoRoot, 'firebase.json');
const publicRouteAuditPath = path.join(repoRoot, 'docs/next-migration/public-route-audit.json');
const distRoot = path.join(repoRoot, 'dist');

const firebaseConfig = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
const publicRouteAudit = JSON.parse(fs.readFileSync(publicRouteAuditPath, 'utf8'));

const plannedRows = publicRouteAudit.rows.filter(row => row.status === 'planned-public-next-candidate');
const hostingRewrites = firebaseConfig.hosting.rewrites ?? [];
const rewriteBySource = new Map(hostingRewrites.map(rewrite => [rewrite.source, rewrite.destination]));

const expectedRewriteSources = new Set([
  '/',
  '/product',
  '/pricing',
  '/contact',
  '/privacy',
  '/terms',
  '/partners',
  '/partners/academic',
  '/partners/agency',
  '/partners/business',
  '/partners/hiring',
  '/partners/students',
  '/topic/ai-native-developer-portfolios',
  '/topic/vibe-coding-platform',
]);

const viteShellRewriteSources = new Set([
  '/blog',
  '/blog/ai-job-search-workspace',
  '/blog/ai-resume-builder-job-tracker',
  '/blog/chrome-extension-job-autofill',
]);

const failures = [];

for (const row of plannedRows) {
  if (!row.nextTargetExists) {
    failures.push(`Missing Next target for planned route ${row.route}: ${row.nextTarget}`);
  }
}

for (const source of expectedRewriteSources) {
  const destination = rewriteBySource.get(source);
  if (!destination) {
    failures.push(`Missing Firebase Hosting rewrite for ${source}`);
    continue;
  }

  if (!destination.startsWith('/nextjs/')) {
    failures.push(`Rewrite for ${source} should point to /nextjs, found ${destination}`);
    continue;
  }

  const destinationFile = path.join(distRoot, destination);
  if (!fs.existsSync(destinationFile)) {
    failures.push(`Rewrite for ${source} points to missing build artifact: ${destination}`);
  }
}

for (const source of viteShellRewriteSources) {
  const destination = rewriteBySource.get(source);
  if (destination !== '/app.html') {
    failures.push(`Rewrite for ${source} should point to /app.html, found ${destination || 'missing'}`);
  }
}

const nextRootStaticDir = path.join(distRoot, '_next', 'static');
if (!fs.existsSync(nextRootStaticDir)) {
  failures.push('Missing root-level Next static assets: dist/_next/static');
}

const nextAssetPattern = /(?:src|href)="(\/_next\/static\/[^"]+)"/g;
for (const source of expectedRewriteSources) {
  const destination = rewriteBySource.get(source);
  if (!destination?.startsWith('/nextjs/')) {
    continue;
  }

  const destinationFile = path.join(distRoot, destination);
  if (!fs.existsSync(destinationFile)) {
    continue;
  }

  const html = fs.readFileSync(destinationFile, 'utf8');
  for (const match of html.matchAll(nextAssetPattern)) {
    const assetPath = path.join(distRoot, match[1]);
    if (!fs.existsSync(assetPath)) {
      failures.push(`Missing Next asset referenced by ${source}: ${match[1]}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Next public hosting rewrite verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Verified ${expectedRewriteSources.size} public Next hosting rewrites.`);
