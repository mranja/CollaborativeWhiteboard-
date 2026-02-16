import React, { useState } from 'react'
import { boardAPI } from '../api/client'
import { FiMail, FiUserPlus, FiX, FiCheckCircle, FiShield } from 'react-icons/fi'

export default function InviteModal({ boardId, onClose, onInviteSent }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      await boardAPI.invite(boardId, email, role)
      setSuccess(`Successfully sent invitation to ${email}!`)
      setEmail('')
      if (onInviteSent) onInviteSent()
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invite. User may not exist.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-h-screen">
      {/* Dynamic Blur Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fadeIn" 
        onClick={onClose} 
      />
      
      {/* Modal Card */}
      <div className="relative z-10 glass-card max-w-md w-full p-8 rounded-[2rem] shadow-2xl border-white/10 animate-scaleIn">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
        >
          <FiX className="text-xl" />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 text-white shadow-lg animate-glow">
            <FiUserPlus className="text-3xl" />
          </div>
          <h2 className="text-3xl font-bold gradient-text">Add Collaborator</h2>
          <p className="text-gray-400 mt-2">Grow your team and build together</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm animate-fadeIn flex items-center space-x-2">
               <FiX className="flex-shrink-0" />
               <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl text-sm animate-fadeIn flex items-center space-x-2">
               <FiCheckCircle className="flex-shrink-0" />
               <span>{success}</span>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="relative group">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="input-premium w-full pl-12"
                  required
                />
              </div>
            </div>

            <div className="relative group">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Access Level</label>
               <div className="relative">
                <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-premium w-full pl-12 appearance-none cursor-pointer"
                >
                  <option value="editor">Editor — Can draw & edit</option>
                  <option value="viewer">Viewer — Read-only access</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Sending Invite...' : 'Send Invitation'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary w-full py-4"
            >
              Maybe Later
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
