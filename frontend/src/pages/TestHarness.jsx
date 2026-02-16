import React, { useEffect, useState } from 'react'
import BoardPage from './BoardPage'
import { useBoardStore } from '../stores/boardStore'
import { useUndoStore } from '../stores/undoStore'

export default function TestHarness() {
  const [logs, setLogs] = useState([])
  const pushLog = (l) => setLogs((s) => [l, ...s].slice(0, 50))
  const push = useUndoStore((s) => s.push)
  const fabric = useBoardStore((s) => s.fabric)

  function addRect() {
    if (!fabric) return pushLog('no fabric')
    const r = new fabric.Rect({ left: 100, top: 80, width: 120, height: 80, fill: '#f59e0b' })
    r.id = `test_${Date.now()}`
    fabric.add(r)
    fabric.requestRenderAll()
    push({ type: 'create', payload: { id: r.id, type: 'rect' }, inverse: { type: 'delete', payload: { id: r.id } } })
    pushLog('added rect ' + r.id)
  }

  function addText() {
    if (!fabric) return pushLog('no fabric')
    const t = new fabric.Textbox('Hello\\nWorld', { left: 180, top: 120, fontSize: 24, fill: '#10b981' })
    t.id = `text_${Date.now()}`
    fabric.add(t)
    fabric.requestRenderAll()
    push({ type: 'create', payload: t.toObject(['id']), inverse: { type: 'delete', payload: { id: t.id } } })
    pushLog('added text ' + t.id)
  }

  function addEllipse() {
    if (!fabric) return pushLog('no fabric')
    const e = new fabric.Ellipse({ left: 260, top: 160, rx: 60, ry: 40, fill: '#60a5fa' })
    e.id = `ellipse_${Date.now()}`
    fabric.add(e)
    fabric.requestRenderAll()
    push({ type: 'create', payload: e.toObject(['id']), inverse: { type: 'delete', payload: { id: e.id } } })
    pushLog('added ellipse ' + e.id)
  }

  function addLine() {
    if (!fabric) return pushLog('no fabric')
    const l = new fabric.Line([10, 10, 200, 80], { left: 120, top: 220, stroke: '#ef4444', strokeWidth: 3 })
    l.id = `line_${Date.now()}`
    fabric.add(l)
    fabric.requestRenderAll()
    push({ type: 'create', payload: l.toObject(['id']), inverse: { type: 'delete', payload: { id: l.id } } })
    pushLog('added line ' + l.id)
  }

  function addGroup() {
    if (!fabric) return pushLog('no fabric')
    const a = new fabric.Rect({ left: 50, top: 300, width: 80, height: 80, fill: '#f472b6' })
    const b = new fabric.Textbox('G', { left: 90, top: 330, fontSize: 32, fill: '#fff' })
    const g = new fabric.Group([a, b], { left: 100, top: 300 })
    g.id = `group_${Date.now()}`
    fabric.add(g)
    fabric.requestRenderAll()
    push({ type: 'create', payload: g.toObject(['id']), inverse: { type: 'delete', payload: { id: g.id } } })
    pushLog('added group ' + g.id)
  }

  function runUndo() {
    const op = useUndoStore.getState().undo()
    if (!op) return pushLog('undo: nothing')
    fabric.fire('app:undo', { op })
    pushLog('undid op ' + op.type)
  }

  function runRedo() {
    const op = useUndoStore.getState().redo()
    if (!op) return pushLog('redo: nothing')
    fabric.fire('app:redo', { op })
    pushLog('redid op ' + op.type)
  }

  return (
    <div className="w-full h-screen bg-slate-900">
      <div className="p-4 flex gap-3">
        <button onClick={addRect} className="px-3 py-2 bg-emerald-500 rounded">Add Rect</button>
        <button onClick={addText} className="px-3 py-2 bg-green-500 rounded">Add Text</button>
        <button onClick={addEllipse} className="px-3 py-2 bg-blue-500 rounded">Add Ellipse</button>
        <button onClick={addLine} className="px-3 py-2 bg-red-500 rounded">Add Line</button>
        <button onClick={addGroup} className="px-3 py-2 bg-pink-500 rounded">Add Group</button>
        <button onClick={runUndo} className="px-3 py-2 bg-yellow-500 rounded">Undo</button>
        <button onClick={runRedo} className="px-3 py-2 bg-indigo-500 rounded">Redo</button>
      </div>
      <div className="flex">
        <div className="flex-1 h-[80vh] p-4">
          <BoardPage />
        </div>
        <div className="w-80 p-4">
          <h3 className="text-white mb-2">Logs</h3>
          <div className="bg-white/6 rounded p-2 h-[70vh] overflow-auto">
            {logs.map((l, i) => (
              <div key={i} className="text-sm text-white">{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
