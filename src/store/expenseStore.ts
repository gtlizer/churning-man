import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Expense } from '../types'

interface ExpenseStore {
  expenses: Expense[]
  addExpense: (expense: Omit<Expense, 'id'>) => void
  deleteExpense: (id: string) => void
  updateExpense: (id: string, updates: Partial<Expense>) => void
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set) => ({
      expenses: [],
      addExpense: (expense) =>
        set((state) => ({
          expenses: [{ ...expense, id: crypto.randomUUID() }, ...state.expenses],
        })),
      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),
      updateExpense: (id, updates) =>
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
    }),
    { name: 'churning-man-expenses' }
  )
)
