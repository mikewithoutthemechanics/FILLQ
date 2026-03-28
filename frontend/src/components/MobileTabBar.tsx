import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings
} from 'lucide-react'

const C = {
  g: { 800: '#2D5016', 50: '#F4F8EF' },
  t: { 500: '#6B6B6B', 300: '#ABABAB' },
  b: '#E5E5E5',
  w: '#FAFAF8',
}

const font = { display: "'DM Serif Display', serif", body: "'General Sans', 'Satoshi', sans-serif" }

const tabs = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/classes', icon: Calendar, label: 'Classes' },
  { to: '/churn', icon: Users, label: 'At-Risk' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function MobileTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t"
      style={{ backgroundColor: 'rgba(250,250,248,0.95)', borderColor: C.b }}
    >
      <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl transition-all min-w-[64px]`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? C.g[50] : 'transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <tab.icon
                  className="w-5 h-5 transition-colors"
                  style={{ color: isActive ? C.g[800] : C.t[300] }}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span
                  className="text-[10px] font-medium transition-colors"
                  style={{
                    color: isActive ? C.g[800] : C.t[300],
                    fontFamily: font.body,
                  }}
                >
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
