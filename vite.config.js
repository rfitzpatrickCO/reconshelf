import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// If you deploy to a GitHub Pages *project* site (https://user.github.io/reconshelf/),
// set BASE_PATH=/reconshelf/ at build time. For Netlify/Vercel/custom domain, leave it "/".
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Recon Shelf',
        short_name: 'Recon Shelf',
        description: 'A private book tracker — track your shelf, log progress, file field notes.',
        theme_color: '#1c1b18',
        background_color: '#1c1b18',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // SPA fallback so deep links work offline once installed.
        navigateFallback: base + 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
})
