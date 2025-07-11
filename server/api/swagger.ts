export default defineEventHandler(async (event) => {
  const url = getQuery(event).url as string
  if (!url) {
    return { error: 'No url provided' }
  }

  return await $fetch(url)
})
