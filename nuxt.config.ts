// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', 'nuxt-auth-utils'],

  css: ['~/assets/css/main.css'],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config',
  },

  runtimeConfig: {
    // Overridable with NUXT_DATABASE_URL
    databaseUrl: '',
    cloudinaryCloudName: '',
    cloudinaryApiKey: '',
    cloudinaryApiSecret: '',
    session: {
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  routeRules: {
    '/events': { redirect: { to: '/rodadas', statusCode: 301 } },
    '/admin/events': { redirect: { to: '/admin/rodadas', statusCode: 301 } },
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'es',
        class: 'dark',
      },
      title: 'Pink & Black Road Rider Club',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        {
          name: 'description',
          content:
            'Pink & Black Road Rider Club — velocidad, hermandad y el rugir de los motores bajo la luz de neón.',
        },
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&family=Space+Grotesk:wght@600;700&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap',
        },
      ],
    },
  },
})
