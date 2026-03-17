#!/usr/bin/env zx

console.log(chalk.blue('🚀 Starting CareerVivid Build Process...'))

try {
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
