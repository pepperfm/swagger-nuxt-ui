<script setup lang="ts">
import type { SwaggerSchemaLoadError } from '../composables/useSwaggerSchema'
import type { HttpMethod, IApiSpec, OpenApiComponents, OpenApiSecurityScheme } from '../types'
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { resolveAnchorFromLocation } from '../composables/navigationAnchor'
import { generateExampleFromSchema } from '../composables/schemaExample'
import { useCopy } from '../composables/useCopy'
import { useSelectedOperation } from '../composables/useSelectedOperation'
import { useSwaggerNavigation } from '../composables/useSwaggerNavigation'
import { useSwaggerSchema } from '../composables/useSwaggerSchema'
import ContentNavigation from './ContentNavigation.vue'
import EndpointRequestCard from './EndpointRequestCard.vue'
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
  enableRequestEmulator?: boolean
  requestTimeoutMs?: number
}

const props = withDefaults(defineProps<SwaggerViewerProps>(), {
  schemaSource: '/api/swagger-ui',
  baseApiUrl: '',
  schemaHeadline: './resources/api-docs/api-docs.json',
  titleFallback: 'API Docs',
  descriptionFallback: 'OpenAPI schema viewer',
  enableRequestEmulator: true,
  requestTimeoutMs: 0,
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

const { endpointNavigation, schemaNavigation, navigationIndex } = useSwaggerNavigation(schema)

const {
  selectedItem,
  selectedAnchor,
  onSelect,
  selectByAnchor,
  clearSelection,
  getMethodConfig,
  getParameters,
  getRequestBodySchema,
  getSecurity,
} = useSelectedOperation({ schema, navigationIndex })

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

const selectedEndpoint = computed(() => {
  if (!selectedItem.value || selectedItem.value.type !== 'endpoint') {
    return null
  }

  return selectedItem.value
})

const SELECTION_QUERY_KEYS = ['anchor', 'operation', 'schema']

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

  applySelectionFromLocation('init')
}

function copyEndpointUrl() {
  if (!selectedItem.value || selectedItem.value.type !== 'endpoint') {
    return
  }

  const url = `${normalizedBaseApiUrl.value}${selectedItem.value.url}`
  copyContent(url)
}

function replaceLocationSelectionAnchor(anchor: string | null) {
  if (typeof window === 'undefined') {
    return
  }

  const url = new URL(window.location.href)
  SELECTION_QUERY_KEYS.forEach((key) => {
    url.searchParams.delete(key)
  })

  if (anchor) {
    url.hash = anchor
  } else {
    url.hash = ''
  }

  const nextRelative = `${url.pathname}${url.search}${url.hash}`
  const currentRelative = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (nextRelative === currentRelative) {
    return
  }

  window.history.replaceState(window.history.state, '', nextRelative)
}

function copySelectionLink() {
  if (!selectedAnchor.value) {
    return
  }

  if (typeof window === 'undefined') {
    copyContent(`#${selectedAnchor.value}`)
    return
  }

  const url = new URL(window.location.href)
  SELECTION_QUERY_KEYS.forEach((key) => {
    url.searchParams.delete(key)
  })
  url.hash = selectedAnchor.value
  copyContent(url.toString())
}

function applySelectionFromLocation(source: 'init' | 'navigation') {
  if (typeof window === 'undefined' || !schema.value) {
    return
  }

  const anchorCandidate = resolveAnchorFromLocation(window.location)
  if (!anchorCandidate) {
    clearSelection()
    return
  }

  const resolved = selectByAnchor(anchorCandidate)
  if (!resolved) {
    console.warn('[SwaggerViewer] URL anchor could not be resolved', { anchor: anchorCandidate, source })
    clearSelection()
    replaceLocationSelectionAnchor(null)
    return
  }

  replaceLocationSelectionAnchor(selectedAnchor.value)
}

function handleBrowserLocationChange() {
  applySelectionFromLocation('navigation')
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
  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', handleBrowserLocationChange)
    window.addEventListener('popstate', handleBrowserLocationChange)
  }

  await initializeSchema()
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') {
    return
  }

  window.removeEventListener('hashchange', handleBrowserLocationChange)
  window.removeEventListener('popstate', handleBrowserLocationChange)
})

watch(selectedAnchor, (anchor) => {
  replaceLocationSelectionAnchor(anchor)
})
</script>

<template>
  <div class="swagger-ui-viewer">
    <UPage>
      <template #left>
        <UPageAside v-if="schema && !isLoading">
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
                class="flex items-center justify-between gap-2"
              >
                <UBadge :color="badgeColor(selectedItem.method)">
                  {{ selectedItem.method.toUpperCase() }}
                </UBadge>
                <div class="flex items-center gap-2">
                  <code
                    class="text-sm font-mono text-muted-foreground cursor-pointer"
                    @click="copyEndpointUrl"
                  >
                    {{ normalizedBaseApiUrl }}{{ selectedItem.url }}
                  </code>
                  <UButton
                    size="xs"
                    variant="soft"
                    color="neutral"
                    icon="i-lucide-link"
                    @click="copySelectionLink"
                  >
                    Copy Link
                  </UButton>
                </div>
              </div>
              <div
                v-else-if="selectedItem.type === 'schema'"
                class="flex items-center justify-between gap-2"
              >
                <code class="font-mono text-xl text-primary">{{ selectedItem.name }}</code>
                <UButton
                  size="xs"
                  variant="soft"
                  color="neutral"
                  icon="i-lucide-link"
                  @click="copySelectionLink"
                >
                  Copy Link
                </UButton>
              </div>
            </template>

            <div v-if="selectedItem.type === 'endpoint'">
              <p class="mt-4 text-muted-foreground">
                {{ selectedItem.summary || 'No summary provided.' }}
              </p>
              <p
                v-if="selectedItem.description"
                class="mt-4 text-muted-foreground whitespace-pre-line"
              >
                {{ selectedItem.description }}
              </p>

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

      <template #right>
        <UPageAside v-if="schema && !isLoading">
          <EndpointRequestCard
            v-if="props.enableRequestEmulator && selectedEndpoint"
            :endpoint="selectedEndpoint"
            :method="selectedEndpointMethod"
            :parameters="selectedEndpointParameters"
            :components="components"
            :security-key="selectedEndpointSecurityKey"
            :security-scheme="selectedEndpointSecurityScheme"
            :base-api-url="normalizedBaseApiUrl"
            :request-timeout-ms="props.requestTimeoutMs"
          />

          <div
            v-else-if="selectedItem?.type === 'schema'"
            class="w-full"
          >
            <pre
              class="text-xs font-mono whitespace-pre-wrap rounded p-2 overflow-auto max-h-220 bg-muted text-muted-foreground cursor-pointer mb-4"
              title="Click to copy example"
              @click="copyContent(JSON.stringify(example, null, 2))"
            >{{ JSON.stringify(example, null, 2) }}</pre>
          </div>
        </UPageAside>
      </template>
    </UPage>
  </div>
</template>
