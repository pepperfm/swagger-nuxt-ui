import type { OpenApiComponents, OpenApiSchemaObject } from '~/types/types'

export function generateExampleFromSchema(
  schema: OpenApiSchemaObject | undefined,
  components: OpenApiComponents = {},
): unknown {
  if (!schema || typeof schema !== 'object') {
    return null
  }

  if (schema.example !== undefined) {
    return schema.example
  }
  if (schema.default !== undefined) {
    return schema.default
  }

  if (schema.$ref) {
    const ref = schema.$ref.replace('#/components/schemas/', '')
    const resolved = components?.schemas?.[ref]
    if (resolved) {
      return generateExampleFromSchema(resolved, components)
    }
  }

  if (schema.allOf) {
    return schema.allOf.reduce<Record<string, unknown>>((acc, part) => {
      const partExample = generateExampleFromSchema(part, components)
      return {
        ...acc,
        ...(typeof partExample === 'object' && partExample ? partExample as Record<string, unknown> : {}),
      }
    }, {})
  }

  if (schema.oneOf) {
    return generateExampleFromSchema(schema.oneOf[0], components)
  }

  if (schema.anyOf) {
    return schema.anyOf.reduce<Record<string, unknown>>((acc, part) => {
      const partExample = generateExampleFromSchema(part, components)
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
        result[key] = generateExampleFromSchema(propSchema, components)
      }
      return result
    }
    case 'array':
      return [generateExampleFromSchema(schema.items, components)]
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
}
