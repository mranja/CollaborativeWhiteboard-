import { io } from 'socket.io-client'
import debounce from 'lodash.debounce'

let socket = null
const CLIENT_KEY = 'cw_client_id'

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
  socket = io(process.env.VITE_BACKEND_URL || 'http://localhost:5000', {
    auth: { token, clientId },
    transports: ['websocket']
  })

  // basic handlers
  socket.on('connect', () => console.log('socket connected', socket.id))
  socket.on('disconnect', () => console.log('socket disconnected'))

  return socket
}

export const emitDebounced = (event, payload) => {
  if (!socket) return
  const clientId = getClientId()
  const message = { payload, meta: { clientId, ts: Date.now() } }
  debounce(() => socket.emit(event, message), 50)()
}

export function getSocket() {
  return socket
}
