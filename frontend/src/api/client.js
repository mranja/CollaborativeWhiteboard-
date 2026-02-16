import axios from 'axios'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const api = axios.create({ baseURL: API_URL })

// Set auth token in headers
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

// Get token for socket connections
export const getSocketToken = () => {
  return localStorage.getItem('authToken')
}

export const authAPI = {
  register: (name, email, password) =>
    api.post('/api/auth/register', { name, email, password }),
  login: (email, password) =>
    api.post('/api/auth/login', { email, password })
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
  invite: (boardId, userId, role) =>
    api.post(`/api/boards/${boardId}/invite`, { userId, role }),
  saveVersion: (boardId, snapshot) =>
    api.post(`/api/boards/${boardId}/version`, { snapshot })
}

export default api
