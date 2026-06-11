import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GearItem } from '../types'

interface GearStore {
  items: GearItem[]
  addItem: (item: Omit<GearItem, 'id'>) => void
  deleteItem: (id: string) => void
  togglePacked: (id: string) => void
  updateItem: (id: string, updates: Partial<GearItem>) => void
}

export const useGearStore = create<GearStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: [{ ...item, id: crypto.randomUUID() }, ...state.items],
        })),
      deleteItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      togglePacked: (id) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, packed: !i.packed } : i)),
        })),
      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),
    }),
    { name: 'churning-man-gear' }
  )
)
