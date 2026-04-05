'use client'

import { Suspense, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ToolCard from '@/components/ui/ToolCard'
import SearchBar from '@/components/ui/SearchBar'

const PRICING_FILTERS = [
  { label: 'All Pricing', value: 'all' },
  { label: 'Free', value: 'free' },
  { label: 'Freemium', value: 'freemium' },
  { label: 'Paid', value: 'paid' },
]

function ToolsPageContent() {
  const [tools, setTools] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [pricingFilter, setPricingFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('')
  const [showOriginalsBanner, setShowOriginalsBanner] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    fetch('/api/tools')
      .then((res) => res.json())
      .then((data) => setTools(data))
  }, [])

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '')
    setPricingFilter(searchParams.get('pricing') || 'all')
    setSourceFilter(searchParams.get('source') || '')
  }, [searchParams])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isDismissed = window.localStorage.getItem('whatsthatai-originals-banner-dismissed') === 'true'
    const isOriginalsView = (searchParams.get('source') || '').toLowerCase() === 'whatsthatai-original'

    setShowOriginalsBanner(!isDismissed && !isOriginalsView)
  }, [searchParams])

  function updateUrl(nextQuery, nextPricing, nextSource = sourceFilter) {
    const params = new URLSearchParams(searchParams.toString())

    if (nextQuery?.trim()) {
      params.set('q', nextQuery.trim())
    } else {
      params.delete('q')
    }

    if (nextPricing && nextPricing !== 'all') {
      params.set('pricing', nextPricing)
    } else {
      params.delete('pricing')
    }

    if (nextSource?.trim()) {
      params.set('source', nextSource.trim())
    } else {
      params.delete('source')
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(nextUrl, { scroll: false })
  }

  function handleSearchChange(nextValue) {
    setSearchQuery(nextValue)
    updateUrl(nextValue, pricingFilter, sourceFilter)
  }

  function handlePricingChange(nextPricing) {
    setPricingFilter(nextPricing)
    updateUrl(searchQuery, nextPricing, sourceFilter)
  }

  function handleOriginalsBrowse() {
    setSourceFilter('whatsthatai-original')
    updateUrl(searchQuery, pricingFilter, 'whatsthatai-original')
    setShowOriginalsBanner(false)
  }

  function handleDismissOriginalsBanner() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('whatsthatai-originals-banner-dismissed', 'true')
    }

    setShowOriginalsBanner(false)
  }

  const filteredTools = tools.filter((tool) => {
    const normalizedQuery = searchQuery.toLowerCase()
    const matchesQuery =
      !normalizedQuery ||
      tool.name.toLowerCase().includes(normalizedQuery) ||
      tool.category.toLowerCase().includes(normalizedQuery) ||
      tool.description.toLowerCase().includes(normalizedQuery)

    const matchesPricing =
      pricingFilter === 'all' || String(tool.pricing || '').toLowerCase() === pricingFilter

    const matchesSource =
      !sourceFilter || String(tool.source || '').toLowerCase() === sourceFilter.toLowerCase()

    return matchesQuery && matchesPricing && matchesSource
  })

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-24 pt-32 sm:px-6 lg:px-8 bg-[#FAFAFA]">
      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-14 max-w-4xl text-center"
        >
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
            Tool Library
          </p>
          <h1 className="text-balance text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Explore the full AI tools catalog in a cleaner, more immersive layout.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-slate-500">
            Search stays the same. The presentation now gives every result more room, depth, and clarity.
          </p>
        </motion.div>

        <div className="mx-auto mb-14 max-w-3xl">
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search tools, workflows, or categories"
            size="large"
          />
        </div>

        <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
          {PRICING_FILTERS.map((filter) => {
            const isActive = pricingFilter === filter.value

            return (
              <motion.button
                key={filter.value}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePricingChange(filter.value)}
                className={`rounded-[16px] border px-5 py-2.5 text-[13px] font-semibold transition ${
                  isActive
                    ? 'border-slate-800 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {filter.label}
              </motion.button>
            )
          })}
        </div>

        <div className="mb-10 text-center text-[14px]">
          <p className="text-slate-500">
            Showing <span className="font-semibold text-slate-900">{filteredTools.length}</span> tools
            {pricingFilter !== 'all' ? (
              <span>
                {' '}
                with <span className="font-semibold text-slate-900">{pricingFilter}</span> pricing
              </span>
            ) : null}
          </p>
        </div>

        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredTools.map((tool, index) => (
              <ToolCard key={tool.id} tool={tool} index={index} />
            ))}
          </div>
        ) : (
          <div className="rounded-[32px] border border-slate-200 bg-white px-8 py-20 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">No tools match this filter yet</h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-slate-500 font-medium">
              Try another search term or switch the pricing filter to broaden the results.
            </p>
          </div>
        )}
      </div>

      {showOriginalsBanner ? (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="fixed bottom-6 right-4 z-40 w-full max-w-sm rounded-[24px] border border-sky-200 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:right-6"
        >
          <button
            type="button"
            onClick={handleDismissOriginalsBanner}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Dismiss originals banner"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M4.47 4.47a.75.75 0 0 1 1.06 0L10 8.94l4.47-4.47a.75.75 0 1 1 1.06 1.06L11.06 10l4.47 4.47a.75.75 0 0 1-1.06 1.06L10 11.06l-4.47 4.47a.75.75 0 0 1-1.06-1.06L8.94 10 4.47 5.53a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">
            WhatsThatAI Originals
          </p>
          <h2 className="mt-2 max-w-[85%] text-lg font-semibold tracking-tight text-slate-900">
            Browse tools built by us.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Explore original products published by the WhatsThatAI team in one focused view.
          </p>

          <button
            type="button"
            onClick={handleOriginalsBrowse}
            className="mt-4 inline-flex items-center rounded-[16px] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Browse WhatsThatAI Originals
          </button>
        </motion.div>
      ) : null}
    </div>
  )
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen px-4 pb-24 pt-32 text-center text-neutral-400">Loading tools...</div>}>
      <ToolsPageContent />
    </Suspense>
  )
}
