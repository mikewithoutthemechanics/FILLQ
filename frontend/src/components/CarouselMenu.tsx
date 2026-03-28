import { motion, useMotionValue, useTransform, type PanInfo, useAnimation } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useId } from 'react'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Sparkles
} from 'lucide-react'

const C = {
  g: { 800: '#2D5016', 700: '#3D6B22', 400: '#8BAA6B', 100: '#E8F0DE', 50: '#F4F8EF' },
  t: { 500: '#6B6B6B', 300: '#ABABAB' },
  b: '#E5E5E5',
  w: '#FAFAF8',
}

const tabs = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/classes', icon: Calendar, label: 'Classes' },
  { to: '/churn', icon: Users, label: 'At-Risk' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function CarouselMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const id = useId()

  const cylinderWidth = 600
  const faceCount = tabs.length
  const faceWidth = cylinderWidth / faceCount
  const dragFactor = 0.08
  const radius = cylinderWidth / (2 * Math.PI)

  const rotation = useMotionValue(0)
  const controls = useAnimation()

  // Set initial rotation to show current active tab
  const activeIndex = tabs.findIndex(t => t.to === location.pathname)

  const handleDrag = (_: unknown, info: PanInfo) => {
    rotation.set(rotation.get() + info.offset.x * dragFactor)
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const velocity = info.velocity.x * dragFactor
    controls.start({
      rotateY: rotation.get() + velocity,
      transition: { type: 'spring', stiffness: 200, damping: 30, mass: 0.5 },
    })
  }

  const transform = useTransform(rotation, (value) => `rotate3d(0, 1, 0, ${value}deg)`)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Gradient fade top */}
      <div className="h-6" style={{
        background: `linear-gradient(to bottom, transparent, ${C.w})`
      }} />

      {/* Menu bar */}
      <div className="backdrop-blur-xl border-t px-2 pb-6 pt-2"
        style={{ backgroundColor: 'rgba(250,250,248,0.95)', borderColor: C.b }}
      >
        {/* 3D Carousel */}
        <div className="relative h-[70px] w-full overflow-hidden">
          <div
            className="flex h-full items-center justify-center"
            style={{
              perspective: '800px',
              transformStyle: 'preserve-3d',
              maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
            }}
          >
            <motion.div
              animate={controls}
              className="relative flex h-full origin-center cursor-grab active:cursor-grabbing"
              drag="x"
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              style={{
                transform,
                rotateY: rotation,
                width: cylinderWidth,
                transformStyle: 'preserve-3d',
              }}
            >
              {tabs.map((tab, index) => {
                const isActive = location.pathname === tab.to ||
                  (tab.to !== '/' && location.pathname.startsWith(tab.to))

                return (
                  <div
                    className="absolute flex h-full origin-center items-center justify-center"
                    key={`${id}-${index}`}
                    style={{
                      width: `${faceWidth}px`,
                      transform: `rotateY(${index * (360 / faceCount)}deg) translateZ(${radius}px)`,
                    }}
                  >
                    <button
                      onClick={() => navigate(tab.to)}
                      className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all active:scale-90"
                      style={{
                        backgroundColor: isActive ? C.g[100] : 'transparent',
                      }}
                    >
                      <tab.icon
                        className="w-5 h-5 transition-colors"
                        style={{
                          color: isActive ? C.g[800] : C.t[300],
                          strokeWidth: isActive ? 2.2 : 1.8
                        }}
                      />
                      <span
                        className="text-[9px] font-medium transition-colors"
                        style={{
                          color: isActive ? C.g[800] : C.t[300],
                          fontFamily: "'General Sans', sans-serif",
                        }}
                      >
                        {tab.label}
                      </span>
                    </button>
                  </div>
                )
              })}
            </motion.div>
          </div>
        </div>

        {/* Swipe hint */}
        <div className="flex justify-center mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: C.b }} />
            <Sparkles className="w-3 h-3" style={{ color: C.t[300] }} />
            <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: C.b }} />
          </div>
        </div>
      </div>
    </nav>
  )
}
