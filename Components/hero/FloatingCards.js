'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'

const floatingTools = [
  { icon: 'GP', name: 'GPT Workflows', x: '11%', y: '20%', depth: 1 },
  { icon: 'MJ', name: 'Visual Generation', x: '82%', y: '18%', depth: 1.4 },
  { icon: 'RW', name: 'Video AI', x: '74%', y: '68%', depth: 0.9 },
  { icon: 'EL', name: 'Voice Labs', x: '18%', y: '72%', depth: 1.25 },
  { icon: 'CP', name: 'Code Assist', x: '50%', y: '84%', depth: 0.75 },
]

export default function FloatingCards() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { scrollYProgress } = useScroll()
  const scrollOffset = useTransform(scrollYProgress, [0, 0.25], [0, -120])

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({
        x: (event.clientX / window.innerWidth - 0.5) * 36,
        y: (event.clientY / window.innerHeight - 0.5) * 24,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {floatingTools.map((tool, index) => (
        <motion.div
          key={tool.name}
          className="absolute hidden md:block"
          style={{ left: tool.x, top: tool.y }}
          initial={{ opacity: 0, scale: 0.86, y: 24 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: mousePosition.x * tool.depth,
            y: mousePosition.y * tool.depth,
          }}
          transition={{
            opacity: { duration: 0.7, delay: index * 0.12 },
            scale: { duration: 0.7, delay: index * 0.12 },
            x: { type: 'spring', stiffness: 50, damping: 20 },
            y: { type: 'spring', stiffness: 50, damping: 20 },
          }}
        >
          <motion.div
            style={{ y: scrollOffset }}
            className="group relative"
            animate={{ y: [0, -12, 0], rotate: [0, index % 2 === 0 ? -2 : 2, 0] }}
            transition={{ duration: 7 + index, ease: 'easeInOut', repeat: Infinity }}
          >
            <div className="premium-panel w-40 rounded-[28px] px-5 py-4 shadow-glow">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-500 to-violet-500 text-sm font-semibold text-white">
                {tool.icon}
              </div>
              <p className="text-sm font-medium text-white">{tool.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">Curated Signal</p>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}
