<script setup lang="ts">
import type { VNode } from 'vue'
import { computed, defineProps, h } from 'vue'
import { useClipboard } from '@vueuse/core'

import { UBadge } from '#components'

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
const badgeColorMap = {
  'string': 'primary',
  'number': 'info',
  'integer': 'info',
  'boolean': 'secondary',
  'uuid': 'primary',
  'date-time': 'primary',
  'email': 'primary',
  'any': 'gray'
}

const getBadgeColor = (prop: any): string => {
  const key = prop.format || prop.type || 'any'
  return badgeColorMap[key] ?? 'gray'
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
    // Можно взять первый элемент
    return generateExampleFromSchema(schema.oneOf[0], components)
  }

  if (schema.anyOf) {
    // Объединяем все варианты anyOf
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
  const variants: Record<string, any>[] = []

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

function renderProperties(propsObj: Record<string, any>, level = 0): VNode[] {
  if (!propsObj) return []

  return Object.entries(propsObj).map(([name, prop]) => {
    return h('div', {
      key: `${name}-${level}`,
      class: 'rounded-lg border border-muted p-4 bg-muted/10 dark:bg-muted/20 my-2',
      style: { marginLeft: `${level * 1.5}rem` }
    }, [
      h('div', {
        class: 'flex justify-between items-center cursor-pointer',
        onClick: () => copyContent(name)
      }, [
        h('div', { class: 'font-mono text-sm' }, name),
        h(UBadge, {
          class: 'uppercase',
          size: 'sm',
          variant: 'soft',
          color: prop.required
            ? 'error'
            : prop.nullable ? 'warning' : 'info'
        }, {
          default: () => prop.format || prop.type || 'any'
        })
      ]),
      prop.description ? h('p', { class: 'text-xs text-muted mt-1' }, prop.description) : null,
      prop.format
        ? h('p', { class: 'text-xs text-muted mt-1' }, [
            'Format: ', h('code', { class: 'font-mono' }, prop.format)
          ])
        : null,
      prop.enum && prop.enum.length > 0
        ? h('div', { class: 'text-xs text-muted mt-1 flex gap-1 flex-wrap items-center' }, [
            h('span', 'Enum:'),
            ...prop.enum.map((val: string) =>
              h(UBadge, {
                key: val,
                color: 'primary',
                variant: 'soft',
                size: 'sm'
              }, () => val)
            )
          ])
        : null,
      (prop.minLength !== undefined || prop.maxLength !== undefined)
        ? h('p', { class: 'text-xs text-muted mt-1' }, [
            prop.minLength !== undefined ? `Min length: ${prop.minLength}` : '',
            (prop.minLength !== undefined && prop.maxLength !== undefined) ? ' · ' : '',
            prop.maxLength !== undefined ? `Max length: ${prop.maxLength}` : ''
          ])
        : null,
      prop.nullable
        ? h('p', { class: 'text-xs text-muted mt-1' }, [
            'Nullable: ', h('code', { class: 'font-mono' }, 'true')
          ])
        : null,
      (prop.example !== undefined && prop.example !== '')
        ? h('div', {
            class: 'text-xs text-muted mt-1 cursor-pointer bg-gray-100 dark:bg-muted/50 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap font-mono',
            onClick: () => copyContent(
              typeof prop.example === 'string' || typeof prop.example === 'number' || typeof prop.example === 'boolean'
                ? String(prop.example)
                : JSON.stringify(prop.example, null, 2)
            ),
            title: 'Click to copy example'
          }, [
            typeof prop.example === 'string' || typeof prop.example === 'number' || typeof prop.example === 'boolean'
              ? String(prop.example)
              : h('pre', JSON.stringify(prop.example, null, 2))
          ])
        : null,
      prop.type === 'array' && prop.items
        ? h('div', { class: 'mt-2' }, (() => {
            const items = prop.items
            if (items.$ref && props.components?.schemas) {
              const refName = items.$ref.replace('#/components/schemas/', '')
              const resolved = props.components.schemas[refName]
              return [
                h('strong', 'Items:'),
                ...renderProperties(resolved?.properties ?? {}, level + 1)
              ]
            }

            return [
              h('strong', 'Items:'),
              ...(items.properties
                ? renderProperties(items.properties, level + 1)
                : renderProperties({ item: items }, level + 1))
            ]
          })())
        : null,
      prop.properties ? renderProperties(prop.properties, level + 1) : null
    ])
  })
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
      <component
        :is="{ render() { return renderProperties(variant.properties) } }"
        v-if="variant.properties"
      />
    </div>
  </div>
</template>
