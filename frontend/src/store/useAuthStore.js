import { create } from 'zustand'
import { setAuthToken } from '../api/client'

const useAuthStore = create((set) => {
  // Load token and user from localStorage on init
  const savedToken = localStorage.getItem('token')
  const savedUser = localStorage.getItem('user')
  
  if (savedToken) setAuthToken(savedToken)

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
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
      setAuthToken(null)
    }
  }
})

export default useAuthStore
