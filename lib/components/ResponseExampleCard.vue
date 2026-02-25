<script setup lang="ts">
import type { IMethod, OpenApiComponents, ResponseExample } from '../types'
import { computed, ref, watch } from 'vue'
import { generateExampleFromSchema } from '../composables/schemaExample'
import { useCopy } from '../composables/useCopy'

const props = defineProps<{
  method: IMethod | undefined
  components?: OpenApiComponents
}>()

const { copyContent } = useCopy()

const examples = computed<ResponseExample[]>(() => {
  if (!props.method?.responses) {
    return []
  }

  return Object.entries(props.method.responses)
    .map(([status, response]) => {
      const content = response.content?.['application/json']
      if (!content) {
        return null
      }

      const schema = content.schema
      const explicitExample = content.example ?? schema?.example

      return {
        status,
        description: response.description,
        example: explicitExample ?? generateExampleFromSchema(schema, props.components ?? {}),
      }
    })
    .filter((item): item is ResponseExample => item !== null)
})

function getBadgeColor(status: string): 'primary' | 'warning' | 'error' {
  const code = Number.parseInt(status)
  if (code >= 200 && code < 300) {
    return 'primary'
  }
  if (code >= 400 && code < 500) {
    return 'warning'
  }
  if (code >= 500) {
    return 'error'
  }
  return 'primary'
}

const selectedStatus = ref<string | null>(null)
watch(() => props.method, () => {
  selectedStatus.value = examples.value[0]?.status ?? null
}, { immediate: true })
</script>

<template>
  <div v-if="examples.length">
    <USeparator label="Responses" />

    <div class="flex flex-wrap gap-2 mb-2">
      <UBadge
        v-for="item in examples"
        :key="item.status"
        :color="getBadgeColor(item.status)"
        size="lg"
        class="cursor-pointer"
        :variant="selectedStatus === item.status ? 'solid' : 'soft'"
        @click="selectedStatus = item.status"
      >
        {{ item.status }}
      </UBadge>
    </div>

    <div
      v-for="item in examples"
      v-show="item.status === selectedStatus"
      :key="`${item.status}-example`"
    >
      <p class="text-md text-muted-foreground mb-1">
        {{ item.description }}
      </p>
      <pre
        v-if="item.example !== undefined"
        class="text-xs font-mono whitespace-pre-wrap rounded p-2 bg-muted text-muted-foreground cursor-pointer"
        @click="copyContent(JSON.stringify(item.example, null, 2))"
      >{{ JSON.stringify(item.example, null, 2) }}</pre>
    </div>
  </div>
</template>
