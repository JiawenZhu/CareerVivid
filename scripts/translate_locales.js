
import fs from 'fs';
import path from 'path';
import { v2 } from '@google-cloud/translate';
import { fileURLToPath } from 'url';

const { Translate } = v2;

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCALES_DIR = path.join(__dirname, '../public/locales');
const SOURCE_LANG = 'en';

const TARGET_LANGS = [
  'zh', 'es', 'hi', 'ar', 'pt', 'bn', 'ru', 'ja', 'pa', 'de', 'jv', 'fr', 'te', 'vi', 'ko', 'mr', 'ta', 'ur', 'tr', 'it', 'yue', 'th', 'gu', 'fa', 'pl', 'uk', 'ro', 'nl', 'hu', 'el', 'sv', 'cs', 'he', 'da', 'fi'
];

const TERMS_TO_PRESERVE = [
  'Google Workspace',
  'Microsoft Office',
  'REST APIs',
  'REST API',
  'ChromeOS',
  'TypeScript',
  'JavaScript',
  'Kubernetes',
  'ServiceNow',
  'Salesforce',
  'Next.js',
  'Node.js',
  'macOS',
  'Windows',
  'Linux',
  'Android',
  'React',
  'Docker',
  'Python',
  'Figma',
  'Jira',
  'Azure',
  'AWS',
  'GCP',
  'API',
  'SQL',
  'WLAN',
  'LAN',
  'Wi-Fi',
  'VPN',
  'IAM',
  'CI/CD',
  'ATS',
  'UI/UX',
  'HTML/CSS',
  'PDF',
  'DOCX',
  'Chrome',
  'iOS',
];

// Initialize Google Translate
// Ensure you have set GOOGLE_APPLICATION_CREDENTIALS env var or provided keyfile
const translate = new Translate();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const protectNaturalTerms = (value) => {
  const terms = [];
  let content = String(value);

  TERMS_TO_PRESERVE.forEach((term) => {
    const pattern = new RegExp(`(^|[^A-Za-z0-9])(${escapeRegExp(term)})(?=$|[^A-Za-z0-9])`, 'g');
    content = content.replace(pattern, (_match, prefix, matchedTerm) => {
      const index = terms.push(matchedTerm) - 1;
      return `${prefix}__CVVID_TERM_${index}__`;
    });
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

const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
};

const unflattenObject = (data) => {
  const result = {};
  for (const i in data) {
    const keys = i.split('.');
    keys.reduce((acc, value, idx) => {
      return acc[value] || (acc[value] = (isNaN(Number(keys[idx + 1])) ? (keys.length - 1 === idx ? data[i] : {}) : []));
    }, result);
  }
  return result;
};

const processTranslations = async () => {
  console.log(`Reading source file from ${SOURCE_LANG}...`);
  
  const sourcePath = path.join(LOCALES_DIR, SOURCE_LANG, 'translation.json');
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    process.exit(1);
  }

  const sourceContent = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const flattenedSource = flattenObject(sourceContent);
  const keys = Object.keys(flattenedSource);
  const values = Object.values(flattenedSource);
  const protectedValues = values.map(protectNaturalTerms);

  console.log(`Found ${keys.length} keys to translate.`);

  for (const lang of TARGET_LANGS) {
    console.log(`Translating to ${lang}...`);
    
    try {
      const targetDir = path.join(LOCALES_DIR, lang);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Google Translate API supports array of strings
      // Note: In production, might need to batch this if > 128 strings
      let [translations] = await translate.translate(protectedValues.map((item) => item.content), lang);
      
      // Ensure translations is an array (if single string sent, it returns string)
      translations = Array.isArray(translations) ? translations : [translations];

      const flattenedTranslated = {};
      keys.forEach((key, index) => {
        flattenedTranslated[key] = restoreNaturalTerms(translations[index], protectedValues[index]);
      });

      const unflattened = unflattenObject(flattenedTranslated);
      
      fs.writeFileSync(
        path.join(targetDir, 'translation.json'), 
        JSON.stringify(unflattened, null, 2)
      );
      
      console.log(`Generated ${lang} successfully.`);
    } catch (error) {
      console.error(`Error translating to ${lang}:`, error.message);
    }
  }
  
  console.log('Translation generation complete!');
};

processTranslations();
