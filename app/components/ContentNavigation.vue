<script setup lang="ts">
import type { HttpMethod, INavigationGroup, INavigationItem } from '~/types/types'
import LibContentNavigation from '~~/lib/components/ContentNavigation.vue'

const props = defineProps<{
  navigation: INavigationGroup[]
  schemas: INavigationGroup
  badgeColor: (method: HttpMethod) => 'primary' | 'secondary' | 'warning' | 'error' | 'info'
  selectedOperationId?: string
}>()

const emit = defineEmits<{
  (e: 'select', item: INavigationItem): void
}>()
</script>

<template>
  <LibContentNavigation
    v-bind="props"
    @select="emit('select', $event)"
  />
</template>
