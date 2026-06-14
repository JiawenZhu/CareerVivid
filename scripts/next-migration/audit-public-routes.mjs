#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { Project, SyntaxKind } from 'ts-morph';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const appPath = path.join(repoRoot, 'src/App.tsx');
const reportDir = path.join(repoRoot, 'docs/next-migration');
const jsonReportPath = path.join(reportDir, 'public-route-audit.json');
const mdReportPath = path.join(reportDir, 'public-route-audit.md');

const plannedPublicExactRoutes = new Set([
  '/',
  '/product',
  '/pricing',
  '/contact',
  '/privacy',
  '/terms',
  '/partners',
  '/partners/academic',
  '/partners/business',
  '/partners/agency',
  '/partners/hiring',
  '/partners/students',
]);

const plannedPublicPrefixes = new Set([
  '/topic/',
  '/blog/',
]);

const protectedMarkers = [
  'ProtectedRoute',
  'currentUser',
  'AuthRedirect',
  'userProfile',
  'isAdmin',
];

const ignoredComponentNames = new Set([
  'ProtectedRoute',
  'AuthRedirect',
  'PermissionDeniedPage',
  'Suspense',
]);

const signalMatchers = [
  { key: 'browser-global', pattern: /\b(window|document|localStorage|sessionStorage|navigator)\b|chrome\./ },
  { key: 'react-client-hook', pattern: /\b(useState|useEffect|useLayoutEffect|useReducer|useRef|useMemo|useCallback)\b/ },
  { key: 'firebase-client', pattern: /firebase\/auth|firebase\/firestore|firebase\/storage|getAuth|onAuthStateChanged/ },
  { key: 'router-client', pattern: /react-router-dom|useNavigate|useLocation|useParams/ },
  { key: 'helmet-seo', pattern: /react-helmet-async|<Helmet\b|SEOHelper/ },
  { key: 'extension-or-pwa', pattern: /chrome\.|serviceWorker|navigator\.serviceWorker|extension-ui/ },
  { key: 'auth-or-private-app', pattern: /AuthContext|ProtectedRoute|WorkspaceData|useWorkspace|useDashboard/ },
];

const restrictedImportPatterns = [
  /\/contexts\/AuthContext$/,
  /\/components\/ProtectedRoute$/,
  /\/components\/DndWorkspaceProvider$/,
  /\/hooks\/use[A-Z]/,
  /\/extension-ui\//,
  /\/pages\/Dashboard$/,
  /\/pages\/Editor$/,
  /\/pages\/InterviewStudio$/,
  /\/pages\/JobTrackerPage$/,
  /\/features\/portfolio\//,
];

const project = new Project({
  tsConfigFilePath: path.join(repoRoot, 'tsconfig.json'),
  skipAddingFilesFromTsConfig: true,
});

function sourceFileFor(filePath) {
  return project.getSourceFile(filePath) ?? project.addSourceFileAtPath(filePath);
}

function toRepoPath(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function componentImportMap(sourceFile) {
  const map = new Map();

  for (const declaration of sourceFile.getVariableDeclarations()) {
    const name = declaration.getName();
    const initializer = declaration.getInitializer();
    if (!initializer) continue;

    const match = initializer.getText().match(/import\((['"])(.+?)\1\)/);
    if (!match) continue;

    map.set(name, match[2]);
  }

  return map;
}

function parseRoutes(conditionText) {
  const exact = [];
  const prefixes = [];
  const exactRegex = /path\s*===\s*['"]([^'"]+)['"]/g;
  const prefixRegex = /path\.startsWith\(['"]([^'"]+)['"]\)/g;

  for (const match of conditionText.matchAll(exactRegex)) {
    exact.push(match[1]);
  }

  for (const match of conditionText.matchAll(prefixRegex)) {
    prefixes.push(match[1]);
  }

  return { exact, prefixes };
}

function parseRenderedComponents(statementText) {
  const names = [];
  const tagRegex = /<([A-Z][A-Za-z0-9_]*)\b/g;

  for (const match of statementText.matchAll(tagRegex)) {
    if (!ignoredComponentNames.has(match[1]) && !names.includes(match[1])) {
      names.push(match[1]);
    }
  }

  return names;
}

function resolveImport(fromFile, importPath) {
  if (!importPath.startsWith('.')) return null;

  const basePath = path.resolve(path.dirname(fromFile), importPath);
  const candidates = [
    basePath,
    `${basePath}.tsx`,
    `${basePath}.ts`,
    `${basePath}.jsx`,
    `${basePath}.js`,
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.jsx'),
    path.join(basePath, 'index.js'),
  ];

  return candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

function traceDependencies(entryFile, maxFiles = 120) {
  const visited = new Set();
  const queue = [entryFile];
  const signals = [];
  const restrictedImports = [];

  while (queue.length > 0 && visited.size < maxFiles) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    let text = '';
    try {
      text = fs.readFileSync(current, 'utf8');
    } catch {
      continue;
    }

    for (const matcher of signalMatchers) {
      if (matcher.pattern.test(text)) {
        signals.push({ file: toRepoPath(current), signal: matcher.key });
      }
    }

    let sourceFile;
    try {
      sourceFile = sourceFileFor(current);
    } catch {
      continue;
    }

    for (const importDeclaration of sourceFile.getImportDeclarations()) {
      const importText = importDeclaration.getModuleSpecifierValue();
      const resolved = resolveImport(current, importText);
      if (!resolved) continue;

      const repoImport = toRepoPath(resolved);
      const importItem = {
        file: toRepoPath(current),
        import: repoImport,
      };

      if (restrictedImportPatterns.some(pattern => pattern.test(`/${repoImport.replace(/\.[jt]sx?$/, '')}`))) {
        restrictedImports.push(importItem);
      }

      if (isToleratedPublicShellImport(importItem)) {
        continue;
      }

      if (!visited.has(resolved) && resolved.includes(`${path.sep}src${path.sep}`)) {
        queue.push(resolved);
      }
    }
  }

  return {
    tracedFiles: visited.size,
    truncated: queue.length > 0,
    signals: uniqueSignals(signals),
    restrictedImports: uniqueRestrictedImports(restrictedImports),
  };
}

function uniqueSignals(signals) {
  const seen = new Set();
  return signals.filter(signal => {
    const key = `${signal.file}:${signal.signal}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueRestrictedImports(imports) {
  const seen = new Set();
  return imports.filter(item => {
    const key = `${item.file}:${item.import}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function routeLabel({ exact, prefixes }) {
  return [...exact, ...prefixes.map(prefix => `${prefix}*`)].join(', ');
}

function nextTargetForRoute({ exact, prefixes }) {
  const route = exact[0] ?? prefixes[0];
  if (!route) return null;

  if (route === '/') return 'next-app/src/app/page.tsx';

  const routeWithoutTrailingSlash = route.endsWith('/') ? route.slice(0, -1) : route;
  const parts = routeWithoutTrailingSlash.split('/').filter(Boolean);

  if (prefixes.includes('/topic/')) return 'next-app/src/app/topic/[slug]/page.tsx';
  if (prefixes.includes('/blog/')) return 'next-app/src/app/blog/[slug]/page.tsx';

  return `next-app/src/app/${parts.join('/')}/page.tsx`;
}

function migrationPlanStatus({ exact, prefixes, statementText }) {
  const protectedRoute = protectedMarkers.some(marker => statementText.includes(marker));
  const planned =
    exact.some(route => plannedPublicExactRoutes.has(route)) ||
    prefixes.some(prefix => plannedPublicPrefixes.has(prefix));

  if (protectedRoute) return 'out-of-scope-protected';
  if (planned) return 'planned-public-next-candidate';
  if (exact.length > 0 || prefixes.length > 0) return 'public-or-route-review-needed';
  return 'not-a-route-branch';
}

function riskFromTrace(trace, status) {
  if (status === 'out-of-scope-protected') return 'blocked';
  if (trace.blockingRestrictedImports.length > 0) return 'high';

  const highSignals = new Set(['auth-or-private-app', 'extension-or-pwa', 'firebase-client']);
  if (trace.signals.some(signal => highSignals.has(signal.signal) && !isToleratedPublicShellSignal(signal))) return 'high';
  if (trace.signals.length > 0) return 'medium';
  return 'low';
}

function isToleratedPublicShellImport(item) {
  return item.file === 'src/components/PublicHeader.tsx' &&
    item.import === 'src/contexts/AuthContext.tsx';
}

function isToleratedPublicShellSignal(signal) {
  return signal.file === 'src/components/PublicHeader.tsx' &&
    signal.signal === 'auth-or-private-app';
}

function buildAudit() {
  const appFile = sourceFileFor(appPath);
  const imports = componentImportMap(appFile);
  const rows = [];

  for (const ifStatement of appFile.getDescendantsOfKind(SyntaxKind.IfStatement)) {
    const conditionText = ifStatement.getExpression().getText();
    const statementText = ifStatement.getThenStatement().getText();
    const routes = parseRoutes(conditionText);

    if (routes.exact.length === 0 && routes.prefixes.length === 0) {
      continue;
    }

    const components = parseRenderedComponents(statementText);
    const primaryComponent = components[0] ?? null;
    const importPath = primaryComponent ? imports.get(primaryComponent) ?? null : null;
    const componentFile = importPath ? resolveImport(appPath, importPath) : null;
    const trace = componentFile
      ? traceDependencies(componentFile)
      : { tracedFiles: 0, truncated: false, signals: [], restrictedImports: [] };
    trace.blockingRestrictedImports = trace.restrictedImports.filter(item => !isToleratedPublicShellImport(item));
    const status = migrationPlanStatus({ ...routes, statementText });
    const risk = riskFromTrace(trace, status);

    rows.push({
      route: routeLabel(routes),
      exactRoutes: routes.exact,
      prefixRoutes: routes.prefixes,
      status,
      risk,
      component: primaryComponent,
      componentFile: componentFile ? toRepoPath(componentFile) : null,
      nextTarget: nextTargetForRoute(routes),
      tracedFiles: trace.tracedFiles,
      traceTruncated: trace.truncated,
      signals: trace.signals,
      restrictedImports: trace.restrictedImports,
      blockingRestrictedImports: trace.blockingRestrictedImports,
    });
  }

  return rows.sort((a, b) => a.route.localeCompare(b.route));
}

function renderMarkdown(rows) {
  const generatedAt = new Date().toISOString();
  const candidates = rows.filter(row => row.status === 'planned-public-next-candidate');

  const lines = [
    '# Public Route Next.js Migration Audit',
    '',
    `Generated: ${generatedAt}`,
    '',
    'This report is generated by `npm run next-migration:audit`. It is meant to keep the CareerVivid public-page migration scoped to indexable public pages and away from authenticated product surfaces.',
    '',
    '## Summary',
    '',
    `- Total route branches found: ${rows.length}`,
    `- Planned public Next candidates: ${candidates.length}`,
    `- High-risk candidates: ${candidates.filter(row => row.risk === 'high').length}`,
    `- Medium-risk candidates: ${candidates.filter(row => row.risk === 'medium').length}`,
    `- Low-risk candidates: ${candidates.filter(row => row.risk === 'low').length}`,
    `- Candidates needing public shell/client boundary work: ${candidates.filter(row => row.restrictedImports.length > 0 || row.signals.length > 0).length}`,
    '',
    '## Planned Public Candidates',
    '',
    '| Route | Risk | Component | Traced files | Client/server notes | Next target |',
    '| --- | --- | --- | ---: | --- | --- |',
    ...candidates.map(row => [
      `\`${row.route}\``,
      row.risk,
      row.componentFile ? `\`${row.componentFile}\`` : row.component ?? 'n/a',
      row.tracedFiles,
      summarizeSignals(row),
      row.nextTarget ? `\`${row.nextTarget}\`` : 'n/a',
    ].join(' | ')).map(line => `| ${line} |`),
    '',
    '## All Route Branches',
    '',
    '| Route | Status | Risk | Component | Next target |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map(row => `| \`${row.route}\` | ${row.status} | ${row.risk} | ${row.componentFile ? `\`${row.componentFile}\`` : row.component ?? 'n/a'} | ${row.nextTarget ? `\`${row.nextTarget}\`` : 'n/a'} |`),
    '',
    '## Migration Guidance',
    '',
    '- Start with low-risk or medium-risk planned candidates only.',
    '- Treat high-risk candidates as refactor tasks because they import private app hooks, Firebase client state, extension code, or browser-only APIs.',
    '- A route can still be migrated when it has React hooks, but the interactive portion should become a small client component and the SEO shell should remain server/static.',
    '- Do not add Firebase rewrites until the specific page has build, source HTML, and visual parity evidence.',
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function summarizeSignals(row) {
  const signals = [...new Set(row.signals.map(signal => signal.signal))];
  const restricted = row.restrictedImports.length;
  const pieces = [];

  if (signals.length > 0) pieces.push(`signals: ${signals.join(', ')}`);
  if (restricted > 0) pieces.push(`restricted imports: ${restricted}`);
  if (row.blockingRestrictedImports.length > 0) pieces.push(`blocking imports: ${row.blockingRestrictedImports.length}`);
  if (row.traceTruncated) pieces.push('trace truncated');

  return pieces.length > 0 ? pieces.join('; ') : 'static-friendly';
}

fs.mkdirSync(reportDir, { recursive: true });
const rows = buildAudit();
fs.writeFileSync(jsonReportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2)}\n`);
fs.writeFileSync(mdReportPath, renderMarkdown(rows));

console.log(`Wrote ${toRepoPath(jsonReportPath)}`);
console.log(`Wrote ${toRepoPath(mdReportPath)}`);
console.log(`Planned public candidates: ${rows.filter(row => row.status === 'planned-public-next-candidate').length}`);
