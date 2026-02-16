import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Tooltip from './Tooltip'

export default function ToolButton({ active, onClick, children, label }) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <motion.div
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className="relative"
    >
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.98 }}
        className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${active ? 'bg-white/12 ring-1 ring-white/20' : 'hover:bg-white/4'}`}>
        <div className="text-white text-lg">{children}</div>
      </motion.button>
      <AnimatePresence>
        {showTooltip && (
          <Tooltip side="right">{label}</Tooltip>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
