import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import { authAPI, boardAPI } from '../api/client'
import { 
  FiPlus, FiLogOut, FiUsers, FiClock, FiGrid, FiArrowRight, 
  FiActivity, FiWind, FiTrash2, FiUser, FiSettings, FiCamera, FiTrendingUp, FiCheckCircle 
} from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

export default function Dashboard(){
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const setUser = useAuthStore(s => s.setUser)
  const [boards, setBoards] = useState([])
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingBoards, setLoadingBoards] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinInput, setJoinInput] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  
  // Profile edit states
  const [editName, setEditName] = useState(user?.name || '')
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    try {
      const res = await authAPI.updateProfile({ name: editName, avatar: editAvatar })
      setUser(res.data.user)
      setShowProfileModal(false)
    } catch (err) {
      console.error('Update profile error:', err)
      setError('Failed to update profile')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

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
      setBoards([res.data, ...boards])
      setNewBoardTitle('')
      setShowCreateModal(false)
      navigate(`/board/${res.data._id}`)
    } catch (err) {
      console.error('Create board error:', err)
      setError(err.response?.data?.message || 'Failed to create board')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinBoard = (e) => {
    e.preventDefault()
    if (!joinInput.trim()) return
    
    // Extract ID if full URL pasted (e.g. https://.../board/65abc...)
    let boardId = joinInput.trim()
    if (boardId.includes('/board/')) {
      const parts = boardId.split('/board/')
      boardId = parts[1].split(/[/?#]/)[0]
    }
    if (!boardId) {
      setError('Please enter a valid board ID or URL')
      return
    }
    setShowJoinModal(false)
    setJoinInput('')
    navigate(`/board/${boardId}`)
  }

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
      return
    }
    try {
      await boardAPI.deleteBoard(boardId)
      setBoards(boards.filter(b => b._id !== boardId))
    } catch (err) {
      console.error('Delete board error:', err)
      setError(err.response?.data?.message || 'Failed to delete board')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-inter selection:bg-indigo-100 selection:text-indigo-600">
      {/* Subtle Board Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.4]" 
        style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}
      />
      {/* --- NAV BAR --- */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 z-[100] px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white transition-transform group-hover:rotate-6 shadow-xl shadow-slate-200">
              <FiWind className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 uppercase leading-none">Flow<span className="text-indigo-600">board</span></span>
              <span className="text-[8px] font-black text-slate-400 tracking-[0.2em] uppercase mt-1">Idea Realtime Engine</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowProfileModal(!showProfileModal)}
              className="flex items-center space-x-3 bg-slate-100 px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white text-xs font-black group-hover:rotate-12 transition-transform">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-slate-900 leading-none">{user?.name}</span>
              <FiSettings className="w-4 h-4 text-indigo-500 group-hover:rotate-90 transition-transform duration-300" />
            </button>
            <button 
              onClick={handleLogout}
              className="w-11 h-11 flex items-center justify-center text-slate-600 hover:text-rose-600 transition-colors bg-slate-100 hover:bg-rose-100 rounded-2xl border border-slate-200 hover:border-rose-300 shadow-sm hover:shadow-md"
              title="Logout">
              <FiLogOut className="text-lg" />
            </button>
          </div>
        </div>
      </nav>
      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white p-10 md:p-14 rounded-[3rem] max-w-md w-full shadow-3xl border border-slate-100 overflow-hidden"
            >
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4 leading-none">Profile</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-lg text-slate-900 placeholder:text-slate-300"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Profile Picture URL</label>
                  <input
                    type="text"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-lg text-slate-900 placeholder:text-slate-300"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 py-4 text-sm font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-[0.2em]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all disabled:opacity-50 active:scale-95"
                  >
                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="relative z-10 px-6 md:px-12 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-3"
            >
              <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">
                Your <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Collections</span>
              </h1>
              <p className="text-slate-500 font-semibold text-lg tracking-wide">
                {boards.length === 0 ? 'Start creating your first board' : `Exploring ${boards.length} active ${boards.length === 1 ? 'collection' : 'collections'}`}
              </p>
            </motion.div>
            
            <div className="flex flex-wrap items-center gap-4">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowJoinModal(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-8 py-4 rounded-2xl font-bold shadow-sm transition-all flex items-center group"
              >
                <FiUsers className="mr-3 text-lg text-indigo-600 group-hover:scale-110 transition-transform" />
                <span>Join Room</span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-2xl font-semibold shadow-xl shadow-indigo-300/30 hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center group"
              >
                <FiPlus className="mr-3 text-xl group-hover:rotate-90 transition-transform duration-300" />
                <span>Launch Board</span>
              </motion.button>
            </div>
          </div>

          {/* Boards Grid */}
          <AnimatePresence mode="wait">
            {loadingBoards ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/50 backdrop-blur-sm h-72 border border-slate-100 rounded-[3rem] animate-pulse" />
                ))}
              </motion.div>
            ) : boards.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-20 rounded-[4rem] text-center border border-slate-100 shadow-2xl shadow-indigo-100/20 max-w-4xl mx-auto"
              >
                <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-10">
                  <FiActivity className="w-12 h-12" />
                </div>
                <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Focus starts here.</h3>
                <p className="text-slate-400 font-medium mb-10 text-lg">Initialize a workspace or join an existing stream with your team.</p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="bg-slate-100 text-slate-800 border border-slate-200 px-10 py-5 rounded-2xl font-bold flex items-center transition-all hover:bg-slate-200 shadow-sm"
                  >
                    <FiUsers className="mr-3 text-indigo-600" />
                    <span>Join with Room ID</span>
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold flex items-center transition-all hover:bg-indigo-600 shadow-xl"
                  >
                    <FiPlus className="mr-3" />
                    <span>Start New Flow</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="grid"
                className="space-y-12"
              >
                {/* Quick Stats */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                  <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Boards</p>
                        <p className="text-3xl font-black text-slate-900 mt-2">{boards.length}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <FiGrid className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-100 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Collaborators</p>
                        <p className="text-3xl font-black text-slate-900 mt-2">{boards.reduce((sum, b) => sum + (b.collaborators?.length || 0), 0)}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                        <FiUsers className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl border border-pink-100 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-pink-600 uppercase tracking-wider">Active Today</p>
                        <p className="text-3xl font-black text-slate-900 mt-2">{boards.filter(b => {
                          const updated = new Date(b.updatedAt)
                          const today = new Date()
                          return updated.toDateString() === today.toDateString()
                        }).length}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                        <FiActivity className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">This Month</p>
                        <p className="text-3xl font-black text-slate-900 mt-2">{boards.filter(b => {
                          const updated = new Date(b.updatedAt)
                          const now = new Date()
                          return updated.getMonth() === now.getMonth() && updated.getFullYear() === now.getFullYear()
                        }).length}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <FiClock className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Boards Grid */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  initial="hidden"
                  animate="show"
                  variants={{
                    show: { transition: { staggerChildren: 0.1 } }
                  }}
                >
                {boards.map((board) => (
                  <motion.div
                    key={board._id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -8 }}
                    onClick={(e) => {
                      // Prevent navigation if the click originated from an element
                      // that should not trigger navigation (e.g., delete button).
                      if (e.target && e.target.closest && e.target.closest('[data-no-navigation]')) return
                      navigate(`/board/${board._id}`)
                    }}
                    className="bg-gradient-to-br from-white to-indigo-50/40 p-10 rounded-[2.5rem] border border-indigo-200/60 shadow-lg shadow-indigo-100/40 cursor-pointer group hover:border-indigo-400/60 hover:shadow-xl hover:shadow-indigo-200/50 transition-all duration-500 flex flex-col h-full relative overflow-hidden"
                  >
                    {/* Hover Glow */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-300/20 to-purple-200/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-200/10 to-indigo-100/20 rounded-full blur-2xl opacity-0 group-hover:opacity-80 transition-opacity duration-500" />
                    
                    {/* Delete Button - Bottom Right */}
                    <motion.button data-no-navigation
                      onClick={async (e) => {
                        // stop React and native propagation to prevent parent handlers
                        e.stopPropagation()
                        if (e.preventDefault) e.preventDefault()
                        if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation()
                        await handleDeleteBoard(board._id)
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute bottom-6 right-6 z-10 w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700 border border-rose-400/50 shadow-lg hover:shadow-xl transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center group-hover:scale-110"
                      title="Delete board"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </motion.button>
                    
                    <div className="flex items-start justify-between mb-12 relative z-10">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-600 group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white transition-all duration-500 flex items-center justify-center shadow-md group-hover:shadow-lg">
                        <FiWind className="w-8 h-8" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center text-indigo-400 group-hover:from-indigo-400 group-hover:to-purple-400 group-hover:text-white transition-all shadow-sm">
                        <FiArrowRight className="w-5 h-5 transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                      </div>
                    </div>
                    
                    <h3 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter leading-none group-hover:text-indigo-700 transition-colors relative z-10">
                      {board.title}
                    </h3>
                    
                    <div className="mt-auto flex items-center space-x-6 border-t border-indigo-100 pt-8 relative z-10">
                      <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-indigo-600">
                        <FiUsers className="mr-2 text-indigo-500" />
                        <span>{board.collaborators?.length || 1} Members</span>
                      </div>
                      <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-indigo-600">
                        <FiClock className="mr-2 text-purple-500" />
                        <span>{formatDate(board.updatedAt)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modern Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white p-12 md:p-16 rounded-[4rem] max-w-xl w-full shadow-3xl border border-slate-100 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full blur-3xl -z-10" />
              
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">Initialize <span className="text-indigo-600">Flow</span></h2>
              <p className="text-slate-400 font-medium mb-12 text-lg">Give your new stream a name to start collaborating.</p>
              
              <form onSubmit={handleCreateBoard} className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Stream Name</label>
                  <input
                    type="text"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    className="w-full h-20 px-8 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-xl text-slate-900 placeholder:text-slate-300"
                    placeholder="e.g. Design Sync"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-5 text-sm font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-[0.2em]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all disabled:opacity-50 active:scale-95"
                  >
                    {loading ? 'Initializing...' : 'Launch Stream'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Join Room Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowJoinModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white p-12 md:p-16 rounded-[4rem] max-w-xl w-full shadow-3xl border border-slate-100 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-50 rounded-full blur-3xl -z-10" />
              
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">Join <span className="text-indigo-600">Room</span></h2>
              <p className="text-slate-400 font-medium mb-12 text-lg">Enter a Board ID or paste the shareable whiteboard URL.</p>
              
              <form onSubmit={handleJoinBoard} className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Room ID or Link</label>
                  <input
                    type="text"
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    className="w-full h-20 px-8 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-xl text-slate-900 placeholder:text-slate-300"
                    placeholder="e.g. 65fa18... or https://.../board/65fa18..."
                    autoFocus
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 py-5 text-sm font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-[0.2em]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-2xl font-black shadow-2xl shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-95"
                  >
                    Join Whiteboard
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
