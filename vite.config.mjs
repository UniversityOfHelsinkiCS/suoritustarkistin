import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || 'development'
const BASE_PATH = process.env.BASE_PATH || '/'

const PORT = Number(process.env.NODE_ENV === 'test' ? 8001 : process.env.PORT || 8000)

process.env.VITE_SENTRY_RELEASE = process.env.VITE_SENTRY_RELEASE || 'unknown'
process.env.VITE_BUILT_AT = new Date().toISOString()

export default defineConfig({
  root,
  base: BASE_PATH,
  publicDir: false,
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify(APP_ENV) },
  resolve: {
    alias: [
      // Mirrors the _moduleAliases the server resolves through module-alias
      { find: /^@client\//, replacement: `${root}client/` },
      { find: /^@shared\//, replacement: `${root}utils/` }
    ]
  },
  server: {
    host: true, // bind 0.0.0.0 inside docker
    port: PORT,
    strictPort: true,
    proxy: { '^/api(/|$)': `http://localhost:${PORT + 1}` }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      // A stable, unhashed name so the sourcemaps the production workflow uploads
      // to Sentry keep matching the bundle across deploys
      output: { entryFileNames: 'main.js' }
    }
  }
})
