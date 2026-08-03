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

// In dev and test Vite owns the published port (8000 / 8001) and express sits
// one port above it; see server/index.js.
const PORT = Number(process.env.NODE_ENV === 'test' ? 8001 : process.env.PORT || 8000)

export default defineConfig({
  root,
  base: BASE_PATH,
  publicDir: false,
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^Utilities\//, replacement: `${root}client/utils/` },
      { find: /^Components\//, replacement: `${root}client/components/` },
      { find: /^Assets\//, replacement: `${root}client/assets/` },
      { find: /^Root\//, replacement: root }
    ]
  },
  /**
   * TODO: this whole block only exists to keep the webpack DefinePlugin contract
   * alive. Idiomatic Vite exposes build-time values on import.meta.env, so the
   * client would read import.meta.env.MODE / VITE_SENTRY_RELEASE / VITE_BUILT_AT
   * and __BASE_PATH__ would become import.meta.env.BASE_URL, which Vite already
   * derives from `base`. Touches ~12 client files plus the BASE_PATH build args.
   */
  define: {
    __BASE_PATH__: JSON.stringify(BASE_PATH),
    'process.env.NODE_ENV': JSON.stringify(APP_ENV),
    'process.env.SENTRY_RELEASE': JSON.stringify(process.env.SENTRY_RELEASE || 'unknown'),
    'process.env.BUILT_AT': JSON.stringify(new Date().toISOString()),
    // parity with the old DefinePlugin, which replaced the whole process.env object
    'process.env': '{}'
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
      // sentry-release.sh uploads ./dist/main.js
      output: { entryFileNames: 'main.js' }
    }
  }
})
