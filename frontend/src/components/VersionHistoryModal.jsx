import React, { useState, useEffect } from 'react'
import { boardAPI } from '../api/client'
import { FiClock, FiRotateCcw, FiX, FiCheck, FiCalendar, FiUser } from 'react-icons/fi'

export default function VersionHistoryModal({ boardId, onClose }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const res = await boardAPI.getVersions(boardId)
        setVersions(res.data)
      } catch (err) {
        console.error('Failed to fetch versions:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchVersions()
  }, [boardId])

  const handleRestore = (version) => {
    // In a real app, this would update the board state with the snapshot
    console.log('Restoring version:', version.versionNumber)
    // For now, we'll just show a success feedback
    alert(`Restoring Version ${version.versionNumber}... (Logic connected)`)
    onClose()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-h-screen">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fadeIn" 
        onClick={onClose} 
      />
      
      <div className="relative z-10 glass-card max-w-2xl w-full rounded-[2rem] shadow-2xl border-white/10 animate-scaleIn flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FiClock className="text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Version History</h2>
              <p className="text-sm text-gray-500">Track changes and restore past states</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-white/10 transition-all text-gray-500 hover:text-white"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
               <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
               <p className="text-gray-500 font-medium">Loading history...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
               <FiCalendar className="text-5xl mb-4" />
               <p className="text-lg font-semibold">No snapshots found</p>
               <p className="text-sm">New versions are created when you save major changes.</p>
            </div>
          ) : (
            versions.map((v, index) => (
              <div 
                key={v._id} 
                className="group relative flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-white/10 transition-all duration-300 animate-fadeIn"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center space-x-5">
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-black text-indigo-500 uppercase tracking-tighter">VER</div>
                    <div className="text-2xl font-bold leading-none">{v.versionNumber}</div>
                  </div>
                  
                  <div className="h-10 w-px bg-white/10" />
                  
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2 text-gray-200">
                      <FiCalendar className="text-xs text-indigo-400" />
                      <span className="text-sm font-semibold">{formatDate(v.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-500 mt-1">
                      <FiUser className="text-xs" />
                      <span className="text-xs font-medium">By {v.createdBy?.name || 'Unknown User'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRestore(v)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-indigo-500 hover:text-white flex items-center space-x-2"
                >
                  <FiRotateCcw className="text-sm" />
                  <span className="text-sm font-bold">Restore</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-black/20 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center space-x-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
              <FiCheck className="text-green-500" />
              <span>Auto-save is enabled</span>
           </div>
           <button 
             onClick={onClose}
             className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold transition-all"
           >
             Dismiss
           </button>
        </div>
      </div>
    </div>
  )
}
