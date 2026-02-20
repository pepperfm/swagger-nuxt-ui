import type {
  IParameter,
  OpenApiParameterLocation,
  OpenApiSchemaObject,
  RequestEmulatorParamOption,
  RequestEmulatorParamValue,
  ResolvedParameterInputSpec,
} from '../types'

const MULTI_SELECT_THRESHOLD = 7
const TEXTAREA_MAX_LENGTH_THRESHOLD = 240

function readSchemaForParameter(param: IParameter): OpenApiSchemaObject {
  if (!param.schema || typeof param.schema !== 'object') {
    return {}
  }

  return param.schema
}

function inferRawType(param: IParameter, schema: OpenApiSchemaObject): string {
  const rawType = schema.type ?? param.type
  if (typeof rawType === 'string' && rawType.trim()) {
    return rawType
  }

  return 'string'
}

function inferExplode(location: OpenApiParameterLocation, param: IParameter): boolean {
  if (typeof param.explode === 'boolean') {
    return param.explode
  }

  if (location === 'path' || location === 'header') {
    return false
  }

  return true
}

function buildSerializationHint(location: OpenApiParameterLocation, param: IParameter) {
  const explode = inferExplode(location, param)
  const arrayStyle = location === 'query' && explode ? 'multi' : 'csv'

  return {
    arrayStyle,
    explode,
  } as const
}

function mapEnumToOptions(values: Array<string | number | boolean | null>): RequestEmulatorParamOption[] {
  return values
    .filter((value): value is string | number | boolean => value !== null)
    .map(value => ({
      label: String(value),
      value,
    }))
}

function resolveArrayControl(optionsCount: number): ResolvedParameterInputSpec['control'] {
  if (optionsCount === 0) {
    return 'text'
  }

  if (optionsCount <= MULTI_SELECT_THRESHOLD) {
    return 'checkbox-group'
  }

  return 'multi-select'
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function toBooleanOrNull(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') {
      return true
    }
    if (normalized === 'false') {
      return false
    }
  }

  if (typeof value === 'number') {
    if (value === 1) {
      return true
    }
    if (value === 0) {
      return false
    }
  }

  return null
}

function normalizeCollectionItem(value: unknown): string | number | boolean | null {
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized === '' ? null : normalized
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (value === null || value === undefined) {
    return null
  }

  return String(value)
}

function normalizeArrayItemByKind(
  itemKind: ResolvedParameterInputSpec['arrayItemKind'],
  value: string | number | boolean,
): string | number | boolean | null {
  if (itemKind === 'integer' || itemKind === 'number') {
    const numeric = toFiniteNumber(value)
    if (numeric === null) {
      return null
    }

    if (itemKind === 'integer') {
      return Math.trunc(numeric)
    }

    return numeric
  }

  if (itemKind === 'boolean') {
    return toBooleanOrNull(value)
  }

  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized === '' ? null : normalized
  }

  return value
}

function normalizeArraySeed(
  seed: unknown,
  itemKind: ResolvedParameterInputSpec['arrayItemKind'],
): Array<string | number | boolean> {
  const normalizeList = (items: Array<string | number | boolean>): Array<string | number | boolean> => {
    return items
      .map(item => normalizeArrayItemByKind(itemKind, item))
      .filter((item): item is string | number | boolean => item !== null)
  }

  if (Array.isArray(seed)) {
    return normalizeList(
      seed
        .map(normalizeCollectionItem)
        .filter((item): item is string | number | boolean => item !== null),
    )
  }

  if (typeof seed === 'string') {
    const normalized = seed.trim()
    if (!normalized) {
      return []
    }

    if (normalized.includes(',')) {
      return normalizeList(
        normalized
          .split(',')
          .map(part => part.trim())
          .filter(Boolean),
      )
    }

    return normalizeList([normalized])
  }

  const single = normalizeCollectionItem(seed)
  if (single === null) {
    return []
  }

  return normalizeList([single])
}

function normalizeStringSeed(seed: unknown): string {
  if (typeof seed === 'string') {
    return seed
  }

  if (seed === null || seed === undefined) {
    return ''
  }

  if (typeof seed === 'number' || typeof seed === 'boolean') {
    return String(seed)
  }

  try {
    return JSON.stringify(seed, null, 2)
  } catch {
    return String(seed)
  }
}

export function resolveParameterInputSpec(
  param: IParameter,
  location: OpenApiParameterLocation,
): ResolvedParameterInputSpec {
  const schema = readSchemaForParameter(param)
  const format = typeof schema.format === 'string' ? schema.format : null
  const rawType = inferRawType(param, schema)
  const enumOptions = mapEnumToOptions(schema.enum ?? [])
  const hint = buildSerializationHint(location, param)

  if (rawType === 'array') {
    const itemSchema = schema.items ?? {}
    const itemType = typeof itemSchema.type === 'string' ? itemSchema.type : 'string'
    const itemOptions = mapEnumToOptions(itemSchema.enum ?? [])

    return {
      control: resolveArrayControl(itemOptions.length),
      valueKind: 'array',
      arrayItemKind: itemType === 'integer'
        ? 'integer'
        : itemType === 'number'
          ? 'number'
          : itemType === 'boolean'
            ? 'boolean'
            : 'string',
      multiple: true,
      format: typeof itemSchema.format === 'string' ? itemSchema.format : null,
      placeholder: 'Comma-separated values',
      options: itemOptions,
      min: toFiniteNumber(itemSchema.minimum),
      max: toFiniteNumber(itemSchema.maximum),
      step: toFiniteNumber(itemSchema.multipleOf),
      serializationHint: hint,
      // Keep type semantics available through fallback placeholders/tooltips.
    }
  }

  if (enumOptions.length > 0) {
    return {
      control: 'select',
      valueKind: rawType === 'integer'
        ? 'integer'
        : rawType === 'number'
          ? 'number'
          : rawType === 'boolean'
            ? 'boolean'
            : 'string',
      arrayItemKind: null,
      multiple: false,
      format,
      placeholder: 'Select value',
      options: enumOptions,
      min: toFiniteNumber(schema.minimum),
      max: toFiniteNumber(schema.maximum),
      step: toFiniteNumber(schema.multipleOf),
      serializationHint: hint,
    }
  }

  if (rawType === 'boolean') {
    return {
      control: 'boolean',
      valueKind: 'boolean',
      arrayItemKind: null,
      multiple: false,
      format,
      placeholder: 'Toggle value',
      options: [],
      min: null,
      max: null,
      step: null,
      serializationHint: hint,
    }
  }

  if (rawType === 'integer' || rawType === 'number') {
    const min = toFiniteNumber(schema.minimum)
    const max = toFiniteNumber(schema.maximum)
    const step = toFiniteNumber(schema.multipleOf)
    const isBoundedSlider = min !== null && max !== null && max > min && (max - min) <= 100

    return {
      control: isBoundedSlider ? 'slider' : 'number',
      valueKind: rawType === 'integer' ? 'integer' : 'number',
      arrayItemKind: null,
      multiple: false,
      format,
      placeholder: rawType,
      options: [],
      min,
      max,
      step,
      serializationHint: hint,
    }
  }

  if (rawType === 'string' && (format === 'date' || format === 'date-time')) {
    return {
      control: 'date',
      valueKind: format,
      arrayItemKind: null,
      multiple: false,
      format,
      placeholder: format,
      options: [],
      min: null,
      max: null,
      step: null,
      serializationHint: hint,
    }
  }

  if (rawType === 'string' && format === 'time') {
    return {
      control: 'time',
      valueKind: 'time',
      arrayItemKind: null,
      multiple: false,
      format,
      placeholder: 'HH:mm:ss',
      options: [],
      min: null,
      max: null,
      step: null,
      serializationHint: hint,
    }
  }

  const maxLength = toFiniteNumber(schema.maxLength)
  return {
    control: maxLength !== null && maxLength > TEXTAREA_MAX_LENGTH_THRESHOLD ? 'textarea' : 'text',
    valueKind: 'string',
    arrayItemKind: null,
    multiple: false,
    format,
    placeholder: format ?? rawType,
    options: [],
    min: null,
    max: null,
    step: null,
    serializationHint: hint,
  }
}

function normalizeScalarBySpec(spec: ResolvedParameterInputSpec, seed: unknown): string | number | boolean | null {
  if (seed === null || seed === undefined) {
    if (spec.control === 'select' || spec.control === 'radio-group') {
      return null
    }
  }

  if (spec.valueKind === 'boolean') {
    return toBooleanOrNull(seed)
  }

  if (spec.valueKind === 'number' || spec.valueKind === 'integer') {
    const numeric = toFiniteNumber(seed)
    if (numeric === null) {
      return spec.control === 'slider'
        ? spec.min ?? 0
        : null
    }

    if (spec.valueKind === 'integer') {
      return Math.trunc(numeric)
    }

    return numeric
  }

  const text = normalizeStringSeed(seed)
  if (spec.control === 'date' && text.includes('T')) {
    return text.split('T')[0] ?? ''
  }

  return text
}

export function resolveInitialParameterValue(
  spec: ResolvedParameterInputSpec,
  seed: unknown,
): RequestEmulatorParamValue {
  if (spec.multiple) {
    return normalizeArraySeed(seed, spec.arrayItemKind)
  }

  return normalizeScalarBySpec(spec, seed)
}

function stringifyCollectionItem(value: string | number | boolean): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return ''
    }

    return String(value)
  }

  return value ? 'true' : 'false'
}

export function serializeParameterValue(spec: ResolvedParameterInputSpec, value: RequestEmulatorParamValue): string[] {
  if (spec.multiple) {
    if (!Array.isArray(value)) {
      if (value !== null) {
        console.warn('[requestParameterInputResolver] Expected array value for multiple parameter control', { control: spec.control })
      }
      return []
    }

    return value
      .map(stringifyCollectionItem)
      .filter(Boolean)
  }

  if (value === null || value === undefined) {
    return []
  }

  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized ? [normalized] : []
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      console.warn('[requestParameterInputResolver] Non-finite numeric parameter value detected during serialization')
      return []
    }

    return [String(value)]
  }

  if (typeof value === 'boolean') {
    return [value ? 'true' : 'false']
  }

  console.warn('[requestParameterInputResolver] Unsupported scalar parameter value detected during serialization', {
    valueType: typeof value,
  })
  return []
}

export function isParameterValueEmpty(spec: ResolvedParameterInputSpec, value: RequestEmulatorParamValue): boolean {
  if (spec.multiple) {
    return !Array.isArray(value) || value.length === 0
  }

  if (spec.valueKind === 'boolean') {
    return value !== true && value !== false
  }

  if (spec.valueKind === 'number' || spec.valueKind === 'integer') {
    return typeof value !== 'number' || !Number.isFinite(value)
  }

  return typeof value !== 'string' || value.trim() === ''
}
