<script setup lang="ts">
import type { HttpMethod, INavigationGroup, INavigationItem } from '~/types/types'

defineProps<{
  navigation: INavigationGroup[]
  schemas: INavigationGroup
  badgeColor: (method: HttpMethod) => 'primary' | 'secondary' | 'warning' | 'error' | 'info'
  selectedOperationId?: string
}>()
defineEmits<{
  (e: 'select', item: INavigationItem): void
}>()
</script>

<template>
  <div class="space-y-6">
    <div>
      <USeparator
        label="ENDPOINTS"
        type="dashed"
      />
      <UAccordion :items="navigation">
        <template #leading="{ item }">
          <div class="text-xs font-semibold tracking-wide text-muted pl-4">
            {{ item.title }}
          </div>
        </template>

        <template #body="{ item }">
          <ul class="pl-5 space-y-3 mt-2">
            <li
              v-for="child in item.children"
              :key="child._path"
            >
              <button
                class="group flex items-center justify-between w-full cursor-pointer text-left text-sm focus:outline-none px-2 py-1 rounded-lg transition-colors text-primary"
                :class="[
                  selectedOperationId === child.operationId
                    ? 'bg-primary/10 dark:bg-primary/10'
                    : 'hover:bg-primary/5 dark:hover:bg-primary/5',
                ]"
                @click="$emit('select', child)"
              >
                <span class="group-hover">{{ child.title }}</span>
                <UBadge
                  :color="badgeColor(child.method as HttpMethod)"
                  size="sm"
                  class="uppercase"
                >
                  {{ child.method }}
                </UBadge>
              </button>
            </li>
          </ul>
        </template>
      </UAccordion>
    </div>

    <div>
      <USeparator
        label="SCHEMAS"
        type="dashed"
      />
      <ul class="pl-4 space-y-3 mt-2">
        <li
          v-for="child in schemas.children"
          :key="child._path"
        >
          <button
            class="group flex items-center justify-between w-full cursor-pointer text-left text-sm focus:outline-none px-2 py-1 rounded-lg transition-colors text-primary"
            :class="[
              selectedOperationId === child.operationId
                ? 'bg-primary/10 dark:bg-primary/10'
                : 'hover:bg-primary/5 dark:hover:bg-primary/5',
            ]"
            @click="$emit('select', child)"
          >
            <span>{{ child.title }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
