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
  minimum?: number
  maximum?: number
  multipleOf?: number
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
  openIdConnectUrl?: string
  flows?: Record<string, unknown>
}

export type OpenApiSecurityRequirement = Record<string, string[]>

export type NormalizedSecuritySchemeKind = 'http-bearer'
  | 'http-basic'
  | 'api-key-header'
  | 'api-key-query'
  | 'api-key-cookie'
  | 'oauth2-bearer'
  | 'openid-connect-bearer'
  | 'unsupported'

export interface NormalizedSecuritySchemeMeta {
  key: string
  type: string
  kind: NormalizedSecuritySchemeKind
  supported: boolean
  label: string
  description: string
  headerName: string | null
  queryName: string | null
  cookieName: string | null
}

export interface ViewerAuthorizationState {
  bySchemeKey: Record<string, string>
}

export interface AuthorizationTarget {
  headers: Record<string, string>
  query: Record<string, string>
  cookies: Record<string, string>
}

export interface AuthorizationResolveResult {
  target: AuthorizationTarget
  appliedKeys: string[]
  missingKeys: string[]
  warnings: string[]
  hasSatisfiedRequirement: boolean
}

export type OpenApiParameterLocation = 'path' | 'query' | 'header' | 'cookie'

export type RequestEmulatorParamControl = 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multi-select'
  | 'checkbox-group'
  | 'radio-group'
  | 'date'
  | 'time'
  | 'slider'

export type RequestEmulatorParamScalarValue = string | number | boolean | null
export type RequestEmulatorParamCollectionValue = Array<string | number | boolean>
export type RequestEmulatorParamValue = RequestEmulatorParamScalarValue | RequestEmulatorParamCollectionValue

export interface RequestEmulatorParamOption {
  label: string
  value: string | number | boolean
}

export interface RequestEmulatorParamSerializationHint {
  arrayStyle: 'csv' | 'multi'
  explode: boolean
}

export interface ResolvedParameterInputSpec {
  control: RequestEmulatorParamControl
  valueKind: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'date' | 'date-time' | 'time' | 'unknown'
  arrayItemKind: 'string' | 'number' | 'integer' | 'boolean' | null
  multiple: boolean
  format: string | null
  placeholder: string
  options: RequestEmulatorParamOption[]
  min: number | null
  max: number | null
  step: number | null
  serializationHint: RequestEmulatorParamSerializationHint
}

export interface RequestEmulatorParamInput {
  key: string
  name: string
  in: OpenApiParameterLocation
  required: boolean
  type: string
  description?: string
  value: RequestEmulatorParamValue
  spec: ResolvedParameterInputSpec
}

export type RequestBodyEditorMode = 'json' | 'form'

export interface RequestBodyFormInput {
  key: string
  path: string
  label: string
  description?: string
  required: boolean
  nullable: boolean
  spec: ResolvedParameterInputSpec
  seed: unknown
}

export type RequestBodyFormValueMap = Record<string, RequestEmulatorParamValue>

export interface RequestBodyFormResolutionResult {
  inputs: RequestBodyFormInput[]
  warnings: string[]
}

export interface RequestEmulatorValidationError {
  field: string
  message: string
}

export interface RequestEmulatorPreparedRequest {
  url: string
  method: HttpMethod
  headers: Record<string, string>
  bodyText: string | null
  body: BodyInit | null
  curl: string
}

export interface RequestEmulatorResponseResult {
  status: number
  statusText: string
  ok: boolean
  elapsedMs: number
  headers: Record<string, string>
  body: unknown
  bodyText: string
  bodyKind: 'json' | 'text' | 'empty'
}

export interface RequestEmulatorExecutionError {
  code: 'invalid_request' | 'network_error' | 'unexpected_error'
  message: string
}

export interface RequestEmulatorExecutionState {
  isSending: boolean
  result: RequestEmulatorResponseResult | null
  error: RequestEmulatorExecutionError | null
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
  style?: string
  explode?: boolean
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
    required?: boolean
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
  servers?: OpenApiServerObject[]
  security?: OpenApiSecurityRequirement[]
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
  security?: OpenApiSecurityRequirement[]
  tags?: Array<{
    name: string
    description?: string
  }>
  [key: string]: unknown
}
