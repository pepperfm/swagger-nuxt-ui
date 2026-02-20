import { useSwaggerSchema } from '~~/lib/composables/useSwaggerSchema'

export function useOpenApiSchema() {
  const state = useSwaggerSchema({ defaultSource: '/api/swagger-ui' })

  return {
    schema: state.schema,
    isLoading: state.isLoading,
    loadError: state.loadError,
    loadSchema: state.loadSchema,
    defaultSchemaEndpoint: state.defaultSource,
  }
}
