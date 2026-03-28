import { motion, useMotionValue, useTransform, type PanInfo, useAnimation } from 'framer-motion'
import { useId } from 'react'
import { Zap, MessageCircle, Shield, BarChart3, Users, Clock, Heart, TrendingUp } from 'lucide-react'

const C = {
  g: { 800: '#2D5016', 700: '#3D6B22', 400: '#8BAA6B', 100: '#E8F0DE', 50: '#F4F8EF' },
  b: '#E5E5E5',
}

const icons = [Zap, MessageCircle, Shield, BarChart3, Users, Clock, Heart, TrendingUp]

export default function CylindricalCarousel() {
  const cylinderWidth = 1200
  const faceCount = icons.length
  const faceWidth = cylinderWidth / faceCount
  const dragFactor = 0.05
  const radius = cylinderWidth / (2 * Math.PI)

  const rotation = useMotionValue(0)
  const controls = useAnimation()
  const id = useId()

  const handleDrag = (_: unknown, info: PanInfo) => {
    rotation.set(rotation.get() + info.offset.x * dragFactor)
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    controls.start({
      rotateY: rotation.get() + info.velocity.x * dragFactor,
      transition: { type: 'spring', stiffness: 100, damping: 30, mass: 0.1 },
    })
  }

  const transform = useTransform(rotation, (value) => `rotate3d(0, 1, 0, ${value}deg)`)

  return (
    <div className="relative h-[180px] w-full overflow-hidden select-none">
      <div
        className="flex h-full items-center justify-center"
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
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
          {icons.map((Icon, index) => (
            <div
              className="absolute flex h-full origin-center items-center justify-center"
              key={`face-${id}-${index}`}
              style={{
                width: `${faceWidth}px`,
                transform: `rotateY(${index * (360 / faceCount)}deg) translateZ(${radius}px)`,
              }}
            >
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl transition-transform hover:scale-110"
                style={{
                  backgroundColor: C.g[50],
                  border: `1px solid ${C.b}`,
                  boxShadow: '0 2px 16px rgba(45,80,22,0.06)',
                }}
              >
                <Icon className="w-8 h-8 transition-transform hover:scale-150" style={{ color: C.g[800] }} />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
