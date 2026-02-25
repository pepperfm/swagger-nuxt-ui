export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch'
export type NavigationMethod = HttpMethod | ''

export interface OpenApiSchemaObject {
  type?: string
  format?: string
  description?: string
  enum?: Array<string | number | boolean | null>
  nullable?: boolean
  required?: boolean | string[]
  default?: unknown
  example?: unknown
  minLength?: number
  maxLength?: number
  properties?: Record<string, OpenApiSchemaObject>
  items?: OpenApiSchemaObject
  allOf?: OpenApiSchemaObject[]
  oneOf?: OpenApiSchemaObject[]
  anyOf?: OpenApiSchemaObject[]
  $ref?: string
  [key: string]: unknown
}

export interface OpenApiSecurityScheme {
  type: string
  scheme?: string
  name?: string
  in?: string
  description?: string
  bearerFormat?: string
}

export interface INavigationItem {
  _path: string
  anchor: string
  title: string
  description?: string
  method: NavigationMethod
  operationId: string
}

export interface INavigationGroup {
  _path: string
  title: string
  children: INavigationItem[]
}

export interface NavigationIndex {
  byAnchor: Record<string, INavigationItem>
  byOperationId: Record<string, INavigationItem>
  bySchemaName: Record<string, INavigationItem>
}

export interface IParameter {
  name: string
  in: string
  type?: string
  description?: string
  required?: boolean
  schema?: OpenApiSchemaObject
}

export interface IResponseContent {
  schema?: OpenApiSchemaObject
  example?: unknown
}

export interface IResponse {
  description: string
  content?: {
    [contentType: string]: IResponseContent
  }
}

export interface IMethod {
  tags?: string[]
  summary?: string | null
  description?: string | null
  operationId: string
  parameters?: IParameter[]
  requestBody?: {
    content: {
      [contentType: string]: {
        schema?: OpenApiSchemaObject
        example?: unknown
      }
    }
  }
  responses: {
    [statusCode: string]: IResponse
  }
  security?: Array<Record<string, string[]>>
}

export interface PathsObject {
  [path: string]: Partial<Record<HttpMethod, IMethod>>
}

export interface ResponseExample {
  status: string
  description: string
  example: unknown
}

export interface EndpointSelection {
  type: 'endpoint'
  method: HttpMethod
  url: string
  summary?: string
  description?: string
  operationId: string
  anchor: string
}

export interface SchemaSelection {
  type: 'schema'
  name: string
  schema: OpenApiSchemaObject
  operationId: string
  anchor: string
}

export type SelectedItem = EndpointSelection | SchemaSelection

export interface OpenApiComponents {
  schemas?: Record<string, OpenApiSchemaObject>
  responses?: Record<string, unknown>
  parameters?: Record<string, unknown>
  requestBodies?: Record<string, unknown>
  securitySchemes?: Record<string, OpenApiSecurityScheme>
  [key: string]: unknown
}

export interface OpenApiServerVariableObject {
  default?: string
  enum?: string[]
  description?: string
}

export interface OpenApiServerObject {
  url: string
  description?: string
  variables?: Record<string, OpenApiServerVariableObject>
}

export interface IApiSpec {
  openapi: string
  info: {
    title: string
    description?: string
    version: string
    contact?: {
      email?: string
      name?: string
      url?: string
    }
    license?: {
      name: string
      url?: string
    }
  }
  servers?: OpenApiServerObject[]
  paths: PathsObject
  components?: OpenApiComponents
  tags?: Array<{
    name: string
    description?: string
  }>
  [key: string]: unknown
}
