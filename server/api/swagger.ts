import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { createError } from 'h3'

export default defineEventHandler(async () => {
  const runtimeConfig = useRuntimeConfig()
  const schemaSource = String(runtimeConfig.swaggerSchemaSource ?? '').trim()

  if (!schemaSource) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Swagger schema source is not configured',
      message: 'Set runtimeConfig.swaggerSchemaSource (NUXT_SWAGGER_SCHEMA_SOURCE).',
    })
  }

  if (schemaSource.startsWith('http://') || schemaSource.startsWith('https://')) {
    try {
      const response = await fetch(schemaSource, {
        headers: {
          accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[server/api/swagger] Failed to load schema from configured URL', {
        source: schemaSource,
        error: error instanceof Error ? error.message : error,
      })
      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to fetch OpenAPI schema',
        message: `Cannot fetch schema from ${schemaSource}`,
        cause: error,
      })
    }
  }

  let fileContent = ''
  const localSchemaFile = resolve(process.cwd(), schemaSource)

  try {
    fileContent = await readFile(localSchemaFile, 'utf-8')
  } catch (error) {
    console.warn('[server/api/swagger] Configured schema file is missing', { file: localSchemaFile })
    throw createError({
      statusCode: 404,
      statusMessage: 'OpenAPI schema file not found',
      message: `Expected schema file at ${localSchemaFile}`,
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
