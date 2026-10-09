import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// no GitHub Pages o app fica em uma subpasta (/nome-do-repositorio/)
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'DinDinGuru',
        short_name: 'DinDinGuru',
        description: 'Controle financeiro doméstico: contas, lançamentos e planejamento mensal.',
        lang: 'pt-BR',
        start_url: base,
        scope: base,
        display: 'standalone',
        theme_color: '#28A6BB',
        background_color: '#28A6BB',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // todo o app (inclusive a fonte) fica em cache para abrir sem internet
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
