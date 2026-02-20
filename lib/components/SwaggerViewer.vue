<script setup lang="ts">
import type { SwaggerSchemaLoadError } from '../composables/useSwaggerSchema'
import type { HttpMethod, IApiSpec, OpenApiComponents, OpenApiSecurityScheme } from '../types'
import { computed, onMounted } from 'vue'
import { generateExampleFromSchema } from '../composables/schemaExample'
import { useCopy } from '../composables/useCopy'
import { useSelectedOperation } from '../composables/useSelectedOperation'
import { useSwaggerNavigation } from '../composables/useSwaggerNavigation'
import { useSwaggerSchema } from '../composables/useSwaggerSchema'
import ContentNavigation from './ContentNavigation.vue'
import RequestBodyCard from './RequestBodyCard.vue'
import RequestParametersList from './RequestParametersList.vue'
import ResponseExampleCard from './ResponseExampleCard.vue'
import SchemaDetailCard from './SchemaDetailCard.vue'

interface SwaggerViewerProps {
  schemaSource?: string
  baseApiUrl?: string
  schemaHeadline?: string
  titleFallback?: string
  descriptionFallback?: string
}

const props = withDefaults(defineProps<SwaggerViewerProps>(), {
  schemaSource: '/api/swagger-ui',
  baseApiUrl: '',
  schemaHeadline: './resources/api-docs/api-docs.json',
  titleFallback: 'API Docs',
  descriptionFallback: 'OpenAPI schema viewer',
})

const emit = defineEmits<{
  (e: 'schemaError', error: SwaggerSchemaLoadError): void
  (e: 'schemaLoaded', schema: IApiSpec): void
}>()

const { copyContent } = useCopy()

const {
  schema,
  isLoading,
  loadSchema,
  loadError,
} = useSwaggerSchema({ defaultSource: props.schemaSource })

const { endpointNavigation, schemaNavigation } = useSwaggerNavigation(schema)

const {
  selectedItem,
  onSelect,
  getMethodConfig,
  getParameters,
  getRequestBodySchema,
  getSecurity,
} = useSelectedOperation({ schema, endpointNavigation })

const normalizedBaseApiUrl = computed(() => props.baseApiUrl.replace(/\/+$/, ''))
const title = computed(() => schema.value?.info?.title ?? props.titleFallback)
const description = computed(() => schema.value?.info?.description ?? props.descriptionFallback)
const components = computed<OpenApiComponents>(() => schema.value?.components ?? {})
const securitySchemes = computed<Record<string, OpenApiSecurityScheme>>(() => schema.value?.components?.securitySchemes ?? {})

const selectedEndpointMethod = computed(() => {
  if (!selectedItem.value || selectedItem.value.type !== 'endpoint') {
    return undefined
  }

  return getMethodConfig(selectedItem.value.operationId)
})

const selectedEndpointParameters = computed(() => {
  if (!selectedItem.value || selectedItem.value.type !== 'endpoint') {
    return []
  }

  return getParameters(selectedItem.value.operationId)
})

const selectedEndpointRequestBody = computed(() => {
  if (!selectedItem.value || selectedItem.value.type !== 'endpoint') {
    return null
  }

  return getRequestBodySchema(selectedItem.value.operationId)
})

const selectedEndpointSecurityKey = computed(() => {
  if (!selectedItem.value || selectedItem.value.type !== 'endpoint') {
    return null
  }

  return getSecurity(selectedItem.value.operationId)
})

const selectedEndpointSecurityScheme = computed(() => {
  if (!selectedEndpointSecurityKey.value) {
    return null
  }

  return securitySchemes.value[selectedEndpointSecurityKey.value] ?? null
})

const example = computed(() => {
  if (!selectedItem.value || selectedItem.value.type !== 'schema') {
    return null
  }

  return generateExampleFromSchema(selectedItem.value.schema, components.value)
})

async function initializeSchema() {
  const ok = await loadSchema(props.schemaSource)

  if (!ok) {
    if (loadError.value) {
      emit('schemaError', loadError.value)
    }

    return
  }

  if (schema.value) {
    emit('schemaLoaded', schema.value)
  }
}

function copyUrl() {
  if (!selectedItem.value || selectedItem.value.type !== 'endpoint') {
    return
  }

  const url = `${normalizedBaseApiUrl.value}${selectedItem.value.url}`
  copyContent(url)
}

function badgeColor(method: HttpMethod): 'primary' | 'secondary' | 'warning' | 'error' | 'info' {
  switch (method) {
    case 'get':
      return 'primary'
    case 'post':
      return 'secondary'
    case 'patch':
    case 'put':
      return 'warning'
    case 'delete':
      return 'error'
    default:
      return 'info'
  }
}

onMounted(async () => {
  await initializeSchema()
})
</script>

<template>
  <div class="swagger-ui-viewer">
    <UPage>
      <template
        v-if="schema && !isLoading"
        #left
      >
        <UPageAside>
          <ContentNavigation
            :navigation="endpointNavigation"
            :schemas="schemaNavigation"
            :badge-color="badgeColor"
            :selected-operation-id="selectedItem?.operationId"
            @select="onSelect"
          />
        </UPageAside>
      </template>

      <template #default>
        <UPageHeader
          :title="title"
          :description="description"
          :headline="schemaHeadline"
        />

        <UPageBody v-if="isLoading">
          <UCard>
            <div class="flex items-center gap-3 text-sm text-muted">
              <UIcon
                name="i-lucide-loader"
                class="animate-spin"
              />
              Loading OpenAPI schema...
            </div>
          </UCard>
        </UPageBody>

        <UPageBody v-else-if="loadError">
          <UAlert
            title="Failed to load schema"
            :description="loadError.message"
            color="error"
            variant="soft"
          />

          <UButton
            label="Retry"
            class="mt-4"
            @click="initializeSchema"
          />
        </UPageBody>

        <UPageBody
          v-else-if="schema && selectedItem"
        >
          <UCard>
            <template #header>
              <div
                v-if="selectedItem.type === 'endpoint'"
                class="flex items-center justify-between"
              >
                <UBadge :color="badgeColor(selectedItem.method)">
                  {{ selectedItem.method.toUpperCase() }}
                </UBadge>
                <code
                  class="text-sm font-mono text-muted-foreground cursor-pointer"
                  @click="copyUrl"
                >
                  {{ normalizedBaseApiUrl }}{{ selectedItem.url }}
                </code>
              </div>
              <div
                v-else-if="selectedItem.type === 'schema'"
                class="text-sm font-semibold text-primary"
              >
                <code class="font-mono text-xl">{{ selectedItem.name }}</code>
              </div>
            </template>

            <div v-if="selectedItem.type === 'endpoint'">
              <p class="mt-4 text-muted-foreground">
                {{ selectedItem.summary || 'No summary provided.' }}
              </p>
              <p
                v-if="selectedItem.description"
                class="mt-4 text-muted-foreground"
                v-html="selectedItem.description"
              />

              <div class="mt-6 space-y-4">
                <div v-if="selectedEndpointSecurityKey && selectedEndpointSecurityScheme">
                  <USeparator label="Security" />
                  <div class="space-y-1 mt-2">
                    <div class="border border-default bg-muted/10 dark:bg-muted/20 rounded p-3">
                      <div class="flex justify-between items-center">
                        <div class="text-sm font-semibold text-muted-foreground">
                          {{ selectedEndpointSecurityKey }}
                        </div>
                        <UBadge
                          size="md"
                          variant="soft"
                        >
                          {{ selectedEndpointSecurityScheme.type }} {{ selectedEndpointSecurityScheme.scheme ? `(${selectedEndpointSecurityScheme.scheme})` : '' }}
                        </UBadge>
                      </div>
                      <p
                        v-if="selectedEndpointSecurityScheme.description"
                        class="text-xs text-muted mt-1"
                      >
                        {{ selectedEndpointSecurityScheme.description }}
                      </p>
                      <p
                        v-if="selectedEndpointSecurityScheme.name && selectedEndpointSecurityScheme.in"
                        class="text-xs text-muted"
                      >
                        <code class="font-mono">{{ selectedEndpointSecurityScheme.name }}</code> in <code class="font-mono">{{ selectedEndpointSecurityScheme.in }}</code>
                      </p>
                    </div>
                  </div>
                </div>

                <div class="py-2">
                  <RequestParametersList :parameters="selectedEndpointParameters" />
                </div>

                <div class="py-2">
                  <RequestBodyCard
                    v-if="selectedEndpointRequestBody"
                    :schema="selectedEndpointRequestBody"
                  />
                </div>

                <div class="py-2">
                  <ResponseExampleCard
                    v-if="selectedEndpointMethod"
                    :method="selectedEndpointMethod"
                    :components="components"
                  />
                </div>
              </div>
            </div>

            <div v-else-if="selectedItem.type === 'schema'">
              <SchemaDetailCard
                :schema="selectedItem.schema"
                :components="components"
              />
            </div>
          </UCard>
        </UPageBody>

        <UPageBody v-else-if="schema">
          <UCard>
            <p class="text-sm text-muted">
              Select an endpoint or schema from the left navigation.
            </p>
          </UCard>
        </UPageBody>
      </template>

      <template
        v-if="schema && !isLoading"
        #right
      >
        <UPageAside>
          <div class="max-w-6xl w-full">
            <h1
              v-if="selectedItem?.type === 'schema'"
              class="text-3xl font-bold"
            >
              <pre
                class="text-xs font-mono whitespace-pre-wrap rounded p-2 overflow-auto max-h-220 bg-muted text-muted-foreground cursor-pointer mb-4"
                title="Click to copy example"
                @click="copyContent(JSON.stringify(example, null, 2))"
              >{{ JSON.stringify(example, null, 2) }}</pre>
            </h1>
          </div>
        </UPageAside>
      </template>
    </UPage>
  </div>
</template>
