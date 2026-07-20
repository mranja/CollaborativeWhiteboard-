import React, { useEffect, useRef } from 'react'
import { fabric } from 'fabric'
import shallow from 'zustand/shallow'
import { useBoardStore } from '../stores/boardStore'
import { useUIStore } from '../stores/uiStore'
import { useDebouncedEmit } from '../hooks/useDebouncedEmit'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useUndoStore } from '../stores/undoStore'
import { serializeObject } from '../utils/serializeFabricObject'
import { connectSocket, getSocket } from '../lib/socketClient'

export default function FabricCanvas() {
  const canvasRef = useRef(null)
  const fabricRef = useRef(null)

  const { tool, color, brushSize, setFabricInstance } = useBoardStore(
    (s) => ({ tool: s.tool, color: s.color, brushSize: s.brushSize, setFabricInstance: s.setFabricInstance }),
    shallow
  )

  const { snapToGrid } = useUIStore((s) => ({ snapToGrid: s.snapToGrid }))

  const emit = useDebouncedEmit()
  useKeyboardShortcuts(fabricRef)

  useEffect(() => {
    const canvasEl = canvasRef.current
    const canvas = new fabric.Canvas(canvasEl, {
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
      selection: true,
      hoverCursor: 'default',
      renderOnAddRemove: true
    })

    fabricRef.current = canvas
    setFabricInstance(canvas)

    // connect socket if token present and wire handlers
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const socket = connectSocket(token)

        // named handlers so we can remove them on cleanup
        const handleDraw = (message) => {
          const clientId = localStorage.getItem('cw_client_id')
          const meta = (message && (message.meta || message)) || {}
          const payload = (message && (message.payload || message.element || message)) || null
          if (meta && meta.clientId && clientId && meta.clientId === clientId) return
          if (!payload) return
          const objPayload = payload.element || payload
          if (canvas.getObjects().some(o => o.id === objPayload.id)) return
          try {
            fabric.util.enlivenObjects([objPayload], (enlivened) => {
              if (enlivened && enlivened.length) {
                const obj = enlivened[0]
                if (!obj.id) obj.id = objPayload.id
                canvas.add(obj)
                canvas.requestRenderAll()
              }
            })
          } catch (e) {
            // fallback handled elsewhere if needed
          }
        }

        const handleModify = (message) => {
          const clientId = localStorage.getItem('cw_client_id')
          const meta = (message && (message.meta || message)) || {}
          const payload = (message && (message.payload || message.element || message)) || null
          if (meta && meta.clientId && clientId && meta.clientId === clientId) return
          if (!payload) return
          const objPayload = payload.element || payload
          const obj = canvas.getObjects().find(o => o.id === objPayload.id)
          if (!obj) return
          obj.set({ left: objPayload.left, top: objPayload.top, scaleX: objPayload.scaleX, scaleY: objPayload.scaleY, angle: objPayload.angle, fill: objPayload.fill, stroke: objPayload.stroke, strokeWidth: objPayload.strokeWidth })
          obj.setCoords()
          canvas.requestRenderAll()
        }

        const handleDelete = (message) => {
          const clientId = localStorage.getItem('cw_client_id')
          const meta = (message && (message.meta || message)) || {}
          const payload = (message && (message.payload || message.element || message)) || null
          if (meta && meta.clientId && clientId && meta.clientId === clientId) return
          if (!payload) return
          const objPayload = payload.element || payload
          const obj = canvas.getObjects().find(o => o.id === objPayload.id)
          if (!obj) return
          canvas.remove(obj)
          canvas.requestRenderAll()
        }

        socket.on('draw-element', handleDraw)
        socket.on('update-element', handleModify)
        socket.on('delete-element', handleDelete)
      }
    } catch (e) {
      // noop
    }
    // basic pointer events for drawing
    canvas.isDrawingMode = tool === 'pen'
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = brushSize
      canvas.freeDrawingBrush.color = color
      canvas.freeDrawingBrush.decimate = 0.4
      canvas.freeDrawingBrush.optimize = true
    }

    // enable dpi smoothing
    canvas.renderOnAddRemove = true

    const resizeHandler = () => {
      const parent = canvasEl.parentElement
      if (!parent) return
      canvas.setWidth(parent.clientWidth)
      canvas.setHeight(parent.clientHeight)
      canvas.renderAll()
    }

    resizeHandler()
    window.addEventListener('resize', resizeHandler)

    // enable pan and zoom
    let isPanning = false
    let lastPos = null

    canvas.on('mouse:down', (opt) => {
      if (tool === 'pan') {
        isPanning = true
        const evt = opt.e
        lastPos = { x: evt.clientX, y: evt.clientY }
        canvas.setCursor('grabbing')
      }
    })

    canvas.on('mouse:move', (opt) => {
      if (isPanning && lastPos) {
        const e = opt.e
        const vpt = canvas.viewportTransform
        vpt[4] += e.clientX - lastPos.x
        vpt[5] += e.clientY - lastPos.y
        canvas.setViewportTransform(vpt)
        lastPos = { x: e.clientX, y: e.clientY }
      }
    })

    canvas.on('mouse:up', () => {
      if (isPanning) {
        isPanning = false
        canvas.setCursor('default')
      }
    })

    // wheel zoom
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY
      let zoomVal = canvas.getZoom()
      zoomVal *= 0.999 ** delta
      zoomVal = Math.max(0.2, Math.min(3, zoomVal))
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoomVal)
      opt.e.preventDefault()
      opt.e.stopPropagation()
    })

    // snap-to-grid
    const GRID = 12
    canvas.on('object:moving', (e) => {
      if (!snapToGrid) return
      const obj = e.target
      obj.set({ left: Math.round(obj.left / GRID) * GRID, top: Math.round(obj.top / GRID) * GRID })
    })

    canvas.on('object:scaling', (e) => {
      if (!snapToGrid) return
      const obj = e.target
      obj.set({ scaleX: Math.round(obj.scaleX * 100) / 100, scaleY: Math.round(obj.scaleY * 100) / 100 })
    })

    // fabric object events -> emit operations
    const push = useUndoStore.getState().push

    function assignId(obj) {
      if (!obj.id) obj.id = `obj_${Date.now()}_${Math.round(Math.random()*10000)}`
    }

    // helper to capture a snapshot for inverse operations
    function snapshot(obj) {
      try {
        // use full fabric toObject to capture styles and properties for faithful recreation
        return obj.toObject(['id'])
      } catch (e) {
        return { id: obj.id }
      }
    }

    // capture backups when selection or object is about to change
    canvas.on('selection:created', (e) => {
      const objs = canvas.getActiveObjects()
      objs.forEach(o => { o.__backup = snapshot(o) })
    })
        socket.on('op:create', (message) => {
          const { payload, meta } = message || {}
          // ignore own messages
          const clientId = localStorage.getItem('cw_client_id')
          if (meta && meta.clientId && clientId && meta.clientId === clientId) return
          // avoid creating twice if object exists
          if (canvas.getObjects().some(o => o.id === payload.id)) return
          // attempt to enliven full object
          try {
            fabric.util.enlivenObjects([payload], (enlivened) => {
              if (enlivened && enlivened.length) {
                const obj = enlivened[0]
                if (!obj.id) obj.id = payload.id
                canvas.add(obj)
                canvas.requestRenderAll()
              }
            })
          } catch (e) {
            // fallback: basic types
            if (payload.type === 'path' && payload.path) {
              const p = new fabric.Path(payload.path, {
                left: payload.left,
                top: payload.top,
                stroke: payload.stroke || payload.fill,
                strokeWidth: payload.strokeWidth || 2,
                fill: payload.fill || null
              })
              p.id = payload.id
              canvas.add(p)
              canvas.requestRenderAll()
            } else if (payload.type === 'rect') {
              const r = new fabric.Rect({ left: payload.left, top: payload.top, width: payload.width || 100, height: payload.height || 60, fill: payload.fill || 'transparent', stroke: payload.stroke })
              r.id = payload.id
              canvas.add(r)
              canvas.requestRenderAll()
            } else if ((payload.type === 'ellipse' || payload.type === 'circle') ) {
              const e = new fabric.Ellipse({ left: payload.left, top: payload.top, rx: payload.rx || 40, ry: payload.ry || 30, fill: payload.fill || 'transparent', stroke: payload.stroke })
              e.id = payload.id
              canvas.add(e)
              canvas.requestRenderAll()
            } else if (payload.type === 'line') {
              const l = new fabric.Line([payload.x1 || 0, payload.y1 || 0, payload.x2 || 100, payload.y2 || 0], { left: payload.left || 0, top: payload.top || 0, stroke: payload.stroke || '#000', strokeWidth: payload.strokeWidth || 2 })
              l.id = payload.id
              canvas.add(l)
              canvas.requestRenderAll()
            } else if (payload.type === 'text') {
              const t = new fabric.Textbox(payload.text || '', { left: payload.left || 100, top: payload.top || 100, fontSize: payload.fontSize || 20, fontFamily: payload.fontFamily || 'sans-serif', fill: payload.fill || '#000' })
              t.id = payload.id
              canvas.add(t)
              canvas.requestRenderAll()
            } else if (payload.type === 'group' && Array.isArray(payload.objects)) {
              const created = []
              payload.objects.forEach((child) => {
                if (child.type === 'rect') created.push(new fabric.Rect({ left: child.left, top: child.top, width: child.width, height: child.height, fill: child.fill }))
                else if (child.type === 'ellipse') created.push(new fabric.Ellipse({ left: child.left, top: child.top, rx: child.rx, ry: child.ry, fill: child.fill }))
                else if (child.type === 'text') created.push(new fabric.Textbox(child.text || '', { left: child.left, top: child.top, fontSize: child.fontSize || 20, fill: child.fill }))
                else if (child.type === 'path' && child.path) created.push(new fabric.Path(child.path, { left: child.left, top: child.top, stroke: child.stroke }))
              })
              const g = new fabric.Group(created, { left: payload.left, top: payload.top })
              g.id = payload.id
              canvas.add(g)
              canvas.requestRenderAll()
            } else if (payload.type === 'image' && payload.src) {
              fabric.Image.fromURL(payload.src, (img) => {
                img.left = payload.left
                img.top = payload.top
                img.id = payload.id
                canvas.add(img)
                canvas.requestRenderAll()
              })
            }
          }
        })

    canvas.on('app:redo', ({ op }) => {
      if (!op) return
      // redo is applying the original op
      const original = op
      if (original.type === 'create') {
        const p = original.payload
        if (p.type === 'path' && p.path) {
          const np = new fabric.Path(p.path, { left: p.left, top: p.top, stroke: p.stroke, strokeWidth: p.strokeWidth, fill: p.fill })
          np.id = p.id
          canvas.add(np)
          emit('draw-element', p)
        }
      }
      if (original.type === 'modify') {
        const payload = original.payload
        const obj = canvas.getObjects().find(o => o.id === payload.id)
        if (obj) {
          obj.set({ left: payload.left, top: payload.top, scaleX: payload.scaleX, scaleY: payload.scaleY, angle: payload.angle, fill: payload.fill, stroke: payload.stroke, strokeWidth: payload.strokeWidth })
          obj.setCoords()
          canvas.requestRenderAll()
          emit('update-element', payload)
        }
      }
      if (original.type === 'delete') {
        const id = original.payload.id
        const obj = canvas.getObjects().find(o => o.id === id)
        if (obj) canvas.remove(obj)
        emit('delete-element', { id })
      }
    })

    // cleanup
    return () => {
      try {
        // remove socket listeners if present
        const token = localStorage.getItem('token')
        if (token) {
          const socket = getSocket()
          if (socket) {
            socket.off('draw-element')
            socket.off('update-element')
            socket.off('delete-element')
          }
        }
      } catch (e) {
        // ignore
      }
      window.removeEventListener('resize', resizeHandler)
      canvas.dispose()
    }
  }, [])

  // react to tool/color changes
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.isDrawingMode = tool === 'pen'
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = brushSize
      canvas.freeDrawingBrush.color = color
    }
    // set selection mode when not drawing
    canvas.selection = tool !== 'pan' && tool !== 'pen'
    if (tool === 'eraser') {
      // simple eraser: set globalCompositeOperation if supported or implement by selecting objects
      canvas.isDrawingMode = true
      if (canvas.freeDrawingBrush) canvas.freeDrawingBrush.color = '#ffffff'
    }
  }, [tool, color, brushSize])

  return (
    <div className="absolute inset-0 bg-transparent">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
