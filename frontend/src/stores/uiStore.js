import create from 'zustand'

export const useUIStore = create((set) => ({
  darkMode: true,
  snapToGrid: false,
  setDarkMode: (v) => set({ darkMode: v }),
  setSnapToGrid: (v) => set({ snapToGrid: v })
}))
