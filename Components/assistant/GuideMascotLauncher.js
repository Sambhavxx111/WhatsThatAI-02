'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

const DISMISS_KEY = 'whatsthatai-guide-mascot-dismissed-at'
const DISMISS_WINDOW_MS = 12 * 60 * 60 * 1000
const CHATBOT_STATE_KEY = 'whatsthatai-guide-chat-state'
const BUBBLE_DISMISS_KEY = 'whatsthatai-guide-bubble-dismissed-at'

const quickPrompts = [
  'I need AI tools for resume building',
  'Find tools for video editing and reels',
  'Suggest tools for coding and debugging',
]

const hiddenPathPrefixes = ['/portal', '/admin', '/submit-tool']

function MascotCharacter() {
  return (
    <div className="relative h-20 w-20 shrink-0">
      <div className="absolute bottom-0 left-1/2 h-11 w-12 -translate-x-1/2 rounded-[18px] bg-gradient-to-b from-slate-900 to-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.22)]" />
      <div className="absolute bottom-9 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full bg-gradient-to-b from-sky-400 to-blue-500 shadow-[0_10px_24px_rgba(14,116,144,0.3)]" />
      <div className="absolute bottom-16 left-6 h-2.5 w-2.5 rounded-full bg-white/95" />
      <div className="absolute bottom-16 right-6 h-2.5 w-2.5 rounded-full bg-white/95" />
      <div className="absolute bottom-[42px] right-1 h-6 w-6 rotate-[-24deg] rounded-full border-4 border-transparent border-t-sky-300" />
      <div className="absolute bottom-3 left-1 h-2.5 w-8 rotate-[-16deg] rounded-full bg-slate-800" />
      <div className="absolute bottom-5 right-[-1px] h-2.5 w-8 rotate-[22deg] rounded-full bg-slate-800" />
    </div>
  )
}

export default function GuideMascotLauncher() {
  const router = useRouter()
  const pathname = usePathname()
  const scrollContainerRef = useRef(null)
  const footerRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showBubble, setShowBubble] = useState(true)
  const [isNearFooter, setIsNearFooter] = useState(false)
  const [goal, setGoal] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recommendedTools, setRecommendedTools] = useState([])
  const [message, setMessage] = useState('')
  const [savedToolIds, setSavedToolIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  const trimmedGoal = useMemo(() => goal.trim(), [goal])
  const shouldHideOnRoute = useMemo(
    () =>
      hiddenPathPrefixes.some((prefix) => pathname?.startsWith(prefix)) ||
      pathname === '/login' ||
      pathname === '/signup',
    [pathname]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const dismissedAtValue = window.localStorage.getItem(DISMISS_KEY)
    const dismissedAt = dismissedAtValue ? Number(dismissedAtValue) : 0
    const isDismissed =
      Number.isFinite(dismissedAt) &&
      dismissedAt > 0 &&
      Date.now() - dismissedAt < DISMISS_WINDOW_MS

    if (!isDismissed) {
      setIsVisible(true)
    }

    const bubbleDismissedAtValue = window.localStorage.getItem(BUBBLE_DISMISS_KEY)
    const bubbleDismissedAt = bubbleDismissedAtValue ? Number(bubbleDismissedAtValue) : 0
    const isBubbleDismissed =
      Number.isFinite(bubbleDismissedAt) &&
      bubbleDismissedAt > 0 &&
      Date.now() - bubbleDismissedAt < DISMISS_WINDOW_MS

    setShowBubble(!isBubbleDismissed)

    const savedState = window.localStorage.getItem(CHATBOT_STATE_KEY)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setIsOpen(Boolean(parsed.isOpen))
        setGoal(parsed.goal || '')
        setRecommendedTools(Array.isArray(parsed.recommendedTools) ? parsed.recommendedTools : [])
        setMessage(parsed.message || '')
        setSavedToolIds(Array.isArray(parsed.savedToolIds) ? parsed.savedToolIds : [])
        setSearchQuery(parsed.searchQuery || '')
      } catch {
        window.localStorage.removeItem(CHATBOT_STATE_KEY)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem(
      CHATBOT_STATE_KEY,
      JSON.stringify({
        isOpen,
        goal,
        recommendedTools,
        message,
        savedToolIds,
        searchQuery,
      })
    )
  }, [goal, isOpen, message, recommendedTools, savedToolIds, searchQuery])

  useEffect(() => {
    let isCancelled = false

    async function loadAuthState() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        })
        const data = await response.json()

        if (!isCancelled) {
          setUser(data?.user || null)
        }
      } catch {
        if (!isCancelled) {
          setUser(null)
        }
      } finally {
        if (!isCancelled) {
          setIsAuthLoading(false)
        }
      }
    }

    void loadAuthState()

    return () => {
      isCancelled = true
    }
  }, [pathname])

  useEffect(() => {
    const handleAuthRefresh = () => {
      void (async () => {
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
            cache: 'no-store',
          })
          const data = await response.json()
          setUser(data?.user || null)
        } catch {
          setUser(null)
        } finally {
          setIsAuthLoading(false)
        }
      })()
    }

    window.addEventListener('focus', handleAuthRefresh)
    window.addEventListener('auth-changed', handleAuthRefresh)
    window.addEventListener('auth-state-changed', handleAuthRefresh)

    return () => {
      window.removeEventListener('focus', handleAuthRefresh)
      window.removeEventListener('auth-changed', handleAuthRefresh)
      window.removeEventListener('auth-state-changed', handleAuthRefresh)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const footer = document.querySelector('footer')
    if (!footer) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearFooter(entry.isIntersecting)
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    )

    observer.observe(footer)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const element = scrollContainerRef.current

    if (!element || !isOpen) {
      return
    }

    function handleWheel(event) {
      const canScroll = element.scrollHeight > element.clientHeight

      if (!canScroll) {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      const nextScrollTop = element.scrollTop + event.deltaY
      const maxScrollTop = element.scrollHeight - element.clientHeight
      const clampedScrollTop = Math.max(0, Math.min(maxScrollTop, nextScrollTop))

      event.preventDefault()
      event.stopPropagation()
      element.scrollTop = clampedScrollTop
    }

    function handleTouchMove(event) {
      event.stopPropagation()
    }

    element.addEventListener('wheel', handleWheel, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      element.removeEventListener('wheel', handleWheel)
      element.removeEventListener('touchmove', handleTouchMove)
    }
  }, [isOpen])

  function dismissBubble() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(BUBBLE_DISMISS_KEY, String(Date.now()))
    }

    setShowBubble(false)
  }

  async function addToCollection(toolId) {
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ toolId }),
      })

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error('Could not save tool')
      }

      setSavedToolIds((current) => (current.includes(toolId) ? current : [...current, toolId]))
    } catch {
      setMessage('Could not save this tool right now.')
    }
  }

  async function goToSuggestedTools(nextGoal = trimmedGoal) {
    if (!user) {
      setMessage('Please sign in or sign up to use WhatsThatAI Guide.')
      return
    }

    const query = String(nextGoal || '').trim()

    if (!query) {
      return
    }

    setIsLoading(true)
    setMessage('')
    setRecommendedTools([])

    try {
      const response = await fetch('/api/assistant/recommend', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal: query,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not fetch tool suggestions.')
      }

      const rankedTools = Array.isArray(data?.tools) ? data.tools.slice(0, 4) : []

      if (!rankedTools.length) {
        setSearchQuery(data?.searchQuery || query)
        setMessage(
          data?.assistantMessage ||
            'I could not find a confident match yet. Try describing the task a bit more clearly.'
        )
        return
      }

      setRecommendedTools(rankedTools)
      setSearchQuery(data?.searchQuery || query)
      setMessage(
        data?.assistantMessage || 'Here are a few tools that look like a good fit for your goal.'
      )
    } catch (error) {
      setMessage('I could not fetch recommendations right now.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isVisible || shouldHideOnRoute || isNearFooter) {
    return null
  }

  const authRedirect = encodeURIComponent(pathname || '/')

  function openToolDetails(slug) {
    router.push(`/tools/${slug}`)
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-4 z-[70] hidden sm:block lg:right-8">
      <div className="pointer-events-auto flex items-end gap-3">
        <AnimatePresence>
          {!isOpen && showBubble ? (
            <motion.div
              initial={{ opacity: 0, x: 12, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 8, y: 8 }}
              className="relative max-w-[280px] rounded-[24px] border border-slate-200 bg-white/95 px-4 py-3 pr-11 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl"
            >
              <button
                type="button"
                onClick={dismissBubble}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Dismiss guide"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path
                    fillRule="evenodd"
                    d="M4.47 4.47a.75.75 0 0 1 1.06 0L10 8.94l4.47-4.47a.75.75 0 1 1 1.06 1.06L11.06 10l4.47 4.47a.75.75 0 0 1-1.06 1.06L10 11.06l-4.47 4.47a.75.75 0 0 1-1.06-1.06L8.94 10 4.47 5.53a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600">
                Guide Mascot
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                {user
                  ? 'Tell me your goal and I&apos;ll help you find the right tools.'
                  : 'Need help choosing tools? Sign in to use the WhatsThatAI Guide.'}
              </p>
              <div className="absolute -bottom-3 right-12 h-6 w-6 rotate-45 rounded-[8px] border-b border-r border-slate-200 bg-white/95" />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="relative">
          <AnimatePresence>
            {isOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="absolute bottom-[5.5rem] right-0 flex h-[min(78vh,760px)] w-[380px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-2xl"
                onWheelCapture={(event) => event.stopPropagation()}
                onTouchMoveCapture={(event) => event.stopPropagation()}
              >
                <div
                  ref={scrollContainerRef}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-5 touch-pan-y"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600">
                        WhatsThatAI Guide
                      </p>
                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                        What are you trying to do?
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Close guide panel"
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

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Share a project, workflow, or task. I&apos;ll use our guide model to understand the goal and suggest a few strong fits from the marketplace.
                  </p>

                  {!isAuthLoading && !user ? (
                    <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-medium leading-6 text-slate-700">
                        Sign in or sign up to use chatbot recommendations, open guided tool matches, and save tools directly to your collection.
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => router.push(`/login?redirect=${authRedirect}`)}
                          className="inline-flex h-[42px] items-center justify-center rounded-[14px] bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Sign in
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/signup?redirect=${authRedirect}`)}
                          className="inline-flex h-[42px] items-center justify-center rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          Sign up
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={goal}
                        onChange={(event) => setGoal(event.target.value)}
                        placeholder="Example: I need tools for ATS resume optimization and job matching."
                        className="mt-4 h-28 w-full resize-none rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      />

                      <div className="mt-4 flex flex-wrap gap-2">
                        {quickPrompts.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => setGoal(prompt)}
                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>

                      <div className="mt-5 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => void goToSuggestedTools()}
                          className="inline-flex h-[46px] items-center justify-center rounded-[16px] bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={!trimmedGoal || isLoading}
                        >
                          {isLoading ? 'Finding tools...' : 'Show matching tools'}
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push('/tools?source=whatsthatai-original')}
                          className="inline-flex h-[46px] items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          Browse Originals
                        </button>
                      </div>
                    </>
                  )}

                  {message ? (
                    <p className="mt-4 text-sm font-medium leading-6 text-slate-500">
                      {message}
                    </p>
                  ) : null}

                  {recommendedTools.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {recommendedTools.map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => openToolDetails(tool.slug)}
                          className="block w-full rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold text-slate-900">
                                  {tool.name}
                                </h3>
                                <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  {tool.category}
                                </span>
                              </div>
                              <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-500">
                                {tool.description}
                              </p>
                              {tool.reason ? (
                                <p className="mt-2 text-[11px] font-medium leading-5 text-sky-700">
                                  {tool.reason}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-4 flex items-center gap-2">
                            <Link
                              href={`/tools/${tool.slug}`}
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex h-9 items-center justify-center rounded-[12px] bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
                            >
                              Open tool
                            </Link>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                void addToCollection(tool.id)
                              }}
                              className="inline-flex h-9 items-center justify-center rounded-[12px] border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                              {savedToolIds.includes(tool.id) ? 'Saved' : 'Add to Collection'}
                            </button>
                          </div>
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => router.push('/tools')}
                        className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        See all matching tools
                      </button>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="flex items-end gap-3">
            <MascotCharacter />
            <motion.button
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => setIsOpen((current) => !current)}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-sky-200 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 text-white shadow-[0_16px_40px_rgba(37,99,235,0.32)]"
              aria-label="Open WhatsThatAI guide"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7">
                <path d="M10 2a7 7 0 0 0-6.98 7.52A7 7 0 0 0 6 15.2V18a1 1 0 0 0 1.58.81l2.69-1.98c.24.01.48.02.73.02A7 7 0 0 0 10 2Zm-2.25 6.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm2.25 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm2.25 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
