#!/usr/bin/env zx

console.log(chalk.blue('🧩 Building CareerVivid Extension...'))

try {
    const tempDir = 'dist-extension-temp'
    const distExt = 'dist-extension'

    // Clean temp directory if it exists
    await fs.remove(tempDir)

    // Build to temp directory
    await $`vite build --config vite.extension.config.ts --outDir ${tempDir}`

    console.log(chalk.yellow('\n📁 Preparing Extension Assets...'))

    await fs.copy('public/manifest.json', `${tempDir}/manifest.json`)
    await fs.copy('public/icons', `${tempDir}/icons`)
    await fs.copy('public/content.css', `${tempDir}/content.css`)
    await fs.move(`${tempDir}/index.extension.html`, `${tempDir}/index.html`, { overwrite: true })

    console.log(chalk.yellow('\n🔄 Atomically replacing dist-extension...'))
    await fs.remove(distExt)
    await fs.move(tempDir, distExt)

    console.log(chalk.green('\n✅ Extension build completed successfully!'))
} catch (p) {
    console.error(chalk.red(`\n❌ Extension build failed: ${p?.message ?? p}`))
    process.exit(1)
}

