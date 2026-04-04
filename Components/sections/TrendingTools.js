'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import ToolCard from '../ui/ToolCard'

export default function TrendingTools() {
  const ref = useRef(null)
  const [trendingTools, setTrendingTools] = useState([])
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [70, -50])
  const introX = useTransform(scrollYProgress, [0, 1], [0, 40])

  useEffect(() => {
    fetch('/api/tools?featured=true&limit=6')
      .then((res) => res.json())
      .then((data) => setTrendingTools(data))
      .catch(() => setTrendingTools([]))
  }, [])

  return (
    <section ref={ref} className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8 bg-[#FAFAFA]">
      <div className="relative mx-auto max-w-7xl">
        <motion.div style={{ y, x: introX }} className="mb-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Curated Highlights</p>
            <h2 className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[54px] lg:leading-[1.1]">
              Browse the most compelling tools in a calmer, premium grid.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-relaxed text-slate-500 sm:text-[17px]">
            The grid eases upward as you scroll so the page feels like a guided composition, not a stack of disconnected blocks.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {trendingTools.map((tool, index) => {
            const columnOffset = index % 3 === 1 ? 'xl:translate-y-12' : index % 3 === 2 ? 'xl:translate-y-24' : ''
            return (
              <div key={tool.id} className={columnOffset}>
                <ToolCard tool={tool} index={index} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}



