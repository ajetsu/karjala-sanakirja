import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      // The dictionary data (entries.json + fikar.json, ~5MB combined) is
      // bundled directly into the main JS chunk so it's usable fully offline
      // — raise Workbox's default 2MB precache limit to fit it.
      workbox: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
      manifest: {
        name: 'Karjala–suomi–karjala sanakirja',
        short_name: 'Sanakirja',
        description: 'Karjala–suomi–karjala sanakirja ja lausekääntäjä, toimii täysin offline.',
        lang: 'fi',
        theme_color: '#7a3b2e',
        background_color: '#faf7f2',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
