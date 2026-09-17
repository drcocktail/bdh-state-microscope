import { useState } from 'react'

export function readNumber(key: string, fallback: number, min: number, max: number) {
  const raw = new URLSearchParams(window.location.search).get(key)
  const value = raw === null ? fallback : Number(raw)
  const safe = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
  if (/^base$|Base$/.test(key)) return safe === 10000 ? 10000 : 65536
  return /overlap|beta|gamma|alpha|activity/i.test(key) ? safe : Math.round(safe)
}

export function useUrlNumber(key: string, fallback: number, min: number, max: number): [number, (v: number) => void] {
  const [value, setValue] = useState(() => readNumber(key, fallback, min, max))
  return [value, (next: number) => {
    const bounded = Number.isFinite(next) ? Math.min(max, Math.max(min, next)) : fallback
    const safe = /overlap|beta|gamma|alpha|activity/i.test(key) ? bounded : Math.round(bounded)
    setValue(safe)
    const url = new URL(window.location.href)
    url.searchParams.set(key, String(safe))
    window.history.replaceState(null, '', url)
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
