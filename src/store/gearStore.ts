import { create } from 'zustand'
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { GearItem } from '../types'

function clean(obj: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}

interface GearStore {
  items: GearItem[]
  addItem: (item: Omit<GearItem, 'id'>) => void
  deleteItem: (id: string) => void
  togglePacked: (id: string) => void
  updateItem: (id: string, updates: Partial<GearItem>) => void
}

export const useGearStore = create<GearStore>()(() => ({
  items: [],
  addItem:    (item)         => { void addDoc(collection(db, 'gear'), clean(item)) },
  deleteItem: (id)           => { void deleteDoc(doc(db, 'gear', id)) },
  togglePacked: (id) => {
    const item = useGearStore.getState().items.find(i => i.id === id)
    if (item) void updateDoc(doc(db, 'gear', id), { packed: !item.packed })
  },
  updateItem: (id, updates)  => { void updateDoc(doc(db, 'gear', id), clean(updates)) },
}))

onSnapshot(collection(db, 'gear'), (snap) => {
  const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as GearItem))
  useGearStore.setState({ items })
})
