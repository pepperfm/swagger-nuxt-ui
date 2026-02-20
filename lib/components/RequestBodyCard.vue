<script setup lang="ts">
import type { OpenApiSchemaObject } from '../types'
import { useClipboard } from '@vueuse/core'

const props = defineProps<{
  schema?: Record<string, OpenApiSchemaObject>
}>()

const { copy } = useClipboard()

async function copyContent(content: unknown) {
  const normalized = typeof content === 'string' ? content : JSON.stringify(content, null, 2)

  try {
    await copy(normalized)
  } catch (error) {
    console.warn('[RequestBodyCard] Failed to copy request body content', error)
  }
}

function renderItems(items?: OpenApiSchemaObject): string[] {
  if (!items) {
    return []
  }

  const lines: string[] = []

  if (items.type) {
    lines.push(`Items type: ${items.type}`)
  }

  if (items.format && lines.length) {
    lines[lines.length - 1] += ` · Format: ${items.format}`
  }

  if (items.description) {
    lines.push(items.description)
  }

  if (items.enum?.length) {
    lines.push(`Enum: ${items.enum.map(value => String(value)).join(', ')}`)
  }

  if (items.example !== undefined) {
    lines.push(`Example: ${String(items.example)}`)
  }

  if (items.minLength !== undefined || items.maxLength !== undefined) {
    let lengthInfo = ''
    if (items.minLength !== undefined) {
      lengthInfo += `Min length: ${items.minLength}`
    }
    if (items.minLength !== undefined && items.maxLength !== undefined) {
      lengthInfo += ' · '
    }
    if (items.maxLength !== undefined) {
      lengthInfo += `Max length: ${items.maxLength}`
    }
    lines.push(lengthInfo)
  }

  if (items.items) {
    const nestedItems = renderItems(items.items)
    lines.push(...nestedItems.map(line => `- ${line}`))
  }

  return lines
}
</script>

<template>
  <div class="space-y-2">
    <USeparator
      v-if="Object.keys(props.schema ?? {}).length"
      label="Body"
    />
    <div
      v-for="(prop, name) in props.schema ?? {}"
      :key="name"
      class="rounded-lg border border-muted p-4 bg-muted/10 dark:bg-muted/20"
    >
      <div class="flex justify-between items-center">
        <div
          class="font-mono text-sm cursor-pointer"
          @click="copyContent(name)"
        >
          {{ name }}
        </div>
        <UBadge
          :color="prop.required === true ? 'error' : prop.nullable ? 'warning' : 'info'"
          size="sm"
          variant="soft"
          class="uppercase"
        >
          {{ prop.type || prop.format || 'any' }}
        </UBadge>
      </div>

      <p
        v-if="prop.description"
        class="text-xs text-muted-foreground mt-1"
      >
        {{ prop.description }}
      </p>

      <div
        v-if="prop.enum?.length"
        class="mt-1 text-xs text-muted flex items-center gap-1"
      >
        <div>Enum:</div>
        <UBadge
          v-for="(value, index) in prop.enum"
          :key="index"
          color="primary"
          size="sm"
          variant="soft"
        >
          {{ value }}
        </UBadge>
      </div>

      <div
        v-if="prop.format"
        class="mt-1 text-xs text-muted"
      >
        Format: <code class="font-mono">{{ prop.format }}</code>
      </div>

      <div
        v-if="prop.default !== undefined"
        class="mt-1 text-xs text-muted"
      >
        Default: <code class="font-mono">{{ prop.default }}</code>
      </div>

      <div
        v-if="prop.minLength !== undefined || prop.maxLength !== undefined"
        class="mt-1 text-xs text-muted"
      >
        <span v-if="prop.minLength !== undefined">Min length: {{ prop.minLength }}</span>
        <span v-if="prop.minLength !== undefined && prop.maxLength !== undefined"> · </span>
        <span v-if="prop.maxLength !== undefined">Max length: {{ prop.maxLength }}</span>
      </div>

      <div
        v-if="prop.type === 'array' && prop.items"
        class="mt-1 text-xs text-muted whitespace-pre-line"
      >
        {{ renderItems(prop.items).join('\n') }}
      </div>

      <div
        v-if="prop.nullable"
        class="mt-1 text-xs text-muted"
      >
        Nullable: <code class="font-mono">true</code>
      </div>

      <div
        v-if="prop.example !== undefined"
        class="mt-1 text-xs text-muted"
      >
        Example:
        <pre
          class="font-mono whitespace-pre-wrap rounded p-2 overflow-auto max-h-40 cursor-pointer bg-gray-100 dark:bg-muted/50"
          @click="copyContent(prop.example)"
        >{{ typeof prop.example === 'string' ? prop.example : JSON.stringify(prop.example, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>
