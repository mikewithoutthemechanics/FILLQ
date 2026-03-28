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
    <span
      className={className}
      style={{
        display: 'inline-block',
        position: 'relative',
        verticalAlign: 'bottom',
        minWidth: '9em',
        height: '1.2em',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={texts[index]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            display: 'inline-block',
            padding: '0.12em 0.25em',
            borderRadius: '0.15em',
            background: 'linear-gradient(135deg, #D4451A 0%, #B83A18 50%, #D4451A 100%)',
            color: '#fff',
            boxShadow: '0 2px 12px rgba(212,69,26,0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
