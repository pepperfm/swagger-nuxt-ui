import type { IApiSpec } from '~/types/types'
import { ref } from 'vue'

interface SchemaLoadError {
  code: 'missing_source' | 'invalid_schema' | 'fetch_error'
  message: string
}

const DEFAULT_SCHEMA_ENDPOINT = '/api/swagger'

const schema = ref<IApiSpec | null>(null)
const isLoading = ref(false)
const loadError = ref<SchemaLoadError | null>(null)

function isValidOpenApiSchema(payload: unknown): payload is IApiSpec {
  if (!payload || typeof payload !== 'object') {
    return false
  }
  const typedPayload = payload as Partial<IApiSpec>
  return typeof typedPayload.openapi === 'string' && typeof typedPayload.paths === 'object'
}

async function loadSchema(source: string = DEFAULT_SCHEMA_ENDPOINT) {
  isLoading.value = true
  loadError.value = null

  if (!source.trim()) {
    console.warn('[useOpenApiSchema] Schema source is missing')
    loadError.value = {
      code: 'missing_source',
      message: 'Schema source is missing.',
    }
    schema.value = null
    isLoading.value = false
    return false
  }

  try {
    const response = await fetch(source)
    if (!response.ok) {
      throw new Error(`Schema request failed with status ${response.status}`)
    }

    const payload: unknown = await response.json()
    if (!isValidOpenApiSchema(payload)) {
      console.warn('[useOpenApiSchema] Invalid schema payload received')
      loadError.value = {
        code: 'invalid_schema',
        message: 'Invalid OpenAPI schema payload.',
      }
      schema.value = null
      isLoading.value = false
      return false
    }

    schema.value = payload
    isLoading.value = false
    return true
  } catch (error) {
    console.error('[useOpenApiSchema] Failed to load schema', error)
    loadError.value = {
      code: 'fetch_error',
      message: 'Failed to load OpenAPI schema.',
    }
    schema.value = null
    isLoading.value = false
    return false
  }
}

export function useOpenApiSchema() {
  return {
    schema,
    isLoading,
    loadError,
    loadSchema,
    defaultSchemaEndpoint: DEFAULT_SCHEMA_ENDPOINT,
  }
}
