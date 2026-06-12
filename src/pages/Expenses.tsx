import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, Search, ChevronUp, ChevronDown, DollarSign } from 'lucide-react'
import { useExpenseStore } from '../store/expenseStore'
import type { Expense, ExpenseCategory } from '../types'
import { CAMP_MEMBERS } from '../constants/campMembers'

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: ExpenseCategory[] = [
  'Supplies', 'Food & Drinks', 'Vehicle', 'Fuel', 'Camp Setup', 'Costumes', 'Other',
]

const CATEGORY_STYLES: Record<ExpenseCategory, string> = {
  Supplies:        'bg-blue-100 text-blue-800 border-blue-300',
  'Food & Drinks': 'bg-teal-100 text-teal-800 border-teal-300',
  Vehicle:         'bg-orange-100 text-orange-800 border-orange-300',
  Fuel:            'bg-amber-100 text-amber-800 border-amber-300',
  'Camp Setup':    'bg-purple-100 text-purple-800 border-purple-300',
  Costumes:        'bg-pink-100 text-pink-800 border-pink-300',
  Other:           'bg-black/5 text-mauve border-playa-mid',
}

const emptyForm = {
  title: '',
  description: '',
  amount: '',
  category: 'Supplies' as ExpenseCategory,
  paidBy: '',
  date: new Date().toISOString().split('T')[0],
}

type SortCol = keyof Expense | null

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Add / Edit Expense Modal ──────────────────────────────────────────────────

function AddExpenseModal({
  onClose,
  onSubmit,
  initial,
}: {
  onClose: () => void
  onSubmit: (expense: Omit<Expense, 'id'>) => void
  initial?: Expense
}) {
  const [form, setForm] = useState(initial ? {
    title: initial.title,
    description: initial.description ?? '',
    amount: String(initial.amount),
    category: initial.category,
    paidBy: initial.paidBy,
    date: initial.date,
  } : emptyForm)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.amount || !form.paidBy) return
    onSubmit({
      title: form.title,
      description: form.description || undefined,
      amount: parseFloat(form.amount),
      category: form.category,
      paidBy: form.paidBy,
      date: form.date,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl text-plum">{initial ? 'Edit Expense' : 'New Expense'}</h2>
          <button onClick={onClose} className="text-mauve hover:text-plum transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="input w-full"
            placeholder="Title *"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve/50 text-sm">$</span>
              <input
                className="input w-full pl-6"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <input
              className="input w-full"
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              className="select"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value as ExpenseCategory })}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="select"
              value={form.paidBy}
              onChange={e => setForm({ ...form, paidBy: e.target.value })}
              required
            >
              <option value="">Paid by *</option>
              {CAMP_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <textarea
            className="input w-full resize-none"
            placeholder="Description (optional)"
            rows={2}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />

          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {initial ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Expenses() {
  const { expenses, addExpense, deleteExpense, updateExpense } = useExpenseStore()

  const [sortCol, setSortCol] = useState<SortCol>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'All'>('All')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Expense>>({})
  const [mobileEditExpense, setMobileEditExpense] = useState<Expense | null>(null)

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  const categoryBreakdown = CATEGORIES.map(cat => ({
    category: cat,
    total: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
  })).filter(c => c.total > 0)

  const activeCategories = CATEGORIES.filter(cat => expenses.some(e => e.category === cat))

  const q = search.toLowerCase()
  let filtered = expenses.filter(e => {
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
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <ChevronUp size={11} className="opacity-20 shrink-0" />
    return sortDir === 'asc'
      ? <ChevronUp size={11} className="text-neon shrink-0" />
      : <ChevronDown size={11} className="text-neon shrink-0" />
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

  const thBase = 'px-3 py-2.5 text-left text-xs font-bold text-mauve/50 uppercase tracking-wider whitespace-nowrap'
  const thSortable = thBase + ' cursor-pointer hover:text-mauve select-none transition-colors'
  const cellInput = 'w-full bg-playa-mid/60 border border-playa-mid rounded px-2 py-1 text-xs text-plum placeholder-mauve/40 focus:outline-none focus:border-neon/50 focus:bg-playa-mid/80'

  function Th({ col, children, className = '' }: { col?: SortCol; children?: React.ReactNode; className?: string }) {
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
    <div className="p-4 md:p-6 w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 md:mb-6 max-w-7xl mx-auto">
        <div>
          <h1 className="section-title">Expenses</h1>
          <p className="section-subtitle">Track what the camp is spending</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingId(null) }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Add Expense
        </button>
      </div>

      {/* Summary row */}
      <div className="grid md:grid-cols-[200px_1fr] gap-4 mb-6 max-w-7xl mx-auto">
        <div className="card p-5">
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
                  <span className="text-xs text-mauve w-16 text-right shrink-0">${catTotal.toFixed(2)}</span>
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
            placeholder="Search title, description, person…"
            value={search}
            onChange={e => setSearch(e.target.value)}
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
          {activeCategories.map(cat => (
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

      {/* Mobile card list */}
      <div className="md:hidden space-y-2 max-w-7xl mx-auto mb-4">
        {filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-3">💸</div>
            <p className="text-mauve text-sm">
              {expenses.length === 0 ? 'No expenses yet. Add your first one!' : 'No results match your search.'}
            </p>
          </div>
        ) : (
          filtered.map(expense => (
            <div key={expense.id} className="card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-plum text-sm leading-snug truncate">{expense.title}</div>
                  {expense.description && (
                    <div className="text-plum/60 text-xs mt-0.5 leading-relaxed">{expense.description}</div>
                  )}
                </div>
                <div className="font-display text-xl text-plum shrink-0">${expense.amount.toFixed(2)}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge text-[10px] ${CATEGORY_STYLES[expense.category]}`}>{expense.category}</span>
                <span className="text-[11px] text-mauve/60">{formatDate(expense.date)}</span>
                <span className="text-[11px] text-mauve/60">· {expense.paidBy}</span>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setMobileEditExpense(expense)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-playa-mid text-mauve hover:text-plum transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteExpense(expense.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table (desktop only) */}
      <div className="hidden md:block card overflow-hidden max-w-7xl mx-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-playa-mid/60 bg-playa-light/30">
              <tr>
                <Th col="date" className="w-24">Date</Th>
                <Th col="title" className="w-48">Title</Th>
                <Th col="description" className="min-w-[240px]">Description</Th>
                <Th col="category" className="w-36">Category</Th>
                <Th col="paidBy" className="w-32">Paid By</Th>
                <Th col="amount" className="w-28 text-right [&>span]:justify-end">Amount</Th>
                <Th className="w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-playa-mid/30">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-16 text-center">
                    <div className="text-4xl mb-3">💸</div>
                    <p className="text-mauve text-sm">
                      {expenses.length === 0 ? 'No expenses yet. Add your first one!' : 'No results match your search.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map(expense => {
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
                      {/* Date */}
                      <td className="px-3 py-2.5 align-top whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="date"
                            className={cellInput}
                            value={editForm.date ?? expense.date}
                            onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                          />
                        ) : (
                          <span className="text-mauve text-xs">{formatDate(expense.date)}</span>
                        )}
                      </td>

                      {/* Title */}
                      <td className="px-3 py-2.5 align-top">
                        {isEditing ? (
                          <input
                            className={cellInput}
                            value={editForm.title ?? ''}
                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                            autoFocus
                          />
                        ) : (
                          <span className="text-plum font-semibold text-sm">{expense.title}</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="px-3 py-2.5 align-top">
                        {isEditing ? (
                          <textarea
                            className={cellInput + ' resize-none leading-relaxed'}
                            rows={3}
                            value={editForm.description ?? ''}
                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                          />
                        ) : (
                          <span className="text-plum/70 text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {expense.description ?? ''}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-3 py-2.5 align-top">
                        {isEditing ? (
                          <select
                            className={cellInput}
                            value={editForm.category ?? expense.category}
                            onChange={e => setEditForm({ ...editForm, category: e.target.value as ExpenseCategory })}
                          >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : (
                          <span className={`badge text-xs ${CATEGORY_STYLES[expense.category]}`}>
                            {expense.category}
                          </span>
                        )}
                      </td>

                      {/* Paid By */}
                      <td className="px-3 py-2.5 align-top">
                        {isEditing ? (
                          <select
                            className={cellInput}
                            value={editForm.paidBy ?? expense.paidBy}
                            onChange={e => setEditForm({ ...editForm, paidBy: e.target.value })}
                          >
                            <option value="">Select…</option>
                            {CAMP_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        ) : (
                          <span className="text-mauve text-xs">{expense.paidBy}</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-2.5 align-top text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className={cellInput + ' text-right'}
                            value={editForm.amount ?? ''}
                            onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                          />
                        ) : (
                          <span className="font-display text-plum">${expense.amount.toFixed(2)}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5 align-top">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <button onClick={handleEditSave} className="p-1 text-neon hover:opacity-70 transition-opacity" title="Save">
                              <Check size={14} />
                            </button>
                            <button onClick={cancelEdit} className="p-1 text-mauve/40 hover:text-red-400 transition-colors" title="Cancel">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(expense)} className="p-1 text-mauve/40 hover:text-plum transition-colors" title="Edit">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => deleteExpense(expense.id)} className="p-1 text-mauve/40 hover:text-red-400 transition-colors" title="Delete">
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

      {(showModal || mobileEditExpense) && (
        <AddExpenseModal
          onClose={() => { setShowModal(false); setMobileEditExpense(null) }}
          initial={mobileEditExpense ?? undefined}
          onSubmit={data => {
            if (mobileEditExpense) updateExpense(mobileEditExpense.id, data)
            else addExpense(data)
          }}
        />
      )}
    </div>
  )
}
