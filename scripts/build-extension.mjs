#!/usr/bin/env zx

const distExt = 'dist-extension'
const tempDir = 'dist-extension-temp'
const sourceExt = process.env.CAREERVIVID_EXTENSION_SOURCE || ''

const chromeWebStoreDescription = 'Autofill applications, save roles, tailor resumes, and practice interviews with CareerVivid.'
const developmentOrigins = new Set([
  'http://localhost/*',
  'http://127.0.0.1/*'
])

const requiredManifest = {
  name: 'CareerVivid - Job Tracker & AI Career Coach',
  version: '3.1.1'
}

const requiredBundleStrings = [
  'Tailor resume',
  'Practice',
  'Dashboard',
  'HYDRATE_AUTH',
  'GENERATE_AI_ANSWERS',
  'CREATE_TRANSIT_DOC',
  'SYNC_PROFILE'
]

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

async function assertPathExists(path, message) {
  if (!(await fs.pathExists(path))) throw new Error(message)
}

async function assertPngIcon(iconPath) {
  await assertPathExists(iconPath, `Missing extension icon at ${iconPath}`)
  const signature = await fs.readFile(iconPath)
  const isPng = signature.length >= 8 &&
    signature[0] === 0x89 &&
    signature[1] === 0x50 &&
    signature[2] === 0x4e &&
    signature[3] === 0x47 &&
    signature[4] === 0x0d &&
    signature[5] === 0x0a &&
    signature[6] === 0x1a &&
    signature[7] === 0x0a
  if (!isPng) throw new Error(`Extension icon is not a PNG file: ${iconPath}`)
}

async function pruneExtensionBuild(extensionDir) {
  const allowedRootEntries = new Set([
    'index.html',
    'manifest.json',
    'background.js',
    'content.js',
    'content.css',
    'assets',
    'icons',
    'avatars',
  ])

  const entries = await fs.readdir(extensionDir)
  await Promise.all(entries.map(async (entry) => {
    if (!allowedRootEntries.has(entry)) {
      await fs.remove(path.join(extensionDir, entry))
    }
  }))

  await Promise.all([
    fs.remove(path.join(extensionDir, 'assets/resume-banner.png')),
    fs.remove(path.join(extensionDir, 'assets/templates')),
  ])
}

async function assertJobTrackerBundle(extensionDir) {
  const manifestPath = path.join(extensionDir, 'manifest.json')
  await assertPathExists(manifestPath, `Missing extension manifest at ${manifestPath}`)

  const manifest = await fs.readJson(manifestPath)
  if (manifest.name !== requiredManifest.name) {
    throw new Error(`Refusing to export wrong extension bundle. Expected "${requiredManifest.name}", found "${manifest.name || 'unknown'}".`)
  }
  if (manifest.version !== requiredManifest.version) {
    throw new Error(`Refusing to export unexpected extension version. Expected ${requiredManifest.version}, found ${manifest.version || 'unknown'}.`)
  }
  await Promise.all([
    assertPngIcon(path.join(extensionDir, 'icons/icon16.png')),
    assertPngIcon(path.join(extensionDir, 'icons/icon48.png')),
    assertPngIcon(path.join(extensionDir, 'icons/icon128.png')),
  ])
  await assertPathExists(path.join(extensionDir, manifest.side_panel?.default_path || 'index.html'), 'Missing extension side panel entrypoint.')
  await assertPathExists(path.join(extensionDir, 'avatars/careervivid-rabbit-glasses.jpg'), 'Missing CareerVivid fallback avatar asset.')
  await assertPathExists(path.join(extensionDir, 'avatars/careervivid-rabbit-bow.jpg'), 'Missing CareerVivid fallback avatar asset.')

  const assetsDir = path.join(extensionDir, 'assets')
  const files = await fs.readdir(assetsDir)
  const mainBundle = files.find((file) => /^main-.*\.js$/.test(file))
  if (!mainBundle) throw new Error(`Missing extension main bundle in ${assetsDir}`)

  const mainBundleText = await fs.readFile(path.join(assetsDir, mainBundle), 'utf8')
  const backgroundText = await fs.readFile(path.join(extensionDir, 'background.js'), 'utf8')
  const combined = `${mainBundleText}\n${backgroundText}`
  const missingStrings = requiredBundleStrings.filter((needle) => !combined.includes(needle))
  if (missingStrings.length > 0) {
    throw new Error(`Refusing to export incomplete extension bundle. Missing: ${missingStrings.join(', ')}`)
  }

  if (combined.includes('CareerVivid - Auto-Apply & AI Career Coach')) {
    throw new Error('Refusing to export the old Auto-Apply extension bundle.')
  }
}

console.log(chalk.blue('Building CareerVivid Chrome extension package...'))

try {
  await fs.remove(tempDir)

  if (!sourceExt) {
    console.log(chalk.yellow('Building extension from the current release source...'))
    await $`npx vite build --config vite.extension.config.ts --outDir ${tempDir}`

    await prepareStoreManifest('public/manifest.json', `${tempDir}/manifest.json`)
    await fs.copy('public/icons', `${tempDir}/icons`)
    await fs.copy('public/avatars', `${tempDir}/avatars`)
    await fs.copy('public/content.css', `${tempDir}/content.css`)
    await fs.move(`${tempDir}/index.extension.html`, `${tempDir}/index.html`, { overwrite: true })

    await pruneExtensionBuild(tempDir)
    await assertJobTrackerBundle(tempDir)

    console.log(chalk.yellow('Atomically replacing dist-extension...'))
    await fs.remove(distExt)
    await fs.move(tempDir, distExt)
    await assertJobTrackerBundle(distExt)
    console.log(chalk.green('Extension export completed successfully.'))
    process.exit(0)
  }

  await assertPathExists(sourceExt, `Missing source extension bundle at ${sourceExt}. Set CAREERVIVID_EXTENSION_SOURCE to a valid Job Tracker dist-extension path.`)
  await assertJobTrackerBundle(sourceExt)

  console.log(chalk.yellow(`Syncing verified extension bundle from ${sourceExt}...`))
  await fs.copy(sourceExt, tempDir)
  await assertJobTrackerBundle(tempDir)

  console.log(chalk.yellow('Atomically replacing dist-extension...'))
  await fs.remove(distExt)
  await fs.move(tempDir, distExt)
  await assertJobTrackerBundle(distExt)

  console.log(chalk.green('Extension export completed successfully.'))
} catch (p) {
  await fs.remove(tempDir)
  console.error(chalk.red(`Extension export failed: ${p?.message ?? p}`))
  process.exit(1)
}
