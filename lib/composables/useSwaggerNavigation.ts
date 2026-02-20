import type { ComputedRef, Ref } from 'vue'
import type {
  HttpMethod,
  IApiSpec,
  IMethod,
  INavigationGroup,
  INavigationItem,
} from '../types'
import { computed } from 'vue'

const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete']

function isHttpMethod(method: string): method is HttpMethod {
  return HTTP_METHODS.includes(method as HttpMethod)
}

export function useSwaggerNavigation(schema: Ref<IApiSpec | null>): {
  endpointNavigation: ComputedRef<INavigationGroup[]>
  schemaNavigation: ComputedRef<INavigationGroup>
} {
  const endpointNavigation = computed<INavigationGroup[]>(() => {
    const groups: Record<string, INavigationGroup> = {}
    const paths = schema.value?.paths ?? {}

    Object.entries(paths).forEach(([url, methods]) => {
      Object.entries(methods).forEach(([method, config]) => {
        if (!isHttpMethod(method)) {
          console.warn('[useSwaggerNavigation] Unsupported method skipped', { method, url })
          return
        }

        const typedConfig = config as IMethod | undefined
        if (!typedConfig?.operationId) {
          console.warn('[useSwaggerNavigation] Operation without operationId skipped', { method, url })
          return
        }

        const tag = typedConfig.tags?.[0] ?? 'General'
        if (!groups[tag]) {
          groups[tag] = {
            _path: `#tag-${tag}`,
            title: tag,
            children: [],
          }
        }

        const item: INavigationItem = {
          _path: `#${method}-${url}`,
          title: typedConfig.summary || 'No title provided',
          description: typedConfig.description ?? undefined,
          method,
          operationId: typedConfig.operationId,
        }

        groups[tag].children.push(item)
      })
    })

    return Object.values(groups)
  })

  const schemaNavigation = computed<INavigationGroup>(() => {
    const schemas = schema.value?.components?.schemas ?? {}

    return {
      _path: '#schemas',
      title: 'Schemas',
      children: Object.keys(schemas).map(name => ({
        _path: `#schema-${name}`,
        title: name,
        method: '',
        operationId: `schema-${name}`,
      })),
    }
  })

  return {
    endpointNavigation,
    schemaNavigation,
  }
}
