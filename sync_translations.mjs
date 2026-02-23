#!/usr/bin/env zx

const localesDir = path.join(process.cwd(), 'public/locales');
const languages = ['es', 'zh', 'ko', 'de', 'ja', 'fr'];
const masterLang = 'en';

const masterPath = path.join(localesDir, masterLang, 'translation.json');

// fs-extra is globally exposed as 'fs' in zx
const masterContent = await fs.readJson(masterPath);

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

console.log(chalk.blue('Syncing translations...'));

for (const lang of languages) {
    const langPath = path.join(localesDir, lang, 'translation.json');
    if (await fs.pathExists(langPath)) {
        const langContent = await fs.readJson(langPath);
        const finalContent = syncKeys(masterContent, langContent);

        await fs.writeJson(langPath, finalContent, { spaces: 2 });
        console.log(chalk.green(`✅ Updated ${lang}`));
    } else {
        console.log(chalk.red(`❌ File not found: ${langPath}`));
    }
}

console.log(chalk.blue('\nRunning git status to show changed locales...'));
try {
    // We can run shell commands easily with $``
    await $`git status -s public/locales`;
} catch (p) {
    // If there are no changes, or git error, we can handle it
    console.log(chalk.gray('No changes to track or git error.'));
}
