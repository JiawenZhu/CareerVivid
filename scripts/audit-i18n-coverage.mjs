import fs from 'fs';
import path from 'path';

const ROOTS = ['src/pages', 'src/components', 'src/features'];
const IGNORED_PARTS = [
  '.test.',
  '.spec.',
  '.stories.',
  '.backup',
  '/templates/',
  '/node_modules/',
];

const TEXT_NODE_PATTERN = />\s*([^<>{}\n][^<>{}]*)\s*</g;
const ATTRIBUTE_PATTERN = /\b(aria-label|title|placeholder|alt)\s*=\s*["']([^"']*[A-Za-z][^"']*)["']/g;
const PRESERVED_EXACT_TEXT = new Set(['CareerVivid', 'GitHub']);
const SOURCE_LOCALE_PATH = path.join(process.cwd(), 'public/locales/en/translation.json');

const normalizeAutoText = (value) =>
  String(value)
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();

const hashAutoText = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `k_${(hash >>> 0).toString(36)}`;
};

const readAutoTextKeys = () => {
  if (!fs.existsSync(SOURCE_LOCALE_PATH)) return new Set();
  const locale = JSON.parse(fs.readFileSync(SOURCE_LOCALE_PATH, 'utf8'));
  return new Set(Object.keys(locale.auto_text || {}));
};

const autoTextKeys = readAutoTextKeys();

const isCoveredByAutoText = (value) =>
  autoTextKeys.has(hashAutoText(normalizeAutoText(value)));

const isCodeLike = (value) =>
  /^(true|false|null|undefined)$/i.test(value) ||
  /^[a-z0-9_]+$/.test(value) ||
  /^[A-Z0-9_]+$/.test(value) ||
  /^https?:\/\//.test(value) ||
  /^[A-Za-z0-9._%+-]+@example\.com$/i.test(value) ||
  /^#[A-Fa-f0-9]{3,8}$/.test(value) ||
  /^[./#?&=:_%@-]+$/.test(value) ||
  /\b(const|let|var|return|useState|useRef|useMemo|useCallback|Record|React\.FC|Promise|Dispatch|SetStateAction)\b/.test(value) ||
  /[{};]/.test(value) ||
  /&&|\|\|/.test(value) ||
  /=>/.test(value) ||
  /^\)\s*:/.test(value) ||
  /\)\s*\./.test(value) ||
  isTailwindClassLike(value);

const isTailwindClassLike = (value) => {
  const tokens = value.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return false;

  const utilityTokens = tokens.filter((token) =>
    /^(?:(?:dark|hover|focus|active|disabled|sm|md|lg|xl|2xl|group-hover|peer-focus):)*!?-?(?:m[trblxy]?|p[trblxy]?|text|bg|border|rounded|flex|grid|hidden|block|inline|items|justify|content|gap|space|w|h|min-w|min-h|max-w|max-h|shadow|transition|duration|ease|opacity|z|top|left|right|bottom|absolute|relative|sticky|fixed|overflow|font|leading|tracking|object|aspect|col|row|translate|scale|rotate|animate|ring|divide|cursor|select|whitespace|break|truncate|line-clamp|backdrop|blur|stroke|fill|container|mx|my|px|py)(?:$|-|\[)/.test(token)
  ).length;

  return utilityTokens / tokens.length > 0.65;
};

const isUserVisibleText = (value) => {
  const text = value
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();

  if (text.length < 3) return false;
  if (PRESERVED_EXACT_TEXT.has(text)) return false;
  if (!/[A-Za-z]/.test(text)) return false;
  if (isCodeLike(text)) return false;
  if (/^[{}()[\].,;:+*/\\|-]+$/.test(text)) return false;
  return true;
};

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    const normalized = absolute.replaceAll(path.sep, '/');

    if (IGNORED_PARTS.some((part) => normalized.includes(part))) return [];
    if (entry.isDirectory()) return walk(absolute);
    if (!/\.(tsx|ts)$/.test(entry.name)) return [];
    return [absolute];
  });
};

const lineNumberForIndex = (content, index) =>
  content.slice(0, index).split('\n').length;

const scanFile = (file) => {
  const content = fs.readFileSync(file, 'utf8');
  const hits = [];

  for (const match of content.matchAll(TEXT_NODE_PATTERN)) {
    const text = match[1].replace(/\s+/g, ' ').trim();
    if (isUserVisibleText(text) && !isCoveredByAutoText(text)) {
      hits.push({
        kind: 'text',
        line: lineNumberForIndex(content, match.index || 0),
        text,
      });
    }
  }

  for (const match of content.matchAll(ATTRIBUTE_PATTERN)) {
    const text = match[2].replace(/\s+/g, ' ').trim();
    if (isUserVisibleText(text) && !isCoveredByAutoText(text)) {
      hits.push({
        kind: match[1],
        line: lineNumberForIndex(content, match.index || 0),
        text,
      });
    }
  }

  return {
    file,
    hasI18nHook: /useTranslation\s*\(/.test(content),
    hasTranslationCalls: /\bt\s*\(\s*['"`]/.test(content),
    hits,
  };
};

const files = ROOTS.flatMap(walk).sort();
const scanned = files.map(scanFile);
const withHits = scanned.filter((item) => item.hits.length > 0);

const summary = {
  scannedFiles: scanned.length,
  filesWithHardcodedText: withHits.length,
  totalHardcodedTextHits: withHits.reduce((sum, item) => sum + item.hits.length, 0),
  filesUsingI18n: scanned.filter((item) => item.hasI18nHook || item.hasTranslationCalls).length,
};

const topFiles = withHits
  .map((item) => ({
    file: path.relative(process.cwd(), item.file),
    hardcodedHits: item.hits.length,
    hasI18n: item.hasI18nHook || item.hasTranslationCalls,
    examples: item.hits.slice(0, 5),
  }))
  .sort((a, b) => b.hardcodedHits - a.hardcodedHits || a.file.localeCompare(b.file));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ summary, topFiles }, null, 2));
} else {
  console.log('CareerVivid i18n coverage audit');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`auto_text fallback entries: ${autoTextKeys.size}`);
  console.log('\nTop files with hardcoded user-visible text:');
  topFiles.slice(0, 40).forEach((item, index) => {
    const i18nStatus = item.hasI18n ? 'partial-i18n' : 'no-i18n';
    console.log(`${index + 1}. ${item.file} - ${item.hardcodedHits} hits (${i18nStatus})`);
    item.examples.forEach((hit) => {
      console.log(`   L${hit.line} ${hit.kind}: ${hit.text}`);
    });
  });
}
