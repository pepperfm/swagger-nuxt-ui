import { useToast } from '@nuxt/ui/composables'
import { useClipboard } from '@vueuse/core'

export interface UseCopyOptions {
  onCopySuccess?: (content: string) => void
  onCopyError?: (error: unknown) => void
}

const COPY_TOAST_DURATION_MS = 2000

function normalizeCopyContent(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }

  try {
    return JSON.stringify(content, null, 2)
  } catch {
    return String(content)
  }
}

export function useCopy(options: UseCopyOptions = {}) {
  const { copy } = useClipboard()
  const toast = useToast()

  async function copyContent(content: unknown) {
    const normalized = normalizeCopyContent(content)

    try {
      await copy(normalized)
      toast.add({
        title: 'Copied',
        color: 'success',
        icon: 'i-lucide-copy-check',
        duration: COPY_TOAST_DURATION_MS,
      })
      options.onCopySuccess?.(normalized)
    } catch (error) {
      console.warn('[useCopy] Failed to copy content', error)
      toast.add({
        title: 'Copy failed',
        color: 'error',
        icon: 'i-lucide-alert-triangle',
        duration: COPY_TOAST_DURATION_MS,
      })
      options.onCopyError?.(error)
    }
  }

  return {
    copyContent,
  }
}
