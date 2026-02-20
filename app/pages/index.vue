<script setup lang="ts">
import type { SwaggerSchemaLoadError } from '~~/lib/composables/useSwaggerSchema'
import { computed } from 'vue'
import { SwaggerViewer } from '~~/lib'

const toast = useToast()

const runtimeConfig = useRuntimeConfig()
const baseApiUrl = computed(() => String(runtimeConfig.public.apiUrl ?? '').replace(/\/+$/, ''))
const localSchemaPath = './resources/api-docs/api-docs.json'

function onSchemaError(error: SwaggerSchemaLoadError) {
  toast.add({
    title: 'Schema load failed',
    description: error.message,
    color: 'error',
    duration: 3000,
  })
}
</script>

<template>
  <div>
    <ClientOnly>
      <SwaggerViewer
        schema-source="/api/swagger-ui"
        :base-api-url="baseApiUrl"
        :schema-headline="localSchemaPath"
        title-fallback="Local API Docs"
        description-fallback="OpenAPI schema loaded from local resources file"
        @schema-error="onSchemaError"
      />
    </ClientOnly>
  </div>
</template>
