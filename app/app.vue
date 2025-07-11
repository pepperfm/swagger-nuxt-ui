<script setup>
import { useOpenApiSchema } from '~/composables/useOpenApiSchema'

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const origin = ref('')
const toast = useToast()

async function loadSchema() {
  const { schema, url } = useOpenApiSchema()

  try {
    const res = await fetch(`/api/swagger?url=${encodeURIComponent(origin.value)}`)

    url.value = origin.value
    schema.value = await res.json()

    toast.add({
      title: 'Schema loaded',
      color: 'green',
      icon: 'i-lucide-check'
    })
  } catch {
    toast.add({
      title: 'Failed to load schema',
      color: 'red',
      icon: 'i-lucide-x-circle'
    })
  }
}

const title = 'Nuxt Starter Template'
const description = 'Nuxt UI Pro is a collection of premium Vue components built on top of Nuxt UI to create beautiful & responsive Nuxt applications in minutes.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://assets.hub.nuxt.com/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJodHRwczovL3VpLXByby1zdGFydGVyLm51eHQuZGV2IiwiaWF0IjoxNzM5NDYzMzk4fQ.XLzPkSW6nRbPW07QO1RkMwz_RAPA4KfeyrWrK3li9YI.jpg?theme=light',
  twitterImage: 'https://assets.hub.nuxt.com/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJodHRwczovL3VpLXByby1zdGFydGVyLm51eHQuZGV2IiwiaWF0IjoxNzM5NDYzMzk4fQ.XLzPkSW6nRbPW07QO1RkMwz_RAPA4KfeyrWrK3li9YI.jpg?theme=light',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/">
          <LogoPro class="w-auto h-6 shrink-0" />
        </NuxtLink>
      </template>

      <template #right>
        <UInput
          v-model="origin"
          placeholder="Enter Swagger JSON URL"
          size="sm"
          icon="i-lucide-link"
          class="w-md"
          @keydown.enter="loadSchema"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              icon="i-lucide-circle-check"
              aria-label="Submit input"
              @click="loadSchema"
            />
          </template>
        </UInput>

        <ColorModeButton />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator icon="i-simple-icons-nuxtdotjs" />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          Copyright © {{ new Date().getFullYear() }}
        </p>
      </template>

      <template #right>
        <ColorModeButton />
      </template>
    </UFooter>
  </UApp>
</template>
