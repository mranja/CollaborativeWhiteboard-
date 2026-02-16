import { useCallback, useRef } from 'react'
import debounce from 'lodash.debounce'
import { emitDebounced, getSocket } from '../lib/socketClient'

export function useDebouncedEmit() {
  const ref = useRef(null)

  const emit = useCallback((event, payload) => {
    // immediate emit if socket stable
      const s = getSocket()
      if (s && s.connected) {
        emitDebounced(event, payload)
        return
      }
      // fallback: debounce local emit using client-side queue
      if (!ref.current) ref.current = debounce((e, p) => {
        const local = getSocket()
        if (local && local.connected) local.emit(e, { payload: p, meta: { clientId: localStorage.getItem('cw_client_id'), ts: Date.now() } })
      }, 50)
      ref.current(event, payload)
  }, [])

  return emit
}
