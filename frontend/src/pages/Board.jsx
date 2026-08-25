import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import CanvasBoard from '../components/CanvasBoard'
import Toolbar from '../components/Toolbar'
import CollaboratorsList from '../components/CollaboratorsList'
import InviteModal from '../components/InviteModal'
import VersionHistoryModal from '../components/VersionHistoryModal'
import useBoardStore from '../store/useBoardStore'
import { boardAPI } from '../api/client'
import { patchBoard, prefetchBoards } from '../lib/boardsCache'
import Loader from '../components/Loader'
import {
  FiChevronLeft,
  FiShare2,
  FiCheck,
  FiDownload,
  FiMenu,
  FiX,
  FiEye,
  FiFileText,
  FiImage,
  FiClock,
  FiSettings,
  FiUsers,
  FiUserPlus,
  FiWind,
  FiMoon,
  FiSun
} from 'react-icons/fi'

export default function BoardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const canvasRef = useRef(null)

  const setBoard = useBoardStore(s => s.setBoard)

  const [socket, setSocket] = useState(null)
  const [userRole, setUserRole] = useState('editor')
  const [showInvite, setShowInvite] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [boardTitle, setBoardTitle] = useState('Loading Board...')
  const [isBoardLoading, setIsBoardLoading] = useState(true)

  // UI State
  const [activeSidebar, setActiveSidebar] = useState(null) // 'collabs'
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768)
  const [theme, setTheme] = useState(localStorage.getItem('board-theme') || 'dark')

  // Presence comes from the server's room roster, so the count is right the
  // moment we join. It used to be derived from liveCursors, which only filled in
  // once each remote user happened to move their mouse.
  const presence = useBoardStore(s => s.presence)
  const activeUserCount = presence.length + 1 // +1 for self

  useEffect(() => {
    let isMounted = true
    setIsBoardLoading(true)

    const fetchBoard = async () => {
      try {
        const res = await boardAPI.getBoard(id)
        if (!res.data) throw new Error('No board data')
        if (!isMounted) return

        setBoardTitle(res.data.title || 'Untitled')
        setBoard(id, res.data.elements || [])
        setUserRole(res.data.currentUserRole || 'viewer')

        // Opening a board auto-attaches the visitor as a collaborator, so the
        // dashboard's cached copy of this board is now out of date. Write what
        // we already know back into the cache: the dashboard then paints the
        // correct member count on its very first frame instead of showing stale
        // numbers until its own request lands.
        patchBoard({
          _id: id,
          title: res.data.title,
          collaborators: res.data.collaborators,
          owner: res.data.owner,
          updatedAt: res.data.updatedAt,
        })
      } catch (err) {
        console.error('Failed to fetch board:', err)
        if (isMounted) navigate('/dashboard')
      } finally {
        if (isMounted) setIsBoardLoading(false)
      }
    }
    fetchBoard()

    return () => { isMounted = false }
  }, [id, navigate, setBoard])

  // Start refreshing the board list on the way out so the dashboard has fresh
  // data by the time it mounts rather than starting the round-trip afterwards.
  useEffect(() => () => { prefetchBoards() }, [])

  const [copiedLink, setCopiedLink] = useState(false)
  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard?.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleExport = (format) => {
    canvasRef.current?.exportImage(format)
    setShowExportMenu(false)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('board-theme', newTheme)
  }

  const roleDot = userRole === 'owner'
    ? 'bg-indigo-400'
    : userRole === 'viewer'
      ? 'bg-amber-400'
      : 'bg-emerald-400'

  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col font-inter bg-[#0b1120] text-white">

      {/* Ambient wash so the chrome reads as lit rather than flat slate. */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 left-1/4 w-[38rem] h-[38rem] rounded-full bg-indigo-600/10 blur-[130px]" />
        <div className="absolute -bottom-52 right-10 w-[32rem] h-[32rem] rounded-full bg-purple-600/10 blur-[130px]" />
      </div>

      {/* --- TOP BAR --- */}
      <nav className="relative z-[100] h-16 flex items-center justify-between px-4 md:px-6 bg-gradient-to-r from-[#0f172a] via-[#141d33] to-[#0f172a] border-b border-white/10 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)]">
        <div className="flex items-center min-w-0 gap-3 md:gap-4">
          <motion.button
            onClick={() => navigate('/dashboard')}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.94 }}
            className="flex-none w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 bg-white/5 border border-white/10 hover:text-white hover:bg-indigo-500/15 hover:border-indigo-400/40 transition-colors"
            title="Back to Dashboard"
          >
            <FiChevronLeft className="text-xl" />
          </motion.button>

          <div className="hidden sm:block w-px h-8 bg-gradient-to-b from-transparent via-white/15 to-transparent" />

          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-none w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <FiWind className="text-lg text-white" />
            </div>

            <div className="flex flex-col min-w-0">
              <h1 className="font-display text-[15px] text-white tracking-tight leading-tight truncate max-w-[8rem] sm:max-w-xs">
                {boardTitle}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.14em] text-slate-300">
                  <span className={`w-1.5 h-1.5 rounded-full ${roleDot}`} />
                  {userRole}
                </span>
                <span className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-300">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                    <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </span>
                  {activeUserCount} Live
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-300 border border-white/10 hover:text-white transition-colors"
            title="Toggle tools"
          >
            <FiMenu className="text-lg" />
          </button>

          <button
            onClick={handleCopyLink}
            className={`h-10 px-3 md:px-4 rounded-xl text-xs font-bold flex items-center gap-2 border transition-colors ${
              copiedLink
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-white/10 shadow-lg shadow-indigo-900/40 hover:from-indigo-500 hover:to-purple-500'
            }`}
            title="Copy board share link to clipboard"
          >
            {copiedLink ? <FiCheck className="text-sm" /> : <FiShare2 className="text-sm" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className={`h-10 px-3 md:px-4 rounded-xl text-xs font-bold flex items-center gap-2 border transition-colors ${
                showExportMenu
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-400/40'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10'
              }`}
              title="Export board"
            >
              <FiDownload className="text-sm" />
              <span className="hidden md:inline">Export</span>
            </button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/10 bg-[#141d33]/95 backdrop-blur-xl shadow-2xl shadow-black/60 p-1.5 z-[110] animate-scaleIn">
                  <p className="px-3 pt-2 pb-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Download as</p>
                  <button onClick={() => handleExport('png')} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors text-xs font-semibold text-slate-200 text-left">
                    <span className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-300 flex items-center justify-center"><FiImage /></span>
                    <span>PNG Image</span>
                  </button>
                  <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors text-xs font-semibold text-slate-200 text-left">
                    <span className="w-8 h-8 rounded-lg bg-pink-500/15 text-pink-300 flex items-center justify-center"><FiFileText /></span>
                    <span>PDF Document</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setActiveSidebar(activeSidebar === 'collabs' ? null : 'collabs')}
            className={`relative h-10 w-10 flex items-center justify-center rounded-xl border transition-colors ${
              activeSidebar === 'collabs'
                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-400/40'
                : 'bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10'
            }`}
            title="Collaborators"
          >
            <FiUsers className="text-base" />
            {activeUserCount > 1 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-emerald-500 text-[9px] font-black text-[#0b1120] flex items-center justify-center border-2 border-[#141d33]">
                {activeUserCount}
              </span>
            )}
          </button>

          {userRole === 'owner' && (
            <button
              onClick={() => setShowInvite(true)}
              className="h-10 px-3 md:px-4 rounded-xl text-xs font-bold flex items-center gap-2 bg-white/5 text-slate-300 border border-white/10 hover:text-white hover:bg-white/10 transition-colors"
              title="Email invite"
            >
              <FiUserPlus className="text-sm" />
              <span className="hidden lg:inline">Invite</span>
            </button>
          )}

          <div className="hidden sm:block w-px h-8 bg-gradient-to-b from-transparent via-white/15 to-transparent mx-1" />

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`h-10 w-10 flex items-center justify-center rounded-xl border transition-colors ${
              showSettings
                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-400/40'
                : 'bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10'
            }`}
            title="Board settings"
          >
            <FiSettings className="text-base" />
          </button>

          {showSettings && (
            <>
              <div className="fixed inset-0" onClick={() => setShowSettings(false)} />
              <div className="absolute right-4 md:right-6 top-[4.5rem] w-64 rounded-2xl border border-white/10 bg-[#141d33]/95 backdrop-blur-xl shadow-2xl shadow-black/60 p-2 z-[110] animate-scaleIn">
                <p className="px-3 pt-2 pb-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Board Settings</p>

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-colors text-slate-200"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      {theme === 'dark' ? <FiSun className="text-amber-400" /> : <FiMoon className="text-indigo-300" />}
                    </span>
                    <span className="text-xs font-bold">{theme === 'dark' ? 'Light Canvas' : 'Dark Canvas'}</span>
                  </span>
                  <span className={`w-9 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-600'}`}>
                    <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${theme === 'dark' ? 'right-1' : 'left-1'}`} />
                  </span>
                </button>

                <button
                  onClick={() => { setShowSettings(false); setShowVersionHistory(true) }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors text-slate-200"
                >
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><FiClock className="text-indigo-300" /></span>
                  <span className="text-xs font-bold">Version History</span>
                </button>

                <div className="mt-1 pt-3 border-t border-white/5">
                  <p className="font-display text-[9px] text-center text-slate-600 uppercase tracking-[0.18em] pb-1">Flow Engine v2.0</p>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* --- WORKSPACE AREA --- */}
      <div className="relative z-10 flex-1 flex overflow-hidden">

        {/* --- TOOLBAR SIDEBAR (Left) --- */}
        <aside className={`
          absolute md:relative lg:w-72 md:w-64 w-64 h-full z-50 flex flex-col
          bg-gradient-to-b from-[#131c31] via-[#0f172a] to-[#0f172a]
          border-r border-white/10 shadow-2xl shadow-black/50
          overflow-y-auto custom-scrollbar transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="relative p-5 flex flex-col h-full">
            {/* Soft glow anchoring the panel to the top bar. */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="relative">
              <Toolbar
                userRole={userRole}
                onVersionClick={() => setShowVersionHistory(true)}
                theme="dark"
              />
            </div>
          </div>
        </aside>

        {/* Scrim so tapping outside the mobile toolbar closes it. */}
        {isSidebarOpen && (
          <div
            className="md:hidden absolute inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* --- MAIN CONTENT (Whiteboard) --- */}
        <main className={`flex-1 relative overflow-hidden transition-colors ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
          <CanvasBoard
            ref={canvasRef}
            boardId={id}
            userRole={userRole}
            onSocketChange={setSocket}
            theme={theme}
          />

          {/* Inner edge shading so the canvas sits inside the chrome rather
              than butting flat against it. */}
          <div className="pointer-events-none absolute inset-0 z-[5] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),inset_8px_0_20px_-16px_rgba(0,0,0,0.9)]" />

          {userRole === 'viewer' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-200 text-[10px] font-black uppercase tracking-[0.16em] backdrop-blur-md">
              <FiEye className="text-sm" />
              <span>View only</span>
            </div>
          )}
        </main>

        {/* --- COLLABORATORS SIDEBAR (Right) --- */}
        <div className={`
          absolute right-0 top-0 bottom-0 z-[60] flex flex-col transition-transform duration-300 transform
          ${activeSidebar === 'collabs' ? 'translate-x-0' : 'translate-x-full'}
          w-full sm:w-80 bg-gradient-to-b from-[#1a2438] to-[#131c31] border-l border-white/10 shadow-2xl shadow-black/60
        `}>
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-400/25 flex items-center justify-center text-indigo-300">
                <FiUsers />
              </span>
              <div className="flex flex-col">
                <h2 className="text-sm font-bold text-white leading-tight">Team Activity</h2>
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                  {activeUserCount} in this room
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveSidebar(null)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <FiX className="text-lg" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {socket && <CollaboratorsList boardId={id} socket={socket} />}
          </div>

          <div className="p-4 border-t border-white/5">
            <button
              onClick={() => setShowVersionHistory(true)}
              className="w-full flex items-center justify-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-400/40 hover:bg-indigo-500/10 text-slate-300 hover:text-white transition-colors text-xs font-bold"
            >
              <FiClock className="text-base" />
              <span>View History</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- BOARD LOADING OVERLAY --- */}
      {isBoardLoading && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center bg-[#0b1120]">
          <Loader
            size="lg"
            theme="dark"
            label="Opening Your Board..."
            sub="Syncing elements and collaborators"
          />
        </div>
      )}

      {/* --- MODALS --- */}
      {showInvite && <InviteModal boardId={id} onClose={() => setShowInvite(false)} />}
      {showVersionHistory && <VersionHistoryModal boardId={id} onClose={() => setShowVersionHistory(false)} />}
    </div>
  )
}
