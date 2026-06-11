const COLORS = [
  ['#FF8EC4', '#E8607A', '#B83058'], // rose/pink
  ['#FFB86C', '#FF8C00', '#C86000'], // orange
  ['#88E088', '#4CAF50', '#2E7D32'], // green
  ['#80D0F0', '#2196F3', '#1565C0'], // blue
  ['#D8A0E0', '#9C27B0', '#6A1B9A'], // purple
  ['#FFE066', '#FFC107', '#E68000'], // yellow
  ['#FF8A80', '#F44336', '#B71C1C'], // red
  ['#80CBCA', '#009688', '#00695C'], // teal
]

function seeded(seed: number) {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

interface SprinkleData {
  id: number
  x: number
  y: number
  rot: number
  len: number
  colors: string[]
  opacity: number
}

function buildSprinkles(count: number, seed = 0): SprinkleData[] {
  // Stratified grid: divide space into cells, one sprinkle per cell with jitter.
  // This guarantees even coverage with no clustering.
  const cols = Math.ceil(Math.sqrt(count * 1.6))
  const rows = Math.ceil(count / cols)
  const cw = 100 / cols
  const ch = 100 / rows

  return Array.from({ length: count }, (_, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const s = i + seed * 1000
    return {
      id: i,
      x: col * cw + seeded(s * 3.1 + 7)  * cw,
      y: row * ch + seeded(s * 5.7 + 13) * ch,
      rot: seeded(s * 5.1) * 360,
      len: 22 + seeded(s * 4.2) * 14,
      colors: COLORS[Math.floor(seeded(s * 6.8) * COLORS.length)],
      opacity: 0.6 + seeded(s * 1.9) * 0.3,
    }
  })
}

// viewBox 0 0 44 12  →  aspect ~3.67:1
//
// Shape: simple rounded left end → straight body → shoulder taper → small rounded right tip
// No separate dome — one continuous path, all tangent-continuous.
//
// Path trace (CW):
//   M 4  0                  start top-left
//   L 30 0                  body top ────────────────►
//   C 33 1  40 5  42.5 5    shoulder taper
//   A 1 1 0 0 1  42.5 7     small right tip arc (r=1, CW)
//   C 40 7  33 11 30  12    symmetric lower shoulder
//   L 4  12                 body bottom ◄────────────
//   Q 0 12  0 6             left rounded end (upper half)
//   Q 0  0  4 0             left rounded end (lower half)
//   Z

function SprinkleEl({ s, seed }: { s: SprinkleData; seed: number }) {
  const [light, mid, dark] = s.colors
  const gid = `sg-${seed}-${s.id}`

  return (
    <svg
      style={{
        position: 'absolute',
        left: `${s.x}%`,
        top: `${s.y}%`,
        width: `${s.len}px`,
        height: `${(s.len / 3.67).toFixed(1)}px`,
        transform: `rotate(${s.rot}deg)`,
        transformOrigin: 'center center',
        opacity: s.opacity,
        filter: 'drop-shadow(0 1px 2.5px rgba(0,0,0,0.22))',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      viewBox="0 0 44 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={light} />
          <stop offset="40%"  stopColor={mid} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>

      <path
        d="M 4 0 L 30 0 C 33 1 40 5 42.5 5 A 1 1 0 0 1 42.5 7 C 40 7 33 11 30 12 L 4 12 Q 0 12 0 6 Q 0 0 4 0 Z"
        fill={`url(#${gid})`}
      />

      {/* Specular gloss stripe across upper body */}
      <ellipse cx="18" cy="2" rx="14" ry="1.8" fill="rgba(255,255,255,0.44)" />
    </svg>
  )
}

interface Props {
  count?: number
  seed?: number
  className?: string
}

export default function Sprinkles({ count = 50, seed = 0, className = '' }: Props) {
  const sprinkles = buildSprinkles(count, seed)
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {sprinkles.map(s => <SprinkleEl key={s.id} s={s} seed={seed} />)}
    </div>
  )
}
