import type { Plugin, ViteDevServer, PreviewServer } from 'vite'

const LOCAL_ORIGIN = 'http://127.0.0.1'

/** Run the Vercel Request/Response handler unchanged during `vite dev` and `vite preview`. */
function attach(server: ViteDevServer | PreviewServer) {
  server.middlewares.use(async (request, response, next) => {
    const url = new URL(request.url ?? '/', LOCAL_ORIGIN)
    if (!url.pathname.startsWith('/api/')) return next()
    if (url.pathname !== '/api/tutor') {
      response.statusCode = 404
      response.end('Not found')
      return
    }
    try {
      const { POST } = await import('./api/tutor.ts')
      const chunks: Buffer[] = []
      for await (const chunk of request) chunks.push(chunk as Buffer)
      const apiResponse = await POST(new Request(url, {
        method: request.method ?? 'POST',
        headers: request.headers as HeadersInit,
        body: chunks.length ? Buffer.concat(chunks).toString('utf8') : undefined,
      }))
      response.statusCode = apiResponse.status
      apiResponse.headers.forEach((value, name) => response.setHeader(name, value))
      response.end(await apiResponse.text())
    } catch (error) {
      response.statusCode = 500
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ error: `Local tutor route failed: ${error instanceof Error ? error.message : 'unknown error'}` }))
    }
  })
}

export function devApiPlugin(): Plugin {
  return { name: 'bdh-local-api', configureServer: attach, configurePreviewServer: attach }
}
