import axios from 'axios'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const api = axios.create({ baseURL: API_URL })

// Set auth token in headers
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('token', token)
  } else {
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
  }
}

// Initialize token from localStorage
const storedToken = localStorage.getItem('token')
if (storedToken) setAuthToken(storedToken)

// Get token for socket connections
export const getSocketToken = () => {
  return localStorage.getItem('token')
}

export const authAPI = {
  register: (name, email, password) =>
    api.post('/api/auth/register', { name, email, password }),
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),
  updateProfile: (data) =>
    api.put('/api/auth/profile', data)
}

export const boardAPI = {
  listBoards: () =>
    api.get('/api/boards'),
  createBoard: (title) =>
    api.post('/api/boards', { title }),
  getBoard: (id) =>
    api.get(`/api/boards/${id}`),
  getVersions: (boardId) =>
    api.get(`/api/boards/${boardId}/versions`),
  invite: (boardId, email, role) =>
    api.post(`/api/boards/${boardId}/invite`, { email, role }),
  acceptInvite: (token) =>
    api.post(`/api/boards/invite/accept/${token}`),
  saveVersion: (boardId, snapshot) =>
    api.post(`/api/boards/${boardId}/version`, { snapshot })
}

export default api
