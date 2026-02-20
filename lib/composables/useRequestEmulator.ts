import type { ComputedRef, Ref } from 'vue'
import type {
  EndpointSelection,
  HttpMethod,
  IMethod,
  IParameter,
  OpenApiComponents,
  OpenApiParameterLocation,
  OpenApiSchemaObject,
  OpenApiSecurityScheme,
  RequestEmulatorAuthInput,
  RequestEmulatorExecutionState,
  RequestEmulatorParamInput,
  RequestEmulatorPreparedRequest,
  RequestEmulatorValidationError,
} from '../types'
import { computed, ref, watch } from 'vue'
import {
  applySecurityHeader,
  buildCurlCommand,
  buildRequestUrl,
  interpolatePathParams,
  serializeQueryParams,
} from './requestEmulatorUtils'
import {
  resolveInitialParameterValue,
  resolveParameterInputSpec,
  serializeParameterValue,
} from './requestParameterInputResolver'
import { generateExampleFromSchema } from './schemaExample'

interface UseRequestEmulatorOptions {
  endpoint: Ref<EndpointSelection | null>
  method: ComputedRef<IMethod | undefined>
  parameters: ComputedRef<IParameter[]>
  components: ComputedRef<OpenApiComponents>
  securityKey: ComputedRef<string | null>
  securityScheme: ComputedRef<OpenApiSecurityScheme | null>
  baseApiUrl: ComputedRef<string>
  requestTimeoutMs?: number
}

function isSupportedParamLocation(value: string): value is OpenApiParameterLocation {
  return value === 'path' || value === 'query' || value === 'header' || value === 'cookie'
}

function stringifyUnknown(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  if (value === undefined || value === null) {
    return ''
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function readRequestBodyContent(method: IMethod | undefined): {
  contentType: string | null
  schema: OpenApiSchemaObject | undefined
  example: unknown
  required: boolean
} {
  const required = Boolean(method?.requestBody?.required)
  const content = method?.requestBody?.content

  if (!content) {
    return {
      contentType: null,
      schema: undefined,
      example: undefined,
      required,
    }
  }

  const preferred = content['application/json']
    ?? content['multipart/form-data']
    ?? content['application/x-www-form-urlencoded']

  if (preferred) {
    const contentType = Object.entries(content).find(([, config]) => config === preferred)?.[0] ?? null
    return {
      contentType,
      schema: preferred.schema,
      example: preferred.example ?? preferred.schema?.example,
      required,
    }
  }

  const first = Object.entries(content)[0]
  if (!first) {
    return {
      contentType: null,
      schema: undefined,
      example: undefined,
      required,
    }
  }

  return {
    contentType: first[0],
    schema: first[1]?.schema,
    example: first[1]?.example ?? first[1]?.schema?.example,
    required,
  }
}

function createParamInput(param: IParameter): RequestEmulatorParamInput | null {
  const location = param.in
  if (!isSupportedParamLocation(location)) {
    return null
  }

  const spec = resolveParameterInputSpec(param, location)
  const seed = param.schema?.default ?? param.schema?.example
  return {
    key: `${location}:${param.name}`,
    name: param.name,
    in: location,
    required: Boolean(param.required),
    type: spec.valueKind,
    description: param.description ?? '',
    value: resolveInitialParameterValue(spec, seed),
    spec,
  }
}

function buildCookieHeader(inputs: RequestEmulatorParamInput[]): string | null {
  const pairs: Array<[string, string]> = []
  inputs
    .filter(input => input.in === 'cookie')
    .forEach((input) => {
      const serialized = serializeParameterValue(input.spec, input.value)
      if (serialized.length === 0) {
        return
      }

      const normalized = serialized.length > 1 ? serialized.join(',') : serialized[0]
      if (!normalized) {
        return
      }

      pairs.push([input.name, normalized])
    })

  if (!pairs.length) {
    return null
  }

  return pairs.map(([name, value]) => `${name}=${value}`).join('; ')
}

function parseResponseBody(text: string, contentType: string | null): {
  body: unknown
  bodyText: string
  bodyKind: 'json' | 'text' | 'empty'
} {
  if (!text.trim()) {
    return {
      body: null,
      bodyText: '',
      bodyKind: 'empty',
    }
  }

  if (contentType?.toLowerCase().includes('application/json')) {
    try {
      const parsed = JSON.parse(text)
      return {
        body: parsed,
        bodyText: JSON.stringify(parsed, null, 2),
        bodyKind: 'json',
      }
    } catch {
      console.warn('[useRequestEmulator] Response content-type is json but payload parsing failed')
    }
  }

  return {
    body: text,
    bodyText: text,
    bodyKind: 'text',
  }
}

export function useRequestEmulator(options: UseRequestEmulatorOptions) {
  const paramInputs = ref<RequestEmulatorParamInput[]>([])
  const emittedWarnings = ref<Set<string>>(new Set())
  const auth = ref<RequestEmulatorAuthInput>({
    securityKey: null,
    token: '',
  })
  const requestBodyText = ref('')
  const responseState = ref<RequestEmulatorExecutionState>({
    isSending: false,
    result: null,
    error: null,
  })

  const bodyMeta = computed(() => readRequestBodyContent(options.method.value))
  const hasRequestBody = computed(() => bodyMeta.value.contentType !== null)
  const groupedInputs = computed(() => ({
    path: paramInputs.value.filter(input => input.in === 'path'),
    query: paramInputs.value.filter(input => input.in === 'query'),
    header: paramInputs.value.filter(input => input.in === 'header'),
    cookie: paramInputs.value.filter(input => input.in === 'cookie'),
  }))

  const pathValues = computed(() => {
    return groupedInputs.value.path.reduce<Record<string, string>>((acc, input) => {
      const serialized = serializeParameterValue(input.spec, input.value)
      if (serialized.length === 0) {
        acc[input.name] = ''
        return acc
      }

      acc[input.name] = serialized.length > 1 ? serialized.join(',') : serialized[0] ?? ''
      return acc
    }, {})
  })

  const queryValues = computed(() => {
    return groupedInputs.value.query.reduce<Record<string, string | string[]>>((acc, input) => {
      const serialized = serializeParameterValue(input.spec, input.value)
      if (serialized.length === 0) {
        return acc
      }

      if (serialized.length > 1 && input.spec.serializationHint.arrayStyle === 'multi') {
        acc[input.name] = serialized
        return acc
      }

      acc[input.name] = serialized.length > 1 ? serialized.join(',') : serialized[0] ?? ''
      return acc
    }, {})
  })

  const headerValues = computed(() => {
    return groupedInputs.value.header.reduce<Record<string, string>>((acc, input) => {
      const serialized = serializeParameterValue(input.spec, input.value)
      if (serialized.length === 0) {
        return acc
      }

      const normalized = serialized.length > 1 ? serialized.join(',') : serialized[0]
      if (!normalized) {
        return acc
      }

      acc[input.name] = normalized
      return acc
    }, {})
  })

  const requestPath = computed(() => {
    const url = options.endpoint.value?.url ?? ''
    return interpolatePathParams(url, pathValues.value)
  })

  const validationErrors = computed<RequestEmulatorValidationError[]>(() => [])

  const preparedRequest = computed<RequestEmulatorPreparedRequest | null>(() => {
    const endpoint = options.endpoint.value
    if (!endpoint) {
      return null
    }

    const query = serializeQueryParams(queryValues.value)
    const url = buildRequestUrl(options.baseApiUrl.value, requestPath.value.path, query)
    const headers: Record<string, string> = { ...headerValues.value }
    const cookieHeader = buildCookieHeader(paramInputs.value)
    if (cookieHeader) {
      headers.Cookie = cookieHeader
    }

    if (bodyMeta.value.contentType && requestBodyText.value.trim() !== '') {
      headers['Content-Type'] = bodyMeta.value.contentType
    }

    const securityResult = applySecurityHeader({
      headers,
      securityScheme: options.securityScheme.value,
      securityKey: auth.value.securityKey,
      token: auth.value.token,
    })

    securityResult.warnings.forEach((message) => {
      if (emittedWarnings.value.has(message)) {
        return
      }
      emittedWarnings.value.add(message)
      console.warn('[useRequestEmulator] Security configuration warning', { message })
    })

    const bodyText = requestBodyText.value.trim() === '' ? null : requestBodyText.value

    const prepared: RequestEmulatorPreparedRequest = {
      url,
      method: endpoint.method,
      headers: securityResult.headers,
      bodyText,
      curl: '',
    }

    prepared.curl = buildCurlCommand(prepared)
    return prepared
  })

  const isRequestValid = computed(() => preparedRequest.value !== null)

  function initializeRequestState() {
    const nextInputs: RequestEmulatorParamInput[] = options.parameters.value
      .map(createParamInput)
      .filter((input): input is RequestEmulatorParamInput => input !== null)

    paramInputs.value = nextInputs

    auth.value = {
      securityKey: options.securityKey.value,
      token: '',
    }
    emittedWarnings.value = new Set()

    const meta = bodyMeta.value
    const baseExample = meta.example ?? generateExampleFromSchema(meta.schema, options.components.value)
    requestBodyText.value = stringifyUnknown(baseExample)
    responseState.value = {
      isSending: false,
      result: null,
      error: null,
    }
  }

  function resetRequest() {
    initializeRequestState()
  }

  async function sendRequest() {
    const prepared = preparedRequest.value
    if (!prepared) {
      responseState.value = {
        isSending: false,
        result: null,
        error: {
          code: 'invalid_request',
          message: 'Request is not ready yet.',
        },
      }
      console.warn('[useRequestEmulator] Request send skipped because endpoint is missing')
      return
    }

    responseState.value = {
      isSending: true,
      result: null,
      error: null,
    }

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined
    const controller = new AbortController()

    try {
      if (options.requestTimeoutMs && options.requestTimeoutMs > 0) {
        timeoutHandle = setTimeout(() => controller.abort(), options.requestTimeoutMs)
      }

      const startAt = performance.now()
      const response = await fetch(prepared.url, {
        method: prepared.method.toUpperCase() as Uppercase<HttpMethod>,
        headers: prepared.headers,
        body: prepared.bodyText,
        signal: controller.signal,
      })
      const elapsedMs = Math.round(performance.now() - startAt)

      const headerMap: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headerMap[key] = value
      })

      const rawBody = await response.text()
      const parsedBody = parseResponseBody(rawBody, response.headers.get('content-type'))

      responseState.value = {
        isSending: false,
        result: {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          elapsedMs,
          headers: headerMap,
          body: parsedBody.body,
          bodyText: parsedBody.bodyText,
          bodyKind: parsedBody.bodyKind,
        },
        error: null,
      }
    } catch (error) {
      const abortError = error instanceof Error && error.name === 'AbortError'
      const code = abortError ? 'network_error' : 'unexpected_error'
      const message = abortError
        ? 'Request timed out.'
        : error instanceof Error
          ? error.message
          : 'Unexpected request failure.'

      if (code === 'network_error') {
        console.warn('[useRequestEmulator] Request failed with network/timeout issue', { error })
      } else {
        console.error('[useRequestEmulator] Unexpected request execution failure', { error })
      }

      responseState.value = {
        isSending: false,
        result: null,
        error: {
          code,
          message,
        },
      }
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle)
      }
    }
  }

  watch(
    () => [
      options.endpoint.value?.operationId,
      options.method.value?.operationId,
    ],
    () => {
      initializeRequestState()
    },
    { immediate: true },
  )

  watch(options.securityKey, (value) => {
    auth.value.securityKey = value
  })

  return {
    auth,
    hasRequestBody,
    requestBodyText,
    requestBodyContentType: computed(() => bodyMeta.value.contentType),
    groupedInputs,
    preparedRequest,
    validationErrors,
    isRequestValid,
    responseState,
    resetRequest,
    sendRequest,
  }
}
