import confetti from 'canvas-confetti'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SessionPicker } from './SessionPicker'
import { ThemePicker } from './ThemePicker'
import { formatDate, formatTime } from './lib/format'
import { useSessions, type SessionsState } from './lib/sessions'
import { useStopwatch } from './lib/useStopwatch'
import { useTheme, type Theme } from './lib/theme'

type SortMode = 'recent' | 'asc' | 'desc'

type Undo = { label: string; snapshot: SessionsState }

const SORT_LABELS: Record<SortMode, string> = {
  recent: 'Récents',
  asc: 'Plus rapides',
  desc: 'Plus lents',
}

const SORT_KEY = 'chrono.sort'
const UNDO_DELAY = 6000
// Le chrono passe en « alerte » à partir de ce délai avant le meilleur temps
const WARN_MS = 5000
const UNDO_KEY = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘Z' : 'Ctrl+Z'

function loadSort(): SortMode {
  try {
    const v = localStorage.getItem(SORT_KEY)
    if (v === 'recent' || v === 'asc' || v === 'desc') return v
  } catch {
    // ignore
  }
  return 'recent'
}

export default function App() {
  const {
    state,
    current,
    sessions,
    addTime,
    removeTime,
    clearTimes,
    createSession,
    selectSession,
    renameSession,
    deleteSession,
    restore,
  } = useSessions()
  const times = current.times
  const { running, elapsed, start, stop, reset } = useStopwatch()
  const { theme, setTheme } = useTheme()
  const [lastId, setLastId] = useState<string | null>(null)
  const [sort, setSort] = useState<SortMode>(loadSort)
  const [undo, setUndo] = useState<Undo | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const undoTimer = useRef<number>(undefined)

  useEffect(() => {
    try {
      localStorage.setItem(SORT_KEY, sort)
    } catch {
      // ignore
    }
  }, [sort])

  const lastTime = times.find((t) => t.id === lastId) ?? null

  const showUndo = useCallback((label: string, snapshot: SessionsState) => {
    window.clearTimeout(undoTimer.current)
    setUndo({ label, snapshot })
    undoTimer.current = window.setTimeout(() => setUndo(null), UNDO_DELAY)
  }, [])

  const dismissUndo = useCallback(() => {
    window.clearTimeout(undoTimer.current)
    setUndo(null)
  }, [])

  const deleteTime = useCallback(
    (id: string) => {
      const index = times.findIndex((t) => t.id === id)
      if (index === -1) return
      showUndo(`Temps n°${index + 1} supprimé`, state)
      removeTime(id)
      if (id === lastId) setLastId(null)
    },
    [times, state, removeTime, lastId, showUndo],
  )

  const applyUndo = useCallback(() => {
    if (!undo) return
    restore(undo.snapshot)
    setLastId(null)
    dismissUndo()
  }, [undo, restore, dismissUndo])

  const clearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    showUndo(`${times.length} temps supprimés`, state)
    clearTimes()
    setLastId(null)
    setConfirmClear(false)
  }

  // Changer de session repart d'un chrono vierge
  const leaveCurrentSession = () => {
    // Le snapshot d'annulation écraserait la session créée/sélectionnée
    dismissUndo()
    reset()
    setLastId(null)
    setConfirmClear(false)
  }

  const handleSelectSession = (id: string) => {
    if (id === current.id) return
    leaveCurrentSession()
    selectSession(id)
  }

  const handleCreateSession = () => {
    leaveCurrentSession()
    return createSession()
  }

  const handleDeleteSession = (id: string) => {
    const session = sessions.find((s) => s.id === id)
    if (!session) return
    if (id === current.id) leaveCurrentSession()
    showUndo(`Session « ${session.name} » supprimée`, state)
    deleteSession(id)
  }

  const toggle = useCallback(() => {
    if (running) {
      const ms = stop()
      // Record battu uniquement s'il existait déjà au moins un temps
      if (times.length > 0 && times.every((t) => ms < t.ms)) celebrate(theme)
      setLastId(addTime(ms).id)
    } else {
      // Un nouveau solve invalide l'annulation (le snapshot écraserait ce temps)
      dismissUndo()
      setConfirmClear(false)
      setMenuOpen(false)
      setLastId(null)
      start()
    }
  }, [running, stop, addTime, start, dismissUndo, times, theme])

  const cancelRun = useCallback(() => {
    reset()
  }, [reset])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Laisse les champs texte (renommage de session) tranquilles
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (!e.repeat) toggle()
        return
      }
      if (e.repeat) return
      if (e.key === 'Escape') {
        if (running) cancelRun()
        else if (!menuOpen) setConfirmClear(false)
        return
      }
      if ((e.key === 'Backspace' || e.key === 'Delete') && !running && lastId) {
        e.preventDefault()
        deleteTime(lastId)
        return
      }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && undo) {
        e.preventDefault()
        applyUndo()
      }
    }
    // Empêche un bouton focus d'être « cliqué » par la barre d'espace
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement)) e.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [toggle, running, cancelRun, lastId, deleteTime, undo, applyUndo, menuOpen])

  const stats = useMemo(() => {
    if (times.length === 0) return null
    let best = times[0]
    let worst = times[0]
    let sum = 0
    for (const t of times) {
      if (t.ms < best.ms) best = t
      if (t.ms > worst.ms) worst = t
      sum += t.ms
    }
    return { best, worst, avg: sum / times.length }
  }, [times])

  const rows = useMemo(() => {
    const numbered = times.map((t, i) => ({ ...t, n: i + 1 }))
    if (sort === 'recent') return numbered.reverse()
    return numbered.sort((a, b) => (sort === 'asc' ? a.ms - b.ms : b.ms - a.ms))
  }, [times, sort])

  let pace = ''
  if (running) {
    if (!stats || elapsed < stats.best.ms - WARN_MS) pace = 'pace-ok'
    else if (elapsed <= stats.best.ms) pace = 'pace-warn'
    else pace = 'pace-over'
  }

  const isNewBest = !running && lastTime && stats?.best.id === lastTime.id && times.length > 1

  return (
    <div className={`app ${running ? 'is-running' : ''}`}>
      {/* Sur desktop seule la barre d'espace déclenche le chrono ; le tap reste actif sur écran tactile */}
      <main className="stage" onPointerDown={(e) => e.pointerType !== 'mouse' && toggle()}>
        <div className="stage-session">{current.name}</div>
        <div className={`display ${pace}`} aria-live="off">
          {formatTime(elapsed)}
        </div>

        <div className="stage-footer" onPointerDown={(e) => e.stopPropagation()}>
          {running ? (
            <p className="hint">
              <kbd>Espace</kbd>
              <span className="touch-only"> (ou touche l'écran)</span> pour arrêter ·{' '}
              <kbd>Échap</kbd> pour annuler
            </p>
          ) : lastTime ? (
            <div className="last">
              {isNewBest && <span className="badge">Nouveau record</span>}
              <button className="btn btn-danger" onClick={() => deleteTime(lastTime.id)}>
                Supprimer ce temps <kbd>⌫</kbd>
              </button>
              <p className="hint">
                <kbd>Espace</kbd>
                <span className="touch-only"> (ou touche l'écran)</span> pour relancer
              </p>
            </div>
          ) : (
            <p className="hint">
              Appuie sur <kbd>Espace</kbd>
              <span className="touch-only"> (ou touche l'écran)</span> pour démarrer
            </p>
          )}
        </div>
      </main>

      <aside className="panel">
        <SessionPicker
          sessions={sessions}
          current={current}
          open={menuOpen}
          onOpenChange={setMenuOpen}
          onSelect={handleSelectSession}
          onCreate={handleCreateSession}
          onRename={renameSession}
          onDelete={handleDeleteSession}
        />

        <section className="stats">
          <Stat label="Meilleur" value={stats ? formatTime(stats.best.ms) : '–'} accent />
          <Stat label="Moyenne" value={stats ? formatTime(stats.avg) : '–'} />
          <Stat label="Pire" value={stats ? formatTime(stats.worst.ms) : '–'} />
          <Stat label="Temps" value={String(times.length)} />
        </section>

        <div className="list-header">
          <div className="segmented" role="tablist" aria-label="Trier les temps">
            {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
              <button
                key={mode}
                role="tab"
                aria-selected={sort === mode}
                className={sort === mode ? 'active' : ''}
                onClick={() => setSort(mode)}
              >
                {mode === 'asc' && '↑ '}
                {mode === 'desc' && '↓ '}
                {SORT_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="empty">Aucun temps dans cette session.</p>
        ) : (
          <ol className="list">
            {rows.map((t) => {
              const isBest = stats?.best.id === t.id
              const isLast = t.id === lastId
              return (
                <li
                  key={t.id}
                  className={`row ${isBest ? 'best' : ''} ${isLast ? 'last-row' : ''}`}
                >
                  <span className="n">#{t.n}</span>
                  <span className="ms">{formatTime(t.ms)}</span>
                  <span className="date">{formatDate(t.date)}</span>
                  <button
                    className="del"
                    aria-label={`Supprimer le temps n°${t.n}`}
                    title="Supprimer"
                    onClick={() => deleteTime(t.id)}
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ol>
        )}

        {times.length > 0 && (
          <button
            className={`btn btn-ghost clear ${confirmClear ? 'confirm' : ''}`}
            onClick={clearAll}
            onBlur={() => setConfirmClear(false)}
          >
            {confirmClear ? 'Cliquer encore pour tout effacer' : 'Tout effacer'}
          </button>
        )}

        <ThemePicker theme={theme} onChange={setTheme} />
      </aside>

      {undo && (
        <div className="toast" role="status">
          <span>{undo.label}</span>
          <button className="btn btn-link" onClick={applyUndo}>
            Annuler <kbd>{UNDO_KEY}</kbd>
          </button>
        </div>
      )}
    </div>
  )
}

function celebrate(theme: Theme) {
  const colors = [theme.accent, theme.ok, theme.warn, theme.over, theme.text]
  const burst = (x: number, angle: number) =>
    confetti({ particleCount: 90, spread: 70, startVelocity: 55, angle, origin: { x, y: 0.7 }, colors, disableForReducedMotion: true })
  burst(0.15, 60)
  burst(0.85, 120)
  setTimeout(() => confetti({ particleCount: 120, spread: 120, origin: { y: 0.4 }, colors, disableForReducedMotion: true }), 200)
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`stat ${accent ? 'accent' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  )
}
