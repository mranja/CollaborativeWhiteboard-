import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useBoardStore } from '../../stores/boardStore'
import { MdContentCopy, MdContentPaste } from 'react-icons/md'

export default function Topbar() {
  const { zoom, setZoom, bringForward, sendBackward, copySelection, pasteClipboard, deleteSelection } = useBoardStore((s) => ({
    zoom: s.zoom,
    setZoom: s.setZoom,
    bringForward: s.bringForward,
    sendBackward: s.sendBackward,
    copySelection: s.copySelection,
    pasteClipboard: s.pasteClipboard,
    deleteSelection: s.deleteSelection
  }))
  const [boardName, setBoardName] = useState('Project Board')
  const [isEditingName, setIsEditingName] = useState(false)

  const zoomOut = () => setZoom(Math.max(0.2, zoom - 0.1))
  const zoomIn = () => setZoom(Math.min(3, zoom + 0.1))

  return (
    <header className="fixed left-1/2 -translate-x-1/2 top-4 z-50">
      <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="flex items-center gap-4 bg-[rgba(255,255,255,0.04)] backdrop-blur-md rounded-2xl px-6 py-3 tool-shadow border border-white/5">
        {isEditingName ? (
          <input
            autoFocus
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
            className="bg-white/10 text-white rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/30"
          />
        ) : (
          <motion.div
            onClick={() => setIsEditingName(true)}
            className="text-white font-semibold cursor-pointer hover:opacity-70 transition"
          >
            {boardName}
          </motion.div>
        )}

        <div className="h-6 w-px bg-white/10"></div>

        <div className="flex items-center gap-2">
          <motion.button onClick={zoomOut} whileHover={{ scale: 1.05 }} className="px-2 py-1 rounded bg-white/4 hover:bg-white/6 text-white text-sm">−</motion.button>
          <div className="text-white px-3 text-sm font-mono w-12 text-center">{Math.round(zoom * 100)}%</div>
          <motion.button onClick={zoomIn} whileHover={{ scale: 1.05 }} className="px-2 py-1 rounded bg-white/4 hover:bg-white/6 text-white text-sm">+</motion.button>
        </div>

        <div className="h-6 w-px bg-white/10"></div>

        <div className="flex items-center gap-2">
          <motion.button onClick={bringForward} whileHover={{ scale: 1.05 }} className="px-3 py-1 rounded bg-white/4 hover:bg-white/6 text-white text-sm">↑</motion.button>
          <motion.button onClick={sendBackward} whileHover={{ scale: 1.05 }} className="px-3 py-1 rounded bg-white/4 hover:bg-white/6 text-white text-sm">↓</motion.button>
          <motion.button onClick={copySelection} whileHover={{ scale: 1.05 }} className="px-2 py-1 rounded bg-white/4 hover:bg-white/6 text-white"><MdContentCopy /></motion.button>
          <motion.button onClick={pasteClipboard} whileHover={{ scale: 1.05 }} className="px-2 py-1 rounded bg-white/4 hover:bg-white/6 text-white"><MdContentPaste /></motion.button>
          <motion.button onClick={deleteSelection} whileHover={{ scale: 1.05 }} className="px-3 py-1 rounded bg-red-600/50 hover:bg-red-600 text-white text-sm">Del</motion.button>
        </div>
      </motion.div>
    </header>
  )
}
