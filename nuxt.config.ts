import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    'shadcn-nuxt',
    '@nuxtjs/supabase',
  ],

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  supabase: {
    redirect: false,
  },

  css: ['~/assets/css/tailwind.css'],

  vite: {
    plugins: [tailwindcss()],
  },
})
