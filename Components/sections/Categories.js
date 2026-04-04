'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import GlassCard from '../ui/GlassCard'

function categoryIcon(name) {
  const normalized = name.toLowerCase()

  if (normalized.includes('chat')) return 'CB'
  if (normalized.includes('image')) return 'IM'
  if (normalized.includes('video')) return 'VD'
  if (normalized.includes('voice')) return 'VC'
  if (normalized.includes('code')) return 'CD'
  if (normalized.includes('product')) return 'PR'
  return 'AI'
}

function categoryColor(name) {
  const normalized = name.toLowerCase()

  if (normalized.includes('chat')) return 'from-emerald-400 to-teal-500'
  if (normalized.includes('image')) return 'from-fuchsia-500 to-pink-500'
  if (normalized.includes('video')) return 'from-orange-400 to-rose-500'
  if (normalized.includes('voice')) return 'from-sky-400 to-cyan-500'
    if (normalized.includes('code')) return 'from-amber-400 to-orange-500'
  if (normalized.includes('product')) return 'from-indigo-500 to-violet-500'
  return 'from-slate-400 to-slate-600'
}

function categoryDecorative(name) {
  const normalized = name.toLowerCase()

  if (normalized.includes('chat')) {
    return () => (
      <div className="absolute -right-4 -bottom-4 opacity-0 group-hover:opacity-5 transition-all duration-700 pointer-events-none">
        <svg fill="currentColor" viewBox="0 0 24 24" className="w-40 h-40 text-emerald-600"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
    )
  }

  if (normalized.includes('image')) {
    return () => (
      <div className="absolute right-0 bottom-0 w-24 h-24 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
        <div className="absolute inset-2 bg-gradient-to-tr from-fuchsia-500 to-pink-500 rounded-xl transform rotate-12 scale-90 opacity-20" />
      </div>
    )
  }

  if (normalized.includes('video')) {
    return () => (
      <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-20 transition-all duration-700 pointer-events-none">
         <div className="w-24 h-16 bg-white border border-slate-200 rounded flex flex-col transform rotate-6 shadow-sm">
            <div className="h-2 bg-slate-100 border-b border-slate-200" />
            <div className="flex-1 flex items-center justify-center">
               <div className="w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-t-transparent border-b-transparent border-l-rose-400" />
            </div>
         </div>
      </div>
    )
  }

  if (normalized.includes('audio')) {
    return () => (
      <div className="absolute right-6 bottom-4 flex items-end gap-1 opacity-0 group-hover:opacity-[0.15] transition-all duration-700 pointer-events-none">
        <div className="w-1.5 h-6 bg-sky-500 rounded-t-sm animate-[bounce_1s_infinite_0ms]" />
        <div className="w-1.5 h-10 bg-sky-500 rounded-t-sm animate-[bounce_1s_infinite_100ms]" />
        <div className="w-1.5 h-4 bg-sky-500 rounded-t-sm animate-[bounce_1s_infinite_200ms]" />
        <div className="w-1.5 h-12 bg-sky-500 rounded-t-sm animate-[bounce_1s_infinite_300ms]" />
      </div>
    )
  }

  if (normalized.includes('code')) {
    return () => (
      <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-40 h-24 bg-slate-900 rounded-lg opacity-0 group-hover:opacity-[0.04] transition-all duration-700 transform -rotate-6 pointer-events-none p-3 font-mono text-[8px] text-amber-500">
        <div className="flex gap-1 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        </div>
        <p>export default {'{'}</p>
        <p className="pl-2">compile()</p>
        <p>{'}'}</p>
      </div>
    )
  }

  return () => (
     <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-[0.03] transition-all duration-700 pointer-events-none">
       <div className="w-40 h-40 rounded-full border border-dashed border-slate-900 animate-[spin_20s_linear_infinite]" />
     </div>
  )
}

export default function Categories() {
  const ref = useRef(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [categories, setCategories] = useState([])
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const titleY = useTransform(scrollYProgress, [0, 1], [30, -30])

  useEffect(() => {
    fetch('/api/tools')
      .then((res) => res.json())
      .then((tools) => {
        const grouped = tools.reduce((acc, tool) => {
          acc[tool.category] = (acc[tool.category] || 0) + 1
          return acc
        }, {})

        const nextCategories = Object.entries(grouped).map(([name, count]) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          count,
          icon: categoryIcon(name),
          color: categoryColor(name),
          Decorative: categoryDecorative(name),
        }))

        setCategories(nextCategories)
      })
      .catch(() => setCategories([]))
  }, [])

  return (
    <section ref={ref} className="scene-categories scene-overlap scene-blend section-shell relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,70,239,0.06),transparent_24%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.05),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl">
        <motion.div style={{ y: titleY }} className="mb-14 text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-fuchsia-500">Structured Discovery</p>
          <h2 className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Explore the catalog by category, not chaos
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.55, delay: index * 0.05 }}
              onMouseEnter={() => setHoveredId(category.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={index % 3 === 1 ? 'xl:translate-y-8' : index % 3 === 2 ? 'xl:translate-y-16' : ''}
            >
              <GlassCard className="p-7 relative overflow-hidden group bg-white border border-slate-200 transition-colors duration-500 hover:bg-slate-50">
                {category.Decorative && <category.Decorative />}
                <div className="relative z-10 flex items-center gap-5">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br ${category.color} text-base font-bold text-white shadow-sm transition-transform duration-300 ${hoveredId === category.id ? 'scale-110 -rotate-3 shadow-md' : ''}`}>
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-500">{category.name}</h3>
                    <p className="mt-2 text-sm uppercase tracking-[0.2em] font-semibold text-slate-400 group-hover:text-slate-500 transition-colors">{category.count} tools</p>
                  </div>
                  <motion.div className="text-slate-400 font-bold" animate={{ x: hoveredId === category.id ? 8 : 0 }}>
                    →
                  </motion.div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}



