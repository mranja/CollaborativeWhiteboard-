import React, { useState } from 'react'
import useBoardStore from '../store/useBoardStore'
import { 
  FiMousePointer, 
  FiSquare, 
  FiCircle, 
  FiMinus, 
  FiEdit2, 
  FiType, 
  FiArrowUpRight,
  FiMove,
  FiTriangle,
  FiStar,
  FiDroplet,
  FiMaximize2,
  FiUpload
} from 'react-icons/fi'
import { LuEraser } from 'react-icons/lu'

export default function Toolbar({ userRole = 'editor', theme = 'dark' }){
  const currentTool = useBoardStore(s => s.currentTool)
  const setCurrentTool = useBoardStore(s => s.setCurrentTool)
  const strokeColor = useBoardStore(s => s.strokeColor)
  const setStrokeColor = useBoardStore(s => s.setStrokeColor)
  const strokeWidth = useBoardStore(s => s.strokeWidth)
  const setStrokeWidth = useBoardStore(s => s.setStrokeWidth)
  const isViewer = userRole === 'viewer'

  const [showRgbPicker, setShowRgbPicker] = useState(false)

  const tools = [
    { section: 'Select', items: [
      { id: 'select', icon: <FiMousePointer />, label: 'Pointer' },
      { id: 'pan', icon: <FiMove />, label: 'Hand/Pan' },
    ]},
    { section: 'Drawing', items: [
      { id: 'pencil', icon: <FiEdit2 />, label: 'Pencil' },
      { id: 'text', icon: <FiType />, label: 'Text Tool' },
      { id: 'eraser', icon: <LuEraser />, label: 'Eraser' },
    ]},
    { section: 'Shapes', items: [
      { id: 'rect', icon: <FiSquare />, label: 'Rectangle' },
      { id: 'circle', icon: <FiCircle />, label: 'Circle' },
      { id: 'triangle', icon: <FiTriangle />, label: 'Triangle' },
      { id: 'star', icon: <FiStar />, label: 'Star' },
      { id: 'arrow', icon: <FiArrowUpRight />, label: 'Arrow' },
      { id: 'line', icon: <FiMinus />, label: 'Line' },
    ]},
    { section: 'Assets', items: [
      { id: 'import', icon: <FiUpload />, label: 'Import PDF/Image' },
    ]}
  ]

  const classicColors = [
    '#1e293b', // Slate 800 (Black)
    '#ffffff', // White
    '#e11d48', // Rose 600
    '#2563eb', // Blue 600
    '#16a34a', // Green 600
    '#d97706', // Amber 600
    '#7c3aed', // Violet 600
    '#0891b2', // Cyan 600
  ]

  const widths = [2, 4, 8, 12, 16]

  return (
    <div className="flex flex-col space-y-6 md:space-y-10 w-full animate-fadeInLeft">
      
      {/* --- TOOLS SECTION --- */}
      <div className="space-y-4 md:space-y-6">
        {tools.map((section) => (
          <div key={section.section} className="space-y-2 md:space-y-3">
            <h3 className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 px-1">{section.section}</h3>
            <div className="grid grid-cols-4 md:grid-cols-4 gap-1.5 md:gap-2">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => !isViewer && setCurrentTool(item.id)}
                  title={item.label}
                  disabled={isViewer}
                  className={`
                    h-8 md:h-10 w-full rounded-lg flex items-center justify-center transition-all duration-200
                    ${currentTool === item.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                      : theme === 'dark' ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}
                    ${isViewer ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer active:scale-90'}
                  `}
                >
                  <span className="text-base md:text-lg">{item.icon}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- COLOR & PALETTE SECTION --- */}
      {!isViewer && (
        <div className="space-y-4 md:space-y-6 pt-4 md:pt-6 border-t border-white/5">
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between px-1">
               <h3 className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">Palette</h3>
               <FiDroplet className="text-gray-500 text-xs" />
            </div>
            
            <div className="grid grid-cols-4 md:grid-cols-4 gap-2 md:gap-3">
              {classicColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setStrokeColor(color)}
                  className={`
                    aspect-square rounded-full border transition-all duration-300 relative group
                    ${strokeColor === color ? 'border-indigo-400 scale-110' : 'border-transparent'}
                  `}
                  style={{ backgroundColor: color }}
                >
                  {strokeColor === color && (
                    <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-30" />
                  )}
                </button>
              ))}
              
              {/* Custom Color Toggle */}
              <button 
                onClick={() => setShowRgbPicker(!showRgbPicker)}
                className={`
                  aspect-square rounded-full flex items-center justify-center border border-dashed
                  ${showRgbPicker ? 'border-indigo-400 bg-indigo-400/10' : 'border-white/10 hover:border-white/30'}
                `}
                title="Custom Color"
              >
                <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-white/20" />
              </button>
            </div>

            {/* Inline RGB Picker */}
            {showRgbPicker && (
              <div className={`mt-2 md:mt-4 p-3 md:p-4 rounded-xl md:rounded-2xl border space-y-2 md:space-y-3 animate-scaleIn ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                <input 
                  type="color" 
                  value={strokeColor} 
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-full h-8 md:h-10 bg-transparent cursor-pointer rounded-lg overflow-hidden border-none"
                />
                <div className="flex items-center justify-between text-[8px] md:text-[10px] font-mono text-gray-400 uppercase">
                  <span>Hex:</span>
                  <span className="text-indigo-400 font-bold">{strokeColor}</span>
                </div>
              </div>
            )}
          </div>

          {/* Stroke Width Slider-style */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between px-1">
               <h3 className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">Thickness</h3>
               <FiMaximize2 className="text-gray-500 text-xs" />
            </div>
            
            <div className={`flex items-center justify-between p-1.5 md:p-2 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
              {widths.map((w) => (
                <button
                  key={w}
                  onClick={() => setStrokeWidth(w)}
                  className="group flex flex-col items-center p-1 md:p-2 rounded-lg transition-all hover:bg-white/5"
                >
                  <div 
                    className={`rounded-full transition-all ${strokeWidth === w ? 'bg-indigo-400 shadow-glow' : 'bg-gray-700'}`}
                    style={{ width: `${4 + w/2.5}px`, height: `${4 + w/2.5}px` }}
                  />
                  <span className={`text-[7px] md:text-[8px] mt-1.5 md:mt-2 font-black ${strokeWidth === w ? 'text-white' : 'text-gray-600'}`}>{w}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1" />
      
      <div className="text-center pb-4">
        <p className="text-[9px] text-gray-600 font-bold tracking-widest uppercase">Flow Engine v2.0</p>
      </div>
    </div>
  )
}
