<script setup lang="ts">
import type { HttpMethod, INavigationGroup, INavigationItem } from '../types'

const props = withDefaults(defineProps<{
  navigation?: INavigationGroup[]
  schemas?: INavigationGroup
  badgeColor: (method: HttpMethod) => 'primary' | 'secondary' | 'warning' | 'error' | 'info'
  selectedOperationId?: string
}>(), {
  navigation: () => [],
  schemas: () => ({
    _path: '#schemas',
    title: 'Schemas',
    children: [],
  }),
})
defineEmits<{
  (e: 'select', item: INavigationItem): void
}>()

const accordionUi = {
  trigger: 'px-3 py-2.5',
  label: 'ps-1 text-sm font-semibold',
  trailingIcon: 'pe-1',
}
</script>

<template>
  <div class="space-y-6 swagger-ui-navigation">
    <div>
      <USeparator
        label="ENDPOINTS"
        type="dashed"
      />
      <UAccordion
        :items="props.navigation"
        label-key="title"
        value-key="_path"
        :ui="accordionUi"
      >
        <template #body="{ item }">
          <ul class="pl-4 space-y-3 mt-2">
            <li
              v-for="child in item.children ?? []"
              :key="child._path"
            >
              <button
                class="group flex items-center justify-between w-full cursor-pointer text-left text-sm focus:outline-none px-2 py-1 rounded-lg transition-colors text-primary"
                :class="[
                  props.selectedOperationId === child.operationId
                    ? 'bg-primary/10 dark:bg-primary/10'
                    : 'hover:bg-primary/5 dark:hover:bg-primary/5',
                ]"
                @click="$emit('select', child)"
              >
                <span class="group-hover">{{ child.title }}</span>
                <UBadge
                  :color="props.badgeColor(child.method as HttpMethod)"
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
          v-for="child in props.schemas.children ?? []"
          :key="child._path"
        >
          <button
            class="group flex items-center justify-between w-full cursor-pointer text-left text-sm focus:outline-none px-2 py-1 rounded-lg transition-colors text-primary"
            :class="[
              props.selectedOperationId === child.operationId
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
