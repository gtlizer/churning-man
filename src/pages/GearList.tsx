import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, Search, ChevronUp, ChevronDown, Package } from 'lucide-react'
import { useGearStore } from '../store/gearStore'
import type { GearItem, GearCategory } from '../types'
import { CAMP_MEMBERS } from '../constants/campMembers'

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: GearCategory[] = [
  'Ice Cream Equipment',
  'Camp Essentials',
  'Vehicle',
  'Safety',
  'Entertainment',
  'Costumes',
  'Food & Ingredients',
  'Other',
]

const CATEGORY_EMOJIS: Record<GearCategory, string> = {
  'Ice Cream Equipment': '🍦',
  'Camp Essentials': '⛺',
  Vehicle: '🚛',
  Safety: '🦺',
  Entertainment: '🎵',
  Costumes: '✨',
  'Food & Ingredients': '🧁',
  Other: '📦',
}

const CATEGORY_STYLES: Record<GearCategory, string> = {
  'Ice Cream Equipment': 'bg-pink-100 text-pink-800 border-pink-300',
  'Camp Essentials':     'bg-teal-100 text-teal-800 border-teal-300',
  Vehicle:               'bg-orange-100 text-orange-800 border-orange-300',
  Safety:                'bg-amber-100 text-amber-800 border-amber-300',
  Entertainment:         'bg-purple-100 text-purple-800 border-purple-300',
  Costumes:              'bg-rose-100 text-rose-800 border-rose-300',
  'Food & Ingredients':  'bg-green-100 text-green-800 border-green-300',
  Other:                 'bg-black/5 text-mauve border-playa-mid',
}

const emptyAddForm = {
  name: '',
  category: 'Camp Essentials' as GearCategory,
  quantity: '1',
  assignedTo: '',
  notes: '',
}

type SortCol = 'name' | 'category' | 'quantity' | 'assignedTo' | null

// ── Gear Item Modal (mobile add / edit) ───────────────────────────────────────

function GearItemModal({
  onClose,
  onSave,
  initial,
}: {
  onClose: () => void
  onSave: (item: Omit<GearItem, 'id' | 'packed'>) => void
  initial?: GearItem
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    category: initial?.category ?? ('Camp Essentials' as GearCategory),
    quantity: String(initial?.quantity ?? '1'),
    assignedTo: initial?.assignedTo ?? '',
    notes: initial?.notes ?? '',
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-md mx-0 md:mx-4 p-6 rounded-b-none md:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl text-plum">{initial ? 'Edit Item' : 'New Gear Item'}</h2>
          <button onClick={onClose} className="text-mauve hover:text-plum transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3">
          <input
            className="input w-full"
            placeholder="Item name *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
          <select
            className="select"
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value as GearCategory })}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="1"
              className="input"
              placeholder="Qty"
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
            />
            <select
              className="select"
              value={form.assignedTo}
              onChange={e => setForm({ ...form, assignedTo: e.target.value })}
            >
              <option value="">Unassigned</option>
              {CAMP_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <input
            className="input w-full"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex gap-3 justify-end pt-1">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button
              onClick={() => {
                if (!form.name) return
                onSave({
                  name: form.name,
                  category: form.category,
                  quantity: parseInt(form.quantity) || 1,
                  assignedTo: form.assignedTo || undefined,
                  notes: form.notes || undefined,
                })
                onClose()
              }}
              className="btn-primary"
            >
              {initial ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GearList() {
  const { items, addItem, deleteItem, togglePacked, updateItem } = useGearStore()

  const [sortCol, setSortCol] = useState<SortCol>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<GearCategory | 'All'>('All')
  const [showAddRow, setShowAddRow] = useState(false)
  const [addForm, setAddForm] = useState(emptyAddForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<GearItem>>({})
  const [showMobileAdd, setShowMobileAdd] = useState(false)
  const [mobileEditItem, setMobileEditItem] = useState<GearItem | null>(null)

  // ── Stats ──────────────────────────────────────────────────────────────────

  const packedCount = items.filter(i => i.packed).length
  const progress = items.length > 0 ? (packedCount / items.length) * 100 : 0

  const activePeople = CAMP_MEMBERS.filter(m => items.some(i => i.assignedTo === m))
  const activeCategories = CATEGORIES.filter(cat => items.some(i => i.category === cat))

  const personBreakdown = activePeople.map(person => ({
    person,
    total: items.filter(i => i.assignedTo === person).length,
    packed: items.filter(i => i.assignedTo === person && i.packed).length,
  }))

  // ── Filter + sort ──────────────────────────────────────────────────────────

  const q = search.toLowerCase()
  let filtered = items.filter(i => {
    const matchSearch = !q || i.name.toLowerCase().includes(q) || (i.notes?.toLowerCase().includes(q) ?? false)
    const matchCat = categoryFilter === 'All' || i.category === categoryFilter
    return matchSearch && matchCat
  })

  if (sortCol) {
    filtered = [...filtered].sort((a, b) => {
      let av: string | number = ''
      let bv: string | number = ''
      if (sortCol === 'name')       { av = a.name;             bv = b.name }
      if (sortCol === 'category')   { av = a.category;         bv = b.category }
      if (sortCol === 'quantity')   { av = a.quantity;         bv = b.quantity }
      if (sortCol === 'assignedTo') { av = a.assignedTo ?? ''; bv = b.assignedTo ?? '' }
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function handleAddSave() {
    if (!addForm.name) return
    addItem({
      name: addForm.name,
      category: addForm.category,
      quantity: parseInt(addForm.quantity) || 1,
      assignedTo: addForm.assignedTo || undefined,
      notes: addForm.notes || undefined,
      packed: false,
    })
    setAddForm(emptyAddForm)
    setShowAddRow(false)
  }

  function startEdit(item: GearItem) {
    setEditingId(item.id)
    setEditForm({ ...item })
  }

  function handleEditSave() {
    if (!editingId || !editForm.name) return
    updateItem(editingId, editForm)
    setEditingId(null)
    setEditForm({})
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  // ── Shared styles ──────────────────────────────────────────────────────────

  const thBase = 'px-3 py-2.5 text-left text-xs font-bold text-mauve/50 uppercase tracking-wider whitespace-nowrap'
  const thSortable = thBase + ' cursor-pointer hover:text-mauve select-none transition-colors'
  const cellInput = 'w-full bg-playa-mid/60 border border-playa-mid rounded px-2 py-1 text-xs text-plum placeholder-mauve/40 focus:outline-none focus:border-neon/50 focus:bg-playa-mid/80'

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
          {col && (sortCol === col ? (
            sortDir === 'asc'
              ? <ChevronUp size={11} className="text-neon shrink-0" />
              : <ChevronDown size={11} className="text-neon shrink-0" />
          ) : (
            <ChevronUp size={11} className="opacity-20 shrink-0" />
          ))}
        </span>
      </th>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 md:mb-6 max-w-7xl mx-auto">
        <div>
          <h1 className="section-title">Gear List</h1>
          <p className="section-subtitle">Who's bringing what</p>
        </div>
        {/* Mobile: opens modal */}
        <button
          onClick={() => { setShowMobileAdd(true); setEditingId(null) }}
          className="md:hidden btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Add Item
        </button>
        {/* Desktop: shows inline row */}
        <button
          onClick={() => { setShowAddRow(true); setEditingId(null) }}
          className="hidden md:flex btn-primary items-center gap-2"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {/* Summary row */}
      <div className="grid md:grid-cols-[220px_1fr] gap-4 mb-6 max-w-7xl mx-auto">
        <div className="card p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <Package className="text-neon" size={14} />
            <span className="text-mauve text-xs uppercase tracking-wider font-semibold">Packing</span>
          </div>
          <div className="font-display text-4xl text-plum">
            {packedCount}
            <span className="text-xl text-mauve/40">/{items.length}</span>
          </div>
          <div className="mt-2 h-2.5 bg-playa-mid/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-neon rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-right text-xs text-mauve/50 mt-1">{Math.round(progress)}% packed</div>
        </div>

        {personBreakdown.length > 0 ? (
          <div className="card p-5">
            <h3 className="text-xs font-bold text-mauve/50 uppercase tracking-widest mb-3">By Person</h3>
            <div className="space-y-2">
              {personBreakdown.map(({ person, total, packed }) => (
                <div key={person} className="flex items-center gap-3">
                  <span className="text-xs text-plum/60 w-28 shrink-0 truncate">{person}</span>
                  <div className="flex-1 h-1.5 bg-playa-mid/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neon rounded-full transition-all duration-500"
                      style={{ width: total > 0 ? `${(packed / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs text-mauve w-12 text-right shrink-0">{packed}/{total}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-5 flex items-center justify-center">
            <p className="text-mauve/40 text-sm italic">
              Per-person breakdown will appear once you add items.
            </p>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-3 max-w-7xl mx-auto">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve/40" />
          <input
            className="input pl-8 w-full text-sm"
            placeholder="Search items, notes…"
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
              {CATEGORY_EMOJIS[cat]} {cat}
            </button>
          ))}
        </div>

        <span className="text-xs text-mauve/40 whitespace-nowrap ml-auto">
          {filtered.length} of {items.length}
        </span>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2 max-w-7xl mx-auto mb-4">
        {filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-3">🎒</div>
            <p className="text-mauve text-sm">
              {items.length === 0 ? 'No gear added yet. Start building the list!' : 'No results match your search.'}
            </p>
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className={`card p-4 flex items-start gap-3 transition-opacity ${item.packed ? 'opacity-60' : ''}`}
            >
              <button
                onClick={() => togglePacked(item.id)}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  item.packed ? 'bg-neon border-neon' : 'border-playa-mid'
                }`}
              >
                {item.packed && (
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm ${item.packed ? 'line-through text-mauve/40' : 'text-plum'}`}>
                  {item.name}
                  {item.quantity > 1 && <span className="text-mauve/60 font-normal ml-1.5">×{item.quantity}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`badge text-[10px] ${CATEGORY_STYLES[item.category]}`}>
                    {CATEGORY_EMOJIS[item.category]} {item.category}
                  </span>
                  {item.assignedTo && <span className="text-[11px] text-mauve/60">👤 {item.assignedTo}</span>}
                </div>
                {item.notes && <div className="text-xs text-plum/60 mt-1">{item.notes}</div>}
                <div className="flex gap-2 mt-2 justify-end">
                  <button
                    onClick={() => setMobileEditItem(item)}
                    className="text-xs px-3 py-1 rounded-lg border border-playa-mid text-mauve hover:text-plum transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-400 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
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
                <th className={`${thBase} w-10`} />
                <Th col="name" className="min-w-[180px]">Item</Th>
                <Th col="category" className="w-48">Category</Th>
                <Th col="quantity" className="w-16 [&>span]:justify-end">Qty</Th>
                <Th col="assignedTo" className="w-32">Assigned To</Th>
                <Th className="min-w-[180px]">Notes</Th>
                <Th className="w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-playa-mid/30">
              {/* Add row */}
              {showAddRow && (
                <tr className="bg-neon/[0.03] border-l-2 border-neon/40">
                  <td className="px-3 py-2 align-top">
                    <div className="w-5 h-5 rounded-md border-2 border-playa-mid mt-0.5" />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input
                      className={cellInput}
                      placeholder="Item name *"
                      value={addForm.name}
                      onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleAddSave()}
                      autoFocus
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <select
                      className={cellInput}
                      value={addForm.category}
                      onChange={e => setAddForm({ ...addForm, category: e.target.value as GearCategory })}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input
                      type="number"
                      min="1"
                      className={cellInput + ' text-right'}
                      value={addForm.quantity}
                      onChange={e => setAddForm({ ...addForm, quantity: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <select
                      className={cellInput}
                      value={addForm.assignedTo}
                      onChange={e => setAddForm({ ...addForm, assignedTo: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {CAMP_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <input
                      className={cellInput}
                      placeholder="Notes"
                      value={addForm.notes}
                      onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
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

              {/* Empty state */}
              {filtered.length === 0 && !showAddRow ? (
                <tr>
                  <td colSpan={7} className="px-3 py-16 text-center">
                    <div className="text-4xl mb-3">🎒</div>
                    <p className="text-mauve text-sm">
                      {items.length === 0
                        ? 'No gear added yet. Start building the list!'
                        : 'No results match your search.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map(item => {
                  const isEditing = editingId === item.id
                  return (
                    <tr
                      key={item.id}
                      className={`group transition-colors ${
                        isEditing
                          ? 'bg-neon/[0.03] border-l-2 border-neon/40'
                          : item.packed
                          ? 'opacity-60 hover:opacity-80 hover:bg-playa-light/10'
                          : 'hover:bg-playa-light/20'
                      }`}
                    >
                      {/* Packed checkbox */}
                      <td className="px-3 py-2.5 align-top">
                        <button
                          onClick={() => togglePacked(item.id)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            item.packed ? 'bg-neon border-neon' : 'border-playa-mid hover:border-neon/60'
                          }`}
                        >
                          {item.packed && (
                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                              <path
                                d="M2 6l3 3 5-5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </button>
                      </td>

                      {/* Name */}
                      <td className="px-3 py-2.5 align-top">
                        {isEditing ? (
                          <input
                            className={cellInput}
                            value={editForm.name ?? ''}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            autoFocus
                          />
                        ) : (
                          <span className={`font-semibold text-sm transition-all ${item.packed ? 'line-through text-mauve/40' : 'text-plum'}`}>
                            {item.name}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-3 py-2.5 align-top">
                        {isEditing ? (
                          <select
                            className={cellInput}
                            value={editForm.category ?? item.category}
                            onChange={e => setEditForm({ ...editForm, category: e.target.value as GearCategory })}
                          >
                            {CATEGORIES.map(c => (
                              <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`badge text-xs ${CATEGORY_STYLES[item.category]}`}>
                            {CATEGORY_EMOJIS[item.category]} {item.category}
                          </span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="px-3 py-2.5 align-top text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            className={cellInput + ' text-right'}
                            value={editForm.quantity ?? item.quantity}
                            onChange={e => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })}
                          />
                        ) : (
                          <span className="text-plum/70 text-sm">×{item.quantity}</span>
                        )}
                      </td>

                      {/* Assigned To */}
                      <td className="px-3 py-2.5 align-top">
                        {isEditing ? (
                          <select
                            className={cellInput}
                            value={editForm.assignedTo ?? item.assignedTo ?? ''}
                            onChange={e => setEditForm({ ...editForm, assignedTo: e.target.value || undefined })}
                          >
                            <option value="">Unassigned</option>
                            {CAMP_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        ) : (
                          <span className="text-mauve text-xs">{item.assignedTo ?? '—'}</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="px-3 py-2.5 align-top">
                        {isEditing ? (
                          <input
                            className={cellInput}
                            placeholder="Notes"
                            value={editForm.notes ?? ''}
                            onChange={e => setEditForm({ ...editForm, notes: e.target.value || undefined })}
                          />
                        ) : (
                          <span className="text-plum/60 text-sm">{item.notes ?? ''}</span>
                        )}
                      </td>

                      {/* Actions */}
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
                              onClick={() => startEdit(item)}
                              className="p-1 text-mauve/40 hover:text-plum transition-colors"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
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

              {/* Footer */}
              {filtered.length > 0 && (
                <tr className="border-t border-playa-mid/60 bg-playa-light/20">
                  <td colSpan={6} className="px-3 py-2.5 text-xs text-mauve/40 italic">
                    {filtered.length < items.length ? `${filtered.length} filtered` : `${items.length} items`}
                    {' · '}{packedCount} packed
                  </td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showMobileAdd && (
        <GearItemModal
          onClose={() => setShowMobileAdd(false)}
          onSave={data => addItem({ ...data, packed: false })}
        />
      )}

      {mobileEditItem && (
        <GearItemModal
          initial={mobileEditItem}
          onClose={() => setMobileEditItem(null)}
          onSave={data => updateItem(mobileEditItem.id, data)}
        />
      )}
    </div>
  )
}
