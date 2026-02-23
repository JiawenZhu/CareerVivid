#!/usr/bin/env zx

console.log(chalk.blue('🚀 Starting CareerVivid Build Process...'))

try {
    console.log(chalk.yellow('\n📦 Step 1: Building Vite App (Careervivid)'))
    await $`npm run build:vite`

    console.log(chalk.yellow('\n📦 Step 2: Building Next.js App (careervivid-next)'))
    await $`cd ../careervivid-next && npm run build`

    console.log(chalk.yellow('\n📦 Step 3: Building NFC Card Service'))
    await $`cd ../services/client_website_nfc_card && npm run build`

    console.log(chalk.yellow('\n📁 Step 4: Assembling Build Artifacts in dist/'))

    // Next.js copy
    const distNextjs = 'dist/nextjs'
    await fs.emptyDir(distNextjs) // Ensures directory exists and is empty
    await fs.copy('../careervivid-next/out', distNextjs)

    // Copying specific Next.js files to main dist root
    await fs.copy(`${distNextjs}/_next`, 'dist/_next')
    await fs.copy(`${distNextjs}/embed.js`, 'dist/embed.js')

    // NFC copy
    const distNfc = 'dist/services/client_website_nfc_card'
    await fs.ensureDir(distNfc)
    await fs.copy('../services/client_website_nfc_card/out', distNfc)

    console.log(chalk.green('\n✅ All builds completed successfully!'))
} catch (p) {
    console.error(chalk.red(`\n❌ Build failed with exit code: ${p?.exitCode ?? 'Unknown'}`))
    process.exit(1)
}
