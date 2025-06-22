<script setup lang="ts">
import { computed, defineProps } from 'vue'
import { useClipboard } from '@vueuse/core'

import { UBadge, UAccordion, UPageCard } from '#components'

const props = defineProps<{
  schema: any
  components?: Record<string, any>
}>()

const toast = useToast()
const { copy } = useClipboard()

function copyContent(content: string) {
  copy(content)
  toast.add({
    title: 'Copied!',
    color: 'success',
    icon: 'i-lucide-copy',
    duration: 2000
  })
}

const getBadgeColor = (prop: any): 'error' | 'warning' | 'info' => {
  return prop.required
    ? 'error'
    : prop.nullable ? 'warning' : 'info'
}

function generateExampleFromSchema(schema: any, components: Record<string, any> = {}): any {
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

function mergeSchemas(schema: any, components: Record<string, any>): Record<string, any>[] {
  const resolve = (s: any): any => {
    if (s?.$ref) {
      const ref = s.$ref.replace('#/components/schemas/', '')
      return components.schemas?.[ref] ?? {}
    }
    return s
  }

  if (schema.anyOf || schema.oneOf) {
    const list = schema.anyOf ?? schema.oneOf
    return list.map(resolve)
  }

  if (schema.allOf) {
    const merged: Record<string, any> = {}
    for (const s of schema.allOf) {
      Object.assign(merged, resolve(s))
    }
    return [merged]
  }

  return [schema]
}

const example = computed(() => generateExampleFromSchema(props.schema, props.components ?? {}))
</script>

<template>
  <div v-if="schema">
    <h3 class="text-sm font-medium text-muted-foreground mb-2">
      Schema Example
    </h3>
    <pre
      class="text-xs font-mono whitespace-pre-wrap rounded p-2 overflow-auto max-h-120 bg-muted text-muted-foreground cursor-pointer mb-4"
      title="Click to copy example"
      @click="copyContent(JSON.stringify(example, null, 2))"
    >{{ JSON.stringify(example, null, 2) }}</pre>

    <div
      v-for="(variant, index) in mergeSchemas(schema, components ?? {})"
      :key="index"
    >
      <h3
        v-if="schema.anyOf || schema.oneOf"
        class="text-sm font-medium text-muted-foreground mb-2"
      >
        Variant {{ index + 1 }}
      </h3>
      <template v-if="variant.properties">
        <div
          v-for="(prop, name) in variant.properties"
          :key="name"
        >
          <UPageCard
            class="my-2"
            :style="{ marginLeft: `${0}rem` }"
          >
            <div
              class="flex justify-between items-center cursor-pointer"
              @click="copyContent(name)"
            >
              <div class="font-mono text-sm">
                {{ name }}
              </div>
              <UBadge
                class="uppercase"
                size="sm"
                variant="soft"
                :color="getBadgeColor(prop)"
              >
                {{ prop.format || prop.type || 'any' }}
              </UBadge>
            </div>

            <p
              v-if="prop.description"
              class="text-xs text-muted mt-1"
            >
              {{ prop.description }}
            </p>

            <p
              v-if="prop.format"
              class="text-xs text-muted mt-1"
            >
              Format: <code class="font-mono">{{ prop.format }}</code>
            </p>

            <div
              v-if="prop.enum?.length"
              class="text-xs text-muted mt-1 flex gap-1 flex-wrap items-center"
            >
              <span>Enum:</span>
              <UBadge
                v-for="(val, i) in prop.enum"
                :key="val + i"
                color="primary"
                variant="soft"
                size="sm"
              >
                {{ val }}
              </UBadge>
            </div>

            <p
              v-if="prop.minLength !== undefined || prop.maxLength !== undefined"
              class="text-xs text-muted mt-1"
            >
              <span v-if="prop.minLength !== undefined">Min length: {{ prop.minLength }}</span>
              <span v-if="prop.minLength !== undefined && prop.maxLength !== undefined"> · </span>
              <span v-if="prop.maxLength !== undefined">Max length: {{ prop.maxLength }}</span>
            </p>

            <p
              v-if="prop.nullable"
              class="text-xs text-muted mt-1"
            >
              Nullable: <code class="font-mono">true</code>
            </p>

            <div
              v-if="prop.example !== undefined && prop.example !== ''"
              class="text-xs text-muted mt-1 cursor-pointer bg-gray-100 dark:bg-muted/50 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap font-mono"
              title="Click to copy example"
              @click="copyContent(typeof prop.example === 'string' || typeof prop.example === 'number' || typeof prop.example === 'boolean' ? String(prop.example) : JSON.stringify(prop.example, null, 2))"
            >
              <pre v-if="typeof prop.example !== 'string' && typeof prop.example !== 'number' && typeof prop.example !== 'boolean'">{{ JSON.stringify(prop.example, null, 2) }}</pre>
              <template v-else>
                {{ prop.example }}
              </template>
            </div>

            <SchemaDetailCard
              v-if="prop.type === 'array' && prop.items"
              :schema="prop.items.$ref ? (components?.schemas?.[prop.items.$ref.replace('#/components/schemas/', '')] ?? {}) : prop.items"
              :components="components"
            />
          </UPageCard>
        </div>
      </template>
    </div>
  </div>
</template>
