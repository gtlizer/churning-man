import { create } from 'zustand'
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { ScheduleEvent } from '../types'

// Firestore rejects undefined values — strip them before writing
function clean(obj: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}

interface ScheduleStore {
  events: ScheduleEvent[]
  addEvent: (event: Omit<ScheduleEvent, 'id'>) => void
  deleteEvent: (id: string) => void
  updateEvent: (id: string, updates: Partial<ScheduleEvent>) => void
}

export const useScheduleStore = create<ScheduleStore>()(() => ({
  events: [],
  addEvent:    (event)          => { void addDoc(collection(db, 'events'), clean(event)) },
  deleteEvent: (id)             => { void deleteDoc(doc(db, 'events', id)) },
  updateEvent: (id, updates)    => { void updateDoc(doc(db, 'events', id), clean(updates)) },
}))

onSnapshot(collection(db, 'events'), (snap) => {
  const events = snap.docs.map(d => {
    const data = d.data()
    // Normalize legacy single-string assignedTo to array
    if (typeof data.assignedTo === 'string') {
      data.assignedTo = data.assignedTo ? [data.assignedTo] : undefined
    }
    return { ...data, id: d.id } as ScheduleEvent
  })
  useScheduleStore.setState({ events })
})
