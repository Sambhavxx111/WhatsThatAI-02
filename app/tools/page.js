'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
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
const TOOLS_BATCH_SIZE = 24
const ENABLE_ORIGINALS_BANNER = false

const ORIGINALS_BANNER_DISMISS_KEY = 'whatsthatai-originals-banner-dismissed-at'
const ORIGINALS_BANNER_DISMISS_MS = 24 * 60 * 60 * 1000

function ToolsPageContent() {
  const [tools, setTools] = useState([])
  const [availableTags, setAvailableTags] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [pricingFilter, setPricingFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('')
  const [showOriginalsBanner, setShowOriginalsBanner] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalTools, setTotalTools] = useState(0)
  const loadMoreRef = useRef(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentQuery = useMemo(() => searchParams.get('q') || '', [searchParams])
  const currentPricing = useMemo(() => searchParams.get('pricing') || 'all', [searchParams])
  const currentTag = useMemo(() => searchParams.get('tag') || 'all', [searchParams])
  const currentSource = useMemo(() => searchParams.get('source') || '', [searchParams])

  useEffect(() => {
    setSearchQuery(currentQuery)
    setPricingFilter(currentPricing)
    setTagFilter(currentTag)
    setSourceFilter(currentSource)
  }, [currentPricing, currentQuery, currentSource, currentTag])

  useEffect(() => {
    let cancelled = false

    async function loadTags() {
      try {
        const response = await fetch('/api/tags?limit=18', { cache: 'no-store' })
        const data = await response.json()

        if (!cancelled) {
          setAvailableTags(Array.isArray(data) ? data : [])
        }
      } catch {
        if (!cancelled) {
          setAvailableTags([])
        }
      }
    }

    void loadTags()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ENABLE_ORIGINALS_BANNER) {
      setShowOriginalsBanner(false)
      return
    }

    if (typeof window === 'undefined') return

    const dismissedAtValue = window.localStorage.getItem(ORIGINALS_BANNER_DISMISS_KEY)
    const dismissedAt = dismissedAtValue ? Number(dismissedAtValue) : 0
    const isDismissed =
      Number.isFinite(dismissedAt) &&
      dismissedAt > 0 &&
      Date.now() - dismissedAt < ORIGINALS_BANNER_DISMISS_MS
    const isOriginalsView = String(currentSource || '').toLowerCase() === 'whatsthatai-original'

    setShowOriginalsBanner(!isDismissed && !isOriginalsView)
  }, [currentSource])

  useEffect(() => {
    let isCancelled = false

    async function loadInitialTools() {
      setIsLoading(true)
      setIsLoadingMore(false)

      try {
        const params = new URLSearchParams()
        params.set('batched', 'true')
        params.set('limit', String(TOOLS_BATCH_SIZE))
        params.set('offset', '0')

        if (currentQuery.trim()) {
          params.set('query', currentQuery.trim())
        }

        if (currentPricing !== 'all') {
          params.set('pricing', currentPricing)
        }

        if (currentTag !== 'all') {
          params.set('tag', currentTag)
        }

        if (currentSource.trim()) {
          params.set('source', currentSource.trim())
        }

        const response = await fetch(`/api/tools?${params.toString()}`, {
          cache: 'no-store',
        })
        const data = await response.json()

        if (isCancelled) {
          return
        }

        setTools(Array.isArray(data.tools) ? data.tools : [])
        setHasMore(Boolean(data.hasMore))
        setTotalTools(Number(data.total) || 0)
      } catch {
        if (!isCancelled) {
          setTools([])
          setHasMore(false)
          setTotalTools(0)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialTools()

    return () => {
      isCancelled = true
    }
  }, [currentPricing, currentQuery, currentSource, currentTag])

  useEffect(() => {
    const target = loadMoreRef.current

    if (!target || !hasMore || isLoading || isLoadingMore) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]

        if (entry?.isIntersecting) {
          void loadMoreTools()
        }
      },
      {
        rootMargin: '320px 0px',
      }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, isLoading, isLoadingMore, tools.length, currentPricing, currentQuery, currentSource, currentTag])

  function updateUrl(nextQuery, nextPricing, nextTag = tagFilter, nextSource = sourceFilter) {
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

    if (nextTag && nextTag !== 'all') {
      params.set('tag', nextTag)
    } else {
      params.delete('tag')
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
    updateUrl(nextValue, pricingFilter, tagFilter, sourceFilter)
  }

  function handlePricingChange(nextPricing) {
    setPricingFilter(nextPricing)
    updateUrl(searchQuery, nextPricing, tagFilter, sourceFilter)
  }

  function handleTagChange(nextTag) {
    setTagFilter(nextTag)
    updateUrl(searchQuery, pricingFilter, nextTag, sourceFilter)
  }

  function handleOriginalsBrowse() {
    setSourceFilter('whatsthatai-original')
    updateUrl(searchQuery, pricingFilter, tagFilter, 'whatsthatai-original')
    setShowOriginalsBanner(false)
  }

  function handleDismissOriginalsBanner(event) {
    event?.preventDefault?.()
    event?.stopPropagation?.()

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ORIGINALS_BANNER_DISMISS_KEY, String(Date.now()))
    }

    setShowOriginalsBanner(false)
  }

  async function loadMoreTools() {
    if (isLoading || isLoadingMore || !hasMore) {
      return
    }

    setIsLoadingMore(true)

    try {
      const params = new URLSearchParams()
      params.set('batched', 'true')
      params.set('limit', String(TOOLS_BATCH_SIZE))
      params.set('offset', String(tools.length))

      if (currentQuery.trim()) {
        params.set('query', currentQuery.trim())
      }

      if (currentPricing !== 'all') {
        params.set('pricing', currentPricing)
      }

      if (currentTag !== 'all') {
        params.set('tag', currentTag)
      }

      if (currentSource.trim()) {
        params.set('source', currentSource.trim())
      }

      const response = await fetch(`/api/tools?${params.toString()}`, {
        cache: 'no-store',
      })
      const data = await response.json()

      setTools((currentTools) => {
        const incomingTools = Array.isArray(data.tools) ? data.tools : []
        const existingIds = new Set(currentTools.map((tool) => tool.id))
        const mergedTools = [...currentTools]

        incomingTools.forEach((tool) => {
          if (!existingIds.has(tool.id)) {
            mergedTools.push(tool)
          }
        })

        return mergedTools
      })
      setHasMore(Boolean(data.hasMore))
      setTotalTools(Number(data.total) || totalTools)
    } catch {
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }

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
          <p className="mt-4 text-center text-[13px] font-medium text-slate-500">
            Fresh AI tools are added daily so the catalog keeps getting sharper.
          </p>
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

        {availableTags.length > 0 ? (
          <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTagChange('all')}
              className={`rounded-[16px] border px-4 py-2 text-[12px] font-semibold transition ${
                tagFilter === 'all'
                  ? 'border-sky-200 bg-sky-50 text-sky-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              All Tags
            </motion.button>
            {availableTags.map((tag) => {
              const isActive = tagFilter.toLowerCase() === String(tag.name).toLowerCase()

              return (
                <motion.button
                  key={tag.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTagChange(tag.name)}
                  className={`rounded-[16px] border px-4 py-2 text-[12px] font-semibold transition ${
                    isActive
                      ? 'border-sky-200 bg-sky-50 text-sky-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {tag.name}
                </motion.button>
              )
            })}
          </div>
        ) : null}

        <div className="mb-10 text-center text-[14px]">
          <p className="text-slate-500">
            Showing <span className="font-semibold text-slate-900">{tools.length}</span>
            {totalTools > tools.length ? (
              <span>
                {' '}
                of <span className="font-semibold text-slate-900">{totalTools}</span>
              </span>
            ) : null}{' '}
            tools
            {pricingFilter !== 'all' ? (
              <span>
                {' '}
                with <span className="font-semibold text-slate-900">{pricingFilter}</span> pricing
              </span>
            ) : null}
            {tagFilter !== 'all' ? (
              <span>
                {' '}
                tagged <span className="font-semibold text-slate-900">{tagFilter}</span>
              </span>
            ) : null}
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-[32px] border border-slate-200 bg-white px-8 py-20 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Loading tools...</h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-slate-500 font-medium">
              We&apos;re fetching a lighter batch first so browsing stays smooth.
            </p>
          </div>
        ) : tools.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool, index) => (
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

        {!isLoading && tools.length > 0 ? (
          <div ref={loadMoreRef} className="mt-10 flex min-h-[64px] items-center justify-center">
            {isLoadingMore ? (
              <p className="text-sm font-medium text-slate-500">Loading more tools...</p>
            ) : hasMore ? (
              <p className="text-sm font-medium text-slate-400">Scroll to load more</p>
            ) : (
              <p className="text-sm font-medium text-slate-400">You&apos;ve reached the end of the catalog</p>
            )}
          </div>
        ) : null}
      </div>

      {ENABLE_ORIGINALS_BANNER && showOriginalsBanner ? (
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
