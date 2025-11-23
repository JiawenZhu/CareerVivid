
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

// Initialize Google Translate
// Ensure you have set GOOGLE_APPLICATION_CREDENTIALS env var or provided keyfile
const translate = new Translate();

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
      let [translations] = await translate.translate(values, lang);
      
      // Ensure translations is an array (if single string sent, it returns string)
      translations = Array.isArray(translations) ? translations : [translations];

      const flattenedTranslated = {};
      keys.forEach((key, index) => {
        flattenedTranslated[key] = translations[index];
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
