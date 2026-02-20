<script setup lang="ts">
import type {
  EndpointSelection,
  IMethod,
  IParameter,
  OpenApiComponents,
  OpenApiSecurityScheme,
} from '../types'
import { computed } from 'vue'
import { useRequestEmulator } from '../composables/useRequestEmulator'
import ParameterInputField from './ParameterInputField.vue'
import RequestBodyEditor from './RequestBodyEditor.vue'

const props = withDefaults(defineProps<{
  endpoint: EndpointSelection
  method: IMethod | undefined
  parameters?: IParameter[]
  components: OpenApiComponents
  securityKey: string | null
  securityScheme: OpenApiSecurityScheme | null
  baseApiUrl: string
  requestTimeoutMs?: number
}>(), {
  parameters: () => [],
  requestTimeoutMs: 0,
})

const {
  auth,
  bodyEditorMode,
  hasRequestBody,
  requestBodyText,
  requestBodyContentType,
  requestBodyJsonWarning,
  requestBodyFormWarnings,
  requestBodyFormInputs,
  requestBodyFormValues,
  groupedInputs,
  validationErrors,
  isRequestValid,
  responseState,
  resetRequest,
  sendRequest,
} = useRequestEmulator({
  endpoint: computed(() => props.endpoint),
  method: computed(() => props.method),
  parameters: computed(() => props.parameters),
  components: computed(() => props.components),
  securityKey: computed(() => props.securityKey),
  securityScheme: computed(() => props.securityScheme),
  baseApiUrl: computed(() => props.baseApiUrl),
  requestTimeoutMs: props.requestTimeoutMs,
})

const headersCount = computed(() => {
  if (!responseState.value.result) {
    return 0
  }

  return Object.keys(responseState.value.result.headers).length
})

const sortedResponseHeaders = computed(() => {
  if (!responseState.value.result) {
    return []
  }

  return Object.entries(responseState.value.result.headers).sort(([left], [right]) => {
    return left.localeCompare(right)
  })
})

function formatResponseSize(value: unknown): string {
  if (typeof value !== 'string') {
    console.warn('[EndpointRequestCard] Invalid response body for size formatting', { valueType: typeof value })
    return '0 B'
  }

  const bytes = new TextEncoder().encode(value).length
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const kilobytes = bytes / 1024
  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`
  }

  const megabytes = kilobytes / 1024
  return `${megabytes.toFixed(1)} MB`
}

const responseSizeLabel = computed(() => {
  if (!responseState.value.result) {
    return '0 B'
  }

  return formatResponseSize(responseState.value.result.bodyText)
})

const validationByField = computed(() => {
  const map = new Map<string, string>()
  validationErrors.value.forEach((error) => {
    if (!map.has(error.field)) {
      map.set(error.field, error.message)
    }
  })
  return map
})

function errorForField(field: string): string | undefined {
  return validationByField.value.get(field)
}

function responseBadgeColor(status: number): 'primary' | 'warning' | 'error' {
  if (status >= 200 && status < 400) {
    return 'primary'
  }
  if (status >= 400 && status < 500) {
    return 'warning'
  }
  return 'error'
}

async function onSendClick() {
  await sendRequest()
}
</script>

<template>
  <div class="space-y-4">
    <USeparator label="REQUEST" />

    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UButton
            size="xs"
            label="Send"
            icon="i-lucide-send"
            :loading="responseState.isSending"
            :disabled="!isRequestValid || responseState.isSending"
            @click="onSendClick"
          />
          <UButton
            size="xs"
            label="Reset"
            icon="i-lucide-rotate-ccw"
            color="neutral"
            variant="soft"
            :disabled="responseState.isSending"
            @click="resetRequest"
          />
        </div>
      </template>

      <UScrollArea class="max-h-[56vh] pr-2">
        <div class="space-y-3 pe-1">
          <div
            v-if="props.securityKey && props.securityScheme"
            class="space-y-2"
          >
            <USeparator label="AUTH" />
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-muted">
                {{ props.securityKey }}
              </span>
              <UBadge
                size="sm"
                variant="soft"
                color="info"
              >
                {{ props.securityScheme.type }}
              </UBadge>
            </div>
            <UFormField
              label="Token"
              :error="errorForField('auth')"
            >
              <UInput
                v-model="auth.token"
                type="password"
                autocomplete="new-password"
                name="swagger-auth-token"
                autocapitalize="off"
                autocorrect="off"
                :spellcheck="false"
                data-lpignore="true"
                data-1p-ignore="true"
                placeholder="Paste access token"
                icon="i-lucide-key-round"
              />
            </UFormField>
          </div>

          <div
            v-if="groupedInputs.path.length"
            class="space-y-2"
          >
            <USeparator label="PATH" />
            <UFormField
              v-for="input in groupedInputs.path"
              :key="input.key"
              :label="input.name"
              :help="input.description || undefined"
              :error="errorForField(input.key)"
            >
              <ParameterInputField
                v-model="input.value"
                :spec="input.spec"
                :disabled="responseState.isSending"
              />
            </UFormField>
          </div>

          <div
            v-if="groupedInputs.query.length"
            class="space-y-2"
          >
            <USeparator label="QUERY" />
            <UFormField
              v-for="input in groupedInputs.query"
              :key="input.key"
              :label="input.name"
              :help="input.description || undefined"
              :error="errorForField(input.key)"
            >
              <ParameterInputField
                v-model="input.value"
                :spec="input.spec"
                :disabled="responseState.isSending"
              />
            </UFormField>
          </div>

          <div
            v-if="groupedInputs.header.length"
            class="space-y-2"
          >
            <USeparator label="HEADERS" />
            <UFormField
              v-for="input in groupedInputs.header"
              :key="input.key"
              :label="input.name"
              :help="input.description || undefined"
              :error="errorForField(input.key)"
            >
              <ParameterInputField
                v-model="input.value"
                :spec="input.spec"
                :disabled="responseState.isSending"
              />
            </UFormField>
          </div>

          <div
            v-if="groupedInputs.cookie.length"
            class="space-y-2"
          >
            <USeparator label="COOKIES" />
            <UFormField
              v-for="input in groupedInputs.cookie"
              :key="input.key"
              :label="input.name"
              :help="input.description || undefined"
              :error="errorForField(input.key)"
            >
              <ParameterInputField
                v-model="input.value"
                :spec="input.spec"
                :disabled="responseState.isSending"
              />
            </UFormField>
          </div>

          <div
            v-if="hasRequestBody"
            class="space-y-2"
          >
            <USeparator label="BODY" />
            <UFormField :error="errorForField('body')">
              <RequestBodyEditor
                v-model:mode="bodyEditorMode"
                v-model:json-value="requestBodyText"
                v-model:form-values="requestBodyFormValues"
                :content-type="requestBodyContentType"
                :json-warning="requestBodyJsonWarning"
                :form-warnings="requestBodyFormWarnings"
                :form-inputs="requestBodyFormInputs"
                :disabled="responseState.isSending"
              />
            </UFormField>
          </div>

          <div
            v-if="validationErrors.length"
            role="alert"
            aria-live="polite"
          >
            <UAlert
              title="Request has validation errors"
              color="warning"
              variant="soft"
              :help="validationErrors[0]?.message"
            />
          </div>
        </div>
      </UScrollArea>
    </UCard>

    <USeparator label="RESPONSE" />

    <UCard
      v-if="responseState.isSending"
      variant="subtle"
    >
      <div class="flex items-center gap-2 text-sm text-muted">
        <UIcon
          name="i-lucide-loader"
          class="animate-spin"
        />
        Sending request...
      </div>
    </UCard>

    <div
      v-else-if="responseState.error"
      role="alert"
      aria-live="polite"
    >
      <UAlert
        title="Request failed"
        color="error"
        variant="soft"
        :help="responseState.error.message"
      />
    </div>

    <UCard
      v-else-if="responseState.result"
      variant="subtle"
    >
      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge :color="responseBadgeColor(responseState.result.status)" variant="outline">
            {{ responseState.result.status }}
          </UBadge>
          <span class="text-sm text-muted">{{ responseState.result.statusText }}</span>
          <span class="text-xs text-muted">{{ responseState.result.elapsedMs }} ms</span>
          <span class="text-xs text-muted">{{ responseSizeLabel }}</span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-muted">Headers</span>
          <UBadge
            size="sm"
            color="neutral"
            variant="soft"
          >
            {{ headersCount }}
          </UBadge>
        </div>

        <div
          v-if="sortedResponseHeaders.length"
          class="rounded border border-default p-2 bg-muted/10"
        >
          <p
            v-for="[name, value] in sortedResponseHeaders"
            :key="name"
            class="text-xs"
          >
            <code class="font-mono">{{ name }}</code>: {{ value }}
          </p>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-muted">Body</span>
        </div>

        <UScrollArea class="max-h-80 w-full rounded-md border border-default bg-muted/20">
          <pre class="text-xs font-mono whitespace-pre-wrap wrap-break-word p-2 text-muted-foreground">{{ responseState.result.bodyText || '(empty)' }}</pre>
        </UScrollArea>
      </div>
    </UCard>

    <UCard
      v-else
      variant="subtle"
    >
      <p class="text-sm text-muted">
        Send request to see response details.
      </p>
    </UCard>
  </div>
</template>
