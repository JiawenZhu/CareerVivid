#!/usr/bin/env node

import process from 'node:process';

const baseUrl = (process.argv[2] || process.env.CAREERVIVID_HOSTING_URL || 'http://127.0.0.1:5002').replace(/\/$/, '');

const publicNextRoutes = [
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
];

const viteShellRoutes = [
  '/dashboard',
  '/signin',
  '/signup',
  '/newresume',
  '/job-tracker',
  '/interview-studio',
  '/edit/test-resume-id',
  '/portfolio/edit/test-id',
  '/portfolio/jiawen/edit/test-id',
  '/whiteboard/test-board',
  '/profile',
  '/billing',
  '/subscription',
  '/blog',
  '/blog/ai-job-search-workspace',
  '/blog/ai-resume-builder-job-tracker',
  '/blog/chrome-extension-job-autofill',
];

const contentChecks = new Map([
  ['/product', ['Save job links', 'Resume builder workspace', 'Interview studio', 'Career pipeline']],
  ['/pricing', ['Credit Calculator', 'Enterprise team usage', 'Choose your plan']],
  ['/partners', ['Fueling the Future of Work', 'Academic', 'Business', 'Ambassadors']],
]);

const failures = [];

async function getRoute(route) {
  const response = await fetch(`${baseUrl}${route}`);
  const body = await response.text();
  return { response, body };
}

function classifyHtml(html) {
  if (html.includes('/_next/static/') || html.includes('self.__next_f')) return 'NEXT';
  if (html.includes('/assets/index-') || html.includes('/src/')) return 'VITE';
  return 'UNKNOWN';
}

async function assertRoute(route, expectedKind) {
  const { response, body } = await getRoute(route);
  const actualKind = classifyHtml(body);
  const ok = response.status === 200 && actualKind === expectedKind;

  if (!ok) failures.push(`${route} expected ${expectedKind}, got ${response.status} ${actualKind}`);

  const requiredPhrases = contentChecks.get(route) ?? [];
  const text = body
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  for (const phrase of requiredPhrases) {
    if (!body.includes(phrase) && !text.includes(phrase)) {
      failures.push(`${route} is missing expected content: ${phrase}`);
    }
  }

  console.log(`${ok ? 'OK' : 'BAD'}\t${route}\t${response.status}\t${actualKind}`);
  return body;
}

async function assertAssetMime(html, pattern, label) {
  const assetPaths = [...html.matchAll(pattern)].map((match) => match[1]);
  if (assetPaths.length === 0) {
    failures.push(`No ${label} assets found in probed HTML`);
    return;
  }

  for (const assetPath of assetPaths.slice(0, 8)) {
    const response = await fetch(`${baseUrl}${assetPath}`);
    const contentType = response.headers.get('content-type') || '';
    const ok = response.status === 200 && /javascript|css/.test(contentType);
    if (!ok) failures.push(`${label} asset ${assetPath} returned ${response.status} ${contentType}`);
    console.log(`${ok ? 'OK' : 'BAD'}\tasset\t${assetPath}\t${contentType}`);
  }
}

async function main() {
  console.log(`Verifying hybrid CareerVivid hosting runtime at ${baseUrl}`);

  let productHtml = '';
  let dashboardHtml = '';

  for (const route of publicNextRoutes) {
    const html = await assertRoute(route, 'NEXT');
    if (route === '/product') productHtml = html;
  }

  for (const route of viteShellRoutes) {
    const html = await assertRoute(route, 'VITE');
    if (route === '/dashboard') dashboardHtml = html;
  }

  await assertAssetMime(productHtml, /(?:src|href)="([^"]*\/_next\/static\/[^"]+)"/g, 'Next');
  await assertAssetMime(dashboardHtml, /(?:src|href)="([^"]*\/assets\/index-[^"]+)"/g, 'Vite');

  if (failures.length > 0) {
    console.error('\nHybrid hosting verification failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log(`Verified ${publicNextRoutes.length} Next routes and ${viteShellRoutes.length} Vite shell routes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
