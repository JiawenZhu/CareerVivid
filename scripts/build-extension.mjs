#!/usr/bin/env zx

console.log(chalk.blue('🧩 Building CareerVivid Extension...'))

const chromeWebStoreDescription = 'Autofill applications, save roles, tailor resumes, and practice interviews with CareerVivid.'
const developmentOrigins = new Set([
    'http://localhost/*',
    'http://127.0.0.1/*'
])

const stripDevelopmentOrigins = (value) => {
    if (Array.isArray(value)) {
        return value.filter((entry) => !developmentOrigins.has(entry))
    }

    return value
}

const prepareStoreManifest = async (sourcePath, targetPath) => {
    const manifest = await fs.readJson(sourcePath)

    manifest.description = chromeWebStoreDescription
    manifest.host_permissions = stripDevelopmentOrigins(manifest.host_permissions)

    if (manifest.externally_connectable?.matches) {
        manifest.externally_connectable.matches = stripDevelopmentOrigins(manifest.externally_connectable.matches)
    }

    if (Array.isArray(manifest.content_scripts)) {
        manifest.content_scripts = manifest.content_scripts.map((contentScript) => ({
            ...contentScript,
            matches: stripDevelopmentOrigins(contentScript.matches)
        }))
    }

    await fs.writeJson(targetPath, manifest, { spaces: 2 })
}

try {
    const tempDir = 'dist-extension-temp'
    const distExt = 'dist-extension'

    // Clean temp directory if it exists
    await fs.remove(tempDir)

    // Build to temp directory
    await $`vite build --config vite.extension.config.ts --outDir ${tempDir}`

    console.log(chalk.yellow('\n📁 Preparing Extension Assets...'))

    await prepareStoreManifest('public/manifest.json', `${tempDir}/manifest.json`)
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
