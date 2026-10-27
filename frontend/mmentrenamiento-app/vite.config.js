import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'MM Entrenamiento',
        short_name: 'MM Entrenamiento',
        description: 'Plataforma de reservas y seguimiento para MM Entrenamientos',
        theme_color: '#1f1e2e',
        background_color: '#f5f6fb',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  server: {
    // Mismo origen que en producción (Vercel proxea /api a Railway): la cookie del refresh token
    // funciona igual en desarrollo. Ajustá el target si tu API local corre en otro puerto.
    proxy: {
      '/api': {
        target: 'https://localhost:7198',
        secure: false,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
  }
})