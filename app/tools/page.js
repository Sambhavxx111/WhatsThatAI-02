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
  }, [searchParams])

  function updateUrl(nextQuery, nextPricing) {
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

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(nextUrl, { scroll: false })
  }

  function handleSearchChange(nextValue) {
    setSearchQuery(nextValue)
    updateUrl(nextValue, pricingFilter)
  }

  function handlePricingChange(nextPricing) {
    setPricingFilter(nextPricing)
    updateUrl(searchQuery, nextPricing)
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

    return matchesQuery && matchesPricing
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
