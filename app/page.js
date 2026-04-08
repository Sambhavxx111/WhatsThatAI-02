'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FAFAFA] px-4 pt-32 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[10%] h-[26rem] w-[26rem] rounded-full bg-sky-100/60 blur-3xl" />
        <div className="absolute right-[-6%] top-[20%] h-[28rem] w-[28rem] rounded-full bg-violet-100/60 blur-3xl" />
        <div className="absolute bottom-[-12%] left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-emerald-100/50 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl items-center justify-center py-16">
        <div className="w-full max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-sm"
          >
            WhatsThatAI
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.05 }}
            className="mt-8 text-5xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-6xl lg:text-7xl"
          >
            Discover AI tools
            <br />
            with a cleaner marketplace.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12 }}
            className="mx-auto mt-8 max-w-2xl text-[17px] font-medium leading-8 text-slate-500"
          >
            Browse a growing tool catalog, save your collection, review products, and move
            through the marketplace without noise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18 }}
            className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/tools"
              className="inline-flex h-[52px] items-center justify-center rounded-[18px] bg-slate-900 px-7 text-[15px] font-semibold text-white transition hover:bg-slate-800"
            >
              Browse marketplace
            </Link>
            <Link
              href="/identify"
              className="inline-flex h-[52px] items-center justify-center rounded-[18px] border border-slate-200 bg-white px-7 text-[15px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Open tool finder
            </Link>
          </motion.div>

        </div>
      </section>
    </div>
  )
}
