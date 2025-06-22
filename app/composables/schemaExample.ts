export function generateExampleFromSchema(schema: any, components: Record<string, any> = {}): any {
  if (!schema || typeof schema !== 'object') return null

  if (schema.example !== undefined) return schema.example
  if (schema.default !== undefined) return schema.default

  if (schema.$ref) {
    const ref = schema.$ref.replace('#/components/schemas/', '')
    const resolved = components?.schemas?.[ref]
    if (resolved) return generateExampleFromSchema(resolved, components)
  }

  if (schema.allOf) {
    return schema.allOf.reduce((acc: any, part: any) => {
      const partExample = generateExampleFromSchema(part, components)
      return { ...acc, ...partExample }
    }, {})
  }

  if (schema.oneOf) {
    return generateExampleFromSchema(schema.oneOf[0], components)
  }

  if (schema.anyOf) {
    return schema.anyOf.reduce((acc: any, part: any) => {
      const partExample = generateExampleFromSchema(part, components)
      return { ...acc, ...partExample }
    }, {})
  }

  switch (schema.type) {
    case 'object': {
      const result: Record<string, any> = {}
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
