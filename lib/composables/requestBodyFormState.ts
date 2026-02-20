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
const PATH_TOKEN_REGEXP = /([^[.\]]+)|\[(\d+)\]/g

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

type PathToken = string | number

function parsePathTokens(path: string): PathToken[] {
  const tokens: PathToken[] = []
  const normalizedPath = path.trim()
  if (!normalizedPath) {
    return tokens
  }

  for (const match of normalizedPath.matchAll(PATH_TOKEN_REGEXP)) {
    if (match[1]) {
      tokens.push(match[1])
      continue
    }

    if (match[2]) {
      tokens.push(Number(match[2]))
    }
  }

  return tokens
}

function createContainer(nextToken: PathToken | undefined): Record<string, unknown> | unknown[] {
  return typeof nextToken === 'number' ? [] : {}
}

function setNestedValue(target: unknown, path: string, value: unknown): unknown {
  const tokens = parsePathTokens(path)
  if (!tokens.length) {
    return target
  }

  let root: unknown = target
  if (typeof root !== 'object' || root === null) {
    root = createContainer(tokens[0])
  }

  if (typeof tokens[0] === 'number' && !Array.isArray(root)) {
    root = []
  }

  let cursor: unknown = root

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token === undefined) {
      continue
    }

    const isLast = index === tokens.length - 1
    const nextToken = tokens[index + 1]

    if (typeof token === 'number') {
      if (!Array.isArray(cursor)) {
        break
      }

      if (isLast) {
        cursor[token] = value
        break
      }

      const existing = cursor[token]
      if (typeof existing !== 'object' || existing === null) {
        cursor[token] = createContainer(nextToken)
      }

      cursor = cursor[token]
      continue
    }

    if (typeof cursor !== 'object' || cursor === null || Array.isArray(cursor)) {
      break
    }

    const objectCursor = cursor as Record<string, unknown>

    if (isLast) {
      objectCursor[token] = value
      break
    }

    const existing = objectCursor[token]
    if (typeof existing !== 'object' || existing === null) {
      objectCursor[token] = createContainer(nextToken)
    }

    cursor = objectCursor[token]
  }

  return root
}

function getNestedValue(source: unknown, path: string): unknown {
  const tokens = parsePathTokens(path)
  if (!tokens.length) {
    return undefined
  }

  let cursor: unknown = source
  for (const token of tokens) {
    if (typeof token === 'number') {
      if (!Array.isArray(cursor) || token < 0 || token >= cursor.length) {
        return undefined
      }

      cursor = cursor[token]
      continue
    }

    if (typeof cursor !== 'object' || cursor === null || !(token in cursor)) {
      return undefined
    }

    cursor = (cursor as Record<string, unknown>)[token]
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

  let payload: unknown = {}
  let hasAtLeastOneField = false

  inputs.forEach((input) => {
    if (input.path === ROOT_PATH) {
      return
    }

    const value = values[input.path] ?? null
    if (isParameterValueEmpty(input.spec, value)) {
      return
    }

    payload = setNestedValue(payload, input.path, toSerializableValue(value))
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
