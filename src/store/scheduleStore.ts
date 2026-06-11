import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ScheduleEvent } from '../types'

interface ScheduleStore {
  events: ScheduleEvent[]
  addEvent: (event: Omit<ScheduleEvent, 'id'>) => void
  deleteEvent: (id: string) => void
  updateEvent: (id: string, updates: Partial<ScheduleEvent>) => void
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (event) =>
        set((state) => ({
          events: [{ ...event, id: crypto.randomUUID() }, ...state.events],
        })),
      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        })),
      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
    }),
    { name: 'churning-man-schedule' }
  )
)
