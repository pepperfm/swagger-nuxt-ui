<script setup lang="ts">
import type { OpenApiSchemaObject } from '~/types/types'
import LibRequestBodyCard from '~~/lib/components/RequestBodyCard.vue'

const props = defineProps<{
  schema: Record<string, OpenApiSchemaObject>
}>()
</script>

<template>
  <LibRequestBodyCard v-bind="props" />
</template>
