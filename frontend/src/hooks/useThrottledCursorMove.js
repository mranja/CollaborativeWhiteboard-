import { useEffect, useRef } from 'react'

/**
 * Throttle cursor move events to reduce socket emissions
 * Throttles to ~60ms (roughly 16Hz)
 */
export function useThrottledCursorMove(onCursorMove, throttleMs = 60) {
  const lastEmitRef = useRef(Date.now())
  const pendingRef = useRef(null)

  const throttledMove = (x, y) => {
    const now = Date.now()
    const timeSinceLastEmit = now - lastEmitRef.current

    if (timeSinceLastEmit >= throttleMs) {
      // Emit immediately if enough time has passed
      onCursorMove(x, y)
      lastEmitRef.current = now
      if (pendingRef.current) clearTimeout(pendingRef.current)
      pendingRef.current = null
    } else {
      // Schedule for later if not
      if (pendingRef.current) clearTimeout(pendingRef.current)
      pendingRef.current = setTimeout(() => {
        onCursorMove(x, y)
        lastEmitRef.current = Date.now()
        pendingRef.current = null
      }, throttleMs - timeSinceLastEmit)
    }
  }

  useEffect(() => {
    return () => {
      if (pendingRef.current) clearTimeout(pendingRef.current)
    }
  }, [])

  return throttledMove
}
