import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * @param {string} projectRoot
 */
export function detectLaravelProject(projectRoot) {
  const hasComposerJson = existsSync(join(projectRoot, 'composer.json'))
  const hasArtisan = existsSync(join(projectRoot, 'artisan'))
  const hasBootstrapApp = existsSync(join(projectRoot, 'bootstrap', 'app.php'))

  return {
    isLaravel: hasComposerJson && hasArtisan && hasBootstrapApp,
    hasComposerJson,
    hasArtisan,
    hasBootstrapApp,
  }
}
