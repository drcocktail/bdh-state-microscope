import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir:'./e2e',timeout:30000,workers:2,retries:process.env.CI?1:0,
  use:{baseURL:process.env.BASE_URL??'http://127.0.0.1:4173',trace:'retain-on-failure',reducedMotion:'reduce'},
  reporter:[['list'],['html',{open:'never'}]],
  webServer:process.env.BASE_URL?undefined:{command:'pnpm preview --host 127.0.0.1 --port 4173',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI},
})
