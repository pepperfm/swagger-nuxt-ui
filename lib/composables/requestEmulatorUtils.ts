import type {
  OpenApiSecurityScheme,
  RequestEmulatorPreparedRequest,
} from '../types'

function shellEscape(value: string): string {
  return `'${value.replace(/'/g, `'\"'\"'`)}'`
}

export function interpolatePathParams(pathTemplate: string, values: Record<string, string>): {
  path: string
  missing: string[]
} {
  const missing: string[] = []

  const path = pathTemplate.replace(/\{([^}]+)\}/g, (_match, paramName: string) => {
    const rawValue = values[paramName] ?? ''
    if (!rawValue.trim()) {
      missing.push(paramName)
      return `{${paramName}}`
    }

    return encodeURIComponent(rawValue.trim())
  })

  return { path, missing }
}

export function serializeQueryParams(values: Record<string, string | string[]>): string {
  const query = new URLSearchParams()

  Object.entries(values).forEach(([key, value]) => {
    const valuesList = Array.isArray(value) ? value : [value]
    valuesList.forEach((entry) => {
      const normalized = entry.trim()
      if (!normalized) {
        return
      }

      query.append(key, normalized)
    })
  })

  const encoded = query.toString()
  return encoded ? `?${encoded}` : ''
}

export function buildRequestUrl(baseApiUrl: string, endpointPath: string, query: string): string {
  const normalizedPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`
  const normalizedBase = baseApiUrl.trim().replace(/\/+$/, '')
  const absoluteOrProtocolRelative = /^https?:\/\//i.test(endpointPath) || endpointPath.startsWith('//')

  if (absoluteOrProtocolRelative) {
    return `${endpointPath}${query}`
  }

  if (!normalizedBase) {
    return `${normalizedPath}${query}`
  }

  return `${normalizedBase}${normalizedPath}${query}`
}

export function applySecurityHeader(options: {
  headers: Record<string, string>
  securityScheme: OpenApiSecurityScheme | null
  securityKey: string | null
  token: string
}): {
  headers: Record<string, string>
  warnings: string[]
} {
  const { headers, securityScheme, securityKey, token } = options
  const nextHeaders = { ...headers }
  const warnings: string[] = []
  const normalizedToken = token.trim()

  if (!securityKey || !securityScheme || !normalizedToken) {
    return { headers: nextHeaders, warnings }
  }

  if (securityScheme.type === 'http' && securityScheme.scheme?.toLowerCase() === 'bearer') {
    nextHeaders.Authorization = `Bearer ${normalizedToken}`
    return { headers: nextHeaders, warnings }
  }

  if (securityScheme.type === 'apiKey') {
    if (securityScheme.in === 'header' && securityScheme.name) {
      nextHeaders[securityScheme.name] = normalizedToken
      return { headers: nextHeaders, warnings }
    }

    warnings.push(`Unsupported apiKey location: ${securityScheme.in ?? 'unknown'}`)
    return { headers: nextHeaders, warnings }
  }

  warnings.push(`Unsupported security scheme: ${securityScheme.type}`)
  return { headers: nextHeaders, warnings }
}

export function buildCurlCommand(prepared: RequestEmulatorPreparedRequest): string {
  const parts = ['curl', '-X', prepared.method.toUpperCase(), shellEscape(prepared.url)]

  Object.entries(prepared.headers).forEach(([key, value]) => {
    parts.push('-H', shellEscape(`${key}: ${value}`))
  })

  if (prepared.bodyText !== null && prepared.bodyText.trim() !== '') {
    parts.push('--data-raw', shellEscape(prepared.bodyText))
  }

  return parts.join(' ')
}
