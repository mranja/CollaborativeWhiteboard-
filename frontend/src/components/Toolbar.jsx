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
  FiUpload,
  FiCheck,
  FiLock
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

  // Small caption above each group, with a hairline that fades out to the right.
  const SectionLabel = ({ children, icon }) => (
    <div className="flex items-center gap-2 px-1 mb-2.5">
      <span className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-500">{children}</span>
      <span className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
      {icon && <span className="text-slate-600 text-xs">{icon}</span>}
    </div>
  )

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeInLeft">

      {/* --- TOOLS --- */}
      <div className="flex flex-col gap-5">
        {tools.map((section) => (
          <div key={section.section}>
            <SectionLabel>{section.section}</SectionLabel>

            <div className="grid grid-cols-4 gap-2 p-2 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              {section.items.map((item) => {
                const isActive = currentTool === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => !isViewer && setCurrentTool(item.id)}
                    title={item.label}
                    disabled={isViewer}
                    className={`
                      relative aspect-square rounded-xl flex items-center justify-center
                      transition-all duration-200 border
                      ${isActive
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-white/20 shadow-lg shadow-indigo-900/50'
                        : theme === 'dark'
                          ? 'bg-white/[0.04] text-slate-400 border-transparent hover:bg-white/10 hover:text-white'
                          : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-900'}
                      ${isViewer ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer active:scale-90'}
                    `}
                  >
                    <span className="text-base">{item.icon}</span>
                    {isActive && (
                      <span className="absolute -bottom-px left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-white/70" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {isViewer ? (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-400/25">
          <FiLock className="text-amber-300 mt-0.5 flex-none" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-amber-200 leading-tight">Read-only access</span>
            <span className="text-[10px] text-amber-300/60 font-medium mt-1 leading-snug">
              Ask the board owner for editor rights to draw here.
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* --- PALETTE --- */}
          <div>
            <SectionLabel icon={<FiDroplet />}>Palette</SectionLabel>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              {/* Current colour readout */}
              <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-white/5">
                <span
                  className="w-7 h-7 rounded-lg border border-white/20 shadow-inner flex-none"
                  style={{ backgroundColor: strokeColor }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-500 leading-none">Active</span>
                  <span className="text-[11px] font-mono font-bold text-slate-300 uppercase mt-1 leading-none truncate">
                    {strokeColor}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {classicColors.map((color) => {
                  const isActive = strokeColor === color
                  return (
                    <button
                      key={color}
                      onClick={() => setStrokeColor(color)}
                      title={color}
                      className={`
                        aspect-square rounded-full relative transition-transform duration-200
                        ring-offset-2 ring-offset-[#0f172a] flex items-center justify-center
                        ${isActive ? 'ring-2 ring-indigo-400 scale-110' : 'ring-1 ring-white/15 hover:scale-110'}
                      `}
                      style={{ backgroundColor: color }}
                    >
                      {isActive && (
                        <FiCheck
                          className="text-[11px] drop-shadow"
                          style={{ color: color === '#ffffff' ? '#0f172a' : '#ffffff' }}
                        />
                      )}
                    </button>
                  )
                })}

                {/* Custom Color Toggle */}
                <button
                  onClick={() => setShowRgbPicker(!showRgbPicker)}
                  className={`
                    aspect-square rounded-full flex items-center justify-center border border-dashed transition-colors
                    ${showRgbPicker
                      ? 'border-indigo-400 bg-indigo-400/15 text-indigo-300'
                      : 'border-white/20 text-slate-500 hover:border-white/40 hover:text-slate-300'}
                  `}
                  title="Custom Color"
                >
                  <FiDroplet className="text-[11px]" />
                </button>
              </div>

              {/* Inline RGB Picker */}
              {showRgbPicker && (
                <div className="mt-3 pt-3 border-t border-white/5 animate-scaleIn">
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-full h-9 bg-transparent cursor-pointer rounded-lg overflow-hidden border-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* --- THICKNESS --- */}
          <div>
            <SectionLabel icon={<FiMaximize2 />}>Thickness</SectionLabel>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              {/* Live preview of the current stroke */}
              <div className="h-8 mb-3 rounded-xl bg-black/25 flex items-center justify-center px-3">
                <span
                  className="w-full rounded-full transition-all duration-200"
                  style={{ height: `${strokeWidth}px`, backgroundColor: strokeColor }}
                />
              </div>

              <div className="flex items-center justify-between gap-1">
                {widths.map((w) => {
                  const isActive = strokeWidth === w
                  return (
                    <button
                      key={w}
                      onClick={() => setStrokeWidth(w)}
                      title={`${w}px`}
                      className={`
                        flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl transition-colors border
                        ${isActive
                          ? 'bg-indigo-500/20 border-indigo-400/40'
                          : 'bg-transparent border-transparent hover:bg-white/5'}
                      `}
                    >
                      <span
                        className={`rounded-full transition-colors ${isActive ? 'bg-indigo-300' : 'bg-slate-600'}`}
                        style={{ width: `${4 + w / 2.5}px`, height: `${4 + w / 2.5}px` }}
                      />
                      <span className={`text-[8px] font-black ${isActive ? 'text-indigo-200' : 'text-slate-600'}`}>
                        {w}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex-1" />

      <div className="text-center pt-2 pb-1">
        <p className="font-display text-[9px] text-slate-600 tracking-[0.18em] uppercase">Flow Engine v2.0</p>
      </div>
    </div>
  )
}
