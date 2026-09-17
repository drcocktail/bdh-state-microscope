import { useEffect, useState } from 'react'

function boundedNumber(key:string,value:number,fallback:number,min:number,max:number) {
  const safe=Math.min(max,Math.max(min,Number.isFinite(value)?value:fallback))
  if (/^base$|Base$/.test(key)) return safe === 10000 ? 10000 : 65536
  if (/^(dim|lift)N$/.test(key)) return [4,8,16,32].includes(safe) ? safe : fallback
  if (key === 'bytes') return safe === 4 ? 4 : 2
  return /overlap|beta|gamma|alpha|activity/i.test(key)?safe:Math.round(safe)
}

function persistNumber(key:string,value:number) {
  const url=new URL(window.location.href)
  url.searchParams.set(key,String(value))
  window.history.replaceState(null,'',url)
}

export function readNumber(key: string, fallback: number, min: number, max: number) {
  const raw = new URLSearchParams(window.location.search).get(key)
  const value = raw === null ? fallback : Number(raw)
  return boundedNumber(key,value,fallback,min,max)
}

export function useUrlNumber(key: string, fallback: number, min: number, max: number): [number, (v: number) => void] {
  const [value, setValue] = useState(() => readNumber(key, fallback, min, max))
  const current=boundedNumber(key,value,fallback,min,max)
  useEffect(()=>{
    if(value!==current){setValue(current);persistNumber(key,current)}
    const raw=new URLSearchParams(window.location.search).get(key)
    if(raw!==null&&raw!==String(current))persistNumber(key,current)
  },[value,current,key])
  return [current, (next: number) => {
    const safe=boundedNumber(key,next,fallback,min,max)
    setValue(safe)
    persistNumber(key,safe)
  }]
}

export function useUrlChoice<T extends string>(key: string, fallback: T, choices: readonly T[]): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const raw = new URLSearchParams(window.location.search).get(key)
    return choices.includes(raw as T) ? raw as T : fallback
  })
  return [value, (next: T) => {
    setValue(next)
    const url = new URL(window.location.href)
    url.searchParams.set(key, next)
    window.history.replaceState(null, '', url)
  }]
}
