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
</script>

<template>
  <div class="space-y-2">
    <UFormField
      v-for="input in inputs"
      :key="input.key"
      :label="input.label"
      :help="input.description || undefined"
      :required="input.required"
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
