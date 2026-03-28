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
    <span className={className} style={{ position: 'relative', display: 'inline', whiteSpace: 'nowrap' }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={texts[index]}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-120%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          style={{
            display: 'inline',
            padding: '0.08em 0.2em',
            borderRadius: '0.15em',
            background: 'linear-gradient(135deg, #D4451A 0%, #B83A18 50%, #D4451A 100%)',
            color: '#fff',
            boxShadow: '0 2px 12px rgba(212,69,26,0.3)',
            position: 'relative',
            whiteSpace: 'nowrap',
          }}
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
