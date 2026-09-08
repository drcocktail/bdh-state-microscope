import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { devApiPlugin } from './dev-api.ts'

export default defineConfig({
  base: '/',
  plugins: [devApiPlugin(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
