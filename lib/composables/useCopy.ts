import { useClipboard } from '@vueuse/core'

export interface UseCopyOptions {
  onCopySuccess?: (content: string) => void
  onCopyError?: (error: unknown) => void
}

export function useCopy(options: UseCopyOptions = {}) {
  const { copy } = useClipboard()

  async function copyContent(content: string) {
    try {
      await copy(content)
      options.onCopySuccess?.(content)
    } catch (error) {
      console.warn('[useCopy] Failed to copy content', error)
      options.onCopyError?.(error)
    }
  }

  return {
    copyContent,
  }
}
