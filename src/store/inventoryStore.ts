import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { IceCreamItem } from '../types'

interface InventoryStore {
  items: IceCreamItem[]
  addItem: (item: Omit<IceCreamItem, 'id'>) => void
  deleteItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
}

export const useInventoryStore = create<InventoryStore>()(
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
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),
    }),
    { name: 'churning-man-inventory' }
  )
)
