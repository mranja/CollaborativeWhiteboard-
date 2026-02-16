import React from 'react'
import { motion } from 'framer-motion'

export default function ToolButton({ active, onClick, children, label }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.98 }}
      className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${active ? 'bg-white/12 ring-1 ring-white/20' : 'hover:bg-white/4'}`}>
      <div className="flex flex-col items-center">
        <div className="text-white text-sm">{children}</div>
        {label && <div className="text-[10px] text-white/70 mt-1">{label}</div>}
      </div>
    </motion.button>
  )
}
