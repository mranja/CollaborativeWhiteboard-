import { useEffect } from 'react'
import { useUndoStore } from '../stores/undoStore'
import { useBoardStore } from '../stores/boardStore'

export function useKeyboardShortcuts(fabricRef) {
  const undo = useUndoStore((s) => s.undo)
  const redo = useUndoStore((s) => s.redo)
  const push = useUndoStore((s) => s.push)
  const setTool = useBoardStore((s) => s.setTool)

  useEffect(() => {
    function handler(e) {
      if (isTypingTarget(e.target)) return
      const meta = e.ctrlKey || e.metaKey
      // Undo
      if (meta && e.key === 'z') {
        e.preventDefault()
        const op = undo()
        if (op && fabricRef.current) {
          // basic undo handling delegated to FabricCanvas via event
          fabricRef.current.fire('app:undo', { op })
        }
      }
      // Redo
      if (meta && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault()
        const op = redo()
        if (op && fabricRef.current) fabricRef.current.fire('app:redo', { op })
      }
      // Delete
      if (e.key === 'Delete') {
        if (fabricRef.current) fabricRef.current.fire('app:delete')
      }
      // Space to pan (we toggle tool)
      if (e.code === 'Space') {
        e.preventDefault()
        setTool('pan')
      }
    }

    function isTypingTarget(target) {
      if (!target) return false
      const tag = target.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable === true
    }
    function handleKeyUp(e) {
      // Restore select only when Space is released. This used to run on every
      // keyup, so releasing any key silently snapped the active tool back to
      // the pointer mid-drawing.
      if (e.code === 'Space') setTool('select')
    }

    window.addEventListener('keydown', handler)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handler)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [fabricRef, undo, redo, push, setTool])
}
