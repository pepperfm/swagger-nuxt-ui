// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui-pro',
    '@nuxt/fonts',
    '@nuxt/icon',
    // '@nuxt/content',
    '@nuxt/scripts'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiHost: process.env.NUXT_BASE_API_HOST,
      apiUrl: process.env.NUXT_BASE_API_URL
    }
  },

  routeRules: {
    '/': { prerender: true }
  },

  future: {
    compatibilityVersion: 4
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  // content: {
  //   experimental: {nativeSqlite: true},
  //   build: {
  //     markdown: {
  //       highlight: {
  //         theme: {
  //           default: 'github-light-high-contrast',
  //           dark: 'material-theme-palenight',
  //         },
  //         langs: [
  //           'php',
  //           'json',
  //           'dotenv',
  //         ],
  //       },
  //     },
  //   },
  // },
  //
  uiPro: {
  //   content: true,
    mdc: true
  }
})
