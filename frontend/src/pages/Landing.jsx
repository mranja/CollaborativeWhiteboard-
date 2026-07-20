import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FiZap, 
  FiUsers, 
  FiLayers, 
  FiArrowRight, 
  FiCheck,
  FiEdit3,
  FiMousePointer,
  FiType,
  FiLayout,
  FiGrid,
  FiWind
} from 'react-icons/fi'
import useAuthStore from '../store/useAuthStore'

export default function Landing() {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  // Custom Human-Like Slow Smooth Scroll Engine
  const slowScrollTo = (targetY) => {
    const startY = window.scrollY;
    const distance = targetY - startY;
    const duration = 1200; // 1.2s for that ultra-premium feel
    let start = null;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing: easeInOutQuart
      const easing = percentage < 0.5 
        ? 8 * percentage * percentage * percentage * percentage 
        : 1 - Math.pow(-2 * percentage + 2, 4) / 2;

      window.scrollTo(0, startY + distance * easing);
      if (progress < duration) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  };

  const handleLinkClick = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80; // Nav height
      slowScrollTo(element.offsetTop - offset);
      // Update URL without jump
      window.history.pushState(null, null, `#${targetId}`);
    }
  };

  const user = useAuthStore(s => s.user)

  const handleFlowboardClick = () => {
    // Only scroll to top if on landing page
    if (window.location.pathname === '/') {
      slowScrollTo(0)
    }
  }

  const handleHomeClick = () => {
    if (user) {
      navigate('/dashboard')
    } else {
      slowScrollTo(0);
      navigate('/', { replace: true });
      window.history.pushState(null, null, '/');
    }
  };

  const features = [
    {
      icon: <FiEdit3 className="w-6 h-6" />,
      title: "Natural Drawing",
      description: "A canvas that responds to your creativity with professional pencils, shapes, and tools."
    },
    {
      icon: <FiUsers className="w-6 h-6" />,
      title: "Real-time Presence",
      description: "See your team's cursors moving live. Collaboration feels like you're in the same room."
    },
    {
      icon: <FiType className="w-6 h-6" />,
      title: "Type Anywhere",
      description: "Double-click anywhere to add thoughts, notes, and annotations with clean typography."
    },
    {
      icon: <FiLayout className="w-6 h-6" />,
      title: "Infinite Workspace",
      description: "No boundaries. Stretch your ideas across an endless canvas that grows with your vision."
    }
  ]

  return (
    <div className="min-h-screen bg-white text-slate-900 font-inter selection:bg-indigo-100 selection:text-indigo-600">
      
      {/* Subtle Board Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.4]" 
        style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}
      />

      {/* --- ELITE NAV BAR --- */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 z-[100] px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={handleFlowboardClick}>
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white transition-transform group-hover:rotate-6 shadow-xl shadow-slate-200">
              <FiWind className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 uppercase leading-none">Flow<span className="text-indigo-600">board</span></span>
              <span className="text-[8px] font-black text-slate-400 tracking-[0.2em] uppercase mt-1">Idea Realtime Engine</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-8">
              <div className="flex items-center space-x-6">
                <a href="#features" onClick={(e) => handleLinkClick(e, 'features')} className="text-[10px] font-black tracking-widest text-slate-400 hover:text-slate-900 transition-colors uppercase">Features</a>
                <a href="#about" onClick={(e) => handleLinkClick(e, 'about')} className="text-[10px] font-black tracking-widest text-slate-400 hover:text-slate-900 transition-colors uppercase">About</a>
              </div>
              <div className="h-4 w-px bg-slate-100" />
              <div className="flex items-center space-x-6">
                <button 
                  onClick={() => navigate(user ? '/dashboard' : '/login')}
                  className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
                >
                  {user ? 'Dashboard' : 'Sign In'}
                </button>
                <button 
                  onClick={() => navigate('/register')}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95"
                >
                  Start Flowing
                </button>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden w-12 h-12 flex flex-col items-center justify-center space-y-1.5 bg-slate-50 rounded-xl"
            >
              <div className={`w-6 h-0.5 bg-slate-900 transition-transform ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <div className={`w-6 h-0.5 bg-slate-900 transition-opacity ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
              <div className={`w-6 h-0.5 bg-slate-900 transition-transform ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <div className={`
          fixed inset-0 top-20 bg-white z-[90] md:hidden transition-transform duration-500 ease-in-out
          ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="p-8 space-y-10">
            <div className="flex flex-col space-y-6">
              <a 
                href="#features" 
                onClick={(e) => { handleLinkClick(e, 'features'); setIsMenuOpen(false); }}
                className="text-2xl font-black text-slate-900 uppercase tracking-tighter"
              >
                Features
              </a>
              <a 
                href="#about" 
                onClick={(e) => { handleLinkClick(e, 'about'); setIsMenuOpen(false); }}
                className="text-2xl font-black text-slate-900 uppercase tracking-tighter"
              >
                About
              </a>
            </div>
            
            <div className="pt-10 border-t border-slate-100 space-y-6">
               <button 
                 onClick={() => navigate('/login')}
                 className="w-full text-left text-xl font-bold text-slate-400 uppercase tracking-widest"
               >
                 Sign In
               </button>
               <button 
                 onClick={() => navigate('/register')}
                 className="w-full bg-slate-900 text-white py-6 rounded-2xl text-xl font-bold shadow-2xl shadow-slate-200"
               >
                 Start Flowing
               </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-48 pb-20 px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            
            <div className="lg:w-1/2 space-y-10 animate-fadeInLeft">
              <div className="inline-flex items-center space-x-3 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span>Streaming Ideas Now</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-slate-900 leading-[0.85] tracking-tighter">
                  Where ideas<br />
                  flow in<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">real time.</span>
                </h1>
              </div>
              
              <p className="text-lg md:text-xl text-slate-500 max-w-lg leading-relaxed font-medium">
                The definitive collaborative whiteboard for digital creators. Experience zero-latency sketching and professional team sync with Flowboard.
              </p>
              
              <div className="flex flex-col sm:flex-row items-start gap-6 pt-4">
                <button 
                  onClick={() => navigate(user ? '/dashboard' : '/register')}
                  className="bg-indigo-600 text-white px-10 py-5 rounded-2xl text-lg font-bold shadow-2xl shadow-indigo-100 hover:bg-slate-900 transition-all flex items-center group"
                >
                  <span>{user ? 'Go to Dashboard' : 'Launch Flowboard'}</span>
                  <FiArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="py-2">
                   <div className="flex -space-x-3 mb-2">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200 overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                        </div>
                      ))}
                      <div className="w-10 h-10 rounded-full border-4 border-white bg-indigo-600 text-[10px] text-white flex items-center justify-center font-bold">+1k</div>
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global teams are flowing</p>
                </div>
              </div>
            </div>

            {/* Unique "Animated" Hero Workspace */}
            <div className="lg:w-1/2 relative animate-fadeIn group">
               <div className="relative z-10 bg-white p-3 rounded-[4rem] shadow-2xl shadow-indigo-200/50 border border-slate-100 transition-all duration-700 hover:scale-[1.02] hover:-rotate-1">
                  <div className="bg-[#f8fafc] rounded-[3.5rem] border-2 border-dashed border-slate-200 aspect-square relative overflow-hidden flex items-center justify-center">
                     
                     {/* Infinite Grid Background */}
                     <div className="absolute inset-0 opacity-10 animate-dash" 
                        style={{ 
                          backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', 
                          backgroundSize: '32px 32px',
                          strokeDasharray: '20'
                        }} 
                     />
                     
                     {/* The Drawing Animation */}
                     <svg className="w-full h-full absolute inset-0 pointer-events-none p-12" viewBox="0 0 400 400" fill="none">
                        {/* A complex path that "draws" itself */}
                        <path 
                          d="M100 200 C 120 100, 280 100, 300 200 S 180 300, 100 200 Z" 
                          stroke="#6366f1" 
                          strokeWidth="8" 
                          strokeLinecap="round" 
                          strokeDasharray="1000" 
                          strokeDashoffset="1000"
                          className="animate-draw"
                          style={{ filter: 'drop-shadow(0 10px 15px rgba(99, 102, 241, 0.4))' }}
                        />
                        
                        {/* Secondary shape */}
                        <rect 
                          x="150" y="150" width="100" height="100" rx="20"
                          stroke="#ec4899"
                          strokeWidth="4"
                          strokeDasharray="400"
                          strokeDashoffset="400"
                          className="animate-draw"
                          style={{ animationDelay: '1.5s', opacity: 0.6 }}
                        />

                        {/* Animated Cursors */}
                        <g className="animate-cursor">
                           <path d="M12 1v22l5-5 4 10 3-1-4-10 6-2z" fill="#6366f1" stroke="white" strokeWidth="2" />
                           <rect x="20" y="30" width="80" height="24" rx="8" fill="#6366f1" />
                           <text x="32" y="46" fill="white" fontSize="10" fontWeight="bold">Alex.flow</text>
                        </g>

                        <g className="animate-cursor" style={{ animationDelay: '-4s', animationDuration: '10s' }}>
                           <path d="M12 1v22l5-5 4 10 3-1-4-10 6-2z" fill="#ec4899" stroke="white" strokeWidth="2" />
                           <rect x="20" y="30" width="90" height="24" rx="8" fill="#ec4899" />
                           <text x="32" y="46" fill="white" fontSize="10" fontWeight="bold">Sarah_Sync</text>
                        </g>
                     </svg>
                     
                     {/* Floating Badge moved lower */}
                     <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 pointer-events-none animate-bounce-subtle">
                        <div className="bg-white/90 backdrop-blur-md px-8 py-4 rounded-[2rem] shadow-2xl shadow-indigo-200/40 border border-white flex items-center space-x-3 text-slate-800 font-bold">
                           <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                              <FiWind className="text-indigo-600 animate-spin-slow" />
                           </div>
                           <span className="text-sm tracking-tight whitespace-nowrap">Active Real-time Session</span>
                        </div>
                     </div>
                  </div>
               </div>
               
               {/* Background elements */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-indigo-50 rounded-full blur-[100px] -z-10 opacity-60" />
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-32 px-8 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
             <h3 className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em]">Engineered for Teams</h3>
             <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Everything you need,<br />none of the <span className="text-indigo-400 underline decoration-indigo-500/30 underline-offset-8">noise.</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div 
                key={i} 
                className="p-10 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h4 className="text-xl font-bold text-white mb-4">{f.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section id="about" className="py-32 px-8 bg-white border-y border-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8 animate-fadeIn">
              <h3 className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em]">Our Philosophy</h3>
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none">
                Creativity is a <span className="text-indigo-600 italic">stream</span>, not a snapshot.
              </h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                Flowboard was born from a simple observation: the best ideas don't happen in isolation. They emerge when thoughts are allowed to flow freely, in real-time, across distances.
              </p>
              <div className="space-y-4">
                {[
                  { title: "Pure Focus", text: "Minimal interface designed to disappear so your ideas can take center stage." },
                  { title: "Zero Latency", text: "Synchronized sub-millisecond updates because a stream should never stutter." },
                  { title: "Elite Precision", text: "Tools built for professional digital artisans and enterprise-grade teams." },
                  { title: "Seamless Sync", text: "Real-time mirroring across all collaborator devices with zero conflict resolution." },
                  { title: "Infinite Canvas", text: "Boundless space for expansive brainstorming sessions that grow with your vision." },
                  { title: "Export Ready", text: "Instantly convert your streaming boards into high-fidelity PNG or PDF assets." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <FiCheck className="text-indigo-600 w-3 h-3" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-none mb-1">{item.title}</h4>
                      <p className="text-[12px] text-slate-400 font-medium">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative group animate-scaleIn">
               <div className="relative z-10 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-indigo-100 border-8 border-white">
                  <img 
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000" 
                    alt="Team Collaboration" 
                    className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-indigo-600/10 mix-blend-multiply" />
                  
                  {/* Floating Overlay Badge */}
                  <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                        <FiWind className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Live Engine</p>
                        <p className="text-sm font-bold text-slate-900">Flowboard Sync Active</p>
                      </div>
                    </div>
                  </div>
               </div>
               
               {/* Decorative Background Element */}
               <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] -z-10" />
               <div className="absolute -top-10 -left-10 w-48 h-48 bg-slate-100 rounded-full blur-[80px] -z-10 text-slate-300 flex items-center justify-center">
                  <FiGrid className="w-20 h-20 opacity-20" />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-40 px-8 text-center relative overflow-hidden">
         <div className="max-w-3xl mx-auto space-y-10 relative z-10">
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">Stream your next <span className="italic text-indigo-600 underline underline-offset-8 decoration-indigo-200">breakthrough.</span></h2>
            <div className="pt-4">
               <button 
                  onClick={() => navigate('/register')}
                  className="bg-slate-900 text-white px-12 py-6 rounded-2xl text-xl font-bold hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-300"
               >
                  Join the Flow
               </button>
            </div>
         </div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-50 rounded-full blur-[100px] -z-10 opacity-40" />
      </section>

      <footer className="py-12 border-t border-slate-100 text-center">
         <div className="flex items-center justify-center space-x-2 mb-4">
            <FiWind className="text-slate-300 w-4 h-4" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Flowboard Idea Engine</span>
         </div>
         <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em]">&copy; 2026 Flowboard | Precision Performance</p>
      </footer>
    </div>
  )
}
