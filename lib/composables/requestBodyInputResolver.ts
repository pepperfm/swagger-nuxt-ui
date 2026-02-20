import type {
  OpenApiComponents,
  OpenApiSchemaObject,
  RequestBodyFormInput,
  RequestBodyFormResolutionResult,
} from '../types'
import { resolveParameterInputSpec } from './requestParameterInputResolver'

const ROOT_PATH = '$'

interface ResolverState {
  refStack: Set<string>
  nodeStack: Set<OpenApiSchemaObject>
  warnings: Set<string>
}

function warnOnce(state: ResolverState, message: string) {
  state.warnings.add(message)
}

function stripRefPrefix(ref: string): string {
  return ref.replace('#/components/schemas/', '')
}

function mergeSchemas(base: OpenApiSchemaObject, next: OpenApiSchemaObject): OpenApiSchemaObject {
  const mergedProperties = {
    ...(base.properties ?? {}),
    ...(next.properties ?? {}),
  }

  const baseRequired = Array.isArray(base.required) ? base.required : []
  const nextRequired = Array.isArray(next.required) ? next.required : []

  return {
    ...base,
    ...next,
    properties: Object.keys(mergedProperties).length > 0 ? mergedProperties : undefined,
    required: [...new Set([...baseRequired, ...nextRequired])],
  }
}

function withRefOverlay(schema: OpenApiSchemaObject, resolved: OpenApiSchemaObject): OpenApiSchemaObject {
  const overlay = { ...schema }
  delete overlay.$ref
  return mergeSchemas(resolved, overlay)
}

function resolveSchemaNode(
  schema: OpenApiSchemaObject | undefined,
  components: OpenApiComponents,
  state: ResolverState,
): OpenApiSchemaObject {
  if (!schema || typeof schema !== 'object') {
    return {}
  }

  if (state.nodeStack.has(schema)) {
    warnOnce(state, '[requestBodyInputResolver] Circular schema node detected; skipping nested traversal')
    return {}
  }

  state.nodeStack.add(schema)

  try {
    if (schema.$ref) {
      const ref = stripRefPrefix(schema.$ref)
      if (state.refStack.has(ref)) {
        warnOnce(state, `[requestBodyInputResolver] Circular $ref detected for "${ref}"`)
        return {}
      }

      const target = components.schemas?.[ref]
      if (!target) {
        warnOnce(state, `[requestBodyInputResolver] $ref target not found for "${ref}"`)
        return { ...schema, $ref: undefined }
      }

      state.refStack.add(ref)
      const resolved = resolveSchemaNode(target, components, state)
      state.refStack.delete(ref)
      return withRefOverlay(schema, resolved)
    }

    if (schema.allOf?.length) {
      return schema.allOf
        .map(part => resolveSchemaNode(part, components, state))
        .reduce<OpenApiSchemaObject>((acc, part) => mergeSchemas(acc, part), mergeSchemas({}, schema))
    }

    if (schema.oneOf?.length) {
      warnOnce(state, '[requestBodyInputResolver] oneOf detected, first variant will be used for form inputs')
      return mergeSchemas(schema, resolveSchemaNode(schema.oneOf[0], components, state))
    }

    if (schema.anyOf?.length) {
      warnOnce(state, '[requestBodyInputResolver] anyOf detected, first variant will be used for form inputs')
      return mergeSchemas(schema, resolveSchemaNode(schema.anyOf[0], components, state))
    }

    return schema
  } finally {
    state.nodeStack.delete(schema)
  }
}

function normalizeSchemaType(schema: OpenApiSchemaObject): string {
  if (typeof schema.type === 'string' && schema.type.trim()) {
    return schema.type
  }

  if (schema.properties && Object.keys(schema.properties).length > 0) {
    return 'object'
  }

  if (schema.items) {
    return 'array'
  }

  return 'string'
}

function normalizeLabel(path: string): string {
  if (path === ROOT_PATH) {
    return 'Body'
  }

  const segment = path.split('.').at(-1) ?? path
  const normalized = segment
    .replace(/\[\d+\]/g, '')
    .replace(/\[\]$/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized || 'Item'
}

function appendArrayIndex(path: string, index: number): string {
  if (!path) {
    return `[${index}]`
  }

  return `${path}[${index}]`
}

function toBodyInput(path: string, schema: OpenApiSchemaObject, required: boolean): RequestBodyFormInput {
  const spec = resolveParameterInputSpec({
    name: path,
    in: 'query',
    required,
    schema,
    description: schema.description,
  }, 'query')

  return {
    key: path,
    path,
    label: normalizeLabel(path),
    description: schema.description ?? '',
    required,
    nullable: Boolean(schema.nullable),
    spec,
    seed: schema.default ?? schema.example,
  }
}

function walkSchema(options: {
  schema: OpenApiSchemaObject
  path: string
  required: boolean
  components: OpenApiComponents
  state: ResolverState
  collector: RequestBodyFormInput[]
}) {
  const {
    schema,
    path,
    required,
    components,
    state,
    collector,
  } = options
  const resolved = resolveSchemaNode(schema, components, state)
  const schemaType = normalizeSchemaType(resolved)

  if (schemaType === 'object') {
    const properties = resolved.properties ?? {}
    const entries = Object.entries(properties)
    if (!entries.length) {
      warnOnce(state, `[requestBodyInputResolver] Object body at "${path || ROOT_PATH}" has no properties; form controls skipped`)
      return
    }

    const requiredKeys = new Set(Array.isArray(resolved.required) ? resolved.required : [])
    entries.forEach(([name, node]) => {
      const nextPath = path ? `${path}.${name}` : name
      walkSchema({
        schema: node,
        path: nextPath,
        required: requiredKeys.has(name) && required,
        components,
        state,
        collector,
      })
    })
    return
  }

  if (schemaType === 'array' && resolved.items) {
    const itemNode = resolveSchemaNode(resolved.items, components, state)
    const itemType = normalizeSchemaType(itemNode)
    if (itemType === 'object') {
      const nestedPath = appendArrayIndex(path, 0)
      walkSchema({
        schema: itemNode,
        path: nestedPath,
        required,
        components,
        state,
        collector,
      })
      return
    }
  }

  collector.push(toBodyInput(path || ROOT_PATH, resolved, required))
}

export function resolveRequestBodyFormInputs(
  schema: OpenApiSchemaObject | undefined,
  components: OpenApiComponents,
): RequestBodyFormResolutionResult {
  const state: ResolverState = {
    refStack: new Set(),
    nodeStack: new Set(),
    warnings: new Set(),
  }

  if (!schema || typeof schema !== 'object') {
    return {
      inputs: [],
      warnings: [],
    }
  }

  const inputs: RequestBodyFormInput[] = []
  walkSchema({
    schema,
    path: '',
    required: true,
    components,
    state,
    collector: inputs,
  })

  return {
    inputs,
    warnings: [...state.warnings],
  }
}
