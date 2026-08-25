import React from 'react'
import { FiUser, FiActivity } from 'react-icons/fi'
import useBoardStore from '../store/useBoardStore'

export default function CollaboratorsList({ boardId, socket }) {
  // Presence lives in the board store, which is seeded from the `board-presence`
  // roster the server sends on join. Subscribing to socket events here instead
  // meant this panel only ever saw people who joined after it mounted — open the
  // sidebar a moment late and it claimed nobody else was in the room.
  const presence = useBoardStore((s) => s.presence)
  const collaborators = presence.map((p) => ({ id: p.userId, name: p.name, online: true }))

  return (
    <div className="flex flex-col space-y-3">
      {collaborators.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
           <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-600">
             <FiActivity />
           </div>
           <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">No one else here</p>
        </div>
      ) : (
        collaborators.map((collab, index) => (
          <div 
            key={collab.id} 
            className="group flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 animate-fadeIn"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-purple-300 font-bold border border-white/10 group-hover:scale-110 transition-transform">
                  {(collab.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#1e293b] rounded-full animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">{collab.name}</span>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Collaborator</span>
              </div>
            </div>
            
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
               <FiUser className="text-gray-600" />
            </div>
          </div>
        ))
      )}
    </div>
  )
}
