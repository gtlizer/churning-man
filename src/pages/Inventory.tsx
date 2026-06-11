import { useState } from 'react'
import { Plus, Trash2, X, Minus } from 'lucide-react'
import { useInventoryStore } from '../store/inventoryStore'
import type { IceCreamItem } from '../types'

const PALETTES = [
  { from: '#FFB3C6', to: '#E8607A' },
  { from: '#FFD6A5', to: '#E07B2A' },
  { from: '#C7CEEA', to: '#5C6BC0' },
  { from: '#B5EAD7', to: '#2E9E6D' },
  { from: '#FFDAC1', to: '#D96C3E' },
  { from: '#E2D4F0', to: '#8E44AD' },
  { from: '#FFF6A5', to: '#C9A800' },
  { from: '#C9E4CA', to: '#388E3C' },
  { from: '#FFD0D0', to: '#C0392B' },
  { from: '#D0F0FF', to: '#1A7FB5' },
]

function palette(name: string) {
  const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return PALETTES[sum % PALETTES.length]
}

function flavorEmoji(name: string): string {
  const n = name.toLowerCase()
  if (/strawberr|raspberr|cherr/.test(n)) return '🍓'
  if (/choco|fudge|brownie/.test(n)) return '🍫'
  if (/lemon|lime|citrus/.test(n)) return '🍋'
  if (/mango|tropical/.test(n)) return '🥭'
  if (/mint|pistachio|matcha|green tea/.test(n)) return '🌿'
  if (/cookie|oreo|sandwich/.test(n)) return '🍪'
  if (/caramel|toffee|butterscotch/.test(n)) return '🍮'
  if (/peach|apricot/.test(n)) return '🍑'
  if (/blueberr|grape|purple/.test(n)) return '🫐'
  if (/pineapple/.test(n)) return '🍍'
  if (/coconut/.test(n)) return '🥥'
  if (/popsicle|bar|pop/.test(n)) return '🧊'
  if (/swirl|twist|soft serve/.test(n)) return '🍦'
  if (/vanilla/.test(n)) return '🍨'
  if (/watermelon/.test(n)) return '🍉'
  if (/banana/.test(n)) return '🍌'
  return '🍨'
}

const emptyForm = { name: '', quantity: '12', notes: '' }

function IceCreamCard({
  item,
  onInc,
  onDec,
  onDelete,
}: {
  item: IceCreamItem
  onInc: () => void
  onDec: () => void
  onDelete: () => void
}) {
  const p = palette(item.name)
  const emoji = flavorEmoji(item.name)

  return (
    <div className="card overflow-hidden group flex flex-col">
      {/* Art area */}
      <div
        className="flex items-center justify-center h-36 relative"
        style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
      >
        <span className="text-6xl select-none" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>
          {emoji}
        </span>
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white/80 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Info area */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <div className="font-semibold text-plum text-sm leading-snug">{item.name}</div>
          {item.notes && <div className="text-xs text-mauve/60 mt-0.5">{item.notes}</div>}
        </div>

        {/* Quantity stepper */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xs text-mauve/50 uppercase tracking-wider font-semibold">Count</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onDec}
              disabled={item.quantity <= 1}
              className="w-7 h-7 rounded-md border border-playa-mid flex items-center justify-center text-mauve hover:border-neon/60 hover:text-neon transition-colors disabled:opacity-30"
            >
              <Minus size={12} />
            </button>
            <span className="w-8 text-center font-bold text-plum tabular-nums">{item.quantity}</span>
            <button
              onClick={onInc}
              className="w-7 h-7 rounded-md border border-playa-mid flex items-center justify-center text-mauve hover:border-neon/60 hover:text-neon transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Inventory() {
  const { items, addItem, deleteItem, updateQuantity } = useInventoryStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const total = items.reduce((sum, i) => sum + i.quantity, 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return
    addItem({
      name: form.name,
      quantity: parseInt(form.quantity) || 1,
      notes: form.notes || undefined,
    })
    setForm(emptyForm)
    setShowForm(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="section-title">Ice Cream Inventory</h1>
          <p className="section-subtitle">What we're bringing to the playa</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Add Flavor
        </button>
      </div>

      {/* Total */}
      <div className="card p-5 mb-6 flex items-center gap-6">
        <div className="text-5xl font-display text-neon tabular-nums">{total}</div>
        <div>
          <div className="text-plum font-semibold">Total Ice Creams</div>
          <div className="text-mauve/50 text-xs mt-0.5">
            {items.length === 0
              ? 'No flavors yet'
              : `across ${items.length} flavor${items.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card p-5 mb-6 border-berry/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-plum">New Flavor</h2>
            <button onClick={() => setShowForm(false)} className="text-mauve hover:text-plum transition-colors">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <input
              className="input col-span-2"
              placeholder="Flavor name (e.g. Strawberry Shortcake Bars)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
            <input
              className="input"
              type="number"
              min="1"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <input
              className="input"
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Add Flavor
              </button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">🍦</div>
          <p className="text-mauve text-sm">No flavors yet. Load up the truck!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <IceCreamCard
              key={item.id}
              item={item}
              onInc={() => updateQuantity(item.id, item.quantity + 1)}
              onDec={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
              onDelete={() => deleteItem(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
