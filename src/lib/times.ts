import { useCallback, useEffect, useState } from 'react'

export type Time = {
  id: string
  ms: number
  date: number
}

const STORAGE_KEY = 'chrono.times'

function load(): Time[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function useTimes() {
  const [times, setTimes] = useState<Time[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(times))
    } catch {
      // stockage plein ou indisponible : on garde l'état en mémoire
    }
  }, [times])

  const add = useCallback((ms: number) => {
    const time: Time = { id: crypto.randomUUID(), ms, date: Date.now() }
    setTimes((prev) => [...prev, time])
    return time
  }, [])

  const remove = useCallback((id: string) => {
    setTimes((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Réinsère un temps supprimé à sa place chronologique
  const restore = useCallback((time: Time) => {
    setTimes((prev) =>
      prev.some((t) => t.id === time.id)
        ? prev
        : [...prev, time].sort((a, b) => a.date - b.date),
    )
  }, [])

  const replaceAll = useCallback((next: Time[]) => setTimes(next), [])

  return { times, add, remove, restore, replaceAll }
}

export function formatTime(ms: number): string {
  const totalCs = Math.floor(ms / 10)
  const cs = totalCs % 100
  const totalS = Math.floor(totalCs / 100)
  const s = totalS % 60
  const m = Math.floor(totalS / 60) % 60
  const h = Math.floor(totalS / 3600)
  const pad = (n: number) => String(n).padStart(2, '0')
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}.${pad(cs)}`
  if (m > 0) return `${m}:${pad(s)}.${pad(cs)}`
  return `${s}.${pad(cs)}`
}
