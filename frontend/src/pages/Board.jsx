import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CanvasBoard from '../components/CanvasBoard'
import Toolbar from '../components/Toolbar'
import CollaboratorsList from '../components/CollaboratorsList'
import InviteModal from '../components/InviteModal'
import VersionHistoryModal from '../components/VersionHistoryModal'
import useBoardStore from '../store/useBoardStore'
import useAuthStore from '../store/useAuthStore'
import { boardAPI } from '../api/client'
import { 
  FiChevronLeft, 
  FiShare2, 
  FiDownload, 
  FiLayers, 
  FiMenu, 
  FiX, 
  FiHome,
  FiFileText,
  FiImage,
  FiClock,
  FiSettings,
  FiUsers,
  FiWind,
  FiMoon,
  FiSun
} from 'react-icons/fi'

export default function BoardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  
  const user = useAuthStore(s => s.user)
  const setBoard = useBoardStore(s => s.setBoard)
  
  const [socket, setSocket] = useState(null)
  const [userRole, setUserRole] = useState('editor')
  const [showInvite, setShowInvite] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [boardTitle, setBoardTitle] = useState('Loading Board...')
  
  // UI State
  const [activeSidebar, setActiveSidebar] = useState(null) // 'collabs'
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768)
  const [theme, setTheme] = useState(localStorage.getItem('board-theme') || 'dark')
  
  const liveCursors = useBoardStore(s => s.liveCursors)
  const activeUserCount = Object.keys(liveCursors).length + 1 // +1 for self

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await boardAPI.getBoard(id)
        if (!res.data) throw new Error('No board data')
        
        setBoardTitle(res.data.title || 'Untitled')
        setBoard(id, res.data.elements || [])
        
        const currentUserId = user?.id || user?._id
        const ownerId = res.data.owner?._id || res.data.owner
        
        if (ownerId && ownerId === currentUserId) {
          setUserRole('owner')
        } else {
          const collab = res.data.collaborators?.find(c => {
            const cid = c.user?._id || c.user
            return cid === currentUserId
          })
          setUserRole(collab?.role || 'viewer')
        }
      } catch (err) {
        console.error('Failed to fetch board:', err)
        navigate('/dashboard')
      }
    }
    fetchBoard()
  }, [id, user, navigate, setBoard])

  const handleExport = (format) => {
    canvasRef.current?.exportImage(format)
    setShowExportMenu(false)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('board-theme', newTheme)
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col font-inter bg-[#0f172a] text-white">
      
      {/* --- SOLID NAV BAR (Top) --- */}
      <nav className="h-16 border-b border-white/5 bg-[#0f172a] px-6 flex items-center justify-between z-[100] relative">
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-3 text-gray-400 hover:text-white transition-all py-1.5 pl-2 pr-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 group"
          >
            <FiWind className="text-xl text-indigo-400 group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden sm:inline">Flowboard</span>
          </button>
          
          <div className="h-4 w-px bg-white/10" />
          
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white tracking-tight leading-none mb-1">{boardTitle}</h1>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                 <span className={`w-2 h-2 rounded-full ${userRole === 'owner' ? 'bg-indigo-500 animate-pulse' : 'bg-green-500'}`} />
                 <span>{userRole} Mode</span>
              </div>
              <div className="h-2 w-px bg-gray-500/30" />
              <div className="flex items-center space-x-1.5 text-[10px] text-indigo-500 uppercase tracking-widest font-bold">
                <FiUsers className="text-xs" />
                <span>{activeUserCount} Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Mobile Toolbar Toggle */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white border border-white/10"
          >
            <FiMenu className="text-xl" />
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3 md:px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] md:text-xs font-bold flex items-center mb-0 transition-all border border-indigo-500/20"
            >
              <FiDownload className="mr-1 md:mr-2" />
              <span className="hidden xs:inline">Export</span>
            </button>
            
            {showExportMenu && (
              <>
                <div className="fixed inset-0" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl p-2 z-[110] animate-scaleIn">
                  <button onClick={() => handleExport('png')} className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-xs text-left">
                    <FiImage className="text-indigo-400" />
                    <span>Download PNG</span>
                  </button>
                  <button onClick={() => handleExport('pdf')} className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-xs text-left">
                    <FiFileText className="text-pink-400" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button 
             onClick={() => setActiveSidebar(activeSidebar === 'collabs' ? null : 'collabs')}
             className={`p-2 rounded-lg transition-colors border ${activeSidebar === 'collabs' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <FiUsers className="text-lg" />
          </button>

          {userRole === 'owner' && (
            <button 
              onClick={() => setShowInvite(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 md:px-5 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center"
            >
              <FiShare2 className="mr-1 md:mr-2" />
              <span className="hidden xs:inline">Invite</span>
            </button>
          )}

          <div className="hidden sm:block h-6 w-px bg-white/10 mx-1 md:mx-2" />
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors border ${showSettings ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <FiSettings className="text-xl" />
          </button>

          {showSettings && (
            <>
              <div className="fixed inset-0" onClick={() => setShowSettings(false)} />
              <div className="absolute right-6 top-20 w-64 border border-white/10 rounded-2xl shadow-2xl p-4 z-[110] animate-scaleIn bg-[#1e293b]">
                <h3 className="text-xs font-black uppercase tracking-widest mb-4 text-slate-400">Board Settings</h3>
                
                <div className="space-y-2">
                  <button 
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/5 text-slate-300"
                  >
                    <div className="flex items-center space-x-3">
                      {theme === 'dark' ? <FiSun className="text-amber-400" /> : <FiMoon className="text-indigo-600" />}
                      <span className="text-sm font-bold">{theme === 'dark' ? 'Light Board' : 'Dark Board'}</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${theme === 'dark' ? 'right-1' : 'left-1'}`} />
                    </div>
                  </button>

                  <button className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all hover:bg-white/5 text-slate-300">
                    <FiLayers className="text-indigo-400" />
                    <span className="text-sm font-bold">Grid Settings</span>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                   <p className="text-[9px] text-center text-slate-500 font-black uppercase tracking-widest">Flow Engine v2.0</p>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* --- WORKSPACE AREA --- */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* --- DEDICATED TOOLBAR SIDEBAR (Left) --- */}
        <aside className={`
          absolute md:relative lg:w-72 md:w-64 w-64 bg-[#0f172a] border-r border-white/5 flex flex-col z-50 overflow-y-auto custom-scrollbar shadow-2xl 
          transition-transform duration-300 h-full
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-6 flex flex-col h-full space-y-8">
            <Toolbar 
              userRole={userRole} 
              onVersionClick={() => setShowVersionHistory(true)} 
              theme="dark"
            />
          </div>
        </aside>

        {/* --- MAIN CONTENT (Whiteboard) --- */}
        <main className={`flex-1 relative overflow-hidden transition-colors ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
          <CanvasBoard 
            ref={canvasRef}
            boardId={id} 
            userRole={userRole} 
            onSocketChange={setSocket}
            theme={theme}
          />
        </main>

        {/* --- COLLABORATORS SIDEBAR (Right) --- */}
        <div className={`
          absolute right-0 top-0 bottom-0 z-[60] transition-all duration-300 transform
          ${activeSidebar === 'collabs' ? 'translate-x-0' : 'translate-x-full'}
          w-full sm:w-80 bg-[#1e293b] border-l border-white/5 p-6 shadow-2xl
        `}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <FiUsers className="text-indigo-400" />
              <span>Team Activity</span>
            </h2>
            <button onClick={() => setActiveSidebar(null)} className="text-gray-500 hover:text-white">
              <FiX className="text-xl" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pb-20">
            {socket && <CollaboratorsList boardId={id} socket={socket} />}
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <button 
              onClick={() => setShowVersionHistory(true)}
              className="w-full flex items-center justify-center space-x-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/10 text-gray-400 hover:text-white transition-all text-sm font-semibold"
            >
              <FiClock className="text-lg" />
              <span>View History</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {showInvite && <InviteModal boardId={id} onClose={() => setShowInvite(false)} />}
      {showVersionHistory && <VersionHistoryModal boardId={id} onClose={() => setShowVersionHistory(false)} />}
    </div>
  )
}
