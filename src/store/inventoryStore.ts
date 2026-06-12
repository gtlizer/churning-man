import { create } from 'zustand'
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { IceCreamItem } from '../types'

function clean(obj: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}

interface InventoryStore {
  items: IceCreamItem[]
  addItem: (item: Omit<IceCreamItem, 'id'>) => void
  deleteItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
}

export const useInventoryStore = create<InventoryStore>()(() => ({
  items: [],
  addItem:    (item)              => { void addDoc(collection(db, 'inventory'), clean(item)) },
  deleteItem: (id)                => { void deleteDoc(doc(db, 'inventory', id)) },
  updateQuantity: (id, quantity)  => { void updateDoc(doc(db, 'inventory', id), { quantity }) },
}))

onSnapshot(collection(db, 'inventory'), (snap) => {
  const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as IceCreamItem))
  useInventoryStore.setState({ items })
})
