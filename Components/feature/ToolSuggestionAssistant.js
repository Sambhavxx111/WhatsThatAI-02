'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

const CATEGORY_OPTIONS = [
  { label: 'Any category', value: 'all' },
  { label: 'Writing', value: 'writing' },
  { label: 'Coding', value: 'coding' },
  { label: 'Video', value: 'video' },
  { label: 'Image', value: 'image' },
  { label: 'Audio', value: 'audio' },
  { label: 'Automation', value: 'automation' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Research', value: 'research' },
  { label: 'Productivity', value: 'productivity' },
  { label: 'Career', value: 'career' },
]

const PRICING_OPTIONS = [
  { label: 'Any pricing', value: 'all' },
  { label: 'Free', value: 'free' },
  { label: 'Freemium', value: 'freemium' },
  { label: 'Paid', value: 'paid' },
]

function SuggestionToolCard({ tool, user, onAdded }) {
  const [isSaving, setIsSaving] = useState(false)
  const reasonText = Array.isArray(tool.recommendationReasons)
    ? tool.recommendationReasons.join(' | ')
    : ''

  async function handleAddToCollection() {
    if (!user) {
      window.location.href = '/login'
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toolId: tool.id }),
      })

      if (!response.ok) {
        throw new Error('Could not save tool.')
      }

      onAdded?.(tool.id)
    } catch {
      // Intentionally quiet here to keep the helper lightweight.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/tools/${tool.slug}`} className="text-base font-semibold text-slate-900 transition hover:text-sky-600">
            {tool.name}
          </Link>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {tool.category} | {tool.pricing}
          </p>
        </div>
        {String(tool.source || '').toLowerCase() === 'whatsthatai-original' ? (
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700">
            Original
          </span>
        ) : null}
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
        {tool.description}
      </p>

      {reasonText ? (
        <p className="mt-3 text-xs font-medium leading-5 text-sky-700">
          {reasonText}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/tools/${tool.slug}`}
          className="inline-flex items-center rounded-[14px] bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          View tool
        </Link>
        <button
          type="button"
          onClick={handleAddToCollection}
          disabled={isSaving}
          className="inline-flex items-center rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : user ? 'Add to Collection' : 'Log in to Save'}
        </button>
      </div>
    </div>
  )
}

export default function ToolSuggestionAssistant({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(user || null)
  const [goal, setGoal] = useState('')
  const [category, setCategory] = useState('all')
  const [pricing, setPricing] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState('')
  const [recommendations, setRecommendations] = useState([])
  const [savedToolIds, setSavedToolIds] = useState([])

  const placeholder = useMemo(
    () =>
      'Example: I am building a faceless content brand and need tools for scripts, video generation, and thumbnails.',
    []
  )

  useEffect(() => {
    let isCancelled = false

    async function loadCurrentUser() {
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
          credentials: 'include',
        })

        if (!response.ok) {
          if (!isCancelled) {
            setCurrentUser(null)
          }
          return
        }

        const data = await response.json()

        if (!isCancelled) {
          setCurrentUser(data.user || null)
        }
      } catch {
        if (!isCancelled) {
          setCurrentUser(null)
        }
      }
    }

    void loadCurrentUser()

    return () => {
      isCancelled = true
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSummary('')
    setRecommendations([])

    if (goal.trim().length < 6) {
      setError('Share a little more about the project or task so we can suggest better tools.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/tools/recommend', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal,
          category,
          pricing,
          limit: 4,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not get suggestions right now.')
      }

      setRecommendations(Array.isArray(data.tools) ? data.tools : [])
      setSummary(String(data.summary || ''))
    } catch (submitError) {
      setError(submitError.message || 'Could not get suggestions right now.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleAddedToCollection(toolId) {
    setSavedToolIds((currentIds) =>
      currentIds.includes(toolId) ? currentIds : [...currentIds, toolId]
    )
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-4 z-40 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-800 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl transition hover:border-sky-200 hover:text-sky-700 sm:left-6"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
          AI
        </span>
        Need suggestions?
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            className="fixed inset-x-4 bottom-6 z-50 mx-auto w-auto max-w-2xl rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.16)] sm:inset-x-auto sm:left-6 sm:w-[40rem]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">
                  Project Guide
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Tell us what you&apos;re building.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  We&apos;ll suggest the strongest fits from the current marketplace and help you save them fast.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close suggestions panel"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path
                    fillRule="evenodd"
                    d="M4.47 4.47a.75.75 0 0 1 1.06 0L10 8.94l4.47-4.47a.75.75 0 1 1 1.06 1.06L11.06 10l4.47 4.47a.75.75 0 0 1-1.06 1.06L10 11.06l-4.47 4.47a.75.75 0 0 1-1.06-1.06L8.94 10 4.47 5.53a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  What kind of task or project are you working on?
                </label>
                <textarea
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  rows={4}
                  placeholder={placeholder}
                  className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-300 focus:bg-white"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Category focus
                  </label>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Pricing preference
                  </label>
                  <select
                    value={pricing}
                    onChange={(event) => setPricing(event.target.value)}
                    className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white"
                  >
                    {PRICING_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center rounded-[16px] bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {isLoading ? 'Finding tools...' : 'Get Suggestions'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGoal('')
                    setCategory('all')
                    setPricing('all')
                    setRecommendations([])
                    setSummary('')
                    setError('')
                    setSavedToolIds([])
                  }}
                  className="inline-flex items-center rounded-[16px] border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Reset
                </button>
              </div>
            </form>

            {error ? (
              <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            {summary ? (
              <div className="mt-5 rounded-[18px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800">
                {summary}
              </div>
            ) : null}

            {recommendations.length > 0 ? (
              <div className="mt-5 space-y-3">
                {recommendations.map((tool) => (
                  <div key={tool.id} className="relative">
                    <SuggestionToolCard
                      tool={tool}
                      user={currentUser}
                      onAdded={handleAddedToCollection}
                    />
                    {savedToolIds.includes(tool.id) ? (
                      <p className="mt-2 text-xs font-medium text-emerald-600">
                        Added to My Collection
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
