import { create } from 'zustand'
import { setAuthToken } from '../api/client'
import { clearCache } from '../lib/boardsCache'
import { disconnectSocket } from '../lib/socketClient'

const useAuthStore = create((set) => {
  // Load token and user from localStorage on init
  const savedToken = localStorage.getItem('token')
  const savedUser = localStorage.getItem('user')

  if (savedToken) setAuthToken(savedToken)

  // A malformed 'user' entry used to throw here, which happens before React
  // renders anything and left the app on a blank screen with no way back.
  let parsedUser = null
  try {
    parsedUser = savedUser ? JSON.parse(savedUser) : null
  } catch (e) {
    console.warn('Discarding corrupted cached user record')
    localStorage.removeItem('user')
  }

  return {
    user: parsedUser,
    token: savedToken || null,
    isLoading: false,
    error: null,

    setUser: (user) => {
      set({ user })
      if (user) localStorage.setItem('user', JSON.stringify(user))
      else localStorage.removeItem('user')
    },

    setToken: (token) => {
      set({ token })
      if (token) {
        localStorage.setItem('token', token)
        setAuthToken(token)
      } else {
        localStorage.removeItem('token')
        setAuthToken(null)
      }
    },

    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    logout: () => {
      set({ user: null, token: null })
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      clearCache()
      disconnectSocket()
      setAuthToken(null)
    }
  }
})

export default useAuthStore
