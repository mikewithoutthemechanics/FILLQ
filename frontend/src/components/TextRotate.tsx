import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const C = {
  g: { 800: '#2D5016', 700: '#3D6B22', 400: '#8BAA6B', 200: '#D4E4C8', 100: '#E8F0DE', 50: '#F4F8EF' },
  a: { 700: '#7D4E37', 600: '#C67B5C' },
}

interface TextRotateProps {
  texts: string[]
  interval?: number
  className?: string
}

export default function TextRotate({ texts, interval = 2200, className = '' }: TextRotateProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length)
    }, interval)
    return () => clearInterval(timer)
  }, [texts.length, interval])

  return (
    <span className={`relative inline-block ${className}`}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={texts[index]}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-120%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="inline-block px-3 py-1 rounded-lg"
          style={{
            backgroundColor: C.a[700],
            color: '#fff',
          }}
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
