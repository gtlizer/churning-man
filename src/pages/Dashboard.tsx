import { Link } from 'react-router-dom'
import { DollarSign, Calendar, Backpack, TrendingUp, Clock, Package } from 'lucide-react'
import { useExpenseStore } from '../store/expenseStore'
import { useScheduleStore } from '../store/scheduleStore'
import { useGearStore } from '../store/gearStore'

function getDaysUntilBurn() {
  const burnDate = new Date('2026-08-29T12:00:00')
  const diff = burnDate.getTime() - new Date().getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export default function Dashboard() {
  const { expenses } = useExpenseStore()
  const { events } = useScheduleStore()
  const { items } = useGearStore()

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date()).length
  const packedItems = items.filter((i) => i.packed).length
  const gearProgress = items.length > 0 ? Math.round((packedItems / items.length) * 100) : 0
  const daysUntilBurn = getDaysUntilBurn()

  return (
    <div className="p-6 flex flex-col gap-5">

      {/* ── Hero band ──────────────────────────────────────────────── */}
      <div
        className="card p-8 flex items-center justify-between gap-8 overflow-hidden relative"
      >
        {/* Decorative glow */}
        <div
          className="absolute -top-16 -left-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,45,120,0.12) 0%, transparent 70%)' }}
        />

        <div className="flex items-center gap-8 relative z-10">
          <span className="text-8xl md:text-9xl animate-float leading-none">🍦</span>
          <div>
            <h1 className="font-display text-5xl md:text-7xl text-plum tracking-wider leading-none">
              CHURNING MAN
            </h1>
            <p className="text-mauve text-lg md:text-xl mt-2">
              Ice Cream Division · Burning Man 2026
            </p>
            <p className="text-mauve/40 text-sm mt-1">
              Black Rock City, NV · Aug 29 – Sep 6
            </p>
          </div>
        </div>

        <div
          className="relative z-10 shrink-0 text-center px-10 py-6 rounded-2xl"
          style={{ background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.3)' }}
        >
          <div className="font-display text-7xl md:text-8xl text-neon leading-none">
            {daysUntilBurn}
          </div>
          <div className="text-xs text-mauve uppercase tracking-widest mt-2">Days to Churn</div>
        </div>
      </div>

      {/* ── Nav + stat cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Expenses */}
        <Link to="/expenses" className="card-hover p-7 block group flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.25)' }}
            >
              <DollarSign size={24} className="text-neon" />
            </div>
            <TrendingUp size={16} className="text-mauve/30 group-hover:text-neon/50 transition-colors mt-1" />
          </div>
          <div>
            <div className="font-display text-4xl text-plum leading-none mb-1">
              ${totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-mauve/60 text-sm">total logged</div>
          </div>
          <div>
            <h2 className="font-display text-xl text-plum mb-1">Expenses</h2>
            <p className="text-mauve/70 text-sm leading-relaxed">
              Track costs, split bills, and keep the operation solvent.
            </p>
          </div>
          <div className="text-neon text-xs font-bold uppercase tracking-wider mt-auto">
            {expenses.length} {expenses.length === 1 ? 'entry' : 'entries'} →
          </div>
        </Link>

        {/* Schedule */}
        <Link to="/schedule" className="card-hover p-7 block group flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.25)' }}
            >
              <Calendar size={24} className="text-mint" />
            </div>
            <Clock size={16} className="text-mauve/30 group-hover:text-mint/50 transition-colors mt-1" />
          </div>
          <div>
            <div className="font-display text-4xl text-plum leading-none mb-1">
              {upcomingEvents}
            </div>
            <div className="text-mauve/60 text-sm">upcoming events</div>
          </div>
          <div>
            <h2 className="font-display text-xl text-plum mb-1">Schedule</h2>
            <p className="text-mauve/70 text-sm leading-relaxed">
              Plan ice cream runs, camp setup, parties, and crew shifts.
            </p>
          </div>
          <div className="text-mint text-xs font-bold uppercase tracking-wider mt-auto">
            {events.length} {events.length === 1 ? 'event' : 'events'} →
          </div>
        </Link>

        {/* Gear */}
        <Link to="/gear" className="card-hover p-7 block group flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,107,138,0.1)', border: '1px solid rgba(255,107,138,0.25)' }}
            >
              <Backpack size={24} className="text-berry" />
            </div>
            <Package size={16} className="text-mauve/30 group-hover:text-berry/50 transition-colors mt-1" />
          </div>
          <div>
            <div className="flex items-end gap-2 leading-none mb-1">
              <span className="font-display text-4xl text-plum">{gearProgress}%</span>
              <span className="text-mauve/60 text-sm mb-0.5">packed</span>
            </div>
            {items.length > 0 && (
              <div
                className="h-1.5 rounded-full mt-2 overflow-hidden"
                style={{ background: 'rgba(255,107,138,0.15)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${gearProgress}%`, background: '#FF6B8A' }}
                />
              </div>
            )}
          </div>
          <div>
            <h2 className="font-display text-xl text-plum mb-1">Gear List</h2>
            <p className="text-mauve/70 text-sm leading-relaxed">
              Everything the truck needs — assigned, packed, and ready.
            </p>
          </div>
          <div className="text-berry text-xs font-bold uppercase tracking-wider mt-auto">
            {packedItems}/{items.length} items packed →
          </div>
        </Link>

      </div>
    </div>
  )
}
