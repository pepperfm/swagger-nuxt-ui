import type { ComputedRef, Ref } from 'vue'
import type {
  EndpointSelection,
  HttpMethod,
  IApiSpec,
  IMethod,
  INavigationGroup,
  INavigationItem,
  IParameter,
  OpenApiSchemaObject,
  SchemaSelection,
  SelectedItem,
} from '../types'
import { ref, watch } from 'vue'

function resolveSchemaRef(schema: IApiSpec | null, node: OpenApiSchemaObject | undefined): OpenApiSchemaObject | undefined {
  if (!node?.$ref) {
    return node
  }

  const ref = node.$ref.replace('#/components/schemas/', '')
  const resolved = schema?.components?.schemas?.[ref]
  if (!resolved) {
    console.warn('[useSelectedOperation] Request schema $ref target not found', { ref })
    return undefined
  }

  return resolved
}

function isObjectRecord(value: unknown): value is Record<string, OpenApiSchemaObject> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getMethodConfigByOperationId(paths: IApiSpec['paths'] | undefined, operationId: string): IMethod | undefined {
  if (!paths) {
    return undefined
  }

  for (const methods of Object.values(paths)) {
    for (const methodConfig of Object.values(methods)) {
      if (methodConfig?.operationId === operationId) {
        return methodConfig
      }
    }
  }

  return undefined
}

export function useSelectedOperation(options: {
  schema: Ref<IApiSpec | null>
  endpointNavigation: ComputedRef<INavigationGroup[]>
}) {
  const { schema, endpointNavigation } = options

  const selectedItem = ref<SelectedItem | null>(null)

  function onSelect(item: INavigationItem) {
    const paths = schema.value?.paths
    const localSchemas = schema.value?.components?.schemas ?? {}

    if (item.method) {
      if (!paths) {
        console.warn('[useSelectedOperation] Paths are not available for endpoint selection')
        return
      }

      for (const [url, methods] of Object.entries(paths)) {
        const methodConfig = methods?.[item.method as HttpMethod]
        if (methodConfig?.operationId === item.operationId) {
          const endpoint: EndpointSelection = {
            type: 'endpoint',
            method: item.method,
            url,
            summary: methodConfig.summary ?? undefined,
            description: item.description ?? methodConfig.description ?? undefined,
            operationId: item.operationId,
          }

          selectedItem.value = endpoint
          return
        }
      }

      console.warn('[useSelectedOperation] Operation not found for selection', { operationId: item.operationId })
      return
    }

    const currentSchema = localSchemas[item.title]
    if (!currentSchema) {
      console.warn('[useSelectedOperation] Schema not found for selection', { schema: item.title })
      return
    }

    const schemaSelection: SchemaSelection = {
      type: 'schema',
      name: item.title,
      schema: currentSchema,
      operationId: item.operationId,
    }

    selectedItem.value = schemaSelection
  }

  function getMethodConfig(operationId: string): IMethod | undefined {
    return getMethodConfigByOperationId(schema.value?.paths, operationId)
  }

  function getParameters(operationId: string): IParameter[] {
    const config = getMethodConfig(operationId)
    if (!Array.isArray(config?.parameters)) {
      if (config?.parameters !== undefined) {
        console.warn('[useSelectedOperation] Endpoint parameters are not an array', { operationId })
      }
      return []
    }

    return config.parameters.map(param => ({
      name: param.name,
      in: param.in,
      type: param.schema?.type ?? param.type ?? 'any',
      required: param.required ?? false,
      description: param.description ?? '',
      schema: param.schema,
    }))
  }

  function getRequestBodySchema(operationId: string): Record<string, OpenApiSchemaObject> | null {
    const config = getMethodConfig(operationId)
    const body = config?.requestBody
    if (!body) {
      return null
    }

    const json = body.content?.['application/json']
      ?? body.content?.['multipart/form-data']
      ?? body.content?.['application/x-www-form-urlencoded']

    const requestSchema = resolveSchemaRef(schema.value, json?.schema)
    if (!isObjectRecord(requestSchema?.properties)) {
      return null
    }

    return requestSchema.properties
  }

  function getSecurity(operationId: string): string | null {
    const config = getMethodConfig(operationId)
    const security = config?.security
    if (!security || !Array.isArray(security)) {
      return null
    }

    const firstSecurity = security[0]
    if (!firstSecurity) {
      return null
    }

    return Object.keys(firstSecurity)[0] || null
  }

  watch(endpointNavigation, (groups) => {
    if (selectedItem.value || !groups.length) {
      return
    }

    const firstOperation = groups[0]?.children?.[0]
    if (firstOperation) {
      onSelect(firstOperation)
    }
  }, { immediate: true })

  return {
    selectedItem,
    onSelect,
    getMethodConfig,
    getParameters,
    getRequestBodySchema,
    getSecurity,
  }
}
