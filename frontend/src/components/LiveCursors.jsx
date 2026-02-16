import React from 'react'

/**
 * Display live cursors of all users on the canvas
 */
export default function LiveCursors({ cursors }) {
  return (
    <>
      {Object.entries(cursors).map(([userId, cursor]) => (
        <div
          key={userId}
          className="fixed pointer-events-none z-50"
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            transform: 'translate(0, 0)'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 3l7.07 18.26L12.58 13l5.73-.57L3 3z"
              fill={cursor.color || '#3B82F6'}
              stroke="white"
              strokeWidth="0.5"
            />
          </svg>
          <div
            className="absolute left-6 top-0 px-2 py-1 rounded text-xs whitespace-nowrap font-medium text-white"
            style={{
              backgroundColor: cursor.color || '#3B82F6',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            {cursor.name}
          </div>
        </div>
      ))}
    </>
  )
}
