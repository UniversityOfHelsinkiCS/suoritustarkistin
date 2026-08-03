import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = fileURLToPath(new URL('.', import.meta.url))

/**
 * Vite forces process.env.NODE_ENV to 'production' for builds, which would erase
 * the staging environment. The npm scripts copy NODE_ENV into APP_ENV before
 * invoking Vite so 'staging' still reaches the client bundle.
 */
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
      { find: /^Utilities\//, replacement: `${root}client/utils/` },
      { find: /^Components\//, replacement: `${root}client/components/` },
      { find: /^Assets\//, replacement: `${root}client/assets/` },
      { find: /^Root\//, replacement: root }
    ]
  },
  server: {
    host: true, // bind 0.0.0.0 inside docker
    port: PORT,
    strictPort: true,
    proxy: { '/api': `http://localhost:${PORT + 1}` }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    /**
     * lightningcss (Vite's default) rejects semantic-ui-css 2.5.0's invalid
     * `[data-tooltip]:after .header` selectors, and the only other minifier Vite
     * accepts is esbuild, which Vite 8 no longer ships. Skipping CSS minification
     * costs almost nothing: the bulk is semantic.min.css, already minified.
     *
     * TODO: delete this line when semantic-ui-css goes away with the MUI migration.
     * The invalid selectors are the only reason minification is off; verify by
     * removing it and running a production build, which fails loudly if anything
     * still trips lightningcss.
     */
    cssMinify: false,
    rollupOptions: {
      // A stable, unhashed name so the sourcemaps the production workflow uploads
      // to Sentry keep matching the bundle across deploys
      output: { entryFileNames: 'main.js' }
    }
  }
})
