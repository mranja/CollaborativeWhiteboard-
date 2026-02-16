import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import { boardAPI } from '../api/client'

export default function Dashboard(){
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const [boards, setBoards] = useState([])
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingBoards, setLoadingBoards] = useState(true)
  const [error, setError] = useState('')

  // Load boards on mount
  React.useEffect(() => {
    const fetchBoards = async () => {
      try {
        setLoadingBoards(true)
        const res = await boardAPI.listBoards()
        setBoards(res.data)
      } catch (err) {
        console.error('Failed to load boards:', err)
        setError('Failed to load boards')
      } finally {
        setLoadingBoards(false)
      }
    }
    fetchBoards()
  }, [])

  const handleCreateBoard = async (e) => {
    e.preventDefault()
    if (!newBoardTitle.trim()) {
      setError('Board title is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await boardAPI.createBoard(newBoardTitle)
      setBoards([...boards, res.data])
      setNewBoardTitle('')
      // Navigate to new board
      navigate(`/board/${res.data._id}`)
    } catch (err) {
      console.error('Create board error:', err)
      setError(err.response?.data?.message || 'Failed to create board')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-8">
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Boards</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome, {user?.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Logout
        </button>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Board</h2>
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
          <form onSubmit={handleCreateBoard} className="flex gap-2">
            <input
              type="text"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              placeholder="Enter board title..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Your Boards</h2>
          {loadingBoards ? (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-gray-500">
              Loading boards...
            </div>
          ) : boards.length === 0 ? (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-gray-500">
              No boards yet. Create one to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {boards.map(board => (
                <div
                  key={board._id}
                  onClick={() => navigate(`/board/${board._id}`)}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg cursor-pointer transition"
                >
                  <h3 className="font-semibold text-lg">{board.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {board.collaborators?.length || 0} collaborators
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
