import type { ComputedRef } from 'vue'
import type {
  AuthorizationResolveResult,
  NormalizedSecuritySchemeMeta,
  OpenApiSecurityRequirement,
  OpenApiSecurityScheme,
  ViewerAuthorizationState,
} from '../types'
import { computed, ref, watch } from 'vue'
import {
  buildSecuritySchemeMetaMap,
  resolveRequestAuthorization,
} from './requestEmulatorUtils'

const AUTH_STORAGE_KEY = 'swagger-ui:authorization:v1'

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readPersistedCredentials(): Record<string, string> {
  if (!canUseStorage()) {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    const next: Record<string, string> = {}
    Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
      next[key] = String(value ?? '')
    })

    return next
  } catch (error) {
    console.warn('[useViewerAuthorization] Failed to read persisted credentials', { error })
    return {}
  }
}

function persistCredentials(credentials: Record<string, string>) {
  if (!canUseStorage()) {
    return
  }

  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(credentials))
  } catch (error) {
    console.warn('[useViewerAuthorization] Failed to persist credentials', { error })
  }
}

export function useViewerAuthorization(options: {
  securitySchemes: ComputedRef<Record<string, OpenApiSecurityScheme>>
}) {
  const state = ref<ViewerAuthorizationState>({
    bySchemeKey: {},
  })

  const schemeMetaMap = computed<Record<string, NormalizedSecuritySchemeMeta>>(() => {
    return buildSecuritySchemeMetaMap(options.securitySchemes.value)
  })

  const schemeMetaList = computed<NormalizedSecuritySchemeMeta[]>(() => {
    return Object.values(schemeMetaMap.value).sort((left, right) => left.key.localeCompare(right.key))
  })

  const hasSchemes = computed(() => schemeMetaList.value.length > 0)

  const authorizedCount = computed(() => {
    return Object.values(state.value.bySchemeKey).filter(value => value.trim() !== '').length
  })

  const isAuthorized = computed(() => authorizedCount.value > 0)

  function normalizeCredential(value: string | null | undefined): string {
    return (value ?? '').trim()
  }

  function setCredential(schemeKey: string, credential: string) {
    state.value.bySchemeKey[schemeKey] = credential
  }

  function clearCredential(schemeKey: string) {
    state.value.bySchemeKey[schemeKey] = ''
  }

  function resetAllCredentials() {
    Object.keys(state.value.bySchemeKey).forEach((key) => {
      state.value.bySchemeKey[key] = ''
    })
  }

  function hasCredential(schemeKey: string): boolean {
    return normalizeCredential(state.value.bySchemeKey[schemeKey]).length > 0
  }

  function resolveForRequirements(
    securityRequirements: OpenApiSecurityRequirement[] | undefined,
  ): AuthorizationResolveResult {
    return resolveRequestAuthorization({
      securityRequirements,
      securitySchemes: options.securitySchemes.value,
      credentials: state.value.bySchemeKey,
    })
  }

  watch(
    options.securitySchemes,
    (nextSchemes) => {
      const persisted = readPersistedCredentials()
      const nextState: Record<string, string> = {}
      Object.keys(nextSchemes ?? {}).forEach((key) => {
        nextState[key] = state.value.bySchemeKey[key] ?? persisted[key] ?? ''
      })

      state.value.bySchemeKey = nextState
    },
    { immediate: true },
  )

  watch(
    () => state.value.bySchemeKey,
    (nextCredentials) => {
      persistCredentials(nextCredentials)
    },
    { deep: true },
  )

  return {
    state,
    schemeMetaMap,
    schemeMetaList,
    hasSchemes,
    isAuthorized,
    authorizedCount,
    hasCredential,
    setCredential,
    clearCredential,
    resetAllCredentials,
    resolveForRequirements,
  }
}
