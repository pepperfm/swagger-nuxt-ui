<script setup lang="ts">
import type { IParameter } from '~/types/types'
import LibRequestParametersList from '~~/lib/components/RequestParametersList.vue'

const props = defineProps<{
  parameters: IParameter[]
}>()
</script>

<template>
  <LibRequestParametersList v-bind="props" />
</template>
