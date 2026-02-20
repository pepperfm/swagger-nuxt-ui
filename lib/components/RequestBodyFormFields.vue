<script setup lang="ts">
import type {
  RequestBodyFormInput,
  RequestBodyFormValueMap,
  RequestEmulatorParamValue,
} from '../types'
import { computed } from 'vue'
import { resolveInitialParameterValue } from '../composables/requestParameterInputResolver'
import ParameterInputField from './ParameterInputField.vue'

const props = withDefaults(defineProps<{
  inputs: RequestBodyFormInput[]
  modelValue: RequestBodyFormValueMap
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: RequestBodyFormValueMap): void
}>()

function updateInputValue(path: string, value: RequestEmulatorParamValue) {
  emit('update:modelValue', {
    ...props.modelValue,
    [path]: value,
  })
}

function readInputValue(path: string): RequestEmulatorParamValue | null {
  return props.modelValue[path] ?? null
}

function isNestedPath(path: string): boolean {
  return path.includes('.') || path.includes('[')
}

interface ArrayGroup {
  rootPath: string
  label: string
  templateInputs: RequestBodyFormInput[]
}

interface ArrayGroupView {
  group: ArrayGroup
  indices: number[]
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function readArrayRoot(path: string): string | null {
  const match = path.match(/^(.+?)\[0\](?:\.|$)/)
  return match?.[1] ?? null
}

function replaceFirstArrayIndex(path: string, index: number): string {
  return path.replace(/\[0\]/, `[${index}]`)
}

function normalizeArrayGroupLabel(path: string): string {
  const segment = path.split('.').at(-1) ?? path
  const normalized = segment
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return 'Items'
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const arrayGroups = computed<ArrayGroup[]>(() => {
  const grouped = new Map<string, ArrayGroup>()

  props.inputs.forEach((input) => {
    const rootPath = readArrayRoot(input.path)
    if (!rootPath) {
      return
    }

    const existing = grouped.get(rootPath)
    if (existing) {
      existing.templateInputs.push(input)
      return
    }

    grouped.set(rootPath, {
      rootPath,
      label: normalizeArrayGroupLabel(rootPath),
      templateInputs: [input],
    })
  })

  return [...grouped.values()]
})

const scalarInputs = computed(() => {
  return props.inputs.filter(input => !readArrayRoot(input.path))
})

const arrayGroupViews = computed<ArrayGroupView[]>(() => {
  return arrayGroups.value.map(group => ({
    group,
    indices: readArrayIndices(group.rootPath),
  }))
})

function readArrayIndices(rootPath: string, valueMap: RequestBodyFormValueMap = props.modelValue): number[] {
  const pattern = new RegExp(`^${escapeRegExp(rootPath)}\\[(\\d+)\\]`)
  const indices = new Set<number>()

  Object.keys(valueMap).forEach((path) => {
    const match = path.match(pattern)
    if (!match) {
      return
    }

    const index = Number(match[1])
    if (Number.isInteger(index) && index >= 0) {
      indices.add(index)
    }
  })

  if (indices.size === 0) {
    indices.add(0)
  }

  return [...indices].sort((left, right) => left - right)
}

function buildIndexInputs(group: ArrayGroup, index: number): RequestBodyFormInput[] {
  return group.templateInputs.map(input => ({
    ...input,
    key: `${group.rootPath}:${index}:${input.key}`,
    path: replaceFirstArrayIndex(input.path, index),
  }))
}

function createArrayIndexValueMap(group: ArrayGroup, index: number): RequestBodyFormValueMap {
  return group.templateInputs.reduce<RequestBodyFormValueMap>((acc, templateInput) => {
    const path = replaceFirstArrayIndex(templateInput.path, index)
    acc[path] = resolveInitialParameterValue(templateInput.spec, templateInput.seed)
    return acc
  }, {})
}

function addArrayItem(group: ArrayGroup) {
  const indices = readArrayIndices(group.rootPath)
  const nextIndex = (indices.at(-1) ?? -1) + 1
  const seededValues = createArrayIndexValueMap(group, nextIndex)

  emit('update:modelValue', {
    ...props.modelValue,
    ...seededValues,
  })
}

function removeArrayItem(group: ArrayGroup, removedIndex: number) {
  const indices = readArrayIndices(group.rootPath)
  if (indices.length <= 1) {
    return
  }

  const pattern = new RegExp(`^${escapeRegExp(group.rootPath)}\\[(\\d+)\\](.*)$`)
  const nextValues: RequestBodyFormValueMap = {}

  Object.entries(props.modelValue).forEach(([path, value]) => {
    const match = path.match(pattern)
    if (!match) {
      nextValues[path] = value
      return
    }

    const index = Number(match[1])
    const suffix = match[2] ?? ''
    if (index === removedIndex) {
      return
    }

    const nextIndex = index > removedIndex ? index - 1 : index
    nextValues[`${group.rootPath}[${nextIndex}]${suffix}`] = value
  })

  emit('update:modelValue', nextValues)
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="scalarInputs.length > 0"
      class="grid grid-cols-1 gap-2 md:grid-cols-2"
    >
      <UFormField
        v-for="input in scalarInputs"
        :key="input.key"
        :label="input.label"
        :help="input.description || undefined"
        :required="input.required"
        :class="isNestedPath(input.path) ? 'md:col-span-1' : 'md:col-span-2'"
      >
        <ParameterInputField
          :model-value="readInputValue(input.path)"
          :spec="input.spec"
          :disabled="disabled"
          @update:model-value="updateInputValue(input.path, $event)"
        />
      </UFormField>
    </div>

    <UCard
      v-for="groupView in arrayGroupViews"
      :key="groupView.group.rootPath"
      variant="subtle"
    >
      <template #header>
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-medium text-highlighted">{{ groupView.group.label }}</span>
          <UButton
            size="xs"
            variant="soft"
            color="neutral"
            icon="i-lucide-plus"
            :disabled="disabled"
            @click="addArrayItem(groupView.group)"
          >
            Add item
          </UButton>
        </div>
      </template>

      <div class="space-y-3">
        <UCard
          v-for="index in groupView.indices"
          :key="`${groupView.group.rootPath}:${index}`"
          variant="outline"
        >
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-muted">Item {{ index + 1 }}</span>
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                :disabled="disabled || groupView.indices.length <= 1"
                @click="removeArrayItem(groupView.group, index)"
              >
                Remove
              </UButton>
            </div>
          </template>

          <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
            <UFormField
              v-for="input in buildIndexInputs(groupView.group, index)"
              :key="input.key"
              :label="input.label"
              :help="input.description || undefined"
              :required="input.required"
              :class="isNestedPath(input.path) ? 'md:col-span-1' : 'md:col-span-2'"
            >
              <ParameterInputField
                :model-value="readInputValue(input.path)"
                :spec="input.spec"
                :disabled="disabled"
                @update:model-value="updateInputValue(input.path, $event)"
              />
            </UFormField>
          </div>
        </UCard>
      </div>
    </UCard>
  </div>
</template>
