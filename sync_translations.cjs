const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'public/locales');
const languages = ['es', 'zh', 'ko', 'de', 'ja', 'fr'];
const masterLang = 'en';

const masterPath = path.join(localesDir, masterLang, 'translation.json');
const masterContent = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

function syncKeys(source, target) {
    const output = { ...target };

    Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
            if (!(key in target)) {
                output[key] = source[key]; // Add entire object
            } else {
                output[key] = syncKeys(source[key], target[key]); // Recurse
            }
        } else {
            if (!(key in target)) {
                output[key] = source[key]; // Add missing key with English value
            }
        }
    });

    return output;
}

languages.forEach(lang => {
    const langPath = path.join(localesDir, lang, 'translation.json');
    if (fs.existsSync(langPath)) {
        const langContent = JSON.parse(fs.readFileSync(langPath, 'utf8'));
        const finalContent = syncKeys(masterContent, langContent);

        fs.writeFileSync(langPath, JSON.stringify(finalContent, null, 2));
        console.log(`Updated ${lang}`);
    } else {
        console.log(`File not found: ${langPath}`);
    }
});
