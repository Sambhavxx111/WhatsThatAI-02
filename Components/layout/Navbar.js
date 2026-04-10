'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import UserAvatar from '@/components/ui/UserAvatar'

const navItems = [
  { href: '/tools', label: 'Tools' },
  { href: '/categories', label: 'Categories' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)

  async function loadUser() {
    try {
      const response = await fetch('/api/auth/me', {
        cache: 'no-store',
        credentials: 'include',
      })
      const data = await response.json()
      setUser(data.user || null)
    } catch {
      setUser(null)
    }
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleAuthChange = () => {
      loadUser()
    }

    loadUser()
    window.addEventListener('focus', handleAuthChange)
    window.addEventListener('auth-changed', handleAuthChange)

    return () => {
      window.removeEventListener('focus', handleAuthChange)
      window.removeEventListener('auth-changed', handleAuthChange)
    }
  }, [])

  async function handleLogout() {
    setLoggingOut(true)

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
      window.dispatchEvent(new Event('auth-changed'))
      window.location.href = '/'
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6"
    >
      <div className={`mx-auto flex max-w-7xl items-center justify-between rounded-[24px] border px-4 py-3 transition-all duration-500 sm:px-6 ${scrolled ? 'border-slate-200 bg-white/90 shadow-sm backdrop-blur-2xl' : 'border-transparent bg-transparent'}`}>
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-slate-900 text-sm font-bold text-white shadow-sm transition hover:scale-105">
            AI
          </div>
          <div className="hidden sm:block">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 font-semibold">WhatsThatAI</p>
            <p className="text-sm font-bold text-slate-900">Premium tool discovery</p>
          </div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-[14px] font-semibold text-slate-500 transition-colors hover:text-slate-900">
              {item.label}
            </Link>
          ))}
          {user ? (
            <Link href="/liked-tools" className="text-[14px] font-semibold text-slate-500 transition-colors hover:text-slate-900">
              My Collection
            </Link>
          ) : null}
          <Link href="/submit-tool" className="text-[14px] font-semibold text-slate-500 transition-colors hover:text-slate-900">
            Submit Tool
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/profile" className="flex items-center gap-3 rounded-full px-1 py-1 transition hover:bg-slate-100">
                <UserAvatar
                  src={user.profileImageUrl || ''}
                  alt={`${user.name || user.email} profile picture`}
                  size="sm"
                />
                <span className="hidden text-[14px] font-medium text-slate-500 lg:block">
                  Hi, {user.name || user.email}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-full bg-slate-100 px-4 py-2 text-[14px] font-bold text-slate-600 transition hover:bg-slate-200 disabled:opacity-60"
              >
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-[14px] font-bold text-slate-600 transition-colors hover:text-black md:block"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-[16px] bg-slate-900 px-5 py-2.5 text-[14px] font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  )
}
