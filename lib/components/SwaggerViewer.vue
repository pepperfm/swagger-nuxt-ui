<script setup lang="ts">
import type { SwaggerSchemaLoadError } from '../composables/useSwaggerSchema'
import type {
  HttpMethod,
  IApiSpec,
  OpenApiComponents,
  OpenApiSecurityScheme,
} from '../types'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { resolveAnchorFromLocation } from '../composables/navigationAnchor'
import { buildRequestUrl, resolveOpenApiServerUrl, resolveServerUrlForDisplay } from '../composables/requestEmulatorUtils'
import { generateExampleFromSchema } from '../composables/schemaExample'
import { useCopy } from '../composables/useCopy'
import { useSelectedOperation } from '../composables/useSelectedOperation'
import { useSwaggerNavigation } from '../composables/useSwaggerNavigation'
import { useSwaggerSchema } from '../composables/useSwaggerSchema'
import { useViewerAuthorization } from '../composables/useViewerAuthorization'
import ContentNavigation from './ContentNavigation.vue'
import EndpointRequestCard from './EndpointRequestCard.vue'
import RequestBodyCard from './RequestBodyCard.vue'
import RequestParametersList from './RequestParametersList.vue'
import ResponseExampleCard from './ResponseExampleCard.vue'
import SchemaDetailCard from './SchemaDetailCard.vue'
import ViewerAuthorizationPanel from './ViewerAuthorizationPanel.vue'

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

const HISTORY_LOCATION_CHANGE_EVENT = 'swagger-ui:history-location-change'

type PatchedWindow = Window & {
  __SWAGGER_UI_HISTORY_PATCHED__?: boolean
}

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
  getSecurityRequirements,
} = useSelectedOperation({ schema, navigationIndex })

const normalizedBaseApiUrl = computed(() => props.baseApiUrl.trim().replace(/\/+$/, ''))
const title = computed(() => schema.value?.info?.title ?? props.titleFallback)
const description = computed(() => schema.value?.info?.description ?? props.descriptionFallback)
const components = computed<OpenApiComponents>(() => schema.value?.components ?? {})
const securitySchemes = computed<Record<string, OpenApiSecurityScheme>>(() => schema.value?.components?.securitySchemes ?? {})
const {
  state: authorizationState,
  schemeMetaList,
  hasSchemes,
  isAuthorized,
  authorizedCount,
  setCredential,
  clearCredential,
  resetAllCredentials,
  resolveForRequirements,
} = useViewerAuthorization({
  securitySchemes,
})
const isAuthorizeModalOpen = ref(false)

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

const selectedEndpointSecurityRequirements = computed(() => {
  if (!selectedItem.value || selectedItem.value.type !== 'endpoint') {
    return []
  }

  return getSecurityRequirements(selectedItem.value.operationId)
})

const selectedEndpointAuthorization = computed(() => {
  return resolveForRequirements(selectedEndpointSecurityRequirements.value)
})

const selectedEndpointSecurityKeys = computed(() => {
  const keys = selectedEndpointSecurityRequirements.value.flatMap(requirement => Object.keys(requirement))
  return Array.from(new Set(keys))
})

const selectedEndpoint = computed(() => {
  if (!selectedItem.value || selectedItem.value.type !== 'endpoint') {
    return null
  }

  return selectedItem.value
})

const resolvedSchemaBaseApiUrl = computed(() => {
  const operationServer = selectedEndpointMethod.value?.servers?.[0]
  const schemaServer = schema.value?.servers?.[0]
  const resolved = resolveOpenApiServerUrl(operationServer) || resolveOpenApiServerUrl(schemaServer)
  return resolved.replace(/\/+$/, '')
})

const effectiveBaseApiUrl = computed(() => {
  return normalizedBaseApiUrl.value || resolvedSchemaBaseApiUrl.value
})

const effectiveDisplayBaseApiUrl = computed(() => {
  const rawBaseApiUrl = effectiveBaseApiUrl.value
  if (!rawBaseApiUrl) {
    return ''
  }

  return resolveServerUrlForDisplay(rawBaseApiUrl, props.schemaSource).replace(/\/+$/, '')
})

const selectedEndpointDisplayUrl = computed(() => {
  if (!selectedItem.value || selectedItem.value.type !== 'endpoint') {
    return ''
  }

  return buildRequestUrl(effectiveDisplayBaseApiUrl.value, selectedItem.value.url, '')
})

const SELECTION_QUERY_KEYS = ['anchor', 'operation', 'schema']
let skipNextLocationSync = false

const example = computed(() => {
  if (!selectedItem.value || selectedItem.value.type !== 'schema') {
    return null
  }

  return generateExampleFromSchema(selectedItem.value.schema, components.value)
})

const securityOverviewLabel = computed(() => {
  return hasSchemes.value
    ? `Security ${authorizedCount.value}/${schemeMetaList.value.length}`
    : 'Security'
})

const securityOverviewColor = computed<'primary' | 'neutral'>(() => {
  return isAuthorized.value ? 'primary' : 'neutral'
})

const authorizeButtonColor = computed<'primary' | 'neutral'>(() => {
  return isAuthorized.value ? 'primary' : 'neutral'
})

const endpointSecuritySummary = computed(() => {
  if (!selectedEndpointSecurityKeys.value.length) {
    return 'No auth required for selected endpoint.'
  }

  return `Selected endpoint requires: ${selectedEndpointSecurityKeys.value.join(', ')}`
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
  if (!selectedEndpointDisplayUrl.value) {
    return
  }

  copyContent(selectedEndpointDisplayUrl.value)
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

  skipNextLocationSync = true
  window.history.replaceState(window.history.state, '', nextRelative)
  queueMicrotask(() => {
    skipNextLocationSync = false
  })
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

function openAuthorizeModal() {
  isAuthorizeModalOpen.value = true
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
  if (skipNextLocationSync) {
    return
  }

  applySelectionFromLocation('navigation')
}

function emitHistoryLocationChange() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(HISTORY_LOCATION_CHANGE_EVENT))
}

function patchHistoryLocationEvents() {
  if (typeof window === 'undefined') {
    return
  }

  const patchedWindow = window as PatchedWindow
  if (patchedWindow.__SWAGGER_UI_HISTORY_PATCHED__) {
    return
  }

  const originalPushState = window.history.pushState.bind(window.history)
  const originalReplaceState = window.history.replaceState.bind(window.history)

  window.history.pushState = ((...args: Parameters<History['pushState']>) => {
    originalPushState(...args)
    emitHistoryLocationChange()
  }) as History['pushState']

  window.history.replaceState = ((...args: Parameters<History['replaceState']>) => {
    originalReplaceState(...args)
    emitHistoryLocationChange()
  }) as History['replaceState']

  patchedWindow.__SWAGGER_UI_HISTORY_PATCHED__ = true
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
  patchHistoryLocationEvents()

  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', handleBrowserLocationChange)
    window.addEventListener('popstate', handleBrowserLocationChange)
    window.addEventListener(HISTORY_LOCATION_CHANGE_EVENT, handleBrowserLocationChange)
  }

  await initializeSchema()
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') {
    return
  }

  window.removeEventListener('hashchange', handleBrowserLocationChange)
  window.removeEventListener('popstate', handleBrowserLocationChange)
  window.removeEventListener(HISTORY_LOCATION_CHANGE_EVENT, handleBrowserLocationChange)
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
        >
          <template #links>
            <div class="flex items-center gap-2">
              <UPopover
                arrow
                :content="{ side: 'bottom', align: 'end' }"
              >
                <UButton
                  size="sm"
                  variant="soft"
                  :color="securityOverviewColor"
                  icon="i-lucide-shield-check"
                >
                  {{ securityOverviewLabel }}
                </UButton>

                <template #content>
                  <div class="p-3 w-80 space-y-3">
                    <p class="text-sm font-semibold text-highlighted">
                      Security Overview
                    </p>
                    <p class="text-xs text-muted">
                      {{ endpointSecuritySummary }}
                    </p>
                    <div
                      v-if="schemeMetaList.length"
                      class="space-y-2"
                    >
                      <div
                        v-for="scheme in schemeMetaList"
                        :key="scheme.key"
                        class="rounded border border-default px-2 py-1.5"
                      >
                        <div class="flex items-center justify-between gap-2">
                          <code class="text-xs font-mono text-primary">{{ scheme.key }}</code>
                          <UBadge
                            size="sm"
                            :color="authorizationState.bySchemeKey[scheme.key]?.trim() ? 'success' : 'neutral'"
                            variant="soft"
                          >
                            {{ authorizationState.bySchemeKey[scheme.key]?.trim() ? 'Authorized' : 'Empty' }}
                          </UBadge>
                        </div>
                        <p class="text-xs text-muted mt-1">
                          {{ scheme.kind }}
                        </p>
                      </div>
                    </div>
                    <p
                      v-else
                      class="text-xs text-muted"
                    >
                      No security schemes in schema.
                    </p>
                  </div>
                </template>
              </UPopover>

              <UButton
                size="sm"
                variant="soft"
                :color="authorizeButtonColor"
                :icon="isAuthorized ? 'i-lucide-lock-open' : 'i-lucide-lock'"
                @click="openAuthorizeModal"
              >
                Authorize
              </UButton>
            </div>
          </template>
        </UPageHeader>

        <UModal
          v-model:open="isAuthorizeModalOpen"
          title="Available authorizations"
          description="Credentials are global for this documentation session."
        >
          <template #body>
            <ViewerAuthorizationPanel
              :schemes="schemeMetaList"
              :credentials="authorizationState.bySchemeKey"
              :authorized-count="authorizedCount"
              @set-credential="setCredential"
              @clear-credential="clearCredential"
              @reset-all="resetAllCredentials"
            />
          </template>
        </UModal>

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
                    {{ selectedEndpointDisplayUrl }}
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
        <UPageAside
          v-if="schema && !isLoading"
          :ui="{
            root: 'hidden lg:block py-8 lg:ps-4 lg:-ms-4 lg:pe-6.5',
          }"
        >
          <EndpointRequestCard
            v-if="props.enableRequestEmulator && selectedEndpoint"
            :endpoint="selectedEndpoint"
            :method="selectedEndpointMethod"
            :parameters="selectedEndpointParameters"
            :components="components"
            :authorization="selectedEndpointAuthorization"
            :base-api-url="effectiveBaseApiUrl"
            :request-timeout-ms="props.requestTimeoutMs"
          />

          <div
            v-else-if="selectedItem?.type === 'schema'"
            class="w-full"
          >
            <pre
              class="text-xs font-mono whitespace-pre-wrap rounded p-2 bg-muted text-muted-foreground cursor-pointer mb-4"
              title="Click to copy example"
              @click="copyContent(JSON.stringify(example, null, 2))"
            >{{ JSON.stringify(example, null, 2) }}</pre>
          </div>
        </UPageAside>
      </template>
    </UPage>
  </div>
</template>
