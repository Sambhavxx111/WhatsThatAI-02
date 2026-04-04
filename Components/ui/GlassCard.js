'use client'

import { motion } from 'framer-motion'

export default function GlassCard({ children, className = '', onClick, onDragOver, onDragLeave, onDrop }) {
  return (
    <motion.div
      className={`group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 ${className}`}
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}


