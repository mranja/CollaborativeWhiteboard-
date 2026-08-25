import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Premium Live Cursors for Flowboard
 */
export default function LiveCursors({ cursors }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <AnimatePresence>
        {Object.entries(cursors).map(([userId, cursor]) => {
          // `${cursor.color}33 || fallback` can never fall back: a template
          // literal is always a truthy string, so an undefined colour produced
          // the literal "undefined33". Resolve the colour once, up front.
          const color = cursor.color || '#8b5cf6'
          return (
          <motion.div
            key={userId}
            className="absolute z-[100] flex flex-col items-start"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              left: cursor.x,
              top: cursor.y 
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 300, 
              mass: 0.8,
              opacity: { duration: 0.2 }
            }}
          >
            {/* Custom Modern Cursor SVG */}
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="drop-shadow-lg"
              style={{ transform: 'rotate(-10deg)' }}
            >
              <path 
                d="M5.65376 12.3745L15.4243 19.3514C17.0708 20.5271 19.1432 18.4547 17.9675 16.8083L10.9905 7.03774C10.0384 5.70484 7.96162 5.70484 7.00948 7.03774L5.65376 12.3745Z" 
                fill={color} 
                stroke="white" 
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>

            {/* Glassmorphism Name Tag */}
            <motion.div
              className="mt-1 ml-4 px-3 py-1.5 rounded-lg border text-[11px] font-bold tracking-tight whitespace-nowrap shadow-2xl backdrop-blur-md"
              style={{
                backgroundColor: `${color}33`,
                borderColor: `${color}66`,
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>{cursor.name || 'Remote User'}</span>
              </div>
            </motion.div>
          </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
