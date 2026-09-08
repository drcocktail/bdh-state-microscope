import type { Plugin } from 'vite'
import { GET as explain } from './api/explain.ts'

const LOCAL_ORIGIN = 'http://127.0.0.1'

/** Run Vercel's Request/Response handler unchanged during `vite dev`. */
export function devApiPlugin(): Plugin {
  return {
    name: 'bdh-local-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url ?? '/', LOCAL_ORIGIN)
        if (url.pathname !== '/api/explain') {
          next()
          return
        }

        try {
          const apiResponse = await explain(new Request(url, {
            method: request.method,
            headers: request.headers as HeadersInit,
          }))

          response.statusCode = apiResponse.status
          apiResponse.headers.forEach((value, name) => response.setHeader(name, value))
          response.end(await apiResponse.text())
        } catch (error) {
          server.config.logger.error(
            `Local explain route failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          )
          response.statusCode = 500
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ error: 'Local explain route failed.' }))
        }
      })
    },
  }
}
