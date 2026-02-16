import React from 'react'
import { HexColorPicker } from 'react-colorful'
import { useBoardStore } from '../../stores/boardStore'
import { useUIStore } from '../../stores/uiStore'

export default function ToolControls() {
  const { color, setColor, brushSize, setBrushSize } = useBoardStore((s) => ({ color: s.color, setColor: s.setColor, brushSize: s.brushSize, setBrushSize: s.setBrushSize }))
  const { snapToGrid, setSnapToGrid } = useUIStore((s) => ({ snapToGrid: s.snapToGrid, setSnapToGrid: s.setSnapToGrid }))

  function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const fabric = useBoardStore.getState().fabric
    if (!fabric) return
    fabric.Image.fromURL(url, (img) => {
      img.left = fabric.width / 2 - img.width / 4
      img.top = fabric.height / 2 - img.height / 4
      img.scaleToWidth(300)
      img.id = `obj_${Date.now()}_${Math.round(Math.random()*10000)}`
      fabric.add(img)
      fabric.requestRenderAll()
    })
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="w-40 bg-white/4 rounded p-2">
        <div className="text-xs text-white mb-2">Brush</div>
        <input type="range" min="1" max="60" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
      </div>

      <div className="w-40 bg-white/4 rounded p-2">
        <div className="text-xs text-white mb-2">Color</div>
        <HexColorPicker color={color} onChange={setColor} />
      </div>

      <div className="w-40 bg-white/4 rounded p-2">
        <div className="text-xs text-white mb-2">Image</div>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
      </div>

      <div className="w-40 bg-white/4 rounded p-2 flex items-center justify-between">
        <div className="text-xs text-white">Snap to Grid</div>
        <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} />
      </div>
    </div>
  )
}
