#!/usr/bin/env zx

import { existsSync, readFileSync } from 'fs'
import { parse as parseDotEnv } from 'dotenv'

const firebaseClientEnvPairs = [
    ['VITE_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY'],
    ['VITE_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
    ['VITE_FIREBASE_DATABASE_URL', 'NEXT_PUBLIC_FIREBASE_DATABASE_URL'],
    ['VITE_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
    ['VITE_FIREBASE_STORAGE_BUCKET', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'],
    ['VITE_FIREBASE_MESSAGING_SENDER_ID', 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
    ['VITE_FIREBASE_APP_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID'],
    ['VITE_FIREBASE_MEASUREMENT_ID', 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID']
]

const requiredFirebaseClientEnvKeys = new Set([
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID'
])

const dotEnv = existsSync('.env') ? parseDotEnv(readFileSync('.env')) : {}
const missingFirebaseClientEnvKeys = []

for (const [viteKey, nextKey] of firebaseClientEnvPairs) {
    const value = process.env[viteKey] || process.env[nextKey] || dotEnv[viteKey] || dotEnv[nextKey]
    if (value && String(value).trim()) {
        process.env[viteKey] ||= String(value)
        process.env[nextKey] ||= String(value)
    } else if (requiredFirebaseClientEnvKeys.has(viteKey)) {
        missingFirebaseClientEnvKeys.push(`${viteKey}/${nextKey}`)
    }
}

console.log(chalk.blue('🚀 Starting CareerVivid Build Process...'))

try {
    if (missingFirebaseClientEnvKeys.length > 0) {
        throw new Error(`Missing Firebase client env vars: ${missingFirebaseClientEnvKeys.join(', ')}`)
    }

    console.log(chalk.yellow('\n📦 Building Vite App...'))
    await $`npm run build:vite`

    console.log(chalk.yellow('\n📦 Building and Exporting Next.js App...'))
    // Build next-app
    await $`cd next-app && npm run build`
    
    // Ensure dist/nextjs exists and is clean
    await $`mkdir -p dist/nextjs`
    await $`rm -rf dist/nextjs/*`
    
    // Copy exported static files to dist/nextjs
    // Next.js static export outputs to 'out' directory by default when output: 'export' is set
    await $`cp -r next-app/out/* dist/nextjs/`

    console.log(chalk.green('\n✅ Build completed successfully!'))
} catch (p) {
    console.error(chalk.red(`\n❌ Build failed with exit code: ${p?.exitCode ?? 'Unknown'}`))
    process.exit(1)
}
