import type { OpenApiComponents, OpenApiSchemaObject } from '../types'

const MAX_SCHEMA_EXAMPLE_DEPTH = 40

interface ExampleGenerationState {
  depth: number
  nodeStack: WeakSet<object>
  refStack: Set<string>
}

function nextState(state: ExampleGenerationState): ExampleGenerationState {
  return {
    depth: state.depth + 1,
    nodeStack: state.nodeStack,
    refStack: state.refStack,
  }
}

function generateExampleInternal(
  schema: OpenApiSchemaObject | undefined,
  components: OpenApiComponents,
  state: ExampleGenerationState,
): unknown {
  if (!schema || typeof schema !== 'object') {
    return null
  }

  if (state.depth > MAX_SCHEMA_EXAMPLE_DEPTH) {
    console.warn('[generateExampleFromSchema] Maximum recursion depth reached', {
      depth: state.depth,
    })
    return null
  }

  if (state.nodeStack.has(schema)) {
    // Circular schema nodes are valid in OpenAPI; stop recursion silently.
    return null
  }

  state.nodeStack.add(schema)

  try {
    if (schema.example !== undefined) {
      return schema.example
    }
    if (schema.default !== undefined) {
      return schema.default
    }

    if (schema.$ref) {
      const ref = schema.$ref.replace('#/components/schemas/', '')
      if (state.refStack.has(ref)) {
        // Circular refs are expected in some specs; avoid noisy WARN logs.
        return null
      }

      const resolved = components?.schemas?.[ref]
      if (resolved) {
        state.refStack.add(ref)
        try {
          return generateExampleInternal(resolved, components, nextState(state))
        } finally {
          state.refStack.delete(ref)
        }
      }
    }

    if (schema.allOf) {
      return schema.allOf.reduce<Record<string, unknown>>((acc, part) => {
        const partExample = generateExampleInternal(part, components, nextState(state))
        return {
          ...acc,
          ...(typeof partExample === 'object' && partExample ? partExample as Record<string, unknown> : {}),
        }
      }, {})
    }

    if (schema.oneOf && schema.oneOf.length > 0) {
      return generateExampleInternal(schema.oneOf[0], components, nextState(state))
    }

    if (schema.anyOf) {
      return schema.anyOf.reduce<Record<string, unknown>>((acc, part) => {
        const partExample = generateExampleInternal(part, components, nextState(state))
        return {
          ...acc,
          ...(typeof partExample === 'object' && partExample ? partExample as Record<string, unknown> : {}),
        }
      }, {})
    }

    switch (schema.type) {
      case 'object': {
        const result: Record<string, unknown> = {}
        const props = schema.properties || {}
        for (const [key, propSchema] of Object.entries(props)) {
          result[key] = generateExampleInternal(propSchema, components, nextState(state))
        }
        return result
      }
      case 'array':
        return [generateExampleInternal(schema.items, components, nextState(state))]
      case 'string':
        return schema.format === 'date-time' ? new Date().toISOString() : 'string'
      case 'number':
      case 'integer':
        return 123
      case 'boolean':
        return true
      default:
        return null
    }
  } finally {
    state.nodeStack.delete(schema)
  }
}

export function generateExampleFromSchema(
  schema: OpenApiSchemaObject | undefined,
  components: OpenApiComponents = {},
): unknown {
  return generateExampleInternal(schema, components, {
    depth: 0,
    nodeStack: new WeakSet<object>(),
    refStack: new Set<string>(),
  })
}
