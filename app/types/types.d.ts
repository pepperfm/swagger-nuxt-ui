export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch'
export type NavigationMethod = HttpMethod | ''

export interface INavigationItem {
  _path: string
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

export interface IParameter {
  name: string
  in: string
  type: string
  description?: string
  required?: boolean
  schema?: {
    type: string
    format?: string
  }
}

export interface IResponseContent {
  schema?: {
    type?: string
    properties?: Record<string, any>
    example?: any
  }
  example?: any
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
        schema?: any
        example?: any
      }
    }
  }
  responses: {
    [statusCode: string]: IResponse
  }
  security?: Array<Record<string, unknown>>
}

export interface PathsObject {
  [path: string]: Partial<Record<HttpMethod, IMethod>>
}

export interface ResponseExample {
  status: string
  description: string
  example: Record<string, any>
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
  servers?: Array<{
    url: string
    description?: string
  }>
  paths: PathsObject
  components?: {
    schemas?: Record<string, any>
    responses?: Record<string, any>
    parameters?: Record<string, any>
    requestBodies?: Record<string, any>
    [key: string]: any
  }
  tags?: Array<{
    name: string
    description?: string
  }>
  [key: string]: any
}
