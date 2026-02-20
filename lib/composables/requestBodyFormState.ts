import type {
  RequestBodyFormInput,
  RequestBodyFormValueMap,
  RequestEmulatorParamValue,
} from '../types'
import {
  isParameterValueEmpty,
  resolveInitialParameterValue,
} from './requestParameterInputResolver'

const ROOT_PATH = '$'

interface BodyHydrationResult {
  values: RequestBodyFormValueMap
  warnings: string[]
}

function toSerializableValue(value: RequestEmulatorParamValue): unknown {
  if (Array.isArray(value)) {
    return [...value]
  }

  return value
}

function setNestedValue(target: Record<string, unknown>, path: string, value: unknown) {
  const segments = path.split('.').filter(Boolean)
  if (!segments.length) {
    return
  }

  let cursor: Record<string, unknown> = target
  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1
    if (isLast) {
      cursor[segment] = value
      return
    }

    if (typeof cursor[segment] !== 'object' || cursor[segment] === null || Array.isArray(cursor[segment])) {
      cursor[segment] = {}
    }

    cursor = cursor[segment] as Record<string, unknown>
  })
}

function getNestedValue(source: unknown, path: string): unknown {
  const segments = path.split('.').filter(Boolean)
  if (!segments.length || typeof source !== 'object' || source === null) {
    return undefined
  }

  let cursor: unknown = source
  for (const segment of segments) {
    if (typeof cursor !== 'object' || cursor === null || !(segment in cursor)) {
      return undefined
    }

    cursor = (cursor as Record<string, unknown>)[segment]
  }

  return cursor
}

export function createInitialRequestBodyFormValues(inputs: RequestBodyFormInput[]): RequestBodyFormValueMap {
  return inputs.reduce<RequestBodyFormValueMap>((acc, input) => {
    acc[input.path] = resolveInitialParameterValue(input.spec, input.seed)
    return acc
  }, {})
}

export function buildRequestBodyFromFormValues(
  inputs: RequestBodyFormInput[],
  values: RequestBodyFormValueMap,
): unknown {
  const rootInput = inputs.find(input => input.path === ROOT_PATH)
  if (rootInput) {
    const value = values[rootInput.path] ?? null
    return isParameterValueEmpty(rootInput.spec, value)
      ? null
      : toSerializableValue(value)
  }

  const payload: Record<string, unknown> = {}
  let hasAtLeastOneField = false

  inputs.forEach((input) => {
    if (input.path === ROOT_PATH) {
      return
    }

    const value = values[input.path] ?? null
    if (isParameterValueEmpty(input.spec, value)) {
      return
    }

    setNestedValue(payload, input.path, toSerializableValue(value))
    hasAtLeastOneField = true
  })

  if (!hasAtLeastOneField) {
    return null
  }

  return payload
}

export function hydrateRequestBodyFormValues(
  inputs: RequestBodyFormInput[],
  payload: unknown,
  currentValues: RequestBodyFormValueMap,
): BodyHydrationResult {
  const warnings: string[] = []
  const nextValues: RequestBodyFormValueMap = { ...currentValues }
  const rootInput = inputs.find(input => input.path === ROOT_PATH)

  if (rootInput) {
    if (payload !== undefined) {
      nextValues[rootInput.path] = resolveInitialParameterValue(rootInput.spec, payload)
    }

    return {
      values: nextValues,
      warnings,
    }
  }

  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    warnings.push('[requestBodyFormState] JSON payload is not an object; form fields were kept unchanged')
    return {
      values: nextValues,
      warnings,
    }
  }

  inputs.forEach((input) => {
    const sourceValue = getNestedValue(payload, input.path)
    if (sourceValue === undefined) {
      return
    }

    nextValues[input.path] = resolveInitialParameterValue(input.spec, sourceValue)
  })

  return {
    values: nextValues,
    warnings,
  }
}
