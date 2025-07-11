import { ref } from 'vue'

const schema = ref<any>(null)
const url = ref<string | undefined>('')

export function useOpenApiSchema() {
  return {
    schema,
    url
  }
}
