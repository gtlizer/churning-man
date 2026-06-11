import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, DollarSign, Calendar, Backpack, IceCreamBowl } from 'lucide-react'
import ThemeTweaker from './ThemeTweaker'
import Sprinkles from './Sprinkles'
import CowParade from './CowParade'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Camp HQ', end: true },
  { to: '/expenses', icon: DollarSign, label: 'Expenses', end: false },
  { to: '/schedule', icon: Calendar, label: 'Schedule', end: false },
  { to: '/gear', icon: Backpack, label: 'Gear', end: false },
  { to: '/inventory', icon: IceCreamBowl, label: 'Inventory', end: false },
]

export default function Layout() {
  const [showCows, setShowCows] = useState(false)

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-playa-light border-r border-playa-mid sticky top-0 h-screen">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-playa-mid">
            <div className="text-5xl mb-2 inline-block animate-float">🍦</div>
            <h1 className="font-display text-2xl text-plum leading-tight">Churning Man</h1>
            <p className="text-xs text-mauve/70 mt-0.5">BM 2026 · Ice Cream Division</p>
          </div>
          <nav className="flex-1 p-3 flex flex-col gap-1">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-neon/[0.12] text-neon border border-neon/30'
                      : 'text-mauve hover:text-plum hover:bg-playa-mid/40'
                  }`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t border-playa-mid">
            <p
              className="text-xs text-center text-mauve/40 italic cursor-pointer select-none hover:text-mauve/60 transition-colors"
              onClick={() => setShowCows(true)}
            >
              "Keep the playa creamy"
            </p>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        <Sprinkles count={35} seed={2} />
        <div className="relative z-10 flex flex-col flex-1">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-playa-light border-b border-playa-mid sticky top-0 z-10">
          <span className="text-2xl">🍦</span>
          <span className="font-display text-xl text-plum">Churning Man</span>
        </header>

        <main className="flex-1 overflow-auto pb-24 md:pb-0">
          <Outlet />
        </main>

        <ThemeTweaker />
        </div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-playa-light/95 backdrop-blur-md border-t border-playa-mid flex z-10">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${
                  isActive ? 'text-neon' : 'text-mauve/60 hover:text-mauve'
                }`
              }
            >
              <Icon size={20} />
              <span className="text-[10px] font-semibold">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      {showCows && <CowParade onDone={() => setShowCows(false)} />}
    </div>
  )
}
