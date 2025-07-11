<script setup lang="ts">
import { useCopy } from '~/composables/useCopy'

defineProps<{
  schema: any
  components?: Record<string, any>
  isNested?: boolean
}>()

const { copyContent } = useCopy()

const getBadgeColor = (prop: any): 'error' | 'warning' | 'info' => {
  return prop.required
    ? 'error'
    : prop.nullable ? 'warning' : 'info'
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
</script>

<template>
  <div v-if="schema">
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
          <UPageCard class="my-2">
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

            <div v-if="prop.type === 'array' && prop.items">
              <UCollapsible>
                <template #default="{ open }">
                  <div class="flex items-center gap-1">
                    <UButton
                      size="xs"
                      variant="ghost"
                      icon="i-lucide-chevron-right"
                      :class="{ 'rotate-90': open, 'transition-transform': true }"
                      @click="open = !open"
                    />
                    <span class="text-xs text-muted">Items</span>
                  </div>
                </template>
                <template #content>
                  <div class="px-2 mt-2">
                    <SchemaDetailCard
                      v-if="prop.items.$ref || prop.items.properties"
                      :schema="prop.items.$ref ? (components?.schemas?.[prop.items.$ref.replace('#/components/schemas/', '')] ?? {}) : prop.items"
                      :components="components"
                      :is-nested="true"
                    />
                    <div
                      v-else
                      class="text-xs text-muted font-mono"
                    >
                      {{ prop.items.type || 'unknown' }}
                    </div>
                  </div>
                </template>
              </UCollapsible>
            </div>
          </UPageCard>
        </div>
      </template>
    </div>
  </div>
</template>
