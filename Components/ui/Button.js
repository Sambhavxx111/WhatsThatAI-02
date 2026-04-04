'use client'

import { motion } from 'framer-motion'

export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  onClick,
}) {
  const baseStyles = 'inline-flex items-center justify-center rounded-[18px] font-semibold tracking-tight transition-all duration-300'

  const variants = {
    primary:
      'bg-slate-900 text-white shadow-sm hover:scale-105 hover:bg-slate-800',
    secondary:
      'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50',
    ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
  }

  const sizes = {
    small: 'h-[36px] px-4 text-[13px]',
    medium: 'h-[44px] px-6 text-[14px]',
    large: 'h-[52px] px-8 text-[15px]',
  }

  return (
    <motion.button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {children}
    </motion.button>
  )
}



