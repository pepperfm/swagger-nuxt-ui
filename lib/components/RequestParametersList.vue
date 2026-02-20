<script setup lang="ts">
import type { IParameter } from '../types'

const props = withDefaults(defineProps<{
  parameters?: IParameter[]
}>(), {
  parameters: () => [],
})
</script>

<template>
  <div class="space-y-4">
    <USeparator
      v-if="props.parameters.length"
      label="Parameters"
    />
    <div
      v-for="param in props.parameters"
      :key="param.name + param.in"
      class="border-l-2 pl-4 border-muted"
    >
      <div class="flex items-center gap-2 text-lg font-medium text-foreground">
        <code class="font-mono">{{ param.name }}</code>
        <UBadge
          size="sm"
          variant="soft"
          color="primary"
        >
          {{ param.in }}
        </UBadge>
        <UBadge
          size="sm"
          variant="soft"
          color="info"
        >
          {{ param.type }}
        </UBadge>
        <UBadge
          v-if="param.required"
          size="sm"
          variant="soft"
          color="warning"
        >
          required
        </UBadge>
      </div>
      <p
        v-if="param.description"
        class="text-sm text-muted mt-1"
        v-html="param.description"
      />
    </div>
  </div>
</template>
