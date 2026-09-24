import { useEffect, useRef, useState } from 'react'
import { formatDate, formatTime } from './lib/format'
import type { Session } from './lib/sessions'

type Props = {
  sessions: Session[]
  current: Session
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (id: string) => void
  onCreate: () => Session
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function SessionPicker({
  sessions,
  current,
  open,
  onOpenChange,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onOpenChange(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !editingId) onOpenChange(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, editingId, onOpenChange])

  const create = () => {
    const session = onCreate()
    onOpenChange(false)
    setEditingId(session.id)
  }

  const sorted = [...sessions].sort((a, b) => b.createdAt - a.createdAt)
  const editingHeader = editingId === current.id && !open

  return (
    <div className="session-picker" ref={rootRef}>
      <div className="session-header">
        {editingHeader ? (
          <NameInput
            initial={current.name}
            onDone={(name) => {
              if (name !== null) onRename(current.id, name)
              setEditingId(null)
            }}
          />
        ) : (
          <button
            className="session-current"
            aria-expanded={open}
            onClick={() => onOpenChange(!open)}
          >
            <span className="session-eyebrow">Session</span>
            <span className="session-name">{current.name}</span>
            <span className={`chevron ${open ? 'up' : ''}`} aria-hidden>
              ▾
            </span>
          </button>
        )}
        {!editingHeader && (
          <button
            className="icon-btn"
            title="Renommer la session"
            aria-label="Renommer la session"
            onClick={() => {
              onOpenChange(false)
              setEditingId(current.id)
            }}
          >
            ✎
          </button>
        )}
        <button
          className="icon-btn"
          title="Nouvelle session"
          aria-label="Nouvelle session"
          onClick={create}
        >
          +
        </button>
      </div>

      {open && (
        <div className="session-menu">
          <ul>
            {sorted.map((s) => {
              const best = s.times.length ? Math.min(...s.times.map((t) => t.ms)) : null
              const isCurrent = s.id === current.id
              return (
                <li key={s.id} className={`session-item ${isCurrent ? 'current' : ''}`}>
                  {editingId === s.id ? (
                    <NameInput
                      initial={s.name}
                      onDone={(name) => {
                        if (name !== null) onRename(s.id, name)
                        setEditingId(null)
                      }}
                    />
                  ) : (
                    <button
                      className="session-select"
                      onClick={() => {
                        onSelect(s.id)
                        onOpenChange(false)
                      }}
                    >
                      <span className="session-item-name">{s.name}</span>
                      <span className="session-meta">
                        {formatDate(s.createdAt, true)} · {s.times.length} temps
                        {best !== null && <> · best {formatTime(best)}</>}
                      </span>
                    </button>
                  )}
                  {editingId !== s.id && (
                    <div className="session-actions">
                      <button
                        className="icon-btn"
                        title="Renommer"
                        aria-label={`Renommer ${s.name}`}
                        onClick={() => setEditingId(s.id)}
                      >
                        ✎
                      </button>
                      <button
                        className="icon-btn danger"
                        title="Supprimer"
                        aria-label={`Supprimer ${s.name}`}
                        onClick={() => onDelete(s.id)}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <button className="session-new" onClick={create}>
            + Nouvelle session
          </button>
        </div>
      )}
    </div>
  )
}

/** Champ de renommage : Entrée/blur valide, Échap annule (onDone(null)). */
function NameInput({ initial, onDone }: { initial: string; onDone: (name: string | null) => void }) {
  const [value, setValue] = useState(initial)
  const done = useRef(false)

  const finish = (name: string | null) => {
    if (done.current) return
    done.current = true
    onDone(name)
  }

  return (
    <input
      className="name-input"
      value={value}
      autoFocus
      maxLength={60}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => finish(value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(value)
        if (e.key === 'Escape') finish(null)
      }}
    />
  )
}
