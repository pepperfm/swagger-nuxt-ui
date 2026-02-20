import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { detectLaravelProject } from './lib/detect-laravel.mjs'
import { runCommand } from './lib/run-command.mjs'

const DEFAULT_BRIDGE_PACKAGE = 'pepperfm/swagger-ui-laravel-bridge'

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

function resolveComposerCommand() {
  return process.platform === 'win32' ? 'composer.bat' : 'composer'
}

/**
 * @param {{ projectRoot?: string, packageName?: string }} [options]
 */
export async function installLaravelBridge(options = {}) {
  const projectRoot = options.projectRoot ?? process.env.INIT_CWD ?? process.cwd()
  const packageName = options.packageName ?? process.env.SWAGGER_UI_BRIDGE_PACKAGE ?? DEFAULT_BRIDGE_PACKAGE
  const strictMode = isStrictMode()

  if (isSkippedByEnv()) {
    console.warn('[swagger-ui] WARN Laravel bridge install skipped by SWAGGER_UI_SKIP_LARAVEL_BRIDGE=1')
    return { ok: true, skipped: true }
  }

  const detection = detectLaravelProject(projectRoot)
  if (!detection.isLaravel) {
    return { ok: true, skipped: true }
  }

  if (hasBridgeInComposer(projectRoot, packageName)) {
    return { ok: true, skipped: true }
  }

  const composerCommand = resolveComposerCommand()
  const composerCheck = await runCommand(composerCommand, ['--version'], { cwd: projectRoot })
  if (!composerCheck.ok) {
    console.warn('[swagger-ui] WARN composer is unavailable, Laravel bridge was not installed')
    return { ok: !strictMode, skipped: true, reason: 'composer_unavailable' }
  }

  const requireResult = await runCommand(
    composerCommand,
    ['require', packageName, '--no-interaction', '--no-ansi'],
    { cwd: projectRoot },
  )

  if (!requireResult.ok) {
    console.error('[swagger-ui] ERROR Failed to install Laravel bridge package')
    if (requireResult.stderr.trim()) {
      console.error(`[swagger-ui] ERROR ${requireResult.stderr.trim()}`)
    }

    return { ok: !strictMode, skipped: true, reason: 'composer_require_failed' }
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
