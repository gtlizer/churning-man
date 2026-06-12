import { create } from 'zustand'
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Expense } from '../types'

function clean(obj: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}

interface ExpenseStore {
  expenses: Expense[]
  addExpense: (expense: Omit<Expense, 'id'>) => void
  deleteExpense: (id: string) => void
  updateExpense: (id: string, updates: Partial<Expense>) => void
}

export const useExpenseStore = create<ExpenseStore>()(() => ({
  expenses: [],
  addExpense:    (expense)       => { void addDoc(collection(db, 'expenses'), clean(expense)) },
  deleteExpense: (id)            => { void deleteDoc(doc(db, 'expenses', id)) },
  updateExpense: (id, updates)   => { void updateDoc(doc(db, 'expenses', id), clean(updates)) },
}))

onSnapshot(collection(db, 'expenses'), (snap) => {
  const expenses = snap.docs.map(d => ({ ...d.data(), id: d.id } as Expense))
  useExpenseStore.setState({ expenses })
})
