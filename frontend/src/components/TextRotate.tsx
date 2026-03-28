import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

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
    <span className={`relative inline-block ${className}`} style={{ verticalAlign: 'baseline' }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={texts[index]}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-120%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="inline-block px-3.5 py-1.5 rounded-lg relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 40%, #FF6B6B 100%)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(255,107,107,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
            verticalAlign: 'baseline',
          }}
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
