import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const apiProxy = {
  '/api': {
    target: 'http://localhost:5001',
    changeOrigin: true,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  // `npm run preview` serves the production build; used when sharing the app
  // through a Cloudflare quick tunnel (see docs/setup.md).
  preview: {
    port: 4173,
    proxy: apiProxy,
    allowedHosts: ['.trycloudflare.com'],
  },
})
