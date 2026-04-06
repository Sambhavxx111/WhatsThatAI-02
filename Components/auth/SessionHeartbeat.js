'use client'

import { useEffect, useRef } from 'react'

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000
const ACTIVE_WINDOW_MS = 10 * 60 * 1000

export default function SessionHeartbeat() {
  const lastActivityAtRef = useRef(Date.now())
  const refreshInFlightRef = useRef(false)

  useEffect(() => {
    function markActivity() {
      lastActivityAtRef.current = Date.now()
    }

    async function refreshSession() {
      if (refreshInFlightRef.current) {
        return
      }

      if (document.visibilityState !== 'visible') {
        return
      }

      if (Date.now() - lastActivityAtRef.current > ACTIVE_WINDOW_MS) {
        return
      }

      refreshInFlightRef.current = true

      try {
        await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        })
      } catch {
        // Ignore silent refresh failures. Protected routes will still enforce auth.
      } finally {
        refreshInFlightRef.current = false
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        markActivity()
        void refreshSession()
      }
    }

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true })
    })

    window.addEventListener('focus', handleVisibilityChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const intervalId = window.setInterval(() => {
      void refreshSession()
    }, HEARTBEAT_INTERVAL_MS)

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity)
      })

      window.removeEventListener('focus', handleVisibilityChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.clearInterval(intervalId)
    }
  }, [])

  return null
}
