interface LocationLike {
  hash: string
  search: string
}

const SCHEMA_PREFIX = 'schemas/'
const LEGACY_SCHEMA_PREFIX = 'schema-'

function normalizeTagSegment(value: string): string {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[/\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'general'
}

function normalizeSchemaName(value: string): string {
  return value
    .trim()
    .replace(/^#+/, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
}

function decodeSafe(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function normalizeNavigationAnchor(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const decoded = decodeSafe(value.trim())
  if (!decoded) {
    return null
  }

  const withoutHash = decoded.replace(/^#+/, '')
  const withoutEdges = withoutHash
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/\/{2,}/g, '/')
    .trim()

  return withoutEdges || null
}

export function buildEndpointAnchor(tag: string, operationId: string): string {
  const normalizedTag = normalizeTagSegment(tag)
  const normalizedOperationId = normalizeNavigationAnchor(operationId) ?? operationId.trim()

  return `${normalizedTag}/${normalizedOperationId || 'operation'}`
}

export function buildSchemaAnchor(schemaName: string): string {
  return `${SCHEMA_PREFIX}${normalizeSchemaName(schemaName)}`
}

export function extractSchemaNameFromAnchor(anchor: string): string | null {
  const normalized = normalizeNavigationAnchor(anchor)
  if (!normalized) {
    return null
  }

  if (normalized.startsWith(SCHEMA_PREFIX)) {
    return normalized.slice(SCHEMA_PREFIX.length) || null
  }

  if (normalized.startsWith(LEGACY_SCHEMA_PREFIX)) {
    return normalized.slice(LEGACY_SCHEMA_PREFIX.length) || null
  }

  return null
}

export function extractOperationIdFromAnchor(anchor: string): string | null {
  const normalized = normalizeNavigationAnchor(anchor)
  if (!normalized) {
    return null
  }

  if (normalized.startsWith(SCHEMA_PREFIX) || normalized.startsWith(LEGACY_SCHEMA_PREFIX)) {
    return null
  }

  const parts = normalized.split('/').filter(Boolean)
  if (!parts.length) {
    return null
  }

  return parts.at(-1) ?? null
}

export function resolveAnchorFromLocation(locationLike: LocationLike): string | null {
  const hashAnchor = normalizeNavigationAnchor(locationLike.hash)
  if (hashAnchor) {
    return hashAnchor
  }

  const params = new URLSearchParams(locationLike.search)

  const directAnchor = normalizeNavigationAnchor(params.get('anchor'))
  if (directAnchor) {
    return directAnchor
  }

  const operationAnchor = normalizeNavigationAnchor(params.get('operation'))
  if (operationAnchor) {
    return operationAnchor
  }

  const schemaAnchor = normalizeNavigationAnchor(params.get('schema'))
  if (schemaAnchor) {
    if (schemaAnchor.startsWith(SCHEMA_PREFIX)) {
      return schemaAnchor
    }

    if (schemaAnchor.startsWith(LEGACY_SCHEMA_PREFIX)) {
      return buildSchemaAnchor(schemaAnchor.slice(LEGACY_SCHEMA_PREFIX.length))
    }

    return buildSchemaAnchor(schemaAnchor)
  }

  return null
}
