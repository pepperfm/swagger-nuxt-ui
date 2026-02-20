import type { IApiSpec } from '../types'
import { ref } from 'vue'

export interface SwaggerSchemaLoadError {
  code: 'missing_source' | 'invalid_schema' | 'fetch_error'
  message: string
}

export interface SwaggerSchemaSourceStrategy {
  defaultSource?: string
  fetcher?: (source: string) => Promise<unknown>
}

function isValidOpenApiSchema(payload: unknown): payload is IApiSpec {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const typedPayload = payload as Partial<IApiSpec>
  return typeof typedPayload.openapi === 'string' && typeof typedPayload.paths === 'object'
}

async function defaultFetcher(source: string): Promise<unknown> {
  const response = await fetch(source)
  if (!response.ok) {
    throw new Error(`Schema request failed with status ${response.status}`)
  }

  return response.json()
}

export function useSwaggerSchema(strategy: SwaggerSchemaSourceStrategy = {}) {
  const defaultSource = strategy.defaultSource ?? '/api/swagger-ui'
  const fetcher = strategy.fetcher ?? defaultFetcher

  const schema = ref<IApiSpec | null>(null)
  const isLoading = ref(false)
  const loadError = ref<SwaggerSchemaLoadError | null>(null)

  async function loadSchema(source: string = defaultSource) {
    isLoading.value = true
    loadError.value = null

    if (!source.trim()) {
      console.warn('[useSwaggerSchema] Schema source is missing')
      loadError.value = {
        code: 'missing_source',
        message: 'Schema source is missing.',
      }
      schema.value = null
      isLoading.value = false
      return false
    }

    try {
      const payload = await fetcher(source)
      if (!isValidOpenApiSchema(payload)) {
        console.warn('[useSwaggerSchema] Invalid schema payload received')
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
      console.error('[useSwaggerSchema] Failed to load schema', error)
      loadError.value = {
        code: 'fetch_error',
        message: 'Failed to load OpenAPI schema.',
      }
      schema.value = null
      isLoading.value = false
      return false
    }
  }

  return {
    schema,
    isLoading,
    loadError,
    loadSchema,
    defaultSource,
  }
}
