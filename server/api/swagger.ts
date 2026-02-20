import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { createError } from 'h3'

const LOCAL_SCHEMA_FILE = resolve(process.cwd(), 'resources/api-docs/api-docs.json')

export default defineEventHandler(async () => {
  let fileContent = ''

  try {
    fileContent = await readFile(LOCAL_SCHEMA_FILE, 'utf-8')
  } catch (error) {
    console.warn('[server/api/swagger] Local schema file is missing', { file: LOCAL_SCHEMA_FILE })
    throw createError({
      statusCode: 404,
      statusMessage: 'OpenAPI schema file not found',
      message: 'Expected schema file at resources/api-docs/api-docs.json',
      cause: error,
    })
  }

  try {
    return JSON.parse(fileContent)
  } catch (error) {
    console.error('[server/api/swagger] Failed to parse local schema file', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Invalid OpenAPI schema JSON',
      message: 'Schema file is not valid JSON',
      cause: error,
    })
  }
})
