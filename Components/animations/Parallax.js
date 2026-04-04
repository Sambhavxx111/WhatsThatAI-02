'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

export function ParallaxSection({ children, speed = 0.5, className = '' }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 100])

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  )
}

export function ParallaxLayer({ children, depth = 1, className = '' }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, depth * 50])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8])

  return (
    <motion.div
      ref={ref}
      style={{ y, opacity, scale }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function MouseParallax({ children, intensity = 20, className = '' }) {
  const x = useTransform(() => {
    if (typeof window === 'undefined') return 0
    return (window.innerWidth / 2) * (intensity / 100)
  })

  const y = useTransform(() => {
    if (typeof window === 'undefined') return 0
    return (window.innerHeight / 2) * (intensity / 100)
  })

  return (
    <motion.div style={{ x, y }} className={className}>
      {children}
    </motion.div>
  )
}