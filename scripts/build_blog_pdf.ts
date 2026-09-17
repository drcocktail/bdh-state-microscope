import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
const url=process.env.BLOG_BASE_URL ?? 'http://127.0.0.1:4173'
const publicUrl=process.env.BLOG_PUBLIC_URL ?? url
mkdirSync('public/blog',{recursive:true})
const browser=await chromium.launch()
const page=await browser.newPage()
await page.goto(`${url}/blog/`,{waitUntil:'networkidle'})
await page.evaluate(()=>document.fonts.ready)
await page.locator('.print-url').evaluate((element,base)=>{element.textContent=`Interactive version: ${base}/blog/ (v2 review; submitted v1 preserved)`},publicUrl)
await page.pdf({path:'public/blog/reasoning-without-a-transcript-v2.pdf',format:'A4',printBackground:true,tagged:true,displayHeaderFooter:false})
await browser.close()
console.log('Built separate v2 PDF from the canonical webpage. v1 was not overwritten.')
