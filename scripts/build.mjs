#!/usr/bin/env zx

console.log(chalk.blue('🚀 Starting CareerVivid Build Process...'))

try {
    console.log(chalk.yellow('\n📦 Building Vite App...'))
    await $`npm run build:vite`

    console.log(chalk.green('\n✅ Build completed successfully!'))
} catch (p) {
    console.error(chalk.red(`\n❌ Build failed with exit code: ${p?.exitCode ?? 'Unknown'}`))
    process.exit(1)
}
