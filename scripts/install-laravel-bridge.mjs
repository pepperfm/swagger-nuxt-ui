import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { detectLaravelProject } from './lib/detect-laravel.mjs'
import { runCommand } from './lib/run-command.mjs'

const DEFAULT_BRIDGE_PACKAGE = 'pepperfm/swagger-ui-laravel-bridge'
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const EMBEDDED_BRIDGE_PATH = resolve(SCRIPT_DIR, '../packages/l5-swagger-ui-bridge')

function isStrictMode() {
  return process.env.SWAGGER_UI_BRIDGE_STRICT === '1'
}

function isSkippedByEnv() {
  return process.env.SWAGGER_UI_SKIP_LARAVEL_BRIDGE === '1'
}

/**
 * @param {string} projectRoot
 * @param {string} packageName
 */
function hasBridgeInComposer(projectRoot, packageName) {
  const composerFile = join(projectRoot, 'composer.json')
  if (!existsSync(composerFile)) {
    return false
  }

  try {
    const composerJson = JSON.parse(readFileSync(composerFile, 'utf8'))
    const requires = composerJson.require ?? {}
    const requiresDev = composerJson['require-dev'] ?? {}

    return Object.hasOwn(requires, packageName) || Object.hasOwn(requiresDev, packageName)
  } catch {
    return false
  }
}

/**
 * @param {string} projectRoot
 * @param {string} packageName
 */
function hasPathRepositoryForPackage(projectRoot, packageName) {
  const composer = readComposerJson(projectRoot)
  if (!composer) {
    return false
  }

  const repositories = composer.data.repositories
  const repositoryKey = `${packageName.replaceAll('/', '-')}-local`

  /**
   * @param {unknown} candidate
   */
  const isPathRepository = (candidate) => {
    return Boolean(candidate)
      && typeof candidate === 'object'
      && candidate.type === 'path'
  }

  if (Array.isArray(repositories)) {
    return repositories.some(isPathRepository)
  }

  if (!repositories || typeof repositories !== 'object') {
    return false
  }

  if (isPathRepository(repositories[repositoryKey])) {
    return true
  }

  return Object.values(repositories).some(isPathRepository)
}

function resolveComposerCommand() {
  return process.platform === 'win32' ? 'composer.bat' : 'composer'
}

/**
 * @param {string} projectRoot
 */
function readComposerJson(projectRoot) {
  const composerFile = join(projectRoot, 'composer.json')
  if (!existsSync(composerFile)) {
    return null
  }

  try {
    return {
      composerFile,
      data: JSON.parse(readFileSync(composerFile, 'utf8')),
    }
  } catch {
    return null
  }
}

/**
 * @param {string} message
 * @param {{ packageName: string, localPath?: string, constraint?: string }} context
 */
function printComposerDiagnostics(message, context) {
  const normalized = message.trim()
  if (!normalized) {
    return
  }

  console.error(`[swagger-ui] ERROR ${normalized}`)

  const lowered = normalized.toLowerCase()
  if (lowered.includes('minimum-stability') || lowered.includes('matching version')) {
    console.warn('[swagger-ui] WARN Composer rejected the version constraint. Try --constraint @dev for local path installs.')
  }

  if (lowered.includes('scope not found') || lowered.includes('not found')) {
    console.warn('[swagger-ui] WARN Package is not available in registry for this token. Use --path for local bridge development.')
  }

  if (context.localPath) {
    console.warn(`[swagger-ui] WARN Local bridge path mode is active: ${context.localPath}`)
  }
}

/**
 * @param {string} projectRoot
 * @param {string} packageName
 * @param {string} packagePath
 */
function setComposerPathRepository(projectRoot, packageName, packagePath) {
  const composer = readComposerJson(projectRoot)
  if (!composer) {
    return { ok: false, reason: 'composer_json_unavailable' }
  }

  const repositoryKey = `${packageName.replaceAll('/', '-')}-local`
  const repositoryConfig = {
    type: 'path',
    url: packagePath,
    options: {
      symlink: false,
    },
  }

  const nextComposerJson = { ...composer.data }
  const repositories = nextComposerJson.repositories

  if (Array.isArray(repositories)) {
    const alreadyConfigured = repositories.some((item) => {
      if (!item || typeof item !== 'object') {
        return false
      }

      return item.type === 'path' && item.url === packagePath
    })

    if (!alreadyConfigured) {
      nextComposerJson.repositories = [...repositories, repositoryConfig]
    }
  } else {
    const repositoryMap = repositories && typeof repositories === 'object'
      ? { ...repositories }
      : {}

    repositoryMap[repositoryKey] = repositoryConfig
    nextComposerJson.repositories = repositoryMap
  }

  writeFileSync(composer.composerFile, `${JSON.stringify(nextComposerJson, null, 2)}\n`)
  return { ok: true }
}

/**
 * @param {string} projectRoot
 * @param {string} inputPath
 */
function resolvePathArgument(projectRoot, inputPath) {
  if (!inputPath.trim()) {
    return null
  }

  return isAbsolute(inputPath) ? inputPath : resolve(projectRoot, inputPath)
}

/**
 * @param {string} packagePath
 * @param {string} packageName
 */
function validateBridgePackagePath(packagePath, packageName) {
  if (!existsSync(packagePath)) {
    return { ok: false, reason: 'bridge_path_missing' }
  }

  const bridgeComposerFile = join(packagePath, 'composer.json')
  if (!existsSync(bridgeComposerFile)) {
    return { ok: false, reason: 'bridge_composer_missing' }
  }

  try {
    const bridgeComposer = JSON.parse(readFileSync(bridgeComposerFile, 'utf8'))
    const bridgeName = typeof bridgeComposer.name === 'string' ? bridgeComposer.name : ''
    if (bridgeName && bridgeName !== packageName) {
      return { ok: false, reason: 'bridge_package_name_mismatch', bridgeName }
    }
  } catch {
    return { ok: false, reason: 'bridge_composer_invalid' }
  }

  return { ok: true }
}

/**
 * @param {string} composerCommand
 * @param {string} projectRoot
 * @param {string} packageSpec
 */
function runComposerRequire(composerCommand, projectRoot, packageSpec) {
  return runCommand(
    composerCommand,
    ['require', packageSpec, '--no-interaction', '--no-ansi'],
    { cwd: projectRoot },
  )
}

/**
 * @param {{ projectRoot?: string, packageName?: string, strictMode?: boolean, localPath?: string, versionConstraint?: string }} [options]
 */
export async function installLaravelBridge(options = {}) {
  const projectRoot = options.projectRoot ?? process.env.INIT_CWD ?? process.cwd()
  const packageName = options.packageName ?? process.env.SWAGGER_UI_BRIDGE_PACKAGE ?? DEFAULT_BRIDGE_PACKAGE
  const strictMode = options.strictMode ?? isStrictMode()
  const localPathArgument = options.localPath ?? process.env.SWAGGER_UI_BRIDGE_PATH ?? ''
  const localPath = localPathArgument ? resolvePathArgument(projectRoot, localPathArgument) : null
  const embeddedBridgePath = existsSync(join(EMBEDDED_BRIDGE_PATH, 'composer.json')) ? EMBEDDED_BRIDGE_PATH : null
  const preferredPath = localPath ?? embeddedBridgePath
  const usesEmbeddedPath = !localPath && Boolean(preferredPath)
  const forceFailureOnError = strictMode || Boolean(localPath)
  const requestedConstraint = options.versionConstraint ?? process.env.SWAGGER_UI_BRIDGE_CONSTRAINT ?? ''

  if (isSkippedByEnv()) {
    console.warn('[swagger-ui] WARN Laravel bridge install skipped by SWAGGER_UI_SKIP_LARAVEL_BRIDGE=1')
    return { ok: true, skipped: true }
  }

  const detection = detectLaravelProject(projectRoot)
  if (!detection.isLaravel) {
    console.warn('[swagger-ui] WARN Laravel project markers were not found, bridge install skipped', detection)
    return { ok: true, skipped: true }
  }

  const installedInComposer = hasBridgeInComposer(projectRoot, packageName)
  const hasPathRepositoryConfigured = hasPathRepositoryForPackage(projectRoot, packageName)
  let pathRepositoryReady = hasPathRepositoryConfigured

  if (preferredPath) {
    const validation = validateBridgePackagePath(preferredPath, packageName)
    if (!validation.ok) {
      const sourceLabel = localPath ? 'local bridge path' : 'embedded bridge path'
      console.error(`[swagger-ui] ERROR Invalid ${sourceLabel} (${validation.reason})`)
      if (validation.reason === 'bridge_package_name_mismatch') {
        console.error(`[swagger-ui] ERROR Expected package ${packageName}, got ${validation.bridgeName}`)
      }

      if (localPath) {
        return { ok: !forceFailureOnError, skipped: true, reason: validation.reason }
      }
    }

    if (validation.ok) {
      const repositorySetup = setComposerPathRepository(projectRoot, packageName, preferredPath)
      if (!repositorySetup.ok) {
        console.error('[swagger-ui] ERROR Failed to configure composer path repository for local bridge')
        if (localPath) {
          return { ok: !forceFailureOnError, skipped: true, reason: repositorySetup.reason }
        }
      } else {
        pathRepositoryReady = true
        if (usesEmbeddedPath) {
          console.info('[swagger-ui] Embedded composer path repository configured for Laravel bridge')
        } else {
          console.info('[swagger-ui] Local composer path repository configured for Laravel bridge')
        }
      }
    }
  }

  const composerCommand = resolveComposerCommand()
  const composerCheck = await runCommand(composerCommand, ['--version'], { cwd: projectRoot })
  if (!composerCheck.ok) {
    console.warn('[swagger-ui] WARN composer is unavailable, Laravel bridge was not installed')
    return { ok: !forceFailureOnError, skipped: true, reason: 'composer_unavailable' }
  }

  if (installedInComposer) {
    if (!pathRepositoryReady) {
      return { ok: true, skipped: true }
    }

    const refreshResult = await runCommand(
      composerCommand,
      ['reinstall', packageName, '--no-interaction', '--no-ansi'],
      { cwd: projectRoot },
    )

    if (!refreshResult.ok) {
      console.error('[swagger-ui] ERROR Failed to refresh Laravel bridge package from path repository')
      printComposerDiagnostics(refreshResult.stderr, {
        packageName,
      })
      return { ok: !forceFailureOnError, skipped: true, reason: 'composer_refresh_failed' }
    }

    console.info('[swagger-ui] Laravel bridge refreshed from composer path repository')
    return { ok: true, installed: true, refreshed: true }
  }

  const versionConstraint = requestedConstraint || (pathRepositoryReady ? '@dev' : '')

  const packageSpec = versionConstraint ? `${packageName}:${versionConstraint}` : packageName
  const requireResult = await runComposerRequire(composerCommand, projectRoot, packageSpec)

  if (!requireResult.ok) {
    if (usesEmbeddedPath && pathRepositoryReady) {
      const registrySpec = requestedConstraint ? `${packageName}:${requestedConstraint}` : packageName
      console.warn('[swagger-ui] WARN Embedded path install failed, trying registry package')
      const registryResult = await runComposerRequire(composerCommand, projectRoot, registrySpec)
      if (registryResult.ok) {
        console.warn('[swagger-ui] WARN Bridge installed from registry after embedded-path attempt')
        return { ok: true, installed: true, fallback: 'registry' }
      }

      console.error('[swagger-ui] ERROR Failed to install Laravel bridge package (embedded path + registry)')
      printComposerDiagnostics(requireResult.stderr, {
        packageName,
        localPath: preferredPath ?? undefined,
        constraint: versionConstraint || undefined,
      })
      printComposerDiagnostics(registryResult.stderr, {
        packageName,
        constraint: requestedConstraint || undefined,
      })

      return { ok: !forceFailureOnError, skipped: true, reason: 'composer_require_failed' }
    }

    const canUseEmbeddedFallback = !localPath && Boolean(embeddedBridgePath) && !pathRepositoryReady

    if (canUseEmbeddedFallback) {
      console.warn('[swagger-ui] WARN Registry install failed, falling back to embedded local bridge package')

      const fallbackValidation = validateBridgePackagePath(embeddedBridgePath, packageName)
      if (fallbackValidation.ok) {
        const fallbackSetup = setComposerPathRepository(projectRoot, packageName, embeddedBridgePath)
        if (fallbackSetup.ok) {
          const fallbackConstraint = options.versionConstraint ?? process.env.SWAGGER_UI_BRIDGE_CONSTRAINT ?? '@dev'
          const fallbackSpec = `${packageName}:${fallbackConstraint}`
          const fallbackResult = await runComposerRequire(composerCommand, projectRoot, fallbackSpec)
          if (fallbackResult.ok) {
            console.warn('[swagger-ui] WARN Bridge installed from embedded path repository')
            return { ok: true, installed: true, fallback: 'embedded_path' }
          }

          console.error('[swagger-ui] ERROR Embedded bridge fallback install failed')
          printComposerDiagnostics(fallbackResult.stderr, {
            packageName,
            localPath: embeddedBridgePath,
            constraint: fallbackConstraint,
          })
        } else {
          console.error('[swagger-ui] ERROR Failed to configure embedded bridge path repository')
        }
      } else {
        console.error(`[swagger-ui] ERROR Embedded bridge package is invalid (${fallbackValidation.reason})`)
      }
    } else {
      console.error('[swagger-ui] ERROR Failed to install Laravel bridge package via composer')
      printComposerDiagnostics(requireResult.stderr, {
        packageName,
        localPath: preferredPath ?? undefined,
        constraint: versionConstraint || undefined,
      })
    }

    return { ok: !forceFailureOnError, skipped: true, reason: 'composer_require_failed' }
  }

  return { ok: true, installed: true }
}

const isDirectRun = process.argv[1]?.endsWith('install-laravel-bridge.mjs')
if (isDirectRun) {
  const result = await installLaravelBridge()
  if (!result.ok) {
    process.exit(1)
  }
}
