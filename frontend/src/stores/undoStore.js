import { create } from 'zustand'

export const useUndoStore = create((set, get) => ({
  undoStack: [],
  redoStack: [],
  // push expects { type: 'create'|'modify'|'delete', payload: {..}, inverse: {..} }
  push: (op) => set((s) => ({ undoStack: [...s.undoStack, op], redoStack: [] })),
  // perform undo: pop from undoStack, push to redoStack, and return the op and its inverse
  undo: () => {
    const { undoStack } = get()
    if (undoStack.length === 0) return null
    const op = undoStack[undoStack.length - 1]
    set((s) => ({ undoStack: s.undoStack.slice(0, -1), redoStack: [...s.redoStack, op] }))
    return op
  },
  // perform redo: pop from redoStack, push to undoStack
  redo: () => {
    const { redoStack } = get()
    if (redoStack.length === 0) return null
    const op = redoStack[redoStack.length - 1]
    set((s) => ({ redoStack: s.redoStack.slice(0, -1), undoStack: [...s.undoStack, op] }))
    return op
  },
  clear: () => set({ undoStack: [], redoStack: [] })
}))
