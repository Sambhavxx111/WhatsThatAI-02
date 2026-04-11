'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ToolCard from '@/components/ui/ToolCard'
import Button from '@/components/ui/Button'
import { getBookmarkedCollections } from '@/lib/collection-bookmarks'

export default function LikedToolsPage() {
  const [tools, setTools] = useState([])
  const [bookmarkedCollections, setBookmarkedCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(true)

  useEffect(() => {
    async function loadLikedTools() {
      try {
        const [likesResponse, meResponse] = await Promise.all([
          fetch('/api/likes', {
            cache: 'no-store',
            credentials: 'include',
          }),
          fetch('/api/auth/me', {
            cache: 'no-store',
            credentials: 'include',
          }),
        ])

        const data = await likesResponse.json()
        const meData = await meResponse.json()

        if (likesResponse.status === 401) {
          setAuthorized(false)
          setTools([])
          setBookmarkedCollections(getBookmarkedCollections('guest'))
          return
        }

        const userIdentifier = meData?.user?.email || meData?.user?.id || 'guest'
        setTools(Array.isArray(data) ? data : [])
        setBookmarkedCollections(getBookmarkedCollections(userIdentifier))
      } catch {
        setTools([])
        setBookmarkedCollections(getBookmarkedCollections('guest'))
      } finally {
        setLoading(false)
      }
    }

    loadLikedTools()
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-24 pt-32 sm:px-6 lg:px-8 bg-[#FAFAFA]">
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-4xl text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">My Collection</p>
          <h1 className="text-balance text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Your saved AI tools, ready when you need them.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-slate-500">
            Keep your favorite tools in one place and jump back in without searching all over again.
          </p>
        </div>

        {!loading && !authorized ? (
          <div className="mx-auto max-w-2xl rounded-[32px] border border-slate-200 bg-white px-8 py-20 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Log in to see your collection</h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-slate-500 font-medium">
              Your saved tools are tied to your account so you can access them anytime.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/login">
                <Button variant="secondary">Log In</Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary">Sign Up</Button>
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div className="mx-auto max-w-2xl rounded-[32px] border border-slate-200 bg-white px-8 py-20 text-center text-[15px] text-slate-500 shadow-sm font-medium">
            Loading your collection...
          </div>
        ) : tools.length > 0 || bookmarkedCollections.length > 0 ? (
          <>
            {bookmarkedCollections.length > 0 ? (
              <div className="mb-12">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Saved Collections
                </p>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {bookmarkedCollections.map((collection) => (
                    <Link
                      key={collection.slug}
                      href={`/collections/${collection.slug}`}
                      className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600">
                            Saved Collection
                          </p>
                          <h2 className="mt-2 text-lg font-semibold text-slate-900">
                            {collection.title}
                          </h2>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                          {collection.itemCount || 0} tools
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        {collection.description || 'Open this saved collection to browse every tool in it.'}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mb-10 text-center">
              <p className="text-[14px] text-slate-500 font-medium">
                You have <span className="font-bold text-slate-900">{tools.length}</span> saved tools
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {tools.map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} index={index} />
              ))}
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-2xl rounded-[32px] border border-slate-200 bg-white px-8 py-20 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Your collection is empty</h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-slate-500 font-medium">
              Open any tool and save it to your collection so you can access it instantly later.
            </p>
            <div className="mt-8">
              <Link href="/tools">
                <Button variant="primary">Browse Tools</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
