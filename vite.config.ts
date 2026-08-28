import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.svg',
        'logo-br-2x-Sweb4xgr.png',
        'card-placeholder.svg',
      ],
      manifest: {
        id: '/',
        name: 'Disney Lorcana Card Collection Tracker',
        short_name: 'Lorcana Tracker',
        description: 'Disney Lorcana TCG Card Collection Tracker, Deck Builder, and Inventory Manager',
        theme_color: '#131627',
        background_color: '#131627',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
          {
            src: '/logo-br-2x-Sweb4xgr.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/logo-br-2x-Sweb4xgr.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,json}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  base: '/',
})

