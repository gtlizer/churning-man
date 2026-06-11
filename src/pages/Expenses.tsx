import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, Search, ChevronUp, ChevronDown, DollarSign } from 'lucide-react'
import { useExpenseStore } from '../store/expenseStore'
import type { Expense, ExpenseCategory } from '../types'
import { CAMP_MEMBERS } from '../constants/campMembers'

const CATEGORIES: ExpenseCategory[] = [
  'Supplies',
  'Food & Drinks',
  'Vehicle',
  'Fuel',
  'Camp Setup',
  'Costumes',
  'Other',
]

const CATEGORY_STYLES: Record<ExpenseCategory, string> = {
  Supplies: 'bg-blue-100 text-blue-800 border-blue-300',
  'Food & Drinks': 'bg-teal-100 text-teal-800 border-teal-300',
  Vehicle: 'bg-orange-100 text-orange-800 border-orange-300',
  Fuel: 'bg-amber-100 text-amber-800 border-amber-300',
  'Camp Setup': 'bg-purple-100 text-purple-800 border-purple-300',
  Costumes: 'bg-pink-100 text-pink-800 border-pink-300',
  Other: 'bg-black/5 text-mauve border-playa-mid',
}

const emptyAddForm = {
  title: '',
  description: '',
  amount: '',
  category: 'Supplies' as ExpenseCategory,
  paidBy: '',
  date: new Date().toISOString().split('T')[0],
}

type SortCol = keyof Expense | null

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function Expenses() {
  const { expenses, addExpense, deleteExpense, updateExpense } = useExpenseStore()

  const [sortCol, setSortCol] = useState<SortCol>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'All'>('All')
  const [showAddRow, setShowAddRow] = useState(false)
  const [addForm, setAddForm] = useState(emptyAddForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Expense>>({})

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  const categoryBreakdown = CATEGORIES.map((cat) => ({
    category: cat,
    total: expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
  })).filter((c) => c.total > 0)

  const activeCategories = CATEGORIES.filter((cat) => expenses.some((e) => e.category === cat))

  const q = search.toLowerCase()
  let filtered = expenses.filter((e) => {
    const matchSearch =
      !q ||
      e.title.toLowerCase().includes(q) ||
      (e.description?.toLowerCase().includes(q) ?? false) ||
      e.paidBy.toLowerCase().includes(q) ||
      (e.notes?.toLowerCase().includes(q) ?? false)
    const matchCat = categoryFilter === 'All' || e.category === categoryFilter
    return matchSearch && matchCat
  })

  if (sortCol) {
    filtered = [...filtered].sort((a, b) => {
      const av = a[sortCol]
      const bv = b[sortCol]
      let cmp = 0
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv
      } else {
        cmp = String(av ?? '').localeCompare(String(bv ?? ''))
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }

  const filteredTotal = filtered.reduce((sum, e) => sum + e.amount, 0)

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <ChevronUp size={11} className="opacity-20 shrink-0" />
    return sortDir === 'asc' ? (
      <ChevronUp size={11} className="text-neon shrink-0" />
    ) : (
      <ChevronDown size={11} className="text-neon shrink-0" />
    )
  }

  function handleAddSave(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.title || !addForm.amount || !addForm.paidBy) return
    addExpense({
      title: addForm.title,
      description: addForm.description || undefined,
      amount: parseFloat(addForm.amount),
      category: addForm.category,
      paidBy: addForm.paidBy,
      date: addForm.date,
    })
    setAddForm(emptyAddForm)
    setShowAddRow(false)
  }

  function startEdit(expense: Expense) {
    setEditingId(expense.id)
    setEditForm({ ...expense })
  }

  function handleEditSave() {
    if (!editingId || !editForm.title || !editForm.paidBy) return
    updateExpense(editingId, editForm)
    setEditingId(null)
    setEditForm({})
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  const thBase =
    'px-3 py-2.5 text-left text-xs font-bold text-mauve/50 uppercase tracking-wider whitespace-nowrap'
  const thSortable = thBase + ' cursor-pointer hover:text-mauve select-none transition-colors'
  const cellInput =
    'w-full bg-playa-mid/60 border border-playa-mid rounded px-2 py-1 text-xs text-plum placeholder-mauve/40 focus:outline-none focus:border-neon/50 focus:bg-playa-mid/80'

  function Th({
    col,
    children,
    className = '',
  }: {
    col?: SortCol
    children?: React.ReactNode
    className?: string
  }) {
    return (
      <th
        className={`${col ? thSortable : thBase} ${className}`}
        onClick={col ? () => handleSort(col) : undefined}
      >
        <span className="flex items-center gap-1">
          {children}
          {col && <SortIcon col={col} />}
        </span>
      </th>
    )
  }

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 max-w-7xl mx-auto">
        <div>
          <h1 className="section-title">Expenses</h1>
          <p className="section-subtitle">Track what the camp is spending</p>
        </div>
        <button
          onClick={() => { setShowAddRow(true); setEditingId(null) }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Add Row
        </button>
      </div>

      {/* Summary row */}
      <div className="grid md:grid-cols-[200px_1fr] gap-4 mb-6 max-w-7xl mx-auto">
        <div
          className="card p-5"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="text-neon" size={14} />
            <span className="text-mauve text-xs uppercase tracking-wider font-semibold">Total</span>
          </div>
          <div className="font-display text-4xl text-plum">${total.toFixed(2)}</div>
          <div className="text-mauve/50 text-xs mt-1">{expenses.length} entries</div>
        </div>

        {categoryBreakdown.length > 0 ? (
          <div className="card p-5">
            <h3 className="text-xs font-bold text-mauve/50 uppercase tracking-widest mb-3">By Category</h3>
            <div className="space-y-2">
              {categoryBreakdown.map(({ category, total: catTotal }) => (
                <div key={category} className="flex items-center gap-3">
                  <span className="text-xs text-plum/60 w-28 shrink-0">{category}</span>
                  <div className="flex-1 h-1.5 bg-playa-mid/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neon rounded-full transition-all duration-500"
                      style={{ width: `${(catTotal / total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-mauve w-16 text-right shrink-0">
                    ${catTotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-5 flex items-center justify-center">
            <p className="text-mauve/40 text-sm italic">Category breakdown will appear once you add expenses.</p>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-3 max-w-7xl mx-auto">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve/40" />
          <input
            className="input pl-8 w-full text-sm"
            placeholder="Search title, description, person, notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategoryFilter('All')}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              categoryFilter === 'All'
                ? 'bg-neon/10 border-neon/30 text-neon font-semibold'
                : 'border-playa-mid text-mauve/60 hover:text-mauve hover:border-mauve/40'
            }`}
          >
            All
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === categoryFilter ? 'All' : cat)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                categoryFilter === cat
                  ? 'bg-neon/10 border-neon/30 text-neon font-semibold'
                  : 'border-playa-mid text-mauve/60 hover:text-mauve hover:border-mauve/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <span className="text-xs text-mauve/40 whitespace-nowrap ml-auto">
          {filtered.length} of {expenses.length}
        </span>
      </div>

      {/* Table — full width */}
      <div className="card overflow-hidden max-w-7xl mx-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-playa-mid/60 bg-playa-light/30">
              <tr>
                <Th col="date" className="w-24">Date</Th>
                <Th col="title" className="w-48">Title</Th>
                <Th col="description" className="min-w-[280px]">Description</Th>
                <Th col="category" className="w-36">Category</Th>
                <Th col="paidBy" className="w-32">Paid By</Th>
                <Th col="amount" className="w-28 text-right [&>span]:justify-end">Amount</Th>
                <Th className="w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-playa-mid/30">
              {/* Add row */}
              {showAddRow && (
                <tr className="bg-neon/[0.03] border-l-2 border-neon/40">
                  <td className="px-3 py-2 align-top">
                    <input
                      type="date"
                      className={cellInput}
                      value={addForm.date}
                      onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input
                      className={cellInput}
                      placeholder="Title *"
                      value={addForm.title}
                      onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                      autoFocus
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <textarea
                      className={cellInput + ' resize-none leading-relaxed'}
                      placeholder="Description"
                      rows={3}
                      value={addForm.description}
                      onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <select
                      className={cellInput}
                      value={addForm.category}
                      onChange={(e) => setAddForm({ ...addForm, category: e.target.value as ExpenseCategory })}
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <select
                      className={cellInput}
                      value={addForm.paidBy}
                      onChange={(e) => setAddForm({ ...addForm, paidBy: e.target.value })}
                    >
                      <option value="">Paid by *</option>
                      {CAMP_MEMBERS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={cellInput + ' text-right'}
                      placeholder="0.00"
                      value={addForm.amount}
                      onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleAddSave}
                        className="p-1 text-neon hover:opacity-70 transition-opacity"
                        title="Save"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => { setShowAddRow(false); setAddForm(emptyAddForm) }}
                        className="p-1 text-mauve/40 hover:text-red-400 transition-colors"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {filtered.length === 0 && !showAddRow ? (
                <tr>
                  <td colSpan={7} className="px-3 py-16 text-center">
                    <div className="text-4xl mb-3">💸</div>
                    <p className="text-mauve text-sm">
                      {expenses.length === 0
                        ? 'No expenses yet. Add your first one!'
                        : 'No results match your search.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((expense) => {
                  const isEditing = editingId === expense.id
                  return (
                    <tr
                      key={expense.id}
                      className={`group transition-colors ${
                        isEditing
                          ? 'bg-neon/[0.03] border-l-2 border-neon/40'
                          : 'hover:bg-playa-light/20'
                      }`}
                    >
                      <td className="px-3 py-2.5 align-top whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="date"
                            className={cellInput}
                            value={editForm.date ?? expense.date}
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                          />
                        ) : (
                          <span className="text-mauve text-xs">{formatDate(expense.date)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        {isEditing ? (
                          <input
                            className={cellInput}
                            value={editForm.title ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            autoFocus
                          />
                        ) : (
                          <span className="text-plum font-semibold text-sm">{expense.title}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        {isEditing ? (
                          <textarea
                            className={cellInput + ' resize-none leading-relaxed'}
                            rows={3}
                            value={editForm.description ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          />
                        ) : (
                          <span className="text-plum/70 text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {expense.description ?? ''}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        {isEditing ? (
                          <select
                            className={cellInput}
                            value={editForm.category ?? expense.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value as ExpenseCategory })}
                          >
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : (
                          <span className={`badge text-xs ${CATEGORY_STYLES[expense.category]}`}>
                            {expense.category}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        {isEditing ? (
                          <select
                            className={cellInput}
                            value={editForm.paidBy ?? expense.paidBy}
                            onChange={(e) => setEditForm({ ...editForm, paidBy: e.target.value })}
                          >
                            <option value="">Select…</option>
                            {CAMP_MEMBERS.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                        ) : (
                          <span className="text-mauve text-xs">{expense.paidBy}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={cellInput + ' text-right'}
                            value={editForm.amount ?? ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })
                            }
                          />
                        ) : (
                          <span className="font-display text-plum">${expense.amount.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={handleEditSave}
                              className="p-1 text-neon hover:opacity-70 transition-opacity"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 text-mauve/40 hover:text-red-400 transition-colors"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(expense)}
                              className="p-1 text-mauve/40 hover:text-plum transition-colors"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => deleteExpense(expense.id)}
                              className="p-1 text-mauve/40 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}

              {/* Footer total */}
              {filtered.length > 0 && (
                <tr className="border-t border-playa-mid/60 bg-playa-light/20">
                  <td colSpan={5} className="px-3 py-2.5 text-xs text-mauve/40 italic">
                    {filtered.length < expenses.length ? `${filtered.length} filtered` : 'Total'}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-display text-neon">${filteredTotal.toFixed(2)}</span>
                  </td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
