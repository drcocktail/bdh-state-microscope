import { sources } from '../src/content/sources'
await Promise.all(sources.map(async source=>{try{const response=await fetch(source.url,{method:'HEAD',signal:AbortSignal.timeout(15000)});console.log(`${response.ok?'OK':'WARN'} ${response.status} ${source.url}`)}catch(error){console.log(`WARN ${source.url}: ${String(error)}`)}}))
