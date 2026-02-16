import React from 'react'
import { motion } from 'framer-motion'
import { useBoardStore } from '../../stores/boardStore'

export default function Inspector() {
  const fabric = useBoardStore((s) => s.fabric)
  const [selected, setSelected] = React.useState(null)

  React.useEffect(() => {
    if (!fabric) return
    const handleSelection = () => {
      const obj = fabric.getActiveObject()
      setSelected(obj)
    }
    fabric.on('selection:created', handleSelection)
    fabric.on('selection:updated', handleSelection)
    fabric.on('selection:cleared', () => setSelected(null))
    return () => {
      fabric.off('selection:created', handleSelection)
      fabric.off('selection:updated', handleSelection)
      fabric.off('selection:cleared')
    }
  }, [fabric])

  if (!selected) {
    return (
      <aside className="fixed right-4 top-20 w-80 bg-[rgba(255,255,255,0.03)] backdrop-blur-xs rounded-2xl p-4 tool-shadow border border-white/5 text-white/50 text-center">
        <div className="text-sm">Select an object to inspect</div>
      </aside>
    )
  }

  const updateProp = (key, value) => {
    selected.set({ [key]: value })
    if (selected.setCoords) selected.setCoords()
    fabric.requestRenderAll()
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed right-4 top-20 w-80 bg-[rgba(255,255,255,0.03)] backdrop-blur-xs rounded-2xl p-4 tool-shadow border border-white/5"
    >
      <h3 className="text-white font-semibold mb-4">Properties</h3>
      <div className="space-y-3 text-sm">
        <div>
          <label className="text-white/70">Opacity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={selected.opacity || 1}
            onChange={(e) => updateProp('opacity', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="text-white/50">{Math.round((selected.opacity || 1) * 100)}%</div>
        </div>
        <div>
          <label className="text-white/70">Rotation</label>
          <input
            type="number"
            value={Math.round(selected.angle || 0)}
            onChange={(e) => updateProp('angle', parseFloat(e.target.value))}
            className="w-full bg-white/10 text-white rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/30"
          />
          <div className="text-white/50">degrees</div>
        </div>
        <div>
          <label className="text-white/70">Fill Color</label>
          <input
            type="color"
            value={selected.fill || '#000000'}
            onChange={(e) => updateProp('fill', e.target.value)}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>
        <div>
          <label className="text-white/70">Stroke Width</label>
          <input
            type="number"
            min="0"
            max="20"
            value={selected.strokeWidth || 0}
            onChange={(e) => updateProp('strokeWidth', parseFloat(e.target.value))}
            className="w-full bg-white/10 text-white rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-white/30"
          />
        </div>
      </div>
    </motion.aside>
  )
}
