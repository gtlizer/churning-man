import { useEffect } from 'react'

const COWS = [
  { delay: 0,   duration: 7,   size: '2.4rem', bottom: 10 },
  { delay: 0.4, duration: 8,   size: '2rem',   bottom: 28 },
  { delay: 0.9, duration: 6.5, size: '2.7rem', bottom: 8  },
  { delay: 1.3, duration: 9,   size: '1.9rem', bottom: 22 },
  { delay: 1.7, duration: 7.5, size: '2.5rem', bottom: 14 },
  { delay: 2.1, duration: 8.5, size: '2.2rem', bottom: 32 },
  { delay: 2.5, duration: 6,   size: '2.8rem', bottom: 6  },
]

interface Props {
  onDone: () => void
}

export default function CowParade({ onDone }: Props) {
  useEffect(() => {
    const maxDelay = Math.max(...COWS.map(c => c.delay))
    const maxDuration = Math.max(...COWS.map(c => c.duration))
    const timer = setTimeout(onDone, (maxDelay + maxDuration) * 1000 + 200)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    >
      {COWS.map((cow, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            bottom: cow.bottom,
            left: 0,
            fontSize: cow.size,
            lineHeight: 1,
            animation: `cow-walk ${cow.duration}s linear ${cow.delay}s both, cow-bob 0.35s ease-in-out ${cow.delay}s infinite`,
            display: 'inline-block',
          }}
        >
          🐄
        </span>
      ))}
    </div>
  )
}
