import { afterEach, describe, expect, it } from 'vitest'
import { createServer, type ViteDevServer } from 'vite'
import { devApiPlugin } from './dev-api'

describe('local explain API middleware', () => {
  let server: ViteDevServer | undefined

  afterEach(async () => {
    await server?.close()
    server = undefined
  })

  it('serves JSON at /api/explain instead of transforming the TypeScript source', async () => {
    server = await createServer({
      configFile: false,
      logLevel: 'silent',
      plugins: [devApiPlugin()],
      server: { host: '127.0.0.1', port: 0 },
    })
    await server.listen()

    const address = server.httpServer?.address()
    if (!address || typeof address === 'string') throw new Error('Vite did not expose a test port')

    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/explain?lens=falsify&overlap=80&load=6&scores=1.000%2C2.400%2C1.600&margin=-1.400`,
    )
    const payload = await response.json() as { commentary?: string; mode?: string }

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(payload.commentary).toMatch(/Observation/)
    expect(payload.mode).toMatch(/model|fallback/)
  })
})
