import { useClipboard } from '@vueuse/core'

export function useCopy() {
  const { copy } = useClipboard()
  const toast = useToast()

  const copyContent = async (content: string) => {
    try {
      await copy(content)
      toast.add({
        title: 'Copied!',
        color: 'success',
        icon: 'i-lucide-copy',
        duration: 2000,
      })
    } catch {
      toast.add({
        title: 'Copy failed',
        color: 'error',
        icon: 'i-lucide-alert-triangle',
        duration: 3000,
      })
    }
  }

  return {
    copyContent,
  }
}
