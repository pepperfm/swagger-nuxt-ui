<script setup lang="ts">
import type {
  RequestBodyEditorMode,
  RequestBodyFormInput,
  RequestBodyFormValueMap,
} from '../types'
import { computed } from 'vue'
import RequestBodyFormFields from './RequestBodyFormFields.vue'

const props = withDefaults(defineProps<{
  mode: RequestBodyEditorMode
  jsonValue: string
  contentType: string | null
  jsonWarning?: string | null
  formWarnings?: string[]
  formInputs: RequestBodyFormInput[]
  formValues: RequestBodyFormValueMap
  disabled?: boolean
}>(), {
  jsonWarning: null,
  formWarnings: () => [],
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:mode', value: RequestBodyEditorMode): void
  (e: 'update:jsonValue', value: string): void
  (e: 'update:formValues', value: RequestBodyFormValueMap): void
}>()

const isJsonBody = computed(() => {
  return typeof props.contentType === 'string' && props.contentType.toLowerCase().includes('json')
})

const isFormDisabled = computed(() => props.formInputs.length === 0)

const rawTabLabel = computed(() => (isJsonBody.value ? 'JSON' : 'Raw'))

const tabItems = computed(() => [
  {
    label: rawTabLabel.value,
    value: 'json',
    slot: 'json',
  },
  {
    label: 'Form',
    value: 'form',
    slot: 'form',
    disabled: isFormDisabled.value,
  },
])

const modeModel = computed<RequestBodyEditorMode>({
  get() {
    if (isFormDisabled.value && props.mode === 'form') {
      return 'json'
    }

    return props.mode
  },
  set(value) {
    if (value === 'form' && isFormDisabled.value) {
      return
    }

    emit('update:mode', value)
  },
})

const modeSourceLabel = computed(() => {
  if (modeModel.value === 'form') {
    return 'FORM'
  }

  return isJsonBody.value ? 'JSON' : 'RAW'
})

const jsonValueModel = computed<string>({
  get: () => props.jsonValue,
  set: value => emit('update:jsonValue', value),
})

const formValuesModel = computed<RequestBodyFormValueMap>({
  get: () => props.formValues,
  set: value => emit('update:formValues', value),
})
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between gap-2">
      <span class="text-xs text-muted">Content-Type</span>
      <UBadge
        size="sm"
        variant="soft"
        color="info"
      >
        {{ contentType || 'application/json' }}
      </UBadge>
    </div>

    <div class="flex items-center justify-between gap-2">
      <span class="text-xs text-muted">Body source</span>
      <UBadge
        size="sm"
        variant="soft"
        color="neutral"
      >
        {{ modeSourceLabel }}
      </UBadge>
    </div>

    <UTabs
      v-model="modeModel"
      :items="tabItems"
      size="sm"
      variant="link"
      :unmount-on-hide="false"
      class="swagger-ui-body-editor-tabs"
    >
      <template #json>
        <div class="space-y-2 pt-2">
          <UAlert
            v-if="jsonWarning"
            title="JSON sync warning"
            color="warning"
            variant="soft"
            :description="jsonWarning"
          />

          <UFormField>
            <UScrollArea class="max-h-[32rem] w-full">
              <UTextarea
                v-model="jsonValueModel"
                :rows="14"
                autoresize
                :maxrows="72"
                class="font-mono text-xs w-full"
                :disabled="disabled"
              />
            </UScrollArea>
          </UFormField>
        </div>
      </template>

      <template #form>
        <div class="space-y-2 pt-2">
          <UAlert
            v-if="formWarnings.length > 0"
            title="Form schema warning"
            color="warning"
            variant="soft"
            :description="formWarnings[0]"
          />

          <UAlert
            v-if="isFormDisabled"
            title="Form mode unavailable"
            color="neutral"
            variant="soft"
            description="Body schema has no resolvable fields for form mode."
          />

          <UScrollArea
            v-else
            class="max-h-72 w-full"
          >
            <RequestBodyFormFields
              v-model="formValuesModel"
              :inputs="formInputs"
              :disabled="disabled"
              class="pe-1"
            />
          </UScrollArea>
        </div>
      </template>
    </UTabs>
  </div>
</template>
