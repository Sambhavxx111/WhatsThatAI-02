'use client'

import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import StarRating from '@/components/ui/StarRating'
import ReviewSection from '@/components/reviews/ReviewSection'
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
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 1.5a2 2 0 0 1 1.63.84l.66.93 1.13.18a2 2 0 0 1 1.5 1.14l.5 1.03 1.03.5a2 2 0 0 1 1.14 1.5l.18 1.13.93.66a2 2 0 0 1 .84 1.63 2 2 0 0 1-.84 1.63l-.93.66-.18 1.13a2 2 0 0 1-1.14 1.5l-1.03.5-.5 1.03a2 2 0 0 1-1.5 1.14l-1.13.18-.66.93A2 2 0 0 1 10 18.5a2 2 0 0 1-1.63-.84l-.66-.93-1.13-.18a2 2 0 0 1-1.5-1.14l-.5-1.03-1.03-.5a2 2 0 0 1-1.14-1.5l-.18-1.13-.93-.66A2 2 0 0 1 .5 10a2 2 0 0 1 .84-1.63l.93-.66.18-1.13a2 2 0 0 1 1.14-1.5l1.03-.5.5-1.03a2 2 0 0 1 1.5-1.14l1.13-.18.66-.93A2 2 0 0 1 10 1.5Zm3.03 6.22a.75.75 0 0 0-1.06-1.06L8.75 9.88 7.53 8.66a.75.75 0 0 0-1.06 1.06l1.75 1.75a.75.75 0 0 0 1.06 0l3.75-3.75Z"
          clipRule="evenodd"
        />
      </svg>
      WhatsThatAI Original
    </span>
  )
}

export default function ToolPage() {
  const params = useParams()
  const slug = params.slug || params.Slug
  const [tool, setTool] = useState(null)
  const [logoFailed, setLogoFailed] = useState(false)
  const [user, setUser] = useState(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  useEffect(() => {
    if (!slug) return

    fetch(`/api/tools?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setTool(data)
        if (data?.id) {
          trackToolActivity(data.id, 'view')
        }
      })
  }, [slug])

  useEffect(() => {
    fetch('/api/auth/me', {
      cache: 'no-store',
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    if (!tool?.id) return

    fetch(`/api/likes/${tool.id}`, {
      cache: 'no-store',
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        setIsLiked(Boolean(data.liked))
      })
      .catch(() => setIsLiked(false))
  }, [tool?.id])

  function handleVisitWebsite() {
    if (tool?.id) {
      trackToolActivity(tool.id, 'use')
    }
  }

  async function handleLikeToggle() {
    if (!tool?.id) return

    if (!user) {
      window.location.href = '/login'
      return
    }

    setLikeLoading(true)

    try {
      const response = await fetch(isLiked ? `/api/likes/${tool.id}` : '/api/likes', {
        method: isLiked ? 'DELETE' : 'POST',
        credentials: 'include',
        headers: isLiked
          ? undefined
          : {
              'Content-Type': 'application/json',
            },
        body: isLiked ? undefined : JSON.stringify({ toolId: tool.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not update your collection.')
      }

      setIsLiked(Boolean(data.liked))
    } catch {}
    finally {
      setLikeLoading(false)
    }
  }

  function handleReviewStatsChange(stats) {
    setTool((currentTool) => {
      if (!currentTool) return currentTool

      return {
        ...currentTool,
        avgRating: stats.avgRating,
        rating: stats.avgRating,
        totalReviews: stats.totalReviews,
      }
    })
  }

  if (!tool) {
    return <div className="min-h-screen bg-[#FAFAFA] pt-24 text-center text-slate-900">Loading...</div>
  }

  const logoSource = getLogoSource(tool)
  const showLogo = Boolean(logoSource) && !logoFailed
  const showOriginalBadge = isWhatsThatAIOriginal(tool)
  const visibleTags = Array.isArray(tool.tags) ? tool.tags : []

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <GlassCard className="p-8 md:p-12">
            <div className="mb-8 flex flex-col md:flex-row md:items-start gap-6 lg:gap-8">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-white border border-slate-200 text-xl font-bold text-slate-900 shadow-sm">
                {showLogo ? (
                  <img
                    src={logoSource}
                    alt={`${tool.name} logo`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  tool.icon
                )}
              </div>
              <div className="flex-1">
                {showOriginalBadge ? (
                  <div className="mb-3">
                    <OriginalBlueTick />
                  </div>
                ) : null}
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">{tool.name}</h1>
                  {showOriginalBadge ? (
                    <span className="text-sky-500" aria-label="WhatsThatAI Original verified">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
                        <path
                          fillRule="evenodd"
                          d="M10 1.5a2 2 0 0 1 1.63.84l.66.93 1.13.18a2 2 0 0 1 1.5 1.14l.5 1.03 1.03.5a2 2 0 0 1 1.14 1.5l.18 1.13.93.66a2 2 0 0 1 .84 1.63 2 2 0 0 1-.84 1.63l-.93.66-.18 1.13a2 2 0 0 1-1.14 1.5l-1.03.5-.5 1.03a2 2 0 0 1-1.5 1.14l-1.13.18-.66.93A2 2 0 0 1 10 18.5a2 2 0 0 1-1.63-.84l-.66-.93-1.13-.18a2 2 0 0 1-1.5-1.14l-.5-1.03-1.03-.5a2 2 0 0 1-1.14-1.5l-.18-1.13-.93-.66A2 2 0 0 1 .5 10a2 2 0 0 1 .84-1.63l.93-.66.18-1.13a2 2 0 0 1 1.14-1.5l1.03-.5.5-1.03a2 2 0 0 1 1.5-1.14l1.13-.18.66-.93A2 2 0 0 1 10 1.5Zm3.03 6.22a.75.75 0 0 0-1.06-1.06L8.75 9.88 7.53 8.66a.75.75 0 0 0-1.06 1.06l1.75 1.75a.75.75 0 0 0 1.06 0l3.75-3.75Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-semibold text-slate-600">
                    {tool.category}
                  </span>
                  {visibleTags.map((tag) => (
                    <span
                      key={`${tool.id}-${tag}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-medium text-slate-500"
                    >
                      {tag}
                    </span>
                  ))}
                  <StarRating rating={tool.avgRating} totalReviews={tool.totalReviews} size="lg" />
                </div>
              </div>
            </div>

            <p className="mb-10 text-[17px] leading-relaxed text-slate-600 font-medium max-w-3xl">{tool.description}</p>

            <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-5 transition-colors hover:bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <h3 className="mb-1 font-semibold text-[13px] uppercase tracking-[0.1em] text-slate-500">Pricing</h3>
                <p className="text-[17px] font-bold text-slate-900">{tool.pricing}</p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-5 transition-colors hover:bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <h3 className="mb-1 font-semibold text-[13px] uppercase tracking-[0.1em] text-slate-500">Average Rating</h3>
                <p className="text-[17px] font-bold text-slate-900">
                  {tool.avgRating ? `${parseFloat(tool.avgRating).toFixed(1)} / 5.0` : 'No reviews'}
                </p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-5 transition-colors hover:bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <h3 className="mb-1 font-semibold text-[13px] uppercase tracking-[0.1em] text-slate-500">Total Reviews</h3>
                <p className="text-[17px] font-bold text-slate-900">{tool.totalReviews || 0}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row max-w-xl">
              <a href={tool.websiteUrl || '#'} target="_blank" rel="noreferrer" className="flex-1" onClick={handleVisitWebsite}>
                <Button variant="primary" className="w-full h-[52px]">
                  Visit Website
                </Button>
              </a>
              <div className="flex-1">
                <Button variant="secondary" className="w-full h-[52px]" onClick={handleLikeToggle}>
                  {likeLoading
                    ? 'Saving...'
                    : isLiked
                      ? 'Saved in Collection'
                      : user
                        ? 'Add to Collection'
                        : 'Log In to Like'}
                </Button>
              </div>
            </div>

            {isLiked ? (
              <div className="mt-4 max-w-xl text-center sm:text-right pr-2">
                <Link href="/liked-tools" className="text-[13px] font-medium text-slate-500 transition hover:text-slate-900 hover:underline">
                  Open My Collection &rarr;
                </Link>
              </div>
            ) : null}
          </GlassCard>
        </motion.div>

        <div className="mt-16">
          <ReviewSection toolId={tool.id} onStatsChange={handleReviewStatsChange} />
        </div>
      </div>
    </div>
  )
}
