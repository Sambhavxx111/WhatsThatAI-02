'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import ScrollController from './InteractiveGenie/ScrollController'
import ChatbotWidget from './InteractiveGenie/ChatbotWidget'

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


export default function GuideMascotLauncher() {
  const router = useRouter()
  const pathname = usePathname()
  const scrollContainerRef = useRef(null)
  const footerRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showBubble, setShowBubble] = useState(true)
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

  if (!isVisible || shouldHideOnRoute) {
    return null
  }

  const authRedirect = encodeURIComponent(pathname || '/')

  function openToolDetails(slug) {
    router.push(`/tools/${slug}`)
  }

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[70] lg:right-8 lg:bottom-28">
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
          <ChatbotWidget 
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            scrollContainerRef={scrollContainerRef}
            user={user}
            isAuthLoading={isAuthLoading}
            goal={goal}
            setGoal={setGoal}
            quickPrompts={quickPrompts}
            goToSuggestedTools={goToSuggestedTools}
            isLoading={isLoading}
            message={message}
            recommendedTools={recommendedTools}
            openToolDetails={openToolDetails}
            savedToolIds={savedToolIds}
            addToCollection={addToCollection}
            router={router}
            authRedirect={authRedirect}
          />

          <ScrollController
            isChatOpen={isOpen}
            chatbotToggleElement={
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
            }
          />
        </div>
      </div>
    </div>
  )
}
