import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { installLaravelBridge } from './install-laravel-bridge.mjs'
import { runCommand } from './lib/run-command.mjs'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(scriptDir, '..')

function isRepositoryDevelopmentContext() {
  return existsSync(join(packageRoot, 'nuxt.config.ts'))
    && existsSync(join(packageRoot, 'app'))
    && existsSync(join(packageRoot, 'server'))
}

async function runNuxtPrepare() {
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const result = await runCommand(npxCommand, ['nuxt', 'prepare'], { cwd: packageRoot })

  if (!result.ok) {
    console.error('[swagger-ui] ERROR Failed to run nuxt prepare in repository context')
    if (result.stderr.trim()) {
      console.error(`[swagger-ui] ERROR ${result.stderr.trim()}`)
    }
  }
}

if (isRepositoryDevelopmentContext()) {
  await runNuxtPrepare()
}

const bridgeResult = await installLaravelBridge()
if (!bridgeResult.ok) {
  process.exit(1)
}
