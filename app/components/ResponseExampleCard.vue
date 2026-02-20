<script setup lang="ts">
import type { IMethod, OpenApiComponents } from '~/types/types'
import LibResponseExampleCard from '~~/lib/components/ResponseExampleCard.vue'

const props = defineProps<{
  method: IMethod | undefined
  components?: OpenApiComponents
}>()
</script>

<template>
  <LibResponseExampleCard v-bind="props" />
</template>
