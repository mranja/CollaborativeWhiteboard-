import { io } from 'socket.io-client'
import debounce from 'lodash.debounce'

let socket = null

const CLIENT_KEY = 'cw_client_id'
const debouncers = new Map()

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const BOARD_SOCKET_URL = `${SOCKET_URL.replace(/\/$/, '')}/board`

function getClientId() {
  let id = null

  try {
    id = localStorage.getItem(CLIENT_KEY)

    if (!id) {
      id = `client_${Date.now()}_${Math.round(Math.random() * 10000)}`
      localStorage.setItem(CLIENT_KEY, id)
    }
  } catch (e) {
    id = `client_${Date.now()}_${Math.round(Math.random() * 10000)}`
  }

  return id
}

export function connectSocket(token) {
  const clientId = getClientId()

  if (socket) {
    if (token && socket.auth?.token !== token) {
      socket.auth = { token, clientId }
      if (!socket.connected) {
        socket.connect()
      }
    } else if (!socket.connected) {
      socket.connect()
    }
    return socket
  }

  socket = io(BOARD_SOCKET_URL, {
    auth: {
      token,
      clientId,
    },
    transports: ['polling', 'websocket'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 10000
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.warn('Socket connect error:', err.message)
  })

  return socket
}

export function emitDebounced(event, payload) {
  if (!socket) return

  const clientId = getClientId()

  const message = {
    payload,
    meta: {
      clientId,
      ts: Date.now(),
    },
  }

  let fn = debouncers.get(event)

  if (!fn) {
    fn = debounce((msg) => {
      if (socket && socket.connected) {
        socket.emit(event, msg)
      }
    }, 50)

    debouncers.set(event, fn)
  }

  fn(message)
}

export function getSocket() {
  return socket
}