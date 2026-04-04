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
                <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">{tool.name}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-semibold text-slate-600">
                    {tool.category}
                  </span>
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
