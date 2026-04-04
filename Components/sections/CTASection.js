'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Button from '../ui/Button'
import GlassCard from '../ui/GlassCard'

export default function CTASection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.94, 1])
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0.3, 1])
  const y = useTransform(scrollYProgress, [0, 1], [80, -20])

  return (
    <section ref={ref} className="scene-cta scene-overlap scene-blend section-shell relative overflow-hidden px-4 py-32 sm:px-6 lg:px-8">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[520px] w-[520px] rounded-full bg-sky-200/40 blur-[120px]" />
      </div>

      <motion.div style={{ scale, opacity, y }} className="relative mx-auto max-w-5xl">
        <GlassCard className="px-8 py-14 text-center sm:px-12 sm:py-16 lg:px-16 border-slate-200 shadow-md">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-sky-500">Next Move</p>
          <h2 className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Ready to make tool discovery feel effortless?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-500 font-medium">
            Keep the backend you already trust. Layer on a more premium, immersive front-end experience that feels sharp on every scroll.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button variant="primary" size="large" className="group">
              Explore the Catalog
            </Button>
            <Button variant="secondary" size="large">
              Browse All Tools
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </section>
  )
}



