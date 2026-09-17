import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
const fail=(message:string)=>{throw new Error(message)}
const essay=readFileSync('content/blog/reasoning-without-a-transcript.md','utf8')
const body=essay.split('---')[2].split('## References')[0].replace(/^## .*$/gm,'').replace(/\[\d+\]/g,'').trim()
const words=body.split(/\s+/).length
console.log(`Canonical essay body: ${words} words (headings, references and citation markers excluded)`)
if(words<600||words>800)fail('Essay word count outside PS range')
for(const citation of essay.split('## References')[0].matchAll(/\[(\d+)\]/g))if(!essay.split('## References')[1].includes(`[${citation[1]}]`))fail('Unresolved essay citation')
if((essay.match(/\(202[2-6]\)/g)||[]).length<2||!essay.includes('## Limitations')||!essay.includes('BDH'))fail('Essay missing source/year/limitation/BDH gate')
for(const path of ['src/App.tsx','src/Lab.tsx','src/Blog.tsx','src/components/Evidence.tsx','content/blog/reasoning-without-a-transcript.md']) {
  const text=readFileSync(path,'utf8')
  if(/[\u2013\u2014]/.test(text))fail(`Banned punctuation in ${path}`)
  if(/technically curious judge|60-SECOND JUDGE|game.chang|revolutionary|groundbreaking/i.test(text))fail(`Banned public phrase in ${path}`)
}
const expected='2ef8a487f652f4145d463877de5e0f54993301ae8665541bbec2071e668a32b9'
for(const path of ['public/dataforge-latent-reasoning-blog.pdf','output/pdf/dataforge-latent-reasoning-blog.pdf'])if(createHash('sha256').update(readFileSync(path)).digest('hex')!==expected)fail('Frozen v1 PDF changed')
const scripts=readdirSync('dist/assets').filter(f=>f.endsWith('.js')).map(f=>readFileSync(`dist/assets/${f}`,'utf8')).join('\n')
if(/groq|fetch\s*\(\s*["'`]\/api\//i.test(scripts))fail('Runtime API remains in bundle')
console.log(`Frozen PDF hash verified; no model/API runtime; ${scripts.length} JS bytes before gzip.`)
