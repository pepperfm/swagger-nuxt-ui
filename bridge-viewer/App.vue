<script setup lang="ts">
import type { SwaggerSchemaLoadError } from '../lib/composables/useSwaggerSchema'
import { computed, ref } from 'vue'
import { SwaggerViewer } from '../lib'

interface BridgeViewerConfig {
  schemaSource?: string
  schemaHeadline?: string
  baseApiUrl?: string
}

declare global {
  interface Window {
    __SWAGGER_UI_BRIDGE__?: BridgeViewerConfig
  }
}

const runtimeConfig = window.__SWAGGER_UI_BRIDGE__ ?? {}

const schemaSource = computed(() => {
  const source = typeof runtimeConfig.schemaSource === 'string' ? runtimeConfig.schemaSource.trim() : ''
  return source === '' ? '/api/swagger-ui' : source
})

const schemaHeadline = computed(() => {
  const headline = typeof runtimeConfig.schemaHeadline === 'string' ? runtimeConfig.schemaHeadline.trim() : ''
  return headline === '' ? './storage/api-docs/api-docs.json' : headline
})

const baseApiUrl = computed(() => {
  return typeof runtimeConfig.baseApiUrl === 'string' ? runtimeConfig.baseApiUrl : ''
})

const fatalErrorMessage = ref<string | null>(null)

function handleSchemaError(error: SwaggerSchemaLoadError) {
  if (error.code === 'fetch_error') {
    console.error('[bridge-viewer] Failed to fetch schema from source', {
      source: schemaSource.value,
      error,
    })

    return
  }

  console.warn('[bridge-viewer] Recoverable schema loading issue', {
    source: schemaSource.value,
    error,
  })
}

function handleSchemaLoaded() {
  fatalErrorMessage.value = null
}
</script>

<template>
  <UApp>
    <main class="isolate">
      <UContainer class="py-6 lg:py-10">
        <UAlert
          v-if="fatalErrorMessage"
          title="Viewer bootstrap error"
          :description="fatalErrorMessage"
          color="error"
          variant="soft"
          class="mb-6"
        />

        <SwaggerViewer
          :schema-source="schemaSource"
          :schema-headline="schemaHeadline"
          :base-api-url="baseApiUrl"
          @schema-error="handleSchemaError"
          @schema-loaded="handleSchemaLoaded"
        />
      </UContainer>
    </main>
  </UApp>
</template>
