#!/usr/bin/env zx

console.log(chalk.blue('🧩 Building CareerVivid Extension...'))

try {
    await $`vite build --config vite.extension.config.ts`

    console.log(chalk.yellow('\n📁 Copying Extension Assets...'))
    const distExt = 'dist-extension'

    await fs.copy('public/manifest.json', `${distExt}/manifest.json`)
    await fs.copy('public/icons', `${distExt}/icons`)
    await fs.copy('public/content.css', `${distExt}/content.css`)
    await fs.move(`${distExt}/index.extension.html`, `${distExt}/index.html`, { overwrite: true })

    console.log(chalk.green('\n✅ Extension build completed successfully!'))
} catch (p) {
    console.error(chalk.red(`\n❌ Extension build failed with exit code: ${p?.exitCode ?? 'Unknown'}`))
    process.exit(1)
}
