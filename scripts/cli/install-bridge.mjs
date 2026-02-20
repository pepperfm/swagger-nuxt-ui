#!/usr/bin/env node

import process from 'node:process'
import { installLaravelBridge } from '../install-laravel-bridge.mjs'

/**
 * @param {string[]} args
 */
function parseArgs(args) {
  /** @type {{ projectRoot?: string, packageName?: string, strictMode?: boolean, localPath?: string, versionConstraint?: string }} */
  const options = {}

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]

    if (arg === '--strict') {
      options.strictMode = true
      continue
    }

    if (arg === '--project-root' && args[i + 1]) {
      options.projectRoot = args[i + 1]
      i += 1
      continue
    }

    if (arg === '--package' && args[i + 1]) {
      options.packageName = args[i + 1]
      i += 1
      continue
    }

    if (arg === '--path' && args[i + 1]) {
      options.localPath = args[i + 1]
      i += 1
      continue
    }

    if (arg === '--constraint' && args[i + 1]) {
      options.versionConstraint = args[i + 1]
      i += 1
      continue
    }
  }

  return options
}

const options = parseArgs(process.argv.slice(2))
const result = await installLaravelBridge(options)

if (!result.ok) {
  process.exit(1)
}

if (result.installed) {
  console.info('[swagger-ui] Laravel bridge installed')
}
