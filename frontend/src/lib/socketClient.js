import { io } from 'socket.io-client'
import debounce from 'lodash.debounce'

let socket = null
const CLIENT_KEY = 'cw_client_id'
const debouncers = new Map()

function getClientId() {
  let id = null
  try {
    id = localStorage.getItem(CLIENT_KEY)
    if (!id) {
      id = `client_${Date.now()}_${Math.round(Math.random()*10000)}`
      localStorage.setItem(CLIENT_KEY, id)
    }
  } catch (e) {
    id = `client_${Date.now()}_${Math.round(Math.random()*10000)}`
  }
  return id
}

export function connectSocket(token) {
  if (socket) return socket
  const clientId = getClientId()
  const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
  // connect to the /board namespace on the server
  socket = io(`${base}/board`, {
    auth: { token, clientId },
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  })

  // basic handlers
  socket.on('connect', () => console.log('socket connected', socket.id))
  socket.on('disconnect', (reason) => console.log('socket disconnected', reason))

  return socket
}

export const emitDebounced = (event, payload) => {
  if (!socket) return
  const clientId = getClientId()
  const message = { payload, meta: { clientId, ts: Date.now() } }
  let fn = debouncers.get(event)
  if (!fn) {
    fn = debounce((m) => {
      if (socket && socket.connected) socket.emit(event, m)
    }, 50)
    debouncers.set(event, fn)
  }
  fn(message)
}

export function getSocket() {
  return socket
}
