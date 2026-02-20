<script setup lang="ts">
import type { OpenApiComponents, OpenApiSchemaObject } from '~/types/types'
import LibSchemaDetailCard from '~~/lib/components/SchemaDetailCard.vue'

const props = defineProps<{
  schema: OpenApiSchemaObject
  components?: OpenApiComponents
  isNested?: boolean
}>()
</script>

<template>
  <LibSchemaDetailCard v-bind="props" />
</template>
