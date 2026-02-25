import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const sourceDir = join(process.cwd(), 'dist/viewer')
const targetDir = join(process.cwd(), 'resources/assets')
const requiredFiles = ['viewer.js', 'viewer.css']

for (const fileName of requiredFiles) {
  const sourceFile = join(sourceDir, fileName)
  if (!existsSync(sourceFile)) {
    console.error(`[swagger-ui] ERROR Missing viewer build artifact: ${sourceFile}`)
    process.exit(1)
  }
}

rmSync(targetDir, { recursive: true, force: true })
mkdirSync(targetDir, { recursive: true })

for (const fileName of requiredFiles) {
  copyFileSync(join(sourceDir, fileName), join(targetDir, fileName))
}

console.info('[swagger-ui] Bridge viewer assets synced to resources/assets')
