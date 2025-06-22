<script setup lang="ts">
import type { IMethod, ResponseExample } from '~/types/types'

const props = defineProps<{
  method: IMethod | undefined
  components?: Record<string, any>
}>()

function generateExampleFromSchema(schema: any, components: Record<string, any> = {}): any {
  if (!schema || typeof schema !== 'object') return null

  if (schema.example !== undefined) return schema.example
  if (schema.default !== undefined) return schema.default

  if (schema.$ref) {
    const ref = schema.$ref.replace('#/components/schemas/', '')
    const resolved = components.schemas?.[ref]
    if (resolved) return generateExampleFromSchema(resolved, components)
  }

  if (schema.allOf) {
    const resolvedSchemas = schema.allOf.map((part: any) =>
      generateExampleFromSchema(part, components)
    )

    const merged = Object.assign({}, ...resolvedSchemas)

    if (typeof merged === 'object' && merged.data !== undefined) {
      return {
        status: 'OK',
        message: '',
        ...merged
      }
    }

    return merged
  }

  if (schema.oneOf) return generateExampleFromSchema(schema.oneOf[0], components)
  if (schema.anyOf) return generateExampleFromSchema(schema.anyOf[0], components)

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
      return undefined
  }
}

const examples = computed<ResponseExample[]>(() => {
  if (!props.method?.responses) return []

  return Object.entries(props.method.responses).map(([status, response]) => {
    const content = response.content?.['application/json']
    if (!content) return null

    const schema = content.schema
    const explicitExample = content.example || schema?.example

    return {
      status,
      description: response.description,
      example: explicitExample ?? generateExampleFromSchema(schema, props.components ?? {})
    }
  }).filter((item): item is ResponseExample => item !== null)
})

const getBadgeColor = (status: string): 'primary' | 'warning' | 'error' => {
  const code = parseInt(status)
  if (code >= 200 && code < 300) return 'primary'
  if (code >= 400 && code < 500) return 'warning'
  if (code >= 500) return 'error'
  return 'primary'
}

const selectedStatus = ref<string | null>(null)
watch(() => props.method, () => {
  selectedStatus.value = examples.value[0]?.status ?? null
}, { immediate: true })
</script>

<template>
  <div v-if="examples.length">
    <USeparator label="Responses" />

    <div class="flex flex-wrap gap-2 mb-2">
      <UBadge
        v-for="item in examples"
        :key="item.status"
        :color="getBadgeColor(item.status)"
        size="lg"
        class="cursor-pointer"
        :variant="selectedStatus === item.status ? 'solid' : 'soft'"
        @click="selectedStatus = item.status"
      >
        {{ item.status }}
      </UBadge>
    </div>

    <div
      v-for="item in examples"
      v-show="item.status === selectedStatus"
      :key="item.status + '-example'"
    >
      <p class="text-md text-muted-foreground mb-1">
        {{ item.description }}
      </p>
      <pre
        v-if="item.example !== undefined"
        class="text-xs font-mono whitespace-pre-wrap rounded p-2 overflow-auto max-h-120 bg-muted text-muted-foreground"
      >{{ JSON.stringify(item.example, null, 2) }}</pre>
    </div>
  </div>
</template>
