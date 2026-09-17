import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

export default defineConfig({
  base: '/',
  define: { __BLOG_HASH__: JSON.stringify(createHash('sha256').update(readFileSync('content/blog/reasoning-without-a-transcript.md')).digest('hex')), __BUILD_COMMIT__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.BUILD_COMMIT ?? 'local uncommitted build') },
  plugins: [react(), {
    name: 'static-api-404',
    configureServer(server) { server.middlewares.use((request, response, next) => { if (request.url?.startsWith('/api/')) { response.statusCode = 404; response.end('Not found') } else next() }) },
    configurePreviewServer(server) { server.middlewares.use((request, response, next) => { if (request.url?.startsWith('/api/')) { response.statusCode = 404; response.end('Not found') } else next() }) },
  }],
  build: { rollupOptions: { input: { main: resolve('index.html'), lab: resolve('lab/index.html'), blog: resolve('blog/index.html') } } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: ['node_modules/**', 'tmp/**', 'e2e/**'],
  },
})
