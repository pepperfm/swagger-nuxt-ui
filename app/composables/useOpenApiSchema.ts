import { ref } from 'vue'

const schema = ref<any>(null)
const isLoading = ref(false)
const loadError = ref('')

async function loadSchema(url: string) {
  isLoading.value = true
  loadError.value = ''
  try {
    const res = await fetch(`/api/swagger?url=${encodeURIComponent(url)}`)
    if (!res.ok) {
      throw new Error('Fetching error')
    }
    const json = await res.json()
    if (json.error) {
      throw new Error(json.error)
    }
    schema.value = json
    isLoading.value = false
    return true
  } catch {
    schema.value = null
    isLoading.value = false
    loadError.value = 'Fetching error'
    return false
  }
}

export function useOpenApiSchema() {
  return {
    schema,
    isLoading,
    loadError,
    loadSchema,
  }
}
