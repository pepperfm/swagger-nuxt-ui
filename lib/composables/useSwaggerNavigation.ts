import type { ComputedRef, Ref } from 'vue'
import type {
  HttpMethod,
  IApiSpec,
  IMethod,
  INavigationGroup,
  INavigationItem,
  NavigationIndex,
} from '../types'
import { computed } from 'vue'
import {
  buildEndpointAnchor,
  buildSchemaAnchor,
  normalizeNavigationAnchor,
} from './navigationAnchor'

const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete']

function isHttpMethod(method: string): method is HttpMethod {
  return HTTP_METHODS.includes(method as HttpMethod)
}

export function useSwaggerNavigation(schema: Ref<IApiSpec | null>): {
  endpointNavigation: ComputedRef<INavigationGroup[]>
  schemaNavigation: ComputedRef<INavigationGroup>
  navigationIndex: ComputedRef<NavigationIndex>
} {
  const navigationModel = computed<{
    endpointNavigation: INavigationGroup[]
    schemaNavigation: INavigationGroup
    navigationIndex: NavigationIndex
  }>(() => {
    const groups: Record<string, INavigationGroup> = {}
    const navigationIndex: NavigationIndex = {
      byAnchor: {},
      byOperationId: {},
      bySchemaName: {},
    }
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

        const anchor = buildEndpointAnchor(tag, typedConfig.operationId)
        const item: INavigationItem = {
          _path: `#${anchor}`,
          anchor,
          title: typedConfig.summary || 'No title provided',
          description: typedConfig.description ?? undefined,
          method,
          operationId: typedConfig.operationId,
        }

        groups[tag].children.push(item)

        const normalizedAnchor = normalizeNavigationAnchor(anchor)
        if (normalizedAnchor) {
          navigationIndex.byAnchor[normalizedAnchor] = item
          navigationIndex.byAnchor[normalizedAnchor.toLowerCase()] = item
        }

        navigationIndex.byOperationId[typedConfig.operationId] = item
        navigationIndex.byOperationId[typedConfig.operationId.toLowerCase()] = item
      })
    })

    const schemas = schema.value?.components?.schemas ?? {}
    const schemaNavigation: INavigationGroup = {
      _path: '#schemas',
      title: 'Schemas',
      children: Object.keys(schemas).map(name => ({
        _path: `#${buildSchemaAnchor(name)}`,
        anchor: buildSchemaAnchor(name),
        title: name,
        method: '',
        operationId: `schema-${name}`,
      })),
    }

    schemaNavigation.children.forEach((item) => {
      const normalizedAnchor = normalizeNavigationAnchor(item.anchor)
      if (normalizedAnchor) {
        navigationIndex.byAnchor[normalizedAnchor] = item
        navigationIndex.byAnchor[normalizedAnchor.toLowerCase()] = item
      }

      navigationIndex.bySchemaName[item.title] = item
      navigationIndex.bySchemaName[item.title.toLowerCase()] = item
    })

    return {
      endpointNavigation: Object.values(groups),
      schemaNavigation,
      navigationIndex,
    }
  })

  const endpointNavigation = computed(() => navigationModel.value.endpointNavigation)
  const schemaNavigation = computed(() => navigationModel.value.schemaNavigation)
  const navigationIndex = computed(() => navigationModel.value.navigationIndex)

  return {
    endpointNavigation,
    schemaNavigation,
    navigationIndex,
  }
}
