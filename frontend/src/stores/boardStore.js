import create from 'zustand'

export const useBoardStore = create((set, get) => ({
  fabric: null,
  tool: 'select',
  color: '#111827',
  brushSize: 4,
  zoom: 1,
  clipboard: null,
  setFabricInstance: (fabricInstance) => set({ fabric: fabricInstance }),
  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setBrushSize: (size) => set({ brushSize: size }),
  setZoom: (zoom) => set({ zoom }),
  copySelection: () => {
    const fabric = get().fabric
    if (!fabric) return
    const active = fabric.getActiveObject()
    if (!active) return
    const json = active.toJSON(['id'])
    set({ clipboard: json })
  },
  pasteClipboard: () => {
    const fabric = get().fabric
    const clip = get().clipboard
    if (!fabric || !clip) return
    fabric.loadFromJSON({ objects: [clip] }, () => {
      const objs = fabric.getObjects()
      const o = objs[objs.length - 1]
      if (o) {
        o.left = (fabric.width || 800) / 2
        o.top = (fabric.height || 600) / 2
        o.id = `obj_${Date.now()}_${Math.round(Math.random()*10000)}`
        fabric.add(o)
        fabric.setActiveObject(o)
        fabric.requestRenderAll()
      }
    })
  },
  bringForward: () => {
    const f = get().fabric
    if (!f) return
    const o = f.getActiveObject()
    if (o) o.bringForward()
    f.requestRenderAll()
  },
  sendBackward: () => {
    const f = get().fabric
    if (!f) return
    const o = f.getActiveObject()
    if (o) o.sendBackwards()
    f.requestRenderAll()
  },
  deleteSelection: () => {
    const f = get().fabric
    if (!f) return
    const active = f.getActiveObjects()
    if (!active || active.length === 0) return
    active.forEach((o) => f.remove(o))
    f.discardActiveObject()
    f.requestRenderAll()
  }
}))
