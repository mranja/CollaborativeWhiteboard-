import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { boardAPI } from '../api/client'
import { FiCheckCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi'
import Loader from '../components/Loader'

export default function AcceptInvite() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')
  const [boardId, setBoardId] = useState(null)

  useEffect(() => {
    let isMounted = true
    let redirectTimer = null

    const accept = async () => {
      try {
        const res = await boardAPI.acceptInvite(token)
        if (!isMounted) return
        setStatus('success')
        setMessage(res.data.message)
        setBoardId(res.data.boardId)

        // Redirect after 3 seconds
        redirectTimer = setTimeout(() => {
          navigate(`/board/${res.data.boardId}`)
        }, 3000)
      } catch (err) {
        if (!isMounted) return
        setStatus('error')
        setMessage(err.response?.data?.message || 'Failed to accept invitation')
      }
    }
    accept()

    // Without this, leaving the page before the timer fires still navigated
    // and set state on an unmounted component.
    return () => {
      isMounted = false
      if (redirectTimer) clearTimeout(redirectTimer)
    }
  }, [token, navigate])

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-inter">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 text-center animate-scaleIn">
        {status === 'loading' && (
          <div className="space-y-6">
            <Loader
              size="md"
              theme="light"
              label="Validating Invitation..."
              sub="Please wait while we sync your permissions."
            />
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-green-100">
              <FiCheckCircle className="text-3xl" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Granted!</h2>
            <p className="text-slate-400">{message}</p>
            <button 
              onClick={() => navigate(`/board/${boardId}`)}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-indigo-600 transition-all"
            >
              <span>Go to Board</span>
              <FiArrowRight />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-rose-100">
              <FiAlertCircle className="text-3xl" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Invitation Error</h2>
            <p className="text-slate-400">{message}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-indigo-600 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
