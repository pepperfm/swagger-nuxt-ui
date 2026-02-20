import type { ComputedRef, Ref } from 'vue'
import type {
  EndpointSelection,
  HttpMethod,
  IApiSpec,
  IMethod,
  INavigationItem,
  IParameter,
  NavigationIndex,
  OpenApiSchemaObject,
  SchemaSelection,
  SelectedItem,
} from '../types'
import { computed, ref } from 'vue'
import {
  extractOperationIdFromAnchor,
  extractSchemaNameFromAnchor,
  normalizeNavigationAnchor,
} from './navigationAnchor'

const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete']

function isHttpMethod(method: string): method is HttpMethod {
  return HTTP_METHODS.includes(method as HttpMethod)
}

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

function readIndexedNavigationItem(
  index: Record<string, INavigationItem>,
  key: string | null,
): INavigationItem | null {
  if (!key) {
    return null
  }

  return index[key] ?? index[key.toLowerCase()] ?? null
}

function getEndpointRecordByOperationId(
  paths: IApiSpec['paths'] | undefined,
  operationId: string,
): {
  url: string
  method: HttpMethod
  config: IMethod
} | null {
  if (!paths) {
    return null
  }

  for (const [url, methods] of Object.entries(paths)) {
    for (const [method, config] of Object.entries(methods ?? {})) {
      if (!isHttpMethod(method)) {
        continue
      }

      if (!config?.operationId || config.operationId !== operationId) {
        continue
      }

      return {
        url,
        method: method as HttpMethod,
        config,
      }
    }
  }

  return null
}

export function useSelectedOperation(options: {
  schema: Ref<IApiSpec | null>
  navigationIndex: ComputedRef<NavigationIndex>
}) {
  const { schema, navigationIndex } = options

  const selectedItem = ref<SelectedItem | null>(null)

  function clearSelection() {
    selectedItem.value = null
  }

  function selectNavigationItem(item: INavigationItem): boolean {
    const paths = schema.value?.paths
    const localSchemas = schema.value?.components?.schemas ?? {}

    if (item.method) {
      const endpointRecord = getEndpointRecordByOperationId(paths, item.operationId)
      if (!endpointRecord) {
        console.warn('[useSelectedOperation] Operation not found for selection', { operationId: item.operationId })
        return false
      }

      const endpoint: EndpointSelection = {
        type: 'endpoint',
        method: endpointRecord.method,
        url: endpointRecord.url,
        summary: endpointRecord.config.summary ?? undefined,
        description: item.description ?? endpointRecord.config.description ?? undefined,
        operationId: item.operationId,
        anchor: item.anchor,
      }

      selectedItem.value = endpoint
      return true
    }

    const currentSchema = localSchemas[item.title]
    if (!currentSchema) {
      console.warn('[useSelectedOperation] Schema not found for selection', { schema: item.title })
      return false
    }

    const schemaSelection: SchemaSelection = {
      type: 'schema',
      name: item.title,
      schema: currentSchema,
      operationId: item.operationId,
      anchor: item.anchor,
    }

    selectedItem.value = schemaSelection
    return true
  }

  function onSelect(item: INavigationItem) {
    selectNavigationItem(item)
  }

  function selectByAnchor(anchor: string): boolean {
    const normalizedAnchor = normalizeNavigationAnchor(anchor)
    if (!normalizedAnchor) {
      return false
    }

    const byAnchor = readIndexedNavigationItem(navigationIndex.value.byAnchor, normalizedAnchor)
    if (byAnchor) {
      return selectNavigationItem(byAnchor)
    }

    const schemaName = extractSchemaNameFromAnchor(normalizedAnchor)
    const bySchemaName = readIndexedNavigationItem(navigationIndex.value.bySchemaName, schemaName)
    if (bySchemaName) {
      return selectNavigationItem(bySchemaName)
    }

    const operationId = extractOperationIdFromAnchor(normalizedAnchor)
    const byOperationId = readIndexedNavigationItem(navigationIndex.value.byOperationId, operationId)
    if (byOperationId) {
      return selectNavigationItem(byOperationId)
    }

    return false
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

  const selectedAnchor = computed(() => selectedItem.value?.anchor ?? null)

  return {
    selectedItem,
    selectedAnchor,
    onSelect,
    selectByAnchor,
    clearSelection,
    getMethodConfig,
    getParameters,
    getRequestBodySchema,
    getSecurity,
  }
}
