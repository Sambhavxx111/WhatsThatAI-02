'use client'

import { useEffect, useMemo, useState } from 'react'
import StarRating from '@/components/ui/StarRating'

function formatDate(value) {
  if (!value) return ''

  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return ''
  }
}

export default function ReviewSection({ toolId, onStatsChange }) {
  const [user, setUser] = useState(null)
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function loadReviews() {
    const response = await fetch(`/api/reviews/${toolId}`)
    const data = await response.json()
    const nextReviews = Array.isArray(data) ? data : []
    setReviews(nextReviews)

    const ownReview = nextReviews.find((item) => item.isOwner)
    if (ownReview) {
      setRating(ownReview.rating)
      setReview(ownReview.review || '')
    }

    const totalReviews = nextReviews.length
    const avgRating = totalReviews
      ? Number((nextReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / totalReviews).toFixed(1))
      : null

    onStatsChange?.({ avgRating, totalReviews })
  }

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      try {
        const [meResponse] = await Promise.all([
          fetch('/api/auth/me'),
          loadReviews(),
        ])
        const meData = await meResponse.json()

        if (mounted) {
          setUser(meData.user || null)
        }
      } catch {
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      mounted = false
    }
  }, [toolId])

  const reviewCountLabel = useMemo(() => {
    if (reviews.length === 1) return '1 review'
    return `${reviews.length} reviews`
  }, [reviews.length])

  async function handleSubmit(event) {
    event.preventDefault()

    if (!rating) {
      setMessage('Please choose a star rating first.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolId,
          rating,
          review,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not save review.')
      }

      setMessage('Your review has been saved.')
      await loadReviews()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm text-slate-500">Loading reviews...</div>
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">Community Reviews</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">What users think</h2>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
            {reviewCountLabel}
          </span>
        </div>

        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900">{item.user?.name || 'Anonymous user'}</p>
                    <p className="text-xs text-slate-500 font-medium">{formatDate(item.createdAt)}</p>
                  </div>
                  <StarRating rating={item.rating} totalReviews={0} />
                </div>
                <p className="text-sm leading-6 text-slate-700 font-medium">{item.review || 'No written review provided.'}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 font-medium">
              No reviews yet. Be the first to rate this tool.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">Your Rating</p>
        <h2 className="mt-3 text-2xl font-bold text-slate-900">Share your experience</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500 font-medium">
          Rate the tool from 1 to 5 stars and leave a short review. If you review again, we will update your existing entry.
        </p>

        {user ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">Your rating</label>
              <StarRating interactive value={rating} onChange={setRating} size="lg" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-900">Review</label>
              <textarea
                value={review}
                onChange={(event) => setReview(event.target.value)}
                rows={6}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 font-medium outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                placeholder="What stood out for you?"
              />
            </div>

            {message ? <p className="text-sm font-medium text-slate-600">{message}</p> : null}

            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-medium text-slate-500">
            Please <a href="/login" className="font-bold text-blue-600 hover:text-blue-500">log in</a> or <a href="/signup" className="font-bold text-blue-600 hover:text-blue-500">create an account</a> to rate and review this tool.
          </div>
        )}
      </div>
    </div>
  )
}
