<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { computed } from 'vue'
import type { HttpMethod, IApiSpec, IMethod, INavigationGroup, IParameter, PathsObject } from '~/types/types'
import { generateExampleFromSchema } from '~/composables/schemaExample'
import { useCopy } from '~/composables/useCopy'

const config = useRuntimeConfig()
const baseURL = config.public.apiHost
const baseApiUrl = config.public.apiUrl

const { data: spec } = await useFetch<IApiSpec>(`${baseURL}/docs?api-docs.json`)
const title = computed(() => spec.value?.info?.title)
const description = computed(() => spec.value?.info?.description)
const components = computed(() => spec.value?.components)
const securitySchemes = computed(() => spec.value?.components?.securitySchemes)

const toast = useToast()
const { copyContent } = useCopy()
const { copy } = useClipboard()

function copyUrl() {
  const url = `${baseApiUrl}${selectedItem.value?.url ?? ''}`

  copy(url)
  toast.add({
    title: 'Copied!',
    description: 'Endpoint URL copied to clipboard.',
    color: 'success',
    icon: 'i-lucide-copy',
    duration: 2000
  })
}

const paths = spec.value?.paths as PathsObject
const schemas = spec.value?.components?.schemas ?? {}

const endpointGroups: Record<string, INavigationGroup> = {}
Object.entries(paths ?? {}).forEach(([url, methods]) => {
  Object.entries(methods).forEach(([method, config]) => {
    const typedConfig = config as IMethod
    const typedMethod = method as HttpMethod
    const tag = typedConfig.tags?.[0] ?? 'General'

    if (!endpointGroups[tag]) {
      endpointGroups[tag] = {
        _path: `#tag-${tag}`,
        title: tag,
        children: []
      }
    }

    endpointGroups[tag].children.push({
      _path: `#${method}-${url}`,
      title: typedConfig.summary || 'No title provided',
      description: typedConfig.description,
      method: typedMethod,
      operationId: typedConfig.operationId
    })
  })
})

const endpointNavigation = Object.values(endpointGroups)
const schemaNavigation: INavigationGroup = {
  _path: '#schemas',
  title: 'Schemas',
  children: Object.keys(schemas).map(name => ({
    _path: `#schema-${name}`,
    title: name,
    method: '',
    operationId: `schema-${name}`
  }))
}

function getMethodConfig(operationId: string): IMethod | undefined {
  const paths = spec.value?.paths as PathsObject
  for (const methods of Object.values(paths)) {
    for (const methodConfig of Object.values(methods)) {
      if (methodConfig?.operationId === operationId) {
        return methodConfig
      }
    }
  }
}

function getParameters(operationId: string) {
  const config = getMethodConfig(operationId)
  if (!config?.parameters) return []

  return config.parameters.map((param: IParameter) => ({
    name: param.name,
    in: param.in,
    type: param.schema?.type ?? 'any',
    required: param.required ?? false,
    description: param.description ?? ''
  }))
}

function getRequestBodySchema(operationId: string) {
  const config = getMethodConfig(operationId)
  const body = config?.requestBody
  if (!body) return null

  const json = body.content?.['application/json']
    ?? body.content?.['multipart/form-data']
    ?? body.content?.['application/x-www-form-urlencoded']

  const schema = json?.schema
  if (!schema || !schema.properties) return null

  return schema.properties
}

function getSecurity(operationId: string): string | null {
  const config = getMethodConfig(operationId)
  const security = (config as any)?.security
  if (!security || !Array.isArray(security)) return null

  return Object.keys(security[0] || {})[0] || null
}

const selectedItem = ref<
  | {
    type: 'endpoint'
    method: string
    url: string
    summary?: string
    description?: string
    operationId: string
  }
  | {
    type: 'schema'
    name: string
    schema: Record<string, any>
  }
  | null
>(null)

function onSelect(item: {
  _path: string
  title?: string
  description?: string
  method?: string
  operationId: string
}) {
  const paths = spec.value?.paths as PathsObject
  const schemas = spec.value?.components?.schemas || {}

  if (item.method?.length) {
    for (const [url, methods] of Object.entries(paths)) {
      const methodConfig = methods?.[item.method as keyof typeof methods]
      if (methodConfig?.operationId === item.operationId) {
        selectedItem.value = {
          type: 'endpoint',
          method: item.method,
          url,
          summary: methodConfig.summary,
          description: item.description,
          operationId: item.operationId
        }
        return
      }
    }
  } else {
    const schema = schemas[item.title]
    if (schema) {
      selectedItem.value = {
        type: 'schema',
        name: item.title,
        schema
      }
    }
  }
}

const example = computed(() => generateExampleFromSchema(selectedItem.value?.schema, components.value ?? {}))

function badgeColor(method: string): 'primary' | 'secondary' | 'warning' | 'error' | 'info' {
  switch (method.toLowerCase()) {
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
</script>

<template>
  <UPage>
    <template #left>
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
        :headline="`${baseURL}/docs?api-docs.json`"
      />
      <UPageBody>
        <UPageBody v-if="selectedItem">
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
                  {{ baseApiUrl }}{{ selectedItem.url }}
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
                <div v-if="getSecurity(selectedItem.operationId)">
                  <USeparator label="Security" />
                  <div class="space-y-1 mt-2">
                    <div
                      v-for="(scheme, key) in securitySchemes"
                      :key="key"
                      class="border border-default bg-muted/10 dark:bg-muted/20 rounded p-3"
                    >
                      <div class="flex justify-between items-center">
                        <div class="text-sm font-semibold text-muted-foreground">
                          {{ key }}
                        </div>
                        <UBadge
                          size="md"
                          variant="soft"
                        >
                          {{ scheme.type }} {{ scheme.scheme ? `(${scheme.scheme})` : '' }}
                        </UBadge>
                      </div>
                      <p
                        v-if="scheme.description"
                        class="text-xs text-muted mt-1"
                      >
                        {{ scheme.description }}
                      </p>
                      <p
                        v-if="scheme.name && scheme.in"
                        class="text-xs text-muted"
                      >
                        <code class="font-mono">{{ scheme.name }}</code> in <code class="font-mono">{{ scheme.in }}</code>
                      </p>
                    </div>
                  </div>
                </div>

                <div class="py-2">
                  <RequestParametersList :parameters="getParameters(selectedItem.operationId)" />
                </div>

                <div class="py-2">
                  <RequestBodyCard
                    v-if="getRequestBodySchema(selectedItem.operationId)"
                    :schema="getRequestBodySchema(selectedItem.operationId)"
                  />
                </div>

                <div class="py-2">
                  <ResponseExampleCard
                    v-if="components"
                    :method="getMethodConfig(selectedItem.operationId)"
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
      </upagebody>
    </template>

    <template #right>
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
</template>
