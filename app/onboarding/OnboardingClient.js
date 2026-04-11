'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ENABLE_INTEREST_ONBOARDING } from '@/lib/feature-flags'
import { useEffect, useMemo, useState } from 'react'

function CollectionCard({ collection }) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="block rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600">
            {collection.type === 'starter' ? 'Starter Collection' : 'Trending Collection'}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{collection.title}</h3>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {collection.itemCount} tools
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">{collection.description || collection.summary || 'Curated for this use case.'}</p>
      {collection.items?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {collection.items.slice(0, 4).map((item) => (
            <span
              key={item.id}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
            >
              {item.tool.name}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  )
}

function ToolSuggestionCard({ tool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{tool.name}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{tool.category}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{tool.pricing}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">{tool.description}</p>
    </Link>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/tools'
  const [availableCategories, setAvailableCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [suggestedTools, setSuggestedTools] = useState([])
  const [starterCollections, setStarterCollections] = useState([])
  const [trendingCollections, setTrendingCollections] = useState([])
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const [showInterestPicker, setShowInterestPicker] = useState(true)

  useEffect(() => {
    if (!ENABLE_INTEREST_ONBOARDING) {
      router.replace(nextPath)
      return
    }
    let mounted = true

    async function loadPreferences() {
      try {
        const [meResponse, onboardingResponse] = await Promise.all([
          fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/onboarding/preferences', { credentials: 'include', cache: 'no-store' }),
        ])

        const meData = await meResponse.json()
        if (!meData.user) {
          router.replace(`/login?next=${encodeURIComponent('/onboarding?next=' + nextPath)}`)
          return
        }

        const onboardingData = await onboardingResponse.json()
        if (!mounted) return

        setAvailableCategories(Array.isArray(onboardingData.categories) ? onboardingData.categories : [])
        setSelectedCategories(
          Array.isArray(onboardingData.selectedCategories) ? onboardingData.selectedCategories : []
        )
        setSuggestedTools(Array.isArray(onboardingData.suggestedTools) ? onboardingData.suggestedTools : [])
        setStarterCollections(Array.isArray(onboardingData.starterCollections) ? onboardingData.starterCollections : [])
        setTrendingCollections(Array.isArray(onboardingData.trendingCollections) ? onboardingData.trendingCollections : [])
        setOnboardingCompleted(Boolean(onboardingData.onboardingCompleted))
        setShowInterestPicker(!Boolean(onboardingData.onboardingCompleted))
      } catch {
        if (!mounted) return
        setError('Could not load onboarding preferences right now.')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadPreferences()

    return () => {
      mounted = false
    }
  }, [nextPath, router])

  const canContinue = useMemo(() => selectedCategories.length > 0 && selectedCategories.length <= 5, [selectedCategories])

  function toggleCategory(categoryId) {
    setError('')
    setMessage('')
    setSelectedCategories((current) => {
      if (current.includes(categoryId)) {
        return current.filter((item) => item !== categoryId)
      }

      if (current.length >= 5) {
        return current
      }

      return [...current, categoryId]
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canContinue) {
      setError('Choose between 1 and 5 categories.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/onboarding/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          categories: selectedCategories,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Could not save your preferences.')
      }

      setSuggestedTools(Array.isArray(data.suggestedTools) ? data.suggestedTools : [])
      setStarterCollections(Array.isArray(data.starterCollections) ? data.starterCollections : [])
      setTrendingCollections(Array.isArray(data.trendingCollections) ? data.trendingCollections : [])
      setOnboardingCompleted(true)
      setShowInterestPicker(false)
      setMessage('Great choice. We saved your preferences and prepared some recommendations.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSkip() {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await fetch('/api/onboarding/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          skip: true,
        }),
      })
      router.push(nextPath)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 pb-24 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600">Personalize your discovery</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {showInterestPicker ? 'Pick the AI categories you care about.' : 'Your tailored starting point is ready.'}
          </h1>
          <p className="mt-5 text-[17px] leading-8 text-slate-500">
            {showInterestPicker
              ? "Choose up to 5 interests and we'll shape your first set of tool recommendations and ready-made collections around them."
              : 'We saved your interests and turned them into curated stacks you can open right away.'}
          </p>
        </div>

        {showInterestPicker ? (
          <div className="mx-auto mt-10 max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            {loading ? (
              <p className="text-sm font-medium text-slate-500">Loading your onboarding flow...</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex flex-wrap gap-3">
                  {availableCategories.map((category) => {
                    const active = selectedCategories.includes(category.id)
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                        }`}
                      >
                        {category.label}
                      </button>
                    )
                  })}
                </div>

                <p className="mt-4 text-sm font-medium text-slate-400">
                  {selectedCategories.length}/5 selected
                </p>

                {message ? (
                  <p className="mt-5 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {message}
                  </p>
                ) : null}

                {error ? (
                  <p className="mt-5 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {error}
                  </p>
                ) : null}

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-[48px] items-center justify-center rounded-[18px] bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save preferences'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={saving}
                    className="inline-flex h-[48px] items-center justify-center rounded-[18px] border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Skip for now
                  </button>
                  <Link
                    href={nextPath}
                    className="inline-flex h-[48px] items-center justify-center rounded-[18px] border border-transparent px-3 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
                  >
                    Continue later
                  </Link>
                </div>
              </form>
            )}
          </div>
        ) : onboardingCompleted ? (
          <div className="mx-auto mt-10 max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-emerald-700">
                  Your interests are saved. Open a stack below or keep exploring the marketplace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowInterestPicker(true)
                  setMessage('')
                  setError('')
                }}
                className="inline-flex h-[42px] items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Edit interests
              </button>
            </div>
          </div>
        ) : null}

        {(suggestedTools.length || starterCollections.length || trendingCollections.length) ? (
          <div className="mt-12 space-y-10">
            {starterCollections.length ? (
              <section>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Starter Collections</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">Ready-made stacks to begin with</h2>
                  </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {starterCollections.map((collection) => (
                    <CollectionCard key={collection.id} collection={collection} />
                  ))}
                </div>
              </section>
            ) : null}

            {trendingCollections.length ? (
              <section>
                <div className="mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Trending Collections</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">What's popular in your chosen areas</h2>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {trendingCollections.map((collection) => (
                    <CollectionCard key={collection.id} collection={collection} />
                  ))}
                </div>
              </section>
            ) : null}

            {suggestedTools.length ? (
              <section>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Suggested Tools</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">Strong fits for your interests</h2>
                  </div>
                  <Link
                    href={nextPath}
                    className="inline-flex h-[42px] items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    Continue to marketplace
                  </Link>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {suggestedTools.map((tool) => (
                    <ToolSuggestionCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

