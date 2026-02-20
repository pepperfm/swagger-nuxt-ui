<script setup lang="ts">
import type {
  RequestBodyFormInput,
  RequestBodyFormValueMap,
  RequestEmulatorParamValue,
} from '../types'
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
</script>

<template>
  <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
    <UFormField
      v-for="input in inputs"
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
</template>
