import { create } from 'zustand'

const useBoardStore = create((set) => ({
  boardId: null,
  elements: [],
  liveCursors: {}, // { userId: { x, y, name, color } }
  currentTool: 'select',
  currentUser: null,
  
  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentTool: (tool) => set({ currentTool: tool }),
  setBoard: (id) => set({ boardId: id, elements: [] }),
  addElement: (el) => set(state => ({ elements: [...state.elements, el] })),
  updateElement: (el) => set(state => ({ elements: state.elements.map(e => e.id === el.id ? { ...e, ...el } : e) })),
  deleteElement: (id) => set(state => ({ elements: state.elements.filter(e => e.id !== id) })),
  
  updateLiveCursor: (userId, x, y, name, color) => set((state) => ({
    liveCursors: {
      ...state.liveCursors,
      [userId]: { x, y, name, color }
    }
  })),
  
  removeLiveCursor: (userId) => set((state) => {
    const newCursors = { ...state.liveCursors }
    delete newCursors[userId]
    return { liveCursors: newCursors }
  })
}))

export default useBoardStore
