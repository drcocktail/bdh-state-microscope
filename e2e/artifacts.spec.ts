import { test, expect } from '@playwright/test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'

for(const width of [390,1440])for(const route of ['/','/lab/','/blog/'])test(`layout and console ${route} ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900})
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
  await page.goto(route);await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('.evidence-tag')).toHaveCount(0)
  if(route==='/lab/')await expect(page.locator('#lift .worker-result')).toContainText('Completed',{timeout:10000})
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
  await page.screenshot({path:`output/playwright/${route==='/'?'microscope':route.replaceAll('/','')}-${width}.png`,fullPage:true})
})
test('guided predictions, controls, teachback and offline engine',async({page,context})=>{
  await page.goto('/')
  await expect(page.getByText('recall breaks',{exact:true})).toBeVisible()
  await page.getByRole('button',{name:/Separated/}).click();await expect(page.getByText('recall holds',{exact:true})).toBeVisible()
  const run=page.getByRole('button',{name:'Commit and run the sweep'});await expect(run).toBeDisabled()
  await page.getByRole('button',{name:'50%',exact:true}).click();await run.click();await expect(page.getByText('Prediction matches the fixture.')).toBeVisible();await expect(page.getByText(/First sampled failure 50%/)).toBeVisible()
  await page.getByRole('button',{name:'Outputs stay the same'}).click();await page.getByRole('button',{name:'Reveal computed result'}).click();await expect(page.getByText('Correct.',{exact:true})).toBeVisible()
  await page.getByLabel('Your explanation').fill('Exact equivalent output from a fixed recurrent state can still fail recall through overlapping keys.');await page.getByRole('button',{name:'Compare with the mechanism'}).click();await expect(page.getByText(/[0-3]\/3 concepts captured/)).toBeVisible({timeout:20000})
  await context.setOffline(true)
  await page.getByRole('button',{name:/Collision/}).click();await expect(page.getByText('recall breaks',{exact:true})).toBeVisible()
})
test('fixed-seed worker and time parity in every mode',async({page})=>{
  await page.goto('/lab/?dimN=9&bytes=3&liftSeed=17&neurons=1024&activity=.05&liftT=128&liftC=8')
  await expect(page.getByLabel('Key dimension N',{exact:true})).toHaveValue('16')
  await expect(page.getByLabel('Bytes per scalar')).toHaveValue('2')
  await expect(page.locator('#lift .worker-result')).toContainText('Completed',{timeout:10000})
  const rows=page.locator('#lift tbody tr'),raw=Number(await rows.nth(0).locator('td').first().innerText()),lift=Number((await rows.nth(1).locator('td').first().innerText()).split(' ')[0])
  expect(raw).toBeLessThanOrEqual(18);expect(lift).toBeGreaterThan(raw)
  await page.getByLabel('Key dimension N',{exact:true}).selectOption('4')
  await expect(page.locator('#dimension').getByLabel('Stored pairs',{exact:true})).toHaveValue('16')
  await expect.poll(()=>new URL(page.url()).searchParams.get('dimT')).toBe('16')
  await expect(page.locator('#dimension .worker-result')).toContainText('Completed')
  for(const mode of ['identity','rope','damping','combined']){await page.getByLabel('Transition',{exact:true}).selectOption(mode);expect(Number(await page.getByTestId('time-parity').innerText())).toBeLessThan(1e-10)}
})
test('sealed specimen, fault round and explicit ambiguity',async({page})=>{
  await page.goto('/blog/?roundSeed=17&shared=8&codeK=4')
  await expect(page.locator('.blog-provenance')).not.toHaveAttribute('open','')
  await page.locator('.blog-provenance summary').click()
  await expect(page.locator('#markdown-hash')).toHaveText(createHash('sha256').update(readFileSync('content/blog/reasoning-without-a-transcript.md')).digest('hex'))
  await expect(page.getByLabel('Shared neurons')).toHaveValue('4')
  await page.getByLabel('Active neurons k').fill('2')
  await expect(page.getByLabel('Shared neurons')).toHaveValue('2')
  await expect.poll(()=>new URL(page.url()).searchParams.get('shared')).toBe('2')
  await page.getByRole('group',{name:'Planted specimen'}).getByRole('button',{name:/Overlapping codes/}).click()
  await expect(page.getByLabel('Shared neurons')).toHaveValue('4')
  await expect(page.locator('.unsealed-mechanism')).toHaveCount(0)
  await page.getByRole('button',{name:'Unseal the mechanism'}).click();await expect(page.getByText('Decoded frontier by step')).toBeVisible()
  await page.locator('.diagnosis-buttons').getByRole('button',{name:/^binding/}).click();await page.getByRole('button',{name:'Diagnose and unseal'}).click();await expect(page.getByText('Your diagnosis matches the planted construction.')).toBeVisible()
  await page.getByLabel('Intervention budget',{exact:true}).selectOption('5');await expect(page.getByTestId('identifiability')).toContainText('364 sequences')
  await page.getByLabel('Observation menu').selectOption('restricted');await expect(page.getByTestId('identifiability')).toContainText('Not identifiable with this budget and menu')
})
test('public routes, source hashes and content types',async({request})=>{
  for(const route of ['/lab','/lab/','/blog','/blog/'])expect((await request.get(route)).status()).toBe(200)
  expect((await request.get('/api/explain?overlap=10&load=2')).status()).toBe(404)
  const pdf=await request.get('/dataforge-latent-reasoning-blog.pdf');expect(pdf.status()).toBe(200);expect(pdf.headers()['content-type']).toContain('application/pdf');expect(createHash('sha256').update(await pdf.body()).digest('hex')).toBe('2ef8a487f652f4145d463877de5e0f54993301ae8665541bbec2071e668a32b9')
  const v2=await request.get('/blog/reasoning-without-a-transcript-v2.pdf');expect(v2.status()).toBe(200);expect(v2.headers()['content-type']).toContain('application/pdf');expect((await v2.body()).subarray(0,4).toString()).toBe('%PDF');expect(createHash('sha256').update(await v2.body()).digest('hex')).toBe(createHash('sha256').update(readFileSync('public/blog/reasoning-without-a-transcript-v2.pdf')).digest('hex'))
  const claims=await request.get('/blog/claims.json');expect(claims.status()).toBe(200);expect(claims.headers()['content-type']).toContain('application/json');expect((await claims.json()).length).toBeGreaterThan(4)
  const llms=await request.get('/llms.txt');expect(llms.status()).toBe(200);expect(llms.headers()['content-type']).toContain('text/plain')
})
test('permalink state and guided input-to-paint under 100 ms',async({page})=>{
  await page.goto('/?overlap=.21&load=5&base=10000&beta=.35')
  await expect(page.locator('#overlap-control')).toHaveValue('0.21');await expect(page.locator('#load-control')).toHaveValue('5');await expect(page.getByLabel('RoPE base',{exact:true})).toHaveValue('10000')
  const measurements=await page.evaluate(async()=>{const results:number[]=[];const input=document.querySelector<HTMLInputElement>('#overlap-control')!;const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!;for(let i=0;i<8;i++){const start=performance.now();setter.call(input,String(.2+i*.01));input.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));results.push(performance.now()-start)}return results})
  console.log(`Guided input-to-paint (two animation frames), ms: ${measurements.map(v=>v.toFixed(1)).join(', ')}`)
  expect(Math.max(...measurements)).toBeLessThan(100)
})
for(const route of ['/','/lab/','/blog/'])test(`accessibility ${route}`,async({page})=>{
  await page.goto(route)
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
  expect(results.violations).toEqual([])
})
test('keyboard slider and focused source locator',async({page})=>{
  await page.setViewportSize({width:390,height:900})
  await page.goto('/')
  await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Skip to the microscope'})).toBeFocused()
  const input=page.locator('#overlap-control');await input.focus();const before=Number(await input.inputValue());await page.keyboard.press('ArrowLeft');await expect(input).toHaveValue(String(Math.round((before-.01)*100)/100))
  const citation=page.locator('#microscope .citation a').first();await citation.focus();await expect(citation.locator('..').getByRole('tooltip')).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
})

test('teach-back reads the explanation through the tutor and runs its probe', async({page})=>{
  const sent:any[]=[]
  await page.route('**/api/tutor',async route=>{
    sent.push(route.request().postDataJSON())
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({mode:'model',model:'Groq · test',captured:2,followUp:'What happens at higher overlap?',probe:{overlap:85,load:5,claim:'At 85% overlap with 5 writes, amber still wins.'},concepts:[
      {id:'same-answer',label:'The same answer',met:true,quote:'both routes agree',note:'You said this clearly.'},
      {id:'what-memory-stores',label:'What memory stores',met:true,quote:'one fixed matrix',note:'Correct.'},
      {id:'why-recall-fails',label:'Why recall can fail',met:false,quote:'',note:'Say what overlapping keys do to the read.'}]})})
  })
  await page.goto('/')
  await page.getByLabel('Your explanation').fill('both routes agree because memory is one fixed matrix')
  await page.getByRole('button',{name:'Compare with the mechanism'}).click()
  await expect(page.getByText('2/3 concepts captured')).toBeVisible()
  await expect(page.locator('q',{hasText:'both routes agree'})).toBeVisible()
  await expect(page.getByText('What happens at higher overlap?')).toBeVisible()
  // The model proposes a configuration; the engine in the page decides the outcome.
  await page.getByRole('button',{name:/Run 5 writes at 85% overlap/}).click()
  await expect(page.getByText(/Target margin -?\d/)).toBeVisible()
  expect(sent[0].mode).toBe('teachback')
  expect(sent[0].trace.overlap % 5).toBe(0)
})

test('teach-back and co-review still work when the tutor is unreachable',async({page})=>{
  await page.route('**/api/tutor',route=>route.abort())
  await page.goto('/')
  await page.getByLabel('Your explanation').fill('overlapping keys make the recall fail even though both routes are exact')
  await page.getByRole('button',{name:'Compare with the mechanism'}).click()
  await expect(page.getByText(/concepts captured/)).toBeVisible()
  await expect(page.getByText(/Offline rubric/)).toBeVisible()
  await page.getByRole('button',{name:'Ask about this result'}).click()
  await expect(page.getByText(/co-review endpoint is unavailable/)).toBeVisible()
})

test('co-review sends only bounded engine numbers',async({page})=>{
  let payload:any=null
  await page.route('**/api/tutor',async route=>{
    payload=route.request().postDataJSON()
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({commentary:'Observation: recall breaks.\nInference: interference, not a trained-model claim.',model:'Groq · test',mode:'model',lens:'falsify'})})
  })
  await page.goto('/?askOverlap=70&askLoad=5')
  await page.getByRole('button',{name:'Ask about this result'}).click()
  await expect(page.getByText('recall breaks.')).toBeVisible()
  expect(payload.mode).toBe('trace')
  expect(payload.trace.load).toBe(5)
  expect(payload.trace.scores).toHaveLength(3)
  expect(JSON.stringify(payload)).not.toContain('gsk_')
})
