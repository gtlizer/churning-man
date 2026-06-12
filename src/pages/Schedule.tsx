import { useState, useRef, useEffect } from 'react'
import { Plus, X, Trash2, List, LayoutGrid } from 'lucide-react'
import { useScheduleStore } from '../store/scheduleStore'
import type { ScheduleEvent, EventCategory } from '../types'
import { CAMP_MEMBERS } from '../constants/campMembers'

// ── Constants ────────────────────────────────────────────────────────────────

const BURN_DAYS: Date[] = (() => {
  const days: Date[] = []
  let d = new Date('2026-08-29T12:00:00')
  const end = new Date('2026-09-06T12:00:00')
  while (d <= end) {
    days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
})()

const HOUR_HEIGHT = 64
const START_HOUR = 0
const END_HOUR = 24
const TOTAL_HOURS = END_HOUR - START_HOUR

const CATEGORIES: EventCategory[] = [
  'Ice Cream Run', 'Camp Setup', 'Party', 'Meeting', 'Maintenance', 'Other',
]

const CAT_COLOR: Record<EventCategory, { bg: string; border: string; text: string }> = {
  'Ice Cream Run': { bg: 'rgba(255,45,120,0.12)',  border: '#FF2D78', text: '#B01050' },
  'Camp Setup':   { bg: 'rgba(249,115,22,0.12)',  border: '#F97316', text: '#B33B08' },
  'Party':        { bg: 'rgba(168,85,247,0.12)',  border: '#A855F7', text: '#7018CC' },
  'Meeting':      { bg: 'rgba(59,130,246,0.12)',  border: '#3B82F6', text: '#1540A0' },
  'Maintenance':  { bg: 'rgba(245,158,11,0.12)',  border: '#F59E0B', text: '#896000' },
  'Other':        { bg: 'rgba(0,0,0,0.04)',        border: '#C0A0B8', text: '#9B7090' },
}

const CAT_EMOJI: Record<EventCategory, string> = {
  'Ice Cream Run': '🍦', 'Camp Setup': '⛺', 'Party': '🎉',
  'Meeting': '📋', 'Maintenance': '🔧', 'Other': '📌',
}

const TABS = ['General', ...CAMP_MEMBERS]

// ── Helpers ──────────────────────────────────────────────────────────────────

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function gridOffset(t: string): number {
  const min = toMin(t)
  return (min < START_HOUR * 60 ? min + 24 * 60 : min) - START_HOUR * 60
}

function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function hourLabel(h: number): string {
  if (h === 0 || h === 24) return '12a'
  if (h < 12) return `${h}a`
  if (h === 12) return '12p'
  return `${h - 12}p`
}

function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + 60
  const eh = Math.floor(total / 60) % 24
  const em = total % 60
  return `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`
}

// ── Event layout (greedy column packing) ─────────────────────────────────────

type EventLayout = { event: ScheduleEvent; col: number; numCols: number }

function layoutDay(events: ScheduleEvent[]): EventLayout[] {
  const sorted = [...events].sort(
    (a, b) => gridOffset(a.startTime) - gridOffset(b.startTime)
  )
  const result: EventLayout[] = []

  const groups: ScheduleEvent[][] = []
  for (const ev of sorted) {
    const s = gridOffset(ev.startTime)
    const e = ev.endTime ? gridOffset(ev.endTime) : s + 60
    const g = groups.find(group =>
      group.some(ge => {
        const gs = gridOffset(ge.startTime)
        const ge2 = ge.endTime ? gridOffset(ge.endTime) : gs + 60
        return s < ge2 && e > gs
      })
    )
    if (g) g.push(ev)
    else groups.push([ev])
  }

  for (const group of groups) {
    const cols: ScheduleEvent[][] = []
    for (const ev of group) {
      const s = gridOffset(ev.startTime)
      let placed = false
      for (let c = 0; c < cols.length; c++) {
        const last = cols[c][cols[c].length - 1]
        const lastEnd = last.endTime
          ? gridOffset(last.endTime)
          : gridOffset(last.startTime) + 60
        if (s >= lastEnd) { cols[c].push(ev); placed = true; break }
      }
      if (!placed) cols.push([ev])
    }
    cols.forEach((col, colIdx) =>
      col.forEach(ev => result.push({ event: ev, col: colIdx, numCols: cols.length }))
    )
  }
  return result
}

// ── EventBlock ────────────────────────────────────────────────────────────────

function EventBlock({
  layout,
  onDelete,
  onEventClick,
}: {
  layout: EventLayout
  onDelete: (id: string) => void
  onEventClick: (event: ScheduleEvent) => void
}) {
  const { event, col, numCols } = layout
  const c = CAT_COLOR[event.category]
  const startOff = gridOffset(event.startTime)
  const endOff = event.endTime ? gridOffset(event.endTime) : startOff + 60
  const top = (startOff / 60) * HOUR_HEIGHT
  const height = Math.max(((endOff - startOff) / 60) * HOUR_HEIGHT, 22)
  const tiny = height < 38

  return (
    <div
      className="absolute rounded overflow-hidden group cursor-pointer select-none"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `calc(${(col / numCols) * 100}% + 2px)`,
        width: `calc(${(1 / numCols) * 100}% - 4px)`,
        backgroundColor: c.bg,
        borderLeft: `3px solid ${c.border}`,
      }}
      onClick={() => onEventClick(event)}
      onDoubleClick={e => e.stopPropagation()}
    >
      <div className="px-1.5 py-0.5 h-full flex flex-col overflow-hidden">
        <div
          className={`font-semibold leading-tight truncate ${tiny ? 'text-[10px]' : 'text-xs'}`}
          style={{ color: c.text }}
        >
          {!tiny && <span className="mr-0.5">{CAT_EMOJI[event.category]}</span>}
          {event.title}
        </div>
        {!tiny && (
          <div
            className="text-[10px] leading-tight truncate"
            style={{ color: c.text, opacity: 0.75 }}
          >
            {fmtTime(event.startTime)}
            {event.endTime ? ` – ${fmtTime(event.endTime)}` : ''}
          </div>
        )}
        {!tiny && event.theme && (
          <div
            className="text-[10px] leading-tight truncate italic mt-0.5"
            style={{ color: c.text, opacity: 0.65 }}
          >
            🎭 {event.theme}
          </div>
        )}
        {!tiny && event.assignedTo && event.assignedTo.length > 0 && (
          <div
            className="text-[10px] leading-tight truncate"
            style={{ color: c.text, opacity: 0.55 }}
          >
            → {event.assignedTo.join(', ')}
          </div>
        )}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(event.id) }}
        className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity text-plum/40 text-xs leading-none"
      >
        ×
      </button>
    </div>
  )
}

// ── AddEventModal ─────────────────────────────────────────────────────────────

const emptyForm = {
  title: '',
  date: '2026-08-29',
  startTime: '12:00',
  endTime: '13:00',
  location: '',
  description: '',
  theme: '',
  bits: '',
  category: 'Ice Cream Run' as EventCategory,
  assignedTo: [] as string[],
}

function AddEventModal({
  onClose,
  onSubmit,
  activeTab,
  initialDate,
  initialStartTime,
}: {
  onClose: () => void
  onSubmit: (e: Omit<ScheduleEvent, 'id'>) => void
  activeTab: string
  initialDate?: string
  initialStartTime?: string
}) {
  const [form, setForm] = useState({
    ...emptyForm,
    date: initialDate || emptyForm.date,
    startTime: initialStartTime || emptyForm.startTime,
    endTime: initialStartTime ? addOneHour(initialStartTime) : emptyForm.endTime,
    assignedTo: activeTab === 'General' ? [] as string[] : [activeTab],
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.date || !form.startTime) return
    onSubmit({
      title: form.title,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime || undefined,
      location: form.location || undefined,
      description: form.description || undefined,
      theme: form.theme || undefined,
      bits: form.bits || undefined,
      category: form.category,
      assignedTo: form.assignedTo.length > 0 ? form.assignedTo : undefined,
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
          <h2 className="font-display text-2xl text-plum">New Event</h2>
          <button onClick={onClose} className="text-mauve hover:text-plum transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="input"
            placeholder="Event title *"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required
            autoFocus
          />
          <select
            className="select"
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value as EventCategory })}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{CAT_EMOJI[cat]} {cat}</option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <select
              className="select"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
            >
              {BURN_DAYS.map(d => (
                <option key={isoDate(d)} value={isoDate(d)}>
                  {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="time"
              value={form.startTime}
              onChange={e => setForm({ ...form, startTime: e.target.value })}
              required
            />
            <input
              className="input"
              type="time"
              value={form.endTime}
              onChange={e => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-mauve mb-2">👤 Assign To</p>
            <div className="flex flex-wrap gap-1.5">
              {CAMP_MEMBERS.map(m => {
                const selected = form.assignedTo.includes(m)
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({
                      ...form,
                      assignedTo: selected
                        ? form.assignedTo.filter(p => p !== m)
                        : [...form.assignedTo, m],
                    })}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      selected
                        ? 'bg-neon/10 border-neon/30 text-neon font-semibold'
                        : 'border-playa-mid text-mauve/60 hover:text-mauve hover:border-mauve/40'
                    }`}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>
          <input
            className="input"
            placeholder="📍 Location (optional)"
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
          />

          <div className="border-t border-black/10 pt-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mauve mb-2">Shift Details</p>
          </div>

          <input
            className="input"
            placeholder="🎭 Theme (e.g. Disco Cones, Space Cowboys…)"
            value={form.theme}
            onChange={e => setForm({ ...form, theme: e.target.value })}
          />
          <textarea
            className="input resize-none"
            placeholder="🎪 Bits / performance notes (one per line)"
            rows={3}
            value={form.bits}
            onChange={e => setForm({ ...form, bits: e.target.value })}
          />
          <textarea
            className="input resize-none"
            placeholder="📝 General notes (optional)"
            rows={2}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />

          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── EventDetailModal ──────────────────────────────────────────────────────────

function EventDetailModal({
  event,
  onClose,
  onDelete,
  onUpdate,
}: {
  event: ScheduleEvent
  onClose: () => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<ScheduleEvent>) => void
}) {
  const [form, setForm] = useState({
    title: event.title,
    category: event.category,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime || '',
    location: event.location || '',
    assignedTo: event.assignedTo || ([] as string[]),
    theme: event.theme || '',
    bits: event.bits || '',
    description: event.description || '',
  })

  const c = CAT_COLOR[form.category]

  function handleSave() {
    onUpdate(event.id, {
      title: form.title,
      category: form.category,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime || undefined,
      location: form.location || undefined,
      assignedTo: form.assignedTo.length > 0 ? form.assignedTo : undefined,
      theme: form.theme || undefined,
      bits: form.bits || undefined,
      description: form.description || undefined,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-md mx-4 p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Colored header with editable title + category */}
        <div
          className="px-5 py-4 shrink-0"
          style={{ borderLeft: `4px solid ${c.border}`, backgroundColor: c.bg }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value as EventCategory })}
                className="text-[10px] font-bold uppercase tracking-widest bg-transparent border-0 cursor-pointer mb-1 focus:outline-none"
                style={{ color: c.text }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{CAT_EMOJI[cat]} {cat}</option>
                ))}
              </select>
              <input
                className="font-display text-2xl text-plum leading-tight bg-transparent w-full border-0 border-b border-transparent focus:outline-none focus:border-plum/20 transition-colors"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Event title"
              />
            </div>
            <div className="flex gap-1 shrink-0 mt-0.5">
              <button
                onClick={() => { onDelete(event.id); onClose() }}
                className="p-1.5 rounded text-red-400 hover:text-red-600 transition-colors"
                title="Delete event"
              >
                <Trash2 size={14} />
              </button>
              <button onClick={onClose} className="p-1.5 rounded text-mauve hover:text-plum transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Editable body — all fields */}
        <div className="p-5 space-y-3 overflow-y-auto">
          {/* Date + times */}
          <div className="grid grid-cols-3 gap-2">
            <select
              className="select text-xs"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
            >
              {BURN_DAYS.map(d => (
                <option key={isoDate(d)} value={isoDate(d)}>
                  {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="time"
              value={form.startTime}
              onChange={e => setForm({ ...form, startTime: e.target.value })}
            />
            <input
              className="input"
              type="time"
              value={form.endTime}
              onChange={e => setForm({ ...form, endTime: e.target.value })}
            />
          </div>

          <input
            className="input w-full"
            placeholder="📍 Location (optional)"
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
          />

          {/* Assign To chips */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-mauve mb-2">👤 Assign To</p>
            <div className="flex flex-wrap gap-1.5">
              {CAMP_MEMBERS.map(m => {
                const selected = form.assignedTo.includes(m)
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({
                      ...form,
                      assignedTo: selected
                        ? form.assignedTo.filter(p => p !== m)
                        : [...form.assignedTo, m],
                    })}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      selected
                        ? 'bg-neon/10 border-neon/30 text-neon font-semibold'
                        : 'border-playa-mid text-mauve/60 hover:text-mauve hover:border-mauve/40'
                    }`}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-black/10 pt-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mauve mb-2">Shift Details</p>
          </div>

          <input
            className="input w-full"
            placeholder="🎭 Theme (e.g. Disco Cones, Space Cowboys…)"
            value={form.theme}
            onChange={e => setForm({ ...form, theme: e.target.value })}
          />
          <textarea
            className="input w-full resize-none"
            placeholder="🎪 Bits / performance notes (one per line)"
            rows={3}
            value={form.bits}
            onChange={e => setForm({ ...form, bits: e.target.value })}
          />
          <textarea
            className="input w-full resize-none"
            placeholder="📝 General notes (optional)"
            rows={2}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />

          <div className="flex gap-3 justify-end pt-1">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} className="btn-primary">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── CalendarGrid ──────────────────────────────────────────────────────────────

function CalendarGrid({
  events,
  onDelete,
  onEventClick,
  onSlotDoubleClick,
  days = BURN_DAYS,
  scrollHeight = 'calc(100vh - 210px)',
}: {
  events: ScheduleEvent[]
  onDelete: (id: string) => void
  onEventClick: (event: ScheduleEvent) => void
  onSlotDoubleClick: (date: string, startTime: string) => void
  days?: Date[]
  scrollHeight?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - START_HOUR) * HOUR_HEIGHT
    }
  }, [])

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i)
  const today = isoDate(new Date())

  const byDay = new Map<string, ScheduleEvent[]>()
  for (const day of days) byDay.set(isoDate(day), [])
  for (const ev of events) {
    byDay.get(ev.date)?.push(ev)
  }

  function handleDayDoubleClick(e: React.MouseEvent<HTMLDivElement>, date: string) {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const minutesFromStart = Math.round((y / HOUR_HEIGHT) * 60 / 15) * 15
    const totalMin = START_HOUR * 60 + minutesFromStart
    if (totalMin >= END_HOUR * 60) return
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    onSlotDoubleClick(date, `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
  }

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(0,0,0,0.07)', background: 'rgb(var(--c-playa))' }}
    >
      {/* Day header row — sticky */}
      <div
        className="flex shrink-0"
        style={{
          background: 'rgb(var(--c-playa-light))',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ width: 52, minWidth: 52 }} />
        {days.map(d => {
          const key = isoDate(d)
          const isToday = key === today
          const weekend = d.getDay() === 0 || d.getDay() === 6
          return (
            <div
              key={key}
              className="flex-1 py-2 text-center border-l"
              style={{ borderColor: 'rgba(0,0,0,0.07)', minWidth: 88 }}
            >
              <div
                className="text-[10px] uppercase tracking-widest font-bold"
                style={{ color: weekend ? '#FF2D78' : 'rgba(155,112,144,0.7)' }}
              >
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="mt-0.5 flex justify-center">
                <span
                  className="text-base font-bold leading-none w-7 h-7 flex items-center justify-center rounded-full"
                  style={{
                    background: isToday ? '#FF2D78' : 'transparent',
                    color: isToday ? '#fff' : weekend ? '#C0105C' : 'rgba(26,8,32,0.75)',
                  }}
                >
                  {d.getDate()}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Scrollable time body */}
      <div
        ref={scrollRef}
        className="overflow-y-auto overflow-x-auto"
        style={{ height: scrollHeight }}
      >
        <div
          className="flex relative"
          style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
        >
          {/* Time gutter */}
          <div className="relative shrink-0" style={{ width: 52, minWidth: 52 }}>
            {hours.map(h => (
              <div
                key={h}
                className="absolute text-right font-mono text-[10px]"
                style={{
                  top: `${(h - START_HOUR) * HOUR_HEIGHT - 7}px`,
                  right: 6,
                  color: 'rgba(155,112,144,0.5)',
                  lineHeight: 1,
                }}
              >
                {hourLabel(h)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map(d => {
            const key = isoDate(d)
            const dayEvents = byDay.get(key) || []
            const layouts = layoutDay(dayEvents)
            return (
              <div
                key={key}
                className="flex-1 relative border-l"
                style={{ borderColor: 'rgba(0,0,0,0.07)', minWidth: 88 }}
                onDoubleClick={e => handleDayDoubleClick(e, key)}
              >
                {/* Hour lines */}
                {hours.map(h => (
                  <div
                    key={h}
                    className="absolute left-0 right-0"
                    style={{
                      top: `${(h - START_HOUR) * HOUR_HEIGHT}px`,
                      borderTop: '1px solid rgba(0,0,0,0.05)',
                    }}
                  />
                ))}
                {/* Half-hour lines */}
                {hours.map(h => (
                  <div
                    key={`${h}h`}
                    className="absolute left-0 right-0"
                    style={{
                      top: `${(h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px`,
                      borderTop: '1px solid rgba(0,0,0,0.03)',
                    }}
                  />
                ))}
                {/* Events */}
                {layouts.map(layout => (
                  <EventBlock
                    key={layout.event.id}
                    layout={layout}
                    onDelete={onDelete}
                    onEventClick={onEventClick}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Usage hint */}
      <div
        className="text-center py-1.5 text-[10px] shrink-0"
        style={{ color: 'rgba(155,112,144,0.4)', borderTop: '1px solid rgba(0,0,0,0.04)' }}
      >
        {days.length === 1
          ? 'Double-tap a time slot to add an event · Tap an event for details'
          : 'Double-click any time slot to create an event · Click an event to view & edit details'}
      </div>
    </div>
  )
}

// ── AgendaView ────────────────────────────────────────────────────────────────

function AgendaView({
  events,
  days,
  onEventClick,
  onDelete,
  onAddForDay,
}: {
  events: ScheduleEvent[]
  days: Date[]
  onEventClick: (event: ScheduleEvent) => void
  onDelete: (id: string) => void
  onAddForDay: (date: string) => void
}) {
  const today = isoDate(new Date())

  return (
    <div className="overflow-y-auto" style={{ height: 'calc(100dvh - 220px)' }}>
      <div className="space-y-5 pb-4">
        {days.map(d => {
          const key = isoDate(d)
          const isToday = key === today
          const weekend = d.getDay() === 0 || d.getDay() === 6
          const dayEvents = events
            .filter(e => e.date === key)
            .sort((a, b) => toMin(a.startTime) - toMin(b.startTime))

          return (
            <div key={key}>
              {/* Day header */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                  style={{
                    background: isToday ? '#FF2D78' : weekend ? 'rgba(255,45,120,0.1)' : 'rgba(0,0,0,0.05)',
                    color: isToday ? '#fff' : weekend ? '#C0105C' : 'rgba(26,8,32,0.75)',
                  }}
                >
                  {d.getDate()}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: weekend ? '#FF2D78' : 'rgba(155,112,144,0.7)' }}
                  >
                    {d.toLocaleDateString('en-US', { weekday: 'long' })}
                  </div>
                  <div className="text-[11px] text-mauve/50">
                    {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <button
                  onClick={() => onAddForDay(key)}
                  className="p-2 rounded-xl text-mauve/50 hover:text-neon hover:bg-neon/10 transition-colors shrink-0"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Event cards */}
              {dayEvents.length === 0 ? (
                <div className="text-xs italic px-3 py-2" style={{ color: 'rgba(155,112,144,0.3)' }}>
                  No events
                </div>
              ) : (
                <div className="space-y-2">
                  {dayEvents.map(ev => {
                    const c = CAT_COLOR[ev.category]
                    return (
                      <div
                        key={ev.id}
                        className="card p-3 flex items-start gap-3 cursor-pointer active:opacity-70 transition-opacity"
                        style={{ borderLeft: `3px solid ${c.border}` }}
                        onClick={() => onEventClick(ev)}
                      >
                        <div className="text-lg leading-none mt-0.5 shrink-0">
                          {CAT_EMOJI[ev.category]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-plum leading-snug">
                            {ev.title}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: c.text }}>
                            {fmtTime(ev.startTime)}
                            {ev.endTime ? ` – ${fmtTime(ev.endTime)}` : ''}
                            {ev.assignedTo && ev.assignedTo.length > 0 && (
                              <span className="text-mauve/60"> · {ev.assignedTo.join(', ')}</span>
                            )}
                          </div>
                          {ev.theme && (
                            <div className="text-xs text-mauve/50 italic mt-0.5">🎭 {ev.theme}</div>
                          )}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); onDelete(ev.id) }}
                          className="p-1.5 text-mauve/25 hover:text-red-400 transition-colors shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Schedule page ─────────────────────────────────────────────────────────────

export default function Schedule() {
  const { events, addEvent, deleteEvent, updateEvent } = useScheduleStore()
  const [activeTab, setActiveTab] = useState('General')
  const [showForm, setShowForm] = useState(false)
  const [newEventSlot, setNewEventSlot] = useState<{ date: string; startTime: string } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)
  const [mobileView, setMobileView] = useState<'agenda' | 'grid'>('agenda')

  const visibleEvents =
    activeTab === 'General'
      ? events
      : events.filter(e => e.assignedTo?.includes(activeTab) ?? false)

  function handleSlotDoubleClick(date: string, startTime: string) {
    setNewEventSlot({ date, startTime })
    setShowForm(true)
  }

  function handleModalClose() {
    setShowForm(false)
    setNewEventSlot(null)
  }

  function handleAddForDay(date: string) {
    setNewEventSlot({ date, startTime: '12:00' })
    setShowForm(true)
  }

  return (
    <div className="flex flex-col p-4 gap-3">
      {/* Page header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-display text-3xl text-plum leading-none">Schedule</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(155,112,144,0.7)' }}>
            Burning Man 2026 · Aug 29 – Sep 6
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile view toggle */}
          <div className="md:hidden flex items-center rounded-xl p-0.5 gap-0.5" style={{ background: 'rgba(0,0,0,0.06)' }}>
            <button
              onClick={() => setMobileView('agenda')}
              className="p-2 rounded-lg transition-all"
              style={{
                background: mobileView === 'agenda' ? 'rgb(var(--c-playa-light))' : 'transparent',
                color: mobileView === 'agenda' ? 'rgb(var(--c-plum))' : 'rgba(155,112,144,0.5)',
                boxShadow: mobileView === 'agenda' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setMobileView('grid')}
              className="p-2 rounded-lg transition-all"
              style={{
                background: mobileView === 'grid' ? 'rgb(var(--c-playa-light))' : 'transparent',
                color: mobileView === 'grid' ? 'rgb(var(--c-plum))' : 'rgba(155,112,144,0.5)',
                boxShadow: mobileView === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <LayoutGrid size={15} />
            </button>
          </div>
          <button
            onClick={() => { setNewEventSlot(null); setShowForm(true) }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add Event</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 overflow-x-auto shrink-0 pb-0.5"
        style={{ scrollbarWidth: 'none' }}
      >
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0"
            style={{
              background: activeTab === tab ? '#FF2D78' : 'rgba(0,0,0,0.05)',
              color: activeTab === tab ? '#fff' : 'rgba(155,112,144,0.85)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Mobile views */}
      <div className="md:hidden">
        {mobileView === 'agenda' ? (
          <AgendaView
            events={visibleEvents}
            days={BURN_DAYS}
            onEventClick={setSelectedEvent}
            onDelete={deleteEvent}
            onAddForDay={handleAddForDay}
          />
        ) : (
          <CalendarGrid
            events={visibleEvents}
            onDelete={deleteEvent}
            onEventClick={setSelectedEvent}
            onSlotDoubleClick={handleSlotDoubleClick}
            scrollHeight="calc(100dvh - 230px)"
          />
        )}
      </div>

      {/* Desktop calendar (full week) */}
      <div className="hidden md:block">
        <CalendarGrid
          events={visibleEvents}
          onDelete={deleteEvent}
          onEventClick={setSelectedEvent}
          onSlotDoubleClick={handleSlotDoubleClick}
        />
      </div>

      {showForm && (
        <AddEventModal
          onClose={handleModalClose}
          onSubmit={addEvent}
          activeTab={activeTab}
          initialDate={newEventSlot?.date}
          initialStartTime={newEventSlot?.startTime}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={deleteEvent}
          onUpdate={updateEvent}
        />
      )}
    </div>
  )
}
