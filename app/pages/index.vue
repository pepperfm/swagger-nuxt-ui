<script setup lang="ts">
import type { SwaggerSchemaLoadError } from '~~/lib/composables/useSwaggerSchema'
import { computed } from 'vue'
import { SwaggerViewer } from '~~/lib'

const toast = useToast()

const runtimeConfig = useRuntimeConfig()
const baseApiUrl = computed(() => String(runtimeConfig.public.apiUrl ?? '').replace(/\/+$/, ''))
const schemaHeadline = computed(() => String(runtimeConfig.public.swaggerSchemaSource ?? '').trim())

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
        :schema-headline="schemaHeadline"
        title-fallback="Local API Docs"
        description-fallback="OpenAPI schema loaded from configured source"
        @schema-error="onSchemaError"
      />
    </ClientOnly>
  </div>
</template>
