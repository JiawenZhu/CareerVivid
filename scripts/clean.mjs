#!/usr/bin/env zx

/**
 * Smart Cleanup Script for CareerVivid
 * Uses Google `zx` to intelligently clean build caches, bloated temporary 
 * folders, and optimize the `.git` repository.
 */

import { chalk, fs, $ } from 'zx';

// Directories safely delete to reclaim space
const CACHE_DIRS = [
    'node_modules/.vite',
    'dist',
    'dist-extension',
    'build',
    '.cache',
    'functions/lib',
    'functions/firebase-tmp' // The 29GB culprit
];

console.log(chalk.bold.blue('\n🧹 Starting CareerVivid Smart Cache Cleanup...\n'));

// 1. Clean File Directories
console.log(chalk.bold.white('📂 Cleaning Build & Temp Directories...'));

let reclaimedDirs = 0;
for (const dir of CACHE_DIRS) {
    if (await fs.pathExists(dir)) {
        console.log(chalk.gray(`  Removing ${dir}...`));
        await fs.remove(dir);
        reclaimedDirs++;
    }
}

if (reclaimedDirs === 0) {
    console.log(chalk.green('  ✓ Directories are already clean!'));
} else {
    console.log(chalk.green(`  ✓ Removed ${reclaimedDirs} cache directories.`));
}

// 2. Git Garbage Collection (Prunes bloated git timeline objects)
console.log(chalk.bold.white('\n📦 Optimizing Git Repository...'));
try {
    // Check if we are in a git repository before running git commands
    if (await fs.pathExists('.git')) {
        console.log(chalk.gray('  Running git gc --prune=now...'));
        await $`git gc --prune=now`;

        console.log(chalk.gray('  Repacking git database...'));
        await $`git repack -a -d --depth=250 --window=250`;
        console.log(chalk.green('  ✓ Git repository optimized!'));
    } else {
        console.log(chalk.yellow('  ⚠ Not a git repository. Skipping git optimization.'));
    }
} catch (error) {
    console.error(chalk.red('\n❌ Failed to optimize git repository:'), error.message);
}

console.log(chalk.bold.green('\n✨ Cleanup Complete! Your workspace is fresh and optimized.\n'));
