<script setup lang="ts">
import type { IParameter } from '~/types/types'

defineProps<{
  parameters: IParameter[]
}>()
</script>

<template>
  <div class="space-y-4">
    <USeparator
      v-if="parameters.length"
      label="Parameters"
    />
    <div
      v-for="param in parameters"
      :key="param.name + param.in"
      class="border-l-2 pl-4 border-muted"
    >
      <div class="flex items-center gap-2 text-sm font-medium text-foreground">
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
        class="text-xs text-muted-foreground mt-1"
        v-html="param.description"
      />
    </div>
  </div>
</template>
