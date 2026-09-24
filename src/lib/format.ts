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

export function formatDate(date: number, withYear = false): string {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    ...(withYear && { year: 'numeric' }),
    hour: '2-digit',
    minute: '2-digit',
  })
}
