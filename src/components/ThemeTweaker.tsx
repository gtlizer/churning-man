import { useState, useEffect } from 'react'
import { Palette, X, RotateCcw, Copy, Check } from 'lucide-react'

const DEFAULTS: Record<string, string> = {
  '--c-playa':       '#EDD5CC',
  '--c-playa-light': '#FFFFFF',
  '--c-playa-mid':   '#E5C5B8',
  '--c-plum':        '#2A1A18',
  '--c-mauve':       '#A08880',
  '--c-neon':        '#E8607A',
}

const LABELS: Record<string, string> = {
  '--c-playa':       'Background',
  '--c-playa-light': 'Surface',
  '--c-playa-mid':   'Borders',
  '--c-plum':        'Text',
  '--c-mauve':       'Muted',
  '--c-neon':        'Accent',
}

// Convert #RRGGBB → "R G B" for Tailwind's rgb(var(--x) / alpha) format
function toChannels(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

// Inject a <style> tag that overrides the :root CSS variables.
// This wins over the defaults in index.css via cascade order (later = wins).
function injectStyle(colors: Record<string, string>) {
  let el = document.getElementById('churning-theme') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'churning-theme'
    document.head.appendChild(el)
  }
  const lines = Object.entries(colors)
    .map(([k, v]) => `  ${k}: ${toChannels(v)};`)
    .join('\n')
  el.textContent = `:root {\n${lines}\n}`
}

export default function ThemeTweaker() {
  const [open, setOpen] = useState(false)
  const [colors, setColors] = useState<Record<string, string>>(DEFAULTS)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let initial = DEFAULTS
    try {
      const saved = localStorage.getItem('churning-man-theme-v3')
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, string>
        // Old format used "R G B" channel strings (no # prefix) — those are
        // stale dark-mode defaults. Discard and start fresh with new defaults.
        const isOldFormat = Object.values(parsed).some(v => !v.startsWith('#'))
        if (isOldFormat) {
          localStorage.removeItem('churning-man-theme-v3')
        } else {
          initial = { ...DEFAULTS, ...parsed }
        }
      }
    } catch { /* ignore */ }
    setColors(initial)
    injectStyle(initial)
  }, [])

  function set(variable: string, hex: string) {
    const next = { ...colors, [variable]: hex }
    setColors(next)
    injectStyle(next)
    localStorage.setItem('churning-man-theme-v3', JSON.stringify(next))
  }

  function reset() {
    setColors(DEFAULTS)
    injectStyle(DEFAULTS)
    localStorage.removeItem('churning-man-theme-v3')
  }

  function copy() {
    const lines = Object.entries(colors)
      .map(([k, v]) => `  ${k}: ${toChannels(v)};  /* ${v.toUpperCase()} */`)
      .join('\n')
    navigator.clipboard.writeText(`:root {\n${lines}\n}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-neon flex items-center justify-center shadow-lg hover:opacity-80 active:scale-95 transition-all"
        title="Tweak theme"
      >
        <Palette size={17} className="text-white" />
      </button>

      {open && (
        <div
          className="fixed bottom-20 right-6 z-50 w-56 rounded-2xl border p-4"
          style={{
            backgroundColor: colors['--c-playa-light'],
            borderColor: colors['--c-playa-mid'],
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-display text-lg" style={{ color: colors['--c-plum'] }}>
              Theme
            </span>
            <div className="flex gap-1">
              <button
                onClick={reset}
                title="Reset to defaults"
                className="p-1.5 rounded hover:opacity-60 transition-opacity"
              >
                <RotateCcw size={13} style={{ color: colors['--c-mauve'] }} />
              </button>
              <button
                onClick={copy}
                title="Copy CSS vars"
                className="p-1.5 rounded hover:opacity-60 transition-opacity"
              >
                {copied
                  ? <Check size={13} style={{ color: colors['--c-neon'] }} />
                  : <Copy size={13} style={{ color: colors['--c-mauve'] }} />
                }
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded hover:opacity-60 transition-opacity"
              >
                <X size={13} style={{ color: colors['--c-mauve'] }} />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {Object.keys(DEFAULTS).map((variable) => (
              <div key={variable} className="flex items-center justify-between gap-2">
                <label
                  htmlFor={`color-${variable}`}
                  className="text-xs cursor-pointer select-none"
                  style={{ color: colors['--c-mauve'] }}
                >
                  {LABELS[variable]}
                </label>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: colors['--c-mauve'] + '99' }}
                  >
                    {colors[variable].toUpperCase()}
                  </span>
                  <input
                    id={`color-${variable}`}
                    type="color"
                    value={colors[variable]}
                    onChange={(e) => set(variable, e.target.value)}
                    style={{
                      width: '28px',
                      height: '28px',
                      padding: '2px',
                      border: `1px solid ${colors['--c-playa-mid']}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: 'transparent',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {copied && (
            <p className="text-[10px] mt-3 text-center" style={{ color: colors['--c-neon'] }}>
              CSS vars copied
            </p>
          )}
        </div>
      )}
    </>
  )
}
