import React from 'react'
import { motion } from 'framer-motion'

export default function Tooltip({ children, side = 'top' }) {
  const variants = {
    hidden: { opacity: 0, y: side === 'top' ? 6 : -6, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1 }
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={variants}
      transition={{ duration: 0.16 }}
      className="pointer-events-none absolute z-50 whitespace-nowrap bg-black/80 text-white text-xs rounded px-2 py-1"
    >
      {children}
    </motion.div>
  )
}
