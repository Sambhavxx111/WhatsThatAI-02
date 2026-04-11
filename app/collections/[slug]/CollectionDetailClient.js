'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getBookmarkedCollections, isCollectionBookmarked, toggleBookmarkedCollection } from '@/lib/collection-bookmarks'
import ToolCard from '@/components/ui/ToolCard'

export default function CollectionDetailClient({ collection }) {
  const [userIdentifier, setUserIdentifier] = useState('guest')
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    let isCancelled = false

    async function loadUserAndBookmarks() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        })
        const data = await response.json()
        const nextUserIdentifier = data?.user?.email || data?.user?.id || 'guest'

        if (!isCancelled) {
          setUserIdentifier(String(nextUserIdentifier))
          setIsBookmarked(isCollectionBookmarked(String(nextUserIdentifier), collection.slug))
        }
      } catch {
        if (!isCancelled) {
          setUserIdentifier('guest')
          setIsBookmarked(isCollectionBookmarked('guest', collection.slug))
        }
      }
    }

    void loadUserAndBookmarks()

    return () => {
      isCancelled = true
    }
  }, [collection.slug])

  const collectionTools = useMemo(
    () => (Array.isArray(collection.items) ? collection.items.map((item) => item.tool) : []),
    [collection.items]
  )

  function handleBookmarkToggle() {
    toggleBookmarkedCollection(userIdentifier, collection)
    setIsBookmarked((current) => !current)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 pb-24 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600">
                {collection.type === 'starter'
                  ? 'Starter Collection'
                  : collection.type === 'trending'
                    ? 'Trending Collection'
                    : 'Curated Collection'}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                {collection.title}
              </h1>
              <p className="mt-4 text-[17px] leading-8 text-slate-500">
                {collection.description || collection.summary || 'A curated set of tools for this use case.'}
              </p>
              <p className="mt-4 text-sm font-medium text-slate-400">
                {collection.itemCount} tools in this collection
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleBookmarkToggle}
                className={`inline-flex h-[46px] items-center justify-center rounded-[16px] border px-5 text-sm font-semibold transition ${
                  isBookmarked
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isBookmarked ? 'Saved to My Collection' : 'Save collection'}
              </button>
              <Link
                href="/liked-tools"
                className="inline-flex h-[46px] items-center justify-center rounded-[16px] border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Open My Collection
              </Link>
            </div>
          </div>
        </div>

        {collectionTools.length ? (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {collectionTools.map((tool, index) => (
              <ToolCard key={tool.id} tool={tool} index={index} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-[32px] border border-slate-200 bg-white px-8 py-20 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">No tools are available in this collection yet</h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] font-medium text-slate-500">
              We&apos;ll add the curated tools here once the collection is ready.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
