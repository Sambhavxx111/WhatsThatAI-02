'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import StarRating from '@/components/ui/StarRating'
import { trackToolActivity } from '@/lib/activity'

function getLogoSource(tool) {
  if (tool.logoUrl) {
    return tool.logoUrl
  }

  if (!tool.websiteUrl) {
    return ''
  }

  try {
    const hostname = new URL(tool.websiteUrl).hostname
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
  } catch {
    return ''
  }
}

function isWhatsThatAIOriginal(tool) {
  return String(tool?.source || '').toLowerCase() === 'whatsthatai-original'
}

function OriginalBlueTick() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700">
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 1.5a2 2 0 0 1 1.63.84l.66.93 1.13.18a2 2 0 0 1 1.5 1.14l.5 1.03 1.03.5a2 2 0 0 1 1.14 1.5l.18 1.13.93.66a2 2 0 0 1 .84 1.63 2 2 0 0 1-.84 1.63l-.93.66-.18 1.13a2 2 0 0 1-1.14 1.5l-1.03.5-.5 1.03a2 2 0 0 1-1.5 1.14l-1.13.18-.66.93A2 2 0 0 1 10 18.5a2 2 0 0 1-1.63-.84l-.66-.93-1.13-.18a2 2 0 0 1-1.5-1.14l-.5-1.03-1.03-.5a2 2 0 0 1-1.14-1.5l-.18-1.13-.93-.66A2 2 0 0 1 .5 10a2 2 0 0 1 .84-1.63l.93-.66.18-1.13a2 2 0 0 1 1.14-1.5l1.03-.5.5-1.03a2 2 0 0 1 1.5-1.14l1.13-.18.66-.93A2 2 0 0 1 10 1.5Zm3.03 6.22a.75.75 0 0 0-1.06-1.06L8.75 9.88 7.53 8.66a.75.75 0 0 0-1.06 1.06l1.75 1.75a.75.75 0 0 0 1.06 0l3.75-3.75Z"
          clipRule="evenodd"
        />
      </svg>
      Original
    </span>
  )
}

export default function ToolCard({ tool, index }) {
  const [isHovered, setIsHovered] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const logoSource = getLogoSource(tool)
  const showLogo = Boolean(logoSource) && !logoFailed
  const showOriginalBadge = isWhatsThatAIOriginal(tool)

  function handleClick() {
    trackToolActivity(tool.id, 'click')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: index * 0.04 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="perspective-1000 h-full"
    >
      <Link href={`/tools/${tool.slug || tool.name.toLowerCase().replace(/\s+/g, '-')}`} onClick={handleClick} className="block h-full">
        <motion.div
          className="group relative h-full preserve-3d"
          animate={{ rotateX: isHovered ? 4 : 0, rotateY: isHovered ? -4 : 0, scale: isHovered ? 1.02 : 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="relative h-full flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 group-hover:border-slate-300 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] group-hover:bg-slate-50 border-b-2">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[14px] bg-white text-sm font-bold text-slate-800 border border-slate-200 shadow-sm group-hover:shadow transition-all">
                {showLogo ? (
                  <img
                    src={logoSource}
                    alt={`${tool.name} logo`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  tool.icon || tool.name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-600 border border-slate-200">
                {tool.category}
              </span>
            </div>

            <div className="mb-4 space-y-2 flex-grow">
              {showOriginalBadge ? <OriginalBlueTick /> : null}
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600">
                  {tool.name}
                </h3>
                {showOriginalBadge ? (
                  <span className="text-sky-500" aria-label="WhatsThatAI Original verified">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                      <path
                        fillRule="evenodd"
                        d="M10 1.5a2 2 0 0 1 1.63.84l.66.93 1.13.18a2 2 0 0 1 1.5 1.14l.5 1.03 1.03.5a2 2 0 0 1 1.14 1.5l.18 1.13.93.66a2 2 0 0 1 .84 1.63 2 2 0 0 1-.84 1.63l-.93.66-.18 1.13a2 2 0 0 1-1.14 1.5l-1.03.5-.5 1.03a2 2 0 0 1-1.5 1.14l-1.13.18-.66.93A2 2 0 0 1 10 18.5a2 2 0 0 1-1.63-.84l-.66-.93-1.13-.18a2 2 0 0 1-1.5-1.14l-.5-1.03-1.03-.5a2 2 0 0 1-1.14-1.5l-.18-1.13-.93-.66A2 2 0 0 1 .5 10a2 2 0 0 1 .84-1.63l.93-.66.18-1.13a2 2 0 0 1 1.14-1.5l1.03-.5.5-1.03a2 2 0 0 1 1.5-1.14l1.13-.18.66-.93A2 2 0 0 1 10 1.5Zm3.03 6.22a.75.75 0 0 0-1.06-1.06L8.75 9.88 7.53 8.66a.75.75 0 0 0-1.06 1.06l1.75 1.75a.75.75 0 0 0 1.06 0l3.75-3.75Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                ) : null}
              </div>
              <p className="line-clamp-2 text-[14px] leading-relaxed text-slate-500 font-medium">
                {tool.description}
              </p>
            </div>

            <div className="mt-auto">
              <div className="mb-4">
                <StarRating rating={tool.avgRating} totalReviews={tool.totalReviews} />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[13px] font-semibold text-slate-500">
                <span>{tool.pricing}</span>
                <span className="flex items-center gap-1 group-hover:text-slate-900 transition-colors">
                  {tool.totalReviews || 0} reviews
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
