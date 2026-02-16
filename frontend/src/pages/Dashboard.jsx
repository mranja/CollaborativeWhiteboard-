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
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-inter relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-50 rounded-full blur-[100px] opacity-40" />
        <div className="absolute inset-0 opacity-[0.2]" 
          style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </div>
      
      {/* Navigation */}
      <nav className="relative z-50 px-4 md:px-8 h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between sticky top-0">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-3 group cursor-pointer" 
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform duration-300">
            <FiWind className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <span className="text-lg md:text-xl font-black tracking-tight text-slate-900 uppercase">Flow<span className="text-indigo-600">board</span></span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-3 md:space-x-6"
        >
          <div className="flex items-center space-x-2 md:space-x-3 bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white text-[10px] md:text-xs font-black">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
               <span className="text-[8px] md:text-[10px] font-black text-slate-400 leading-none uppercase tracking-widest">{user?.name}</span>
               <span className="text-[7px] md:text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">Pro Member</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors bg-white rounded-xl border border-slate-100 hover:shadow-lg"
            title="Logout"
          >
            <FiLogOut className="text-lg" />
          </button>
        </motion.div>
      </nav>

      <main className="relative z-10 px-4 md:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                Your <span className="text-indigo-600 italic">Streams</span>
              </h1>
              <p className="text-slate-400 font-medium text-lg">
                {boards.length === 0 ? 'Initialize your first board' : `Managing ${boards.length} active flow${boards.length !== 1 ? 's' : ''}`}
              </p>
            </motion.div>
            
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="bg-slate-900 text-white px-10 py-5 rounded-2xl text-base font-black shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all flex items-center group"
            >
              <FiPlus className="mr-3 text-xl group-hover:rotate-90 transition-transform duration-300" />
              <span>Launch Board</span>
            </motion.button>
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
                <p className="text-slate-400 font-medium mb-10 text-lg">Initialize a workspace and start streaming your team's ideas in real-time.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-bold flex items-center mx-auto transition-all hover:bg-indigo-600 shadow-xl"
                >
                  <FiPlus className="mr-3" />
                  <span>Start New Flow</span>
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="grid"
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
                    onClick={() => navigate(`/board/${board._id}`)}
                    className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50 cursor-pointer group hover:border-indigo-400/30 hover:shadow-2xl transition-all duration-500 flex flex-col h-full relative overflow-hidden"
                  >
                    {/* Hover Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-start justify-between mb-12">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 flex items-center justify-center shadow-sm">
                        <FiWind className="w-8 h-8" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-indigo-400 group-hover:bg-indigo-50 transition-all">
                        <FiArrowRight className="w-5 h-5 transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                      </div>
                    </div>
                    
                    <h3 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter leading-none group-hover:text-indigo-600 transition-colors">
                      {board.title}
                    </h3>
                    
                    <div className="mt-auto flex items-center space-x-6 border-t border-slate-50 pt-8">
                      <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <FiUsers className="mr-2 text-indigo-500" />
                        <span>{board.collaborators?.length || 1} Members</span>
                      </div>
                      <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <FiClock className="mr-2 text-indigo-500" />
                        <span>{formatDate(board.updatedAt)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
    </div>
  )
}
