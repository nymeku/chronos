import { useCallback, useEffect, useRef, useState } from 'react'

export function useStopwatch() {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(0)
  const frameRef = useRef(0)

  const tick = useCallback(function loop() {
    setElapsed(performance.now() - startRef.current)
    frameRef.current = requestAnimationFrame(loop)
  }, [])

  const start = useCallback(() => {
    startRef.current = performance.now()
    setElapsed(0)
    setRunning(true)
    frameRef.current = requestAnimationFrame(tick)
  }, [tick])

  /** Arrête le chrono et renvoie le temps final en ms. */
  const stop = useCallback(() => {
    cancelAnimationFrame(frameRef.current)
    const final = performance.now() - startRef.current
    setElapsed(final)
    setRunning(false)
    return final
  }, [])

  const reset = useCallback(() => {
    cancelAnimationFrame(frameRef.current)
    setRunning(false)
    setElapsed(0)
  }, [])

  useEffect(() => () => cancelAnimationFrame(frameRef.current), [])

  return { running, elapsed, start, stop, reset }
}
