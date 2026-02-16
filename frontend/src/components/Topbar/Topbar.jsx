import React from 'react'
import { motion } from 'framer-motion'
import { useBoardStore } from '../../stores/boardStore'

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

  const zoomOut = () => setZoom(Math.max(0.2, zoom - 0.1))
  const zoomIn = () => setZoom(Math.min(3, zoom + 0.1))

  return (
    <header className="fixed left-1/2 -translate-x-1/2 top-4 z-50">
      <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="flex items-center gap-3 bg-white/6 backdrop-blur rounded-lg px-4 py-2 shadow-md">
        <div className="text-white font-semibold">Project Board</div>
        <div className="flex items-center gap-2">
          <button onClick={zoomOut} className="px-2 py-1 rounded bg-white/4 text-white">-</button>
          <div className="text-white px-2">{Math.round(zoom * 100)}%</div>
          <button onClick={zoomIn} className="px-2 py-1 rounded bg-white/4 text-white">+</button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={bringForward} className="px-2 py-1 rounded bg-white/4 text-white">Bring Forward</button>
          <button onClick={sendBackward} className="px-2 py-1 rounded bg-white/4 text-white">Send Back</button>
          <button onClick={copySelection} className="px-2 py-1 rounded bg-white/4 text-white">Copy</button>
          <button onClick={pasteClipboard} className="px-2 py-1 rounded bg-white/4 text-white">Paste</button>
          <button onClick={deleteSelection} className="px-2 py-1 rounded bg-red-600 text-white">Delete</button>
        </div>
      </motion.div>
    </header>
  )
}
