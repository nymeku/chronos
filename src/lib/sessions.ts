import { useCallback, useEffect, useState } from 'react'

export type Time = {
  id: string
  ms: number
  date: number
}

export type Session = {
  id: string
  name: string
  createdAt: number
  times: Time[]
}

export type SessionsState = {
  sessions: Session[]
  currentId: string
}

const STORAGE_KEY = 'chrono.sessions'
// Ancien format (v1) : une seule liste de temps
const LEGACY_TIMES_KEY = 'chrono.times'

function newSession(name: string, times: Time[] = []): Session {
  return { id: crypto.randomUUID(), name, createdAt: Date.now(), times }
}

function initialState(): SessionsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SessionsState
      if (Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
        const currentId = parsed.sessions.some((s) => s.id === parsed.currentId)
          ? parsed.currentId
          : parsed.sessions[0].id
        return { sessions: parsed.sessions, currentId }
      }
    }
    const legacy = JSON.parse(localStorage.getItem(LEGACY_TIMES_KEY) ?? '[]')
    const session = newSession('Session 1', Array.isArray(legacy) ? legacy : [])
    if (session.times.length > 0) session.createdAt = session.times[0].date
    return { sessions: [session], currentId: session.id }
  } catch {
    const session = newSession('Session 1')
    return { sessions: [session], currentId: session.id }
  }
}

function nextName(sessions: Session[]): string {
  const used = new Set(sessions.map((s) => s.name))
  let n = sessions.length + 1
  while (used.has(`Session ${n}`)) n++
  return `Session ${n}`
}

export function useSessions() {
  const [state, setState] = useState<SessionsState>(initialState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      localStorage.removeItem(LEGACY_TIMES_KEY)
    } catch {
      // stockage plein ou indisponible : on garde l'état en mémoire
    }
  }, [state])

  const current = state.sessions.find((s) => s.id === state.currentId) ?? state.sessions[0]

  const updateCurrentTimes = useCallback((fn: (times: Time[]) => Time[]) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === prev.currentId ? { ...s, times: fn(s.times) } : s,
      ),
    }))
  }, [])

  const addTime = useCallback(
    (ms: number) => {
      const time: Time = { id: crypto.randomUUID(), ms, date: Date.now() }
      updateCurrentTimes((times) => [...times, time])
      return time
    },
    [updateCurrentTimes],
  )

  const removeTime = useCallback(
    (id: string) => updateCurrentTimes((times) => times.filter((t) => t.id !== id)),
    [updateCurrentTimes],
  )

  const clearTimes = useCallback(() => updateCurrentTimes(() => []), [updateCurrentTimes])

  const createSession = useCallback(() => {
    const session = newSession(nextName(state.sessions))
    setState((prev) => ({ sessions: [...prev.sessions, session], currentId: session.id }))
    return session
  }, [state.sessions])

  const selectSession = useCallback((id: string) => {
    setState((prev) => ({ ...prev, currentId: id }))
  }, [])

  const renameSession = useCallback((id: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.id === id ? { ...s, name: trimmed } : s)),
    }))
  }, [])

  const deleteSession = useCallback((id: string) => {
    setState((prev) => {
      const remaining = prev.sessions.filter((s) => s.id !== id)
      if (remaining.length === 0) {
        const session = newSession('Session 1')
        return { sessions: [session], currentId: session.id }
      }
      if (prev.currentId !== id) return { ...prev, sessions: remaining }
      // Bascule sur la session la plus récente restante
      const latest = remaining.reduce((a, b) => (b.createdAt > a.createdAt ? b : a))
      return { sessions: remaining, currentId: latest.id }
    })
  }, [])

  return {
    state,
    current,
    sessions: state.sessions,
    addTime,
    removeTime,
    clearTimes,
    createSession,
    selectSession,
    renameSession,
    deleteSession,
    restore: setState,
  }
}
