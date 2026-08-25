import { create } from 'zustand'

const useBoardStore = create((set) => ({
  boardId: null,
  elements: [],
  liveCursors: {}, // { userId: { x, y, name, color } }
  presence: [],    // [{ userId, name }] — everyone else currently in the room
  currentTool: 'select',
  currentUser: null,
  
  // Tool Settings
  strokeColor: '#8b5cf6', // Default purple from our design system
  strokeWidth: 4,
  fillColor: 'transparent',
  
  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentTool: (tool) => set({ currentTool: tool }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setFillColor: (color) => set({ fillColor: color }),
  
  // Switching boards must drop the previous room's cursors and presence,
  // otherwise stale collaborators linger and inflate the active-user count.
  setBoard: (id, initialElements = []) => set((state) => (
    state.boardId === id
      ? { boardId: id, elements: initialElements }
      : { boardId: id, elements: initialElements, liveCursors: {}, presence: [] }
  )),

  setPresence: (members = []) => set({
    presence: members
      .filter((m) => m && m.userId)
      .map((m) => ({ userId: String(m.userId), name: m.name || 'Anonymous' }))
  }),

  addPresence: (member) => set((state) => {
    if (!member || !member.userId) return state
    const userId = String(member.userId)
    if (state.presence.some((p) => p.userId === userId)) return state
    return { presence: [...state.presence, { userId, name: member.name || 'Anonymous' }] }
  }),

  removePresence: (userId) => set((state) => {
    const id = String(userId)
    if (!state.presence.some((p) => p.userId === id)) return state
    return { presence: state.presence.filter((p) => p.userId !== id) }
  }),

  clearPresence: () => set({ presence: [], liveCursors: {} }),
  
  addElement: (el) => set(state => ({ elements: [...state.elements, el] })),
  
  updateElement: (el) => set(state => ({ 
    elements: state.elements.map(e => e.id === el.id ? { ...e, ...el } : e) 
  })),
  
  deleteElement: (id) => set(state => ({ 
    elements: state.elements.filter(e => e.id !== id) 
  })),
  
  updateLiveCursor: (userId, x, y, name, color) => set((state) => ({
    liveCursors: {
      ...state.liveCursors,
      [userId]: { x, y, name, color }
    }
  })),
  
  removeLiveCursor: (userId) => set((state) => {
    if (!(userId in state.liveCursors)) return state
    const newCursors = { ...state.liveCursors }
    delete newCursors[userId]
    return { liveCursors: newCursors }
  })
}))

export default useBoardStore
