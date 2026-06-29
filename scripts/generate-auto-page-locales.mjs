import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 } from '@google-cloud/translate';

const { Translate } = v2;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(ROOT_DIR, 'public/locales');
const TERM_PROTECTION_PATH = path.join(ROOT_DIR, 'functions/src/translationTermProtection.ts');

const ROOTS = ['src/pages', 'src/components', 'src/features'];
const TARGET_LANGS = ['es', 'fr', 'de', 'ja', 'ko', 'zh'];
const GOOGLE_LANG = {
  es: 'es',
  fr: 'fr',
  de: 'de',
  ja: 'ja',
  ko: 'ko',
  zh: 'zh-CN',
};

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
const STRING_LITERAL_PATTERN = /(["'`])((?:\\.|(?!\1)[^\\\n]){3,})\1/g;
const PRESERVED_EXACT_TEXT = new Set(['CareerVivid', 'GitHub']);

const translate = new Translate();

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

const isTailwindClassLike = (value) => {
  const tokens = value.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return false;

  const utilityTokens = tokens.filter((token) =>
    /^(?:(?:dark|hover|focus|active|disabled|sm|md|lg|xl|2xl|group-hover|peer-focus):)*!?-?(?:m[trblxy]?|p[trblxy]?|text|bg|border|rounded|flex|grid|hidden|block|inline|items|justify|content|gap|space|w|h|min-w|min-h|max-w|max-h|shadow|transition|duration|ease|opacity|z|top|left|right|bottom|absolute|relative|sticky|fixed|overflow|font|leading|tracking|object|aspect|col|row|translate|scale|rotate|animate|ring|divide|cursor|select|whitespace|break|truncate|line-clamp|backdrop|blur|stroke|fill|container|mx|my|px|py)(?:$|-|\[)/.test(token)
  ).length;

  return utilityTokens / tokens.length > 0.65;
};

const isCodeLike = (value) =>
  /^(true|false|null|undefined)$/i.test(value) ||
  /^[a-z0-9_]+$/.test(value) ||
  /^[A-Z0-9_]+$/.test(value) ||
  /^https?:\/\//.test(value) ||
  /^#[A-Fa-f0-9]{3,8}$/.test(value) ||
  /^[./#?&=:_%@-]+$/.test(value) ||
  /[{};]/.test(value) ||
  /&&|\|\|/.test(value) ||
  /=>/.test(value) ||
  /^\)\s*:/.test(value) ||
  /\)\s*\./.test(value) ||
  isTailwindClassLike(value);

const isUserVisibleText = (value) => {
  const text = normalizeAutoText(value);

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

const extractTermsToPreserve = () => {
  const source = fs.readFileSync(TERM_PROTECTION_PATH, 'utf8');
  const match = source.match(/const TERMS_TO_PRESERVE = \[([\s\S]*?)\];/);
  if (!match) return [];

  return Array.from(match[1].matchAll(/'((?:\\'|[^'])*)'/g))
    .map((item) => item[1].replace(/\\'/g, "'"))
    .sort((a, b) => b.length - a.length || a.localeCompare(b));
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const termsToPreserve = extractTermsToPreserve();
const termPattern = termsToPreserve.length
  ? new RegExp(`(^|[^A-Za-z0-9])(${termsToPreserve.map(escapeRegExp).join('|')})(?=$|[^A-Za-z0-9])`, 'g')
  : null;

const protectNaturalTerms = (value) => {
  const terms = [];
  const content = String(value).replace(termPattern, (_match, prefix, matchedTerm) => {
    const index = terms.push(matchedTerm) - 1;
    return `${prefix}__CVVID_TERM_${index}__`;
  });

  return { content, terms };
};

const restoreNaturalTerms = (value, protectedValue) => {
  let output = String(value);

  protectedValue.terms.forEach((term, index) => {
    const tokenPattern = new RegExp(`__\\s*CVVID[_\\s-]*TERM[_\\s-]*${index}\\s*__`, 'gi');
    output = output.replace(tokenPattern, term);
  });

  return output;
};

const extractTexts = () => {
  const texts = new Map();

  ROOTS.flatMap((root) => walk(path.join(ROOT_DIR, root))).forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (const match of content.matchAll(TEXT_NODE_PATTERN)) {
      const text = normalizeAutoText(match[1]);
      if (isUserVisibleText(text)) texts.set(hashAutoText(text), text);
    }

    for (const match of content.matchAll(ATTRIBUTE_PATTERN)) {
      const text = normalizeAutoText(match[2]);
      if (isUserVisibleText(text)) texts.set(hashAutoText(text), text);
    }

    for (const match of content.matchAll(STRING_LITERAL_PATTERN)) {
      const lineNumber = content.slice(0, match.index || 0).split('\n').length;
      const line = lines[lineNumber - 1] || '';
      if (/^\s*import\b/.test(line) || /\bclassName\s*=/.test(line)) continue;

      const text = normalizeAutoText(match[2]);
      if (isUserVisibleText(text)) texts.set(hashAutoText(text), text);
    }
  });

  return Object.fromEntries(
    Array.from(texts.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  );
};

const readLocale = (lang) => {
  const localePath = path.join(LOCALES_DIR, lang, 'translation.json');
  return JSON.parse(fs.readFileSync(localePath, 'utf8'));
};

const writeLocale = (lang, content) => {
  const localePath = path.join(LOCALES_DIR, lang, 'translation.json');
  fs.writeFileSync(localePath, `${JSON.stringify(content, null, 2)}\n`);
};

const chunk = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const translateAutoText = async (sourceAutoText, lang) => {
  const entries = Object.entries(sourceAutoText);
  const translated = {};

  for (const batch of chunk(entries, 80)) {
    const protectedBatch = batch.map(([, value]) => protectNaturalTerms(value));
    const [result] = await translate.translate(
      protectedBatch.map((item) => item.content),
      GOOGLE_LANG[lang] || lang,
    );
    const translatedValues = Array.isArray(result) ? result : [result];

    batch.forEach(([key], index) => {
      translated[key] = restoreNaturalTerms(translatedValues[index] || protectedBatch[index].content, protectedBatch[index]);
    });
  }

  return translated;
};

const main = async () => {
  const sourceAutoText = extractTexts();
  const english = readLocale('en');
  english.auto_text = sourceAutoText;
  writeLocale('en', english);

  console.log(`Generated en auto_text with ${Object.keys(sourceAutoText).length} entries.`);

  for (const lang of TARGET_LANGS) {
    const locale = readLocale(lang);
    console.log(`Translating auto_text to ${lang}...`);
    locale.auto_text = await translateAutoText(sourceAutoText, lang);
    writeLocale(lang, locale);
    console.log(`Generated ${lang} auto_text with ${Object.keys(locale.auto_text).length} entries.`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
