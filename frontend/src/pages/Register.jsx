import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../api/client'
import useAuthStore from '../store/useAuthStore'
import useBoardStore from '../store/useBoardStore'
import { FiMail, FiLock, FiUser, FiArrowRight, FiWind, FiChevronLeft } from 'react-icons/fi'
import Loader from '../components/Loader'

export default function Register() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)
  const setToken = useAuthStore(s => s.setToken)
  const setCurrentUser = useBoardStore(s => s.setCurrentUser)
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const res = await authAPI.register(name, email, password)
      const { user, token } = res.data
      setToken(token)
      setUser(user)
      setCurrentUser(user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Background Dots */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.3]" 
        style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}
      />
      
      {/* Back Home Button */}
      <button 
        onClick={() => navigate(user ? '/dashboard' : '/')}
        className="fixed top-8 left-8 flex items-center space-x-2 text-slate-400 hover:text-slate-900 transition-all font-bold group z-50 px-4 py-2 rounded-xl hover:bg-white hover:shadow-lg hover:shadow-slate-100 border border-transparent hover:border-slate-100"
      >
        <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] uppercase tracking-widest">{user ? 'Dashboard' : 'Back Home'}</span>
      </button>

      <div className="relative z-10 w-full max-w-md animate-scaleIn">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
          
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div 
              onClick={() => navigate(user ? '/dashboard' : '/')} 
              className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-6 shadow-xl cursor-pointer hover:rotate-12 transition-transform"
            >
              <FiWind className="w-8 h-8" />
            </div>
            <h1 onClick={() => navigate(user ? '/dashboard' : '/')} className="font-display text-3xl text-slate-900 tracking-tight text-center cursor-pointer hover:opacity-80 transition-opacity">Join <span className="text-indigo-600">Flow</span></h1>
            <p className="text-slate-400 font-medium text-sm mt-2">Start your creative real-time journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-fadeIn">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
              <div className="relative group">
                <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-14 pl-14 pr-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-400 focus:bg-white transition-all font-medium text-slate-900 placeholder:text-slate-300"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Address</label>
              <div className="relative group">
                <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-14 pr-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-400 focus:bg-white transition-all font-medium text-slate-900 placeholder:text-slate-300"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Password</label>
              <div className="relative group">
                <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-14 pr-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-400 focus:bg-white transition-all font-medium text-slate-900 placeholder:text-slate-300"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-[9px] text-slate-400 font-bold ml-2">Min. 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center space-x-3 shadow-xl shadow-slate-100 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 group"
            >
              {loading && <Loader inline size="xs" />}
              <span>{loading ? 'Creating Account...' : 'Get Started'}</span>
              {!loading && <FiArrowRight className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-400 text-sm font-medium">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-indigo-600 font-bold hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 text-[10px] text-slate-300 font-bold uppercase tracking-widest">
         Flowing with 1,000+ Teams
      </div>
    </div>
  )
}
