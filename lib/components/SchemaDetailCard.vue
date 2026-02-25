<script setup lang="ts">
import type { OpenApiComponents, OpenApiSchemaObject } from '../types'
import { useCopy } from '../composables/useCopy'

interface ResolvedArrayItemSchema {
  schema: OpenApiSchemaObject
  visitedRefs: string[]
}

const props = withDefaults(defineProps<{
  schema: OpenApiSchemaObject
  components?: OpenApiComponents
  isNested?: boolean
  depth?: number
  visitedRefs?: string[]
}>(), {
  depth: 0,
  visitedRefs: () => [],
})

const MAX_SCHEMA_NESTING_DEPTH = 6

const { copyContent } = useCopy()

function resolveSchemaNode(
  schema: OpenApiSchemaObject,
  components: OpenApiComponents,
  visitedRefs: string[],
): OpenApiSchemaObject {
  if (!schema.$ref) {
    return schema
  }

  const ref = schema.$ref.replace('#/components/schemas/', '')
  if (visitedRefs.includes(ref)) {
    return {}
  }

  return components.schemas?.[ref] ?? {}
}

function mergeSchemaObjects(base: OpenApiSchemaObject, next: OpenApiSchemaObject): OpenApiSchemaObject {
  const baseRequired = Array.isArray(base.required) ? base.required : []
  const nextRequired = Array.isArray(next.required) ? next.required : []

  return {
    ...base,
    ...next,
    properties: {
      ...(base.properties ?? {}),
      ...(next.properties ?? {}),
    },
    required: [...new Set([...baseRequired, ...nextRequired])],
  }
}

function mergeSchemas(
  schema: OpenApiSchemaObject,
  components: OpenApiComponents,
  visitedRefs: string[],
): OpenApiSchemaObject[] {
  const resolved = resolveSchemaNode(schema, components, visitedRefs)

  if (resolved.anyOf || resolved.oneOf) {
    const list = resolved.anyOf ?? resolved.oneOf ?? []
    return list.map(item => resolveSchemaNode(item, components, visitedRefs))
  }

  if (resolved.allOf) {
    const merged = resolved.allOf
      .map(item => resolveSchemaNode(item, components, visitedRefs))
      .reduce<OpenApiSchemaObject>((acc, item) => mergeSchemaObjects(acc, item), {})

    return [merged]
  }

  return [resolved]
}

function isPropertyRequired(schema: OpenApiSchemaObject, propertyName: string): boolean {
  return Array.isArray(schema.required) && schema.required.includes(propertyName)
}

function getBadgeColor(isRequired: boolean, isNullable: boolean): 'error' | 'warning' | 'info' {
  return isRequired ? 'error' : isNullable ? 'warning' : 'info'
}

function stringifyExample(example: unknown): string {
  if (typeof example === 'string' || typeof example === 'number' || typeof example === 'boolean') {
    return String(example)
  }

  return JSON.stringify(example, null, 2)
}

function resolveArrayItemSchema(
  items: OpenApiSchemaObject | undefined,
  components: OpenApiComponents,
  visitedRefs: string[],
): ResolvedArrayItemSchema | null {
  if (!items) {
    return null
  }

  if (items.$ref) {
    const ref = items.$ref.replace('#/components/schemas/', '')
    if (visitedRefs.includes(ref)) {
      return null
    }

    const resolved = components.schemas?.[ref]
    if (!resolved) {
      return null
    }

    return {
      schema: resolved,
      visitedRefs: [...visitedRefs, ref],
    }
  }

  return {
    schema: items,
    visitedRefs,
  }
}
</script>

<template>
  <div v-if="schema">
    <div
      v-for="(variant, index) in mergeSchemas(schema, props.components ?? {}, props.visitedRefs)"
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
              @click="copyContent(String(name))"
            >
              <div class="font-mono text-sm">
                {{ name }}
              </div>
              <UBadge
                class="uppercase"
                size="sm"
                variant="soft"
                :color="getBadgeColor(isPropertyRequired(variant, String(name)), Boolean(prop.nullable))"
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
                :key="`${val}-${i}`"
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
              class="text-xs text-muted mt-1 cursor-pointer bg-gray-100 dark:bg-muted/50 rounded p-2 whitespace-pre-wrap font-mono"
              title="Click to copy example"
              @click="copyContent(stringifyExample(prop.example))"
            >
              <pre v-if="typeof prop.example === 'object' && prop.example !== null">{{ JSON.stringify(prop.example, null, 2) }}</pre>
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
                      class="transition-transform"
                      :class="{ 'rotate-90': open }"
                    />
                    <span class="text-xs text-muted">Items</span>
                  </div>
                </template>
                <template #content>
                  <div class="px-2 mt-2">
                    <template
                      v-for="(resolvedItem, resolvedIndex) in [resolveArrayItemSchema(prop.items, props.components ?? {}, props.visitedRefs)]"
                      :key="`${String(name)}-items-${resolvedIndex}`"
                    >
                      <SchemaDetailCard
                        v-if="props.depth < MAX_SCHEMA_NESTING_DEPTH && resolvedItem"
                        :schema="resolvedItem.schema"
                        :components="props.components"
                        :is-nested="true"
                        :depth="props.depth + 1"
                        :visited-refs="resolvedItem.visitedRefs"
                      />
                      <div
                        v-else
                        class="text-xs text-muted font-mono"
                      >
                        {{ props.depth >= MAX_SCHEMA_NESTING_DEPTH ? 'Nested schema depth limit reached' : 'unknown' }}
                      </div>
                    </template>
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
